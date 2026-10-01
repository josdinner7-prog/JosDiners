// Normalization Helpers for Staff Orders and Reservations

export function normalizeStaffOrder(o) {
  if (!o) return null
  let items = []
  if (Array.isArray(o.items)) {
    items = o.items
  } else if (o.items_json) {
    try {
      items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : o.items_json
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
    special_instructions: it.special_instructions || it.notes || '',
    completed: it.completed ?? (o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Completed'),
    prep_status: it.prep_status || (o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Completed' ? 'Ready' : (o.status === 'Preparing' || o.status === 'In Progress' ? 'Preparing' : (o.status === 'Accepted' ? 'Accepted' : 'Pending')))
  }))

  const createdAt = o.created_at ? new Date(o.created_at) : null
  const diffMs = createdAt && !isNaN(createdAt.getTime()) ? Math.max(0, Date.now() - createdAt.getTime()) : null
  const calculatedElapsed = diffMs !== null ? Math.floor(diffMs / 60000) : 4
  const elapsedMins = typeof o.elapsed_mins === 'number' ? o.elapsed_mins : (isNaN(calculatedElapsed) ? 4 : calculatedElapsed)

  const deliv = o.delivery_address || ''
  const rawType = String(o.order_type || '').toLowerCase()
  const isDelivery = rawType.includes('delivery') || (!deliv.toLowerCase().includes('pickup') && !deliv.toLowerCase().includes('counter') && !deliv.toLowerCase().includes('dine') && deliv.trim().length > 3)
  const isTakeout = !isDelivery && (rawType.includes('takeout') || deliv.toLowerCase().includes('takeout') || deliv.toLowerCase().includes('pickup'))
  const orderType = isDelivery ? 'Delivery' : (isTakeout ? 'Takeout' : 'Dine-in')
  const tableNum = isDelivery ? (deliv || 'Delivery Address') : 'Pickup Counter'

  return {
    ...o,
    order_id: o.order_id,
    customer_name: o.customer_name || 'Walk-in Guest',
    phone: o.customer_phone || o.phone || 'Counter Terminal',
    order_type: orderType,
    table_number: tableNum,
    status: o.status || 'New',
    elapsed_mins: elapsedMins,
    total_amount: parseFloat(o.grand_total || o.total_amount || 0),
    grand_total: parseFloat(o.grand_total || o.total_amount || 0),
    delivery_address: o.delivery_address || '',
    delivery_fee: parseFloat(o.delivery_fee || 0),
    delivery_notes: o.delivery_notes || '',
    rider_id: o.rider_id || null,
    rider_name: o.rider_name || null,
    rider_phone: o.rider_phone || null,
    vehicle_info: o.vehicle_info || null,
    delivery_status: o.delivery_status || (o.rider_name ? 'Assigned' : 'Unassigned'),
    declined_rider_ids: o.declined_rider_ids || null,
    estimated_delivery_time: o.estimated_delivery_time || null,
    dispatched_at: o.dispatched_at || null,
    delivered_at: o.delivered_at || null,
    payment_method: o.payment_method || 'counter',
    payment_status: (o.payment_status || 'unpaid').toLowerCase(),
    payment_id: o.payment_id || null,
    paid_at: o.paid_at || null,
    created_at: o.created_at || 'Just now',
    items: normalizedItems
  }
}

export function normalizeStaffReservation(res) {
  if (!res) return null
  const dep = parseFloat(res.deposit || res.deposit_paid || 0)
  const total = parseFloat(res.total_quote || res.total_amount || 0)
  const guests = parseInt(res.pax || res.guest_count || res.guests || 2, 10)
  const name = res.customer_name || res.contact_name || res.contact_person || res.guest_name || 'Walk-in Guest'
  const phone = res.phone || res.contact_phone || 'N/A'
  const loc = res.location || res.hall_name || res.venue_address || 'Main Dining Hall'
  const type = res.reservation_type || res.event_type || res.category || 'Table Dining'
  const dateRaw = res.date || res.event_date || 'Today'
  const dateStr = typeof dateRaw === 'string' && dateRaw.includes('T') ? dateRaw.split('T')[0] : String(dateRaw)
  const timeStr = res.time || res.event_time || '12:00 PM'
  const idStr = res.id || res.reservation_code || (res.reservation_id ? `RES-${res.reservation_id}` : 'RES-000')

  return {
    ...res,
    id: idStr,
    customer_name: name,
    phone: phone,
    reservation_type: type,
    location: loc,
    date: dateStr,
    time: timeStr,
    pax: isNaN(guests) ? 2 : guests,
    deposit: isNaN(dep) ? 0 : dep,
    total_quote: isNaN(total) ? 0 : total,
    status: res.status || 'Pending',
    notes: res.notes || res.special_requests || ''
  }
}
