import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import BanquetEventOrderModal from '../../components/BanquetEventOrderModal'

// Robust Date Formatter for BEO Orders
const formatBEODate = (dateStr) => {
  if (!dateStr) return 'Date Pending'
  try {
    const clean = String(dateStr).split('T')[0].split(' ')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const d = parseInt(parts[2], 10)
      const dt = new Date(y, m, d)
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    }
    const dt = new Date(dateStr)
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return clean
  } catch {
    return dateStr || 'Date Pending'
  }
}

// High-fidelity Skeleton for Front of House Metric Tiles
function MetricTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="bg-white dark:bg-[#C8102E] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
            <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-16"></div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0"></div>
        </div>
      ))}
    </div>
  )
}

// High-fidelity Skeleton for BEO Cards
function BEOCardSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-[#C8102E] border border-gray-300 dark:border-slate-700 shadow-xs overflow-hidden animate-pulse space-y-3 p-4">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-24 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="w-20 h-5 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
        </div>
        <div className="w-20 h-5 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
      <div className="h-16 bg-gray-100 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700"></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-800">
        <div className="w-20 h-6 bg-gray-300 dark:bg-slate-600 rounded"></div>
        <div className="w-28 h-8 bg-gray-300 dark:bg-slate-600 rounded-lg"></div>
      </div>
    </div>
  )
}

const DEFAULT_EQUIPMENT_CHECKLIST = [
  { id: 'chafing', name: 'Roll-Top Chafing Trays with Water Pans', defaultQty: 6, unit: 'sets' },
  { id: 'sterno', name: 'Sterno Heating Gel Fuel Cans (4hr)', defaultQty: 12, unit: 'cans' },
  { id: 'tongs', name: 'Heavy-Duty Serving Tongs & Ladles', defaultQty: 8, unit: 'pcs' },
  { id: 'dispensers', name: 'Stainless Beverage Dispensers with Drip Trays', defaultQty: 2, unit: 'units' },
  { id: 'dinnerware', name: 'Ceramic Dinner Plates & Silverware Rollups', defaultQty: 60, unit: 'sets' },
  { id: 'linens', name: 'Table Linens & Skirting (Crimson & Champagne)', defaultQty: 8, unit: 'cloths' },
  { id: 'coolers', name: 'Heavy Insulated Ice Chests / Coolers', defaultQty: 2, unit: 'chests' },
  { id: 'trash_tubs', name: 'Heavy-Duty Bus Tubs & Trash Liners', defaultQty: 4, unit: 'tubs' }
]

