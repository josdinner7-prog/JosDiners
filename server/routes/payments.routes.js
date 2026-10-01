// server/routes/payments.routes.js
// PayMongo Payment Gateway Routes for Jo's Diner
import express from 'express'
import dotenv from 'dotenv'
import { pool } from '../config/db.js'
import { createNotificationRecord } from './notifications.routes.js'

dotenv.config()

const router = express.Router()

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ''
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || ''
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const getAuthHeader = () => {
  return 'Basic ' + Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')
}

/**
 * GET /api/payments/config
 * Returns public configuration and gateway status
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publicKey: PAYMONGO_PUBLIC_KEY,
    isConfigured: Boolean(PAYMONGO_SECRET_KEY && PAYMONGO_SECRET_KEY.startsWith('sk_')),
    currency: 'PHP',
    minAmount: 20.00
  })
})

// In-memory cache for pending checkout sessions before order creation
const pendingCheckoutSessions = new Map()

/**
 * POST /api/payments/create-checkout-session
 * Creates a PayMongo hosted checkout session for online payments
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'PAYMONGO_SECRET_KEY is not configured in environment variables (.env).'
      })
    }

    const {
      amount,
      description = "Jo's Diner Test Payment",
      customerName = 'Valued Guest',
      customerEmail = 'customer@example.com',
      customerPhone = '',
      paymentMethods = ['gcash', 'paymaya', 'card', 'grab_pay', 'dob'],
      successUrl,
      cancelUrl,
      reference = `TEST-${Date.now().toString().slice(-6)}`,
      lineItems = null,
      orderPayload = null
    } = req.body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 20) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payment amount is ₱20.00 PHP.'
      })
    }

    // PayMongo requires amount in centavos (PHP 1.00 = 100 centavos)
    const amountInCentavos = Math.round(numAmount * 100)

    const finalSuccessUrl = successUrl || `${CLIENT_URL}/checkout/success?order_code=${reference}`
    const finalCancelUrl = cancelUrl || `${CLIENT_URL}/menu?payment_status=cancelled`

    const itemsFormatted = (lineItems && Array.isArray(lineItems) && lineItems.length > 0)
      ? lineItems.map(item => ({
          currency: 'PHP',
          amount: Math.round(parseFloat(item.price || item.amount) * 100),
          description: item.special_instructions || item.description || item.name || 'Menu Item',
          name: item.name || 'Dish',
          quantity: Math.max(1, parseInt(item.quantity || 1, 10))
        }))
      : [
          {
            currency: 'PHP',
            amount: amountInCentavos,
            description: description,
            name: `Jo's Diner - ${description}`,
            quantity: 1
          }
        ]

    const payload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: `${description} (Ref: ${reference})`,
          line_items: itemsFormatted,
          payment_method_types: paymentMethods,
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl
        }
      }
    }

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[PayMongo Error]', data)
      const errorMsg = data.errors?.[0]?.detail || 'Failed to create PayMongo checkout session'
      return res.status(response.status).json({
        success: false,
        message: errorMsg,
        errors: data.errors
      })
    }

    const session = data.data

    // Cache the pending checkout order data without inserting to DB yet
    const pendingEntry = {
      sessionId: session.id,
      orderCode: reference,
      orderPayload: orderPayload || null,
      amount: numAmount,
      customerName,
      customerEmail,
      createdAt: Date.now()
    }
    pendingCheckoutSessions.set(session.id, pendingEntry)
    pendingCheckoutSessions.set(reference, pendingEntry)

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.attributes.checkout_url,
      amount: numAmount,
      currency: 'PHP',
      status: session.attributes.status,
      paymentMethodTypes: session.attributes.payment_method_types
    })
  } catch (error) {
    console.error('[Payments Route Error]', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing payment request'
    })
  }
})

/**
 * GET /api/payments/order-session/:orderCode
 * Retrieves pending session ID and payload for a given order reference code
 */
router.get('/order-session/:orderCode', (req, res) => {
  const { orderCode } = req.params
  const entry = pendingCheckoutSessions.get(orderCode)
  if (!entry) {
    return res.status(404).json({ success: false, message: 'No pending session found for order' })
  }
  res.json({ success: true, ...entry })
})

