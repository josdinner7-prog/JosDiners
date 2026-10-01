import express from 'express'
import crypto from 'crypto'
import { pool } from '../config/db.js'
import { createNotificationRecord } from './notifications.routes.js'

const router = express.Router()

/**
 * Helper to fetch the latest configured webhook secret from DB with fallback to .env
 */
async function getActiveWebhookSecret() {
  try {
    const [rows] = await pool.query('SELECT httpsms_webhook_secret FROM sms_settings ORDER BY setting_id DESC LIMIT 1')
    if (rows && rows.length > 0 && rows[0].httpsms_webhook_secret) {
      const dbSecret = rows[0].httpsms_webhook_secret.trim()
      if (dbSecret && dbSecret !== 'your_webhook_secret_here') {
        return dbSecret
      }
    }
  } catch (err) {
    console.warn('[Webhook] Error reading secret from DB:', err.message)
  }
  return process.env.HTTPSMS_WEBHOOK_SECRET && process.env.HTTPSMS_WEBHOOK_SECRET !== 'your_webhook_secret_here'
    ? process.env.HTTPSMS_WEBHOOK_SECRET.trim()
    : ''
}

/**
 * Verify the JWT Bearer token from HttpSMS.
 * HttpSMS signs webhooks with HS256 (HMAC-SHA256) using the signing key you set.
 */
function verifyHttpSmsJwt(token, secret) {
  if (!token || !secret) return null
  try {
    const parts = token.replace('Bearer ', '').split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts

    // Verify HS256 signature
    const signInput = `${headerB64}.${payloadB64}`
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signInput)
      .digest('base64url')

    if (expectedSig !== signatureB64) {
      console.warn('[Webhook] JWT signature mismatch')
      return null
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    return payload
  } catch (err) {
    console.warn('[Webhook] JWT verification error:', err.message)
    return null
  }
}

/**
 * POST /api/webhooks/httpsms
 * Receives events from HttpSMS:
 *   - message.phone.received   (inbound SMS received on phone)
 *   - message.phone.sent       (outbound SMS dispatched via SIM)
 *   - message.phone.delivered  (outbound SMS delivered to recipient)
 *   - message.send.failed      (outbound SMS failed)
 *   - message.send.expired     (outbound SMS expired)
 */
