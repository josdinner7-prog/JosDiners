import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useToast } from '../../components/ToastNotification'
import { useAuth } from '../../auth/AuthContext'
import api from '../../services/api'
import BanquetEventOrderModal from '../../components/BanquetEventOrderModal'

const INITIAL_KITCHEN_ORDERS = [
  {
    order_id: '1025',
    order_code: 'JOS-849205',
    customer_name: 'Juan Dela Cruz',
    order_type: 'Dine-in',
    table_number: 'Table 05',
    status: 'Accepted',
    elapsed_mins: 4,
    created_at: '10:14 AM',
    station: 'Hot Mains',
    notes: 'Extra crispy, vinegar dip on side',
    items: [
      { id: 1, name: "Chicken Meal Supreme", quantity: 2, prep_status: 'Pending' },
      { id: 2, name: "House Blend Iced Tea (Large)", quantity: 2, prep_status: 'Ready' }
    ]
  },
  {
    order_id: '1024',
    order_code: 'JOS-849204',
    customer_name: 'Maria Santos',
    order_type: 'Takeout',
    table_number: 'Pickup Counter',
    status: 'Preparing',
    elapsed_mins: 12,
    created_at: '10:06 AM',
    station: 'Grill & Fryer',
    notes: 'Extra gravy sauce on side',
    items: [
      { id: 1, name: "Jo's Special Lechon Kawali", quantity: 2, prep_status: 'Preparing' },
      { id: 2, name: "Chicken Inasal Supreme", quantity: 1, prep_status: 'Ready' }
    ]
  },
  {
    order_id: '1023',
    order_code: 'JOS-849203',
    customer_name: 'Engr. Robert Gomez',
    order_type: 'Dine-in',
    table_number: 'VIP Table 08',
    status: 'Preparing',
    elapsed_mins: 18,
    created_at: '10:00 AM',
    station: 'Sizzlers',
    notes: 'Severe peanut allergy - ensure clean pan!',
    items: [
      { id: 1, name: "Sizzling Pork Sisig Platter", quantity: 2, prep_status: 'Preparing' },
      { id: 2, name: "Sinigang na Baboy sa Sampalok", quantity: 1, prep_status: 'Preparing' },
      { id: 3, name: "Pancit Canton Special", quantity: 1, prep_status: 'Ready' }
    ]
  },
  {
    order_id: '1022',
    order_code: 'JOS-849202',
    customer_name: 'Dr. Clara Reyes',
    order_type: 'Dine-in',
    table_number: 'Table 02',
    status: 'Ready',
    elapsed_mins: 25,
    created_at: '09:53 AM',
    station: 'Grill & Fryer',
    notes: 'Well done crispy skin',
    items: [
      { id: 1, name: "Crispy Pata Special", quantity: 1, prep_status: 'Ready' },
      { id: 2, name: "Halo-Halo Overload Supreme", quantity: 1, prep_status: 'Ready' }
    ]
  }
]

const INITIAL_STOCK_ALERTS = [
  { id: 1, item: 'Pork Belly (Liempo)', level: 'Low Stock (8kg left)', urgency: 'high', station: 'Hot Mains' },
  { id: 2, item: 'Annatto Oil (Achuete)', level: 'Reorder Point (2L left)', urgency: 'medium', station: 'Grill & Fryer' },
  { id: 3, item: 'Bangus Belly', level: 'Adequate (15 packs)', urgency: 'low', station: 'Sizzlers' },
  { id: 4, item: 'Calamansi & Siling Labuyo', level: 'Low Stock (1.5kg)', urgency: 'high', station: 'Pantry' }
]

// Web Audio API KDS Chime
function playKDSChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12) // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

function normalizeKitchenOrder(o) {
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
    prep_status: it.prep_status || (o.status === 'Ready' || o.status === 'Completed' || o.status === 'Delivered' ? 'Ready' : (o.status === 'Preparing' || o.status === 'In Progress' ? 'Preparing' : 'Pending')),
    special_instructions: it.special_instructions || it.notes || ''
  }))

  const createdAt = o.created_at ? new Date(o.created_at) : null
  const diffMs = createdAt && !isNaN(createdAt.getTime()) ? Math.max(0, Date.now() - createdAt.getTime()) : null
  const calculatedElapsed = diffMs !== null ? Math.floor(diffMs / 60000) : 4
  const elapsedMins = typeof o.elapsed_mins === 'number' ? o.elapsed_mins : (isNaN(calculatedElapsed) ? 4 : calculatedElapsed)

  const deliv = (o.delivery_address || '').trim()
  const isDelivery = (o.order_type || '').toLowerCase() === 'delivery' || 
    (deliv && !deliv.toLowerCase().includes('pickup') && !deliv.toLowerCase().includes('takeout') && !deliv.toLowerCase().includes('dine'))
  const isTakeout = (o.order_type || '').toLowerCase() === 'takeout' || deliv.toLowerCase().includes('takeout') || deliv.toLowerCase().includes('pickup')

  let orderType = 'Dine-in'
  if (isDelivery) {
    orderType = 'Delivery'
  } else if (isTakeout) {
    orderType = 'Takeout'
  } else if (o.order_type) {
    orderType = o.order_type
  }

  const tableNum = o.table_number || (isDelivery ? '🛵 Delivery Dispatch' : isTakeout ? 'Pickup Counter' : 'Table 01')

  return {
    ...o,
    order_id: o.order_id,
    order_code: o.order_code || `ORD-${o.order_id}`,
    customer_name: o.customer_name || (isDelivery ? 'Delivery Customer' : 'Walk-in Guest'),
    order_type: orderType,
    table_number: tableNum,
    delivery_address: deliv,
    delivery_notes: o.delivery_notes || '',
    rider_name: o.rider_name || null,
    status: o.status || 'Accepted',
    elapsed_mins: elapsedMins,
    station: o.station || 'Hot Mains',
    notes: o.notes || '',
    items: normalizedItems
  }
}