function BanquetEventOrderPage({ isStaff = false }) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()
  const globalSearchQuery = context.searchQuery || ''

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [localSearch, setLocalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'today' | 'upcoming' | 'prep' | 'confirmed' | 'completed' | 'cancelled'
  const [venueFilter, setVenueFilter] = useState('all')
  const [dateFilterShortcut, setDateFilterShortcut] = useState('all') // 'all' | 'today' | 'tomorrow' | 'weekend' | 'this_week'
  const [sortBy, setSortBy] = useState('date_asc') // 'date_asc' | 'date_desc' | 'pax_desc' | 'amount_desc'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table' | 'timeline'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = viewMode === 'grid' ? 6 : 10

  // Selected BEO for Modal Viewer / Editor
  const [activeBEO, setActiveBEO] = useState(null)
  
  // Kitchen Batch Prep Aggregator Modal
  const [isBatchPrepModalOpen, setIsBatchPrepModalOpen] = useState(false)
  
  // Equipment Loading Checklist Modal
  const [logisticsModalBEO, setLogisticsModalBEO] = useState(null)
  const [equipmentChecklists, setEquipmentChecklists] = useState({})

  // Create New BEO Modal State
  const [isCreateBEOModalOpen, setIsCreateBEOModalOpen] = useState(false)
  const [isSubmittingBEO, setIsSubmittingBEO] = useState(false)
  const [newBEOForm, setNewBEOForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    eventTitle: '',
    eventType: 'Birthday Celebration',
    category: 'catering',
    eventDate: new Date().toISOString().split('T')[0],
    serviceTime: '11:30 AM - 02:30 PM',
    dispatchTime: '09:00 AM',
    setupTime: '10:00 AM',
    breakdownTime: '03:30 PM',
    venueName: "Jo's Diner Function Hall",
    venueAddress: 'General Santos Highway, Polomolok',
    guestCount: 50,
    totalAmount: 35000,
    depositPaid: 15000,
    assignedChef: 'Chef Eduardo (Front of House Head Chef)',
    banquetCaptain: 'Captain Marco Santos (Lead)',
    specialRequests: ''
  })

  const effectiveSearch = localSearch || globalSearchQuery

  // Fetch catering and banquet bookings from API
  const fetchBEOs = async () => {
    try {
      setIsLoading(true)
      const res = await api.reservations.getReservations().catch(() => ({ reservations: [] }))
      const allRes = res?.reservations || []

      // Filter for catering & banquet events, or events with guest count >= 10
      const cateringEvents = allRes.filter(r => {
        const type = (r.reservation_type || r.type || r.category || '').toLowerCase()
        const occasion = (r.occasion || '').toLowerCase()
        const guests = parseInt(r.guest_count || r.guests || 0, 10)
        return type.includes('catering') || type.includes('hall') || type.includes('event') || guests >= 10 || occasion.includes('wedding') || occasion.includes('birthday') || occasion.includes('corporate')
      })

      // Normalize data with default BEO operational fields
      const formatted = cateringEvents.map((item, idx) => {
        const bookingCode = item.booking_code || item.reservation_code || item.id || `EVT-${1000 + idx}`
        const guests = parseInt(item.guest_count || item.guests || 30, 10)
        
        // Clean Date
        const rawDate = item.event_date || item.reservation_date || item.date || ''
        const dateStr = rawDate ? String(rawDate).split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0]
        
        const timeStr = item.event_time || item.reservation_time || '11:30 AM'
        const totalAmt = parseFloat(item.total_amount || item.total_quote || (guests * 550))
        const depPaid = parseFloat(item.deposit_paid || item.amount_paid || item.deposit || (totalAmt * 0.5))

        // Parse dishes or build default menu course list
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

        const category = item.category || (item.reservation_type && item.reservation_type.toLowerCase().includes('hall') ? 'hall' : 'catering')
        const venueName = item.venue_name || item.event_venue || item.hall_name || (category === 'hall' ? "Jo's Diner Function Hall" : "Customer's Private Venue")

        // Clean Occasion & Title
        let eventTitle = item.event_name || item.event_title || item.package_name || item.occasion || 'Banquet Event'
        if (item.occasion && item.package_name && !item.event_name && item.occasion !== item.package_name) {
          eventTitle = `${item.occasion} (${item.package_name})`
        }

        const initialStatus = item.beo_status || item.status || 'Pending'

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
          assigned_chef: item.assigned_chef || 'Chef Eduardo (Front of House Head Chef)',
          banquet_captain: item.banquet_captain || 'Captain Marco Santos (Lead)',
          assigned_crew: item.assigned_crew || `${Math.max(2, Math.round(guests / 15))}x Waiters, 2x Buffet Attendants, 1x Logistics Driver`,
          equipment: item.equipment || '4x Roll-Top Chafing Trays, 2x Drink Dispensers, Full Dinnerware',
          total_amount: totalAmt,
          deposit_paid: depPaid,
          status: initialStatus,
          special_requests: item.special_requests || item.special_request || '',
          table_arrangement: item.table_arrangement || `${Math.ceil(guests / 10)}x 10-Seater Round Tables + 1x Head VIP Table`,
          linen_color: item.linen_color || 'Burgundy Crimson & Champagne Gold',
          selected_dishes: menuCourses
        }
      })

      setBookings(formatted)
    } catch (err) {
      console.error('Error loading BEO data:', err)
      showToast('Could not load Banquet Event Orders', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBEOs()
  }, [])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  // Unique venues list for dropdown filter
  const venueOptions = useMemo(() => {
    const set = new Set()
    bookings.forEach(b => {
      if (b.event_venue) set.add(b.event_venue)
    })
    return ['all', ...Array.from(set)]
  }, [bookings])

  // Overview Metrics
  const metrics = useMemo(() => {
    const totalEvents = bookings.length
    const todayCount = bookings.filter(b => b.event_date === todayStr).length
    const upcomingCount = bookings.filter(b => b.event_date > todayStr).length
    const totalGuests = bookings.reduce((sum, b) => sum + (parseInt(b.guests, 10) || 0), 0)
    const inPrepCount = bookings.filter(b => b.status === 'In Kitchen Prep').length
    const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length
    const completedCount = bookings.filter(b => b.status === 'Completed').length
    const cancelledCount = bookings.filter(b => b.status === 'Cancelled' || b.status === 'Declined').length

    // Logistics aggregations
    const totalChafingTrays = Math.round(totalGuests / 12)
    const totalCrewMobilized = bookings.reduce((sum, b) => sum + Math.max(2, Math.round((b.guests || 30) / 15)), 0)

    return { totalEvents, todayCount, upcomingCount, totalGuests, inPrepCount, confirmedCount, completedCount, cancelledCount, totalChafingTrays, totalCrewMobilized }
  }, [bookings, todayStr])

  // Filter and Search Logic
  const filteredBookings = useMemo(() => {
    let list = [...bookings]

    // Status Tab Filter
    if (statusFilter === 'today') {
      list = list.filter(b => b.event_date === todayStr)
    } else if (statusFilter === 'upcoming') {
      list = list.filter(b => b.event_date > todayStr)
    } else if (statusFilter === 'prep') {
      list = list.filter(b => b.status === 'In Kitchen Prep')
    } else if (statusFilter === 'confirmed') {
      list = list.filter(b => b.status === 'Confirmed')
    } else if (statusFilter === 'completed') {
      list = list.filter(b => b.status === 'Completed')
    } else if (statusFilter === 'cancelled') {
      list = list.filter(b => b.status === 'Cancelled' || b.status === 'Declined')
    }

    // Date Range Shortcut Filter
    if (dateFilterShortcut === 'today') {
      list = list.filter(b => b.event_date === todayStr)
    } else if (dateFilterShortcut === 'tomorrow') {
      list = list.filter(b => b.event_date === tomorrowStr)
    } else if (dateFilterShortcut === 'weekend') {
      list = list.filter(b => {
        const d = new Date(b.event_date)
        const day = d.getDay()
        return day === 0 || day === 6 // Saturday or Sunday
      })
    } else if (dateFilterShortcut === 'this_week') {
      const weekAhead = new Date(today)
      weekAhead.setDate(weekAhead.getDate() + 7)
      const weekAheadStr = weekAhead.toISOString().split('T')[0]
      list = list.filter(b => b.event_date >= todayStr && b.event_date <= weekAheadStr)
    }

    // Venue Filter
    if (venueFilter !== 'all') {
      list = list.filter(b => b.event_venue === venueFilter)
    }

    // Search Query
    if (effectiveSearch.trim() !== '') {
      const q = effectiveSearch.toLowerCase().trim()
      list = list.filter(b =>
        (b.beo_number || '').toLowerCase().includes(q) ||
        (b.booking_code || '').toLowerCase().includes(q) ||
        (b.event_title || '').toLowerCase().includes(q) ||
        (b.customer_name || '').toLowerCase().includes(q) ||
        (b.event_venue || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q) ||
        (b.package_name || '').toLowerCase().includes(q) ||
        (b.assigned_chef || '').toLowerCase().includes(q) ||
        (b.banquet_captain || '').toLowerCase().includes(q)
      )
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.event_date) - new Date(b.event_date)
      if (sortBy === 'date_desc') return new Date(b.event_date) - new Date(a.event_date)
      if (sortBy === 'pax_desc') return (b.guests || 0) - (a.guests || 0)
      if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0)
      return 0
    })

    return list
  }, [bookings, statusFilter, dateFilterShortcut, venueFilter, effectiveSearch, sortBy, todayStr, tomorrowStr])

  // Consolidated Kitchen Batch Production Aggregation
  const consolidatedBatchPrep = useMemo(() => {
    const dishMap = {}

    filteredBookings.forEach(b => {
      if (Array.isArray(b.selected_dishes)) {
        b.selected_dishes.forEach(d => {
          const name = typeof d === 'string' ? d : (d.dish || d.name || 'Signature Item')
          const category = d.category || 'General Buffet Course'
          const key = `${category}:::${name}`
          
          if (!dishMap[key]) {
            dishMap[key] = {
              category,
              dishName: name,
              totalEvents: 0,
              totalPax: 0,
              eventCodes: []
            }
          }
          dishMap[key].totalEvents += 1
          dishMap[key].totalPax += (parseInt(b.guests, 10) || 30)
          dishMap[key].eventCodes.push(b.beo_number)
        })
      }
    })

    return Object.values(dishMap).sort((a, b) => a.category.localeCompare(b.category))
  }, [filteredBookings])

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage))
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredBookings.slice(start, start + itemsPerPage)
  }, [filteredBookings, currentPage, itemsPerPage])

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFilterShortcut, venueFilter, effectiveSearch, sortBy, viewMode])

  // Update Status of BEO
  const handleUpdateStatus = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus }
      }
      return b
    }))
    showToast(`BEO status updated to "${newStatus}"`, 'success')
  }

  // Quick Copy Shift Summary
  const handleCopyBEOSummary = (b) => {
    const formattedDate = formatBEODate(b.event_date)
    const text = `
📋 BANQUET EVENT ORDER #${b.beo_number}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event: ${b.event_title} (${b.event_type})
Client: ${b.customer_name} (📞 ${b.phone})
Date: ${formattedDate} | Service Time: ${b.service_time}
Dispatch: ${b.dispatch_time} | Setup: ${b.setup_time} | Breakdown: ${b.breakdown_time}
Venue: ${b.event_venue} - ${b.venue_address}
Guaranteed Pax: ${b.guests} Guests
Service Style: ${b.service_style}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍🍳 Head Chef: ${b.assigned_chef}
👔 Banquet Captain: ${b.banquet_captain}
🚚 Assigned Crew: ${b.assigned_crew}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ Menu Courses: ${Array.isArray(b.selected_dishes) ? b.selected_dishes.length : 0} items
⚠️ Dietary Notes: ${b.special_requests || 'Standard event preparation'}
💰 Total Quote: ₱${b.total_amount.toLocaleString()} | Status: ${b.status.toUpperCase()}
    `.trim()

    navigator.clipboard.writeText(text)
    showToast(`📋 Copied BEO #${b.beo_number} shift details!`, 'success')
  }

  // Export Filtered BEO Schedule to CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      showToast('No BEO records to export.', 'warning')
      return
    }

    const headers = [
      'BEO Number',
      'Event Title',
      'Event Type',
      'Client Name',
      'Client Phone',
      'Event Date',
      'Service Time',
      'Dispatch Time',
      'Setup Time',
      'Venue Name',
      'Guaranteed Pax',
      'Head Chef',
      'Banquet Captain',
      'Total Amount (PHP)',
      'Deposit Paid (PHP)',
      'Status'
    ]

    const rows = filteredBookings.map(b => [
      `"${b.beo_number}"`,
      `"${(b.event_title || '').replace(/"/g, '""')}"`,
      `"${b.event_type || ''}"`,
      `"${(b.customer_name || '').replace(/"/g, '""')}"`,
      `"${b.phone || ''}"`,
      `"${formatBEODate(b.event_date)}"`,
      `"${b.service_time || ''}"`,
      `"${b.dispatch_time || ''}"`,
      `"${b.setup_time || ''}"`,
      `"${(b.event_venue || '').replace(/"/g, '""')}"`,
      b.guests,
      `"${(b.assigned_chef || '').replace(/"/g, '""')}"`,
      `"${(b.banquet_captain || '').replace(/"/g, '""')}"`,
      b.total_amount,
      b.deposit_paid,
      `"${b.status || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `JosDiners_BEO_Manifest_${todayStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`📊 Exported ${filteredBookings.length} BEO orders to CSV!`, 'success')
  }

  // Equipment Checklist Toggling
  const handleToggleEquipment = (beoId, itemId) => {
    setEquipmentChecklists(prev => {
      const current = prev[beoId] || {}
      return {
        ...prev,
        [beoId]: {
          ...current,
          [itemId]: !current[itemId]
        }
      }
    })
  }

  // Handle Manual BEO Creation
  const handleCreateNewBEO = (e) => {
    e.preventDefault()
    if (!newBEOForm.clientName || !newBEOForm.eventTitle) {
      showToast('Please provide client name and event title.', 'warning')
      return
    }

    setIsSubmittingBEO(true)
    const code = `EVT-${Math.floor(1000 + Math.random() * 9000)}`
    const created = {
      id: Date.now(),
      beo_number: `BEO-2026-${code}`,
      booking_code: code,
      event_title: newBEOForm.eventTitle,
      event_type: newBEOForm.eventType,
      category: newBEOForm.category,
      customer_name: newBEOForm.clientName,
      phone: newBEOForm.clientPhone || '0917-123-4567',
      email: newBEOForm.clientEmail || 'client@example.com',
      event_date: newBEOForm.eventDate,
      dispatch_time: newBEOForm.dispatchTime,
      setup_time: newBEOForm.setupTime,
      service_time: newBEOForm.serviceTime,
      breakdown_time: newBEOForm.breakdownTime,
      event_venue: newBEOForm.venueName,
      venue_address: newBEOForm.venueAddress,
      venue_type: newBEOForm.category === 'hall' ? 'diner_function_hall' : 'customer_venue',
      guests: parseInt(newBEOForm.guestCount, 10) || 50,
      guaranteed_pax: parseInt(newBEOForm.guestCount, 10) || 50,
      package_name: 'Custom Chef Banquet Feasts',
      service_style: 'Buffet with Chafing Trays & Dedicated Waiters',
      assigned_chef: newBEOForm.assignedChef,
      banquet_captain: newBEOForm.banquetCaptain,
      assigned_crew: `${Math.max(2, Math.round((newBEOForm.guestCount || 50) / 15))}x Waiters, 2x Buffet Attendants, 1x Driver`,
      equipment: '4x Roll-Top Chafing Trays, 2x Drink Dispensers, Full Dinnerware',
      total_amount: parseFloat(newBEOForm.totalAmount) || 35000,
      deposit_paid: parseFloat(newBEOForm.depositPaid) || 15000,
      status: 'Confirmed',
      special_requests: newBEOForm.specialRequests,
      selected_dishes: [
        { category: 'Appetizer', dish: 'Crispy Lumpiang Shanghai with Sweet Chili Dip', qty: `${newBEOForm.guestCount * 2} pcs` },
        { category: 'Main Dish 1', dish: 'Slow-Roasted Beef Caldereta with Mushrooms', qty: `${newBEOForm.guestCount} Servings` },
        { category: 'Main Dish 2', dish: 'Crispy Garlic Fried Chicken Fillet with Gravy', qty: `${newBEOForm.guestCount} Servings` },
        { category: 'Pasta / Noodles', dish: 'Creamy Seafood Carbonara Medley', qty: `${Math.ceil(newBEOForm.guestCount / 15)} Large Bilao` },
        { category: 'Dessert', dish: 'Creamy Buko Pandan Salad Trays', qty: `${newBEOForm.guestCount} Cups` },
        { category: 'Beverage', dish: 'Bottomless Signature Red Iced Tea', qty: `${Math.ceil(newBEOForm.guestCount * 0.5)}L Dispenser` }
      ]
    }

    setTimeout(() => {
      setBookings(prev => [created, ...prev])
      setIsSubmittingBEO(false)
      setIsCreateBEOModalOpen(false)
      showToast(`🎉 BEO #${created.beo_number} created successfully!`, 'success')
      setNewBEOForm({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        eventTitle: '',
        eventType: 'Birthday Celebration',
        category: 'catering',
        eventDate: todayStr,
        serviceTime: '11:30 AM - 02:30 PM',
        dispatchTime: '09:00 AM',
        setupTime: '10:00 AM',
        breakdownTime: '03:30 PM',
        venueName: "Jo's Diner Function Hall",
        venueAddress: 'General Santos Highway, Polomolok',
        guestCount: 50,
        totalAmount: 35000,
        depositPaid: 15000,
        assignedChef: 'Chef Eduardo (Front of House Head Chef)',
        banquetCaptain: 'Captain Marco Santos (Lead)',
        specialRequests: ''
      })
    }, 400)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#C8102E] tracking-tight">Banquet Event Orders (BEO)</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Production schedules, kitchen dispatch sheets, equipment loading checklists, and client venue specifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kitchen Batch Prep Aggregator */}
          <button
            type="button"
            onClick={() => setIsBatchPrepModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            title="Consolidated Kitchen Batch Prep Aggregator"
          >
            <span className="material-icons text-base">restaurant</span>
            <span>Kitchen Prep Sheet</span>
          </button>

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            title="Export Manifest to CSV / Excel"
          >
            <span className="material-icons text-base text-emerald-600">file_download</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            title="Print Schedule Sheet"
          >
            <span className="material-icons text-base text-[#C8102E]">print</span>
            <span>Print</span>
          </button>

          {/* Add New BEO */}
          <button
            type="button"
            onClick={() => setIsCreateBEOModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base">add_circle</span>
            <span>Add New BEO</span>
          </button>
        </div>
      </header>

      {/* Front of House METRIC TILES */}
      {isLoading ? (
        <MetricTilesSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total BEOs */}
          <div className="bg-white dark:bg-[#C8102E] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">
                Total BEO Orders
              </span>
              <span className="text-2xl font-black font-mono text-[#C8102E] dark:text-white mt-0.5 block">
                {metrics.totalEvents}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">All Scheduled Catering</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">fact_check</span>
            </div>
          </div>

          {/* Card 2: Today's Events */}
          <div className="bg-white dark:bg-[#C8102E] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                  Today's Live Events
                </span>
                {metrics.todayCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-ping"></span>
                )}
              </div>
              <span className="text-2xl font-black font-mono text-[#C8102E] mt-0.5 block">
                {metrics.todayCount}
              </span>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">In Active Operations</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 text-[#C8102E] flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">event_available</span>
            </div>
          </div>

          {/* Card 3: Upcoming Events */}
          <div className="bg-white dark:bg-[#C8102E] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                Upcoming Schedule
              </span>
              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                {metrics.upcomingCount}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{metrics.inPrepCount} in Kitchen Prep</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">schedule</span>
            </div>
          </div>

          {/* Card 4: Total Guests */}
          <div className="bg-white dark:bg-[#C8102E] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Guaranteed Pax
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {metrics.totalGuests.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Total Catering Guests</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">groups</span>
            </div>
          </div>

        </div>
      )}

      {/* DAILY LOGISTICS PRODUCTION HIGHLIGHT STRIP */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-red-50/80 via-slate-50 to-blue-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-800/90 border border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="material-icons text-base text-[#C8102E]">kitchen</span>
          <span className="font-extrabold text-[#C8102E] dark:text-white uppercase tracking-wider text-[11px]">
            Kitchen Production &amp; Gear Demand:
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap font-bold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Chafing Dish Trays: <strong className="font-mono text-[#C8102E] dark:text-white">{metrics.totalChafingTrays} sets</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Mobilized Banquet Staff: <strong className="font-mono text-[#C8102E] dark:text-white">{metrics.totalCrewMobilized} crew</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Beverage Dispensers: <strong className="font-mono text-[#C8102E] dark:text-white">{metrics.totalEvents * 2} units</strong></span>
          </span>
        </div>
      </div>

      {/* FILTER, SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white dark:bg-[#C8102E] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs p-3.5 sm:p-4 space-y-3">
        
        {/* Row 1: Status Filter Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: 'All BEOs', count: metrics.totalEvents },
              { id: 'today', label: "Today's Events", count: metrics.todayCount },
              { id: 'upcoming', label: 'Upcoming', count: metrics.upcomingCount },
              { id: 'prep', label: 'In Kitchen Prep', count: metrics.inPrepCount },
              { id: 'confirmed', label: 'Confirmed', count: metrics.confirmedCount },
              { id: 'completed', label: 'Completed', count: metrics.completedCount },
              { id: 'cancelled', label: 'Cancelled', count: metrics.cancelledCount }
            ].map(tab => {
              const isActive = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-2xs font-black'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-black/25 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: Date Shortcuts + Search + Filters + View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          
          {/* Left: Search Bar & Date Shortcut Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search BEO #, Client, Venue, Chef, Captain..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-[#C8102E] dark:text-white placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Date Range Pills */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'this_week', label: 'Next 7 Days' },
                { id: 'weekend', label: 'Weekends' }
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDateFilterShortcut(d.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    dateFilterShortcut === d.id
                      ? 'bg-[#C8102E] text-white dark:bg-red-600'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls: Venue, Sort & View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Venue Filter Dropdown */}
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="all">All Venues</option>
              {venueOptions.filter(v => v !== 'all').map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="date_asc">📅 Date: Earliest</option>
              <option value="date_desc">📅 Date: Latest</option>
              <option value="pax_desc">👥 Pax: High to Low</option>
              <option value="amount_desc">💰 Quote: High to Low</option>
            </select>

            {/* View Mode Toggle (3 Modes: Cards, Table, Timeline) */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-[#C8102E] shadow-2xs font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Grid Cards View"
              >
                <span className="material-icons text-sm">grid_view</span>
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-[#C8102E] shadow-2xs font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Table View"
              >
                <span className="material-icons text-sm">view_list</span>
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-[#C8102E] shadow-2xs font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Shift Timeline View"
              >
                <span className="material-icons text-sm">view_timeline</span>
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* BEO ORDERS CONTAINER */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <BEOCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-[#C8102E] rounded-lg border border-dashed border-gray-300 dark:border-slate-700 shadow-xs">
          <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 block">fact_check</span>
          <h3 className="text-base font-black text-[#C8102E] dark:text-white">No Banquet Event Orders Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {effectiveSearch
              ? `No BEO orders matched "${effectiveSearch}". Try adjusting or clearing search filters.`
              : 'There are currently no catering orders matching the selected filter criteria.'}
          </p>
          {(effectiveSearch || statusFilter !== 'all' || venueFilter !== 'all' || dateFilterShortcut !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('')
                setStatusFilter('all')
                setVenueFilter('all')
                setDateFilterShortcut('all')
              }}
              className="mt-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white font-bold text-xs shadow-xs hover:bg-[#9B0B21] transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (

        /* ========================================================================= */
        /* ========================== TWO-TIER MASTER CARDS ======================== */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBookings.map((b) => {
            const isToday = b.event_date === todayStr
            const courseCount = Array.isArray(b.selected_dishes) ? b.selected_dishes.length : 0
            const checks = equipmentChecklists[b.id] || {}
            const loadedCount = Object.values(checks).filter(Boolean).length
            const formattedDate = formatBEODate(b.event_date)

            // Status Styling
            const isCompleted = b.status === 'Completed'
            const isPrep = b.status === 'In Kitchen Prep'
            const isConfirmed = b.status === 'Confirmed'
            const isCancelled = b.status === 'Cancelled' || b.status === 'Declined'

            return (
              <div
                key={b.id}
                className={`rounded-lg border bg-white dark:bg-[#C8102E] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isToday
                    ? 'border-t-4 border-t-[#C8102E] border-gray-300 dark:border-slate-700 ring-2 ring-red-500/20'
                    : isCompleted
                    ? 'border-t-4 border-t-emerald-600 border-gray-300 dark:border-slate-700'
                    : isPrep
                    ? 'border-t-4 border-t-amber-500 border-gray-300 dark:border-slate-700'
                    : isConfirmed
                    ? 'border-t-4 border-t-blue-600 border-gray-300 dark:border-slate-700'
                    : 'border-t-4 border-t-slate-400 border-gray-300 dark:border-slate-700'
                }`}
              >
                {/* 1. HEADER ROW */}
                <div className="p-3.5 pb-2.5 border-b border-gray-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-[#C8102E] bg-red-50 dark:bg-red-950/80 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/50">
                        #{b.beo_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase border ${
                        b.category === 'hall'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200'
                          : 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200'
                      }`}>
                        {b.category === 'hall' ? '🏛️ Hall' : '🍱 Catering'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#C8102E] text-white animate-pulse">
                          ● Today
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : isPrep
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          : isConfirmed
                          ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          : isCancelled
                          ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-800 dark:text-gray-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted ? 'bg-emerald-600' : isPrep ? 'bg-amber-500' : isConfirmed ? 'bg-blue-600' : 'bg-gray-400'
                        }`}></span>
                        <span>{b.status}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-[#C8102E] dark:text-white leading-snug line-clamp-1">
                      {b.event_title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="truncate">Client: <strong className="text-gray-800 dark:text-gray-200 font-bold">{b.customer_name}</strong></span>
                      <span className="font-mono text-gray-600 dark:text-gray-300 shrink-0">📞 {b.phone}</span>
                    </div>
                  </div>
                </div>

                {/* 2. DATE, TIME & VENUE HIGHLIGHT BANNER */}
                <div className="p-3.5 space-y-2.5 flex-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 font-extrabold">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="material-icons text-sm text-[#C8102E]">event</span>
                        <span>{formattedDate}</span>
                      </span>
                      <span className="font-mono text-xs text-[#C8102E] dark:text-white">
                        {b.service_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <span className="material-icons text-xs text-[#C8102E] shrink-0">place</span>
                      <span className="truncate font-semibold">{b.event_venue}</span>
                    </div>

                    {/* Operational Shift Stages Bar */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-200 dark:border-slate-800 text-[10px] text-center font-bold">
                      <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-400 block text-[8.5px] uppercase">Dispatch</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{b.dispatch_time}</span>
                      </div>
                      <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-400 block text-[8.5px] uppercase">Setup</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{b.setup_time}</span>
                      </div>
                      <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-400 block text-[8.5px] uppercase">Breakdown</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{b.breakdown_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. OPERATIONAL METRICS 2x2 GRID */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Guaranteed Pax</span>
                      <strong className="font-mono text-[#C8102E] text-xs block mt-0.5">{b.guests} Guests</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Menu Courses</span>
                      <strong className="text-gray-800 dark:text-gray-200 text-xs block mt-0.5">{courseCount} Buffet Items</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Head Chef</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px] block mt-0.5 truncate">{b.assigned_chef.split('(')[0]}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Banquet Lead</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px] block mt-0.5 truncate">{b.banquet_captain.split('(')[0]}</span>
                    </div>
                  </div>

                  {/* 4. LOADING CHECKLIST PILL */}
                  <div className="pt-0.5 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setLogisticsModalBEO(b)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span className="material-icons text-sm">checklist</span>
                      <span>Loading Checklist ({loadedCount}/{DEFAULT_EQUIPMENT_CHECKLIST.length})</span>
                    </button>
                    {loadedCount === DEFAULT_EQUIPMENT_CHECKLIST.length ? (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ All Loaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500">
                        {Math.round((loadedCount / DEFAULT_EQUIPMENT_CHECKLIST.length) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Dietary Note Alert if any */}
                  {b.special_requests && (
                    <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                      <span className="material-icons text-xs text-amber-600 mt-0.5 shrink-0">info</span>
                      <span className="line-clamp-2">{b.special_requests}</span>
                    </div>
                  )}
                </div>

                {/* 5. TIER 3: CARD ACTIONS FOOTER */}
                <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs">
                    <span className="text-[9.5px] text-gray-400 uppercase font-black block leading-none">Total Quote</span>
                    <strong className="text-[#C8102E] font-black text-sm block mt-0.5">₱{b.total_amount.toLocaleString()}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Dropdown */}
                    <select
                      value={b.status}
                      onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                      className="text-xs font-bold rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-1 focus:ring-[#C8102E]"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In Kitchen Prep">In Prep</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* Copy Details */}
                    <button
                      type="button"
                      onClick={() => handleCopyBEOSummary(b)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-[#C8102E] transition cursor-pointer shadow-2xs"
                      title="Copy Shift Summary to Clipboard"
                    >
                      <span className="material-icons text-sm block">content_copy</span>
                    </button>

                    {/* View & Print Modal */}
                    <button
                      type="button"
                      onClick={() => setActiveBEO(b)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      <span className="material-icons text-xs">visibility</span>
                      <span>View BEO</span>
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      ) : viewMode === 'table' ? (

        /* ========================================================================= */
        /* ========================== HIGH-DENSITY TABLE VIEW ====================== */
        /* ========================================================================= */
        <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#C8102E] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-900/80 text-gray-400 uppercase tracking-wider font-black text-[10px] border-b border-gray-300 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">BEO #</th>
                  <th className="p-3.5">Event &amp; Client</th>
                  <th className="p-3.5">Date &amp; Service Time</th>
                  <th className="p-3.5">Venue Location</th>
                  <th className="p-3.5 text-center">Pax</th>
                  <th className="p-3.5">Staff In Charge</th>
                  <th className="p-3.5">Total Quote</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 font-medium">
                {paginatedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition">
                    <td className="p-3.5 font-mono font-black text-[#C8102E]">
                      #{b.beo_number}
                    </td>
                    <td className="p-3.5">
                      <strong className="block text-[#C8102E] dark:text-white font-bold">{b.event_title}</strong>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{b.customer_name} &bull; {b.phone}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">
                        {formatBEODate(b.event_date)}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{b.service_time}</span>
                    </td>
                    <td className="p-3.5 text-gray-700 dark:text-gray-300 font-medium max-w-[180px] truncate">
                      {b.event_venue}
                    </td>
                    <td className="p-3.5 text-center font-mono font-black text-[#C8102E] dark:text-white">
                      {b.guests}
                    </td>
                    <td className="p-3.5 text-[11px] text-gray-600 dark:text-gray-300">
                      <div>👨‍🍳 {b.assigned_chef.split('(')[0]}</div>
                      <div>👔 {b.banquet_captain.split('(')[0]}</div>
                    </td>
                    <td className="p-3.5 font-mono font-black text-[#C8102E]">
                      ₱{b.total_amount.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className="text-xs font-bold rounded-lg px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-1 focus:ring-[#C8102E]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Kitchen Prep">In Prep</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLogisticsModalBEO(b)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Equipment Checklist"
                        >
                          <span className="material-icons text-base">checklist</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyBEOSummary(b)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 cursor-pointer"
                          title="Copy Summary"
                        >
                          <span className="material-icons text-base">content_copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveBEO(b)}
                          className="px-2.5 py-1 rounded-lg bg-[#C8102E] text-white text-xs font-bold shadow-2xs hover:bg-[#9B0B21] transition cursor-pointer"
                        >
                          BEO Sheet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* ========================================================================= */
        /* ==================== KITCHEN PRODUCTION & DISPATCH TIMELINE ============= */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#C8102E] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base text-[#C8102E] dark:text-white uppercase font-['Russo_One']">
                  Kitchen Production &amp; Service Dispatch Run-Sheet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chronological shift breakdown of food staging, packing, transport, and live buffet serving.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-100 text-[#C8102E] dark:bg-red-950 dark:text-red-300 border border-red-200">
                {filteredBookings.length} Active Production Shifts
              </span>
            </div>

            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-[#C8102E] bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                        #{b.beo_number}
                      </span>
                      <h4 className="font-black text-sm text-[#C8102E] dark:text-white">{b.event_title}</h4>
                      <span className="text-xs text-gray-500">({b.guests} Pax)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        📍 {b.event_venue}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveBEO(b)}
                        className="px-2.5 py-1 rounded-lg bg-[#C8102E] text-white text-[11px] font-bold uppercase cursor-pointer"
                      >
                        BEO Specs
                      </button>
                    </div>
                  </div>

                  {/* Operational Timeline Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 space-y-0.5">
                      <div className="flex items-center gap-1 text-blue-600 font-extrabold uppercase text-[10px]">
                        <span className="material-icons text-xs">local_shipping</span>
                        <span>Stage 1: Dispatch</span>
                      </div>
                      <div className="font-mono font-black text-sm text-gray-900 dark:text-white">{b.dispatch_time}</div>
                      <div className="text-[10px] text-gray-400">Loading chafing warmers &amp; logistics</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 space-y-0.5">
                      <div className="flex items-center gap-1 text-amber-600 font-extrabold uppercase text-[10px]">
                        <span className="material-icons text-xs">build</span>
                        <span>Stage 2: Venue Setup</span>
                      </div>
                      <div className="font-mono font-black text-sm text-gray-900 dark:text-white">{b.setup_time}</div>
                      <div className="text-[10px] text-gray-400">Tables, linens &amp; buffet layout</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 space-y-0.5">
                      <div className="flex items-center gap-1 text-emerald-600 font-extrabold uppercase text-[10px]">
                        <span className="material-icons text-xs">restaurant</span>
                        <span>Stage 3: Buffet Service</span>
                      </div>
                      <div className="font-mono font-black text-sm text-[#C8102E]">{b.service_time}</div>
                      <div className="text-[10px] text-gray-400">{b.guests} Pax service with crew</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-extrabold uppercase text-[10px]">
                        <span className="material-icons text-xs">inventory_2</span>
                        <span>Stage 4: Teardown</span>
                      </div>
                      <div className="font-mono font-black text-sm text-gray-900 dark:text-white">{b.breakdown_time}</div>
                      <div className="text-[10px] text-gray-400">Pack gear, washware &amp; turnover</div>
                    </div>
                  </div>

                  {/* Kitchen Course Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-gray-400 font-bold uppercase text-[9.5px]">Production Menu ({b.selected_dishes?.length || 0} Courses):</span>
                    {(b.selected_dishes || []).map((dish, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-semibold"
                      >
                        {dish.dish || dish.name || dish} ({dish.qty || 'Std'})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {filteredBookings.length > itemsPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="BEO orders"
        />
      )}

      {/* BANQUET EVENT ORDER MODAL VIEWER / PRINT SHEET */}
      {activeBEO && (
        <BanquetEventOrderModal
          isOpen={Boolean(activeBEO)}
          onClose={() => setActiveBEO(null)}
          booking={activeBEO}
          isDarkMode={false}
          onUpdateBEO={(updatedData) => {
            setBookings(prev => prev.map(item => item.id === activeBEO.id ? { ...item, ...updatedData } : item))
            setActiveBEO(null)
            showToast('Banquet Event Order updated!', 'success')
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ================= CONSOLIDATED KITCHEN BATCH PREP MODAL ================= */}
      {/* ========================================================================= */}
      {isBatchPrepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white dark:bg-[#C8102E] rounded-lg border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                  <span className="material-icons text-xl">soup_kitchen</span>
                </span>
                <div>
                  <h3 className="font-black text-base text-[#C8102E] dark:text-white uppercase font-['Russo_One']">
                    Consolidated Kitchen Batch Production Prep Sheet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cumulative portion requirements aggregated across {filteredBookings.length} scheduled banquet orders.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-[#C8102E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-icons text-sm">print</span>
                  <span>Print Batch Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPrepModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Dish Aggregations Table */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200">
                <span>
                  Showing cumulative prep targets for: <strong>{dateFilterShortcut === 'all' ? 'All Active Orders' : dateFilterShortcut.toUpperCase()}</strong> ({filteredBookings.length} catering events)
                </span>
                <span className="font-mono font-black text-sm">
                  Total Pax: {filteredBookings.reduce((sum, b) => sum + (parseInt(b.guests, 10) || 0), 0)} Guests
                </span>
              </div>

              {consolidatedBatchPrep.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No dish production requirements found for current filter.
                </div>
              ) : (
                <div className="rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-900/80 text-gray-500 uppercase tracking-wider font-black text-[10px] border-b border-gray-300 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Course / Category</th>
                        <th className="p-3">Recipe / Menu Dish</th>
                        <th className="p-3 text-center">Orders Count</th>
                        <th className="p-3 text-center">Combined Guests</th>
                        <th className="p-3">Associated BEOs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {consolidatedBatchPrep.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-gray-500 dark:text-gray-400">
                            {item.category}
                          </td>
                          <td className="p-3 font-black text-gray-900 dark:text-white">
                            {item.dishName}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-blue-600">
                            {item.totalEvents} events
                          </td>
                          <td className="p-3 text-center font-mono font-black text-[#C8102E] text-sm">
                            {item.totalPax} Pax
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {item.eventCodes.map((code, cIdx) => (
                                <span key={cIdx} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[10px] font-mono">
                                  #{code}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end bg-gray-50/80 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setIsBatchPrepModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#C8102E] text-white text-xs font-bold uppercase cursor-pointer"
              >
                Close Sheet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================== EQUIPMENT & LOGISTICS CHECKLIST MODAL ================ */}
      {/* ========================================================================= */}
      {logisticsModalBEO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-[#C8102E] rounded-lg border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                  <span className="material-icons text-xl">inventory</span>
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#C8102E] dark:text-white uppercase font-['Russo_One']">
                    Equipment &amp; Van Loading Checklist
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    BEO #{logisticsModalBEO.beo_number} &bull; {logisticsModalBEO.event_title} ({logisticsModalBEO.guests} Pax)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLogisticsModalBEO(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body: Interactive Checkbox List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center justify-between">
                <span className="text-blue-900 dark:text-blue-200 font-bold">
                  Assigned Captain: <strong>{logisticsModalBEO.banquet_captain}</strong>
                </span>
                <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-300">
                  Dispatch: {logisticsModalBEO.dispatch_time}
                </span>
              </div>

              <div className="space-y-2">
                {DEFAULT_EQUIPMENT_CHECKLIST.map((item) => {
                  const isChecked = !!(equipmentChecklists[logisticsModalBEO.id]?.[item.id])
                  const scaleMultiplier = Math.max(1, Math.round(logisticsModalBEO.guests / 50))
                  const totalNeeded = item.defaultQty * scaleMultiplier

                  return (
                    <label
                      key={item.id}
                      onClick={() => handleToggleEquipment(logisticsModalBEO.id, item.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                          : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={`font-bold ${isChecked ? 'line-through opacity-80' : ''}`}>
                          {item.name}
                        </span>
                      </div>

                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        {totalNeeded} {item.unit}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <span className="text-xs text-gray-500 font-bold">
                {Object.values(equipmentChecklists[logisticsModalBEO.id] || {}).filter(Boolean).length} / {DEFAULT_EQUIPMENT_CHECKLIST.length} Items Verified
              </span>
              <button
                type="button"
                onClick={() => {
                  showToast(`✅ Logistics checklist saved for BEO #${logisticsModalBEO.beo_number}!`, 'success')
                  setLogisticsModalBEO(null)
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                Sign Off &amp; Save Checklist
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ======================= CREATE NEW BEO MODAL ============================ */}
      {/* ========================================================================= */}
      {isCreateBEOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#C8102E] rounded-lg border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black">
                  <span className="material-icons text-xl">add_task</span>
                </span>
                <div>
                  <h3 className="font-black text-base text-[#C8102E] dark:text-white uppercase font-['Russo_One']">
                    Generate New Banquet Event Order (BEO)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Register a new catering or hall banquet booking into kitchen production.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateBEOModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateNewBEO} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Event Title / Occasion Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Santos Golden Wedding Anniversary"
                    value={newBEOForm.eventTitle}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, eventTitle: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={newBEOForm.clientName}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, clientName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Client Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0917-123-4567"
                    value={newBEOForm.clientPhone}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBEOForm.eventDate}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, eventDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Guaranteed Pax *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newBEOForm.guestCount}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, guestCount: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Venue Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jo's Diner Function Hall or Private Villa"
                    value={newBEOForm.venueName}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, venueName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Service Time Window
                  </label>
                  <input
                    type="text"
                    placeholder="11:30 AM - 02:30 PM"
                    value={newBEOForm.serviceTime}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, serviceTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-500 font-bold text-[10.5px]">Kitchen Dispatch</label>
                  <input
                    type="text"
                    value={newBEOForm.dispatchTime}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, dispatchTime: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold text-[10.5px]">Venue Setup</label>
                  <input
                    type="text"
                    value={newBEOForm.setupTime}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, setupTime: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold text-[10.5px]">Teardown / Pack</label>
                  <input
                    type="text"
                    value={newBEOForm.breakdownTime}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, breakdownTime: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Assigned Head Chef
                  </label>
                  <select
                    value={newBEOForm.assignedChef}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, assignedChef: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  >
                    <option value="Chef Eduardo (Front of House Head Chef)">Chef Eduardo (Front of House Head Chef)</option>
                    <option value="Chef Antonio (Lead Carvery)">Chef Antonio (Lead Carvery)</option>
                    <option value="Chef Ramona (Pastry & Buffet)">Chef Ramona (Pastry & Buffet)</option>
                    <option value="Chef Miguel (Grill & Sauté)">Chef Miguel (Grill & Sauté)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Banquet Captain / Coordinator
                  </label>
                  <select
                    value={newBEOForm.banquetCaptain}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, banquetCaptain: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  >
                    <option value="Captain Marco Santos (Lead)">Captain Marco Santos (Lead)</option>
                    <option value="Captain Jessica Lim (Floor Lead)">Captain Jessica Lim (Floor Lead)</option>
                    <option value="Captain Rafael Cruz (Logistics)">Captain Rafael Cruz (Logistics)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Total Estimated Quote (₱)
                  </label>
                  <input
                    type="number"
                    value={newBEOForm.totalAmount}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, totalAmount: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Deposit Paid (₱)
                  </label>
                  <input
                    type="number"
                    value={newBEOForm.depositPaid}
                    onChange={(e) => setNewBEOForm({ ...newBEOForm, depositPaid: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Special Kitchen Instructions / Dietary Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 5 vegetarian portions, no peanuts, ensure hot chafing warmers on arrival..."
                  value={newBEOForm.specialRequests}
                  onChange={(e) => setNewBEOForm({ ...newBEOForm, specialRequests: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateBEOModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBEO}
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  {isSubmittingBEO ? 'Generating...' : 'Create & Register BEO'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default BanquetEventOrderPage

