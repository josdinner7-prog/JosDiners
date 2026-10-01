import { Router } from 'express'
import { pool } from '../config/db.js'
import { sendReservationQREmail, sendRejectionEmail, sendCompletionEmail } from '../utils/mailer.js'
import { createNotificationRecord } from './notifications.routes.js'
import { sendCustomerSMS } from './sms.routes.js'

const router = Router()

// 1. CATERING PACKAGES ENDPOINTS
router.get('/catering_packages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM catering_packages ORDER BY package_id ASC')
    const formatted = rows.map(pkg => {
      let features = []
      if (pkg.features_json) {
        try {
          features = typeof pkg.features_json === 'string' ? JSON.parse(pkg.features_json) : pkg.features_json
        } catch (e) {
          features = []
        }
      }

      let categoryAllowances = {}
      if (pkg.category_allowances_json) {
        try {
          categoryAllowances = typeof pkg.category_allowances_json === 'string' ? JSON.parse(pkg.category_allowances_json) : pkg.category_allowances_json
        } catch (e) {
          categoryAllowances = {}
        }
      }

      let packageDishes = []
      if (pkg.package_dishes_json) {
        try {
          packageDishes = typeof pkg.package_dishes_json === 'string' ? JSON.parse(pkg.package_dishes_json) : pkg.package_dishes_json
        } catch (e) {
          packageDishes = []
        }
      }

      return {
        ...pkg,
        package_price: parseFloat(pkg.package_price || 0),
        price_per_person: parseFloat(pkg.price_per_person || (pkg.package_price ? Math.round(pkg.package_price / (pkg.min_guests || 30)) : 500)),
        min_guests: parseInt(pkg.min_guests || 20, 10),
        max_guests: parseInt(pkg.max_guests || 100, 10),
        extra_guest_fee: pkg.extra_guest_fee !== null && pkg.extra_guest_fee !== undefined ? parseFloat(pkg.extra_guest_fee) : 0,
        prep_time: pkg.prep_time || '2 - 3 Hours',
        category_allowances: categoryAllowances,
        package_dishes: packageDishes,
        recommended_for: pkg.recommended_for || '',
        features,
        status: pkg.status || 'Available'
      }
    })
    res.json({ status: 'success', packages: formatted })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/catering_packages', async (req, res) => {
  const {
    package_name,
    description,
    package_image,
    package_price,
    price_per_person,
    min_guests,
    max_guests,
    extra_guest_fee,
    prep_time,
    category_allowances,
    package_dishes,
    recommended_for,
    features,
    status
  } = req.body

  if (!package_name) {
    return res.status(400).json({ status: 'error', message: 'Package Name is required.' })
  }

  const pPerPerson = parseFloat(price_per_person || (package_price ? package_price / (min_guests || 30) : 500))
  const pTotal = parseFloat(package_price || (pPerPerson * (min_guests || 30)))
  const pExtraFee = extra_guest_fee !== undefined && extra_guest_fee !== '' && extra_guest_fee !== null ? parseFloat(extra_guest_fee) : 0

  try {
    const [result] = await pool.query(
      `INSERT INTO catering_packages 
        (package_name, description, package_image, package_price, price_per_person, min_guests, max_guests, extra_guest_fee, prep_time, category_allowances_json, package_dishes_json, recommended_for, features_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        package_name.trim(),
        description || '',
        package_image || '',
        pTotal,
        pPerPerson,
        min_guests || 20,
        max_guests || 100,
        pExtraFee,
        prep_time || '2 - 3 Hours',
        category_allowances ? JSON.stringify(category_allowances) : JSON.stringify({}),
        package_dishes ? JSON.stringify(package_dishes) : JSON.stringify([]),
        recommended_for || '',
        features ? JSON.stringify(features) : JSON.stringify([]),
        status || 'Available'
      ]
    )
    res.json({ status: 'success', message: 'Package created successfully!', package_id: result.insertId })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/catering_packages/:id', async (req, res) => {
  const { id } = req.params
  const {
    package_name,
    description,
    package_image,
    package_price,
    price_per_person,
    min_guests,
    max_guests,
    extra_guest_fee,
    prep_time,
    category_allowances,
    package_dishes,
    recommended_for,
    features,
    status
  } = req.body

  try {
    const parsedExtraFee = extra_guest_fee !== undefined ? (extra_guest_fee !== '' && extra_guest_fee !== null ? parseFloat(extra_guest_fee) : 0) : null

    await pool.query(
      `UPDATE catering_packages SET 
        package_name = COALESCE(?, package_name),
        description = COALESCE(?, description),
        package_image = COALESCE(?, package_image),
        package_price = COALESCE(?, package_price),
        price_per_person = COALESCE(?, price_per_person),
        min_guests = COALESCE(?, min_guests),
        max_guests = COALESCE(?, max_guests),
        extra_guest_fee = COALESCE(?, extra_guest_fee),
        prep_time = COALESCE(?, prep_time),
        category_allowances_json = COALESCE(?, category_allowances_json),
        package_dishes_json = COALESCE(?, package_dishes_json),
        recommended_for = COALESCE(?, recommended_for),
        features_json = COALESCE(?, features_json),
        status = COALESCE(?, status)
       WHERE package_id = ?`,
      [
        package_name,
        description,
        package_image,
        package_price,
        price_per_person,
        min_guests,
        max_guests,
        parsedExtraFee,
        prep_time,
        category_allowances ? JSON.stringify(category_allowances) : null,
        package_dishes ? JSON.stringify(package_dishes) : null,
        recommended_for,
        features ? JSON.stringify(features) : null,
        status,
        id
      ]
    )
    res.json({ status: 'success', message: 'Package updated successfully!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/catering_packages/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM catering_packages WHERE package_id = ?', [id])
    res.json({ status: 'success', message: 'Package deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. FUNCTION HALLS ENDPOINTS
router.get('/function_halls', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM function_halls ORDER BY hall_id ASC')
    const formatted = rows.map(h => {
      let parsedFacilities = []
      let parsedGallery = []
      let parsedSchedule = {}

      if (h.facilities_json) {
        try {
          parsedFacilities = typeof h.facilities_json === 'string' ? JSON.parse(h.facilities_json) : h.facilities_json
        } catch (e) {
          parsedFacilities = []
        }
      }

      if (h.gallery_json) {
        try {
          parsedGallery = typeof h.gallery_json === 'string' ? JSON.parse(h.gallery_json) : h.gallery_json
        } catch (e) {
          parsedGallery = typeof h.gallery_json === 'string' ? h.gallery_json.split(/\r?\n/).filter(Boolean) : []
        }
      }

      if (!Array.isArray(parsedGallery) || parsedGallery.length === 0) {
        parsedGallery = h.hall_image ? [h.hall_image] : []
      }

      if (h.schedule_json) {
        try {
          parsedSchedule = typeof h.schedule_json === 'string' ? JSON.parse(h.schedule_json) : h.schedule_json
        } catch (e) {
          parsedSchedule = {}
        }
      }

      return {
        ...h,
        hourly_rate: parseFloat(h.hourly_rate || h.rental_price || 1000.00),
        facilities: parsedFacilities,
        gallery: parsedGallery,
        schedule: parsedSchedule
      }
    })
    res.json({ status: 'success', halls: formatted })
  } catch (err) {
    console.error("GET /function_halls error:", err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/function_halls', async (req, res) => {
  const {
    hall_name,
    description,
    capacity,
    location,
    hall_image,
    gallery,
    hourly_rate,
    status,
    facilities,
    schedule
  } = req.body

  if (!hall_name || !capacity || !hourly_rate) {
    return res.status(400).json({ status: 'error', message: 'Hall Name, Capacity, and Hourly Rate are required.' })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO function_halls (
        hall_name, description, capacity, location, hall_image, hourly_rate, status, facilities_json, gallery_json, schedule_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hall_name,
        description || '',
        capacity,
        location || '',
        hall_image || '',
        hourly_rate,
        status || 'Available',
        facilities ? JSON.stringify(facilities) : JSON.stringify([]),
        gallery ? JSON.stringify(gallery) : JSON.stringify([]),
        schedule ? JSON.stringify(schedule) : JSON.stringify({})
      ]
    )
    res.json({ status: 'success', message: 'Function hall added successfully!', hall_id: result.insertId })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/function_halls/:id', async (req, res) => {
  const { id } = req.params
  const {
    hall_name,
    description,
    capacity,
    location,
    hall_image,
    gallery,
    hourly_rate,
    status,
    facilities,
    schedule
  } = req.body

  try {
    const facilitiesJson = facilities ? JSON.stringify(facilities) : JSON.stringify([])
    const galleryJson = (Array.isArray(gallery) && gallery.length > 0)
      ? JSON.stringify(gallery)
      : (gallery ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : (hall_image ? JSON.stringify([hall_image]) : JSON.stringify([])))
    const scheduleJson = schedule ? JSON.stringify(schedule) : JSON.stringify({})

    const [result] = await pool.query(
      `UPDATE function_halls SET 
        hall_name = ?,
        description = ?,
        capacity = ?,
        location = ?,
        hall_image = ?,
        hourly_rate = ?,
        status = ?,
        facilities_json = ?,
        gallery_json = ?,
        schedule_json = ?
       WHERE hall_id = ?`,
      [
        hall_name || '',
        description || '',
        capacity || 50,
        location || '',
        hall_image || '',
        hourly_rate || 1000,
        status || 'Available',
        facilitiesJson,
        galleryJson,
        scheduleJson,
        id
      ]
    )

    res.json({ status: 'success', message: 'Function hall updated successfully!', affectedRows: result.affectedRows })
  } catch (err) {
    console.error(`[UPDATE Function Hall ${id} ERROR]:`, err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/function_halls/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM function_halls WHERE hall_id = ?', [id])
    res.json({ status: 'success', message: 'Function hall deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3. CATERING ADD-ONS ENDPOINTS
router.get('/catering_addons', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM catering_addons ORDER BY addon_id ASC')
    const formatted = rows.map(a => ({
      ...a,
      price: parseFloat(a.price || 0)
    }))
    res.json({ status: 'success', addons: formatted })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/catering_addons', async (req, res) => {
  const { addon_code, addon_name, price, unit, category, status } = req.body
  if (!addon_name || !price) {
    return res.status(400).json({ status: 'error', message: 'Addon Name and Price are required.' })
  }

  const code = addon_code || `ADD-${Math.floor(100 + Math.random() * 900)}`
  try {
    const [result] = await pool.query(
      `INSERT INTO catering_addons (addon_code, addon_name, price, unit, category, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, addon_name.trim(), price, unit || 'per event', category || 'Venue & Equipment', status || 'Available']
    )
    res.json({ status: 'success', message: 'Add-on created successfully!', addon_id: result.insertId })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/catering_addons/:id', async (req, res) => {
  const { id } = req.params
  const { addon_name, price, unit, category, status } = req.body
  try {
    await pool.query(
      `UPDATE catering_addons SET 
        addon_name = COALESCE(?, addon_name),
        price = COALESCE(?, price),
        unit = COALESCE(?, unit),
        category = COALESCE(?, category),
        status = COALESCE(?, status)
       WHERE addon_id = ?`,
      [addon_name, price, unit, category, status, id]
    )
    res.json({ status: 'success', message: 'Add-on updated successfully!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/catering_addons/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM catering_addons WHERE addon_id = ?', [id])
    res.json({ status: 'success', message: 'Add-on deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// ─── 4. FUNCTION HALL ADD-ON CATEGORIES ────────────────────────────────────

router.get('/hall_addon_categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hall_addon_categories ORDER BY sort_order ASC, category_name ASC')
    res.json({ status: 'success', categories: rows })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/hall_addon_categories', async (req, res) => {
  const { category_name, sort_order } = req.body
  if (!category_name?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Category name is required.' })
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO hall_addon_categories (category_name, sort_order) VALUES (?, ?)',
      [category_name.trim(), sort_order || 0]
    )
    res.json({ status: 'success', message: 'Category created.', category_id: result.insertId })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Category already exists.' })
    }
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/hall_addon_categories/:id', async (req, res) => {
  const { id } = req.params
  const { category_name, sort_order } = req.body
  try {
    await pool.query(
      'UPDATE hall_addon_categories SET category_name = COALESCE(?, category_name), sort_order = COALESCE(?, sort_order) WHERE category_id = ?',
      [category_name, sort_order, id]
    )
    res.json({ status: 'success', message: 'Category updated.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/hall_addon_categories/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM hall_addon_categories WHERE category_id = ?', [id])
    res.json({ status: 'success', message: 'Category deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// ─── 5. FUNCTION HALL ADD-ONS ───────────────────────────────────────────────

router.get('/hall_addons', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hall_addons ORDER BY addon_id ASC')
    const formatted = rows.map(a => ({ ...a, price: parseFloat(a.price || 0) }))
    res.json({ status: 'success', addons: formatted })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/hall_addons', async (req, res) => {
  const { addon_code, addon_name, price, unit, category, status } = req.body
  if (!addon_name || price === undefined || price === null) {
    return res.status(400).json({ status: 'error', message: 'Add-on name and price are required.' })
  }
  const code = addon_code?.trim() || `HA-${Math.floor(100 + Math.random() * 900)}`
  try {
    const [result] = await pool.query(
      `INSERT INTO hall_addons (addon_code, addon_name, price, unit, category, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, addon_name.trim(), parseFloat(price), unit || 'per event', category || 'Equipment & Services', status || 'Available']
    )
    res.json({ status: 'success', message: 'Hall add-on created!', addon_id: result.insertId })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/hall_addons/:id', async (req, res) => {
  const { id } = req.params
  const { addon_name, price, unit, category, status } = req.body
  try {
    await pool.query(
      `UPDATE hall_addons SET
        addon_name = COALESCE(?, addon_name),
        price      = COALESCE(?, price),
        unit       = COALESCE(?, unit),
        category   = COALESCE(?, category),
        status     = COALESCE(?, status)
       WHERE addon_id = ?`,
      [addon_name, price !== undefined ? parseFloat(price) : null, unit, category, status, id]
    )
    res.json({ status: 'success', message: 'Hall add-on updated!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/hall_addons/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM hall_addons WHERE addon_id = ?', [id])
    res.json({ status: 'success', message: 'Hall add-on deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})


router.get('/catering_bookings', async (req, res) => {
  const { email, phone, role } = req.query
  try {
    let query = 'SELECT * FROM catering_bookings WHERE 1=1'
    const params = []

    if (role === 'customer') {
      if (!email && !phone) {
        return res.json({ status: 'success', bookings: [] })
      }
      if (email && email.trim()) {
        query += ' AND LOWER(customer_email) = ?'
        params.push(email.trim().toLowerCase())
      }
      if (phone && phone.trim()) {
        query += ' AND customer_phone LIKE ?'
        params.push(`%${phone.trim()}%`)
      }
    } else {
      if (email && email.trim()) {
        query += ' AND LOWER(customer_email) = ?'
        params.push(email.trim().toLowerCase())
      }
      if (phone && phone.trim()) {
        query += ' AND customer_phone LIKE ?'
        params.push(`%${phone.trim()}%`)
      }
    }

    query += ' ORDER BY booking_id DESC'
    const [rows] = await pool.query(query, params)
    const formatted = rows.map(b => {
      let selectedDishes = {}
      if (b.selected_dishes_json) {
        try {
          selectedDishes = typeof b.selected_dishes_json === 'string' ? JSON.parse(b.selected_dishes_json) : b.selected_dishes_json
        } catch (e) {
          selectedDishes = {}
        }
      }

      let addons = []
      if (b.addons_json) {
        try {
          addons = typeof b.addons_json === 'string' ? JSON.parse(b.addons_json) : b.addons_json
        } catch (e) {
          addons = []
        }
      }

      return {
        ...b,
        package_price_per_person: parseFloat(b.package_price_per_person || 0),
        package_total: parseFloat(b.package_total || b.package_price || 0),
        hall_cost: parseFloat(b.hall_cost || 0),
        addons_total: parseFloat(b.addons_total || 0),
        total_amount: parseFloat(b.total_amount || 0),
        selected_dishes: selectedDishes,
        addons: addons
      }
    })
    res.json({ status: 'success', bookings: formatted })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/catering_bookings', async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    event_type,
    event_date,
    start_time,
    end_time,
    guest_count,
    package_id,
    package_name,
    package_price_per_person,
    package_total,
    selected_dishes,
    hall_id,
    hall_name,
    hall_cost,
    addons,
    addons_total,
    event_venue,
    total_amount,
    special_requests
  } = req.body

  if (!customer_name || !customer_phone || !event_date || !guest_count || !package_name) {
    return res.status(400).json({ status: 'error', message: 'Customer Name, Phone, Event Date, Guests, and Package selection are required.' })
  }

  const booking_code = `CAT-${Math.floor(100000 + Math.random() * 900000)}`
  const eventTimeStr = `${start_time || '10:00 AM'} to ${end_time || '02:00 PM'}`

  try {
    const [result] = await pool.query(
      `INSERT INTO catering_bookings 
        (booking_code, customer_name, customer_email, customer_phone, event_type, package_id, package_name, package_price, selected_dishes_json, package_price_per_person, package_total, event_date, event_time, guest_count, hall_id, hall_name, hall_cost, event_venue, addons_json, addons_total, total_amount, special_requests, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review')`,
      [
        booking_code,
        customer_name.trim(),
        customer_email ? customer_email.trim().toLowerCase() : '',
        customer_phone.trim(),
        event_type || 'Birthday',
        package_id || null,
        package_name.trim(),
        package_total || 0,
        selected_dishes ? JSON.stringify(selected_dishes) : JSON.stringify({}),
        package_price_per_person || 0,
        package_total || 0,
        event_date,
        eventTimeStr,
        guest_count,
        hall_id || null,
        hall_name || (hall_id ? 'Function Hall' : 'Off-site / Client Venue'),
        hall_cost || 0,
        event_venue ? event_venue.trim() : (hall_name || "Jo's Diner Function Hall"),
        addons ? JSON.stringify(addons) : JSON.stringify([]),
        addons_total || 0,
        total_amount || 0,
        special_requests ? special_requests.trim() : null
      ]
    )

    // Sync to main reservations table
    await pool.query(
      `INSERT INTO reservations (contact_name, contact_phone, event_type, event_date, guest_count, status)
       VALUES (?, ?, ?, ?, ?, 'Pending Inquiry')`,
      [
        customer_name.trim(),
        customer_phone.trim(),
        `Catering [${package_name}] - ${event_type}`,
        event_date,
        guest_count
      ]
    ).catch(() => { })

    res.json({
      status: 'success',
      message: `Catering booking submitted successfully! Reference Code: ${booking_code}`,
      booking_id: result.insertId,
      booking_code
    })
  } catch (err) {
    console.error("Error creating catering booking:", err)
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

router.put('/catering_bookings/:id', async (req, res) => {
  const { id } = req.params
  const { status, reason } = req.body

  try {
    await pool.query('UPDATE catering_bookings SET status = ? WHERE booking_id = ?', [status, id])

    // Fetch catering booking details
    const [rows] = await pool.query('SELECT * FROM catering_bookings WHERE booking_id = ? LIMIT 1', [id])
    if (rows && rows.length > 0) {
      const b = rows[0]
      const resObj = {
        contact_name: b.customer_name,
        email: b.customer_email,
        contact_phone: b.customer_phone,
        reservation_code: b.booking_code,
        event_type: `Catering - ${b.package_name || 'Event'}`,
        event_date: b.event_date,
        event_time: b.event_time,
        guest_count: b.guest_count,
        total_amount: b.total_amount ? `PHP ${Number(b.total_amount).toLocaleString()}` : null,
        venue: b.hall_name || b.event_venue || 'Function Hall'
      }

      if (status === 'Confirmed') {
        if (resObj.email && resObj.email.includes('@')) {
          sendReservationQREmail(resObj).catch(e => console.warn('[Catering] QR email warning:', e.message))
        }
        if (resObj.contact_phone) {
          sendCustomerSMS(
            resObj.contact_phone,
            `[Jo's Diner] Great news, ${resObj.contact_name || 'Valued Guest'}! Your catering booking #${resObj.reservation_code} is CONFIRMED. Details were emailed to you. See you soon!`
          ).catch(e => console.warn('[Catering] Confirm SMS warning:', e.message))
        }
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: resObj.email || null,
          reservation_code: resObj.reservation_code,
          type: 'approval_notice',
          title: 'Catering Booking Approved & Confirmed',
          message: `Your catering booking #${resObj.reservation_code} for ${resObj.event_date || 'your scheduled event'} has been approved!`,
          action_url: '/notifications',
          metadata: { status: 'Confirmed' },
          skip_email: true
        }).catch(() => {})
      } else if (status === 'Cancelled' || status === 'Declined') {
        const declineReason = reason || req.body.decline_reason || ''
        if (resObj.email && resObj.email.includes('@')) {
          sendRejectionEmail(resObj, declineReason).catch(e => console.warn('[Catering] Rejection email warning:', e.message))
        }
        if (resObj.contact_phone) {
          sendCustomerSMS(
            resObj.contact_phone,
            `[Jo's Diner] Notice: Your catering booking #${resObj.reservation_code} has been ${status.toLowerCase()}. Please check your email or visit our website.`
          ).catch(e => console.warn('[Catering] Decline SMS warning:', e.message))
        }
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: resObj.email || null,
          reservation_code: resObj.reservation_code,
          type: 'cancellation_alert',
          title: `Catering Booking ${status}`,
          message: declineReason
            ? `Your catering booking #${resObj.reservation_code} has been ${status.toLowerCase()}. Reason: ${declineReason}`
            : `Notice: Your catering booking #${resObj.reservation_code} has been ${status.toLowerCase()}.`,
          action_url: '/notifications',
          metadata: { status, reason: declineReason },
          skip_email: true
        }).catch(() => {})
      } else if (status === 'Completed') {
        if (resObj.email && resObj.email.includes('@')) {
          sendCompletionEmail(resObj).catch(e => console.warn('[Catering] Completion email warning:', e.message))
        }
        if (resObj.contact_phone) {
          sendCustomerSMS(
            resObj.contact_phone,
            `[Jo's Diner] Thank you, ${resObj.contact_name || 'Valued Guest'}! Your catering booking #${resObj.reservation_code} is completed. We hope you enjoyed your event!`
          ).catch(e => console.warn('[Catering] Complete SMS warning:', e.message))
        }
        createNotificationRecord({
          recipient_role: 'customer',
          recipient_email: resObj.email || null,
          reservation_code: resObj.reservation_code,
          type: 'completion_notice',
          title: 'Catering Event Completed — Thank You!',
          message: `Thank you for choosing Jo's Diner catering! Your booking #${resObj.reservation_code} has been marked as Completed.`,
          action_url: '/notifications',
          metadata: { status: 'Completed' },
          skip_email: true
        }).catch(() => {})
      }
    }

    res.json({ status: 'success', message: `Catering booking status updated to ${status}!` })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/catering_bookings/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM catering_bookings WHERE booking_id = ?', [id])
    res.json({ status: 'success', message: 'Catering booking record deleted.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
