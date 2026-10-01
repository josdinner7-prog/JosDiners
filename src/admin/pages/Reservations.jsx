import { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import ConfirmationModal from '../components/ConfirmationModal'
import QRScannerModal from '../../components/QRScannerModal'
import ReservationQRPass from '../../components/ReservationQRPass'
import BanquetEventOrderModal from '../../components/BanquetEventOrderModal'
import EventBasedMenuRecommendation from '../../components/EventBasedMenuRecommendation'

// High-fidelity Skeleton for Executive Metric Tiles
function MetricTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 shadow-xs flex items-center justify-between"
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

// High-fidelity Skeleton for Two-Tier Linear Booking Master Cards
function ReservationCardSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-gray-400 shadow-xs overflow-hidden border-l-[5px] border-l-gray-300 dark:border-l-slate-700 animate-pulse">
      {/* Tier 1: Header Strip Skeleton */}
      <div className="px-4 py-2 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-20 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="w-28 h-5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
          <div className="w-32 h-4 bg-gray-300 dark:bg-slate-600 rounded"></div>
        </div>
        <div className="w-28 h-6 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
      </div>

      {/* Tier 2: Body Skeleton */}
      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Customer Column */}
        <div className="flex items-center gap-3 w-full lg:w-56 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-slate-700 shrink-0"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>

        {/* Details & Schedule Column */}
        <div className="flex-1 min-w-0 lg:border-l lg:border-gray-200 lg:dark:border-slate-800 lg:pl-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="w-48 h-4 bg-amber-50/80 dark:bg-amber-950/30 rounded border border-amber-200/50 dark:border-amber-900/30"></div>
        </div>

        {/* Pax & Actions Column */}
        <div className="w-full lg:w-auto shrink-0 lg:border-l lg:border-gray-200 lg:dark:border-slate-800 lg:pl-4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200 dark:border-slate-800">
          <div className="flex items-center lg:items-end gap-2 lg:flex-col">
            <div className="w-14 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="w-20 h-5 bg-gray-300 dark:bg-slate-600 rounded"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
            <div className="w-20 h-7 bg-gray-300 dark:bg-slate-600 rounded-md"></div>
            <div className="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
            <div className="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// High-fidelity Skeleton for High-Density Table View
function ReservationTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-400 animate-pulse">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-300 dark:border-slate-700">
          <tr>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-16"></div></th>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-24"></div></th>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-28"></div></th>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-20"></div></th>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-20"></div></th>
            <th className="px-3.5 py-3"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-16"></div></th>
            <th className="px-3.5 py-3 text-right"><div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-14 ml-auto"></div></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {[1, 2, 3, 4, 5].map((n) => (
            <tr key={n}>
              <td className="px-3.5 py-3"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20"></div></td>
              <td className="px-3.5 py-3 space-y-1"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-28"></div><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20"></div></td>
              <td className="px-3.5 py-3 space-y-1"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-32"></div><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24"></div></td>
              <td className="px-3.5 py-3 space-y-1"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24"></div><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16"></div></td>
              <td className="px-3.5 py-3 space-y-1"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-16"></div><div className="h-4 bg-red-100 dark:bg-red-950 rounded w-20"></div></td>
              <td className="px-3.5 py-3"><div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20"></div></td>
              <td className="px-3.5 py-3 text-right"><div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20 ml-auto"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// High-fidelity Skeleton for Availability Calendar View & Inspector Pane
function CalendarViewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse">
      {/* Calendar Grid Container Skeleton */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="w-40 h-6 bg-gray-300 dark:bg-slate-600 rounded"></div>
            <div className="flex gap-2">
              <div className="w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
              <div className="w-16 h-7 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
            </div>
          </div>

          {/* Day Names Strip */}
          <div className="grid grid-cols-7 border-b border-gray-300 dark:border-slate-700 bg-gray-100/80 dark:bg-slate-800/80 py-2.5">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d} className="text-center text-[10px] font-black text-gray-400">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-slate-800">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-16 sm:h-20 p-2 flex flex-col justify-between bg-white dark:bg-slate-900">
                <div className="w-4 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
                {i % 4 === 0 && <div className="w-12 h-3 bg-blue-100 dark:bg-blue-950 rounded"></div>}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-3.5 border-t border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 flex justify-center gap-4">
            <div className="w-24 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="w-28 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Right Inspector Panel Skeleton */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 shadow-xs p-5 space-y-4">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-3 space-y-2">
            <div className="h-3 bg-red-100 dark:bg-red-950 rounded w-24"></div>
            <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded"></div>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-36"></div>
            <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Reservations(props) {
  const context = useOutletContext() || {}
  const location = useLocation()
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [cateringBookings, setCateringBookings] = useState([])
  const [tableReservations, setTableReservations] = useState([])
  const [reservationViewMode, setReservationViewMode] = useState('calendar') // 'calendar' | 'list'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all') // 'all' | 'hall' | 'catering' | 'table'

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'
  const [listDisplayMode, setListDisplayMode] = useState('cards') // 'cards' | 'table'
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null)
  const [selectedBEOBooking, setSelectedBEOBooking] = useState(null)
  const [bookingToDelete, setBookingToDelete] = useState(null)
  const [isDeletingBooking, setIsDeletingBooking] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [qrPassForAdmin, setQrPassForAdmin] = useState(null)

  // Handle incoming redirect navigation state from Notifications or other tabs
  useEffect(() => {
    if (location.state?.highlightCode || location.state?.search) {
      const q = location.state.highlightCode || location.state.search
      setLocalSearchQuery(q)
      setReservationViewMode('list')
      if (location.state?.statusFilter) {
        setStatusFilter(location.state.statusFilter)
      }
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Table Assignment Modal State
  const [tableAssignModalBooking, setTableAssignModalBooking] = useState(null)
  const [assigningTableNumber, setAssigningTableNumber] = useState('')
  const [customTableInput, setCustomTableInput] = useState('')
  const [isAssigningTable, setIsAssigningTable] = useState(false)
  const [isJustConfirmedModal, setIsJustConfirmedModal] = useState(false)
  const [reassignConfirmBookingId, setReassignConfirmBookingId] = useState(null)

  const standardTablesList = [
    { id: 'Table 1', label: 'Table 1', capacity: '2 - 4 Pax', type: 'Main Dining' },
    { id: 'Table 2', label: 'Table 2', capacity: '2 - 4 Pax', type: 'Main Dining' },
    { id: 'Table 3', label: 'Table 3', capacity: '2 - 4 Pax', type: 'Main Dining' },
    { id: 'Table 4', label: 'Table 4', capacity: '4 - 6 Pax', type: 'Main Dining' },
    { id: 'Table 5', label: 'Table 5', capacity: '4 - 6 Pax', type: 'Main Dining' },
    { id: 'Table 6', label: 'Table 6', capacity: '4 - 6 Pax', type: 'Main Dining' },
    { id: 'Table 7', label: 'Table 7', capacity: '6 - 8 Pax', type: 'Family Booth' },
    { id: 'Table 8', label: 'Table 8', capacity: '6 - 8 Pax', type: 'Family Booth' },
    { id: 'Table 9', label: 'Table 9', capacity: '2 - 4 Pax', type: 'Window View' },
    { id: 'Table 10', label: 'Table 10', capacity: '2 - 4 Pax', type: 'Window View' },
    { id: 'VIP Table 1', label: 'VIP Table 1', capacity: '8 - 12 Pax', type: 'VIP Private' },
    { id: 'VIP Table 2', label: 'VIP Table 2', capacity: '8 - 12 Pax', type: 'VIP Private' },
    { id: 'Patio Table A', label: 'Patio Table A', capacity: '2 - 4 Pax', type: 'Outdoor Patio' },
    { id: 'Patio Table B', label: 'Patio Table B', capacity: '4 - 6 Pax', type: 'Outdoor Patio' }
  ]

  const handleOpenAssignTable = (booking, isJustConfirmed = false) => {
    setTableAssignModalBooking(booking)
    setAssigningTableNumber(booking.table_number || '')
    setCustomTableInput('')
    setIsJustConfirmedModal(isJustConfirmed)
  }

  const handleSaveTableAssignment = async () => {
    if (!tableAssignModalBooking) return
    const finalTable = (customTableInput.trim() || assigningTableNumber || '').trim()
    setIsAssigningTable(true)
    try {
      const res = await api.reservations.assignTable(tableAssignModalBooking.raw_id, finalTable)
      if (res?.status === 'success' || !res?.status || res?.status !== 'error') {
        showToast(finalTable ? `Assigned ${tableAssignModalBooking.customer_name} to ${finalTable}!` : 'Table assignment removed.', 'success')
        await fetchAllBookings()
        if (selectedBookingForModal && selectedBookingForModal.id === tableAssignModalBooking.id) {
          setSelectedBookingForModal(prev => ({ ...prev, table_number: finalTable || null }))
        }
        setTableAssignModalBooking(null)
        setIsJustConfirmedModal(false)
      } else {
        showToast(res?.message || 'Failed to assign table', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error assigning table', 'error')
    } finally {
      setIsAssigningTable(false)
    }
  }

  const getOccupiedTables = (dateStr, timeStr, excludeId) => {
    return normalizedBookings
      .filter(b => b.category === 'table' && b.event_date === dateStr && b.event_time === timeStr && b.id !== excludeId && b.table_number && b.status !== 'Cancelled' && b.status !== 'Declined')
      .map(b => ({ table: b.table_number, customer: b.customer_name }))
  }

  // Settings Modal State
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [isDaySlotsEditorOpen, setIsDaySlotsEditorOpen] = useState(false)
  const [settingsActiveTab, setSettingsActiveTab] = useState('slots') // 'slots' | 'capacity' | 'blackouts'
  const [newBlockoutDate, setNewBlockoutDate] = useState('')
  const [newSlotTime, setNewSlotTime] = useState('')
  const [newSlotPeriod, setNewSlotPeriod] = useState('Lunch')

  // Create Event for Customer Modal State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false)
  const [showMenuRecommendations, setShowMenuRecommendations] = useState(false)
  const [availableHalls, setAvailableHalls] = useState([])
  const [availablePackages, setAvailablePackages] = useState([])

  const initialEventForm = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_name: '',
    event_type: 'Birthday Celebration',
    category: 'hall',
    hall_name: '',
    package_name: '',
    event_date: todayStr,
    event_time: '11:00 AM - 03:00 PM',
    guest_count: 50,
    total_amount: '',
    status: 'Confirmed',
    special_requests: '',
    venue_address: ''
  }
  const [eventForm, setEventForm] = useState(initialEventForm)

  const [reservationSettings, setReservationSettings] = useState({
    max_guests_per_slot: 50,
    max_tables: 15,
    lunch_slot_open: 1,
    dinner_slot_open: 1,
    late_slot_open: 1,
    time_slots: [],
    blocked_dates: [],
    date_overrides: {}
  })

  const handleCreateEventBooking = async (e) => {
    e.preventDefault()
    if (!eventForm.customer_name || !eventForm.event_name) {
      showToast('Please enter customer name and event title.', 'error')
      return
    }
    setIsSubmittingEvent(true)
    try {
      const code = `EVT-${Math.floor(10000 + Math.random() * 90000)}`
      const payload = {
        code,
        name: eventForm.customer_name,
        email: eventForm.customer_email,
        phone: eventForm.customer_phone,
        event_name: eventForm.event_name,
        event_type: eventForm.event_type,
        category: eventForm.category,
        hall_name: eventForm.hall_name || (eventForm.category === 'hall' ? 'Jo\'s Diner Function Hall' : 'Main Dining Area'),
        package_name: eventForm.package_name || (eventForm.category === 'hall' ? 'Function Hall Rental' : 'Catering Package'),
        event_date: eventForm.event_date,
        time: eventForm.event_time,
        count: parseInt(eventForm.guest_count, 10) || 1,
        total: parseFloat(eventForm.total_amount) || 0,
        status: eventForm.status || 'Confirmed',
        special_requests: eventForm.special_requests,
        venue_address: eventForm.venue_address
      }

      const res = await api.reservations.createReservation(payload)
      if (res?.status === 'success' || res?.reservation_id) {
        showToast(`🎉 Event "${eventForm.event_name}" created successfully for ${eventForm.customer_name}! Visible on customer portal.`, 'success')
        setIsCreateEventModalOpen(false)
        setEventForm(initialEventForm)
        loadData()
      } else {
        showToast(res?.message || 'Failed to create event reservation.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error creating event booking.', 'error')
    } finally {
      setIsSubmittingEvent(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.allSettled([
        fetchAllBookings(),
        fetchReservationSettings(),
        fetchHallsAndPackages()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHallsAndPackages = async () => {
    try {
      const [hallsRes, pkgsRes] = await Promise.allSettled([
        api.functionHalls.getHalls(),
        api.catering.getPackages()
      ])
      if (hallsRes.status === 'fulfilled' && (hallsRes.value?.status === 'success' || Array.isArray(hallsRes.value?.halls))) {
        setAvailableHalls(hallsRes.value.halls || [])
      }
      if (pkgsRes.status === 'fulfilled' && (pkgsRes.value?.status === 'success' || Array.isArray(pkgsRes.value?.packages))) {
        setAvailablePackages(pkgsRes.value.packages || [])
      }
    } catch (e) {
      console.warn('Could not load halls/packages:', e)
    }
  }

  const fetchAllBookings = async () => {
    try {
      const [catData, resData] = await Promise.allSettled([
        api.catering.getBookings(),
        api.reservations.getReservations()
      ])

      if (catData.status === 'fulfilled' && catData.value?.status === 'success' && catData.value.bookings) {
        setCateringBookings(catData.value.bookings)
      } else {
        setCateringBookings([])
      }

      if (resData.status === 'fulfilled' && resData.value?.status === 'success' && resData.value.reservations) {
        setTableReservations(resData.value.reservations)
      } else {
        setTableReservations([])
      }
    } catch (e) {
      showToast('Could not fetch reservations data from server.', 'error')
    }
  }

  const fetchReservationSettings = async () => {
    try {
      const data = await api.reservations.getSettings()
      if (data.status === 'success' && data.settings) {
        setReservationSettings({
          ...data.settings,
          time_slots: Array.isArray(data.settings.time_slots) ? data.settings.time_slots : []
        })
      }
    } catch (e) {
      // Handled silently
    }
  }

  const handleSaveAvailabilitySettings = async (e) => {
    if (e) e.preventDefault()
    try {
      const data = await api.reservations.updateSettings(reservationSettings)
      if (data.status === 'success') {
        showToast('Reservation settings saved successfully to database!', 'success')
        setIsAvailabilityModalOpen(false)
        await fetchReservationSettings()
      } else {
        showToast(data.message || 'Error saving settings', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Could not connect to server.', 'error')
    }
  }

  // Unified Status Update Handler for both Table Reservations and Catering Bookings
  const handleUpdateBookingStatus = async (booking, newStatus) => {
    try {
      if (booking.is_catering) {
        const data = await api.catering.updateBookingStatus(booking.raw_id, newStatus)
        if (data.status === 'success') {
          showToast(`Updated booking ${booking.booking_code} status to "${newStatus}".`, 'success')
          fetchAllBookings()
          if (selectedBookingForModal && selectedBookingForModal.id === booking.id) {
            setSelectedBookingForModal(prev => ({ ...prev, status: newStatus }))
          }
        } else {
          showToast(data.message || 'Failed to update booking status.', 'error')
        }
      } else {
        const data = await api.reservations.updateReservation(booking.raw_id, { status: newStatus })
        if (data.status === 'success') {
          if (newStatus === 'Confirmed') {
            showToast(`Reservation ${booking.booking_code} Confirmed! Scannable QR pass emailed to customer.`, 'success')
            // Automatically prompt the admin to assign the dining table right after confirming
            if (booking.category === 'table' || !booking.is_catering) {
              handleOpenAssignTable({ ...booking, status: 'Confirmed' }, true)
            }
          } else {
            showToast(`Updated reservation ${booking.booking_code} status to "${newStatus}".`, 'success')
          }
          fetchAllBookings()
          if (selectedBookingForModal && selectedBookingForModal.id === booking.id) {
            setSelectedBookingForModal(prev => ({ ...prev, status: newStatus }))
          }
        } else {
          showToast(data.message || 'Failed to update reservation status.', 'error')
        }
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    }
  }

  // Trigger Reusable Confirmation Modal
  const handleDeleteBooking = (booking) => {
    setBookingToDelete(booking)
  }

  // Confirm Delete Handler
  const handleConfirmDeleteBooking = async () => {
    if (!bookingToDelete) return
    setIsDeletingBooking(true)
    try {
      if (bookingToDelete.is_catering) {
        const data = await api.catering.deleteBooking(bookingToDelete.raw_id)
        if (data.status === 'success') {
          showToast(`Deleted booking ${bookingToDelete.booking_code}.`, 'info')
          fetchAllBookings()
          if (selectedBookingForModal && selectedBookingForModal.id === bookingToDelete.id) {
            setSelectedBookingForModal(null)
          }
          setBookingToDelete(null)
        } else {
          showToast(data.message || 'Failed to delete booking.', 'error')
        }
      } else {
        const data = await api.reservations.deleteReservation(bookingToDelete.raw_id)
        if (data.status === 'success') {
          showToast(`Deleted reservation ${bookingToDelete.booking_code}.`, 'info')
          fetchAllBookings()
          if (selectedBookingForModal && selectedBookingForModal.id === bookingToDelete.id) {
            setSelectedBookingForModal(null)
          }
          setBookingToDelete(null)
        } else {
          showToast(data.message || 'Failed to delete reservation.', 'error')
        }
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    } finally {
      setIsDeletingBooking(false)
    }
  }

  const handleUpdateCateringStatus = async (booking_id, newStatus) => {
    try {
      const data = await api.catering.updateBookingStatus(booking_id, newStatus)
      if (data.status === 'success') {
        showToast(`Updated booking #${booking_id} status to "${newStatus}".`, 'success')
        fetchAllBookings()
      } else {
        showToast(data.message || 'Failed to update booking status.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    }
  }

  const handleDeleteCateringBooking = async (booking_id) => {
    try {
      const data = await api.catering.deleteBooking(booking_id)
      if (data.status === 'success') {
        showToast(`Deleted booking #${booking_id}.`, 'info')
        fetchAllBookings()
      } else {
        showToast(data.message || 'Failed to delete booking.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    }
  }

  // Time Slot Management Handlers with Instant Persistence
  const handleToggleSlotEnabled = async (idx) => {
    const copy = [...(reservationSettings.time_slots || [])]
    copy[idx] = { ...copy[idx], enabled: !copy[idx].enabled }
    const updated = { ...reservationSettings, time_slots: copy }
    setReservationSettings(updated)
    try {
      await api.reservations.updateSettings(updated)
    } catch (e) {
      console.warn('Could not auto-save slot toggle:', e)
    }
  }

  const handleRemoveSlot = async (idx) => {
    const updatedSlots = (reservationSettings.time_slots || []).filter((_, i) => i !== idx)
    const updated = { ...reservationSettings, time_slots: updatedSlots }
    setReservationSettings(updated)
    showToast('Time slot removed.', 'info')
    try {
      await api.reservations.updateSettings(updated)
    } catch (e) {
      console.warn('Could not auto-save slot removal:', e)
    }
  }

  const handleAddNewSlot = async () => {
    const trimmed = newSlotTime.trim()
    if (!trimmed) {
      showToast('Please enter or pick a valid time (e.g. 10:00 AM).', 'warning')
      return
    }
    const currentSlots = reservationSettings.time_slots || []
    if (currentSlots.some(s => s.time.toLowerCase() === trimmed.toLowerCase())) {
      showToast('This time slot is already in the list.', 'info')
      return
    }
    const updatedSlots = [...currentSlots, { time: trimmed, period: newSlotPeriod, enabled: true }]
    const updated = { ...reservationSettings, time_slots: updatedSlots }
    setReservationSettings(updated)
    setNewSlotTime('')
    showToast(`Added "${trimmed}" to reservation time slots!`, 'success')
    try {
      await api.reservations.updateSettings(updated)
    } catch (e) {
      console.warn('Could not auto-save new slot:', e)
    }
  }

  const handleResetDefaultSlots = async () => {
    const standardPreset = [
      { time: '11:00 AM', period: 'Lunch', enabled: true },
      { time: '12:30 PM', period: 'Lunch', enabled: true },
      { time: '02:00 PM', period: 'Lunch', enabled: true },
      { time: '05:30 PM', period: 'Dinner', enabled: true },
      { time: '07:00 PM', period: 'Dinner', enabled: true },
      { time: '08:30 PM', period: 'Dinner', enabled: true }
    ]
    const updated = { ...reservationSettings, time_slots: standardPreset }
    setReservationSettings(updated)
    showToast('Reset time slots to standard 6-slot preset.', 'info')
    try {
      await api.reservations.updateSettings(updated)
    } catch (e) {
      console.warn('Could not auto-save standard preset:', e)
    }
  }

  const handleGenerateHourlySlots = async () => {
    const hourly = [
      { time: '09:00 AM', period: 'Morning', enabled: true },
      { time: '10:00 AM', period: 'Morning', enabled: true },
      { time: '11:00 AM', period: 'Lunch', enabled: true },
      { time: '12:00 PM', period: 'Lunch', enabled: true },
      { time: '01:00 PM', period: 'Lunch', enabled: true },
      { time: '02:00 PM', period: 'Afternoon', enabled: true },
      { time: '03:00 PM', period: 'Afternoon', enabled: true },
      { time: '04:00 PM', period: 'Afternoon', enabled: true },
      { time: '05:00 PM', period: 'Dinner', enabled: true },
      { time: '06:00 PM', period: 'Dinner', enabled: true },
      { time: '07:00 PM', period: 'Dinner', enabled: true },
      { time: '08:00 PM', period: 'Dinner', enabled: true },
      { time: '09:00 PM', period: 'Dinner', enabled: true }
    ]
    const updated = { ...reservationSettings, time_slots: hourly }
    setReservationSettings(updated)
    showToast('Loaded hourly schedule (9:00 AM – 9:00 PM) and saved to database!', 'success')
    try {
      await api.reservations.updateSettings(updated)
    } catch (e) {
      console.warn('Could not auto-save hourly schedule:', e)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Normalized Unified Bookings List
  const normalizedBookings = useMemo(() => {
    const combined = []

    // 1. Catering Bookings
    cateringBookings.forEach(b => {
      const isHallWithFood = b.service_type === 'function_hall_with_food'
      combined.push({
        id: b.booking_id,
        raw_id: b.booking_id,
        is_catering: true,
        booking_code: b.booking_code || `CAT-${b.booking_id}`,
        customer_name: b.customer_name || 'Guest Customer',
        customer_phone: b.customer_phone || 'N/A',
        customer_email: b.customer_email || '',
        category: isHallWithFood ? 'hall' : 'catering',
        category_label: isHallWithFood ? 'Function Hall + Food' : 'Food Catering Only',
        package_name: b.package_name || (isHallWithFood ? 'Hall & Banquet' : 'Catering Buffet'),
        event_date: b.event_date ? b.event_date.split('T')[0] : '',
        event_time: b.event_time || '12:00 PM',
        event_venue: b.event_venue || b.hall_name || 'Client Venue',
        guest_count: parseInt(b.guest_count, 10) || 0,
        total_amount: parseFloat(b.total_amount || 0),
        status: b.status || 'Pending',
        selected_dishes: b.selected_dishes,
        addons: b.addons
      })
    })

    // 2. Table / Hall Reservations
    tableReservations.forEach(r => {
      const rCategory = (r.category || r.type || (r.event_type && r.event_type.toLowerCase().includes('hall') ? 'hall' : 'table')).toLowerCase()
      const isHall = rCategory.includes('hall')
      const isCat = rCategory.includes('catering')
      const catKey = isHall ? 'hall' : isCat ? 'catering' : 'table'

      combined.push({
        id: r.reservation_id || r.id,
        raw_id: r.reservation_id || r.id,
        is_catering: false,
        booking_code: r.reservation_code || `RES-${r.reservation_id || r.id}`,
        customer_name: r.contact_name || r.contact_person || 'Guest Customer',
        customer_phone: r.contact_phone || r.phone || 'N/A',
        customer_email: r.email || '',
        category: catKey,
        category_label: isHall ? 'Function Hall Venue' : isCat ? 'Catering Service' : 'Dining Table Reservation',
        package_name: r.event_name || r.event_type || r.title || (isHall ? 'Function Hall Rental' : 'Dining Table Reservation'),
        event_date: r.event_date ? r.event_date.split('T')[0] : '',
        event_time: r.event_time || '12:00 PM',
        event_venue: r.hall_name || r.venue_name || r.venue_address || (isHall ? "Jo's Diner Function Hall" : "Jo's Diner Main Area"),
        guest_count: parseInt(r.guest_count || r.guests, 10) || 0,
        total_amount: parseFloat(r.total_amount || 0),
        status: r.status || 'Pending',
        table_number: r.table_number || null,
        checked_in_at: r.checked_in_at || null,
        checked_in_by: r.checked_in_by || null,
        special_requests: r.special_requests
      })
    })

    return combined
  }, [cateringBookings, tableReservations])

  // Filtered Bookings for Search Query, Category & Status
  const filteredBookings = useMemo(() => {
    return normalizedBookings.filter(b => {
      const q = (localSearchQuery || searchQuery || '').toLowerCase().trim()
      const matchSearch = !q ||
        (b.customer_name || '').toLowerCase().includes(q) ||
        (b.event_venue || '').toLowerCase().includes(q) ||
        (b.package_name || '').toLowerCase().includes(q) ||
        (b.booking_code || '').toLowerCase().includes(q) ||
        (b.customer_phone || '').toLowerCase().includes(q) ||
        (b.customer_email || '').toLowerCase().includes(q) ||
        (b.event_date || '').toLowerCase().includes(q) ||
        (b.special_requests || '').toLowerCase().includes(q)

      if (!matchSearch) return false

      const matchCategory = selectedCategoryFilter === 'all' || b.category === selectedCategoryFilter
      if (!matchCategory) return false

      if (statusFilter === 'all') return true
      if (statusFilter === 'Pending') {
        return b.status?.toLowerCase().includes('pending')
      }
      return b.status?.toLowerCase() === statusFilter.toLowerCase()
    })
  }, [normalizedBookings, searchQuery, localSearchQuery, selectedCategoryFilter, statusFilter])

  // Category counts computed dynamically from real database rows
  const categoryCounts = useMemo(() => ({
    all: normalizedBookings.length,
    table: normalizedBookings.filter(b => b.category === 'table').length,
    hall: normalizedBookings.filter(b => b.category === 'hall').length,
    catering: normalizedBookings.filter(b => b.category === 'catering').length
  }), [normalizedBookings])

  // Status counts filtered by current category to match what's actually displayed
  const categoryFilteredBookings = useMemo(() => {
    if (selectedCategoryFilter === 'all') return normalizedBookings
    return normalizedBookings.filter(b => b.category === selectedCategoryFilter)
  }, [normalizedBookings, selectedCategoryFilter])

  const statusCounts = useMemo(() => ({
    all: categoryFilteredBookings.length,
    Pending: categoryFilteredBookings.filter(b => b.status?.toLowerCase().includes('pending')).length,
    Confirmed: categoryFilteredBookings.filter(b => b.status === 'Confirmed').length,
    Completed: categoryFilteredBookings.filter(b => b.status === 'Completed').length,
    Cancelled: categoryFilteredBookings.filter(b => b.status === 'Cancelled' || b.status === 'Declined').length
  }), [categoryFilteredBookings])

  // Bookings on the currently Selected Date
  const bookingsOnSelectedDate = useMemo(() => {
    return normalizedBookings.filter(b => b.event_date === selectedDateStr)
  }, [normalizedBookings, selectedDateStr])

  // Calendar Calculation Helpers
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()

  const resetToToday = () => {
    const cur = new Date()
    setCalendarYear(cur.getFullYear())
    setCalendarMonth(cur.getMonth())
    setSelectedDateStr(todayStr)
  }

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(y => y - 1)
    } else {
      setCalendarMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(y => y + 1)
    } else {
      setCalendarMonth(m => m + 1)
    }
  }

  // Toggle single date blackout
  const toggleDateBlackout = async (dateKey) => {
    const current = reservationSettings.blocked_dates || []
    let updated = []
    if (current.includes(dateKey)) {
      updated = current.filter(d => d !== dateKey)
      showToast(`Removed ${dateKey} from blackout list.`, 'info')
    } else {
      updated = [...current, dateKey].sort()
      showToast(`Marked ${dateKey} as Blackout / Blocked date!`, 'success')
    }
    const newSettings = { ...reservationSettings, blocked_dates: updated }
    setReservationSettings(newSettings)
    try {
      await api.reservations.updateSettings(newSettings)
    } catch (e) {
      console.warn('Could not auto-save blackout date:', e)
    }
  }

  // Per-Day Timeslot Availability Handlers
  const toggleSlotForDate = async (dateStr, slotTime) => {
    const currentOverrides = { ...(reservationSettings.date_overrides || {}) }
    const dayData = currentOverrides[dateStr] || { disabled_slots: [] }
    const currentDisabled = Array.isArray(dayData.disabled_slots) ? dayData.disabled_slots : []

    let updatedDisabled = []
    if (currentDisabled.includes(slotTime)) {
      updatedDisabled = currentDisabled.filter(s => s !== slotTime)
      showToast(`Enabled ${slotTime} on ${dateStr}`, 'info')
    } else {
      updatedDisabled = [...currentDisabled, slotTime]
      showToast(`Disabled ${slotTime} on ${dateStr}`, 'warning')
    }

    currentOverrides[dateStr] = {
      ...dayData,
      disabled_slots: updatedDisabled
    }

    if (updatedDisabled.length === 0 && !dayData.is_blackout && !dayData.max_guests && !dayData.note) {
      delete currentOverrides[dateStr]
    }

    const newSettings = { ...reservationSettings, date_overrides: currentOverrides }
    setReservationSettings(newSettings)
    try {
      await api.reservations.updateSettings(newSettings)
    } catch (e) {
      console.warn('Could not auto-save date override:', e)
    }
  }

  const enableAllSlotsForDate = async (dateStr) => {
    const currentOverrides = { ...(reservationSettings.date_overrides || {}) }
    if (currentOverrides[dateStr]) {
      currentOverrides[dateStr] = {
        ...currentOverrides[dateStr],
        disabled_slots: []
      }
      if (!currentOverrides[dateStr].is_blackout && !currentOverrides[dateStr].max_guests && !currentOverrides[dateStr].note) {
        delete currentOverrides[dateStr]
      }
    }
    const newSettings = { ...reservationSettings, date_overrides: currentOverrides }
    setReservationSettings(newSettings)
    showToast(`Enabled all timeslots on ${dateStr}`, 'success')
    try {
      await api.reservations.updateSettings(newSettings)
    } catch (e) {
      console.warn('Could not auto-save date override:', e)
    }
  }

  const disableAllSlotsForDate = async (dateStr) => {
    const currentOverrides = { ...(reservationSettings.date_overrides || {}) }
    const allSlotTimes = (reservationSettings.time_slots || [])
      .filter(s => s.enabled !== false)
      .map(s => s.time)

    currentOverrides[dateStr] = {
      ...(currentOverrides[dateStr] || {}),
      disabled_slots: allSlotTimes
    }
    const newSettings = { ...reservationSettings, date_overrides: currentOverrides }
    setReservationSettings(newSettings)
    showToast(`Closed all timeslots on ${dateStr}`, 'warning')
    try {
      await api.reservations.updateSettings(newSettings)
    } catch (e) {
      console.warn('Could not auto-save date override:', e)
    }
  }

  const resetDateScheduleToDefault = async (dateStr) => {
    const currentOverrides = { ...(reservationSettings.date_overrides || {}) }
    delete currentOverrides[dateStr]
    const updatedBlocked = (reservationSettings.blocked_dates || []).filter(d => d !== dateStr)
    const newSettings = {
      ...reservationSettings,
      date_overrides: currentOverrides,
      blocked_dates: updatedBlocked
    }
    setReservationSettings(newSettings)
    showToast(`Reset ${dateStr} to standard global schedule.`, 'info')
    try {
      await api.reservations.updateSettings(newSettings)
    } catch (e) {
      console.warn('Could not auto-save reset date:', e)
    }
  }

  const handleAddBlockoutDate = () => {
    if (!newBlockoutDate) return
    if (reservationSettings.blocked_dates?.includes(newBlockoutDate)) {
      showToast('Date is already in blackout list.', 'error')
      return
    }
    const updated = [...(reservationSettings.blocked_dates || []), newBlockoutDate].sort()
    const newSettings = { ...reservationSettings, blocked_dates: updated }
    setReservationSettings(newSettings)
    setNewBlockoutDate('')
    showToast(`Added ${newBlockoutDate} to blackout list!`, 'info')
  }

  const handleRemoveBlockoutDate = (dateStr) => {
    const updated = (reservationSettings.blocked_dates || []).filter(d => d !== dateStr)
    const newSettings = { ...reservationSettings, blocked_dates: updated }
    setReservationSettings(newSettings)
    showToast(`Removed ${dateStr} from blocked dates.`, 'info')
  }

  // Format selected date human friendly
  const formattedSelectedDateDisplay = useMemo(() => {
    if (!selectedDateStr) return 'No Date Selected'
    const parts = selectedDateStr.split('-')
    if (parts.length !== 3) return selectedDateStr
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }, [selectedDateStr])

  const isSelectedDateBlocked = (reservationSettings.blocked_dates || []).includes(selectedDateStr)

  const activeTimeSlotsCount = (reservationSettings.time_slots || []).filter(s => s.enabled !== false).length

  // Selected Day Override Data
  const selectedDayOverride = reservationSettings.date_overrides?.[selectedDateStr]
  const isSelectedDayCustom = Boolean(selectedDayOverride && ((selectedDayOverride.disabled_slots && selectedDayOverride.disabled_slots.length > 0) || selectedDayOverride.max_guests))
  const selectedDayDisabledSlots = selectedDayOverride?.disabled_slots || []

  // Customer Avatar Initials Helper
  const getCustomerInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Human Friendly Date Formatter
  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Reservations &amp; Booking Management</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Interactive availability calendar, customizable time slots, and catering/function hall inquiries queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* List vs Calendar Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setReservationViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${reservationViewMode === 'calendar'
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-icons text-sm">calendar_month</span>
              <span>Availability Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setReservationViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${reservationViewMode === 'list'
                ? 'bg-[#071A3D] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-icons text-sm">list_alt</span>
              <span>All Bookings ({normalizedBookings.length})</span>
            </button>
          </div>

          {/* QR Code Instant Scanner Button */}
          <button
            type="button"
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
            title="Scan & Verify Customer QR Code Pass"
          >
            <span className="material-icons text-base">qr_code_scanner</span>
            <span>Scan QR Pass</span>
          </button>

          {/* Create Event & Booking for Customer Button */}
          <button
            type="button"
            onClick={() => setIsCreateEventModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer border border-red-700"
          >
            <span className="material-icons text-base">add_circle</span>
            <span>+ Create Event for Customer</span>
          </button>

          {/* Single Consolidated Reservation Settings Button */}
          <button
            type="button"
            onClick={() => {
              setSettingsActiveTab('slots')
              setIsAvailabilityModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer border border-slate-700"
          >
            <span className="material-icons text-base">tune</span>
            <span>Reservation Settings</span>
          </button>
        </div>
      </header>

      {/* TOP METRIC CARDS - SKELETON LOADING OR SLEEK TILES */}
      {isLoading ? (
        <MetricTilesSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Bookings */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Total Bookings
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-[#071A3D] dark:text-white font-mono">{normalizedBookings.length}</h3>
                <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Records</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/50">
              <span className="material-icons text-xl">book_online</span>
            </div>
          </div>

          {/* Card 2: Pending Review */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Pending Review
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-amber-600 font-mono">{statusCounts.Pending}</h3>
                {statusCounts.Pending > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse">Action Req</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
              <span className="material-icons text-xl">pending_actions</span>
            </div>
          </div>

          {/* Card 3: Confirmed Bookings */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Confirmed
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-emerald-600 font-mono">{statusCounts.Confirmed}</h3>
                <span className="text-[10px] text-emerald-600/70 font-semibold hidden sm:inline">Active</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50">
              <span className="material-icons text-xl">verified</span>
            </div>
          </div>

          {/* Card 4: Today's Schedule */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Today's Schedule
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-indigo-600 font-mono">
                  {normalizedBookings.filter(b => b.event_date === todayStr && b.status !== 'Cancelled').length}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{todayStr}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900/50">
              <span className="material-icons text-xl">today</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: PROPER INTERACTIVE CALENDAR */}
      {reservationViewMode === 'calendar' && (
        isLoading ? (
          <CalendarViewSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT 7-8 COLUMNS: INTERACTIVE CALENDAR GRID */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 shadow-xs overflow-hidden">

                {/* Calendar Header with Navigation Controls */}
                <div className="p-4 sm:p-5 border-b border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[#C8102E] text-xl">calendar_month</span>
                      <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-white font-['Russo_One'] uppercase tracking-tight">
                        {monthNames[calendarMonth]} {calendarYear}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetToToday}
                        className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                      >
                        Today
                      </button>
                      <div className="flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                          title="Previous Month"
                        >
                          <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                          title="Next Month"
                        >
                          <span className="material-icons text-sm">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Quick Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Filter View:</span>
                    {[
                      { id: 'all', label: 'All Bookings' },
                      { id: 'hall', label: '🏛️ Function Halls' },
                      { id: 'catering', label: '🍱 Catering' },
                      { id: 'table', label: '🍽️ Tables' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition cursor-pointer border ${selectedCategoryFilter === tab.id
                          ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-100'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day Labels SUN MON TUE WED THU FRI SAT */}
                <div className="grid grid-cols-7 border-b border-gray-300 dark:border-slate-700 bg-gray-100/80 dark:bg-slate-800/80 text-center text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 py-2.5">
                  <div>SUN</div>
                  <div>MON</div>
                  <div>TUE</div>
                  <div>WED</div>
                  <div>THU</div>
                  <div>FRI</div>
                  <div>SAT</div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-slate-800">
                  {/* Empty padding days before day 1 */}
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-gray-50/40 dark:bg-slate-950/30"></div>
                  ))}

                  {/* Month Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1
                    const monthStr = String(calendarMonth + 1).padStart(2, '0')
                    const dayStr = String(dayNum).padStart(2, '0')
                    const dateKey = `${calendarYear}-${monthStr}-${dayStr}`
                    const isSelected = selectedDateStr === dateKey
                    const isToday = dateKey === todayStr
                    const isPast = dateKey < todayStr
                    const isBlocked = (reservationSettings.blocked_dates || []).includes(dateKey)
                    const dayBookings = normalizedBookings.filter(b => b.event_date === dateKey)
                    const cellOverride = reservationSettings.date_overrides?.[dateKey]
                    const hasCustomSlots = Boolean(cellOverride && cellOverride.disabled_slots && cellOverride.disabled_slots.length > 0)

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelectedDateStr(dateKey)}
                        className={`h-16 sm:h-20 p-1.5 sm:p-2 text-left flex flex-col justify-between transition relative cursor-pointer group ${isSelected
                          ? 'bg-[#C8102E] text-white font-extrabold z-10 shadow-inner'
                          : isBlocked
                            ? 'bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 border-red-200 hover:bg-red-100/60'
                            : isToday
                              ? 'bg-blue-50/50 dark:bg-slate-800 text-blue-900 dark:text-white ring-1 ring-blue-500/50 inset-0'
                              : isPast
                                ? 'bg-gray-50/50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-600 hover:bg-gray-100'
                                : 'bg-white dark:bg-[#071A3D] text-gray-800 dark:text-gray-200 hover:bg-red-50/30'
                          }`}
                      >
                        {/* Day Number and Today Indicator */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : ''}`}>
                            {dayNum}
                          </span>

                          {isToday && !isSelected && (
                            <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded">
                              Today
                            </span>
                          )}
                          {isBlocked && !isSelected && (
                            <span className="text-[8px] font-black uppercase bg-red-600 text-white px-1 py-0.2 rounded">
                              Blocked
                            </span>
                          )}
                          {hasCustomSlots && !isBlocked && !isSelected && (
                            <span className="text-[8px] font-black uppercase bg-amber-500 text-white px-1 py-0.2 rounded">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Day Status / Booking Badges */}
                        <div className="w-full space-y-0.5">
                          {isSelected ? (
                            <div className="flex items-center justify-between text-[9px] font-bold text-white/90">
                              <span>{dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            </div>
                          ) : isBlocked ? (
                            <span className="text-[9px] font-extrabold text-red-600 dark:text-red-400 block truncate">
                              ⛔ Blackout Date
                            </span>
                          ) : dayBookings.length > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/70 px-1.5 py-0.5 rounded flex items-center gap-1 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                <span className="truncate">{dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}</span>
                              </span>
                            </div>
                          ) : hasCustomSlots ? (
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Custom Sched</span>
                            </span>
                          ) : isPast ? (
                            <span className="text-[9px] font-medium text-gray-400 dark:text-slate-600 block">
                              Passed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Open</span>
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Standard Calendar Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold p-3.5 border-t border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-[11px]">Available Date</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-[11px]">Bookings Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-[11px]">Custom Day Timeslots</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-[11px]">Blackout Date</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-[11px]">Past Date</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT 4-5 COLUMNS: SELECTED DATE INSPECTOR & SCHEDULE PANE */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-6">
              <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 shadow-xs p-5 space-y-4">

                {/* Header & Date Badge */}
                <div className="border-b border-gray-200 dark:border-slate-700 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                      Selected Schedule Date
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${isSelectedDateBlocked
                      ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
                      : isSelectedDayCustom
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                        : bookingsOnSelectedDate.length > 0
                          ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                      }`}>
                      {isSelectedDateBlocked ? '⛔ Blocked Date' : isSelectedDayCustom ? '⚡ Custom Schedule' : bookingsOnSelectedDate.length > 0 ? `📅 ${bookingsOnSelectedDate.length} Booked` : '🟢 Open for Bookings'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-white leading-tight font-['Russo_One']">
                    {formattedSelectedDateDisplay}
                  </h3>
                </div>

                {/* Quick Actions Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDateBlackout(selectedDateStr)}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${isSelectedDateBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                  >
                    <span className="material-icons text-sm">{isSelectedDateBlocked ? 'check_circle' : 'block'}</span>
                    <span>{isSelectedDateBlocked ? 'Unblock Date' : 'Block Date (Blackout)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDaySlotsEditorOpen(prev => !prev)}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border shadow-2xs ${isDaySlotsEditorOpen
                      ? 'bg-[#071A3D] text-white border-[#071A3D] dark:bg-slate-700 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60'
                      }`}
                  >
                    <span className="material-icons text-sm text-[#C8102E]">schedule</span>
                    <span>{isDaySlotsEditorOpen ? 'Hide Day Slots' : 'Set Day Timeslots'}</span>
                    <span className="material-icons text-sm">{isDaySlotsEditorOpen ? 'expand_less' : 'expand_more'}</span>
                  </button>
                </div>

                {/* Day Summary Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Bookings</span>
                    <span className="font-mono font-black text-sm text-[#071A3D] dark:text-white">
                      {bookingsOnSelectedDate.length}
                    </span>
                  </div>
                  <div className="border-x border-gray-200 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Total Pax</span>
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {bookingsOnSelectedDate.reduce((sum, b) => sum + (b.guest_count || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Revenue</span>
                    <span className="font-mono font-black text-sm text-[#C8102E]">
                      ₱{bookingsOnSelectedDate.reduce((sum, b) => sum + (b.total_amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* DAILY TIMESLOT AVAILABILITY & CONTROLS (Only visible when toggled by Admin) */}
                {isDaySlotsEditorOpen && (
                  <div className="p-3.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60 space-y-2.5 shadow-2xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-sm text-[#C8102E]">tune</span>
                        <span className="text-[11px] font-black text-gray-800 dark:text-gray-200">
                          Customize Day Timeslots
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 font-mono">
                        {activeTimeSlotsCount - selectedDayDisabledSlots.length}/{activeTimeSlotsCount} Slots Open
                      </span>
                    </div>

                    {/* Quick Toggle Controls */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => enableAllSlotsForDate(selectedDateStr)}
                        className="flex-1 py-1 px-1.5 rounded bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 transition cursor-pointer text-center"
                      >
                        ✓ All Open
                      </button>
                      <button
                        type="button"
                        onClick={() => disableAllSlotsForDate(selectedDateStr)}
                        className="flex-1 py-1 px-1.5 rounded bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-red-600 hover:bg-red-50 transition cursor-pointer text-center"
                      >
                        × All Closed
                      </button>
                      {isSelectedDayCustom && (
                        <button
                          type="button"
                          onClick={() => resetDateScheduleToDefault(selectedDateStr)}
                          className="py-1 px-2 rounded bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition cursor-pointer"
                          title="Reset this date to global schedule"
                        >
                          ↺ Reset
                        </button>
                      )}
                    </div>

                    {/* Timeslots Grid for Selected Date */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {(reservationSettings.time_slots || [])
                        .filter(s => s.enabled !== false)
                        .map((slot, idx) => {
                          const isDisabledToday = selectedDayDisabledSlots.includes(slot.time)
                          const isSlotOpen = !isDisabledToday
                          const bookingsInSlot = bookingsOnSelectedDate.filter(b => (b.event_time || '').includes(slot.time))

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleSlotForDate(selectedDateStr, slot.time)}
                              className={`p-2 rounded-md border text-left transition flex items-center justify-between gap-1 cursor-pointer select-none ${isSlotOpen
                                ? 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 hover:border-gray-400 shadow-2xs'
                                : 'bg-gray-100 dark:bg-slate-950/80 border-gray-200 dark:border-slate-800 opacity-60'
                                }`}
                              title={`Click to ${isSlotOpen ? 'disable' : 'enable'} for ${selectedDateStr}`}
                            >
                              <div className="min-w-0">
                                <span className={`font-mono font-bold text-[11px] block leading-tight truncate ${isSlotOpen ? 'text-[#071A3D] dark:text-white' : 'text-gray-400 line-through'}`}>
                                  {slot.time}
                                </span>
                                <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">
                                  {slot.period || 'General'}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <span className={`w-2 h-2 rounded-full ${isSlotOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                {bookingsInSlot.length > 0 && (
                                  <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-mono">
                                    {bookingsInSlot.length} bk
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                    <p className="text-[9.5px] text-gray-400 italic text-center">Click any timeslot to toggle its availability specifically for this date.</p>
                  </div>
                )}

                {/* Bookings Queue for this Day */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Scheduled Events on this Date ({bookingsOnSelectedDate.length}):
                  </span>

                  {bookingsOnSelectedDate.length === 0 ? (
                    <div className="py-8 px-4 text-center border border-dashed border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/50 space-y-1">
                      <span className="material-icons text-3xl text-gray-300 dark:text-slate-600 block">event_note</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
                        No bookings scheduled on this date.
                      </span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Customers can freely select and reserve this date online.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {bookingsOnSelectedDate.map(b => (
                        <div
                          key={b.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-black text-[11px] text-[#C8102E] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded">
                              {b.booking_code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${b.category === 'hall'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200'
                              : b.category === 'catering'
                                ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200'
                                : 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200'
                              }`}>
                              {b.category_label}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-black text-sm text-[#071A3D] dark:text-white leading-tight">
                              {b.package_name}
                            </h4>
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium space-y-0.5 mt-1">
                              <div>👤 Customer: <strong>{b.customer_name}</strong> ({b.customer_phone})</div>
                              <div>⏰ Time: <strong>{b.event_time}</strong> | Capacity: <strong>{b.guest_count} Pax</strong></div>
                              <div>📍 Venue: <span className="font-semibold">{b.event_venue}</span></div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span className="font-mono font-black text-sm text-[#C8102E]">
                              ₱{b.total_amount.toLocaleString()}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {b.category === 'table' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignTable(b)}
                                  className={`px-2 py-0.5 rounded text-[9.5px] font-black border transition cursor-pointer flex items-center gap-1 ${
                                    b.table_number
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 hover:bg-amber-100'
                                  }`}
                                  title="Click to Assign or Change Dining Table"
                                >
                                  <span className="material-icons text-[11px]">table_restaurant</span>
                                  <span>{b.table_number || 'Assign Table'}</span>
                                </button>
                              )}

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${b.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                : b.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                }`}>
                                {b.status}
                              </span>

                              {b.status !== 'Confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b, 'Confirmed')}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] cursor-pointer"
                                >
                                  Confirm
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                                title="Delete Booking"
                              >
                                <span className="material-icons text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )
      )}

      {/* VIEW 2: ALL BOOKINGS LIST QUEUE */}
      {reservationViewMode === 'list' && (
        <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 shadow-xs p-4 sm:p-5 space-y-4">

          {/* Header & Filter Controls Bar */}
          <div className="space-y-3 pb-3 border-b border-gray-200">

            {/* Top Bar: Title & Category Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#071A3D] dark:text-white flex items-center gap-2 font-['Russo_One'] uppercase tracking-tight">
                  <span className="material-icons text-[#C8102E]">event_available</span>
                  <span>All Bookings &amp; Inquiries ({filteredBookings.length})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage dining table reservations, hall rentals, and catering inquiries directly.
                </p>
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${categoryCounts.all})` },
                  { id: 'table', label: `🍽️ Tables (${categoryCounts.table})` },
                  { id: 'hall', label: `🏛️ Halls (${categoryCounts.hall})` },
                  { id: 'catering', label: `🍱 Catering (${categoryCounts.catering})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${selectedCategoryFilter === tab.id
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs font-black'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Bar: Search Bar, Status Filter & View Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">

              {/* Integrated Search Input */}
              <div className="relative flex-1 max-w-md">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">search</span>
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Search customer, ref code, date, venue, phone..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-400 bg-gray-50/70 dark:bg-slate-900/60 text-[#071A3D] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-[#C8102E] transition"
                />
                {localSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLocalSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <span className="material-icons text-xs">close</span>
                  </button>
                )}
              </div>

              {/* Status Chips & View Mode Toggle */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
                {/* Status Chips */}
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {[
                    { id: 'all', label: 'All Status' },
                    { id: 'Pending', label: `Pending (${statusCounts.Pending})` },
                    { id: 'Confirmed', label: `Confirmed (${statusCounts.Confirmed})` },
                    { id: 'Completed', label: `Completed (${statusCounts.Completed})` },
                    { id: 'Cancelled', label: `Cancelled (${statusCounts.Cancelled})` }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${statusFilter === st.id
                        ? 'bg-[#071A3D] dark:bg-white text-white dark:text-[#071A3D] border-[#071A3D] dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50'
                        }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Cards vs Table View Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-400 shrink-0">
                  <button
                    type="button"
                    onClick={() => setListDisplayMode('cards')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${listDisplayMode === 'cards'
                        ? 'bg-white dark:bg-slate-900 text-[#071A3D] dark:text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    title="Card View"
                  >
                    <span className="material-icons text-xs">view_agenda</span>
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setListDisplayMode('table')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${listDisplayMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-[#071A3D] dark:text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    title="Dense Table View"
                  >
                    <span className="material-icons text-xs">table_rows</span>
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* SKELETON LOADING VIEW OR EMPTY STATE OR CARDS / TABLE VIEW */}
          {isLoading ? (
            listDisplayMode === 'cards' ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(n => (
                  <ReservationCardSkeleton key={n} />
                ))}
              </div>
            ) : (
              <ReservationTableSkeleton />
            )
          ) : filteredBookings.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-gray-400 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                <span className="material-icons text-2xl">event_busy</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-gray-800 dark:text-gray-200">
                  {normalizedBookings.length === 0 ? 'No Reservations in Database' : 'No Matching Bookings Found'}
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  {normalizedBookings.length === 0
                    ? 'No customer bookings or inquiries have been created yet. When customers reserve online or when you click "+ Create Event for Customer", bookings will appear here.'
                    : 'No reservations match your current search keywords or selected filter tabs.'}
                </p>
              </div>
              {normalizedBookings.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery('')
                    setSelectedCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer border border-red-700 inline-flex items-center gap-1.5"
                >
                  <span className="material-icons text-base">add_circle</span>
                  <span>+ Create First Reservation</span>
                </button>
              )}
            </div>
          ) : listDisplayMode === 'cards' ? (
            /* VIEW A: REDESIGNED MODERN LINEAR MASTER CARDS (TWO-TIER EXECUTIVE LAYOUT) */
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-lg bg-white dark:bg-slate-900 border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden border-l-[5px] ${b.status === 'Confirmed'
                      ? 'border-l-emerald-500'
                      : b.status === 'Completed'
                        ? 'border-l-blue-500'
                        : b.status === 'Cancelled' || b.status === 'Declined'
                          ? 'border-l-red-500 opacity-80'
                          : 'border-l-amber-500'
                    }`}
                >
                  {/* Tier 1: Card Header Strip (Ref Code, Category, Package Title & Status Dropdown) */}
                  <div className="px-4 py-2 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-[11px] text-[#C8102E] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded">
                        {b.booking_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${b.category === 'hall'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200'
                          : b.category === 'catering'
                            ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200'
                        }`}>
                        {b.category_label}
                      </span>
                      <span className="font-bold text-xs text-[#071A3D] dark:text-white">
                        {b.package_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateBookingStatus(b, e.target.value)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border cursor-pointer ${b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                            : b.status === 'Completed'
                              ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                              : b.status === 'Cancelled' || b.status === 'Declined'
                                ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200'
                                : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                          }`}
                      >
                        <option value="Pending Review" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">● Pending Review</option>
                        <option value="Confirmed" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">● Confirmed</option>
                        <option value="Completed" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">● Completed</option>
                        <option value="Cancelled" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">● Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Tier 2: Card Body (Customer Info, Schedule & Actions) */}
                  <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Zone 1: Customer Profile (Left) */}
                    <div className="flex items-center gap-3 w-full lg:w-56 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#071A3D] to-slate-700 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-gray-100 dark:ring-slate-800">
                        {getCustomerInitials(b.customer_name)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="font-black text-sm text-[#071A3D] dark:text-white truncate" title={b.customer_name}>
                          {b.customer_name}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                          <span className="material-icons text-[12px] text-gray-400">phone</span>
                          <a href={`tel:${b.customer_phone}`} className="hover:underline">
                            {b.customer_phone}
                          </a>
                        </div>
                        {b.customer_email && (
                          <div className="flex items-center gap-1 text-[10.5px] text-gray-400 truncate" title={b.customer_email}>
                            <span className="material-icons text-[11px] text-gray-400">email</span>
                            <a href={`mailto:${b.customer_email}`} className="hover:underline truncate">
                              {b.customer_email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone 2: Schedule, Venue & Requests (Middle) */}
                    <div className="flex-1 min-w-0 lg:border-l lg:border-gray-200 lg:dark:border-slate-800 lg:pl-4 space-y-1.5">
                      {/* Date, Time & Venue Row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                          <span className="material-icons text-sm text-[#C8102E]">calendar_today</span>
                          <span>{formatScheduleDate(b.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-900/40 text-[11px]">
                          <span className="material-icons text-xs">schedule</span>
                          <span>{b.event_time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[11px] truncate" title={b.event_venue}>
                          <span className="material-icons text-xs text-amber-600">place</span>
                          <span className="truncate">{b.event_venue}</span>
                        </div>
                      </div>

                      {/* Assigned Table Inline Badge (Dining Tables) */}
                      {b.category === 'table' && b.table_number && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[10.5px] text-emerald-800 dark:text-emerald-300 font-extrabold">
                          <span className="material-icons text-xs text-emerald-600 shrink-0">table_restaurant</span>
                          <span>Table: <strong>{b.table_number}</strong></span>
                        </div>
                      )}

                      {/* Special Request / Notes Inline Bubble */}
                      {b.special_requests && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 text-[10.5px] text-amber-900 dark:text-amber-300 max-w-full">
                          <span className="material-icons text-xs text-amber-600 shrink-0">notes</span>
                          <span className="italic truncate font-medium">"{b.special_requests}"</span>
                        </div>
                      )}

                      {/* Catering Menu Dish summary */}
                      {b.selected_dishes && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50/80 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-900/40 text-[10.5px] text-blue-900 dark:text-blue-300">
                          <span className="material-icons text-xs text-blue-600 shrink-0">restaurant_menu</span>
                          <span className="font-semibold">Catering Menu Configured ({b.guest_count} Servings)</span>
                        </div>
                      )}
                    </div>

                    {/* Zone 3: Headcount, Price & Action Buttons (Right) */}
                    <div className="w-full lg:w-auto shrink-0 lg:border-l lg:border-gray-200 lg:dark:border-slate-800 lg:pl-4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200 dark:border-slate-800">

                      {/* Headcount & Price */}
                      <div className="flex items-center lg:items-end gap-2.5 lg:gap-0.5 lg:flex-col">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <span className="material-icons text-xs text-blue-600">groups</span>
                          <span>{b.guest_count} Pax</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-black text-sm sm:text-base text-[#C8102E]">
                            ₱{b.total_amount.toLocaleString()}
                          </span>
                          {b.total_amount === 0 && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase">(Table)</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Toolbar */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Table Assignment Button for Dining Tables */}
                        {b.category === 'table' && (
                          <div className="relative">
                            {reassignConfirmBookingId === b.id ? (
                              // Inline confirmation when a table is already assigned
                              <div className="flex flex-col items-end gap-1 animate-in fade-in duration-150">
                                <div className="px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-300 text-[10px] font-bold text-amber-900 flex items-center gap-1.5 shadow-sm">
                                  <span className="material-icons text-xs text-amber-600">warning</span>
                                  <span>Already assigned: <strong>{b.table_number}</strong>. Update?</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReassignConfirmBookingId(null)
                                      handleOpenAssignTable(b)
                                    }}
                                    className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] transition cursor-pointer flex items-center gap-1"
                                  >
                                    <span className="material-icons text-xs">edit</span>
                                    <span>Yes, Update</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReassignConfirmBookingId(null)}
                                    className="px-2 py-1 rounded-md border border-gray-300 text-gray-600 font-bold text-[10px] transition cursor-pointer hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (b.table_number) {
                                    setReassignConfirmBookingId(b.id)
                                  } else {
                                    handleOpenAssignTable(b)
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-md border text-[11px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  b.table_number
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 animate-pulse'
                                }`}
                                title={b.table_number ? `Currently: ${b.table_number} — Click to reassign` : 'Assign a table'}
                              >
                                <span className="material-icons text-xs">table_restaurant</span>
                                <span>{b.table_number ? `🪑 ${b.table_number}` : 'Assign Table'}</span>
                                {b.table_number && <span className="material-icons text-[10px] opacity-50">edit</span>}
                              </button>
                            )}
                          </div>
                        )}

                        {b.category !== 'table' && (
                          <button
                            type="button"
                            onClick={() => setSelectedBEOBooking(b)}
                            className="px-2.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Open Official Banquet Event Order (BEO)"
                          >
                            <span className="material-icons text-xs text-[#C8102E]">fact_check</span>
                            <span>BEO</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedBookingForModal(b)}
                          className="px-2.5 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="View Full Details"
                        >
                          <span className="material-icons text-xs text-blue-600">visibility</span>
                          <span>Details</span>
                        </button>

                        {b.status !== 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b, 'Confirmed')}
                            className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                            title="Confirm Reservation"
                          >
                            <span className="material-icons text-xs">check</span>
                            <span>Confirm</span>
                          </button>
                        )}

                        {b.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b, 'Completed')}
                            className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                            title="Mark as Completed"
                          >
                            <span className="material-icons text-xs">done_all</span>
                            <span>Complete</span>
                          </button>
                        )}

                        {b.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b, 'Cancelled')}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Cancel Reservation"
                          >
                            <span className="material-icons text-sm">close</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete Permanently"
                        >
                          <span className="material-icons text-base">delete_outline</span>
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* VIEW B: HIGH-DENSITY ADMINISTRATIVE DATA TABLE */
            <div className="overflow-x-auto rounded-lg border border-gray-400">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-wider border-b border-gray-300 dark:border-slate-700">
                  <tr>
                    <th className="px-3.5 py-3">Ref Code</th>
                    <th className="px-3.5 py-3">Customer</th>
                    <th className="px-3.5 py-3">Service / Occasion</th>
                    <th className="px-3.5 py-3">Assigned Table</th>
                    <th className="px-3.5 py-3">Date &amp; Time</th>
                    <th className="px-3.5 py-3">Pax &amp; Value</th>
                    <th className="px-3.5 py-3">Status</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-3 whitespace-nowrap font-mono font-black text-[#C8102E]">
                        {b.booking_code}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white text-xs">{b.customer_name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{b.customer_phone}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase border ${b.category === 'hall'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                              : b.category === 'catering'
                                ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                                : 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200'
                            }`}>
                            {b.category}
                          </span>
                          <span>{b.package_name}</span>
                        </div>
                        <div className="text-[10.5px] text-gray-400 truncate max-w-[200px]">{b.event_venue}</div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {b.category === 'table' ? (
                          <div className="relative">
                            {reassignConfirmBookingId === b.id ? (
                              <div className="flex flex-col gap-1 animate-in fade-in duration-150">
                                <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                                  <span className="material-icons text-xs text-amber-600">warning</span>
                                  Has: <strong>{b.table_number}</strong>. Update?
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => { setReassignConfirmBookingId(null); handleOpenAssignTable(b) }}
                                    className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black cursor-pointer hover:bg-emerald-700"
                                  >Yes</button>
                                  <button
                                    type="button"
                                    onClick={() => setReassignConfirmBookingId(null)}
                                    className="px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 text-[10px] font-bold cursor-pointer hover:bg-gray-100"
                                  >No</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (b.table_number) {
                                    setReassignConfirmBookingId(b.id)
                                  } else {
                                    handleOpenAssignTable(b)
                                  }
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                                  b.table_number
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 hover:bg-amber-100'
                                }`}
                                title={b.table_number ? `Currently: ${b.table_number} — Click to reassign` : 'Assign a table'}
                              >
                                <span className="material-icons text-xs">table_restaurant</span>
                                <span>{b.table_number || '+ Assign Table'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-semibold">{b.event_venue || 'Hall Venue'}</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">{formatScheduleDate(b.event_date)}</div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{b.event_time}</div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{b.guest_count} Pax</div>
                        <div className="font-mono font-black text-[#C8102E]">₱{b.total_amount.toLocaleString()}</div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBookingStatus(b, e.target.value)}
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border cursor-pointer ${b.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                              : b.status === 'Completed'
                                ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                                : b.status === 'Cancelled' || b.status === 'Declined'
                                  ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                            }`}
                        >
                          <option value="Pending Review" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">Pending</option>
                          <option value="Confirmed" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">Confirmed</option>
                          <option value="Completed" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">Completed</option>
                          <option value="Cancelled" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForModal(b)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="View Details"
                          >
                            <span className="material-icons text-sm">visibility</span>
                          </button>
                          {b.status !== 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b, 'Confirmed')}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Confirm"
                            >
                              <span className="material-icons text-sm">check_circle</span>
                            </button>
                          )}
                          {b.status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b, 'Completed')}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Complete"
                            >
                              <span className="material-icons text-sm">done_all</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-icons text-sm">delete_outline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMIN BOOKING DETAILS MODAL */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071A3D] rounded-lg max-w-lg w-full shadow-2xl border border-gray-400 dark:border-slate-500 text-[#071A3D] dark:text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-300 dark:border-slate-700 flex items-center justify-between bg-gray-50/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-[#C8102E] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-md">
                  {selectedBookingForModal.booking_code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${selectedBookingForModal.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    : selectedBookingForModal.status === 'Completed'
                      ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                      : selectedBookingForModal.status === 'Cancelled'
                        ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200'
                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  }`}>
                  {selectedBookingForModal.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForModal(null)}
                className="w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300"
                title="Close"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              {/* Customer Contact */}
              <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Customer Information</span>
                <div className="text-sm font-black text-gray-900 dark:text-white">{selectedBookingForModal.customer_name}</div>
                <div className="text-gray-600 dark:text-gray-300 font-mono flex items-center gap-1.5 pt-0.5">
                  <span className="material-icons text-xs text-gray-400">phone</span>
                  <a href={`tel:${selectedBookingForModal.customer_phone}`} className="hover:underline font-bold">
                    {selectedBookingForModal.customer_phone}
                  </a>
                </div>
                {selectedBookingForModal.customer_email && (
                  <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="material-icons text-xs text-gray-400">email</span>
                    <a href={`mailto:${selectedBookingForModal.customer_email}`} className="hover:underline">
                      {selectedBookingForModal.customer_email}
                    </a>
                  </div>
                )}
              </div>

              {/* Event & Schedule */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Schedule</span>
                  <div className="font-bold text-gray-900 dark:text-white">{selectedBookingForModal.event_date}</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedBookingForModal.event_time}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Guest Count</span>
                  <div className="font-bold text-gray-900 dark:text-white">{selectedBookingForModal.guest_count} Pax</div>
                  <div className="font-black text-[#C8102E] font-mono">₱{selectedBookingForModal.total_amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Venue / Location */}
              <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Service &amp; Venue</span>
                <div className="font-bold text-gray-900 dark:text-white">{selectedBookingForModal.package_name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-[11px]">{selectedBookingForModal.event_venue}</div>
              </div>

              {/* Dining Table Assignment Details */}
              {selectedBookingForModal.category === 'table' && (
                <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-icons text-base">table_restaurant</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block">
                        Assigned Dining Table
                      </span>
                      <span className="font-extrabold text-sm text-[#071A3D] dark:text-white">
                        {selectedBookingForModal.table_number || 'No Table Assigned (Auto on Arrival)'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBookingForModal
                      setSelectedBookingForModal(null)
                      handleOpenAssignTable(b)
                    }}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span className="material-icons text-xs">edit</span>
                    <span>{selectedBookingForModal.table_number ? 'Change Table' : 'Assign Table'}</span>
                  </button>
                </div>
              )}

              {/* Special Requests */}
              {selectedBookingForModal.special_requests && (
                <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Special Requests / Notes</span>
                  <p className="italic font-medium">"{selectedBookingForModal.special_requests}"</p>
                </div>
              )}

              {/* Dishes (Catering) */}
              {selectedBookingForModal.selected_dishes && (
                <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-1 text-[11px]">
                  <span className="font-black text-gray-500 dark:text-gray-400 uppercase text-[9px] tracking-wider block">Food Production List</span>
                  {selectedBookingForModal.selected_dishes.by_category ? (
                    Object.entries(selectedBookingForModal.selected_dishes.by_category).map(([catKey, dishArr]) => {
                      if (!Array.isArray(dishArr) || dishArr.length === 0) return null
                      return (
                        <div key={catKey}>
                          <strong className="text-gray-800 dark:text-gray-200 capitalize">{catKey.replace(/_/g, ' ')}:</strong> {dishArr.join(', ')}
                        </div>
                      )
                    })
                  ) : (
                    <>
                      {selectedBookingForModal.selected_dishes.mains && selectedBookingForModal.selected_dishes.mains.length > 0 && (
                        <div><strong className="text-gray-800 dark:text-gray-200">Mains:</strong> {selectedBookingForModal.selected_dishes.mains.join(', ')}</div>
                      )}
                      {selectedBookingForModal.selected_dishes.sides && selectedBookingForModal.selected_dishes.sides.length > 0 && (
                        <div><strong className="text-gray-800 dark:text-gray-200">Sides:</strong> {selectedBookingForModal.selected_dishes.sides.join(', ')}</div>
                      )}
                      {selectedBookingForModal.selected_dishes.desserts && selectedBookingForModal.selected_dishes.desserts.length > 0 && (
                        <div><strong className="text-gray-800 dark:text-gray-200">Desserts:</strong> {selectedBookingForModal.selected_dishes.desserts.join(', ')}</div>
                      )}
                      {selectedBookingForModal.selected_dishes.beverages && selectedBookingForModal.selected_dishes.beverages.length > 0 && (
                        <div><strong className="text-gray-800 dark:text-gray-200">Beverages:</strong> {selectedBookingForModal.selected_dishes.beverages.join(', ')}</div>
                      )}
                    </>
                  )}
                  {selectedBookingForModal.selected_dishes.rice && (
                    <div><strong className="text-gray-800 dark:text-gray-200">Rice:</strong> Steamed Rice</div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleDeleteBooking(selectedBookingForModal)
                  setSelectedBookingForModal(null)
                }}
                className="px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <span className="material-icons text-xs">delete</span>
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-1.5">
                {selectedBookingForModal.category === 'table' && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBookingForModal
                      setSelectedBookingForModal(null)
                      handleOpenAssignTable(b)
                    }}
                    className="px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-icons text-sm">table_restaurant</span>
                    <span>{selectedBookingForModal.table_number ? `🪑 ${selectedBookingForModal.table_number}` : 'Assign Table'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setQrPassForAdmin({
                    reservation_code: selectedBookingForModal.booking_code,
                    id: selectedBookingForModal.booking_code,
                    contact_name: selectedBookingForModal.customer_name,
                    contact_phone: selectedBookingForModal.customer_phone,
                    event_date: selectedBookingForModal.event_date,
                    event_time: selectedBookingForModal.event_time,
                    guest_count: selectedBookingForModal.guests,
                    hall_name: selectedBookingForModal.hall_name || selectedBookingForModal.package_name,
                    status: selectedBookingForModal.status,
                    table_number: selectedBookingForModal.table_number
                  })}
                  className="px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-[#C8102E] border border-red-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span className="material-icons text-sm">qr_code_2</span>
                  <span>View QR Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(null)}
                  className="px-3.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>

                {selectedBookingForModal.status !== 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateBookingStatus(selectedBookingForModal, 'Confirmed')
                      setSelectedBookingForModal(null)
                    }}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-icons text-xs">verified</span>
                    <span>Confirm &amp; Send QR Pass</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED TABLE NUMBER ASSIGNMENT MODAL */}
      {tableAssignModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071A3D] rounded-xl max-w-2xl w-full shadow-2xl border border-gray-400 dark:border-slate-600 text-[#071A3D] dark:text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isJustConfirmedModal
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-50/80 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  isJustConfirmedModal
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}>
                  <span className="material-icons text-xl">{isJustConfirmedModal ? 'check_circle' : 'table_restaurant'}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] dark:text-white flex items-center gap-2">
                    {isJustConfirmedModal ? 'Reservation Confirmed! Assign Table' : 'Assign Table Number'}
                    {isJustConfirmedModal && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 uppercase tracking-wider font-extrabold border border-emerald-300 dark:border-emerald-700">
                        Confirmed
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isJustConfirmedModal
                      ? <>Reservation is confirmed! Select a dining table now for <strong>{tableAssignModalBooking.customer_name}</strong> (#{tableAssignModalBooking.booking_code})</>
                      : <>Assign a specific dining table for <strong>{tableAssignModalBooking.customer_name}</strong> (#{tableAssignModalBooking.booking_code})</>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTableAssignModalBooking(null)
                  setIsJustConfirmedModal(false)
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Diner Details Strip */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Party Size</span>
                  <span className="font-extrabold text-[#071A3D] dark:text-white">{tableAssignModalBooking.guest_count} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Date</span>
                  <span className="font-extrabold text-[#071A3D] dark:text-white">{tableAssignModalBooking.event_date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Time Slot</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{tableAssignModalBooking.event_time}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Current Status</span>
                  <span className="font-extrabold text-[#C8102E]">{tableAssignModalBooking.status}</span>
                </div>
              </div>

              {/* Table Selection Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#071A3D] dark:text-white">
                    Select Available Table:
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Tables for {tableAssignModalBooking.event_date} ({tableAssignModalBooking.event_time})
                  </span>
                </div>

                {(() => {
                  const occupied = getOccupiedTables(
                    tableAssignModalBooking.event_date,
                    tableAssignModalBooking.event_time,
                    tableAssignModalBooking.id
                  )
                  const occupiedMap = new Map(occupied.map(o => [o.table.toLowerCase(), o.customer]))

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {standardTablesList.map((tbl) => {
                        const isOccupied = occupiedMap.has(tbl.id.toLowerCase())
                        const isSelected = assigningTableNumber.toLowerCase() === tbl.id.toLowerCase() && !customTableInput

                        return (
                          <div
                            key={tbl.id}
                            onClick={() => {
                              if (!isOccupied) {
                                setAssigningTableNumber(tbl.id)
                                setCustomTableInput('')
                              }
                            }}
                            className={`p-3 rounded-xl border transition flex flex-col justify-between select-none cursor-pointer ${
                              isSelected
                                ? 'border-[#C8102E] bg-red-50/70 dark:bg-red-950/40 ring-2 ring-[#C8102E] shadow-sm'
                                : isOccupied
                                  ? 'border-gray-200 dark:border-slate-800 bg-gray-100/70 dark:bg-slate-900/40 opacity-50 cursor-not-allowed'
                                  : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-400 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-black text-xs text-[#071A3D] dark:text-white flex items-center gap-1">
                                <span className="material-icons text-sm text-[#C8102E]">table_restaurant</span>
                                <span>{tbl.label}</span>
                              </span>
                              {isSelected && (
                                <span className="material-icons text-sm text-[#C8102E] font-black">check_circle</span>
                              )}
                            </div>

                            <div className="pt-2 text-[10.5px] space-y-0.5">
                              <div className="text-gray-500 dark:text-gray-400 font-bold">{tbl.capacity}</div>
                              <div className="text-[9.5px] text-gray-400 dark:text-gray-500 uppercase font-semibold">{tbl.type}</div>
                              {isOccupied && (
                                <div className="text-[9.5px] text-red-600 dark:text-red-400 font-bold truncate">
                                  Occupied: {occupiedMap.get(tbl.id.toLowerCase())}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Custom / Other Table Input */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Or specify a Custom Table / Seating Area:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. VIP Booth 3, Terrace Table 14, Merged Tables 1+2..."
                    value={customTableInput}
                    onChange={(e) => {
                      setCustomTableInput(e.target.value)
                      if (e.target.value) setAssigningTableNumber('')
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                  />
                  {customTableInput && (
                    <button
                      type="button"
                      onClick={() => setCustomTableInput('')}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60 flex items-center justify-between">
              {tableAssignModalBooking.table_number ? (
                <button
                  type="button"
                  disabled={isAssigningTable}
                  onClick={async () => {
                    setAssigningTableNumber('')
                    setCustomTableInput('')
                    setIsAssigningTable(true)
                    try {
                      await api.reservations.assignTable(tableAssignModalBooking.raw_id, null)
                      showToast('Table assignment removed.', 'info')
                      await fetchAllBookings()
                      setTableAssignModalBooking(null)
                      setIsJustConfirmedModal(false)
                    } catch (e) {
                      showToast('Could not unassign table.', 'error')
                    } finally {
                      setIsAssigningTable(false)
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                >
                  Remove Table Assignment
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTableAssignModalBooking(null)
                    setIsJustConfirmedModal(false)
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  {isJustConfirmedModal ? 'Skip for Now' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isAssigningTable || (!assigningTableNumber && !customTableInput.trim())}
                  onClick={handleSaveTableAssignment}
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 uppercase tracking-wider"
                >
                  {isAssigningTable ? (
                    <span>Assigning...</span>
                  ) : (
                    <>
                      <span className="material-icons text-sm">check</span>
                      <span>Assign Table</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABILITY, TIME SLOTS & CAPACITY SETTINGS MODAL */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#071A3D] rounded-lg max-w-xl w-full shadow-2xl border border-gray-400 dark:border-slate-500 text-[#071A3D] dark:text-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-300 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-[#071A3D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-[#C8102E] flex items-center justify-center shrink-0">
                  <span className="material-icons text-lg">tune</span>
                </div>
                <div>
                  <h3 className="text-base font-black font-['Russo_One'] uppercase tracking-tight">
                    Reservation Configuration
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Manage reservation time slots, guest capacities, and blackout closures.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-700"
                title="Close"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            {/* Modal Tab Underlines */}
            <div className="flex border-b border-gray-300 dark:border-slate-700 px-5 shrink-0 bg-white dark:bg-[#071A3D]">
              <button
                type="button"
                onClick={() => setSettingsActiveTab('slots')}
                className={`py-2.5 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${settingsActiveTab === 'slots'
                  ? 'border-[#C8102E] text-[#C8102E] font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-sm">schedule</span>
                <span>Time Slots ({activeTimeSlotsCount}/{reservationSettings.time_slots?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveTab('capacity')}
                className={`py-2.5 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${settingsActiveTab === 'capacity'
                  ? 'border-[#C8102E] text-[#C8102E] font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-sm">groups</span>
                <span>Capacities &amp; Shifts</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveTab('blackouts')}
                className={`py-2.5 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${settingsActiveTab === 'blackouts'
                  ? 'border-[#C8102E] text-[#C8102E] font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-sm">event_busy</span>
                <span>Blackouts ({reservationSettings.blocked_dates?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[58vh]">

              {/* TAB 1: TIME SLOTS MANAGER */}
              {settingsActiveTab === 'slots' && (
                <div className="space-y-3.5">

                  {/* Top Add & Presets Bar */}
                  <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-2.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[11px] font-black text-gray-700 dark:text-gray-200 flex items-center gap-1">
                        <span className="material-icons text-sm text-[#C8102E]">add_circle_outline</span>
                        <span>Add New Time Slot</span>
                      </span>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-semibold mr-0.5">Presets:</span>
                        <button
                          type="button"
                          onClick={handleResetDefaultSlots}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:text-[#C8102E] hover:border-red-400 transition cursor-pointer shadow-2xs"
                        >
                          6-Slot Standard
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateHourlySlots}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:text-[#C8102E] hover:border-red-400 transition cursor-pointer shadow-2xs"
                        >
                          Hourly (9 AM – 9 PM)
                        </button>
                      </div>
                    </div>

                    {/* Inline Add Input Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5">
                      <div className="relative flex-1 w-full">
                        <span className="material-icons absolute left-2.5 top-2 text-gray-400 text-sm">schedule</span>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 AM, 01:30 PM"
                          value={newSlotTime}
                          onChange={(e) => setNewSlotTime(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs font-bold focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>

                      <select
                        value={newSlotPeriod}
                        onChange={(e) => setNewSlotPeriod(e.target.value)}
                        className="w-full sm:w-36 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs font-bold focus:outline-none focus:border-[#C8102E]"
                      >
                        <option value="Lunch">☀️ Lunch</option>
                        <option value="Dinner">🌙 Dinner</option>
                        <option value="Morning">🌅 Morning</option>
                        <option value="Afternoon">🌇 Afternoon</option>
                        <option value="Custom">✨ Custom</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleAddNewSlot}
                        className="w-full sm:w-auto px-4 py-1.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs rounded-md cursor-pointer transition shadow-2xs flex items-center justify-center gap-1 shrink-0 active:scale-95 border border-red-700"
                      >
                        <span className="material-icons text-sm">add</span>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Configured Slots Header */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Active Customer Timeslots ({reservationSettings.time_slots?.length || 0})
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Click to toggle on/off
                    </span>
                  </div>

                  {/* Configured Slots Grid (2 Columns, Standard Clean Borders) */}
                  {(!reservationSettings.time_slots || reservationSettings.time_slots.length === 0) ? (
                    <div className="p-6 text-center border border-dashed border-gray-300 dark:border-slate-700 rounded-md text-gray-400 dark:text-slate-500 space-y-1">
                      <span className="material-icons text-3xl block">schedule</span>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No Time Slots Configured</p>
                      <p className="text-[10px] text-gray-400">Add a custom time slot above or click a preset (6-Slot Standard or Hourly) to quickly populate.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1 max-h-[290px] overflow-y-auto pr-1">
                      {reservationSettings.time_slots.map((slot, idx) => {
                        const isEnabled = slot.enabled !== false
                        const isLunch = slot.period === 'Lunch'
                        const isDinner = slot.period === 'Dinner'
                        const isMorning = slot.period === 'Morning'

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-md border transition-all flex items-center justify-between gap-2 select-none ${isEnabled
                              ? 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 shadow-2xs hover:border-gray-400'
                              : 'bg-gray-50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800 opacity-60'
                              }`}
                          >
                            <div
                              onClick={() => handleToggleSlotEnabled(idx)}
                              className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                            >
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 transition-colors ${isEnabled
                                  ? 'bg-emerald-500 text-white shadow-2xs'
                                  : 'bg-gray-200 dark:bg-slate-800 text-gray-400 border border-gray-300'
                                  }`}
                              >
                                <span className="material-icons text-[11px]">{isEnabled ? 'check' : 'close'}</span>
                              </div>

                              <div className="min-w-0 flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs block leading-tight truncate ${isEnabled ? 'text-[#071A3D] dark:text-white' : 'text-gray-400 line-through'}`}>
                                  {slot.time}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${isLunch
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/40'
                                  : isDinner
                                    ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/40'
                                    : isMorning
                                      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/40'
                                      : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300'
                                  }`}>
                                  {slot.period || 'General'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(idx)}
                              className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center justify-center transition cursor-pointer shrink-0"
                              title="Remove Slot"
                            >
                              <span className="material-icons text-xs">delete</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: CAPACITY LIMITS */}
              {settingsActiveTab === 'capacity' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-gray-700 dark:text-gray-200">
                        <span className="material-icons text-sm text-blue-600">groups</span>
                        <span>Max Guests / Timeslot</span>
                      </div>
                      <input
                        type="number"
                        value={reservationSettings.max_guests_per_slot}
                        onChange={(e) => setReservationSettings(p => ({ ...p, max_guests_per_slot: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                      />
                      <p className="text-[10px] text-gray-400">Seating limit per slot.</p>
                    </div>

                    <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-gray-700 dark:text-gray-200">
                        <span className="material-icons text-sm text-amber-600">table_restaurant</span>
                        <span>Max Dining Tables</span>
                      </div>
                      <input
                        type="number"
                        value={reservationSettings.max_tables}
                        onChange={(e) => setReservationSettings(p => ({ ...p, max_tables: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                      />
                      <p className="text-[10px] text-gray-400">Total physical tables.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-2 shadow-2xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 block">
                      Shift Service Availability
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReservationSettings(p => ({ ...p, lunch_slot_open: p.lunch_slot_open ? 0 : 1 }))}
                        className={`p-2.5 rounded-md border text-left flex items-center justify-between transition cursor-pointer ${reservationSettings.lunch_slot_open
                          ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 shadow-2xs'
                          : 'bg-gray-100 dark:bg-slate-950/60 border-gray-300 dark:border-slate-800 opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <span className="material-icons text-xs">wb_sunny</span>
                          </span>
                          <div>
                            <span className="font-extrabold text-xs block text-[#071A3D] dark:text-white">Lunch Shift</span>
                            <span className="text-[9.5px] text-gray-400">11 AM – 3 PM</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${reservationSettings.lunch_slot_open
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-gray-200 text-gray-600 border-gray-300'
                          }`}>
                          {reservationSettings.lunch_slot_open ? 'Open' : 'Closed'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReservationSettings(p => ({ ...p, dinner_slot_open: p.dinner_slot_open ? 0 : 1 }))}
                        className={`p-2.5 rounded-md border text-left flex items-center justify-between transition cursor-pointer ${reservationSettings.dinner_slot_open
                          ? 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700 shadow-2xs'
                          : 'bg-gray-100 dark:bg-slate-950/60 border-gray-300 dark:border-slate-800 opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 border border-purple-200 flex items-center justify-center">
                            <span className="material-icons text-xs">bedtime</span>
                          </span>
                          <div>
                            <span className="font-extrabold text-xs block text-[#071A3D] dark:text-white">Dinner Shift</span>
                            <span className="text-[9.5px] text-gray-400">5 PM – 10 PM</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${reservationSettings.dinner_slot_open
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-gray-200 text-gray-600 border-gray-300'
                          }`}>
                          {reservationSettings.dinner_slot_open ? 'Open' : 'Closed'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BLACKOUT DATES */}
              {settingsActiveTab === 'blackouts' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <label className="block text-xs font-black text-gray-700 dark:text-gray-200">
                      Add Blackout Closure Date
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={newBlockoutDate}
                        onChange={(e) => setNewBlockoutDate(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs font-bold focus:outline-none focus:border-[#C8102E]"
                      />
                      <button
                        type="button"
                        onClick={handleAddBlockoutDate}
                        className="px-4 py-1.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs rounded-md cursor-pointer transition shadow-2xs flex items-center gap-1 active:scale-95 border border-red-700"
                      >
                        <span className="material-icons text-sm">add</span>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                      Currently Blocked Dates ({reservationSettings.blocked_dates?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-gray-50 dark:bg-slate-900/80 rounded-md border border-gray-300 dark:border-slate-700">
                      {(reservationSettings.blocked_dates || []).map((dateStr) => (
                        <span
                          key={dateStr}
                          className="bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-red-200 dark:border-red-900/50 shadow-2xs"
                        >
                          <span className="material-icons text-xs text-red-500">event_busy</span>
                          <span>{dateStr}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlockoutDate(dateStr)}
                            className="hover:bg-red-200 dark:hover:bg-red-900 w-3.5 h-3.5 rounded flex items-center justify-center font-black cursor-pointer text-xs ml-0.5"
                            title="Remove date"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(!reservationSettings.blocked_dates || reservationSettings.blocked_dates.length === 0) && (
                        <span className="text-gray-400 italic text-xs py-1">No blackout dates configured. All dates open.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-300 dark:border-slate-700 bg-white dark:bg-[#071A3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <span className="text-[10.5px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                <span className="material-icons text-xs text-emerald-600">sync</span>
                <span>Synchronizes with customer booking pages.</span>
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvailabilitySettings}
                  className="px-5 py-1.5 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs cursor-pointer transition shadow-2xs active:scale-95 flex items-center gap-1 border border-red-700"
                >
                  <span className="material-icons text-sm">check</span>
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REUSABLE CONFIRMATION MODAL FOR DELETIONS */}
      <ConfirmationModal
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={handleConfirmDeleteBooking}
        title={`Delete ${bookingToDelete?.booking_code}?`}
        message={`Are you sure you want to delete the reservation for "${bookingToDelete?.customer_name}" scheduled on ${bookingToDelete?.event_date} (${bookingToDelete?.event_time})? This action cannot be undone.`}
        confirmText="Yes, Delete Reservation"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingBooking}
      />

      {/* Admin QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        staffUser={{ name: 'Admin Operations' }}
        onCheckInSuccess={() => fetchAllBookings()}
        isDarkMode={false}
      />

      {/* Admin QR Pass View Modal */}
      {qrPassForAdmin && (
        <ReservationQRPass
          reservation={qrPassForAdmin}
          onClose={() => setQrPassForAdmin(null)}
          isDarkMode={false}
        />
      )}

      {/* CREATE EVENT FOR CUSTOMER MODAL */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#071A3D] rounded-2xl shadow-2xl border border-gray-300 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-red-50/80 to-white dark:from-[#1C2541] dark:to-[#071A3D]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#C8102E] text-white flex items-center justify-center shadow-xs">
                  <span className="material-icons text-xl">celebration</span>
                </span>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] dark:text-white leading-tight">
                    Create Event &amp; Booking for Customer
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Saves to the reservation system and immediately shows in the customer's portal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateEventModalOpen(false)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateEventBooking} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Section 1: Customer Profile */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase text-[#C8102E] tracking-wider block">
                  1. Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={eventForm.customer_name}
                      onChange={(e) => setEventForm({ ...eventForm, customer_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="customer@gmail.com"
                      value={eventForm.customer_email}
                      onChange={(e) => setEventForm({ ...eventForm, customer_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="0917-555-0199"
                      value={eventForm.customer_phone}
                      onChange={(e) => setEventForm({ ...eventForm, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Event Details */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase text-[#C8102E] tracking-wider block">
                  2. Event Setup &amp; Service Type
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
                  {[
                    { id: 'table', label: 'Dining Table', icon: 'table_restaurant' },
                    { id: 'hall', label: 'Function Hall', icon: 'domain' },
                    { id: 'catering', label: 'Catering Service', icon: 'room_service' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEventForm(prev => ({
                        ...prev,
                        category: cat.id,
                        total_amount: cat.id === 'table' ? '0' : prev.total_amount,
                        guest_count: cat.id === 'table' ? 4 : (prev.guest_count || 50),
                        hall_name: cat.id === 'table' ? 'Main Dining Area (Auto-Assigned Table)' : prev.hall_name,
                        package_name: cat.id === 'table' ? 'Dining Table Reservation' : prev.package_name
                      }))}
                      className={`p-2 rounded-lg border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        eventForm.category === cat.id
                          ? 'border-[#C8102E] bg-red-50 dark:bg-red-950/40 text-[#C8102E]'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <span className="material-icons text-sm">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Event Title / Occasion *</label>
                    <input
                      type="text"
                      required
                      placeholder={eventForm.category === 'table' ? 'e.g. Birthday Dinner, Casual Dining' : 'e.g. Santos Golden 50th Wedding Anniversary'}
                      value={eventForm.event_name}
                      onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Occasion Type / Theme</label>
                    <select
                      value={eventForm.event_type}
                      onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    >
                      <option value="Casual Dining / Normal">Casual Dining / Normal</option>
                      <option value="Birthday Celebration">Birthday Celebration</option>
                      <option value="Wedding / Gala">Wedding / Gala</option>
                      <option value="Anniversary Gala">Anniversary Gala</option>
                      <option value="Romantic Date">Romantic Date</option>
                      <option value="Family Gathering">Family Gathering</option>
                      <option value="Corporate Seminar">Corporate Seminar / Meeting</option>
                      <option value="Debut / Milestone Party">Debut / Milestone Party</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Venue / Function Hall</label>
                    <select
                      value={eventForm.hall_name}
                      onChange={(e) => {
                        const selectedHallName = e.target.value
                        const foundHall = availableHalls.find(h => h.hall_name === selectedHallName)
                        setEventForm(prev => ({
                          ...prev,
                          hall_name: selectedHallName,
                          venue_address: foundHall?.location || prev.venue_address,
                          guest_count: foundHall?.capacity ? Math.min(parseInt(prev.guest_count, 10) || 50, foundHall.capacity) : prev.guest_count
                        }))
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                    >
                      <option value="">-- Select Function Hall / Venue --</option>
                      {availableHalls.map((h) => (
                        <option key={h.hall_id || h.id} value={h.hall_name}>
                          {h.hall_name} {h.capacity ? `(${h.capacity} Pax)` : ''} {h.hourly_rate ? `• ₱${parseFloat(h.hourly_rate).toLocaleString()}/hr` : ''}
                        </option>
                      ))}
                      <option value="Jo's Diner Main Dining Area">Jo's Diner Main Dining Area</option>
                      <option value="Off-site Customer Venue (Catering Only)">Off-site Customer Venue (Catering Only)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold">Catering / Banquet Package</label>
                      <button
                        type="button"
                        onClick={() => setShowMenuRecommendations(!showMenuRecommendations)}
                        className="text-[10.5px] font-black text-[#C8102E] hover:underline cursor-pointer flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50"
                      >
                        <span className="material-icons text-xs">auto_awesome</span>
                        <span>{showMenuRecommendations ? 'Hide Menu Ideas' : 'Recommend Menu'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        list="catering-packages-list"
                        placeholder="Select or enter package name..."
                        value={eventForm.package_name}
                        onChange={(e) => {
                          const val = e.target.value
                          const foundPkg = availablePackages.find(p => (p.package_name || p.name) === val)
                          if (foundPkg) {
                            const guestCount = parseInt(eventForm.guest_count, 10) || foundPkg.min_guests || 30
                            const rate = foundPkg.price_per_person || (foundPkg.package_price ? foundPkg.package_price / (foundPkg.min_guests || 30) : 500)
                            setEventForm(prev => ({
                              ...prev,
                              package_name: foundPkg.package_name || foundPkg.name,
                              total_amount: foundPkg.package_price || (rate * guestCount)
                            }))
                          } else {
                            setEventForm(prev => ({ ...prev, package_name: val }))
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                      />
                      <datalist id="catering-packages-list">
                        {availablePackages.map((pkg) => (
                          <option key={pkg.package_id || pkg.id} value={pkg.package_name || pkg.name}>
                            {pkg.package_price ? `₱${parseFloat(pkg.package_price).toLocaleString()}` : ''} ({pkg.min_guests || 20}-{pkg.max_guests || 100} Pax)
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Event-Based Menu Recommendation Panel */}
                {showMenuRecommendations && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                    <EventBasedMenuRecommendation
                      eventType={eventForm.event_type}
                      guestCount={parseInt(eventForm.guest_count, 10) || 50}
                      budget={parseFloat(eventForm.total_amount) || 35000}
                      compact={true}
                      allowCategorySwitch={true}
                      showHeader={true}
                      onSelectPackage={(pkg) => {
                        setEventForm(prev => ({
                          ...prev,
                          package_name: pkg.name,
                          event_type: pkg.eventType || prev.event_type,
                          guest_count: pkg.guestCount || prev.guest_count,
                          total_amount: pkg.totalAmount || (pkg.pricePerHead * (pkg.guestCount || prev.guest_count)),
                          special_requests: prev.special_requests
                            ? `${prev.special_requests} | Inclusions: ${pkg.inclusionsText}`
                            : `Menu Inclusions: ${pkg.inclusionsText}`
                        }))
                        showToast(`Applied "${pkg.name}" to event form!`, 'success')
                        setShowMenuRecommendations(false)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Schedule, Guest Count & Budget */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase text-[#C8102E] tracking-wider block">
                  3. Schedule &amp; Cost Estimation
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Event Time</label>
                    <input
                      type="text"
                      placeholder="11:00 AM - 03:00 PM"
                      value={eventForm.event_time}
                      onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Guest Capacity (Pax)</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.guest_count}
                      onChange={(e) => setEventForm({ ...eventForm, guest_count: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Total Amount (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={eventForm.total_amount}
                      onChange={(e) => setEventForm({ ...eventForm, total_amount: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-[#C8102E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold mb-1">Booking Status</label>
                    <select
                      value={eventForm.status}
                      onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Confirmed">Confirmed (Immediately Active)</option>
                      <option value="Pending">Pending Customer Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Special Inclusions / Setup Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Includes stage lighting, projector, extra buffet line"
                      value={eventForm.special_requests}
                      onChange={(e) => setEventForm({ ...eventForm, special_requests: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-6 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-extrabold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border border-red-700"
                >
                  {isSubmittingEvent ? (
                    <span>Creating Event...</span>
                  ) : (
                    <>
                      <span className="material-icons text-sm">done_all</span>
                      <span>Save &amp; Publish Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Banquet Event Order (BEO) Modal */}
      {selectedBEOBooking && (
        <BanquetEventOrderModal
          isOpen={Boolean(selectedBEOBooking)}
          onClose={() => setSelectedBEOBooking(null)}
          booking={selectedBEOBooking}
          isDarkMode={false}
        />
      )}
    </div>
  )
}

export default Reservations
