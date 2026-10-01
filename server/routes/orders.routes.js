import { Router } from 'express'
import { pool } from '../config/db.js'
import { createNotificationRecord } from './notifications.routes.js'
import { sendCustomerSMS } from './sms.routes.js'
import { sendOrderCompletionEmail } from '../utils/mailer.js'

const router = Router()

// Helper to resolve customer phone if missing
async function resolveCustomerPhone(email, currentPhone) {
  if (currentPhone && String(currentPhone).trim().length >= 7) {
    return String(currentPhone).trim()
  }
  if (!email || !email.includes('@')) return null
  try {
    const [cRows] = await pool.query(
      'SELECT phone FROM customers WHERE LOWER(email) = ? LIMIT 1',
      [email.trim().toLowerCase()]
    )
    if (cRows && cRows.length > 0 && cRows[0].phone) {
      return String(cRows[0].phone).trim()
    }
  } catch (e) {
    // ignore
  }
  return null
}

// Helper to normalize an order row
function formatOrderRow(row) {
  let items = []
  if (row.items_json) {
    try {
      items = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json
    } catch (e) {
      items = []
    }
  }
  if (!Array.isArray(items)) items = []

  const normalizedItems = items.map((it, idx) => ({
    id: it.id || it.item_id || idx + 1,
    name: it.name || it.item_name || 'Dish Item',
    quantity: Number(it.quantity || it.qty || 1),
    price: Number(it.price || 0),
    prep_status: it.prep_status || (row.status === 'Ready' || row.status === 'Completed' ? 'Ready' : (row.status === 'Preparing' ? 'Preparing' : 'Pending')),
    completed: it.completed ?? (row.status === 'Ready' || row.status === 'Completed'),
    special_instructions: it.special_instructions || it.notes || ''
  }))

  const createdAt = row.created_at ? new Date(row.created_at) : new Date()
  const diffMs = Math.max(0, Date.now() - createdAt.getTime())
  const elapsedMins = isNaN(diffMs) ? 2 : Math.max(1, Math.floor(diffMs / 60000))

  // Determine order type — Dine-in, Takeout, or Delivery
  const rawType = (row.order_type || '').toLowerCase()
  const deliv = (row.delivery_address || '').trim()
  const isDelivery = rawType.includes('delivery') || (!rawType.includes('takeout') && !rawType.includes('dine') && deliv.length > 0 && !deliv.toLowerCase().includes('counter'))
  const isTakeout = rawType.includes('takeout') || rawType.includes('pickup')
  const orderType = isDelivery ? 'Delivery' : (isTakeout ? 'Takeout' : 'Dine-in')
  const tableNum = isDelivery ? (row.table_number || 'Delivery (Rider Dispatch)') : (isTakeout ? 'Pickup Counter' : (row.table_number || 'Pickup Counter'))

  return {
    ...row,
    order_id: row.order_id,
    order_code: row.order_code || `ORD-${row.order_id}`,
    customer_name: row.customer_name || 'Walk-in Guest',
    customer_phone: row.customer_phone || 'N/A',
    customer_email: row.customer_email || '',
    order_type: orderType,
    table_number: tableNum,
    delivery_address: row.delivery_address || (orderType === 'Delivery' ? 'Customer Address' : 'Pickup Counter'),
    delivery_fee: parseFloat(row.delivery_fee || 0),
    delivery_notes: row.delivery_notes || null,
    rider_id: row.rider_id || null,
    rider_name: row.rider_name || null,
    rider_phone: row.rider_phone || null,
    vehicle_info: row.vehicle_info || null,
    delivery_status: row.delivery_status || (row.rider_name ? 'Assigned' : 'Unassigned'),
    declined_rider_ids: row.declined_rider_ids || null,
    estimated_delivery_time: row.estimated_delivery_time || null,
    dispatched_at: row.dispatched_at || null,
    delivered_at: row.delivered_at || null,
    station: row.station || 'Hot Mains',
    status: row.status || 'Pending',
    grand_total: parseFloat(row.grand_total || 0),
    total_amount: parseFloat(row.grand_total || 0),
    elapsed_mins: elapsedMins,
    payment_method: row.payment_method || 'counter',
    payment_status: (row.payment_status || 'unpaid').toLowerCase(),
    payment_id: row.payment_id || null,
    payment_reference: row.payment_reference || row.payment_id || null,
    payment_notes: row.payment_notes || null,
    paid_at: row.paid_at || null,
    refund_amount: row.refund_amount ? parseFloat(row.refund_amount) : null,
    refund_reason: row.refund_reason || null,
    refunded_at: row.refunded_at || null,
    items: normalizedItems,
    items_json: normalizedItems,
    notes: row.notes || ''
  }
}