export default function KitchenLayout({ staffUser: propStaffUser, onLogout, onSwitchToCustomer }) {
  const { showToast } = useToast()
  const { staffUser: authStaffUser, logoutStaff } = useAuth()
  const navigate = useNavigate()

  const staffUser = propStaffUser || authStaffUser

  const handleLogout = () => {
    if (onLogout) onLogout()
    logoutStaff()
    showToast('Logged out of Kitchen Display System.', 'info')
    navigate('/Rolelogin')
  }

  const handleSwitchToCustomer = () => {
    if (onSwitchToCustomer) onSwitchToCustomer()
    navigate('/')
  }

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('jos_kitchen_dark_mode') === 'true'
  })

  const [currentTime, setCurrentTime] = useState(new Date())
  const [shiftStartTime] = useState(new Date())
  const [kitchenOrders, setKitchenOrders] = useState(() => INITIAL_KITCHEN_ORDERS.map(normalizeKitchenOrder))
  const [stockAlerts, setStockAlerts] = useState(INITIAL_STOCK_ALERTS)
  const [dismissedOrderIds, setDismissedOrderIds] = useState(new Set())

  const location = useLocation()
  // Controls: Primary Kitchen Tab ('kds' or 'beo_prep')
  const [activeKitchenTab, setActiveKitchenTab] = useState(() => {
    return location.pathname.includes('beo') ? 'beo_prep' : 'kds'
  })
  const [stationFilter, setStationFilter] = useState('All')
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'grid'
  const [searchQuery, setSearchQuery] = useState('')
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [newStockItemName, setNewStockItemName] = useState('')
  const [newStockLevel, setNewStockLevel] = useState('')

  // BEO & Kitchen Preparation Sheet Sync State
  const [beoBookings, setBeoBookings] = useState([])
  const [isLoadingBEOs, setIsLoadingBEOs] = useState(false)
  const [lastBEOSyncTime, setLastBEOSyncTime] = useState(null)
  const [beoStatusFilter, setBeoStatusFilter] = useState('All')
  const [beoSearchQuery, setBeoSearchQuery] = useState('')
  const [selectedBEOForModal, setSelectedBEOForModal] = useState(null)
  const [isBEOModalOpen, setIsBEOModalOpen] = useState(false)
  const [isBatchPrepModalOpen, setIsBatchPrepModalOpen] = useState(false)
  const [prepChecklist, setPrepChecklist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jos_kitchen_prep_checklist') || '{}')
    } catch (e) {
      return {}
    }
  })

  const togglePrepCheckItem = (key) => {
    setPrepChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('jos_kitchen_prep_checklist', JSON.stringify(next))
      } catch (e) {}
      return next
    })
  }

  const prevOrdersCountRef = useRef(0)

  useEffect(() => {
    fetchKitchenOrders()
    fetchBEOBookings()
    const interval = setInterval(() => {
      fetchKitchenOrders()
      fetchBEOBookings()
    }, 9000)
    return () => clearInterval(interval)
  }, [])

  const fetchKitchenOrders = async () => {
    try {
      const data = await api.orders.getOrders()
      const list = (data.status === 'success' && Array.isArray(data.orders || data.data)) ? (data.orders || data.data) : []
      if (list.length > 0) {
        const normalized = list.map(normalizeKitchenOrder)
        // Check if new orders arrived to sound chime
        const activeCount = normalized.filter(o => o.status === 'Accepted' || o.status === 'Preparing').length
        if (activeCount > prevOrdersCountRef.current && prevOrdersCountRef.current > 0 && isSoundEnabled) {
          playKDSChime()
        }
        prevOrdersCountRef.current = activeCount
        setKitchenOrders(normalized)
      }
    } catch (e) {
      // Keep optimistic state
    }
  }

  const fetchBEOBookings = async () => {
    try {
      setIsLoadingBEOs(true)
      const res = await api.reservations.getReservations().catch(() => ({ reservations: [] }))
      const allRes = Array.isArray(res) ? res : (res?.reservations || res?.data || [])

      const cateringEvents = allRes.filter(r => {
        if (!r) return false
        const type = String(r.reservation_type || r.type || r.category || '').toLowerCase()
        const occasion = String(r.occasion || '').toLowerCase()
        const guests = parseInt(r.guest_count || r.guests || 0, 10)
        return type.includes('catering') || type.includes('hall') || type.includes('event') || guests >= 10 || occasion.includes('wedding') || occasion.includes('birthday') || occasion.includes('corporate')
      })

      const formatted = cateringEvents.map((item, idx) => {
        if (!item) return null
        const bookingCode = item.booking_code || item.reservation_code || item.id || `EVT-${1000 + idx}`
        const guests = parseInt(item.guest_count || item.guests || 30, 10)
        
        const rawDate = item.event_date || item.reservation_date || item.date || ''
        const dateStr = rawDate ? String(rawDate).split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0]
        
        const timeStr = item.event_time || item.reservation_time || '11:30 AM'
        const totalAmt = parseFloat(item.total_amount || item.total_quote || (guests * 550)) || 0
        const depPaid = parseFloat(item.deposit_paid || item.amount_paid || item.deposit || (totalAmt * 0.5)) || 0

        let menuCourses = []
        if (item.selected_dishes || item.included_dishes || item.custom_menu_dishes) {
          try {
            const raw = item.selected_dishes || item.included_dishes || item.custom_menu_dishes
            menuCourses = typeof raw === 'string' ? JSON.parse(raw) : raw
          } catch (e) {
            menuCourses = []
          }
        }
        if (!Array.isArray(menuCourses) || menuCourses.length === 0) {
          menuCourses = [
            { category: 'Appetizer', dish: 'Crispy Lumpiang Shanghai with Sweet Chili Dip', qty: `${guests * 2} pcs` },
            { category: 'Main Dish 1', dish: 'Slow-Roasted Beef Caldereta with Mushrooms', qty: `${guests} Servings` },
            { category: 'Main Dish 2', dish: 'Crispy Garlic Fried Chicken Fillet with Gravy', qty: `${guests} Servings` },
            { category: 'Pasta / Noodles', dish: 'Creamy Seafood Carbonara Medley', qty: `${Math.ceil(guests / 15)} Large Bilao` },
            { category: 'Dessert', dish: 'Creamy Buko Pandan Salad Trays', qty: `${guests} Cups` },
            { category: 'Beverage', dish: 'Bottomless Signature Red Iced Tea', qty: `${Math.ceil(guests * 0.5)}L Dispenser` }
          ]
        }

        const category = item.category || (item.reservation_type && String(item.reservation_type).toLowerCase().includes('hall') ? 'hall' : 'catering')
        const venueName = item.venue_name || item.event_venue || item.hall_name || (category === 'hall' ? "Jo's Diner Function Hall" : "Customer's Private Venue")

        let eventTitle = item.event_name || item.event_title || item.package_name || item.occasion || 'Banquet Event'
        if (item.occasion && item.package_name && !item.event_name && item.occasion !== item.package_name) {
          eventTitle = `${item.occasion} (${item.package_name})`
        }

        let currentStatus = item.beo_status || item.status || 'Confirmed'
        try {
          const localOverrides = JSON.parse(localStorage.getItem('josdiner_beo_records') || '[]')
          const matchingOverride = Array.isArray(localOverrides) && localOverrides.find(b => String(b?.id) === String(item.id || item.reservation_id) || b?.booking_code === bookingCode)
          if (matchingOverride?.status) currentStatus = matchingOverride.status
        } catch (e) {}

        return {
          id: item.id || item.reservation_id || `beo-${idx}`,
          beo_number: item.beo_number || `BEO-2026-${bookingCode}`,
          booking_code: bookingCode,
          event_title: eventTitle,
          event_type: item.occasion || item.event_type || 'Banquet Celebration',
          category: category,
          customer_name: item.contact_name || item.customer_name || item.contact_person || item.name || 'Guest Client',
          phone: item.contact_phone || item.phone || item.customer_phone || 'N/A',
          email: item.email || item.customer_email || 'client@example.com',
          event_date: dateStr,
          dispatch_time: item.dispatch_time || '09:00 AM',
          setup_time: item.setup_time || '10:00 AM',
          service_time: item.service_time || timeStr,
          breakdown_time: item.breakdown_time || '03:30 PM',
          event_venue: venueName,
          venue_address: item.venue_address || (item.venue_type === 'diner_function_hall' ? "Jo's Diner Complex, General Santos Highway" : 'Customer Specified Address'),
          venue_type: item.venue_type || (category === 'hall' ? 'diner_function_hall' : 'customer_venue'),
          guests: guests,
          guaranteed_pax: guests,
          package_name: item.package_name || 'Signature Banquet Package',
          service_style: item.service_style || 'Buffet with Chafing Trays & Dedicated Waiters',
          assigned_chef: item.assigned_chef || 'Chef Eduardo (Executive Head Chef)',
          banquet_captain: item.banquet_captain || 'Captain Marco Santos (Lead)',
          assigned_crew: item.assigned_crew || `${Math.max(2, Math.round(guests / 15))}x Waiters, 2x Buffet Attendants, 1x Logistics Driver`,
          equipment: item.equipment || '4x Roll-Top Chafing Trays, 2x Drink Dispensers, Full Dinnerware',
          total_amount: totalAmt,
          deposit_paid: depPaid,
          status: currentStatus,
          special_requests: item.special_requests || item.special_request || '',
          table_arrangement: item.table_arrangement || `${Math.ceil(guests / 10)}x 10-Seater Round Tables + 1x Head VIP Table`,
          linen_color: item.linen_color || 'Burgundy Crimson & Champagne Gold',
          selected_dishes: menuCourses
        }
      }).filter(Boolean)

      setBeoBookings(formatted)
      setLastBEOSyncTime(new Date())
    } catch (err) {
      console.error('Error loading BEO sync data in kitchen:', err)
    } finally {
      setIsLoadingBEOs(false)
    }
  }

  // Filtered BEO bookings based on search and status
  const filteredBEOBookings = useMemo(() => {
    return beoBookings.filter(b => {
      if (!b) return false
      const matchesStatus = beoStatusFilter === 'All' || b.status === beoStatusFilter
      const q = beoSearchQuery.trim().toLowerCase()
      const matchesSearch = !q || (
        (b.beo_number && b.beo_number.toLowerCase().includes(q)) ||
        (b.event_title && b.event_title.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.event_venue && b.event_venue.toLowerCase().includes(q)) ||
        (Array.isArray(b.selected_dishes) && b.selected_dishes.some(d => (d?.dish || d?.name || '').toLowerCase().includes(q)))
      )
      return matchesStatus && matchesSearch
    })
  }, [beoBookings, beoStatusFilter, beoSearchQuery])

  // Consolidated Kitchen Batch Production Aggregation across filtered BEOs
  const consolidatedBatchPrep = useMemo(() => {
    const dishMap = {}

    if (Array.isArray(filteredBEOBookings)) {
      filteredBEOBookings.forEach(b => {
        if (!b) return
        if (Array.isArray(b.selected_dishes)) {
          b.selected_dishes.forEach(d => {
            if (!d) return
            const name = typeof d === 'string' ? d : (d.dish || d.name || 'Signature Item')
            const category = typeof d === 'object' && d.category ? d.category : 'Buffet Course'
            const key = `${category}:::${name}`

            if (!dishMap[key]) {
              dishMap[key] = {
                key,
                category,
                dishName: name,
                totalEvents: 0,
                totalPax: 0,
                eventCodes: [],
                portionNotes: d.qty || ''
              }
            }
            dishMap[key].totalEvents += 1
            dishMap[key].totalPax += (parseInt(b.guests, 10) || 30)
            if (b.beo_number) dishMap[key].eventCodes.push(b.beo_number)
          })
        }
      })
    }

    return Object.values(dishMap).sort((a, b) => a.category.localeCompare(b.category))
  }, [filteredBEOBookings])

  // Update BEO status from kitchen terminal
  const handleUpdateBEOStatus = async (bookingId, newStatus) => {
    setBeoBookings(prev => prev.map(b => {
      if (String(b?.id) === String(bookingId) || b?.beo_number === bookingId || b?.booking_code === bookingId) {
        return { ...b, status: newStatus }
      }
      return b
    }))

    showToast(`BEO #${bookingId} updated to "${newStatus}"`, 'success')

    try {
      const saved = JSON.parse(localStorage.getItem('josdiner_beo_records') || '[]')
      const existingIdx = Array.isArray(saved) ? saved.findIndex(b => String(b?.id) === String(bookingId) || b?.beo_number === bookingId || b?.booking_code === bookingId) : -1
      if (existingIdx >= 0) {
        saved[existingIdx].status = newStatus
      } else {
        saved.push({ id: bookingId, status: newStatus })
      }
      localStorage.setItem('josdiner_beo_records', JSON.stringify(saved))
    } catch (e) {}

    try {
      await api.reservations.updateReservation(bookingId, { status: newStatus }).catch(() => {})
    } catch (e) {}
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('jos_kitchen_dark_mode', isDarkMode)
  }, [isDarkMode])

  const getShiftDuration = () => {
    const diffMs = currentTime - shiftStartTime
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(mins / 60)
    const remMins = mins % 60
    return `${hours}h ${remMins}m`
  }

  const staffRole = (staffUser?.role || 'kitchen').toUpperCase()
  const staffUsername = staffUser?.full_name || staffUser?.username || 'Head Chef Marco'

  // Update order status: Accepted -> Preparing -> Ready
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (isSoundEnabled) playKDSChime()

    setKitchenOrders(prev => prev.map(o => {
      if (o.order_id === orderId) {
        const updatedItems = (o.items || []).map(it => ({
          ...it,
          prep_status: newStatus === 'Ready' || newStatus === 'Completed' ? 'Ready' : it.prep_status
        }))
        return { ...o, status: newStatus, items: updatedItems }
      }
      return o
    }))

    showToast(`Order #${orderId} moved to "${newStatus}"`, 'success')

    try {
      await api.orders.updateStatus(orderId, newStatus)
    } catch (e) {
      // Optimistic state preserved
    }
  }

  // Toggle individual item prep checkbox
  const handleToggleItemPrep = async (orderId, itemId) => {
    if (isSoundEnabled) playKDSChime()

    let nextOrderStatus = null
    let updatedItemsList = []

    setKitchenOrders(prev => prev.map(o => {
      if (o.order_id === orderId) {
        const currentItems = Array.isArray(o.items) ? o.items : []
        const updatedItems = currentItems.map(it => {
          if (it.id === itemId) {
            const nextStatus = it.prep_status === 'Ready' ? 'Pending' : 'Ready'
            return { ...it, prep_status: nextStatus }
          }
          return it
        })
        updatedItemsList = updatedItems

        const allReady = updatedItems.length > 0 && updatedItems.every(i => i.prep_status === 'Ready')
        nextOrderStatus = allReady ? 'Ready' : (o.status === 'Accepted' || o.status === 'Pending' ? 'Preparing' : o.status)

        return {
          ...o,
          items: updatedItems,
          status: nextOrderStatus
        }
      }
      return o
    }))

    // Persist item status to server
    try {
      if (nextOrderStatus) {
        await api.orders.updateStatus(orderId, nextOrderStatus, updatedItemsList)
      }
    } catch (e) {
      // Ignored
    }
  }

  // Dismiss ticket from active KDS screen
  const handleDismissTicket = (orderId) => {
    setDismissedOrderIds(prev => new Set([...prev, orderId]))
    showToast(`Ticket #${orderId} dismissed from active screen.`, 'info')
  }

  // Add custom low stock alert
  const handleAddStockAlert = (e) => {
    e.preventDefault()
    if (!newStockItemName.trim()) return
    const newAlert = {
      id: Date.now(),
      item: newStockItemName.trim(),
      level: newStockLevel.trim() || 'Low Stock',
      urgency: 'high',
      station: 'Kitchen'
    }
    setStockAlerts(prev => [newAlert, ...prev])
    setNewStockItemName('')
    setNewStockLevel('')
    showToast(`Stock alert logged: "${newAlert.item}"`, 'warning')
  }

  // Kitchen KDS strictly shows paid & accepted orders: 'Accepted' (Queued), 'Preparing' (Cooking), and 'Ready'
  // Unpaid orders remain in Counter Staff console until paid & approved (Except COD Delivery orders which are prepared upon acceptance)
  const kitchenEligibleOrders = kitchenOrders.filter(o => {
    const isPaid = (o.payment_status || '').toLowerCase() === 'paid'
    const isCodDelivery = (o.order_type === 'Delivery' || (o.delivery_address && !o.delivery_address.toLowerCase().includes('pickup'))) &&
      (o.payment_method || '').toLowerCase().includes('cash')
    const isAcceptedStage = o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'In Progress' || o.status === 'Ready'
    const notDismissed = !dismissedOrderIds.has(o.order_id)
    return (isPaid || isCodDelivery) && isAcceptedStage && notDismissed
  })

  // Metrics
  const queuedCount = kitchenEligibleOrders.filter(o => o.status === 'Accepted').length
  const preparingCount = kitchenEligibleOrders.filter(o => o.status === 'Preparing' || o.status === 'In Progress').length
  const readyCount = kitchenEligibleOrders.filter(o => o.status === 'Ready').length

  // Filtered list based on Station & Search
  const filteredOrders = kitchenEligibleOrders.filter(o => {
    const matchesStation = stationFilter === 'All' || o.station === stationFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q || (
      (o.order_code && o.order_code.toLowerCase().includes(q)) ||
      (String(o.order_id).includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.table_number && o.table_number.toLowerCase().includes(q)) ||
      (o.items && o.items.some(it => it.name.toLowerCase().includes(q)))
    )
    return matchesStation && matchesSearch
  })

  const queuedOrders = filteredOrders.filter(o => o.status === 'Accepted')
  const inCookingOrders = filteredOrders.filter(o => o.status === 'Preparing' || o.status === 'In Progress')
  const completedCookingOrders = filteredOrders.filter(o => o.status === 'Ready')

  const renderOrderCard = (order, stage) => {
    const isQueued = stage === 'queued'
    const isCooking = stage === 'cooking'
    const isReady = stage === 'ready'

    const elapsed = order.elapsed_mins || 1
    const timerColor = elapsed > 20
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
      : elapsed > 10
        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'

    const borderAccent = isReady
      ? 'border-l-emerald-500'
      : isCooking
        ? 'border-l-sky-500'
        : 'border-l-amber-500'

    return (
      <div
        key={order.order_id}
        className={`p-3 rounded-md border shadow-xs space-y-2.5 transition relative border-l-4 ${borderAccent} ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-300'
          }`}
      >
        {/* Header: Ticket Code, Customer Name, Table & Elapsed Timer */}
        <div className="flex items-start justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs text-[#C8102E]">{order.order_code || `#${order.order_id}`}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {order.station || 'Hot Mains'}
              </span>
              {order.order_type === 'Delivery' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-0.5">
                  <span className="material-icons text-[10px]">two_wheeler</span> Delivery
                </span>
              )}
            </div>
            <h4 className="font-bold text-xs leading-tight mt-1 text-slate-900 dark:text-white">
              {order.customer_name}
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              {order.order_type} • {order.table_number}
            </span>
            {order.order_type === 'Delivery' && order.delivery_address && (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium block truncate max-w-[220px]" title={order.delivery_address}>
                📍 {order.delivery_address}
              </span>
            )}
          </div>

          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono border flex items-center gap-1 ${timerColor}`}>
              <span className="material-icons text-xs">timer</span>
              <span>{elapsed}m</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              {order.created_at || 'Recent'}
            </span>
          </div>
        </div>

        {/* Special Dietary / Allergy Alert Callout */}
        {(order.notes || order.special_instructions) && (
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
            <span className="material-icons text-sm text-amber-500 shrink-0">priority_high</span>
            <span>{order.notes || order.special_instructions}</span>
          </div>
        )}

        {/* Interactive Food Items List (Click to check off dish item) */}
        <div className="space-y-1 text-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            Dishes to Cook (Tap to Mark Ready):
          </span>

          {(order.items || []).map((it, idx) => {
            const isItemDone = it.prep_status === 'Ready'

            return (
              <div
                key={it.id || idx}
                onClick={() => handleToggleItemPrep(order.order_id, it.id || idx + 1)}
                className={`p-1.5 rounded-md border transition cursor-pointer flex items-center justify-between gap-2 select-none active:scale-98 ${isItemDone
                    ? isDarkMode
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 line-through opacity-80'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 line-through opacity-85'
                    : isDarkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`material-icons text-base ${isItemDone ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {isItemDone ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-xs truncate block">
                      <span className="text-[#C8102E] dark:text-red-400 mr-1">{it.quantity}x</span>
                      {it.name}
                    </span>
                    {it.special_instructions && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block truncate">
                        * {it.special_instructions}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono shrink-0 ${isItemDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                  {isItemDone ? 'READY' : 'COOKING'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bottom Culinary Action Buttons */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          {isQueued && (
            <button
              type="button"
              onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
              className="w-full py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-icons text-sm">local_fire_department</span>
              <span>START COOKING ORDER</span>
            </button>
          )}

          {isCooking && (
            <button
              type="button"
              onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
              className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-icons text-sm">check_circle</span>
              <span>MARK ALL READY FOR STAFF PICKUP</span>
            </button>
          )}

          {isReady && (
            <div className="space-y-1.5">
              <div className="p-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-center font-bold text-[11px] flex items-center justify-center gap-1.5">
                <span className="material-icons text-sm">task_alt</span>
                <span>Ready at Counter • Staff Notified</span>
              </div>
              <button
                type="button"
                onClick={() => handleDismissTicket(order.order_id)}
                className="w-full py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] cursor-pointer transition"
              >
                Dismiss From Screen
              </button>
            </div>
          )}
        </div>

      </div>
    )
  }

  return (
    <div className={`h-screen max-h-screen font-sans antialiased transition-colors duration-200 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}>

      {/* 1. TOP HEADER (Identical aesthetic & ergonomics to StaffLayout) */}
      <header className={`shrink-0 z-40 transition-colors duration-200 border-b ${isDarkMode ? 'bg-[#1C2541] border-slate-700 shadow-md text-white' : 'bg-white border-slate-300 shadow-xs text-slate-900'
        }`}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4 py-1">

            {/* Brand Logo & Telemetry */}
            <div className="flex items-center gap-3 shrink-0">
              <img src={logo} alt="Jo's Diner Logo" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition-transform hover:scale-105" />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`jos-diner-brand-title text-base font-black tracking-wide ${isDarkMode ? '!text-white' : '!text-[#C8102E]'}`}>
                    JO'S DINER
                  </span>
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                    <span>KITCHEN KDS</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider">
                  Culinary Order Queue & Prep Terminal
                </p>
              </div>
            </div>

            {/* Primary Kitchen Switcher: A La Carte vs BEO Prep Sheets */}
            <div className="flex items-center p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setActiveKitchenTab('kds')}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeKitchenTab === 'kds'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-icons text-sm">restaurant</span>
                <span className="hidden sm:inline">A La Carte</span> Orders
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
                  {kitchenOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveKitchenTab('beo_prep')}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeKitchenTab === 'beo_prep'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-icons text-sm">soup_kitchen</span>
                <span>BEO Prep Sheets & Sync</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-950/20 text-[10px] font-mono font-bold">
                  {beoBookings.length}
                </span>
              </button>
            </div>

            {/* Middle Shift Telemetry (Chef duty time) */}
            <div className={`hidden xl:flex items-center gap-4 text-xs font-bold transition ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Morning Culinary Shift</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{getShiftDuration()} active</span>
              <span className="text-slate-400">|</span>
              <span className="text-[#C8102E] dark:text-amber-300 font-mono font-black">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Quick Actions & Chef Profile */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Stock Alerts Shortcut Button */}
              <button
                type="button"
                onClick={() => setIsStockModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-bold text-xs transition cursor-pointer"
                title="View Low Stock Ingredients"
              >
                <span className="material-icons text-sm">inventory_2</span>
                <span className="hidden sm:inline">Stock Alerts</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                  {stockAlerts.filter(a => a.urgency === 'high').length}
                </span>
              </button>

              {/* Sound Chime Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled)
                  showToast(isSoundEnabled ? 'KDS chime muted' : 'KDS chime unmuted', 'info')
                }}
                className={`p-2 rounded-md border text-xs font-bold transition cursor-pointer ${isSoundEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                title={isSoundEnabled ? 'Audio chime active' : 'Audio chime muted'}
              >
                <span className="material-icons text-base block">{isSoundEnabled ? 'volume_up' : 'volume_off'}</span>
              </button>

              {/* Light/Dark Toggle */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-md border text-xs font-bold transition active:scale-95 cursor-pointer ${isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                title="Toggle Dark/Light Mode"
              >
                <span className="material-icons text-base block">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              </button>

              {/* Chef User Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-md border transition cursor-pointer ${isDarkMode ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                    }`}
                >
                  <div className="w-7 h-7 rounded bg-[#C8102E] text-white flex items-center justify-center font-black text-xs">
                    {staffUsername.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="font-black text-xs block leading-tight truncate max-w-[120px]">{staffUsername}</span>
                    <span className="text-[9px] text-amber-500 font-bold uppercase">{staffRole}</span>
                  </div>
                  <span className="material-icons text-sm text-slate-400">expand_more</span>
                </button>

                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-52 rounded-md shadow-xl border py-1.5 z-50 animate-in fade-in duration-150 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/80 text-xs">
                      <p className="font-bold">{staffUsername}</p>
                      <p className="text-[10px] text-amber-500 font-bold uppercase">Kitchen Terminal #01</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleSwitchToCustomer()
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-[#C8102E]">storefront</span>
                      <span>Customer Website</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        setIsShiftModalOpen(true)
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-emerald-500">badge</span>
                      <span>Chef Shift Duty Log</span>
                    </button>

                    <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <span className="material-icons text-base">logout</span>
                      <span>Clock Out & Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* 2. SECONDARY CONTROLS BAR */}
        {activeKitchenTab === 'kds' ? (
          /* A La Carte Controls (Station Filter Pills, View Mode, Search) */
          <div className={`px-4 sm:px-6 py-2 border-t flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 ${isDarkMode ? 'border-slate-700 bg-[#151D36]' : 'border-slate-200 bg-slate-50'}`}>
            {/* Station Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['All', 'Hot Mains', 'Grill & Fryer', 'Sizzlers', 'Pantry'].map(st => {
                const isSelected = stationFilter === st
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStationFilter(st)}
                    className={`px-3 py-1 rounded-md text-xs font-black transition cursor-pointer border whitespace-nowrap ${isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                  >
                    {st}
                  </button>
                )
              })}
            </div>

            {/* Search & View Mode Switcher */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="relative flex-1 md:w-56">
                <span className="material-icons absolute left-2.5 top-1.5 text-slate-400 text-sm pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Search dish, order code, table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-7 pr-3 py-1 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>

              {/* View Mode Switcher */}
              <div className="flex p-0.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1 rounded text-xs font-black flex items-center gap-1 cursor-pointer transition ${viewMode === 'kanban' ? 'bg-[#C8102E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  title="Kanban Column View"
                >
                  <span className="material-icons text-xs">view_column</span>
                  <span className="hidden sm:inline">Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded text-xs font-black flex items-center gap-1 cursor-pointer transition ${viewMode === 'grid' ? 'bg-[#C8102E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  title="High-Density Grid View"
                >
                  <span className="material-icons text-xs">grid_view</span>
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* BEO Prep Sheets & Sync Controls */
          <div className={`px-4 sm:px-6 py-2 border-t flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 ${isDarkMode ? 'border-slate-700 bg-[#151D36]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="material-icons text-sm text-amber-500">filter_alt</span>
                <span>BEO Filter:</span>
              </span>
              <div className="flex items-center gap-1">
                {['All', 'Confirmed', 'In Kitchen Prep', 'Ready for Dispatch', 'Dispatched'].map(st => {
                  const isSelected = beoStatusFilter === st
                  const count = st === 'All'
                    ? beoBookings.length
                    : st === 'Confirmed'
                      ? beoBookings.filter(b => b?.status === 'Confirmed' || b?.status === 'Pending').length
                      : beoBookings.filter(b => b?.status === st).length

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBeoStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                          : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-mono ${
                        isSelected ? 'bg-amber-950/20 text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search & Batch Prep Modal Launcher */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="relative flex-1 md:w-56">
                <span className="material-icons absolute left-2.5 top-1.5 text-slate-400 text-sm pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Search BEO, dish, venue, client..."
                  value={beoSearchQuery}
                  onChange={(e) => setBeoSearchQuery(e.target.value)}
                  className={`w-full pl-7 pr-3 py-1 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsBatchPrepModalOpen(true)}
                className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span className="material-icons text-sm">soup_kitchen</span>
                <span>Batch Prep Sheet</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN KDS BOARD: KANBAN / GRID OR BEO PREP SHEETS */}
      <main className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 py-3 flex-1 min-h-0 flex flex-col overflow-hidden">
        
        {activeKitchenTab === 'kds' ? (
          viewMode === 'kanban' ? (
            /* KANBAN 3-STAGE OPERATIONAL VIEW (EQUAL HEIGHT, INDEPENDENT SCROLL) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 h-full flex-1 min-h-0 items-stretch">
              
              {/* COLUMN 1: QUEUED TO COOK */}
              <div className={`p-3 rounded-md border shadow-2xs flex flex-col h-full min-h-0 overflow-hidden ${isDarkMode ? 'bg-[#1C2541]/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-amber-500 text-base">hourglass_empty</span>
                    <h3 className="font-black text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      1. Queued To Cook
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    {queuedOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pr-1 min-h-0 custom-kds-scrollbar">
                  {queuedOrders.map(order => renderOrderCard(order, 'queued'))}

                  {queuedOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                      <span className="material-icons text-3xl opacity-40 mb-1">done_all</span>
                      <p className="font-bold text-xs">No Queued Orders</p>
                      <p className="text-[10px] opacity-70 mt-0.5">Orders accepted by staff appear here for cooking.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: ACTIVE ON GRILL / COOKING */}
              <div className={`p-3 rounded-md border shadow-2xs flex flex-col h-full min-h-0 overflow-hidden ${isDarkMode ? 'bg-[#1C2541]/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-sky-500 text-base">local_fire_department</span>
                    <h3 className="font-black text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      2. Active In Cooking
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    {inCookingOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pr-1 min-h-0 custom-kds-scrollbar">
                  {inCookingOrders.map(order => renderOrderCard(order, 'cooking'))}

                  {inCookingOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                      <span className="material-icons text-3xl opacity-40 mb-1">skillet</span>
                      <p className="font-bold text-xs">No Dishes Currently Cooking</p>
                      <p className="text-[10px] opacity-70 mt-0.5">Click "Start Cooking" on any queued order.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 3: READY AT COUNTER */}
              <div className={`p-3 rounded-md border shadow-2xs flex flex-col h-full min-h-0 overflow-hidden ${isDarkMode ? 'bg-[#1C2541]/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-emerald-500 text-base">check_circle</span>
                    <h3 className="font-black text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      3. Ready For Staff Pickup
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    {completedCookingOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pr-1 min-h-0 custom-kds-scrollbar">
                  {completedCookingOrders.map(order => renderOrderCard(order, 'ready'))}

                  {completedCookingOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                      <span className="material-icons text-3xl opacity-40 mb-1">dining</span>
                      <p className="font-bold text-xs">No Plated Orders Waiting</p>
                      <p className="text-[10px] opacity-70 mt-0.5">Dishes marked ready will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* HIGH-DENSITY GRID TICKETS VIEW */
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-kds-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredOrders.map(order => {
                  const stage = order.status === 'Ready' ? 'ready' : (order.status === 'Preparing' || order.status === 'In Progress' ? 'cooking' : 'queued')
                  return renderOrderCard(order, stage)
                })}

                {filteredOrders.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <span className="material-icons text-5xl opacity-30 mb-2">restaurant</span>
                    <h3 className="text-base font-bold">Kitchen Queue Clear</h3>
                    <p className="text-xs opacity-70 mt-1">All kitchen orders have been prepared and delivered.</p>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* ========================================================================= */
          /* BEO KITCHEN PREPARATION SHEET & SYNC DASHBOARD                             */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
            
            {/* Top Operational Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 shrink-0">
              <div className={`p-2.5 rounded-lg border flex items-center gap-3 ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <span className="material-icons text-xl">event_available</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block truncate">Active BEOs</span>
                  <span className="text-base font-black text-amber-500">{filteredBEOBookings.length} Events</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-3 ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                  <span className="material-icons text-xl">groups</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block truncate">Total Event Pax</span>
                  <span className="text-base font-black text-sky-500">
                    {filteredBEOBookings.reduce((sum, b) => sum + (parseInt(b?.guests, 10) || 0), 0)} Guests
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-3 ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <span className="material-icons text-xl">soup_kitchen</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block truncate">Batch Recipes</span>
                  <span className="text-base font-black text-emerald-500">{consolidatedBatchPrep.length} Dishes</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-3 ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
                  <span className="material-icons text-xl">fact_check</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block truncate">Prep Checklist</span>
                  <span className="text-base font-black text-purple-500">
                    {Object.keys(prepChecklist).filter(k => prepChecklist[k]).length} / {consolidatedBatchPrep.length} Done
                  </span>
                </div>
              </div>

              <div className={`col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>BEO Sync Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {lastBEOSyncTime ? `Synced ${lastBEOSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchBEOBookings}
                  disabled={isLoadingBEOs}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-xs"
                >
                  <span className={`material-icons text-xs ${isLoadingBEOs ? 'animate-spin' : ''}`}>sync</span>
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Split Screen Dashboard: Batch Kitchen Production (Left) & Event BEO Run-Sheets (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
              
              {/* LEFT COLUMN (5 Cols): Consolidated Batch Kitchen Production Sheet */}
              <div className={`lg:col-span-5 rounded-lg border shadow-xs flex flex-col h-full min-h-0 overflow-hidden ${
                isDarkMode ? 'bg-[#1C2541]/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}>
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-100/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-amber-500 text-lg">format_list_bulleted</span>
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">Batch Production Sheet</h3>
                      <p className="text-[10px] text-slate-400">Consolidated kitchen mise en place across active events</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBatchPrepModalOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                  >
                    <span className="material-icons text-xs">print</span>
                    <span>Print Sheet</span>
                  </button>
                </div>

                {/* Batch Checklist Progress Bar */}
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                    <span>Mise en Place & Cooking Progress</span>
                    <span>
                      {consolidatedBatchPrep.length > 0
                        ? `${Math.round((Object.keys(prepChecklist).filter(k => prepChecklist[k]).length / consolidatedBatchPrep.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: `${consolidatedBatchPrep.length > 0 ? (Object.keys(prepChecklist).filter(k => prepChecklist[k]).length / consolidatedBatchPrep.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Batch Items List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-kds-scrollbar min-h-0">
                  {consolidatedBatchPrep.map((item) => {
                    const isChecked = !!prepChecklist[item.key]
                    return (
                      <div
                        key={item.key}
                        onClick={() => togglePrepCheckItem(item.key)}
                        className={`p-3 rounded-lg border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                            : isDarkMode
                            ? 'bg-slate-900/80 border-slate-700 hover:border-amber-500/50 text-slate-200'
                            : 'bg-white border-slate-200 hover:border-amber-500 text-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition shrink-0 ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                                : isDarkMode
                                ? 'border-slate-600 bg-slate-800 text-transparent'
                                : 'border-slate-400 bg-white text-transparent'
                            }`}
                          >
                            <span className="material-icons text-xs font-bold">check</span>
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                isChecked
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                              }`}>
                                {item.category}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                {item.totalEvents} Event{item.totalEvents > 1 ? 's' : ''}
                              </span>
                            </div>

                            <p className={`font-black text-sm mt-1.5 leading-snug ${
                              isChecked
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {item.dishName}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                              <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <span className="material-icons text-sm">groups</span>
                                <span>{item.totalPax} Pax Total</span>
                              </span>
                              {item.portionNotes && (
                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                  ({item.portionNotes})
                                </span>
                              )}
                            </div>

                            {/* Connected BEO Event Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.eventCodes.map((c, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-semibold border border-slate-200 dark:border-slate-700"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {consolidatedBatchPrep.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                      <span className="material-icons text-3xl opacity-30 mb-1">restaurant_menu</span>
                      <p className="font-bold text-xs">No Active BEO Dishes</p>
                      <p className="text-[10px] opacity-70">Dishes from confirmed catering/banquet reservations appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (7 Cols): Synchronized Event BEO Run-Sheets & Dispatch Timeline */}
              <div className={`lg:col-span-7 rounded-lg border shadow-xs flex flex-col h-full min-h-0 overflow-hidden ${
                isDarkMode ? 'bg-[#1C2541]/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}>
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-100/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sky-500 text-lg">event_note</span>
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">Synchronized Banquet Event Orders (BEO)</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Live operational sync between event sales and kitchen line</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30">
                    {filteredBEOBookings.length} BEO Run-Sheets
                  </span>
                </div>

                {/* Event BEO Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-kds-scrollbar min-h-0">
                  {filteredBEOBookings.map((beo) => {
                    const statusColor = 
                      beo.status === 'Ready for Dispatch' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                      beo.status === 'In Kitchen Prep' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40' :
                      beo.status === 'Dispatched' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40' :
                      'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'

                    return (
                      <div
                        key={beo.id}
                        className={`p-4 rounded-lg border shadow-xs transition hover:border-amber-500/50 ${
                          isDarkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                        }`}
                      >
                        {/* Top Bar: Code, Occasion, Status */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                                {beo.beo_number}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {beo.category === 'hall' ? 'Function Hall' : 'Catering Event'}
                              </span>
                            </div>
                            <h4 className="font-black text-base mt-1.5 text-slate-900 dark:text-white">
                              {beo.event_title}
                            </h4>
                          </div>

                          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border tracking-wider ${statusColor}`}>
                            {beo.status}
                          </span>
                        </div>

                        {/* Operational Dispatch Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Event Date</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">{beo.event_date}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Dispatch Deadline</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-300">{beo.dispatch_time}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Service Window</span>
                            <span className="font-extrabold text-amber-700 dark:text-amber-300">{beo.service_time}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Guaranteed Pax</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{beo.guests} Guests</span>
                          </div>
                        </div>

                        {/* Customer & Venue Details */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="material-icons text-sm text-slate-400">person</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{beo.customer_name}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">{beo.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-icons text-sm text-slate-400">location_on</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{beo.event_venue}</span>
                          </div>
                        </div>

                        {/* Dietary & Allergen Special Requirements Warning */}
                        {beo.special_requests && (
                          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2 mb-3">
                            <span className="material-icons text-base text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">warning</span>
                            <div>
                              <span className="uppercase text-[10px] font-black text-rose-700 dark:text-rose-400 block tracking-wider">Kitchen Dietary / Allergen Notice:</span>
                              <p className="font-semibold">{beo.special_requests}</p>
                            </div>
                          </div>
                        )}

                        {/* Course Breakdown */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 mb-3.5 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            BEO Menu Course Breakdown ({beo.selected_dishes?.length || 0} Courses)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {beo.selected_dishes?.map((d, i) => (
                              <div key={i} className="flex items-center justify-between gap-1.5 p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="truncate">
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mr-1.5">[{d?.category || 'Course'}]</span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">{d?.dish || d?.name}</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                  {d?.qty || `${beo.guests}pax`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Kitchen Terminal Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateBEOStatus(beo.id, 'In Kitchen Prep')}
                              className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                            >
                              <span className="material-icons text-sm">soup_kitchen</span>
                              <span>In Kitchen Prep</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBEOStatus(beo.id, 'Ready for Dispatch')}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                            >
                              <span className="material-icons text-sm">check_circle</span>
                              <span>Ready for Dispatch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBEOStatus(beo.id, 'Dispatched')}
                              className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                            >
                              <span className="material-icons text-sm">local_shipping</span>
                              <span>Dispatched</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBEOForModal(beo)
                              setIsBEOModalOpen(true)
                            }}
                            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-800 text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="material-icons text-sm">receipt_long</span>
                            <span>Official BEO Sheet</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {filteredBEOBookings.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                      <span className="material-icons text-3xl opacity-30 mb-1">event_busy</span>
                      <p className="font-bold text-xs">No Banquet Orders Found</p>
                      <p className="text-[10px] opacity-70">Try adjusting your filter or search query.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        <Outlet context={{ kitchenOrders, handleUpdateStatus, isDarkMode, beoBookings, handleUpdateBEOStatus }} />
      </main>

      {/* 4. LOW STOCK INGREDIENTS MODAL */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg p-5 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-amber-500 text-xl">inventory_2</span>
                <h3 className="font-extrabold text-sm uppercase">Kitchen Inventory & Stock Alerts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* List of current stock alerts */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-kds-scrollbar">
              {stockAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-md border flex items-center justify-between text-xs ${alert.urgency === 'high'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                    }`}
                >
                  <div>
                    <span className="font-black block">{alert.item}</span>
                    <span className="text-[10px] opacity-80">{alert.level} • {alert.station}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/60 text-white">
                    {alert.urgency}
                  </span>
                </div>
              ))}
            </div>

            {/* Add new stock alert form */}
            <form onSubmit={handleAddStockAlert} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-[11px] text-slate-400 uppercase block">Log Low Stock Ingredient:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Eggs)..."
                  value={newStockItemName}
                  onChange={(e) => setNewStockItemName(e.target.value)}
                  className={`flex-1 p-2 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                <input
                  type="text"
                  placeholder="Remaining (e.g. 5 trays)..."
                  value={newStockLevel}
                  onChange={(e) => setNewStockLevel(e.target.value)}
                  className={`w-28 p-2 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase shadow-xs transition active:scale-95 cursor-pointer"
              >
                + Log Stock Alert
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. CHEF DUTY SHIFT LOG MODAL */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-lg p-5 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-emerald-500 text-xl">badge</span>
                <h3 className="font-extrabold text-sm uppercase">Chef Duty Shift Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-md bg-slate-900 text-white space-y-2.5 border border-slate-800 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Head Chef:</span><span className="font-bold">{staffUsername}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Duty Terminal:</span><span className="font-bold">Culinary Station #1</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Clock-in Time:</span><span className="font-bold">{shiftStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Shift Elapsed:</span><span className="font-bold text-emerald-400">{getShiftDuration()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Orders Processed Today:</span><span className="font-black text-amber-400">{kitchenOrders.length}</span></div>
            </div>

            <button
              type="button"
              onClick={() => setIsShiftModalOpen(false)}
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-95"
            >
              Return to Kitchen Queue
            </button>
          </div>
        </div>
      )}

      {/* 6. CONSOLIDATED KITCHEN BATCH PREPARATION SHEET MODAL */}
      {isBatchPrepModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-100 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <span className="material-icons text-2xl">soup_kitchen</span>
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">Kitchen Batch Production & Mise En Place Sheet</h3>
                  <p className="text-xs text-slate-400">
                    Consolidated food preparation guide across {filteredBEOBookings.length} active banquet event orders
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-icons text-sm">print</span>
                  <span>Print Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPrepModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <span className="material-icons text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Print & Summary Stats Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Production Date</span>
                <span className="font-extrabold text-sm text-amber-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Guaranteed Pax</span>
                <span className="font-extrabold text-sm text-sky-400">
                  {filteredBEOBookings.reduce((sum, b) => sum + (parseInt(b?.guests, 10) || 0), 0)} Guests
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Recipes</span>
                <span className="font-extrabold text-sm text-emerald-400">
                  {consolidatedBatchPrep.length} Distinct Dishes
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mise En Place Done</span>
                <span className="font-extrabold text-sm text-purple-400">
                  {Object.keys(prepChecklist).filter(k => prepChecklist[k]).length} of {consolidatedBatchPrep.length} items
                </span>
              </div>
            </div>

            {/* Scrollable Batch Sheet Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-kds-scrollbar min-h-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-2.5 w-10 text-center">Done</th>
                      <th className="pb-2.5">Category / Course</th>
                      <th className="pb-2.5">Dish Name & Description</th>
                      <th className="pb-2.5 text-center">Events</th>
                      <th className="pb-2.5 text-right">Required Pax</th>
                      <th className="pb-2.5 text-right">Portion Guide</th>
                      <th className="pb-2.5 text-right">BEO Codes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {consolidatedBatchPrep.map((item) => {
                      const isChecked = !!prepChecklist[item.key]
                      return (
                        <tr
                          key={item.key}
                          onClick={() => togglePrepCheckItem(item.key)}
                          className={`cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-950/20 text-emerald-300'
                              : isDarkMode
                              ? 'hover:bg-slate-800/50 text-slate-200'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePrepCheckItem(item.key)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 font-bold text-amber-500 text-[11px] whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3">
                            <span className={`font-black text-xs ${isChecked ? 'line-through opacity-70' : ''}`}>
                              {item.dishName}
                            </span>
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-slate-400">
                            {item.totalEvents}
                          </td>
                          <td className="py-3 text-right font-extrabold font-mono text-sm text-sky-400 whitespace-nowrap">
                            {item.totalPax} Pax
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-400 text-[11px]">
                            {item.portionNotes || `${item.totalPax} Servings`}
                          </td>
                          <td className="py-3 text-right font-mono text-[10px] text-slate-400">
                            {item.eventCodes.slice(0, 2).join(', ')}
                            {item.eventCodes.length > 2 ? ` +${item.eventCodes.length - 2}` : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {consolidatedBatchPrep.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-icons text-4xl opacity-40 mb-2">soup_kitchen</span>
                  <p className="font-bold">No Batch Production Requirements</p>
                  <p className="text-xs opacity-70 mt-1">There are currently no active confirmed BEO events in the queue.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-100 dark:bg-slate-900/60 text-xs">
              <span className="text-slate-400">
                Click any row to toggle Mise en Place checklist status
              </span>
              <button
                type="button"
                onClick={() => setIsBatchPrepModalOpen(false)}
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer transition active:scale-95"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. OFFICIAL BANQUET EVENT ORDER (BEO) MODAL */}
      {isBEOModalOpen && selectedBEOForModal && (
        <BanquetEventOrderModal
          isOpen={isBEOModalOpen}
          onClose={() => {
            setIsBEOModalOpen(false)
            setSelectedBEOForModal(null)
          }}
          booking={selectedBEOForModal}
          isDarkMode={isDarkMode}
          onUpdateBEO={(updatedBeo) => {
            if (selectedBEOForModal?.id) {
              handleUpdateBEOStatus(selectedBEOForModal.id, updatedBeo?.status || selectedBEOForModal.status)
            }
            setIsBEOModalOpen(false)
          }}
        />
      )}

    </div>
  )
}