/**
 * POST /api/payments/verify-checkout-session/:sessionId
 * Verifies if PayMongo checkout session was paid and saves order to DB
 */
router.post('/verify-checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const orderCodeParam = req.body?.orderCode || req.query?.orderCode || ''
    let orderPayload = req.body?.orderPayload || null

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' })
    }

    const pendingData = pendingCheckoutSessions.get(sessionId) || (orderCodeParam ? pendingCheckoutSessions.get(orderCodeParam) : null)
    const effectiveOrderCode = orderCodeParam || pendingData?.orderCode || ''
    if (!orderPayload && pendingData?.orderPayload) {
      orderPayload = pendingData.orderPayload
    }

    const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      }
    })

    const data = await response.json()
    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.detail || 'Failed to query session from PayMongo'
      return res.status(response.status).json({ success: false, message: errorMsg })
    }

    const session = data.data
    const attributes = session.attributes
    const payments = attributes.payments || []
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null
    const isPaid = attributes.status === 'paid' || latestPayment?.attributes?.status === 'paid'

    let savedOrder = null
    if (isPaid && effectiveOrderCode) {
      const paymentId = latestPayment?.id || session.id
      const method = latestPayment?.attributes?.source?.type || 'paymongo_checkout'
      const amount = (attributes.line_items?.[0]?.amount || 0) / 100

      savedOrder = await finalizeOrderPayment({
        orderCode: effectiveOrderCode,
        paymentId,
        method,
        amount,
        email: latestPayment?.attributes?.billing?.email || attributes.billing?.email,
        phone: latestPayment?.attributes?.billing?.phone || attributes.billing?.phone,
        name: latestPayment?.attributes?.billing?.name || attributes.billing?.name,
        orderPayload
      })

      // Clean up cached pending session
      pendingCheckoutSessions.delete(sessionId)
      if (effectiveOrderCode) pendingCheckoutSessions.delete(effectiveOrderCode)
    }

    res.json({
      success: true,
      isPaid,
      status: attributes.status,
      sessionId,
      orderCode: effectiveOrderCode,
      order: savedOrder,
      session: {
        id: session.id,
        status: attributes.status,
        amount: (attributes.line_items?.[0]?.amount || 0) / 100,
        currency: 'PHP',
        checkoutUrl: attributes.checkout_url,
        paymentMethodType: latestPayment?.attributes?.source?.type || 'card'
      }
    })
  } catch (error) {
    console.error('[Verify Checkout Session Error]', error)
    res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
})

/**
 * GET /api/payments/session/:sessionId
 * Retrieves the status and payment details of a specific checkout session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' })
    }

    const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      }
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.detail || 'Failed to fetch session'
      return res.status(response.status).json({
        success: false,
        message: errorMsg
      })
    }

    const session = data.data
    const attributes = session.attributes
    const payments = attributes.payments || []
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null

    res.json({
      success: true,
      session: {
        id: session.id,
        status: attributes.status, // 'active' or 'paid'
        amount: (attributes.line_items?.[0]?.amount || 0) / 100,
        currency: 'PHP',
        description: attributes.description,
        checkoutUrl: attributes.checkout_url,
        paidAt: latestPayment?.attributes?.paid_at ? new Date(latestPayment.attributes.paid_at * 1000).toISOString() : null,
        paymentMethodType: latestPayment?.attributes?.source?.type || latestPayment?.attributes?.payment_method_type || 'N/A',
        paymentId: latestPayment?.id || null,
        fee: latestPayment?.attributes?.fee ? latestPayment.attributes.fee / 100 : 0,
        netAmount: latestPayment?.attributes?.net_amount ? latestPayment.attributes.net_amount / 100 : null,
        receiptNumber: latestPayment?.attributes?.receipt_number || null,
        paymentsCount: payments.length
      }
    })
  } catch (error) {
    console.error('[Session Check Error]', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to query session from PayMongo'
    })
  }
})

/**
 * Helper to record payment and insert order into DB if not yet created
 */