// Helper to dispatch both in-app system notification and SMS on order status transition
async function notifyOrderStatusChange(order, newStatus, previousStatus = null) {
  if (!order || !newStatus || (previousStatus && newStatus === previousStatus)) return

  const orderId = order.order_id
  const orderCode = order.order_code || `ORD-${orderId}`
  const custName = order.customer_name || 'Valued Guest'
  const rawType = (order.order_type || '').toLowerCase()
  const isDelivery = rawType.includes('delivery') || String(order.delivery_address || '').trim().length > 15
  const orderType = isDelivery ? 'Delivery' : (rawType.includes('takeout') || rawType.includes('pickup') ? 'Takeout' : 'Dine-in')
  const tableNum = isDelivery ? 'Delivery (Rider Dispatch)' : 'Pickup Counter'
  const riderInfo = order.rider_name ? `Rider: ${order.rider_name} (${order.rider_phone || 'Assigned Driver'})` : 'Jo\'s Diner Delivery Team'

  let notifTitle = ''
  let notifMessage = ''
  let smsMessage = ''

  switch (newStatus) {
    case 'New':
    case 'Pending':
      notifTitle = isDelivery ? `Delivery Order #${orderCode} Placed` : `Order #${orderCode} Received`
      notifMessage = isDelivery 
        ? `Your delivery order #${orderCode} has been placed. Destination: ${order.delivery_address || 'Customer Address'}. Awaiting restaurant confirmation!`
        : `Your ${orderType} order #${orderCode} has been received and is waiting for restaurant confirmation.`
      smsMessage = isDelivery
        ? `[Jo's Diner] Hi ${custName}! We received your Delivery order #${orderCode} for ₱${parseFloat(order.grand_total || 0).toFixed(2)}. Delivery address: ${order.delivery_address || 'Your Address'}. We'll notify you once our kitchen begins cooking!`
        : `[Jo's Diner] Hi ${custName}! We received your order #${orderCode}. We will notify you once our team accepts it and begins preparation.`
      break

    case 'Accepted':
      notifTitle = isDelivery ? `Delivery Order #${orderCode} Accepted!` : `Order #${orderCode} Accepted!`
      notifMessage = isDelivery
        ? `Great news! Your delivery order #${orderCode} has been accepted and dispatched to our kitchen line for cooking.`
        : `Great news! Your ${orderType} order #${orderCode} has been accepted by our staff and dispatched to the kitchen.`
      smsMessage = isDelivery
        ? `[Jo's Diner] Hi ${custName}! Your Delivery order #${orderCode} was accepted and is queued for cooking in our kitchen!`
        : `[Jo's Diner] Hi ${custName}! Your order #${orderCode} was accepted by staff and sent to the kitchen!`
      break

    case 'Preparing':
    case 'In Progress':
      notifTitle = `Order #${orderCode} is Cooking`
      notifMessage = `Your ${orderType} order #${orderCode} is now in the kitchen! Our chefs have begun preparing your freshly made dishes.`
      smsMessage = `[Jo's Diner] Hi ${custName}! Your order #${orderCode} is now being prepared in our kitchen. We'll update you as soon as it's ready!`
      break

    case 'Ready':
    case 'Ready for Pickup':
      if (isDelivery) {
        notifTitle = `Order #${orderCode} Packaged for Delivery`
        notifMessage = `Your delivery order #${orderCode} is freshly cooked, packed, and ready for rider pickup!`
        smsMessage = `[Jo's Diner] Hi ${custName}! Your order #${orderCode} is packaged and waiting for rider pickup to dispatch to ${order.delivery_address || 'your address'}!`
      } else {
        notifTitle = `Order #${orderCode} is Ready for Pickup!`
        notifMessage = `Your ${orderType} order #${orderCode} is freshly prepared and READY for pickup at the counter! Please show your order code #${orderCode} upon collection. Enjoy your meal!`
        smsMessage = `[Jo's Diner] Hi ${custName}! Your ${orderType} order #${orderCode} is now READY for pickup at the counter. Please present your order code #${orderCode} upon pickup. Enjoy!`
      }
      break

    case 'Out for Delivery':
    case 'In Transit':
      notifTitle = `Order #${orderCode} is Out for Delivery! 🛵`
      notifMessage = `Your food has left Jo's Diner and is on the way to ${order.delivery_address || 'your address'}! ${riderInfo}. ${order.estimated_delivery_time ? `Est. Arrival: ${order.estimated_delivery_time}.` : ''}`
      smsMessage = `[Jo's Diner] Hi ${custName}! Your order #${orderCode} is OUT FOR DELIVERY! ${riderInfo}. ${order.estimated_delivery_time ? `Est: ${order.estimated_delivery_time}. ` : ''}Please keep your phone active!`
      break

    case 'Delivered':
    case 'Completed':
    case 'Served':
      notifTitle = isDelivery ? `Order #${orderCode} Delivered! 🎉` : `Order #${orderCode} Completed`
      notifMessage = isDelivery
        ? `Your order #${orderCode} has been delivered to ${order.delivery_address || 'your address'}. Thank you for ordering with Jo's Diner! Enjoy your meal!`
        : `Your order #${orderCode} has been completed. Thank you for dining with Jo's Diner! We hope you loved every bite.`
      smsMessage = isDelivery
        ? `[Jo's Diner] Hi ${custName}! Your order #${orderCode} has been DELIVERED to ${order.delivery_address || 'your address'}. Thank you for choosing Jo's Diner!`
        : `[Jo's Diner] Thank you for dining with Jo's Diner, ${custName}! Your order #${orderCode} has been completed. Have a wonderful day!`
      break

    case 'Rejected':
      notifTitle = `Order #${orderCode} Rejected`
      notifMessage = `Your ${orderType} order #${orderCode} could not be accepted at this time. Please approach our staff or contact the restaurant for assistance.`
      smsMessage = `[Jo's Diner] We regret to inform you that your order #${orderCode} could not be accepted. Please contact staff for assistance.`
      break

    case 'Cancelled':
      notifTitle = `Order #${orderCode} Cancelled`
      notifMessage = `Your order #${orderCode} has been cancelled. If you have questions or need assistance, please approach our staff.`
      smsMessage = `[Jo's Diner] Notice: Your order #${orderCode} has been cancelled. Please approach our staff if you require assistance.`
      break

    default:
      notifTitle = `Order #${orderCode} Status: ${newStatus}`
      notifMessage = `Your ${orderType} order #${orderCode} status is now "${newStatus}".`
      smsMessage = `[Jo's Diner] Hi ${custName}! Your order #${orderCode} status has been updated to "${newStatus}".`
      break
  }

  // 1. Resolve Customer Phone
  const phone = await resolveCustomerPhone(order.customer_email, order.customer_phone)

  // 2. Dispatch Customer In-App Notification (Notification Center)
  if (order.customer_email) {
    createNotificationRecord({
      recipient_role: 'customer',
      recipient_email: order.customer_email.trim().toLowerCase(),
      user_id: order.user_id || null,
      reservation_code: orderCode,
      type: 'order_update',
      title: notifTitle,
      message: notifMessage,
      action_url: '/my-orders',
      metadata: {
        order_id: orderId,
        order_code: orderCode,
        order_type: orderType,
        table_number: tableNum,
        status: newStatus
      },
      skip_email: false
    }).catch(err => console.warn('[Orders] Customer in-app notification dispatch warning:', err.message))
  }

  // 3. Dispatch SMS Notification to Customer
  if (phone) {
    sendCustomerSMS(phone, smsMessage)
      .then(res => console.log(`[Orders] SMS successfully sent to ${phone} for #${orderCode} (${newStatus})`))
      .catch(err => console.warn(`[Orders] SMS notification failed for ${phone}:`, err.message))
  }

  // 3b. Dispatch Gmail Notification to Customer on Completion
  if (order.customer_email && ['Completed', 'Delivered', 'Served'].includes(newStatus)) {
    sendOrderCompletionEmail(order)
      .then(res => console.log(`[Orders] Gmail successfully sent to ${order.customer_email} for #${orderCode}`))
      .catch(err => console.warn(`[Orders] Gmail notification failed:`, err.message))
  }


  // 4. Dispatch Admin Notification
  createNotificationRecord({
    recipient_role: 'admin',
    reservation_code: orderCode,
    type: 'order_update',
    title: `Order #${orderCode} -> ${newStatus}`,
    message: `Order #${orderCode} (${custName}, ${orderType}) status updated to "${newStatus}".`,
    action_url: '/admin/orders',
    metadata: {
      order_id: orderId,
      order_code: orderCode,
      status: newStatus,
      order_type: orderType,
      table_number: tableNum
    }
  }).catch(err => console.warn('[Orders] Admin notification dispatch warning:', err.message))
}

