import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { sendCustomerSMS, normalisePhilippineNumber } from './sms.routes.js'

const router = Router()

// STAFF USERS REST API ENDPOINTS (MARIADB INTEGRATION)
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, username, full_name, phone_number, role, title, shift_name, shift_hours, shift_days, shift_status, vehicle_type, plate_number, rider_status, created_at FROM users WHERE role != 'admin' ORDER BY user_id ASC"
    )
    res.json({ status: 'success', users })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/', async (req, res) => {
  const { username, full_name, phone_number, password, role, title, shift_name, shift_hours, shift_days, shift_status, vehicle_type, plate_number, rider_status } = req.body
  if (!username) {
    return res.status(400).json({ status: 'error', message: 'Username is required' })
  }
  try {
    const hashedPassword = await bcrypt.hash(password || 'password123', 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, full_name, phone_number, password, role, title, shift_name, shift_hours, shift_days, shift_status, vehicle_type, plate_number, rider_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        username.trim(),
        full_name ? full_name.trim() : username.trim(),
        phone_number ? phone_number.trim() : '+639067236264',
        hashedPassword,
        role || 'staff',
        title || (role === 'rider' ? 'Delivery Courier' : 'Staff Member'),
        shift_name || 'Day Shift',
        shift_hours || '08:00 AM - 05:00 PM',
        shift_days || 'Mon - Fri',
        shift_status || 'On Shift',
        vehicle_type || 'Motorcycle',
        plate_number || null,
        rider_status || (role === 'rider' ? 'Available' : 'Offline')
      ]
    )
    res.json({
      status: 'success',
      user_id: result.insertId,
      message: `${role === 'rider' ? 'Rider' : 'Staff'} user account "${full_name || username}" created!`
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. EVENT STAFF SCHEDULING & ROSTER ENDPOINTS
router.get('/event_roster', async (req, res) => {
  const { date, reservation_id } = req.query
  try {
    let sql = 'SELECT * FROM event_staff_roster WHERE 1=1'
    const params = []

    if (date) {
      sql += ' AND event_date = ?'
      params.push(date)
    }
    if (reservation_id) {
      sql += ' AND reservation_id = ?'
      params.push(reservation_id)
    }

    sql += ' ORDER BY event_date ASC, call_time ASC'
    const [rows] = await pool.query(sql, params)
    res.json({ status: 'success', roster: rows })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/event_roster', async (req, res) => {
  const {
    reservation_id,
    event_title,
    event_date,
    event_time,
    event_venue,
    user_id,
    staff_name,
    staff_role,
    phone_number,
    assigned_role,
    call_time,
    end_time,
    notes,
    status
  } = req.body

  if (!event_title || !event_date || !staff_name || !assigned_role) {
    return res.status(400).json({ status: 'error', message: 'Event title, date, staff name and assigned role are required.' })
  }

  try {
    // Conflict Detection Check: see if this staff member is already assigned on the same date
    const [conflicts] = await pool.query(
      'SELECT * FROM event_staff_roster WHERE staff_name = ? AND event_date = ?',
      [staff_name.trim(), event_date]
    )

    let hasConflict = false
    let conflictDetails = null
    if (conflicts.length > 0) {
      hasConflict = true
      conflictDetails = `Staff "${staff_name}" is already scheduled for "${conflicts[0].event_title}" (${conflicts[0].call_time || conflicts[0].event_time}) on ${event_date}.`
    }

    // Determine phone number: either from body or fallback to users table
    let staffPhone = phone_number ? phone_number.trim() : null
    if (!staffPhone) {
      const [uRows] = await pool.query(
        'SELECT phone_number FROM users WHERE user_id = ? OR full_name = ? OR username = ? LIMIT 1',
        [user_id || 0, staff_name.trim(), staff_name.trim()]
      )
      if (uRows.length > 0 && uRows[0].phone_number) {
        staffPhone = uRows[0].phone_number
      }
    }

    const [result] = await pool.query(
      `INSERT INTO event_staff_roster 
      (reservation_id, event_title, event_date, event_time, event_venue, user_id, staff_name, staff_role, phone_number, assigned_role, call_time, end_time, notes, status, sms_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unsent')`,
      [
        reservation_id || null,
        event_title.trim(),
        event_date,
        event_time || '11:30 AM',
        event_venue || 'Jo\'s Diner Hall',
        user_id || null,
        staff_name.trim(),
        staff_role || 'staff',
        staffPhone || '+639067236264',
        assigned_role.trim(),
        call_time || '09:00 AM',
        end_time || '04:00 PM',
        notes || null,
        status || 'Confirmed'
      ]
    )

    res.json({
      status: 'success',
      roster_id: result.insertId,
      message: `Assigned ${staff_name} as ${assigned_role}!`,
      hasConflict,
      conflictDetails
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/event_roster/:rosterId', async (req, res) => {
  const { rosterId } = req.params
  const {
    event_title,
    event_date,
    event_time,
    event_venue,
    staff_name,
    staff_role,
    phone_number,
    assigned_role,
    call_time,
    end_time,
    notes,
    status
  } = req.body

  try {
    await pool.query(
      `UPDATE event_staff_roster SET 
        event_title = COALESCE(?, event_title),
        event_date = COALESCE(?, event_date),
        event_time = COALESCE(?, event_time),
        event_venue = COALESCE(?, event_venue),
        staff_name = COALESCE(?, staff_name),
        staff_role = COALESCE(?, staff_role),
        phone_number = COALESCE(?, phone_number),
        assigned_role = COALESCE(?, assigned_role),
        call_time = COALESCE(?, call_time),
        end_time = COALESCE(?, end_time),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status)
       WHERE roster_id = ?`,
      [event_title, event_date, event_time, event_venue, staff_name, staff_role, phone_number, assigned_role, call_time, end_time, notes, status, rosterId]
    )
    res.json({ status: 'success', message: 'Event staff schedule updated successfully!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// Send On-Duty SMS Confirmation to a Staff Member
router.post('/event_roster/:rosterId/send-sms', async (req, res) => {
  const { rosterId } = req.params
  const { phone_number, custom_message } = req.body

  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.phone_number AS user_phone
       FROM event_staff_roster r
       LEFT JOIN users u ON r.user_id = u.user_id OR r.staff_name = u.full_name OR r.staff_name = u.username
       WHERE r.roster_id = ?`,
      [rosterId]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff roster assignment not found.' })
    }

    const assignment = rows[0]
    const rawPhone = (phone_number || assignment.phone_number || assignment.user_phone || '').trim()
    const cleanPhone = normalisePhilippineNumber(rawPhone)

    if (!cleanPhone) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid or missing phone number for ${assignment.staff_name}. Please provide a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).`
      })
    }

    const formattedDate = assignment.event_date
      ? new Date(assignment.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Scheduled Event Date'

    const callTimeDisplay = assignment.call_time
      ? (assignment.end_time ? `${assignment.call_time} - ${assignment.end_time}` : assignment.call_time)
      : assignment.event_time || 'TBA'

    const defaultMessage = `[Jo's Diner Duty Confirmation]
Hello ${assignment.staff_name}! You are confirmed ON DUTY for "${assignment.event_title}".
Date: ${formattedDate}
Call Time: ${callTimeDisplay}
Role: ${assignment.assigned_role}
Venue: ${assignment.event_venue || "Jo's Diner Ballroom"}
${assignment.notes ? `Instructions: ${assignment.notes}\n` : ''}Please arrive 15 mins before call time. - Jo's Diner Team`

    const messageToSend = custom_message && custom_message.trim() ? custom_message.trim() : defaultMessage

    // Dispatch SMS via primary HttpSMS or backup gateway
    console.log(`[Staff SMS] Sending duty confirmation to ${assignment.staff_name} (${cleanPhone})...`)
    const smsResult = await sendCustomerSMS(cleanPhone, messageToSend)

    // Update assignment record in database
    await pool.query(
      `UPDATE event_staff_roster 
       SET phone_number = ?, last_sms_sent_at = NOW(), sms_status = 'sent' 
       WHERE roster_id = ?`,
      [cleanPhone, rosterId]
    )

    // Create an in-app notification for the staff member
    try {
      await pool.query(
        `INSERT INTO notifications (recipient_role, title, message, type, is_read, created_at)
         VALUES ('staff', ?, ?, 'duty_confirmation', 0, NOW())`,
        [
          `Duty Confirmed: ${assignment.event_title}`,
          `You are confirmed on duty as ${assignment.assigned_role} for ${assignment.event_title} on ${formattedDate} (${callTimeDisplay}).`
        ]
      )
    } catch (notifErr) {
      console.warn('[Staff SMS] In-app notification warning:', notifErr.message)
    }

    res.json({
      status: 'success',
      message: `Duty confirmation SMS sent to ${assignment.staff_name} (${cleanPhone})!`,
      sms_status: 'sent',
      last_sms_sent_at: new Date().toISOString(),
      phone_number: cleanPhone,
      smsResult
    })
  } catch (err) {
    console.error('[Staff SMS] Error dispatching SMS:', err)
    try {
      await pool.query("UPDATE event_staff_roster SET sms_status = 'failed' WHERE roster_id = ?", [rosterId])
    } catch (e) {}
    res.status(500).json({ status: 'error', message: err.message || 'Failed to dispatch SMS notification.' })
  }
})

// Bulk Send On-Duty SMS to All Staff for a Specific Event
router.post('/event_roster/event-bulk-sms', async (req, res) => {
  const { reservation_id, event_title, event_date } = req.body

  try {
    let sql = `SELECT r.*, u.phone_number AS user_phone
               FROM event_staff_roster r
               LEFT JOIN users u ON r.user_id = u.user_id OR r.staff_name = u.full_name OR r.staff_name = u.username
               WHERE 1=1`
    const params = []

    if (reservation_id) {
      sql += ' AND r.reservation_id = ?'
      params.push(reservation_id)
    } else if (event_title && event_date) {
      sql += ' AND r.event_title = ? AND r.event_date = ?'
      params.push(event_title, event_date)
    } else {
      return res.status(400).json({ status: 'error', message: 'Event reservation ID or Title and Date required.' })
    }

    const [roster] = await pool.query(sql, params)
    if (!roster || roster.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No staff members assigned to this event.' })
    }

    let sentCount = 0
    const results = []

    for (const assignment of roster) {
      const rawPhone = (assignment.phone_number || assignment.user_phone || '').trim()
      const cleanPhone = normalisePhilippineNumber(rawPhone)

      if (!cleanPhone) {
        results.push({ staff_name: assignment.staff_name, status: 'skipped', reason: 'Missing valid phone number' })
        continue
      }

      const formattedDate = assignment.event_date
        ? new Date(assignment.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'Scheduled Event Date'

      const callTimeDisplay = assignment.call_time
        ? (assignment.end_time ? `${assignment.call_time} - ${assignment.end_time}` : assignment.call_time)
        : assignment.event_time || 'TBA'

      const message = `[Jo's Diner Duty Confirmation]
Hello ${assignment.staff_name}! You are confirmed ON DUTY for "${assignment.event_title}".
Date: ${formattedDate}
Call Time: ${callTimeDisplay}
Role: ${assignment.assigned_role}
Venue: ${assignment.event_venue || "Jo's Diner Ballroom"}
${assignment.notes ? `Instructions: ${assignment.notes}\n` : ''}Please arrive 15 mins before call time. - Jo's Diner Team`

      try {
        await sendCustomerSMS(cleanPhone, message)
        await pool.query(
          `UPDATE event_staff_roster 
           SET phone_number = ?, last_sms_sent_at = NOW(), sms_status = 'sent' 
           WHERE roster_id = ?`,
          [cleanPhone, assignment.roster_id]
        )
        sentCount++
        results.push({ staff_name: assignment.staff_name, phone: cleanPhone, status: 'sent' })
      } catch (smsErr) {
        results.push({ staff_name: assignment.staff_name, status: 'failed', error: smsErr.message })
      }
    }

    res.json({
      status: 'success',
      message: `Dispatched duty confirmation SMS to ${sentCount} of ${roster.length} staff members!`,
      sentCount,
      totalStaff: roster.length,
      results
    })
  } catch (err) {
    console.error('[Staff Bulk SMS] Error dispatching bulk SMS:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/event_roster/:rosterId', async (req, res) => {
  const { rosterId } = req.params
  try {
    await pool.query('DELETE FROM event_staff_roster WHERE roster_id = ?', [rosterId])
    res.json({ status: 'success', message: 'Staff schedule assignment removed.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { username, full_name, phone_number, role, title, shift_name, shift_hours, shift_days, shift_status, vehicle_type, plate_number, rider_status } = req.body
  try {
    await pool.query(
      `UPDATE users SET 
        username = COALESCE(?, username), 
        full_name = COALESCE(?, full_name),
        phone_number = COALESCE(?, phone_number),
        role = COALESCE(?, role), 
        title = COALESCE(?, title),
        shift_name = COALESCE(?, shift_name),
        shift_hours = COALESCE(?, shift_hours),
        shift_days = COALESCE(?, shift_days),
        shift_status = COALESCE(?, shift_status),
        vehicle_type = COALESCE(?, vehicle_type),
        plate_number = COALESCE(?, plate_number),
        rider_status = COALESCE(?, rider_status)
       WHERE user_id = ?`,
      [username, full_name, phone_number, role, title, shift_name, shift_hours, shift_days, shift_status, vehicle_type, plate_number, rider_status, id]
    )
    res.json({ status: 'success', message: 'User profile updated in database!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM users WHERE user_id = ?', [id])
    res.json({ status: 'success', message: 'Staff user account removed.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
