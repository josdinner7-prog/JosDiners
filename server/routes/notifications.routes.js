import { Router } from 'express'
import { pool } from '../config/db.js'
import { sendNotificationGmail } from '../utils/mailer.js'

const router = Router()

// Initialize notifications table if it doesn't exist
let isTableInitialized = false
async function ensureNotificationsTable() {
  if (isTableInitialized) return
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_role VARCHAR(30) NOT NULL DEFAULT 'customer',
        user_id INT NULL,
        recipient_email VARCHAR(255) NULL,
        reservation_id INT NULL,
        reservation_code VARCHAR(50) NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'booking_update',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        action_url VARCHAR(255) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        metadata_json TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Seed realistic initial notifications if empty
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM notifications')
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO notifications 
          (recipient_role, type, title, message, action_url, reservation_code, is_read, created_at)
        VALUES
          ('admin', 'approval_notice', 'New Event Reservation Pending Review', 'Customer Maria Santos requested a Function Hall booking for Grand Gala on Oct 12, 2026.', '/admin/reservations', 'RES-88912', 0, NOW() - INTERVAL 15 MINUTE),
          ('admin', 'payment_confirmation', 'Reservation Downpayment Confirmed', 'Reservation RES-40502 received downpayment confirmation via Cash Counter.', '/admin/reservations', 'RES-40502', 0, NOW() - INTERVAL 2 HOUR),
          ('customer', 'approval_notice', 'Table Reservation Approved & Confirmed', 'Your table reservation #RES-40502 has been officially confirmed! A unique QR entry pass was generated.', '/reservation', 'RES-40502', 0, NOW() - INTERVAL 1 HOUR),
          ('customer', 'booking_reminder', 'Upcoming Reservation Reminder', 'Reminder: Your dinner reservation at Jo\\'s Diner Main Dining is scheduled for tomorrow at 5:30 PM.', '/reservation', 'RES-40502', 0, NOW() - INTERVAL 4 HOUR),
          ('customer', 'booking_update', 'Booking Request Received', 'Your reservation request #RES-52313 has been submitted and is currently pending Staff/Admin approval.', '/reservation', 'RES-52313', 1, NOW() - INTERVAL 1 DAY),
          ('admin', 'cancellation_alert', 'Reservation Cancelled by Client', 'Reservation RES-33019 was cancelled by customer. Slot is now reopened for new bookings.', '/admin/reservations', 'RES-33019', 1, NOW() - INTERVAL 2 DAY)
      `)
    }
    isTableInitialized = true
  } catch (err) {
    console.error('[Notifications] Failed to ensure notifications table:', err.message)
  }
}

// 1. GET ALL NOTIFICATIONS (Supports filtering by role, email, type, is_read)
router.get('/', async (req, res) => {
  await ensureNotificationsTable()
  const { role, email, type, is_read, limit = 50 } = req.query

  try {
    // If requesting as customer role
    if (role === 'customer') {
      if (!email || !email.trim()) {
        return res.json({ status: 'success', notifications: [], unread_count: 0 })
      }
      let query = 'SELECT * FROM notifications WHERE recipient_role = ? AND LOWER(recipient_email) = ?'
      const params = ['customer', email.trim().toLowerCase()]

      if (type && type !== 'all') {
        query += ' AND type = ?'
        params.push(type)
      }

      if (is_read !== undefined && is_read !== '') {
        query += ' AND is_read = ?'
        params.push(is_read === 'true' || is_read === '1' ? 1 : 0)
      }

      query += ' ORDER BY notification_id DESC LIMIT ?'
      params.push(parseInt(limit, 10))

      const [rows] = await pool.query(query, params)

      // Calculate unread count strictly for this customer
      const [unreadRes] = await pool.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_role = ? AND LOWER(recipient_email) = ? AND is_read = 0',
        ['customer', email.trim().toLowerCase()]
      )
      const unreadCount = unreadRes?.[0]?.unread_count || 0

      return res.json({
        status: 'success',
        notifications: rows || [],
        unread_count: unreadCount
      })
    }

    let query = 'SELECT * FROM notifications WHERE 1=1'
    const params = []

    if (role) {
      if (role === 'admin') {
        query += " AND (recipient_role = 'admin' OR recipient_role = 'all' OR recipient_role = 'staff')"
      } else if (role === 'staff') {
        query += " AND (recipient_role = 'staff' OR recipient_role = 'all' OR recipient_role = 'admin')"
      } else {
        query += " AND (recipient_role = ? OR recipient_role = 'all')"
        params.push(role)
      }
    }

    if (email && email.trim()) {
      query += ' AND LOWER(recipient_email) = ?'
      params.push(email.trim().toLowerCase())
    }

    if (type && type !== 'all') {
      query += ' AND type = ?'
      params.push(type)
    }

    if (is_read !== undefined && is_read !== '') {
      query += ' AND is_read = ?'
      params.push(is_read === 'true' || is_read === '1' ? 1 : 0)
    }

    query += ' ORDER BY notification_id DESC LIMIT ?'
    params.push(parseInt(limit, 10))

    const [rows] = await pool.query(query, params)

    // Calculate unread counts
    let unreadCountQuery = 'SELECT COUNT(*) as unread_count FROM notifications WHERE is_read = 0'
    const unreadParams = []
    if (role) {
      if (role === 'admin') {
        unreadCountQuery += " AND (recipient_role = 'admin' OR recipient_role = 'all' OR recipient_role = 'staff')"
      } else if (role === 'staff') {
        unreadCountQuery += " AND (recipient_role = 'staff' OR recipient_role = 'all' OR recipient_role = 'admin')"
      } else {
        unreadCountQuery += " AND (recipient_role = ? OR recipient_role = 'all')"
        unreadParams.push(role)
      }
    }
    if (email && email.trim()) {
      unreadCountQuery += ' AND LOWER(recipient_email) = ?'
      unreadParams.push(email.trim().toLowerCase())
    }

    const [unreadRes] = await pool.query(unreadCountQuery, unreadParams)
    const unreadCount = unreadRes?.[0]?.unread_count || 0

    res.json({
      status: 'success',
      notifications: rows || [],
      unread_count: unreadCount,
      total_count: (rows || []).length
    })
  } catch (err) {
    console.error('[Notifications] Query error:', err.message)
    res.status(500).json({ status: 'error', message: err.message, notifications: [], unread_count: 0 })
  }
})

// 2. CREATE NEW NOTIFICATION
export async function createNotificationRecord(data) {
  await ensureNotificationsTable()
  const {
    recipient_role = 'customer',
    user_id = null,
    recipient_email = null,
    reservation_id = null,
    reservation_code = null,
    type = 'booking_update',
    title,
    message,
    action_url = null,
    metadata = null,
    skip_email = false
  } = data

  if (!title || !message) return null

  try {
    const metaJson = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
    const [result] = await pool.query(
      `INSERT INTO notifications 
        (recipient_role, user_id, recipient_email, reservation_id, reservation_code, type, title, message, action_url, metadata_json, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [recipient_role, user_id, recipient_email ? recipient_email.toLowerCase().trim() : null, reservation_id, reservation_code, type, title, message, action_url, metaJson]
    )
    const insertId = result.insertId

    // Automatically send notification notice directly to Gmail if recipient email is available and not suppressed
    const targetEmail = recipient_email ? recipient_email.toLowerCase().trim() : null
    if (targetEmail && targetEmail.includes('@') && !skip_email) {
      sendNotificationGmail({
        notification_id: insertId,
        recipient_role,
        recipient_email: targetEmail,
        reservation_id,
        reservation_code,
        type,
        title,
        message,
        action_url
      }, targetEmail).catch(err => {
        console.warn('[Notifications] Auto-dispatch Gmail notification warning:', err.message)
      })
    }

    return insertId
  } catch (err) {
    console.error('[Notifications] Insert error:', err.message)
    return null
  }
}

