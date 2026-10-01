import express from 'express'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import { pool } from '../config/db.js'

const router = express.Router()

// Helper to fetch live SMS credentials from DB with fallback to process.env
async function getRuntimeSmsConfig() {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_settings ORDER BY setting_id DESC LIMIT 1')
    if (rows && rows.length > 0) {
      return {
        apiKey: rows[0].httpsms_api_key || process.env.HTTPSMS_API_KEY || 'uk_--IhjRY4ziVFBGivlG_s5qxgvJbxR9eWgWcRjxVF1LSV5v2gwwdK5up2049effJo',
        fromNumber: rows[0].httpsms_from_number || process.env.HTTPSMS_FROM_NUMBER || '+639067236264',
        webhookSecret: rows[0].httpsms_webhook_secret || process.env.HTTPSMS_WEBHOOK_SECRET || '',
        webhookUrl: rows[0].webhook_url || 'https://api.josdiner.dpdns.org/api/webhooks/httpsms',
        notifyOnInbound: rows[0].notify_on_inbound === 1
      }
    }
  } catch (e) {
    // fallback to env
  }
  return {
    apiKey: process.env.HTTPSMS_API_KEY || 'uk_--IhjRY4ziVFBGivlG_s5qxgvJbxR9eWgWcRjxVF1LSV5v2gwwdK5up2049effJo',
    fromNumber: process.env.HTTPSMS_FROM_NUMBER || '+639067236264',
    webhookSecret: process.env.HTTPSMS_WEBHOOK_SECRET || '',
    webhookUrl: 'https://api.josdiner.dpdns.org/api/webhooks/httpsms',
    notifyOnInbound: true
  }
}

// HttpSMS Gateway Fallbacks (https://httpsms.com)
const HTTPSMS_API_KEY = process.env.HTTPSMS_API_KEY || 'uk_--IhjRY4ziVFBGivlG_s5qxgvJbxR9eWgWcRjxVF1LSV5v2gwwdK5up2049effJo'
const HTTPSMS_FROM_NUMBER = process.env.HTTPSMS_FROM_NUMBER || '+639067236264'

// Android SMS Gateway - Cloud Server (api.sms-gate.app:443)
const SMS_API_URL = 'https://api.sms-gate.app/3rdparty/v1/message'
const SMS_MOBILE_URL = 'http://100.88.114.63:8080/api/3rdparty/v1/message'
const SMS_USERNAME = process.env.SMS_USERNAME || 'H5YS7E'
const SMS_PASSWORD = process.env.SMS_PASSWORD || 'Carl Joseph solivio'
// Local server credentials (fallback): username='Jo\'s dinner', password='solivio11'
const SMS_LOCAL_USERNAME = process.env.SMS_LOCAL_USERNAME || "Jo's dinner"
const SMS_LOCAL_PASSWORD = process.env.SMS_LOCAL_PASSWORD || 'solivio11'

/**
 * GET /api/sms/settings
 * Returns current SMS Gateway & Webhook settings along with delivery statistics
 */