async function finalizeOrderPayment({ orderCode, paymentId, method = 'card', amount, email, phone, name, orderPayload }) {
  if (!orderCode) return null

  try {
    // 1. Check if order already exists in database
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_code = ? LIMIT 1', [orderCode])

    if (rows && rows.length > 0) {
      // Order already exists in DB -> update payment status to paid
      await pool.query(
        'UPDATE orders SET payment_status = ?, payment_method = ?, payment_id = ?, paid_at = NOW() WHERE order_code = ?',
        ['paid', method, paymentId, orderCode]
      )

      const customerEmail = (email || rows[0].customer_email || '').trim().toLowerCase()
      if (customerEmail) {
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: customerEmail,
          reservation_code: orderCode,
          type: 'order_update',
          title: 'Payment Confirmed',
          message: `Payment of ₱${parseFloat(amount || rows[0].grand_total).toLocaleString('en-PH', { minimumFractionDigits: 2 })} for Order #${orderCode} was successful via ${method.toUpperCase()}. Kitchen preparation is now active!`,
          action_url: `/payment/${orderCode}`
        }).catch(() => {})
      }
      return rows[0]
    }

    // 2. Order does NOT exist yet in DB -> Insert it now as PAID!
    const payload = orderPayload || {}
    const itemsData = payload.items || payload.items_json || []
    const itemsJsonString = typeof itemsData === 'string' ? itemsData : JSON.stringify(itemsData)
    const finalType = (payload.order_type || 'Dine-in').toLowerCase().includes('takeout') ? 'Takeout' : 'Dine-in'
    const finalTable = 'Pickup Counter'
    const finalTotal = parseFloat(payload.grand_total || payload.total_amount || amount || 0)
    const finalEmail = (payload.customer_email || email || '').trim().toLowerCase() || null
    const finalPhone = payload.customer_phone || phone || ''
    const finalCustName = payload.customer_name || name || 'Customer'

    const [result] = await pool.query(
      `INSERT INTO orders 
        (order_code, customer_name, customer_email, customer_phone, user_id, order_type, table_number, grand_total, status, items_json, payment_method, payment_status, payment_id, paid_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderCode,
        finalCustName,
        finalEmail,
        finalPhone,
        payload.user_id || null,
        finalType,
        finalTable,
        finalTotal,
        'New',
        itemsJsonString,
        method,
        'paid',
        paymentId
      ]
    )

    // Notify customer
    if (finalEmail) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: finalEmail,
        user_id: payload.user_id || null,
        reservation_code: orderCode,
        type: 'order_update',
        title: 'Payment Confirmed & Order Placed',
        message: `Your payment of ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} for Order #${orderCode} was successful via ${method.toUpperCase()}! Kitchen preparation is active.`,
        action_url: `/payment/${orderCode}`
      }).catch(() => {})
    }

    // Notify staff / kitchen
    createNotificationRecord({
      recipient_role: 'staff',
      reservation_code: orderCode,
      type: 'order_update',
      title: 'New Paid Online Order',
      message: `Order #${orderCode} (${finalCustName}, ${finalType}) was paid online (₱${finalTotal}) and is ready to cook!`,
      action_url: '/kitchen'
    }).catch(() => {})

    return {
      order_id: result.insertId,
      order_code: orderCode,
      customer_name: finalCustName,
      grand_total: finalTotal,
      payment_status: 'paid',
      payment_method: method
    }
  } catch (err) {
    console.error('[Finalize Order Payment Error]', err)
    return null
  }
}

/**
 * POST /api/payments/pay-card
 * Processes in-app credit/debit card payment via PayMongo Payment Intent
 */
