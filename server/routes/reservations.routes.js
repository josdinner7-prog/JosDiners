import { Router } from 'express'
import { pool } from '../config/db.js'
import { sendReservationQREmail, sendRejectionEmail, sendCompletionEmail } from '../utils/mailer.js'
import { createNotificationRecord } from './notifications.routes.js'
import { sendCustomerSMS } from './sms.routes.js'

const router = Router()

// Default Standard Time Slots Preset (used if not configured in DB)
const defaultTimeSlots = [
  { time: '11:00 AM', period: 'Lunch', enabled: true },
  { time: '12:30 PM', period: 'Lunch', enabled: true },
  { time: '02:00 PM', period: 'Lunch', enabled: true },
  { time: '05:30 PM', period: 'Dinner', enabled: true },
  { time: '07:00 PM', period: 'Dinner', enabled: true },
  { time: '08:30 PM', period: 'Dinner', enabled: true }
]

// 0. RESERVATION SETTINGS ENDPOINTS (MUST BE REGISTERED BEFORE /:id ROUTES)
const handleGetSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservation_settings LIMIT 1')
    if (rows.length === 0) {
      const defaultSlotsJson = JSON.stringify(defaultTimeSlots)
      const [insertRes] = await pool.query(
        `INSERT INTO reservation_settings (max_guests_per_slot, max_tables, lunch_slot_open, dinner_slot_open, late_slot_open, time_slots_json, blocked_dates_json, date_overrides_json)
         VALUES (50, 15, 1, 1, 1, ?, '[]', '{}')`,
        [defaultSlotsJson]
      )
      return res.json({
        status: 'success',
        settings: {
          setting_id: insertRes.insertId,
          max_guests_per_slot: 50,
          max_tables: 15,
          lunch_slot_open: 1,
          dinner_slot_open: 1,
          late_slot_open: 1,
          time_slots: defaultTimeSlots,
          blocked_dates: [],
          date_overrides: {}
        }
      })
    }

    const s = rows[0]
    let blocked_dates = []
    let date_overrides = {}
    let time_slots = defaultTimeSlots

    try {
      blocked_dates = s.blocked_dates_json ? JSON.parse(s.blocked_dates_json) : []
    } catch (e) {
      blocked_dates = []
    }

    try {
      date_overrides = s.date_overrides_json ? JSON.parse(s.date_overrides_json) : {}
    } catch (e) {
      date_overrides = {}
    }

    if (s.time_slots_json) {
      try {
        const parsed = JSON.parse(s.time_slots_json)
        if (Array.isArray(parsed)) {
          time_slots = parsed
        }
      } catch (e) {
        time_slots = []
      }
    }

    res.json({
      status: 'success',
      settings: {
        ...s,
        time_slots,
        blocked_dates,
        date_overrides
      }
    })
  } catch (err) {
    console.error('Get Settings Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
}

const handlePutSettings = async (req, res) => {
  const { max_guests_per_slot, max_tables, lunch_slot_open, dinner_slot_open, late_slot_open, time_slots, blocked_dates, date_overrides } = req.body
  try {
    const blocked_json = JSON.stringify(blocked_dates || [])
    const overrides_json = JSON.stringify(date_overrides || {})
    const slots_json = Array.isArray(time_slots) ? JSON.stringify(time_slots) : (time_slots ? JSON.stringify(time_slots) : '[]')
    const [existing] = await pool.query('SELECT setting_id FROM reservation_settings LIMIT 1')

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO reservation_settings (max_guests_per_slot, max_tables, lunch_slot_open, dinner_slot_open, late_slot_open, time_slots_json, blocked_dates_json, date_overrides_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [max_guests_per_slot || 50, max_tables || 15, lunch_slot_open ?? 1, dinner_slot_open ?? 1, late_slot_open ?? 1, slots_json, blocked_json, overrides_json]
      )
    } else {
      await pool.query(
        `UPDATE reservation_settings SET 
          max_guests_per_slot = COALESCE(?, max_guests_per_slot),
          max_tables = COALESCE(?, max_tables),
          lunch_slot_open = COALESCE(?, lunch_slot_open),
          dinner_slot_open = COALESCE(?, dinner_slot_open),
          late_slot_open = COALESCE(?, late_slot_open),
          time_slots_json = ?,
          blocked_dates_json = ?,
          date_overrides_json = ?
         WHERE setting_id = ?`,
        [max_guests_per_slot, max_tables, lunch_slot_open, dinner_slot_open, late_slot_open, slots_json, blocked_json, overrides_json, existing[0].setting_id]
      )
    }
    res.json({ status: 'success', message: 'Reservation availability, time slots & capacity settings updated in database!' })
  } catch (err) {
    console.error('Update Settings Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
}

router.get('/settings', handleGetSettings)
router.put('/settings', handlePutSettings)
router.get('/reservation_settings', handleGetSettings)
router.put('/reservation_settings', handlePutSettings)

// 1. GET RESERVATIONS (Supports role, email, phone filtering for customer isolation)
router.get('/', async (req, res) => {
  const { email, phone, role, category, status } = req.query
  try {
    // If requesting as customer role
    if (role === 'customer') {
      if (!email && !phone) {
        return res.json({ status: 'success', reservations: [] })
      }
      let query = 'SELECT * FROM reservations WHERE 1=1'
      const params = []
      if (email && email.trim()) {
        query += ' AND LOWER(email) = ?'
        params.push(email.trim().toLowerCase())
      }
      if (phone && phone.trim()) {
        query += ' AND contact_phone LIKE ?'
        params.push(`%${phone.trim()}%`)
      }
      if (category) {
        query += ' AND category = ?'
        params.push(category)
      }
      if (status && status !== 'all') {
        query += ' AND status = ?'
        params.push(status)
      }
      query += ' ORDER BY reservation_id DESC'
      const [rows] = await pool.query(query, params)
      return res.json({ status: 'success', reservations: rows || [] })
    }

    let query = 'SELECT * FROM reservations WHERE 1=1'
    const params = []

    if (email && email.trim()) {
      query += ' AND LOWER(email) = ?'
      params.push(email.trim().toLowerCase())
    }
    if (phone && phone.trim()) {
      query += ' AND contact_phone LIKE ?'
      params.push(`%${phone.trim()}%`)
    }
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    if (status && status !== 'all') {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY reservation_id DESC'
    const [rows] = await pool.query(query, params)
    res.json({ status: 'success', reservations: rows || [] })
  } catch (err) {
    console.error('Reservations Query Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message, reservations: [] })
  }
})

// 2. CREATE NEW RESERVATION (Saved directly to MySQL)
router.post('/', async (req, res) => {
  const {
    reservation_code,
    contact_name,
    contact_phone,
    email,
    event_type,
    category,
    hall_name,
    package_name,
    event_date,
    event_time,
    guest_count,
    guests,
    total_amount,
    status,
    special_requests,
    venue_address,
    venue_type,
    venue_name,
    venue_city,
    venue_contact_person,
    venue_contact_phone
  } = req.body

  const count = parseInt(guest_count || guests || 2, 10)
  const name = contact_name || req.body.contact_person || 'Guest Customer'
  const phone = contact_phone || req.body.phone || 'N/A'
  const code = reservation_code || `RES-${Math.floor(10000 + Math.random() * 90000)}`
  const time = event_time || '12:00 PM'
  const total = parseFloat(total_amount || 0)
  const st = status || 'Pending'
  const vType = venue_type || (category === 'catering' ? 'customer_venue' : 'diner_function_hall')
  const vName = venue_name || hall_name || ''
  const vCity = venue_city || 'Polomolok'
  const vContact = venue_contact_person || name
  const vPhone = venue_contact_phone || phone

  try {
    // Robust Duplicate booking check: same user (email/phone/name), same date, same time slot
    const userEmail = (email || '').trim().toLowerCase()
    const cleanPhoneDigits = (phone || '').replace(/\D/g, '')
    const userPhone10 = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits
    const userName = (name || '').trim().toLowerCase()
    const cleanTime = (time || '').replace(/\s+/g, '').toUpperCase()

    const [existing] = await pool.query(
      `SELECT reservation_id, reservation_code, event_date, event_time, status 
       FROM reservations 
       WHERE (DATE(event_date) = DATE(?) OR DATE_FORMAT(event_date, '%Y-%m-%d') = ?)
         AND (
           REPLACE(UPPER(TRIM(COALESCE(event_time, ''))), ' ', '') = ?
           OR LOWER(TRIM(COALESCE(event_time, ''))) = LOWER(TRIM(?))
         )
         AND (
           (? != '' AND LOWER(TRIM(COALESCE(email, ''))) = ?)
           OR (? != '' AND RIGHT(REPLACE(REPLACE(REPLACE(COALESCE(contact_phone, ''), ' ', ''), '-', ''), '+', ''), 10) = ?)
           OR (? != '' AND LOWER(TRIM(COALESCE(contact_name, ''))) = ?)
         )
         AND status NOT IN ('Cancelled', 'Declined')
       LIMIT 1`,
      [
        event_date, event_date,
        cleanTime, time,
        userEmail, userEmail,
        userPhone10, userPhone10,
        userName, userName
      ]
    )

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A booking for this date (${event_date}) and time slot (${time}) already exists for this contact. Check your reservations list or pick another time.`,
        existing_code: existing[0].reservation_code
      })
    }

    const addonsRaw = req.body.addons_json || req.body.selected_addons
    const addonsJson = addonsRaw ? (typeof addonsRaw === 'string' ? addonsRaw : JSON.stringify(addonsRaw)) : null
    const addonsTotalVal = parseFloat(req.body.addons_total || 0)
    const eventName = req.body.event_name || req.body.title || req.body.occasion || event_type || 'Special Event'
    const qrToken = req.body.qr_token || `JOS-QR-${code}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const tableNumber = req.body.table_number || null

    let result
    try {
      const [res] = await pool.query(
        `INSERT INTO reservations 
          (reservation_code, qr_token, contact_name, contact_phone, email, event_type, event_name, category, hall_name, package_name, event_date, event_time, guest_count, total_amount, status, special_requests, venue_address, venue_type, venue_name, venue_city, venue_contact_person, venue_contact_phone, addons_json, addons_total, table_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          qrToken,
          name,
          phone,
          email || '',
          event_type || 'Table Reservation',
          eventName,
          category || 'table',
          hall_name || 'Main Dining Area',
          package_name || 'Casual Table Reservation',
          event_date,
          time,
          count,
          total,
          st,
          special_requests || '',
          venue_address || '',
          vType,
          vName,
          vCity,
          vContact,
          vPhone,
          addonsJson,
          addonsTotalVal,
          tableNumber
        ]
      )
      result = res
    } catch (colErr) {
      try {
        const [res] = await pool.query(
          `INSERT INTO reservations 
            (reservation_code, qr_token, contact_name, contact_phone, email, event_type, event_name, category, hall_name, package_name, event_date, event_time, guest_count, total_amount, status, special_requests, venue_address, addons_json, addons_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            qrToken,
            name,
            phone,
            email || '',
            event_type || 'Table Reservation',
            eventName,
            category || 'table',
            hall_name || 'Main Dining Area',
            package_name || 'Casual Table Reservation',
            event_date,
            time,
            count,
            total,
            st,
            special_requests || '',
            venue_address || '',
            addonsJson,
            addonsTotalVal
          ]
        )
        result = res
      } catch (fallbackErr) {
        const [res] = await pool.query(
          `INSERT INTO reservations 
            (reservation_code, contact_name, contact_phone, email, event_type, event_name, category, hall_name, package_name, event_date, event_time, guest_count, total_amount, status, special_requests, venue_address, addons_json, addons_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [code, name, phone, email || '', event_type || 'Table Reservation', eventName, category || 'table', hall_name || 'Main Dining Area', package_name || 'Casual Table Reservation', event_date, time, count, total, st, special_requests || '', venue_address || '', addonsJson, addonsTotalVal]
        )
        result = res
      }
    }

    let emailSent = false
    // Automatically generate & send QR pass email ONLY after reservation is Confirmed
    if (st === 'Confirmed' && email && email.includes('@')) {
      sendReservationQREmail({
        reservation_id: result.insertId,
        reservation_code: code,
        qr_token: qrToken,
        contact_name: name,
        contact_phone: phone,
        email: email,
        event_type: event_type,
        event_name: eventName,
        category: category,
        hall_name: hall_name,
        package_name: package_name,
        event_date: event_date,
        event_time: time,
        guest_count: count,
        total_amount: total,
        status: st,
        special_requests: special_requests,
        venue_address: venue_address
      }).catch(err => {
        console.warn(`[Reservations] Automatic QR email dispatch notice for ${code}:`, err.message)
      })
      emailSent = true
    }

    // Automatically emit notifications for Notification Center
    createNotificationRecord({
      recipient_role: 'admin',
      reservation_id: result.insertId,
      reservation_code: code,
      type: 'approval_notice',
      title: 'New Reservation Request Pending Approval',
      message: `Guest ${name} requested a ${event_type || 'Table Reservation'} on ${event_date} at ${time} (${count} Pax).`,
      action_url: '/admin/reservations',
      metadata: { guest_name: name, date: event_date, time: time, count: count, total: total }
    }).catch(() => { })

    if (email && email.includes('@')) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: email,
        reservation_id: result.insertId,
        reservation_code: code,
        type: 'booking_update',
        title: 'Booking Request Received',
        message: `Your reservation request #${code} for ${event_date} at ${time} has been received and is currently Pending Approval.`,
        action_url: '/notifications',
        metadata: { status: st, date: event_date, time: time, count: count }
      }).catch(() => { })
    }

    res.json({
      status: 'success',
      message: st === 'Confirmed'
        ? 'Reservation confirmed and saved!'
        : 'Reservation request submitted! Pending approval by Staff or Admin.',
      reservation_id: result.insertId,
      reservation_code: code,
      qr_token: qrToken,
      booking_status: st,
      email_sent: emailSent
    })
  } catch (err) {
    console.error('Create Reservation Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2.5. VERIFY RESERVATION BY CODE OR QR TOKEN
const handleVerifyReservation = async (req, res) => {
  const codeParam = (req.params.code || req.body.code || req.query.code || '').trim()
  if (!codeParam) {
    return res.status(400).json({ status: 'error', message: 'Reservation code or QR token is required.' })
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM reservations 
       WHERE reservation_code = ? 
          OR qr_token = ? 
          OR reservation_code LIKE ? 
          OR qr_token LIKE ?
          OR reservation_id = ?
       ORDER BY reservation_id DESC
       LIMIT 1`,
      [codeParam, codeParam, `%${codeParam}%`, `%${codeParam}%`, isNaN(Number(codeParam)) ? 0 : Number(codeParam)]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        status: 'not_found',
        message: `No reservation found matching "${codeParam}". Please verify the code or QR ticket.`
      })
    }

    const r = rows[0]
    const isAlreadySeated = (r.status || '').toLowerCase() === 'seated' || Boolean(r.checked_in_at)
    const isCancelled = ['cancelled', 'declined'].includes((r.status || '').toLowerCase())
    const isPending = (r.status || '').toLowerCase() === 'pending'

    if (isPending) {
      return res.json({
        status: 'pending_unconfirmed',
        is_duplicate: false,
        message: `⏳ UNCONFIRMED RESERVATION: Booking #${r.reservation_code || r.reservation_id} is still PENDING APPROVAL. It cannot be scanned or seated until approved by Staff or Admin.`,
        reservation: r
      })
    }

    if (isAlreadySeated) {
      return res.json({
        status: 'already_checked_in',
        is_duplicate: true,
        message: `⚠️ DUPLICATE NOTICE: Reservation #${r.reservation_code || r.reservation_id} was already checked in!`,
        checked_in_at: r.checked_in_at || 'Earlier Today',
        checked_in_by: r.checked_in_by || 'Front Desk Staff',
        reservation: r
      })
    }

    if (isCancelled) {
      return res.json({
        status: 'cancelled',
        is_duplicate: false,
        message: `⛔ Reservation #${r.reservation_code || r.reservation_id} is CANCELLED.`,
        reservation: r
      })
    }

    return res.json({
      status: 'valid',
      is_duplicate: false,
      message: `✓ Reservation #${r.reservation_code || r.reservation_id} is verified and confirmed for ${r.contact_name}.`,
      reservation: r
    })
  } catch (err) {
    console.error('Verify Reservation Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
}

router.get('/verify/:code', handleVerifyReservation)
router.post('/verify', handleVerifyReservation)

// 2.6. INSTANT CHECK-IN / SEAT PARTY VIA QR SCAN
router.post('/check-in', async (req, res) => {
  const code = (req.body.code || req.body.reservation_code || req.body.qr_token || '').trim()
  const staffName = req.body.staff_name || 'Staff'

  if (!code) {
    return res.status(400).json({ status: 'error', message: 'Reservation code is required for check-in.' })
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM reservations 
       WHERE reservation_code = ? 
          OR qr_token = ? 
          OR reservation_id = ?
       LIMIT 1`,
      [code, code, isNaN(Number(code)) ? 0 : Number(code)]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'not_found', message: 'Reservation not found.' })
    }

    const r = rows[0]
    if ((r.status || '').toLowerCase() === 'pending') {
      return res.status(400).json({
        status: 'pending_unconfirmed',
        message: `⛔ Check-in blocked: Reservation #${r.reservation_code || r.reservation_id} is still PENDING APPROVAL. Admin or Staff must confirm this booking before the guest can be seated.`,
        reservation: r
      })
    }

    if ((r.status || '').toLowerCase() === 'seated' || Boolean(r.checked_in_at)) {
      return res.status(409).json({
        status: 'already_checked_in',
        message: `Duplicate check-in prevented! Guest ${r.contact_name} was already checked in at ${r.checked_in_at || 'earlier today'} by ${r.checked_in_by || 'Staff'}.`,
        reservation: r
      })
    }

    try {
      await pool.query(
        `UPDATE reservations 
         SET status = 'Seated', checked_in_at = NOW(), checked_in_by = ? 
         WHERE reservation_id = ?`,
        [staffName, r.reservation_id]
      )
    } catch (e) {
      await pool.query(
        `UPDATE reservations SET status = 'Seated' WHERE reservation_id = ?`,
        [r.reservation_id]
      )
    }

    const [updatedRows] = await pool.query(
      `SELECT * FROM reservations WHERE reservation_id = ?`,
      [r.reservation_id]
    )

    const updated = updatedRows[0] || { ...r, status: 'Seated', checked_in_at: new Date().toISOString(), checked_in_by: staffName }

    // Emit Staff & Admin Notification: Guest Seated
    createNotificationRecord({
      recipient_role: 'staff',
      reservation_id: r.reservation_id,
      reservation_code: r.reservation_code,
      type: 'booking_update',
      title: 'Guest Seated via QR Check-In',
      message: `Party for ${r.contact_name} (${r.guest_count || 2} Pax, #${r.reservation_code}) was checked in and seated by ${staffName}.`,
      action_url: '/staff'
    }).catch(() => { })

    res.json({
      status: 'success',
      message: `🎉 Check-in confirmed! Party of ${r.guest_count} for ${r.contact_name} is now Seated.`,
      reservation: updated
    })
  } catch (err) {
    console.error('Check-in Reservation Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2.7. SEND / RESEND QR CODE EMAIL TO GUEST
router.post('/send-qr-email', async (req, res) => {
  const { reservation_id, reservation_code, code, email } = req.body

  const lookupVal = code || reservation_code || ''
  const idVal = reservation_id || (isNaN(Number(lookupVal)) ? 0 : Number(lookupVal))

  try {
    const [rows] = await pool.query(
      `SELECT * FROM reservations 
       WHERE reservation_id = ? 
          OR reservation_code = ? 
          OR qr_token = ?
       LIMIT 1`,
      [idVal, lookupVal, lookupVal]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' })
    }

    const r = rows[0]
    const targetEmail = (email || r.email || '').trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ status: 'error', message: 'A valid email address is required to send the QR pass.' })
    }

    const emailResult = await sendReservationQREmail(r, targetEmail)
    res.json({
      status: 'success',
      message: `🎟️ Entry QR code pass has been emailed to ${targetEmail}!`,
      emailResult
    })
  } catch (err) {
    console.error('Send QR Email Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message || 'Failed to send QR code email.' })
  }
})

// 2.8. SEND QR EMAIL BY RESERVATION ID
router.post('/:id/send-email', async (req, res) => {
  const { id } = req.params
  const { email } = req.body

  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' })
    }

    const r = rows[0]
    const targetEmail = (email || r.email || '').trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ status: 'error', message: 'A valid email address is required.' })
    }

    const emailResult = await sendReservationQREmail(r, targetEmail)
    res.json({
      status: 'success',
      message: `🎟️ Entry QR code pass sent to ${targetEmail}!`,
      emailResult
    })
  } catch (err) {
    console.error('Send Email by ID Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message || 'Failed to send email.' })
  }
})

// 3. UPDATE RESERVATION
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    contact_name,
    contact_phone,
    email,
    event_type,
    category,
    hall_name,
    package_name,
    event_date,
    event_time,
    guest_count,
    total_amount,
    status,
    special_requests,
    venue_address,
    table_number,
    send_email
  } = req.body

  try {
    const hasTableNumber = Object.prototype.hasOwnProperty.call(req.body, 'table_number')
    await pool.query(
      `UPDATE reservations SET 
        contact_name = COALESCE(?, contact_name),
        contact_phone = COALESCE(?, contact_phone),
        email = COALESCE(?, email),
        event_type = COALESCE(?, event_type),
        category = COALESCE(?, category),
        hall_name = COALESCE(?, hall_name),
        package_name = COALESCE(?, package_name),
        event_date = COALESCE(?, event_date),
        event_time = COALESCE(?, event_time),
        guest_count = COALESCE(?, guest_count),
        total_amount = COALESCE(?, total_amount),
        status = COALESCE(?, status),
        special_requests = COALESCE(?, special_requests),
        venue_address = COALESCE(?, venue_address),
        table_number = CASE WHEN ? = 1 THEN ? ELSE table_number END
       WHERE reservation_id = ? OR reservation_code = ?`,
      [
        contact_name,
        contact_phone,
        email,
        event_type,
        category,
        hall_name,
        package_name,
        event_date,
        event_time,
        guest_count,
        total_amount,
        status,
        special_requests,
        venue_address,
        hasTableNumber ? 1 : 0,
        table_number || null,
        isNaN(Number(id)) ? 0 : Number(id),
        id
      ]
    )

    // If status is updated to Confirmed, Declined/Cancelled, or Completed, dispatch Gmail, SMS, and in-app notifications
    let emailDispatched = false
    if (status === 'Confirmed' || send_email) {
      const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1', [id])
      if (rows && rows.length > 0) {
        let r = rows[0]
        if (!r.qr_token) {
          const newToken = `JOS-QR-${r.reservation_code || id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          await pool.query('UPDATE reservations SET qr_token = ? WHERE reservation_id = ?', [newToken, id])
          r.qr_token = newToken
        }
        if (r.email && r.email.includes('@')) {
          sendReservationQREmail(r).catch(e => console.warn('[Reservations] Confirmation email dispatch warning:', e.message))
          emailDispatched = true
        }

        // SMS notification
        if (r.contact_phone) {
          sendCustomerSMS(
            r.contact_phone,
            `[Jo's Diner] Great news, ${r.contact_name || 'Valued Guest'}! Your reservation #${r.reservation_code} is CONFIRMED. Your QR entry pass was sent to your email. See you soon!`
          ).catch(e => console.warn('[Reservations] Confirm SMS dispatch warning:', e.message))
        }

        // Customer Notification Center record
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: r.email || null,
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'approval_notice',
          title: 'Reservation Approved & Confirmed',
          message: `Your reservation #${r.reservation_code} for ${r.event_date || 'your booking date'} has been approved and confirmed! Your QR entry pass is ready.`,
          action_url: '/notifications',
          metadata: { status: 'Confirmed', qr_token: r.qr_token },
          skip_email: true
        }).catch(() => { })

        // Admin Notification
        createNotificationRecord({
          recipient_role: 'admin',
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'approval_notice',
          title: 'Reservation Confirmed',
          message: `Reservation #${r.reservation_code} for ${r.contact_name} was confirmed. QR pass sent.`,
          action_url: '/admin/reservations',
          metadata: { status: 'Confirmed' }
        }).catch(() => { })
      }
    } else if (status === 'Cancelled' || status === 'Declined') {
      const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1', [id])
      if (rows && rows.length > 0) {
        const r = rows[0]
        const reason = req.body.decline_reason || req.body.reason || ''

        // Send branded rejection email
        if (r.email && r.email.includes('@')) {
          sendRejectionEmail(r, reason).catch(e => console.warn('[Reservations] Rejection email dispatch warning:', e.message))
          emailDispatched = true
        }

        // SMS notification
        if (r.contact_phone) {
          const declineMsg = reason
            ? `[Jo's Diner] Notice: Your reservation #${r.reservation_code} has been ${status.toLowerCase()}. Reason: ${reason}. Please visit our site for details.`
            : `[Jo's Diner] Notice: Your reservation #${r.reservation_code} has been ${status.toLowerCase()}. Please check your email or visit our website for details.`
          sendCustomerSMS(r.contact_phone, declineMsg).catch(e => console.warn('[Reservations] Decline SMS dispatch warning:', e.message))
        }

        // Customer Notification Center record
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: r.email || null,
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'cancellation_alert',
          title: `Reservation ${status}`,
          message: reason
            ? `Your reservation #${r.reservation_code} has been ${status.toLowerCase()}. Reason: ${reason}`
            : `Notice: Your reservation #${r.reservation_code} for ${r.event_date || 'your booking'} has been ${status.toLowerCase()}.`,
          action_url: '/notifications',
          metadata: { status, reason },
          skip_email: true
        }).catch(() => { })

        // Admin Notification
        createNotificationRecord({
          recipient_role: 'admin',
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'cancellation_alert',
          title: `Reservation ${status}`,
          message: `Reservation #${r.reservation_code} for ${r.contact_name} was marked as ${status}.`,
          action_url: '/admin/reservations',
          metadata: { status }
        }).catch(() => { })
      }
    } else if (status === 'Completed') {
      const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1', [id])
      if (rows && rows.length > 0) {
        const r = rows[0]

        // Send branded thank-you completion email
        if (r.email && r.email.includes('@')) {
          sendCompletionEmail(r).catch(e => console.warn('[Reservations] Completion email dispatch warning:', e.message))
          emailDispatched = true
        }

        // SMS notification
        if (r.contact_phone) {
          sendCustomerSMS(
            r.contact_phone,
            `[Jo's Diner] Thank you for dining with us, ${r.contact_name || 'Valued Guest'}! Your reservation #${r.reservation_code} is marked as Completed. We hope to see you again soon!`
          ).catch(e => console.warn('[Reservations] Complete SMS dispatch warning:', e.message))
        }

        // Customer Notification Center record
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: r.email || null,
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'completion_notice',
          title: 'Visit Completed — Thank You!',
          message: `Thank you for dining with Jo's Diner! Your reservation #${r.reservation_code} has been completed. We look forward to seeing you again!`,
          action_url: '/notifications',
          metadata: { status: 'Completed' },
          skip_email: true
        }).catch(() => { })

        // Admin Notification
        createNotificationRecord({
          recipient_role: 'admin',
          reservation_id: id,
          reservation_code: r.reservation_code,
          type: 'completion_notice',
          title: 'Reservation Completed',
          message: `Reservation #${r.reservation_code} for ${r.contact_name} has been marked as Completed.`,
          action_url: '/admin/reservations',
          metadata: { status: 'Completed' }
        }).catch(() => { })
      }
    }

    res.json({
      status: 'success',
      message: status === 'Confirmed'
        ? 'Reservation Confirmed! Scannable QR code entry pass automatically emailed to customer and SMS sent.'
        : `Reservation marked as ${status}! Notifications and email dispatched.`,
      email_sent: emailDispatched
    })
  } catch (err) {
    console.error('Update Reservation Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3.1. CONFIRM RESERVATION AND DISPATCH QR CODE PASS VIA GMAIL
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' })
    }

    let r = rows[0]
    const qrToken = r.qr_token || `JOS-QR-${r.reservation_code || id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    await pool.query(
      'UPDATE reservations SET status = ?, qr_token = ?, checked_in_at = NULL, checked_in_by = NULL WHERE reservation_id = ?',
      ['Confirmed', qrToken, id]
    )
    r.status = 'Confirmed'
    r.qr_token = qrToken
    r.checked_in_at = null
    r.checked_in_by = null

    let emailSent = false
    if (r.email && r.email.includes('@')) {
      sendReservationQREmail(r).catch(e => console.warn('[Reservations] Confirm email warning:', e.message))
      emailSent = true
    }

    // Dispatch SMS confirmation
    if (r.contact_phone) {
      sendCustomerSMS(
        r.contact_phone,
        `[Jo's Diner] Great news, ${r.contact_name || 'Valued Guest'}! Your reservation #${r.reservation_code} is CONFIRMED. Your QR entry pass was emailed to you. See you soon!`
      ).catch(e => console.warn('[Reservations] Confirm SMS warning:', e.message))
    }

    // Emit Customer Notification: Reservation Confirmed & QR Pass Ready
    createNotificationRecord({
      recipient_role: 'customer',
      recipient_email: r.email || null,
      reservation_id: id,
      reservation_code: r.reservation_code,
      type: 'approval_notice',
      title: 'Reservation Officially Confirmed!',
      message: `Great news, ${r.contact_name}! Your booking #${r.reservation_code} has been approved and confirmed. Your QR entry pass is ready.`,
      action_url: '/notifications',
      metadata: { status: 'Confirmed', qr_token: qrToken },
      skip_email: true
    }).catch(() => { })

    // Emit Admin Notification
    createNotificationRecord({
      recipient_role: 'admin',
      reservation_id: id,
      reservation_code: r.reservation_code,
      type: 'approval_notice',
      title: 'Reservation Approved & QR Dispatched',
      message: `Reservation #${r.reservation_code} for ${r.contact_name} was confirmed. QR pass sent to ${r.email || 'customer'}.`,
      action_url: '/admin/reservations'
    }).catch(() => { })

    res.json({
      status: 'success',
      message: `Reservation #${r.reservation_code} Confirmed! Scannable QR pass sent to ${r.email || 'customer Gmail'}.`,
      email_sent: emailSent,
      reservation: r
    })
  } catch (err) {
    console.error('Confirm Reservation Route Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3.2. RESET CHECK-IN STATUS (Allows Staff/Admin to re-scan ticket)
router.post('/:id/reset-checkin', async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await pool.query(
      `SELECT * FROM reservations WHERE reservation_id = ? OR reservation_code = ? LIMIT 1`,
      [isNaN(Number(id)) ? 0 : Number(id), id]
    )
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' })
    }

    const r = rows[0]
    await pool.query(
      `UPDATE reservations 
       SET status = 'Confirmed', checked_in_at = NULL, checked_in_by = NULL 
       WHERE reservation_id = ?`,
      [r.reservation_id]
    )

    res.json({
      status: 'success',
      message: `Check-in status reset for Reservation #${r.reservation_code}! This QR code can now be scanned again.`,
      reservation: { ...r, status: 'Confirmed', checked_in_at: null, checked_in_by: null }
    })
  } catch (err) {
    console.error('Reset Check-In Route Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3.3. ASSIGN TABLE NUMBER TO RESERVATION
router.put('/:id/assign-table', async (req, res) => {
  const { id } = req.params
  const { table_number } = req.body
  try {
    await pool.query(
      'UPDATE reservations SET table_number = ? WHERE reservation_id = ? OR reservation_code = ?',
      [table_number || null, isNaN(Number(id)) ? 0 : Number(id), id]
    )

    // Notify customer if email exists
    const [rows] = await pool.query(
      'SELECT * FROM reservations WHERE reservation_id = ? OR reservation_code = ? LIMIT 1',
      [isNaN(Number(id)) ? 0 : Number(id), id]
    )
    if (rows && rows.length > 0 && rows[0].email && rows[0].email.includes('@')) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: rows[0].email,
        reservation_id: rows[0].reservation_id,
        reservation_code: rows[0].reservation_code,
        type: 'booking_update',
        title: table_number ? `Table Assigned: ${table_number}` : 'Table Assignment Updated',
        message: table_number 
          ? `Your dining table for reservation #${rows[0].reservation_code} has been assigned to ${table_number}.`
          : `Table assignment updated for reservation #${rows[0].reservation_code}.`,
        action_url: '/my-reservations'
      }).catch(() => { })
    }

    res.json({
      status: 'success',
      message: table_number ? `Assigned to ${table_number} successfully!` : 'Table assignment removed.',
      table_number: table_number || null
    })
  } catch (err) {
    console.error('Assign Table Route Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 4. DELETE RESERVATION
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM reservations WHERE reservation_id = ?', [id])
    res.json({ status: 'success', message: 'Reservation deleted from database.' })
  } catch (err) {
    console.error('Delete Reservation Error:', err.message)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export { handleGetSettings, handlePutSettings }
export default router