router.get('/settings', async (req, res) => {
  try {
    const config = await getRuntimeSmsConfig()
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_webhook_events,
        SUM(CASE WHEN event_type = 'message.phone.delivered' THEN 1 ELSE 0 END) as delivered_count,
        SUM(CASE WHEN event_type = 'message.phone.sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN event_type = 'message.phone.received' THEN 1 ELSE 0 END) as inbound_count,
        SUM(CASE WHEN event_type IN ('message.send.failed', 'message.send.expired') THEN 1 ELSE 0 END) as failed_count
      FROM sms_webhook_logs
    `).catch(() => [[{}]])

    res.json({
      status: 'success',
      data: {
        gateway_provider: 'httpsms',
        httpsms_api_key: config.apiKey,
        httpsms_from_number: config.fromNumber,
        httpsms_webhook_secret: config.webhookSecret,
        webhook_url: config.webhookUrl,
        notify_on_inbound: config.notifyOnInbound,
        stats: stats[0] || {}
      }
    })
  } catch (err) {
    console.error('[SMS Settings] Error fetching settings:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * PUT /api/sms/settings
 * Updates credentials and webhook configuration in database and runtime environment
 */
router.put('/settings', async (req, res) => {
  try {
    const {
      httpsms_api_key,
      httpsms_from_number,
      httpsms_webhook_secret,
      webhook_url,
      notify_on_inbound
    } = req.body

    const apiKey = httpsms_api_key !== undefined ? httpsms_api_key.trim() : undefined
    const fromNumber = httpsms_from_number !== undefined ? httpsms_from_number.trim() : undefined
    const secret = httpsms_webhook_secret !== undefined ? httpsms_webhook_secret.trim() : undefined
    const url = webhook_url !== undefined ? webhook_url.trim() : 'https://api.josdiner.dpdns.org/api/webhooks/httpsms'
    const notify = notify_on_inbound !== undefined ? (notify_on_inbound ? 1 : 0) : 1

    const [existing] = await pool.query('SELECT setting_id FROM sms_settings ORDER BY setting_id DESC LIMIT 1')
    if (existing && existing.length > 0) {
      await pool.query(`
        UPDATE sms_settings
        SET httpsms_api_key = COALESCE(?, httpsms_api_key),
            httpsms_from_number = COALESCE(?, httpsms_from_number),
            httpsms_webhook_secret = COALESCE(?, httpsms_webhook_secret),
            webhook_url = COALESCE(?, webhook_url),
            notify_on_inbound = ?
        WHERE setting_id = ?
      `, [apiKey, fromNumber, secret, url, notify, existing[0].setting_id])
    } else {
      await pool.query(`
        INSERT INTO sms_settings (gateway_provider, httpsms_api_key, httpsms_from_number, httpsms_webhook_secret, webhook_url, notify_on_inbound)
        VALUES ('httpsms', ?, ?, ?, ?, ?)
      `, [apiKey || '', fromNumber || '+639067236264', secret || '', url, notify])
    }

    if (apiKey) process.env.HTTPSMS_API_KEY = apiKey
    if (fromNumber) process.env.HTTPSMS_FROM_NUMBER = fromNumber
    if (secret) process.env.HTTPSMS_WEBHOOK_SECRET = secret

    res.json({
      status: 'success',
      message: 'SMS Gateway & Webhook configuration updated successfully!'
    })
  } catch (err) {
    console.error('[SMS Settings] Error saving settings:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * GET /api/sms/webhook-logs
 * Retrieves logged webhook events from HttpSMS
 */
router.get('/webhook-logs', async (req, res) => {
  try {
    const { event_type, search, limit = 50 } = req.query
    let sql = 'SELECT * FROM sms_webhook_logs WHERE 1=1'
    const params = []

    if (event_type && event_type !== 'all') {
      sql += ' AND event_type = ?'
      params.push(event_type)
    }

    if (search && search.trim()) {
      sql += ' AND (phone_number LIKE ? OR content LIKE ? OR message_id LIKE ?)'
      const s = `%${search.trim()}%`
      params.push(s, s, s)
    }

    sql += ' ORDER BY created_at DESC LIMIT ?'
    params.push(parseInt(limit, 10) || 50)

    const [logs] = await pool.query(sql, params)
    res.json({ status: 'success', data: logs })
  } catch (err) {
    console.error('[SMS Settings] Error fetching webhook logs:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * DELETE /api/sms/webhook-logs
 * Clears logged webhook events
 */
router.delete('/webhook-logs', async (req, res) => {
  try {
    await pool.query('DELETE FROM sms_webhook_logs WHERE log_id > 0')
    res.json({ status: 'success', message: 'SMS webhook event history cleared.' })
  } catch (err) {
    console.error('[SMS Settings] Error clearing logs:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * POST /api/sms/test
 * Quick live test SMS dispatch directly from admin settings
 */
router.post('/test', async (req, res) => {
  try {
    const { number, message } = req.body
    if (!number) {
      return res.status(400).json({ status: 'error', message: 'Recipient phone number is required.' })
    }
    const cleanNumber = normalisePhilippineNumber(String(number).trim())
    if (!cleanNumber) {
      return res.status(400).json({ status: 'error', message: 'Invalid Philippine mobile number format (e.g. 09XXXXXXXXX or +639XXXXXXXXX).' })
    }

    const config = await getRuntimeSmsConfig()
    const text = message || `[Jo's Diner] Live test SMS dispatched via HttpSMS gateway at ${new Date().toLocaleTimeString()}! Webhook integration active.`
    
    const result = await sendHttpSMS({
      to: cleanNumber,
      message: text,
      from: config.fromNumber,
      apiKey: config.apiKey
    })

    res.json({
      status: 'success',
      message: 'Test SMS dispatched to mobile network successfully!',
      message_id: result?.data?.id || result?.id || 'queued',
      result
    })
  } catch (err) {
    console.error('[SMS Settings] Error sending test SMS:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * Send an SMS via HttpSMS API (api.httpsms.com)
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (+639XXXXXXXXX)
 * @param {string} params.message - SMS text content
 * @param {string} [params.from] - Sender number on linked SIM card
 * @param {string} [params.apiKey] - HttpSMS API key
 */
function sendHttpSMS({ to, message, from = HTTPSMS_FROM_NUMBER, apiKey = HTTPSMS_API_KEY }) {
  return new Promise((resolve, reject) => {
    const key = apiKey || HTTPSMS_API_KEY
    if (!key) {
      return reject(new Error('HttpSMS API key is missing.'))
    }

    const cleanTo = normalisePhilippineNumber(to)
    if (!cleanTo) {
      return reject(new Error(`Invalid Philippine mobile number: ${to}`))
    }

    const payload = JSON.stringify({
      content: message,
      from: from || HTTPSMS_FROM_NUMBER,
      to: cleanTo
    })

    const reqHttp = https.request({
      hostname: 'api.httpsms.com',
      path: '/v1/messages/send',
      method: 'POST',
      headers: {
        'x-api-key': key,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
        'User-Agent': 'JosDiner-HttpSMS/2.0'
      },
      timeout: 20000
    }, (response) => {
      let data = ''
      response.on('data', chunk => { data += chunk })
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed)
          } else {
            const errMsg = parsed.message || parsed.error || `HttpSMS error ${response.statusCode}`
            reject(new Error(errMsg))
          }
        } catch {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({ raw: data })
          } else {
            reject(new Error(`HttpSMS gateway HTTP ${response.statusCode}: ${data.substring(0, 150)}`))
          }
        }
      })
    })

    reqHttp.on('timeout', () => {
      reqHttp.destroy()
      reject(new Error('HttpSMS timed out after 20s.'))
    })

    reqHttp.on('error', (err) => {
      reject(new Error(`HttpSMS network error: ${err.message}`))
    })

    reqHttp.write(payload)
    reqHttp.end()
  })
}

