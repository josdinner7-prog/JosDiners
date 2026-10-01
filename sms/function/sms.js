/**
 * Android SMS Gateway Client - JavaScript / Node.js Implementation
 * Jo's Diner SMS Service Module
 */

import https from 'https'
import http from 'http'
import { URL } from 'url'

export const SMS_API_URL = 'https://api.sms-gate.app/3rdparty/v1/message'
export const SMS_MOBILE_URL = 'http://100.88.114.63:8080/api/3rdparty/v1/message'
export const DEFAULT_USERNAME = process.env.SMS_USERNAME || 'H5YS7E'
export const DEFAULT_PASSWORD = process.env.SMS_PASSWORD || 'Carl Joseph solivio'

export const HTTPSMS_API_KEY = process.env.HTTPSMS_API_KEY || 'uk_--IhjRY4ziVFBGivlG_s5qxgvJbxR9eWgWcRjxVF1LSV5v2gwwdK5up2049effJo'
export const HTTPSMS_FROM_NUMBER = process.env.HTTPSMS_FROM_NUMBER || '+639067236264'

/**
 * Send an SMS message using HttpSMS (httpsms.com)
 */
export function sendHttpSMS({
  message,
  number,
  from = HTTPSMS_FROM_NUMBER,
  apiKey = HTTPSMS_API_KEY
}) {
  return new Promise((resolve, reject) => {
    if (!message || !number) {
      return reject(new Error('Please provide message and number.'))
    }
    const cleanNumber = normalisePhilippineNumber(number)
    if (!cleanNumber) {
      return reject(new Error('Invalid Philippine mobile number.'))
    }

    const payload = JSON.stringify({
      content: message,
      from: from || HTTPSMS_FROM_NUMBER,
      to: cleanNumber
    })

    const req = https.request({
      hostname: 'api.httpsms.com',
      path: '/v1/messages/send',
      method: 'POST',
      headers: {
        'x-api-key': apiKey || HTTPSMS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
        'User-Agent': 'JosDiner-HttpSMS/2.0'
      },
      timeout: 20000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(parsed.message || `HttpSMS error ${res.statusCode}`))
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ raw: data })
          } else {
            reject(new Error(`HttpSMS gateway HTTP ${res.statusCode}: ${data}`))
          }
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('HttpSMS request timed out.'))
    })
    req.on('error', err => reject(err))
    req.write(payload)
    req.end()
  })
}

/**
 * Normalise a Philippine phone number into standard +639XXXXXXXXX format.
 * Accepts: 9XXXXXXXXX, 09XXXXXXXXX, +639XXXXXXXXX
 * Returns: string in +639XXXXXXXXX format, or null if invalid.
 */
export function normalisePhilippineNumber(raw) {
  if (!raw) return null
  let n = String(raw).replace(/[\s\-()]/g, '')

  if (n.startsWith('+63')) {
    // already starts with +63
  } else if (n.startsWith('63')) {
    n = '+' + n
  } else if (n.startsWith('09')) {
    n = '+63' + n.slice(1)
  } else if (n.startsWith('9') && n.length === 10) {
    n = '+63' + n
  } else {
    return null
  }

  // Philippine mobile numbers must start with +639 and be 13 characters (+63 followed by 10 digits)
  if (!/^\+639\d{9}$/.test(n)) {
    return null
  }
  return n
}

/**
 * Send an SMS message using Android SMS Gateway (Node.js HTTP/HTTPS)
 * @param {Object} params
 * @param {string} params.message - The SMS content
 * @param {string|string[]} params.number - Recipient number(s)
 * @param {string} [params.username] - Gateway username (defaults to env or H5YS7E)
 * @param {string} [params.password] - Gateway password (defaults to env or Carl Joseph solivio)
 * @param {string} [params.url] - Gateway endpoint URL
 * @returns {Promise<Object>} API response including message ID
 */
export function sendSMS({
  message,
  number,
  username = DEFAULT_USERNAME,
  password = DEFAULT_PASSWORD,
  url = SMS_API_URL
}) {
  return new Promise((resolve, reject) => {
    if (!message || !number) {
      return reject(new Error('Please provide all required fields: message and number.'))
    }

    const rawNumbers = Array.isArray(number) ? number : [number]
    const validNumbers = rawNumbers.map(normalisePhilippineNumber).filter(Boolean)

    if (validNumbers.length === 0) {
      return reject(
        new Error('Invalid Philippine mobile number. Must start with 9 (format: +639XXXXXXXXX) and be 10 digits long after +63.')
      )
    }

    const payload = JSON.stringify({
      message,
      phoneNumbers: validNumbers
    })

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
        'User-Agent': 'JosDiner-SMS/2.0'
      },
      timeout: 20000,
      rejectUnauthorized: false
    }

    const req = httpModule.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            const errMsg = parsed.message || parsed.error || parsed.reason || `Gateway error (${res.statusCode})`
            reject(new Error(errMsg))
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ raw: data })
          } else {
            reject(new Error(`SMS gateway error (${res.statusCode}): ${data.substring(0, 200)}`))
          }
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('SMS gateway request timed out after 20 seconds.'))
    })

    req.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`))
    })

    req.write(payload)
    req.end()
  })
}

/**
 * Get Message delivery state by ID from Android SMS Gateway
 * @param {Object} params
 * @param {string} params.messageId - The ID returned from sendSMS
 * @param {string} [params.username] - Gateway username
 * @param {string} [params.password] - Gateway password
 * @param {string} [params.url] - Gateway base URL
 * @returns {Promise<Object>} State object
 */
export function getMessageState({
  messageId,
  username = DEFAULT_USERNAME,
  password = DEFAULT_PASSWORD,
  url = SMS_API_URL
}) {
  return new Promise((resolve, reject) => {
    if (!messageId) {
      return reject(new Error('Message ID is required to check state.'))
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64')
    const stateUrl = `${url}/${encodeURIComponent(messageId)}`
    const parsedUrl = new URL(stateUrl)
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
        'User-Agent': 'JosDiner-SMS/2.0'
      },
      timeout: 15000,
      rejectUnauthorized: false
    }

    const req = httpModule.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            const errMsg = parsed.message || parsed.error || `Error retrieving state (${res.statusCode})`
            reject(new Error(errMsg))
          }
        } catch {
          resolve({ raw: data })
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('SMS gateway state query timed out.'))
    })

    req.on('error', (err) => {
      reject(new Error(`Network error querying state: ${err.message}`))
    })

    req.end()
  })
}

// CLI Execution support: node sms/function/sms.js "9123456789" "Test message"
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('sms/function/sms.js')) {
  const targetNumber = process.argv[2]
  const messageBody = process.argv[3] || 'Hello from Jo\'s Diner SMS Gateway (Node.js)'

  if (!targetNumber) {
    console.log('Usage: node sms/function/sms.js <phone_number> [message]')
    process.exit(1)
  }

  console.log(`[SMS CLI] Sending to ${targetNumber}: "${messageBody}"`)
  sendSMS({ number: targetNumber, message: messageBody })
    .then(async (result) => {
      console.log('✅ SMS Sent successfully!')
      console.log('Result:', JSON.stringify(result, null, 2))
      if (result.id) {
        try {
          const state = await getMessageState({ messageId: result.id })
          console.log('Message State:', JSON.stringify(state, null, 2))
        } catch (e) {
          console.log('Could not fetch state:', e.message)
        }
      }
    })
    .catch((err) => {
      console.error('❌ Error sending SMS:', err.message)
      process.exit(1)
    })
}

export default {
  sendSMS,
  getMessageState,
  normalisePhilippineNumber
}
