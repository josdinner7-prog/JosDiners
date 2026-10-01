import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { createNotificationRecord } from './notifications.routes.js'
import { sendCustomerSMS } from './sms.routes.js'

const router = Router()

// Helper to format order row with items for rider app
function formatRiderOrder(row) {
  if (!row) return null
  let items = []
  if (row.items_json) {
    try {
      items = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json
    } catch (e) {
      items = []
    }
  }
  if (!Array.isArray(items)) items = []

  return {
    ...row,
    order_id: row.order_id,
    order_code: row.order_code || `ORD-${row.order_id}`,
    customer_name: row.customer_name || 'Valued Customer',
    customer_phone: row.customer_phone || 'N/A',
    delivery_address: row.delivery_address || 'Delivery Address',
    delivery_notes: row.delivery_notes || '',
    delivery_fee: parseFloat(row.delivery_fee || 49.00),
    grand_total: parseFloat(row.grand_total || 0.00),
    payment_method: row.payment_method || 'Cash on Delivery (COD)',
    payment_status: (row.payment_status || 'unpaid').toLowerCase(),
    delivery_status: row.delivery_status || 'Unassigned',
    status: row.status || 'Ready',
    items: items,
    restaurant_name: "Jo's Diner - Function Hall & Catering Services",
    restaurant_address: "A. Mabini St, Poblacion, Valencia City, 8709 Bukidnon",
    restaurant_phone: "+63 917 890 1234"
  }
}