/**
 * POST /api/sms/send
 * Body: { message: string, number: string }
 * Sends a single SMS via HTTP Basic Auth to the Android SMS Gateway cloud.
 */
router.post('/send', async (req, res) => {
  const { message, number, phone, username, password, url, from, apiKey, gateway } = req.body
  const recipient = number || phone

  if (!message || !recipient) {
    return res.status(400).json({ success: false, message: 'Message and phone number are required.' })
  }

  const cleanNumber = normalisePhilippineNumber(String(recipient).trim())
  if (!cleanNumber) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Philippine mobile number. Must start with 9 (e.g. 9XXXXXXXXX or +639XXXXXXXXX).'
    })
  }

  // 1. If HttpSMS is available or requested, try it first
  const preferHttpSMS = gateway === 'httpsms' || apiKey || (!username && !password && HTTPSMS_API_KEY)
  if (preferHttpSMS) {
    try {
      console.log(`[SMS] Sending via HttpSMS to ${cleanNumber}...`)
      const result = await sendHttpSMS({ to: cleanNumber, message, from, apiKey })
      console.log(`[SMS] Success via HttpSMS (ID: ${result?.data?.id || 'queued'})`)
      return res.json({ success: true, message: 'SMS sent successfully via HttpSMS!', result, gateway: 'httpsms' })
    } catch (err) {
      console.warn(`[SMS] HttpSMS attempt failed: ${err.message}. Trying backup gateways...`)
    }
  }

  // 2. Fallback to Android SMS Gateway
  const attempts = []
  if (username && password) {
    attempts.push({ url: url || SMS_API_URL, user: username, pass: password })
  }
  attempts.push(
    { url: SMS_API_URL, user: SMS_USERNAME, pass: SMS_PASSWORD },
    { url: SMS_MOBILE_URL, user: SMS_LOCAL_USERNAME, pass: SMS_LOCAL_PASSWORD }
  )

  let lastError = null

  for (const { url: targetUrl, user, pass } of attempts) {
    try {
      console.log(`[SMS] Trying backup endpoint: ${targetUrl}`)
      const result = await sendSMS(user, pass, message, [cleanNumber], targetUrl)
      console.log(`[SMS] Success via ${targetUrl}`)
      return res.json({ success: true, message: 'SMS sent successfully!', result, gateway: 'android_sms_gateway' })
    } catch (err) {
      console.warn(`[SMS] Failed via ${targetUrl}: ${err.message}`)
      lastError = err
    }
  }

  return res.status(500).json({ success: false, message: lastError?.message || 'Failed to send SMS.' })
})