router.post('/pay-card', async (req, res) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'PayMongo secret key is not configured.' })
    }

    const {
      orderCode,
      amount,
      cardNumber,
      expMonth,
      expYear,
      cvc,
      cardholderName = 'Customer',
      email = 'customer@example.com',
      phone = '09123456789',
      orderPayload = null
    } = req.body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 20) {
      return res.status(400).json({ success: false, message: 'Minimum payment amount is ₱20.00 PHP.' })
    }

    const cleanCard = String(cardNumber || '').replace(/\s+/g, '')
    const cleanExpMonth = parseInt(expMonth, 10)
    let cleanExpYear = parseInt(expYear, 10)
    if (cleanExpYear < 100) cleanExpYear += 2000
    const cleanCvc = String(cvc || '').trim()

    if (!cleanCard || isNaN(cleanExpMonth) || isNaN(cleanExpYear) || !cleanCvc) {
      return res.status(400).json({ success: false, message: 'Please provide complete card number, expiration, and CVC.' })
    }

    const amountInCentavos = Math.round(numAmount * 100)

    // 1. Create PayMongo Payment Intent
    const piRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_method_allowed: ['card'],
            currency: 'PHP',
            description: `Jo's Diner Order ${orderCode || 'Card Payment'}`
          }
        }
      })
    })

    const piData = await piRes.json()
    if (!piRes.ok) {
      const errorMsg = piData.errors?.[0]?.detail || 'Failed to initialize payment intent with PayMongo'
      return res.status(piRes.status).json({ success: false, message: errorMsg, errors: piData.errors })
    }

    const piId = piData.data.id
    const clientKey = piData.data.attributes.client_key

    // 2. Create PayMongo Payment Method (Card)
    const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'card',
            details: {
              card_number: cleanCard,
              exp_month: cleanExpMonth,
              exp_year: cleanExpYear,
              cvc: cleanCvc
            },
            billing: {
              name: cardholderName,
              email: email,
              phone: phone
            }
          }
        }
      })
    })

    const pmData = await pmRes.json()
    if (!pmRes.ok) {
      const errorMsg = pmData.errors?.[0]?.detail || 'Invalid card information provided'
      return res.status(pmRes.status).json({ success: false, message: errorMsg, errors: pmData.errors })
    }

    const pmId = pmData.data.id

    // 3. Attach Payment Method to Payment Intent
    const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${piId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: pmId,
            client_key: clientKey,
            return_url: `${CLIENT_URL}/payment/${orderCode}?payment_intent_id=${piId}`
          }
        }
      })
    })

    const attachData = await attachRes.json()
    if (!attachRes.ok) {
      const errorMsg = attachData.errors?.[0]?.detail || 'Card payment authorization failed'
      return res.status(attachRes.status).json({ success: false, message: errorMsg, errors: attachData.errors })
    }

    const intentStatus = attachData.data.attributes.status
    const payments = attachData.data.attributes.payments || []
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null
    const paymentId = latestPayment?.id || piId

    // If payment succeeded immediately (e.g. test cards)
    if (intentStatus === 'succeeded' || (latestPayment && latestPayment.attributes?.status === 'paid')) {
      if (orderCode) {
        await finalizeOrderPayment({
          orderCode,
          paymentId,
          method: 'card',
          amount: numAmount,
          email,
          phone,
          name: cardholderName,
          orderPayload
        })
      }

      return res.json({
        success: true,
        status: 'paid',
        paymentId: paymentId,
        amount: numAmount,
        message: 'Card payment processed successfully!'
      })
    }

    // 3D Secure redirect action required
    if (attachData.data.attributes.next_action?.redirect?.url) {
      return res.json({
        success: true,
        status: 'awaiting_next_action',
        redirectUrl: attachData.data.attributes.next_action.redirect.url,
        paymentIntentId: piId
      })
    }

    res.json({
      success: false,
      status: intentStatus,
      message: 'Card payment could not be completed.'
    })
  } catch (error) {
    console.error('[Card Payment Error]', error)
    // If local dev environment is offline / DNS cannot reach api.paymongo.com and test card is used, simulate approval
    const isTestKey = !PAYMONGO_SECRET_KEY || PAYMONGO_SECRET_KEY.includes('test')
    const isTestCard = String(req.body?.cardNumber || '').replace(/\s+/g, '').startsWith('4343')
    if (isTestKey && isTestCard && (error?.cause?.code === 'ENOTFOUND' || error?.code === 'ENOTFOUND' || String(error?.message).includes('fetch failed'))) {
      console.log('[PayMongo Sandbox Fallback] Approving test card payment for:', req.body?.orderCode)
      const simPaymentId = `pay_sim_${Date.now()}`
      if (req.body?.orderCode) {
        await finalizeOrderPayment({
          orderCode: req.body.orderCode,
          paymentId: simPaymentId,
          method: 'card',
          amount: parseFloat(req.body.amount || 0),
          email: req.body.email,
          phone: req.body.phone,
          name: req.body.cardholderName,
          orderPayload: req.body.orderPayload
        })
      }
      return res.json({
        success: true,
        status: 'paid',
        paymentId: simPaymentId,
        amount: parseFloat(req.body.amount || 0),
        message: 'Test card payment approved (Local Sandbox Fallback)!'
      })
    }
    res.status(500).json({ success: false, message: error.message || 'Server error processing card payment' })
  }
})