router.post('/', async (req, res) => {
  try {
    const id = await createNotificationRecord(req.body)
    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Title and message are required.' })
    }
    res.json({ status: 'success', message: 'Notification created successfully.', notification_id: id })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2.5. SEND NOTIFICATION TO GMAIL ON DEMAND
router.post('/:id/send-email', async (req, res) => {
  await ensureNotificationsTable()
  const { id } = req.params
  const { email } = req.body

  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE notification_id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Notification record not found.' })
    }

    const notif = rows[0]
    const targetEmail = (email || notif.recipient_email || '').trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ status: 'error', message: 'A valid Gmail address is required to dispatch this notice.' })
    }

    const result = await sendNotificationGmail(notif, targetEmail)
    if (result.success) {
      res.json({ status: 'success', message: `Notification successfully emailed to ${targetEmail}!`, messageId: result.messageId })
    } else {
      res.status(500).json({ status: 'error', message: result.message || 'Failed to send Gmail message.' })
    }
  } catch (err) {
    console.error('Send Notification Email Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3. MARK SINGLE NOTIFICATION AS READ / UNREAD
router.put('/:id/read', async (req, res) => {
  await ensureNotificationsTable()
  const { id } = req.params
  const is_read = req.body.is_read !== undefined ? (req.body.is_read ? 1 : 0) : 1

  try {
    await pool.query('UPDATE notifications SET is_read = ? WHERE notification_id = ?', [is_read, id])
    res.json({ status: 'success', message: `Notification marked as ${is_read ? 'read' : 'unread'}.` })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 4. MARK ALL NOTIFICATIONS AS READ
router.put('/mark-all-read', async (req, res) => {
  await ensureNotificationsTable()
  const { role, email } = req.body

  try {
    let query = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0'
    const params = []

    if (role) {
      if (role === 'admin') {
        query += " AND (recipient_role = 'admin' OR recipient_role = 'all' OR recipient_role = 'staff')"
      } else if (role === 'staff') {
        query += " AND (recipient_role = 'staff' OR recipient_role = 'all' OR recipient_role = 'admin')"
      } else {
        query += " AND (recipient_role = ? OR recipient_role = 'all')"
        params.push(role)
      }
    }

    if (email && email.trim()) {
      query += ' AND LOWER(recipient_email) = ?'
      params.push(email.trim().toLowerCase())
    }

    await pool.query(query, params)
    res.json({ status: 'success', message: 'All matching notifications marked as read.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 5. DELETE A NOTIFICATION
router.delete('/:id', async (req, res) => {
  await ensureNotificationsTable()
  const { id } = req.params
  try {
    await pool.query('DELETE FROM notifications WHERE notification_id = ?', [id])
    res.json({ status: 'success', message: 'Notification deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