/**
 * GET /api/sms/state/:id
 * Query message delivery state by ID from Android SMS Gateway
 */
router.get('/state/:id', async (req, res) => {
  const { id } = req.params

  // If HttpSMS UUID format (e.g. 510843a5-9d8d-47f6-9b76-9eb2e68e4318)
  if (id && id.includes('-') && id.length > 20) {
    try {
      const apiKey = req.query.apiKey || HTTPSMS_API_KEY
      const stateResult = await new Promise((resolve, reject) => {
        const reqHttp = https.request({
          hostname: 'api.httpsms.com',
          path: `/v1/messages/${encodeURIComponent(id)}`,
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        }, (response) => {
          let data = ''
          response.on('data', chunk => { data += chunk })
          response.on('end', () => {
            try {
              resolve(JSON.parse(data))
            } catch {
              resolve({ raw: data })
            }
          })
        })
        reqHttp.on('timeout', () => {
          reqHttp.destroy()
          reject(new Error('Timed out querying HttpSMS message state'))
        })
        reqHttp.on('error', reject)
        reqHttp.end()
      })

      const status = stateResult?.data?.status || 'unknown'
      return res.json({
        success: true,
        gateway: 'httpsms',
        id,
        state: status,
        details: stateResult?.data || stateResult
      })
    } catch (err) {
      console.warn(`[SMS] Failed to query HttpSMS state for ${id}:`, err.message)
    }
  }

  const username = req.query.username || SMS_USERNAME
  const password = req.query.password || SMS_PASSWORD
  const targetUrl = req.query.url || `${SMS_API_URL}/${encodeURIComponent(id)}`

  try {
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64')
    const parsedUrl = new URL(targetUrl)
    const isHttps = parsedUrl.protocol === 'https:'
    const httpModule = isHttps ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
        'User-Agent': 'JosDiner/1.0'
      },
      timeout: 15000,
      rejectUnauthorized: false
    }

    const stateResult = await new Promise((resolve, reject) => {
      const reqHttp = httpModule.request(options, (response) => {
        let data = ''
        response.on('data', chunk => { data += chunk })
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            resolve(parsed)
          } catch {
            resolve({ raw: data })
          }
        })
      })
      reqHttp.on('timeout', () => {
        reqHttp.destroy()
        reject(new Error('Timed out querying message state'))
      })
      reqHttp.on('error', (err) => reject(err))
      reqHttp.end()
    })

    return res.json({ success: true, state: stateResult })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * POST /api/sms/send-bulk
 * Body: { message: string, numbers: string[] }
 */
router.post('/send-bulk', async (req, res) => {
  const { message, numbers } = req.body

  if (!message || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ success: false, message: 'Message and numbers array are required.' })
  }

  const normalised = numbers.map(n => normalisePhilippineNumber(String(n).trim())).filter(Boolean)

  if (normalised.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid Philippine mobile numbers provided.' })
  }

  try {
    const result = await sendSMS(SMS_USERNAME, SMS_PASSWORD, message, normalised)
    return res.json({
      success: true,
      message: `SMS sent to ${normalised.length} recipient(s)!`,
      result
    })
  } catch (err) {
    console.error('[SMS] Bulk send error:', err.message)
    return res.status(500).json({ success: false, message: err.message || 'Failed to send SMS.' })
  }
})