/**
 * POST /api/payments/pay-ewallet
 * Initializes GCash or Maya payment intent and returns authorization URL
 */
router.post('/pay-ewallet', async (req, res) => {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'PayMongo secret key is not configured.' })
    }

    const {
      orderCode,
      amount,
      type = 'gcash', // 'gcash' | 'paymaya'
      customerName = 'Customer',
      customerEmail = 'customer@example.com',
      customerPhone = '09123456789'
    } = req.body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 20) {
      return res.status(400).json({ success: false, message: 'Minimum payment amount is ₱20.00 PHP.' })
    }

    const amountInCentavos = Math.round(numAmount * 100)

    // 1. Create Payment Intent
    const piRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_method_allowed: [type],
            currency: 'PHP',
            description: `Jo's Diner Order ${orderCode || 'E-Wallet'}`
          }
        }
      })
    })

    const piData = await piRes.json()
    if (!piRes.ok) {
      return res.status(piRes.status).json({ success: false, message: piData.errors?.[0]?.detail || 'Failed to initialize e-wallet payment intent' })
    }

    const piId = piData.data.id
    const clientKey = piData.data.attributes.client_key

    // 2. Create Payment Method (E-wallet)
    const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: type,
            billing: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone
            }
          }
        }
      })
    })

    const pmData = await pmRes.json()
    if (!pmRes.ok) {
      return res.status(pmRes.status).json({ success: false, message: pmData.errors?.[0]?.detail || 'Failed to create e-wallet payment method' })
    }

    const pmId = pmData.data.id

    // 3. Attach Payment Method with return URL back to Jo's Diner Payment Page
    const returnUrl = `${CLIENT_URL}/payment/${orderCode}?intent_id=${piId}&method=${type}&check=true`
    const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${piId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: pmId,
            client_key: clientKey,
            return_url: returnUrl
          }
        }
      })
    })

    const attachData = await attachRes.json()
    if (!attachRes.ok) {
      return res.status(attachRes.status).json({ success: false, message: attachData.errors?.[0]?.detail || 'Failed to attach e-wallet payment' })
    }

    const redirectUrl = attachData.data.attributes.next_action?.redirect?.url
    res.json({
      success: true,
      paymentIntentId: piId,
      redirectUrl: redirectUrl,
      status: attachData.data.attributes.status
    })
  } catch (error) {
    console.error('[E-Wallet Payment Error]', error)
    res.status(500).json({ success: false, message: error.message || 'Server error processing e-wallet payment' })
  }
})

/**
 * GET & POST /api/payments/verify-intent/:intentId
 * Checks payment intent status and creates or marks order as paid if succeeded
 */
const handleVerifyIntent = async (req, res) => {
  try {
    const { intentId } = req.params
    const orderCode = req.body?.orderCode || req.query?.orderCode || ''
    const method = req.body?.method || req.query?.method || 'online'
    const orderPayload = req.body?.orderPayload || null

    if (!intentId) {
      return res.status(400).json({ success: false, message: 'Intent ID is required' })
    }

    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${intentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader()
      }
    })

    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: data.errors?.[0]?.detail || 'Intent check failed' })
    }

    const intent = data.data
    const status = intent.attributes.status
    const payments = intent.attributes.payments || []
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null
    const isPaid = status === 'succeeded' || latestPayment?.attributes?.status === 'paid'

    if (isPaid && orderCode) {
      const paymentId = latestPayment?.id || intentId
      await finalizeOrderPayment({
        orderCode,
        paymentId,
        method,
        amount: (intent.attributes.amount || 0) / 100,
        email: intent.attributes.billing?.email,
        phone: intent.attributes.billing?.phone,
        name: intent.attributes.billing?.name,
        orderPayload
      })
    }

    res.json({
      success: true,
      isPaid,
      status,
      paymentId: latestPayment?.id || intentId
    })
  } catch (error) {
    console.error('[Verify Intent Error]', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

router.get('/verify-intent/:intentId', handleVerifyIntent)
router.post('/verify-intent/:intentId', handleVerifyIntent)

export default router