// 1. GET ALL ORDERS
router.get('/', async (req, res) => {
  const { email, phone, role } = req.query
  try {
    // Customer-scoped request
    if (role === 'customer') {
      if (!email && !phone) {
        return res.json({ status: 'success', orders: [], data: [] })
      }
      let query = 'SELECT * FROM orders WHERE 1=1'
      const params = []
      if (email && email.trim()) {
        query += ' AND LOWER(customer_email) = ?'
        params.push(email.trim().toLowerCase())
      }
      if (phone && phone.trim()) {
        query += ' AND customer_phone LIKE ?'
        params.push(`%${phone.trim()}%`)
      }
      query += ' ORDER BY order_id DESC'
      const [rows] = await pool.query(query, params)
      const formatted = rows.map(formatOrderRow)
      return res.json({ status: 'success', orders: formatted, data: formatted })
    }

    // Admin / Staff / Kitchen — get all orders
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY order_id DESC')
    const formatted = rows.map(formatOrderRow)
    res.json({ status: 'success', orders: formatted, data: formatted })
  } catch (err) {
    console.warn('Orders GET error:', err.message)
    res.json({ status: 'success', data: [], orders: [] })
  }
})

// 1b. GET ORDER BY ORDER CODE
router.get('/code/:orderCode', async (req, res) => {
  const { orderCode } = req.params
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_code = ? LIMIT 1', [orderCode])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: `Order #${orderCode} not found.` })
    }
    const order = formatOrderRow(rows[0])
    res.json({ status: 'success', order, data: order })
  } catch (err) {
    console.error('Order GET by code error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 1c. GET ORDER BY ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  if (isNaN(id)) return res.status(400).json({ status: 'error', message: 'Invalid order ID' })
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = formatOrderRow(rows[0])
    res.json({ status: 'success', order, data: order })
  } catch (err) {
    console.error('Order GET by ID error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. CREATE NEW ORDER (Cart Checkout or In-Store)
router.post('/', async (req, res) => {
  const {
    order_code,
    customer_name,
    customer_email,
    customer_phone,
    user_id,
    order_type,
    table_number,
    delivery_address,
    delivery_fee,
    delivery_notes,
    landmark,
    rider_name,
    rider_phone,
    vehicle_info,
    estimated_delivery_time,
    grand_total,
    total_amount,
    status,
    payment_method,
    payment_status,
    payment_id,
    items,
    items_json
  } = req.body

  try {
    const code = order_code || `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const itemsData = items || items_json || []
    const itemsJsonString = typeof itemsData === 'string' ? itemsData : JSON.stringify(itemsData)
    
    const isDelivery = String(order_type || '').toLowerCase().includes('delivery')
    const isTakeout = String(order_type || '').toLowerCase().includes('takeout')
    const finalType = isDelivery ? 'Delivery' : (isTakeout ? 'Takeout' : 'Dine-in')
    const finalTable = isDelivery ? (table_number || 'Delivery (Rider Dispatch)') : (isTakeout ? 'Pickup Counter' : (table_number || 'Pickup Counter'))
    const finalAddress = isDelivery ? (delivery_address || 'Customer Specified Address') : (delivery_address || 'Pickup Counter')
    const finalDeliveryFee = isDelivery ? parseFloat(delivery_fee || 49) : 0
    const finalDeliveryNotes = delivery_notes || landmark || null
    const finalTotal = parseFloat(grand_total || total_amount || 0)
    const finalEmail = customer_email ? customer_email.trim().toLowerCase() : null
    const finalPhone = await resolveCustomerPhone(finalEmail, customer_phone)
    const finalMethod = (payment_method || 'counter').toLowerCase()
    const finalPayStatus = (payment_status || 'unpaid').toLowerCase()
    const paidAt = finalPayStatus === 'paid' ? new Date() : null

    const [result] = await pool.query(
      `INSERT INTO orders 
        (order_code, customer_name, customer_email, customer_phone, user_id, order_type, table_number, delivery_address, delivery_fee, delivery_notes, rider_name, rider_phone, vehicle_info, estimated_delivery_time, grand_total, status, items_json, payment_method, payment_status, payment_id, paid_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        customer_name || 'Walk-in Customer',
        finalEmail,
        finalPhone || '',
        user_id || null,
        finalType,
        finalTable,
        finalAddress,
        finalDeliveryFee,
        finalDeliveryNotes,
        rider_name || null,
        rider_phone || null,
        vehicle_info || null,
        estimated_delivery_time || null,
        finalTotal,
        status || 'New',
        itemsJsonString,
        finalMethod,
        finalPayStatus,
        payment_id || null,
        paidAt
      ]
    )

    const createdOrder = formatOrderRow({
      order_id: result.insertId,
      order_code: code,
      customer_name,
      customer_phone: finalPhone || '',
      customer_email: finalEmail,
      order_type: finalType,
      table_number: finalTable,
      delivery_address: finalAddress,
      delivery_fee: finalDeliveryFee,
      delivery_notes: finalDeliveryNotes,
      grand_total: finalTotal,
      status: status || 'New',
      items_json: itemsJsonString,
      payment_method: finalMethod,
      payment_status: finalPayStatus,
      payment_id: payment_id || null,
      paid_at: paidAt,
      created_at: new Date()
    })

    // 1. Dispatch Customer System Notification (Notification Center)
    if (finalEmail) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: finalEmail,
        user_id: user_id || null,
        reservation_code: code,
        type: 'order_update',
        title: isDelivery ? `Delivery Order #${code} Placed!` : `Order #${code} Placed Successfully`,
        message: isDelivery
          ? `Thank you for your order! Your Delivery order #${code} totaling ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} has been received. Delivering to: ${finalAddress}.`
          : `Thank you for your order! Your ${finalType} order #${code} totaling ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} has been received by Jo's Diner. Our kitchen will start cooking shortly!`,
        action_url: '/my-orders',
        metadata: {
          order_id: result.insertId,
          order_code: code,
          order_type: finalType,
          table_number: finalTable,
          delivery_address: finalAddress,
          status: status || 'Pending',
          grand_total: finalTotal
        }
      }).catch(err => console.warn('[Orders] Placement in-app notification error:', err.message))
    }

    // 2. Dispatch Customer SMS Notification
    if (finalPhone) {
      const smsMessage = isDelivery
        ? `[Jo's Diner] Hi ${customer_name || 'Valued Guest'}! We received your Delivery order #${code} (Total: ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}). Delivering to ${finalAddress}. We'll notify you once our kitchen begins cooking!`
        : `[Jo's Diner] Hi ${customer_name || 'Valued Guest'}! We received your ${finalType} order #${code} (Total: ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}). We will notify you via SMS once your order is ready!`
      sendCustomerSMS(finalPhone, smsMessage)
        .then(res => console.log(`[Orders] Placement SMS sent to ${finalPhone} for #${code}`))
        .catch(err => console.warn(`[Orders] Placement SMS error for ${finalPhone}:`, err.message))
    }

    // 3. Dispatch Admin In-App Notification
    createNotificationRecord({
      recipient_role: 'admin',
      reservation_code: code,
      type: 'order_update',
      title: isDelivery ? `New Delivery Order #${code} 🛵` : `New Food Order #${code}`,
      message: isDelivery
        ? `New DELIVERY order #${code} from ${customer_name || 'Customer'} totaling ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Destination: ${finalAddress}.`
        : `New ${finalType} order #${code} from ${customer_name || 'Walk-in Customer'} totaling ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`,
      action_url: '/admin/orders',
      metadata: {
        order_id: result.insertId,
        order_code: code,
        order_type: finalType,
        table_number: finalTable,
        delivery_address: finalAddress,
        status: status || 'Pending',
        grand_total: finalTotal
      }
    }).catch(err => console.warn('[Orders] Placement admin notification error:', err.message))

    res.json({
      status: 'success',
      message: 'Order submitted successfully!',
      order_id: result.insertId,
      order: createdOrder
    })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3. UPDATE ORDER STATUS & DETAILS
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    status,
    items,
    items_json,
    rider_name,
    rider_phone,
    vehicle_info,
    estimated_delivery_time,
    delivery_notes,
    delivery_address
  } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const previousStatus = order.status

    // STRICT ACCEPTANCE GUARD:
    // Do not allow staff to accept or kitchen to cook an order if it is still unpaid!
    // Exception: Cash on Delivery (COD) orders or delivery orders where customer pays upon delivery!
    const isCodOrDelivery = (order.payment_method || '').toLowerCase() === 'cod' || (order.order_type || '').toLowerCase().includes('delivery')
    const acceptingStatuses = ['Accepted', 'Preparing', 'Ready', 'In Progress']
    if (status && acceptingStatuses.includes(status) && !isCodOrDelivery) {
      const currentPayStatus = (order.payment_status || 'unpaid').toLowerCase()
      if (currentPayStatus !== 'paid') {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot accept order: Payment is required before kitchen dispatch. Please collect cash at counter or verify online payment.'
        })
      }
    }

    const updates = []
    const params = []

    if (status) {
      updates.push('status = ?')
      params.push(status)
      if (status === 'Out for Delivery' || status === 'In Transit') {
        updates.push('dispatched_at = NOW()')
      }
      if (status === 'Delivered' || status === 'Completed') {
        updates.push('delivered_at = NOW()')
        if ((order.payment_method || '').toLowerCase() === 'cod') {
          updates.push("payment_status = 'paid'")
          updates.push('paid_at = NOW()')
        }
      }
    }

    if (items || items_json) {
      const jsonStr = typeof (items || items_json) === 'string' ? (items || items_json) : JSON.stringify(items || items_json)
      updates.push('items_json = ?')
      params.push(jsonStr)
    }

    if (rider_name !== undefined) {
      updates.push('rider_name = ?')
      params.push(rider_name)
    }
    if (rider_phone !== undefined) {
      updates.push('rider_phone = ?')
      params.push(rider_phone)
    }
    if (vehicle_info !== undefined) {
      updates.push('vehicle_info = ?')
      params.push(vehicle_info)
    }
    if (estimated_delivery_time !== undefined) {
      updates.push('estimated_delivery_time = ?')
      params.push(estimated_delivery_time)
    }
    if (delivery_notes !== undefined) {
      updates.push('delivery_notes = ?')
      params.push(delivery_notes)
    }
    if (delivery_address !== undefined) {
      updates.push('delivery_address = ?')
      params.push(delivery_address)
    }

    if (updates.length > 0) {
      params.push(id)
      await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`, params)
    }

    // Trigger System & SMS notifications if status was updated
    if (status && status !== previousStatus) {
      const updatedOrder = {
        ...order,
        status,
        rider_name: rider_name !== undefined ? rider_name : order.rider_name,
        rider_phone: rider_phone !== undefined ? rider_phone : order.rider_phone,
        vehicle_info: vehicle_info !== undefined ? vehicle_info : order.vehicle_info,
        estimated_delivery_time: estimated_delivery_time !== undefined ? estimated_delivery_time : order.estimated_delivery_time,
        delivery_address: delivery_address !== undefined ? delivery_address : order.delivery_address
      }
      notifyOrderStatusChange(updatedOrder, status, previousStatus).catch(e => {
        console.warn('[Orders] Failed to dispatch order status notifications:', e.message)
      })
    }

    res.json({ status: 'success', message: 'Order updated successfully!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3c. ASSIGN RIDER (Admin or Staff assigns an available rider)
router.post('/:id/assign-rider', async (req, res) => {
  const { id } = req.params
  const { rider_id, estimated_delivery_time = '30 - 45 mins', delivery_notes } = req.body

  if (!rider_id) {
    return res.status(400).json({ status: 'error', message: 'rider_id is required.' })
  }

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = orderRows[0]

    // Verify Rider
    const [riderRows] = await pool.query(`
      SELECT user_id, full_name, phone_number, vehicle_type, plate_number, rider_status 
      FROM users 
      WHERE user_id = ? AND role = 'rider' 
      LIMIT 1
    `, [rider_id])

    if (riderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Selected rider not found.' })
    }
    const rider = riderRows[0]

    if (rider.rider_status === 'Offline' || rider.rider_status === 'Inactive') {
      return res.status(400).json({
        status: 'error',
        message: `Rider ${rider.full_name} is currently ${rider.rider_status} and cannot receive new delivery assignments.`
      })
    }

    // Check if rider already has an active order
    const [activeCheck] = await pool.query(`
      SELECT order_id, order_code FROM orders 
      WHERE rider_id = ? 
        AND status NOT IN ('Completed', 'Delivered', 'Cancelled')
        AND delivery_status IN ('Accepted', 'Going to Restaurant', 'Arrived at Restaurant', 'Order Picked Up', 'On the Way', 'Arrived')
        AND order_id != ?
      LIMIT 1
    `, [rider_id, id])

    if (activeCheck.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Rider ${rider.full_name} is already handling active delivery #${activeCheck[0].order_code}.`
      })
    }

    const vehicleDesc = `${rider.vehicle_type || 'Motorcycle'} (${rider.plate_number || 'N/A'})`

    // Update order with rider assignment
    await pool.query(`
      UPDATE orders 
      SET rider_id = ?,
          rider_name = ?,
          rider_phone = ?,
          vehicle_info = ?,
          estimated_delivery_time = ?,
          delivery_notes = COALESCE(?, delivery_notes),
          delivery_status = 'Assigned'
      WHERE order_id = ?
    `, [rider_id, rider.full_name, rider.phone_number, vehicleDesc, estimated_delivery_time, delivery_notes || null, id])

    // Notify Rider in App
    createNotificationRecord({
      recipient_role: 'rider',
      user_id: rider.user_id,
      title: `🛵 New Delivery Assignment: #${order.order_code}`,
      message: `You have been assigned to deliver Order #${order.order_code} to ${order.delivery_address || 'Customer destination'}. Open your Rider app to accept or decline.`,
      action_url: '/rider/requests'
    }).catch(() => {})

    // Notify Customer
    if (order.customer_email) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        title: `Rider Assigned: Order #${order.order_code}`,
        message: `Rider ${rider.full_name} has been assigned to your order. Delivery will begin shortly!`,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])

    res.json({
      status: 'success',
      message: `Rider ${rider.full_name} assigned to Order #${order.order_code}. Notification dispatched!`,
      order: formatOrderRow(updatedRows[0])
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3d. REASSIGN RIDER (Admin or Staff reassigns to another rider)
router.post('/:id/reassign-rider', async (req, res) => {
  const { id } = req.params
  const { rider_id, estimated_delivery_time = '30 - 45 mins', delivery_notes } = req.body

  if (!rider_id) {
    return res.status(400).json({ status: 'error', message: 'rider_id is required.' })
  }

  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = orderRows[0]
    const previousRiderId = order.rider_id

    // Verify New Rider
    const [riderRows] = await pool.query(`
      SELECT user_id, full_name, phone_number, vehicle_type, plate_number, rider_status 
      FROM users 
      WHERE user_id = ? AND role = 'rider' 
      LIMIT 1
    `, [rider_id])

    if (riderRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Selected rider not found.' })
    }
    const newRider = riderRows[0]

    const vehicleDesc = `${newRider.vehicle_type || 'Motorcycle'} (${newRider.plate_number || 'N/A'})`

    // Reset previous rider if needed
    if (previousRiderId && previousRiderId !== rider_id) {
      await pool.query("UPDATE users SET rider_status = 'Available' WHERE user_id = ? AND rider_status = 'Delivering'", [previousRiderId]).catch(() => {})
      createNotificationRecord({
        recipient_role: 'rider',
        user_id: previousRiderId,
        title: `Order #${order.order_code} Reassigned`,
        message: `Order #${order.order_code} has been reassigned to another driver by dispatch management.`,
        action_url: '/rider'
      }).catch(() => {})
    }

    // Update order
    await pool.query(`
      UPDATE orders 
      SET rider_id = ?,
          rider_name = ?,
          rider_phone = ?,
          vehicle_info = ?,
          estimated_delivery_time = ?,
          delivery_notes = COALESCE(?, delivery_notes),
          delivery_status = 'Assigned'
      WHERE order_id = ?
    `, [rider_id, newRider.full_name, newRider.phone_number, vehicleDesc, estimated_delivery_time, delivery_notes || null, id])

    // Notify New Rider
    createNotificationRecord({
      recipient_role: 'rider',
      user_id: newRider.user_id,
      title: `🛵 New Delivery Assignment: #${order.order_code}`,
      message: `You have been assigned to deliver Order #${order.order_code} to ${order.delivery_address || 'Customer destination'}. Please review in your Rider app.`,
      action_url: '/rider/requests'
    }).catch(() => {})

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])

    res.json({
      status: 'success',
      message: `Order #${order.order_code} reassigned to ${newRider.full_name}.`,
      order: formatOrderRow(updatedRows[0])
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3e. ASSIGN RIDER & DISPATCH DELIVERY (Legacy / Direct Dispatch)
router.put('/:id/dispatch-delivery', async (req, res) => {
  const { id } = req.params
  const { rider_id, rider_name, rider_phone, vehicle_info, estimated_delivery_time, delivery_notes } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const previousStatus = order.status
    const newStatus = 'Out for Delivery'

    await pool.query(
      `UPDATE orders 
       SET status = ?, 
           rider_id = COALESCE(?, rider_id),
           rider_name = COALESCE(?, rider_name), 
           rider_phone = COALESCE(?, rider_phone), 
           vehicle_info = COALESCE(?, vehicle_info), 
           estimated_delivery_time = COALESCE(?, estimated_delivery_time), 
           delivery_notes = COALESCE(?, delivery_notes),
           delivery_status = 'On the Way',
           dispatched_at = NOW() 
       WHERE order_id = ?`,
      [newStatus, rider_id || null, rider_name || null, rider_phone || null, vehicle_info || null, estimated_delivery_time || null, delivery_notes || null, id]
    )

    if (rider_id) {
      await pool.query("UPDATE users SET rider_status = 'Delivering' WHERE user_id = ?", [rider_id]).catch(() => {})
    }

    const updatedOrder = {
      ...order,
      status: newStatus,
      delivery_status: 'On the Way',
      rider_id: rider_id || order.rider_id,
      rider_name: rider_name || order.rider_name,
      rider_phone: rider_phone || order.rider_phone,
      vehicle_info: vehicle_info || order.vehicle_info,
      estimated_delivery_time: estimated_delivery_time || order.estimated_delivery_time,
      delivery_address: order.delivery_address
    }

    notifyOrderStatusChange(updatedOrder, newStatus, previousStatus).catch(e => {
      console.warn('[Orders] Delivery dispatch notification error:', e.message)
    })

    res.json({
      status: 'success',
      message: `Order #${order.order_code || id} is now OUT FOR DELIVERY with rider ${rider_name || 'Assigned Driver'}!`,
      order: formatOrderRow(updatedOrder)
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3b. UPDATE ORDER PAYMENT STATUS (Staff counter collection or online confirmation)
router.put('/:id/payment', async (req, res) => {
  const { id } = req.params
  const {
    payment_status = 'paid',
    payment_method = 'counter',
    payment_id = null,
    payment_reference = null,
    payment_notes = null
  } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const finalPayStatus = payment_status.toLowerCase()
    const paidAt = finalPayStatus === 'paid' ? new Date() : null
    const finalRef = payment_reference || payment_id || order.payment_reference || null

    await pool.query(
      'UPDATE orders SET payment_status = ?, payment_method = ?, payment_id = ?, payment_reference = ?, payment_notes = ?, paid_at = ? WHERE order_id = ?',
      [finalPayStatus, payment_method, payment_id || finalRef, finalRef, payment_notes, paidAt, id]
    )

    // Notify customer that payment was recorded
    if (order.customer_email && finalPayStatus === 'paid') {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        user_id: order.user_id || null,
        reservation_code: order.order_code,
        type: 'payment_received',
        title: `Payment Confirmed for Order #${order.order_code}`,
        message: `Your payment of ₱${parseFloat(order.grand_total).toFixed(2)} via ${payment_method.toUpperCase()} has been confirmed! Our staff can now accept your order and start preparation.`,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    res.json({
      status: 'success',
      message: `Order payment marked as ${finalPayStatus.toUpperCase()}!`,
      order_id: id,
      payment_status: finalPayStatus,
      payment_method,
      payment_reference: finalRef
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3c. RECORD ONLINE PAYMENT (GCash, Maya, Bank Transfer, PayMongo with Reference ID)
router.post('/:id/record-online-payment', async (req, res) => {
  const { id } = req.params
  const {
    payment_method = 'gcash',
    payment_reference = '',
    payment_notes = '',
    amount = null
  } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const finalRef = payment_reference ? payment_reference.trim() : `ONLINE-${Date.now().toString().slice(-6)}`
    const paidAt = new Date()

    await pool.query(
      `UPDATE orders 
       SET payment_status = 'paid',
           payment_method = ?,
           payment_id = ?,
           payment_reference = ?,
           payment_notes = ?,
           paid_at = ?
       WHERE order_id = ?`,
      [payment_method, finalRef, finalRef, payment_notes, paidAt, id]
    )

    // Send customer notification
    if (order.customer_email) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        user_id: order.user_id || null,
        reservation_code: order.order_code,
        type: 'payment_received',
        title: `Online Payment Confirmed for Order #${order.order_code}`,
        message: `Your payment of ₱${parseFloat(amount || order.grand_total).toFixed(2)} via ${payment_method.toUpperCase()} (Ref: ${finalRef}) has been recorded and confirmed!`,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    res.json({
      status: 'success',
      message: `Online payment recorded successfully for Order #${order.order_code || id}!`,
      order_id: id,
      payment_method,
      payment_reference: finalRef,
      payment_notes
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3d. UPDATE PAYMENT DETAILS (Reference Number / Notes / Method)
router.put('/:id/payment-details', async (req, res) => {
  const { id } = req.params
  const {
    payment_reference = null,
    payment_notes = null,
    payment_method = null
  } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const finalMethod = payment_method || order.payment_method
    const finalRef = payment_reference !== null ? payment_reference : (order.payment_reference || order.payment_id)
    const finalNotes = payment_notes !== null ? payment_notes : order.payment_notes

    await pool.query(
      `UPDATE orders 
       SET payment_method = ?,
           payment_reference = ?,
           payment_notes = ?,
           payment_id = COALESCE(?, payment_id)
       WHERE order_id = ?`,
      [finalMethod, finalRef, finalNotes, finalRef, id]
    )

    res.json({
      status: 'success',
      message: 'Payment details updated successfully.',
      order_id: id,
      payment_method: finalMethod,
      payment_reference: finalRef,
      payment_notes: finalNotes
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3c. PROCESS / RECORD ORDER REFUND
router.post('/:id/refund', async (req, res) => {
  const { id } = req.params
  const {
    refund_amount = null,
    refund_reason = 'Customer refund / Order cancelled',
    refund_method = 'original_method',
    staff_notes = ''
  } = req.body

  try {
    const [existingRows] = await pool.query('SELECT * FROM orders WHERE order_id = ? LIMIT 1', [id])
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' })
    }
    const order = existingRows[0]
    const currentPayStatus = (order.payment_status || '').toLowerCase()

    if (currentPayStatus !== 'paid' && currentPayStatus !== 'refund_pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot refund order with payment status: ${order.payment_status}. Only paid or pending-refund orders can be refunded.`
      })
    }

    const finalRefundAmount = refund_amount !== null ? parseFloat(refund_amount) : parseFloat(order.grand_total || 0)
    const refundedAt = new Date()

    // If order was active, mark as Cancelled so it does not stay in kitchen queue
    let newOrderStatus = order.status
    if (['Pending', 'New', 'Accepted', 'Preparing', 'Ready'].includes(order.status)) {
      newOrderStatus = 'Cancelled'
    }

    await pool.query(
      `UPDATE orders 
       SET payment_status = 'refunded',
           status = ?,
           refund_amount = ?,
           refund_reason = ?,
           refunded_at = ?
       WHERE order_id = ?`,
      [newOrderStatus, finalRefundAmount, refund_reason, refundedAt, id]
    )

    // Notify customer
    if (order.customer_email) {
      createNotificationRecord({
        recipient_role: 'customer',
        recipient_email: order.customer_email,
        user_id: order.user_id || null,
        reservation_code: order.order_code,
        type: 'order_refund',
        title: `Refund Processed for Order #${order.order_code}`,
        message: `Your refund of ₱${finalRefundAmount.toFixed(2)} for Order #${order.order_code} has been processed (${refund_reason}).`,
        action_url: '/my-orders'
      }).catch(() => {})
    }

    // Notify staff
    createNotificationRecord({
      recipient_role: 'staff',
      reservation_code: order.order_code,
      type: 'order_refund',
      title: `Refund Issued: Order #${order.order_code}`,
      message: `Refund of ₱${finalRefundAmount.toFixed(2)} recorded for Order #${order.order_code} (${refund_reason}).`,
      action_url: '/admin/payments'
    }).catch(() => {})

    res.json({
      status: 'success',
      message: `Refund of ₱${finalRefundAmount.toFixed(2)} processed successfully.`,
      order_id: id,
      refund_amount: finalRefundAmount,
      refund_reason,
      refunded_at: refundedAt
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 4. DELETE ORDER
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM orders WHERE order_id = ?', [id])
    res.json({ status: 'success', message: 'Order removed successfully.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router