// 1. GET ALL RIDERS (Used by Admin, Staff, and System)
router.get('/', async (req, res) => {
  const { status, search } = req.query

  try {
    const [riders] = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.phone_number,
        u.role,
        u.title,
        u.vehicle_type,
        u.plate_number,
        u.rider_status,
        u.profile_photo,
        u.shift_status,
        u.created_at
      FROM users u
      WHERE u.role = 'rider'
      ORDER BY u.full_name ASC
    `)

    // Fetch active delivery for each rider
    const [activeOrders] = await pool.query(`
      SELECT 
        order_id,
        order_code,
        customer_name,
        delivery_address,
        rider_id,
        delivery_status,
        grand_total,
        delivery_fee,
        created_at
      FROM orders
      WHERE rider_id IS NOT NULL 
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
        AND delivery_status IN ('Assigned', 'Accepted', 'Going to Restaurant', 'Arrived at Restaurant', 'Order Picked Up', 'On the Way', 'Arrived')
    `)

    const activeMap = new Map()
    activeOrders.forEach(o => {
      activeMap.set(o.rider_id, o)
    })

    // Fetch today's completed deliveries count per rider
    const [completedRows] = await pool.query(`
      SELECT rider_id, COUNT(*) as completed_count, SUM(delivery_fee) as earned
      FROM orders
      WHERE rider_id IS NOT NULL 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
        AND DATE(delivered_at) = CURRENT_DATE
      GROUP BY rider_id
    `)
    const completedMap = new Map()
    completedRows.forEach(c => {
      completedMap.set(c.rider_id, {
        count: parseInt(c.completed_count, 10),
        earned: parseFloat(c.earned || 0)
      })
    })

    const enriched = riders.map(r => {
      const active = activeMap.get(r.user_id) || null
      const comp = completedMap.get(r.user_id) || { count: 0, earned: 0 }

      let computedStatus = r.rider_status || 'Offline'
      if (computedStatus !== 'Offline' && computedStatus !== 'Inactive') {
        if (active) {
          computedStatus = 'Delivering'
        } else {
          computedStatus = 'Available'
        }
      }

      return {
        ...r,
        rider_id: r.user_id,
        employee_code: `RIDER-${String(r.user_id).padStart(3, '0')}`,
        effective_status: computedStatus,
        is_available: computedStatus === 'Available',
        active_delivery: active,
        today_completed: comp.count,
        today_earnings: comp.earned
      }
    })

    let filtered = enriched
    if (status) {
      if (status === 'Available') {
        filtered = filtered.filter(r => r.effective_status === 'Available')
      } else if (status === 'Delivering') {
        filtered = filtered.filter(r => r.effective_status === 'Delivering')
      } else if (status === 'Offline') {
        filtered = filtered.filter(r => r.effective_status === 'Offline')
      }
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(r =>
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.username || '').toLowerCase().includes(q) ||
        (r.phone_number || '').toLowerCase().includes(q) ||
        (r.plate_number || '').toLowerCase().includes(q)
      )
    }

    res.json({
      status: 'success',
      riders: filtered,
      count: filtered.length
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. GET RIDER PROFILE & SUMMARY STATS
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, full_name, phone_number, role, title, vehicle_type, plate_number, rider_status, profile_photo, shift_status, created_at 
       FROM users WHERE user_id = ? AND role = 'rider' LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Rider account not found.' })
    }

    const rider = rows[0]

    // Active delivery
    const [activeRows] = await pool.query(`
      SELECT * FROM orders 
      WHERE rider_id = ? 
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
        AND delivery_status IN ('Assigned', 'Accepted', 'Going to Restaurant', 'Arrived at Restaurant', 'Order Picked Up', 'On the Way', 'Arrived')
      ORDER BY order_id DESC LIMIT 1
    `, [id])
    const activeDelivery = activeRows.length > 0 ? formatRiderOrder(activeRows[0]) : null

    // Pending requests
    const [requestRows] = await pool.query(`
      SELECT * FROM orders 
      WHERE rider_id = ? 
        AND delivery_status = 'Assigned'
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
      ORDER BY order_id DESC
    `, [id])

    // Today earnings & deliveries
    const [todayStats] = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as total
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
        AND DATE(delivered_at) = CURRENT_DATE
    `, [id])

    // Weekly earnings
    const [weeklyStats] = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as total
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
        AND delivered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [id])

    // All time earnings
    const [allTimeStats] = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as total
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
    `, [id])

    let computedStatus = rider.rider_status || 'Offline'
    if (computedStatus !== 'Offline' && computedStatus !== 'Inactive') {
      computedStatus = activeDelivery ? 'Delivering' : 'Available'
    }

    res.json({
      status: 'success',
      rider: {
        ...rider,
        rider_id: rider.user_id,
        employee_code: `RIDER-${String(rider.user_id).padStart(3, '0')}`,
        effective_status: computedStatus,
        active_delivery: activeDelivery,
        pending_requests_count: requestRows.length,
        today_completed: parseInt(todayStats[0].count, 10),
        today_earnings: parseFloat(todayStats[0].total || 0),
        weekly_completed: parseInt(weeklyStats[0].count, 10),
        weekly_earnings: parseFloat(weeklyStats[0].total || 0),
        total_completed: parseInt(allTimeStats[0].count, 10),
        total_earnings: parseFloat(allTimeStats[0].total || 0)
      }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3. TOGGLE RIDER ONLINE / OFFLINE STATUS
router.put('/:id/status', async (req, res) => {
  const { id } = req.params
  const { rider_status } = req.body

  if (!rider_status) {
    return res.status(400).json({ status: 'error', message: 'rider_status is required.' })
  }

  try {
    await pool.query('UPDATE users SET rider_status = ? WHERE user_id = ? AND role = = "rider"', [rider_status, id])
      .catch(async () => {
        await pool.query('UPDATE users SET rider_status = ? WHERE user_id = ?', [rider_status, id])
      })

    res.json({
      status: 'success',
      message: `Status updated to ${rider_status}.`,
      rider_status
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 4. UPDATE RIDER PROFILE
router.put('/:id/profile', async (req, res) => {
  const { id } = req.params
  const { full_name, phone_number, vehicle_type, plate_number, profile_photo } = req.body

  try {
    await pool.query(`
      UPDATE users 
      SET full_name = COALESCE(?, full_name),
          phone_number = COALESCE(?, phone_number),
          vehicle_type = COALESCE(?, vehicle_type),
          plate_number = COALESCE(?, plate_number),
          profile_photo = COALESCE(?, profile_photo)
      WHERE user_id = ?
    `, [full_name || null, phone_number || null, vehicle_type || null, plate_number || null, profile_photo || null, id])

    res.json({ status: 'success', message: 'Rider profile updated successfully.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 5. CHANGE RIDER PASSWORD
router.put('/:id/password', async (req, res) => {
  const { id } = req.params
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ status: 'error', message: 'Current password and new password are required.' })
  }

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE user_id = ? LIMIT 1', [id])
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' })
    }

    const isValid = await bcrypt.compare(current_password, rows[0].password)
    if (!isValid && current_password !== rows[0].password) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect.' })
    }

    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, id])

    res.json({ status: 'success', message: 'Password changed successfully.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 6. GET ASSIGNED DELIVERY REQUESTS FOR RIDER (Pending Accept / Decline)
router.get('/:id/requests', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(`
      SELECT * FROM orders 
      WHERE rider_id = ? 
        AND delivery_status = 'Assigned'
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
      ORDER BY order_id DESC
    `, [id])

    res.json({
      status: 'success',
      requests: rows.map(formatRiderOrder),
      count: rows.length
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 7. GET ACTIVE DELIVERY IN PROGRESS FOR RIDER
router.get('/:id/active', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(`
      SELECT * FROM orders 
      WHERE rider_id = ? 
        AND delivery_status IN ('Accepted', 'Going to Restaurant', 'Arrived at Restaurant', 'Order Picked Up', 'On the Way', 'Arrived')
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
      ORDER BY order_id DESC LIMIT 1
    `, [id])

    res.json({
      status: 'success',
      active_delivery: rows.length > 0 ? formatRiderOrder(rows[0]) : null
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 8. RIDER ACCEPTS DELIVERY REQUEST
router.post('/:id/orders/:orderId/accept', async (req, res) => {
  const { id, orderId } = req.params

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [orderId])
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = orderRows[0]

    const [riderRows] = await pool.query('SELECT user_id, full_name, phone_number, vehicle_type, plate_number FROM users WHERE user_id = ? LIMIT 1', [id])
    if (riderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Rider not found.' })
    }
    const rider = riderRows[0]

    const vehicleDesc = `${rider.vehicle_type || 'Motorcycle'} (${rider.plate_number || 'N/A'})`

    // Update order to Accepted
    await pool.query(`
      UPDATE orders 
      SET delivery_status = 'Accepted',
          rider_id = ?,
          rider_name = ?,
          rider_phone = ?,
          vehicle_info = ?
      WHERE order_id = ?
    `, [id, rider.full_name, rider.phone_number, vehicleDesc, orderId])

    // Update rider to Delivering
    await pool.query("UPDATE users SET rider_status = 'Delivering' WHERE user_id = ?", [id])

    // Notify Customer
    if (order.customer_email) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        title: `Rider Assigned to Order #${order.order_code}`,
        message: `Rider ${rider.full_name} has accepted your delivery order and is heading to Jo's Diner to collect it!`,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    // Notify Staff & Admin
    createNotificationRecord({
      recipient_role: 'staff',
      title: `Rider Accepted Order #${order.order_code}`,
      message: `${rider.full_name} accepted delivery dispatch for Order #${order.order_code}.`,
      action_url: '/staff/orders'
    }).catch(() => {})

    res.json({
      status: 'success',
      message: `Delivery request accepted! You are now assigned to Order #${order.order_code}.`,
      delivery_status: 'Accepted'
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 9. RIDER DECLINES DELIVERY REQUEST
router.post('/:id/orders/:orderId/decline', async (req, res) => {
  const { id, orderId } = req.params
  const { reason = 'Rider unavailable or too far' } = req.body

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [orderId])
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = orderRows[0]

    const [riderRows] = await pool.query('SELECT full_name FROM users WHERE user_id = ? LIMIT 1', [id])
    const riderName = riderRows.length > 0 ? riderRows[0].full_name : 'Assigned Rider'

    // Append to declined_rider_ids
    let declinedList = []
    if (order.declined_rider_ids) {
      try {
        declinedList = JSON.parse(order.declined_rider_ids)
      } catch (e) {
        declinedList = [order.declined_rider_ids]
      }
    }
    if (!declinedList.includes(id)) {
      declinedList.push(id)
    }

    // Reset order to Unassigned
    await pool.query(`
      UPDATE orders 
      SET rider_id = NULL,
          rider_name = NULL,
          rider_phone = NULL,
          vehicle_info = NULL,
          delivery_status = 'Unassigned',
          declined_rider_ids = ?
      WHERE order_id = ?
    `, [JSON.stringify(declinedList), orderId])

    // Set rider back to Available if they were set to Delivering
    await pool.query("UPDATE users SET rider_status = 'Available' WHERE user_id = ? AND rider_status = 'Delivering'", [id])

    // Notify Staff & Admin that rider declined so they can reassign another rider
    createNotificationRecord({
      recipient_role: 'staff',
      title: `⚠️ Rider Declined: Order #${order.order_code}`,
      message: `${riderName} declined delivery for Order #${order.order_code} (${reason}). Order returned to unassigned queue. Please assign another rider.`,
      action_url: '/staff/orders'
    }).catch(() => {})

    createNotificationRecord({
      recipient_role: 'admin',
      title: `⚠️ Delivery Declined: Order #${order.order_code}`,
      message: `${riderName} declined Order #${order.order_code}. Please reassign from available riders.`,
      action_url: '/admin/orders'
    }).catch(() => {})

    res.json({
      status: 'success',
      message: `Delivery declined. Order #${order.order_code} returned to unassigned list.`,
      delivery_status: 'Unassigned'
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 10. RIDER ADVANCES DELIVERY STATUS
// Flow: Assigned → Accepted → Going to Restaurant → Arrived at Restaurant → Order Picked Up → On the Way → Arrived → Delivered
router.put('/:id/orders/:orderId/status', async (req, res) => {
  const { id, orderId } = req.params
  const { delivery_status } = req.body

  const VALID_STAGES = [
    'Going to Restaurant',
    'Arrived at Restaurant',
    'Order Picked Up',
    'On the Way',
    'Arrived',
    'Delivered'
  ]

  if (!VALID_STAGES.includes(delivery_status)) {
    return res.status(400).json({ status: 'error', message: `Invalid delivery status: ${delivery_status}` })
  }

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? AND rider_id = ? LIMIT 1', [orderId, id])
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Active order not found for this rider.' })
    }
    const order = orderRows[0]

    let generalStatus = order.status
    let extraSql = ''
    const extraParams = []

    if (delivery_status === 'Order Picked Up') {
      generalStatus = 'Out for Delivery'
      extraSql += ', dispatched_at = NOW(), status = ?'
      extraParams.push(generalStatus)
    } else if (delivery_status === 'On the Way') {
      generalStatus = 'Out for Delivery'
      extraSql += ', status = ?'
      extraParams.push(generalStatus)
    } else if (delivery_status === 'Delivered') {
      generalStatus = 'Delivered'
      extraSql += ', delivered_at = NOW(), status = ?'
      extraParams.push(generalStatus)

      // If COD, mark paid
      if ((order.payment_method || '').toLowerCase().includes('cash') || (order.payment_status || '').toLowerCase() !== 'paid') {
        extraSql += ", payment_status = 'paid', paid_at = NOW()"
      }
    }

    await pool.query(`
      UPDATE orders 
      SET delivery_status = ? ${extraSql}
      WHERE order_id = ?
    `, [delivery_status, ...extraParams, orderId])

    // If Delivered, set rider status back to Available
    if (delivery_status === 'Delivered') {
      await pool.query("UPDATE users SET rider_status = 'Available' WHERE user_id = ?", [id])
    }

    // Customer Notification
    let customerNotice = ''
    if (delivery_status === 'Going to Restaurant') {
      customerNotice = `Rider is on the way to Jo's Diner to collect your freshly prepared meal.`
    } else if (delivery_status === 'Arrived at Restaurant') {
      customerNotice = `Rider has arrived at Jo's Diner and is waiting for order packaging.`
    } else if (delivery_status === 'Order Picked Up') {
      customerNotice = `Your order has been picked up from Jo's Diner and packed for road transit!`
    } else if (delivery_status === 'On the Way') {
      customerNotice = `Your rider is now on the road traveling towards your delivery address!`
    } else if (delivery_status === 'Arrived') {
      customerNotice = `Your rider has arrived outside your delivery location! Please prepare to receive your order.`
    } else if (delivery_status === 'Delivered') {
      customerNotice = `Your order #${order.order_code} was successfully delivered! Thank you for choosing Jo's Diner. Enjoy your meal!`
    }

    if (customerNotice && order.customer_email) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        title: `Order #${order.order_code} Delivery Update: ${delivery_status}`,
        message: customerNotice,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    // SMS Notification to Customer Phone if available
    if (order.customer_phone && order.customer_phone.length >= 10) {
      sendCustomerSMS(
        order.customer_phone,
        `Jo's Diner Delivery Update: Order #${order.order_code} is now "${delivery_status}". ${customerNotice}`
      ).catch(() => {})
    }

    res.json({
      status: 'success',
      message: `Delivery milestone updated to: ${delivery_status}`,
      delivery_status,
      order_status: generalStatus
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 11. GET RIDER DELIVERY HISTORY
router.get('/:id/history', async (req, res) => {
  const { id } = req.params
  const { filter = 'all' } = req.query

  try {
    let query = `
      SELECT * FROM orders 
      WHERE rider_id = ?
    `
    const params = [id]

    if (filter === 'completed') {
      query += " AND (status = 'Delivered' OR delivery_status = 'Delivered')"
    } else if (filter === 'cancelled') {
      query += " AND status = 'Cancelled'"
    } else if (filter === 'failed') {
      query += " AND delivery_status = 'Failed'"
    } else {
      query += " AND (status IN ('Delivered', 'Completed', 'Cancelled') OR delivery_status IN ('Delivered', 'Cancelled', 'Failed'))"
    }

    query += " ORDER BY order_id DESC LIMIT 100"

    const [rows] = await pool.query(query, params)

    res.json({
      status: 'success',
      history: rows.map(formatRiderOrder),
      count: rows.length
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 12. GET DETAILED EARNINGS REPORT FOR RIDER
router.get('/:id/earnings', async (req, res) => {
  const { id } = req.params

  try {
    const [todayRows] = await pool.query(`
      SELECT 
        order_id, order_code, customer_name, delivery_address, delivery_fee, grand_total, delivered_at
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
        AND DATE(delivered_at) = CURRENT_DATE
      ORDER BY delivered_at DESC
    `, [id])

    const [weeklyRows] = await pool.query(`
      SELECT 
        order_id, order_code, customer_name, delivery_fee, delivered_at
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
        AND delivered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY delivered_at DESC
    `, [id])

    const [allTimeRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_deliveries,
        COALESCE(SUM(delivery_fee), 0) as total_earned
      FROM orders
      WHERE rider_id = ? 
        AND (status = 'Delivered' OR delivery_status = 'Delivered')
    `, [id])

    const todayEarned = todayRows.reduce((sum, r) => sum + parseFloat(r.delivery_fee || 0), 0)
    const weeklyEarned = weeklyRows.reduce((sum, r) => sum + parseFloat(r.delivery_fee || 0), 0)
    const totalEarned = parseFloat(allTimeRows[0].total_earned || 0)

    res.json({
      status: 'success',
      today_earnings: todayEarned,
      today_completed: todayRows.length,
      weekly_earnings: weeklyEarned,
      weekly_completed: weeklyRows.length,
      total_earnings: totalEarned,
      total_completed: parseInt(allTimeRows[0].total_deliveries, 10),
      today_deliveries: todayRows
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 13. GET RIDER NOTIFICATIONS
router.get('/:id/notifications', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(`
      SELECT * FROM notifications 
      WHERE (recipient_role = 'rider' OR recipient_role = 'all')
        AND (user_id = ? OR user_id IS NULL)
      ORDER BY notification_id DESC LIMIT 40
    `, [id])

    const unread = rows.filter(r => !r.is_read).length

    res.json({
      status: 'success',
      notifications: rows,
      unread_count: unread
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