/**
 * Normalise to +63XXXXXXXXX format.
 * Accepts: 9XXXXXXXXX, 09XXXXXXXXX, +639XXXXXXXXX
 * Returns null if invalid.
 */
function normalisePhilippineNumber(raw) {
  // Strip all spaces and dashes
  let n = raw.replace(/[\s\-]/g, '')

  if (n.startsWith('+63')) {
    // Already has country code, validate
  } else if (n.startsWith('09')) {
    n = '+63' + n.slice(1) // 09XXXXXXXXX -> +639XXXXXXXXX
  } else if (n.startsWith('9') && n.length === 10) {
    n = '+63' + n // 9XXXXXXXXX -> +639XXXXXXXXX
  } else {
    return null
  }

  // Final validation: +639XXXXXXXXX = 13 chars
  if (!/^\+639\d{9}$/.test(n)) return null
  return n
}

/**
 * Core SMS sender using HTTP Basic Auth + Android SMS Gateway API format
 * phoneNumbers: string[] — must be in E.164 format (+639XXXXXXXXX)
 * url: override the default endpoint
 */
function sendSMS(username, password, message, phoneNumbers, url = SMS_API_URL) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message, phoneNumbers })
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64')
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const httpModule = isHttps ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
        'User-Agent': 'JosDiner/1.0'
      },
      timeout: 20000,
      rejectUnauthorized: false // Allow self-signed certs on the gateway
    }

    const reqHttp = httpModule.request(options, (response) => {
      let data = ''
      response.on('data', chunk => { data += chunk })
      response.on('end', () => {
        console.log(`[SMS] Gateway response (${response.statusCode}):`, data.substring(0, 300))
        try {
          const parsed = JSON.parse(data)
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed)
          } else {
            const errMsg = parsed.message || parsed.error || parsed.reason || `Gateway error ${response.statusCode}`
            reject(new Error(errMsg))
          }
        } catch {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({ raw: data })
          } else {
            reject(new Error(`SMS gateway error (${response.statusCode}): ${data.substring(0, 200)}`))
          }
        }
      })
    })

    reqHttp.on('timeout', () => {
      reqHttp.destroy()
      reject(new Error('SMS gateway timed out after 20 seconds.'))
    })
    reqHttp.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`))
    })

    reqHttp.write(payload)
    reqHttp.end()
  })
}

/**
 * Convenience helper to send an SMS to a customer with automatic retry across cloud & mobile endpoints.
 */
async function sendCustomerSMS(rawPhone, message) {
  if (!rawPhone || !message) return null
  const cleanNumber = normalisePhilippineNumber(String(rawPhone).trim())
  if (!cleanNumber) {
    console.warn('[SMS] Invalid or missing Philippine phone number:', rawPhone)
    return null
  }

  // 1. Primary Gateway: HttpSMS (httpsms.com)
  if (HTTPSMS_API_KEY) {
    try {
      const result = await sendHttpSMS({ to: cleanNumber, message })
      const msgId = result?.data?.id || result?.id || 'queued'
      console.log(`[SMS] Notification sent to ${cleanNumber} via HttpSMS (ID: ${msgId})`)
      return result
    } catch (err) {
      console.warn(`[SMS] HttpSMS attempt failed for ${cleanNumber}: ${err.message}. Trying backup gateways...`)
    }
  }

  // 2. Backup Gateway: Android SMS Gateway (Cloud & Mobile)
  const attempts = [
    { url: SMS_API_URL, user: SMS_USERNAME, pass: SMS_PASSWORD },
    { url: SMS_MOBILE_URL, user: SMS_LOCAL_USERNAME, pass: SMS_LOCAL_PASSWORD }
  ]

  let lastError = null
  for (const { url: targetUrl, user, pass } of attempts) {
    try {
      const res = await sendSMS(user, pass, message, [cleanNumber], targetUrl)
      console.log(`[SMS] Notification sent to ${cleanNumber} via backup ${targetUrl}`)
      return res
    } catch (err) {
      console.warn(`[SMS] Backup attempt failed via ${targetUrl}: ${err.message}`)
      lastError = err
    }
  }
  console.warn('[SMS] All SMS gateways failed for', cleanNumber, lastError?.message)
  return null
}

export default router
export { sendHttpSMS, sendSMS, normalisePhilippineNumber, sendCustomerSMS }