router.post('/httpsms', async (req, res) => {
  const authHeader = req.headers['authorization'] || ''
  const eventType = req.headers['x-event-type'] || req.body?.event || req.body?.type || 'unknown'
  const activeSecret = await getActiveWebhookSecret()

  // Verify JWT if signing key is configured
  if (activeSecret) {
    const jwtPayload = verifyHttpSmsJwt(authHeader, activeSecret)
    if (!jwtPayload) {
      console.warn(`[Webhook] Rejected: invalid JWT for event "${eventType}"`)
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' })
    }
  }

  const data = req.body
  const messageData = data?.data || data
  const messageId = messageData?.id || 'N/A'
  const status = messageData?.status || 'unknown'
  const contact = messageData?.contact || messageData?.to || messageData?.owner || messageData?.from || 'unknown'
  const content = messageData?.content || ''
  const failureReason = messageData?.failure_reason || null

  console.log(`[Webhook] 📩 Received: ${eventType} | ID: ${messageId} | Status: ${status} | Contact: ${contact}`)

  // 1. Insert into sms_webhook_logs table
  try {
    const rawPayload = JSON.stringify(data)
    await pool.query(`
      INSERT INTO sms_webhook_logs
      (message_id, event_type, phone_number, content, status, failure_reason, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      messageId,
      eventType,
      contact,
      content,
      status,
      failureReason,
      rawPayload
    ])
  } catch (dbErr) {
    console.error('[Webhook] Failed to save log into database:', dbErr.message)
  }

  // 2. Inbound SMS Action: Alert admin & staff via system notification
  if (eventType === 'message.phone.received') {
    try {
      const notifTitle = `Inbound SMS from ${contact}`
      const notifMsg = `"${content.length > 100 ? content.substring(0, 100) + '...' : content}"`
      await createNotificationRecord({
        title: notifTitle,
        message: notifMsg,
        type: 'sms',
        recipient_role: 'admin',
        reservation_code: messageId
      })
      console.log(`[Webhook] 📥 Inbound SMS notification queued for admin from ${contact}`)
    } catch (notifErr) {
      console.warn('[Webhook] Could not queue notification for inbound SMS:', notifErr.message)
    }
  }

  res.json({
    success: true,
    message: 'Webhook received and recorded successfully',
    event: eventType,
    message_id: messageId
  })
})

// ============================================================================
// PAYMONGO WEBHOOK HANDLER
// ============================================================================

/**
 * Ensure payment_webhook_logs table exists
 */
async function ensurePaymentWebhookTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id VARCHAR(100) NULL,
        event_type VARCHAR(100) NOT NULL,
        payment_id VARCHAR(100) NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
        fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NULL,
        payer_name VARCHAR(255) NULL,
        payer_email VARCHAR(255) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'paid',
        raw_payload LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  } catch (err) {
    console.warn('[PayMongo Webhook] Table init warning:', err.message)
  }
}
ensurePaymentWebhookTable()

/**
 * Verify PayMongo HMAC-SHA256 signature
 * Header format: Paymongo-Signature: t=1612345678,te=test_sig,li=live_sig
 */
function verifyPaymongoSignature(signatureHeader, rawBody, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false
  try {
    const parts = signatureHeader.split(',')
    let timestamp = ''
    let testSig = ''
    let liveSig = ''

    for (const part of parts) {
      const [key, val] = part.trim().split('=')
      if (key === 't') timestamp = val
      if (key === 'te') testSig = val
      if (key === 'li') liveSig = val
    }

    if (!timestamp) return false

    // Convert rawBody buffer to string if needed
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    const payloadToSign = `${timestamp}.${bodyStr}`

    const computedSig = crypto
      .createHmac('sha256', webhookSecret.trim())
      .update(payloadToSign)
      .digest('hex')

    if (testSig && testSig === computedSig) return true
    if (liveSig && liveSig === computedSig) return true

    return false
  } catch (err) {
    console.warn('[PayMongo Webhook] Signature verification failed:', err.message)
    return false
  }
}

/**
 * POST /api/webhooks/paymongo
 * Handles PayMongo payment events:
 *   - checkout_session.payment.paid
 *   - payment.paid
 *   - payment.failed
 */
router.post('/paymongo', async (req, res) => {
  const signatureHeader = req.headers['paymongo-signature'] || ''
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || ''

  // 1. Signature Verification (if webhook secret configured)
  if (webhookSecret && webhookSecret !== 'your_paymongo_webhook_secret_here') {
    const isValid = verifyPaymongoSignature(signatureHeader, req.rawBody || req.body, webhookSecret)
    if (!isValid) {
      console.warn('[PayMongo Webhook] ❌ Invalid signature received.')
      return res.status(401).json({
        success: false,
        message: 'Invalid PayMongo webhook signature'
      })
    }
  } else {
    console.info('[PayMongo Webhook] ℹ️ Webhook secret not configured in .env; skipping signature check for development.')
  }

  const payload = req.body || {}
  const event = payload.data || {}
  const eventId = event.id || 'N/A'
  const eventType = event.attributes?.type || 'unknown'
  const eventData = event.attributes?.data || {}

  console.log(`[PayMongo Webhook] 🔔 Received event: ${eventType} (ID: ${eventId})`)

  let paymentId = 'N/A'
  let amount = 0.00
  let currency = 'PHP'
  let fee = 0.00
  let netAmount = 0.00
  let paymentMethod = 'online'
  let payerName = 'Guest'
  let payerEmail = ''
  let status = 'paid'

  if (eventType === 'checkout_session.payment.paid') {
    // Attributes from checkout session
    const sessionAttrs = eventData.attributes || {}
    const payments = sessionAttrs.payments || []
    const firstPayment = payments[0] || {}
    const pAttrs = firstPayment.attributes || {}

    paymentId = firstPayment.id || eventData.id || 'N/A'
    amount = pAttrs.amount ? pAttrs.amount / 100 : (sessionAttrs.line_items?.[0]?.amount ? sessionAttrs.line_items[0].amount / 100 : 0)
    fee = pAttrs.fee ? pAttrs.fee / 100 : 0
    netAmount = pAttrs.net_amount ? pAttrs.net_amount / 100 : amount - fee
    paymentMethod = pAttrs.source?.type || pAttrs.payment_method_type || 'gcash'
    payerEmail = sessionAttrs.billing?.email || pAttrs.billing?.email || ''
    payerName = sessionAttrs.billing?.name || pAttrs.billing?.name || 'Customer'
    status = pAttrs.status || 'paid'
  } else if (eventType === 'payment.paid' || eventType === 'payment.failed') {
    const pAttrs = eventData.attributes || {}
    paymentId = eventData.id || 'N/A'
    amount = pAttrs.amount ? pAttrs.amount / 100 : 0
    fee = pAttrs.fee ? pAttrs.fee / 100 : 0
    netAmount = pAttrs.net_amount ? pAttrs.net_amount / 100 : amount - fee
    paymentMethod = pAttrs.source?.type || pAttrs.payment_method_type || 'card'
    payerEmail = pAttrs.billing?.email || ''
    payerName = pAttrs.billing?.name || 'Customer'
    status = pAttrs.status || (eventType === 'payment.paid' ? 'paid' : 'failed')
  }

  // 2. Insert into payment_webhook_logs table
  try {
    const rawPayload = JSON.stringify(payload)
    await pool.query(`
      INSERT INTO payment_webhook_logs
      (event_id, event_type, payment_id, amount, currency, fee, net_amount, payment_method, payer_name, payer_email, status, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      eventType,
      paymentId,
      amount,
      currency,
      fee,
      netAmount,
      paymentMethod,
      payerName,
      payerEmail,
      status,
      rawPayload
    ])
    console.log(`[PayMongo Webhook] 💾 Stored payment event to database: ₱${amount.toFixed(2)} (${paymentMethod.toUpperCase()})`)
  } catch (dbErr) {
    console.error('[PayMongo Webhook] Failed to insert log to DB:', dbErr.message)
  }

  // 3. Trigger In-App Notification for Admin & Cashier
  if (status === 'paid') {
    // Automatically match and mark the order as PAID in orders table
    try {
      const allText = `${JSON.stringify(eventData)} ${payerEmail} ${payerName}`
      const match = allText.match(/ORD-[A-Za-z0-9_-]+/i)
      if (match) {
        const matchedCode = match[0].toUpperCase()
        const [updateRes] = await pool.query(`
          UPDATE orders 
          SET payment_status = 'paid', payment_method = ?, payment_id = ?, paid_at = NOW() 
          WHERE UPPER(order_code) = ?
        `, [paymentMethod, paymentId, matchedCode])
        if (updateRes.affectedRows > 0) {
          console.log(`[PayMongo Webhook] 🎯 Order #${matchedCode} automatically marked as PAID!`)
        }
      }
    } catch (orderErr) {
      console.warn('[PayMongo Webhook] Could not auto-update order status:', orderErr.message)
    }

    try {
      const notifTitle = `💰 Online Payment Received: ₱${amount.toFixed(2)}`
      const notifMsg = `Payment confirmed via ${paymentMethod.toUpperCase()} from ${payerName}${payerEmail ? ` (${payerEmail})` : ''}. Ref: ${paymentId}`
      await createNotificationRecord({
        title: notifTitle,
        message: notifMsg,
        type: 'payment',
        recipient_role: 'admin',
        reservation_code: paymentId,
        action_url: '/admin/orders'
      })
      console.log(`[PayMongo Webhook] 📢 Queued in-app notification for admin/cashier`)
    } catch (notifErr) {
      console.warn('[PayMongo Webhook] Could not queue notification:', notifErr.message)
    }
  }

  // Always return 200 OK so PayMongo knows webhook was acknowledged
  res.status(200).json({
    success: true,
    message: 'PayMongo webhook event received and processed',
    event_id: eventId,
    event_type: eventType,
    status: status
  })
})

/**
 * GET /api/webhooks/paymongo/logs
 * Retrieve recent PayMongo webhook event logs
 */
router.get('/paymongo/logs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, event_id, event_type, payment_id, amount, currency, fee, net_amount, payment_method, payer_name, payer_email, status, created_at
      FROM payment_webhook_logs
      ORDER BY id DESC
      LIMIT 50
    `)
    res.json({
      success: true,
      count: rows.length,
      logs: rows
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

export default router

