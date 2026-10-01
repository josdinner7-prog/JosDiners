import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import reviewReservationIcon from '../../assets/ReviewReservation_icon.png'
import confirmReservationIcon from '../../assets/ConfirmReservation_icon.png'
import gcashIcon from '../../assets/Gcash_icon.png'
import mayaIcon from '../../assets/Maya_icon.png'
import counterPaymentIcon from '../../assets/CounterPayment_icon.png'
import bankTransferIcon from '../../assets/BankTransfer_icon.png'
import paymongoLogo from '../../assets/paymongo_logo.png'
import { QRCodeSVG } from 'qrcode.react'
import logo from '../../assets/logo.png'
import ReservationQRPass from '../../components/ReservationQRPass'
import EventBasedMenuRecommendation from '../../components/EventBasedMenuRecommendation'

const PAYMENT_INFO = {
  GCash: {
    title: 'GCash Payment',
    icon: gcashIcon,
    color: 'bg-[#005CE6]',
    accountName: "Jo's Diner & Catering Services",
    accountNumber: '0910 379 3664',
    instructions: 'Send downpayment via GCash Express Send or scan QR at counter. Enter your reference number upon payment.',
  },
  Maya: {
    title: 'Maya Wallet',
    icon: mayaIcon,
    color: 'bg-emerald-600',
    accountName: "Jo's Diner Polomolok",
    accountNumber: '0910 379 3664',
    instructions: 'Pay directly via Maya App to our registered mobile number. Enter the Transaction ID upon payment.',
  },
  Bank: {
    title: 'Bank Transfer (BDO / BPI)',
    icon: bankTransferIcon,
    color: 'bg-[#071A3D]',
    accountName: "Jo's Diner Function Hall & Catering",
    accountNumber: 'BDO: 0012-3456-7890 | BPI: 9876-5432-10',
    instructions: 'Transfer deposit to BDO or BPI. Send transfer slip or enter reference code.',
  },
  Cash: {
    title: 'Cash / Pay at Counter',
    icon: counterPaymentIcon,
    color: 'bg-amber-600',
    accountName: "Jo's Diner Cashier Counter",
    accountNumber: 'Over-the-Counter Deposit',
    instructions: 'Settle your deposit or full payment in cash directly at the diner cashier counter within 24 hours to secure your date.',
  },
}

function Reservation(props) {
  const { showToast } = useToast()
  const context = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser

  // 1. Initial State Handling from Navigation (Catering / Function Hall / Table)
  const incomingPackage = location.state?.selectedPackage
  const incomingHall = location.state?.selectedHall ?? props.preselectedHall ?? context.selectedHallForBooking

  const [reservationType, setReservationType] = useState(() => {
    const searchParams = new URLSearchParams(location.search)
    const urlType = searchParams.get('type')
    if (urlType === 'hall' || urlType === 'event') return 'hall'
    if (urlType === 'catering') return 'catering'
    if (urlType === 'table') return 'table'
    if (incomingPackage) return 'catering'
    if (incomingHall) return 'hall'
    if (location.state?.reservationType) return location.state.reservationType
    return 'table'
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const urlType = searchParams.get('type')
    if (urlType === 'hall' || urlType === 'event') setReservationType('hall')
    else if (urlType === 'catering') setReservationType('catering')
    else if (urlType === 'table') setReservationType('table')
  }, [location.search])

  // Real Database Catalogs State
  const [dbHalls, setDbHalls] = useState([])
  const [dbPackages, setDbPackages] = useState([])
  const [dbAddons, setDbAddons] = useState([])
  const [selectedAddonIds, setSelectedAddonIds] = useState([])
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true)

  // Selected Entities
  const [selectedHallId, setSelectedHallId] = useState(incomingHall?.hall_id || incomingHall?.id || '')
  const [selectedPackageId, setSelectedPackageId] = useState(incomingPackage?.package_id || incomingPackage?.id || '')

  // Function Hall Package Option (YES/NO Branch)
  const [includeHallPackage, setIncludeHallPackage] = useState(true)

  // Payment Checkout States
  const [paymentMethod, setPaymentMethod] = useState('GCash')
  const [paymentOption, setPaymentOption] = useState('full') // Direct full payment
  const [paymentReference, setPaymentReference] = useState('')

  // Calendar Date State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => {
    if (location.state?.selectedDate) return new Date(location.state.selectedDate)
    return new Date()
  })
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    if (location.state?.selectedDate) return location.state.selectedDate
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Parse time string helper
  const parseTimeToHour = (timeStr, defaultHour = 18) => {
    if (!timeStr) return String(defaultHour).padStart(2, '0') + ':00'
    if (timeStr.includes(':') && timeStr.length === 5 && !timeStr.toLowerCase().includes('m')) return timeStr
    const match = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i)
    if (!match) return String(defaultHour).padStart(2, '0') + ':00'
    let h = parseInt(match[1], 10)
    const m = match[2] || '00'
    const mer = (match[3] || '').toUpperCase()
    if (mer === 'PM' && h < 12) h += 12
    if (mer === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }

  // Form Fields
  const [timeSlot, setTimeSlot] = useState(() => location.state?.startTime || '07:00 PM')
  const [hallStartTime, setHallStartTime] = useState(() => parseTimeToHour(location.state?.startTime, 18))
  const [hallEndTime, setHallEndTime] = useState(() => parseTimeToHour(location.state?.endTime, 22))
  const [cateringLocationType, setCateringLocationType] = useState('On-site at Jo\'s Diner')
  const [venueType, setVenueType] = useState('diner_function_hall') // 'diner_function_hall' | 'customer_venue'
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState(currentUser?.address || '')
  const [venueCity, setVenueCity] = useState('Polomolok')
  const [venueContactPerson, setVenueContactPerson] = useState(currentUser?.full_name || currentUser?.username || '')
  const [venueContactPhone, setVenueContactPhone] = useState(currentUser?.phone || '')
  const [venueSetupInstructions, setVenueSetupInstructions] = useState('')

  const [guestCount, setGuestCount] = useState(() => {
    if (incomingPackage?.min_guests) return parseInt(incomingPackage.min_guests, 10)
    if (incomingHall?.capacity) return Math.min(50, parseInt(incomingHall.capacity, 10))
    return 4
  })

  const [occasion, setOccasion] = useState(() => {
    if (incomingPackage) return 'Birthday Celebration'
    if (incomingHall) return 'Wedding Reception / Banquet'
    return 'Casual Dining / Normal'
  })
  const [customOccasionText, setCustomOccasionText] = useState('')
  const [isCustomOccasion, setIsCustomOccasion] = useState(false)

  const [eventName, setEventName] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [specialRequest, setSpecialRequest] = useState('')
  const [customerName, setCustomerName] = useState(currentUser?.full_name || currentUser?.username || '')
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '')
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '')
  const [showMenuRecommendationDrawer, setShowMenuRecommendationDrawer] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingReviewReservation, setPendingReviewReservation] = useState(null)
  const [confirmedReservation, setConfirmedReservation] = useState(null)
  const [showQRPassModal, setShowQRPassModal] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [resendEmailSuccess, setResendEmailSuccess] = useState(false)
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false)

  const handleCopyAccountNumber = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedAccountNumber(true)
    if (showToast) showToast('Account number copied to clipboard!', 'success')
    setTimeout(() => setCopiedAccountNumber(false), 2500)
  }

  // Step-by-step navigation state
  const [currentStep, setCurrentStep] = useState(1)

  const handleResendConfirmationEmail = async () => {
    if (!confirmedReservation) return
    const targetEmail = confirmedReservation.email || currentUser?.email
    if (!targetEmail) {
      if (showToast) showToast('No email address found for this reservation.', 'error')
      return
    }

    setIsResendingEmail(true)
    setResendEmailSuccess(false)
    try {
      const res = await api.reservations.sendReservationQREmail({
        code: confirmedReservation.reservation_code || confirmedReservation.id,
        email: targetEmail,
        reservation_id: confirmedReservation.raw_id || confirmedReservation.reservation_id
      })
      if (res && res.status === 'success') {
        setResendEmailSuccess(true)
        if (showToast) showToast(`QR Pass re-sent to ${targetEmail}!`, 'success')
      } else {
        if (showToast) showToast(res?.message || 'Failed to send email.', 'error')
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error sending email', 'error')
    } finally {
      setIsResendingEmail(false)
    }
  }

  // Time conversion helpers
  const format24to12 = (time24) => {
    if (!time24) return '07:00 PM'
    const parts = time24.split(':')
    let h = parseInt(parts[0], 10)
    const m = parts[1] || '00'
    const mer = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${String(h).padStart(2, '0')}:${m} ${mer}`
  }

  const format12to24 = (time12) => {
    if (!time12) return '19:00'
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (!match) return '19:00'
    let h = parseInt(match[1], 10)
    const m = match[2] || '00'
    const mer = (match[3] || '').toUpperCase()
    if (mer === 'PM' && h < 12) h += 12
    if (mer === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }

  // Event Customization Hub States
  const [isCustomizing, setIsCustomizing] = useState(() => {
    return Boolean(incomingPackage || location.state?.reservationType === 'catering' || location.state?.selectedPackage)
  })
  const [activeCustomSubTab, setActiveCustomSubTab] = useState(() => {
    return (incomingPackage || location.state?.reservationType === 'catering' || location.state?.selectedPackage) ? 'menu' : 'design'
  })

  // 1. Theme & Design
  const [selectedDesignTheme, setSelectedDesignTheme] = useState('royal_luxury')
  const [selectedBackdrop, setSelectedBackdrop] = useState('Standard Jo\'s Diner Venue Backdrop')
  const [selectedCenterpiece, setSelectedCenterpiece] = useState('Standard Jo\'s Diner Table Styling')
  const [selectedMotif, setSelectedMotif] = useState('Royal Crimson & Gold (Jo\'s Signature)')
  const [customDesignNotes, setCustomDesignNotes] = useState('')

  // 2. Event Add-ons & Inclusions
  const [selectedEventAddonIds, setSelectedEventAddonIds] = useState([])
  const [userCustomAddons, setUserCustomAddons] = useState([])
  const [newCustomAddonInput, setNewCustomAddonInput] = useState('')

  // 3. Custom Menu & Category Package Selection States
  const [selectedCategoryDishes, setSelectedCategoryDishes] = useState({}) // { [categoryKey]: dishObject[] }
  const [selectedAdditionalDishes, setSelectedAdditionalDishes] = useState([]) // dishObject[]
  const [additionalDishCategory, setAdditionalDishCategory] = useState('all')
  const [additionalDishSearch, setAdditionalDishSearch] = useState('')
  const [selectedMenuDishes, setSelectedMenuDishes] = useState([])
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('all')
  const [menuDietaryNotes, setMenuDietaryNotes] = useState('')
  const [dbMenuItems, setDbMenuItems] = useState([])

  // 4. Layout & Seating
  const [selectedSeatingLayout, setSelectedSeatingLayout] = useState('Round Banquet Tables')
  const [selectedTableArea, setSelectedTableArea] = useState('Main Dining Area')
  const [tableAmbiance, setTableAmbiance] = useState('Standard Festive')

  const [allReservations, setAllReservations] = useState([])
  const [reservationSettings, setReservationSettings] = useState(null)

  // Load Real Catalogs from Database
  useEffect(() => {
    loadCatalogs()
  }, [])

  const loadCatalogs = async () => {
    setIsLoadingCatalogs(true)
    try {
      const [hallsRes, pkgsRes, resRes, settingsRes, addonsRes, menuRes] = await Promise.allSettled([
        api.functionHalls.getHalls(),
        api.catering.getPackages(),
        api.reservations.getReservations(),
        api.reservations.getSettings(),
        api.hallAddons.getAddons(),
        api.menu.getMenuItems()
      ])

      if (hallsRes.status === 'fulfilled' && hallsRes.value?.status === 'success' && Array.isArray(hallsRes.value.halls)) {
        setDbHalls(hallsRes.value.halls)
        if (!selectedHallId && hallsRes.value.halls.length > 0) {
          setSelectedHallId(hallsRes.value.halls[0].hall_id || hallsRes.value.halls[0].id)
        }
      }

      if (pkgsRes.status === 'fulfilled' && pkgsRes.value?.status === 'success' && Array.isArray(pkgsRes.value.packages)) {
        setDbPackages(pkgsRes.value.packages)
        if (!selectedPackageId && pkgsRes.value.packages.length > 0) {
          setSelectedPackageId(pkgsRes.value.packages[0].package_id || pkgsRes.value.packages[0].id)
        }
      }

      if (addonsRes.status === 'fulfilled' && addonsRes.value?.status === 'success' && Array.isArray(addonsRes.value.addons)) {
        setDbAddons(addonsRes.value.addons.filter(a => a.status === 'Available'))
      }

      if (menuRes.status === 'fulfilled' && (menuRes.value?.status === 'success' || Array.isArray(menuRes.value?.items || menuRes.value))) {
        const items = menuRes.value?.items || (Array.isArray(menuRes.value) ? menuRes.value : [])
        setDbMenuItems(items)
      }

      if (resRes.status === 'fulfilled' && (resRes.value?.status === 'success' || resRes.value?.reservations)) {
        const list = resRes.value.reservations || resRes.value.data || []
        setAllReservations(list)
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.status === 'success' && settingsRes.value.settings) {
        setReservationSettings(settingsRes.value.settings)
      }
    } catch (e) {
      console.error('Error loading database catalogs:', e)
    } finally {
      setIsLoadingCatalogs(false)
    }
  }

  // Update customer fields when user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.full_name || currentUser.username) {
        setCustomerName(currentUser.full_name || currentUser.username)
      }
      if (currentUser.email) setCustomerEmail(currentUser.email)
      if (currentUser.phone) setCustomerPhone(currentUser.phone)
      if (currentUser.address && !venueAddress) setVenueAddress(currentUser.address)
    }
  }, [currentUser])

  // Calendar Calculations
  const year = currentCalendarDate.getFullYear()
  const month = currentCalendarDate.getMonth()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1))
  const resetToToday = () => {
    const today = new Date()
    setCurrentCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDateStr(today.toISOString().split('T')[0])
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Active selected Hall & Package details
  const activeHall = dbHalls.find(h => String(h.hall_id || h.id) === String(selectedHallId)) || incomingHall || dbHalls[0]
  const activePackage = dbPackages.find(p => String(p.package_id || p.id) === String(selectedPackageId)) || incomingPackage || dbPackages[0]

  // Get all bookings for a function hall on a specific date (YYYY-MM-DD)
  const getHallBookingsOnDate = (dateStr, hallObj) => {
    if (!hallObj) return []
    const hallId = String(hallObj.hall_id || hallObj.id || '')
    const hallName = (hallObj.name || hallObj.hall_name || '').toLowerCase()

    const localEvents = (() => {
      try {
        const raw = localStorage.getItem('josdiner_customer_events')
        return raw ? JSON.parse(raw) : []
      } catch (e) { return [] }
    })()

    const combined = [...(allReservations || []), ...localEvents]

    const matches = combined.filter(res => {
      if (!res) return false
      const isDeclined = res.status === 'Declined' || res.status === 'Cancelled'
      if (isDeclined) return false

      const resDate = (res.event_date || '').toString().slice(0, 10)
      if (resDate !== dateStr) return false

      const resHallId = String(res.hall_id || '')
      const resHallName = (res.hall_name || '').toLowerCase()
      return (resHallId && resHallId === hallId) || (resHallName && (resHallName === hallName || hallName.includes(resHallName) || resHallName.includes(hallName)))
    })

    const parsedRanges = []
    matches.forEach(m => {
      const t = m.event_time || ''
      const rangeMatch = t.match(/(\d+):(\d+)\s*(AM|PM)?\s*[-–to]+\s*(\d+):(\d+)\s*(AM|PM)?/i)
      if (rangeMatch) {
        let h1 = parseInt(rangeMatch[1], 10)
        const mer1 = (rangeMatch[3] || '').toUpperCase()
        if (mer1 === 'PM' && h1 < 12) h1 += 12
        if (mer1 === 'AM' && h1 === 12) h1 = 0

        let h2 = parseInt(rangeMatch[4], 10)
        const mer2 = (rangeMatch[6] || '').toUpperCase()
        if (mer2 === 'PM' && h2 < 12) h2 += 12
        if (mer2 === 'AM' && h2 === 12) h2 = 0
        if (h2 <= h1) h2 = Math.min(24, h1 + 4)

        parsedRanges.push({ startH: h1, endH: h2, title: m.event_name || m.occasion || 'Booked Event' })
      } else {
        const singleMatch = t.match(/(\d+):(\d+)\s*(AM|PM)?/i)
        if (singleMatch) {
          let h1 = parseInt(singleMatch[1], 10)
          const mer = (singleMatch[3] || '').toUpperCase()
          if (mer === 'PM' && h1 < 12) h1 += 12
          if (mer === 'AM' && h1 === 12) h1 = 0
          parsedRanges.push({ startH: h1, endH: Math.min(24, h1 + 4), title: m.event_name || m.occasion || 'Booked Event' })
        }
      }
    })
    return parsedRanges
  }

  const activeHallBookings = useMemo(() => {
    return getHallBookingsOnDate(selectedDateStr, activeHall)
  }, [selectedDateStr, activeHall, allReservations])

  const isStartHourBooked = (startHour) => {
    return activeHallBookings.some(b => startHour >= b.startH && startHour < b.endH)
  }

  const isSelectedTimeRangeConflicting = () => {
    const sH = parseInt(hallStartTime.split(':')[0], 10)
    const eH = parseInt(hallEndTime.split(':')[0], 10)
    if (isNaN(sH) || isNaN(eH) || eH <= sH) return false
    return activeHallBookings.some(b => Math.max(sH, b.startH) < Math.min(eH, b.endH))
  }

  const hallTimeOptions = [
    { value: '08:00', label: '08:00 AM' },
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '18:00', label: '06:00 PM' },
    { value: '19:00', label: '07:00 PM' },
    { value: '20:00', label: '08:00 PM' },
    { value: '21:00', label: '09:00 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '23:00', label: '11:00 PM' },
  ]

  const formatTimeDisplay = (time24Str) => {
    if (!time24Str) return ''
    const [hStr, mStr] = time24Str.split(':')
    let h = parseInt(hStr, 10)
    const m = mStr || '00'
    const mer = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${mer}`
  }

  const getHallDurationHours = () => {
    const s = parseInt(hallStartTime.split(':')[0], 10)
    const e = parseInt(hallEndTime.split(':')[0], 10)
    return Math.max(1, e - s)
  }

  const isSlotTimePassed = (slotTime, dateStr) => {
    const today = new Date().toISOString().split('T')[0]
    if (dateStr !== today) return false
    const match = slotTime.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (!match) return false
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2] || '0', 10)
    const mer = (match[3] || '').toUpperCase()
    if (mer === 'PM' && h < 12) h += 12
    if (mer === 'AM' && h === 12) h = 0
    const now = new Date()
    const slotDate = new Date()
    slotDate.setHours(h, m, 0, 0)
    return slotDate < now
  }

  const getDayAvailability = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    if (dateStr < todayStr) return { status: 'past', dotColor: 'bg-gray-400 opacity-30', text: 'Past' }
    if (reservationSettings?.blocked_dates?.includes(dateStr) || reservationSettings?.date_overrides?.[dateStr]?.is_blackout) {
      return { status: 'full', dotColor: 'bg-red-500', text: 'Blocked' }
    }
    if (reservationType === 'hall' && activeHall) {
      const bookings = getHallBookingsOnDate(dateStr, activeHall)
      if (bookings.length === 0) return { status: 'available', dotColor: 'bg-emerald-500', text: 'Open All Day' }
      let bookedHours = 0
      bookings.forEach(b => { bookedHours += (b.endH - b.startH) })
      if (bookedHours >= 12) return { status: 'full', dotColor: 'bg-red-500', text: 'Fully Booked' }
      return { status: 'partial', dotColor: 'bg-amber-500', text: `${bookings.length} Booked` }
    }
    return { status: 'available', dotColor: 'bg-emerald-500', text: 'Available' }
  }

  const toggleAddon = (addonId) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    )
  }

  const selectedAddonsList = useMemo(() => {
    return dbAddons.filter(a => selectedAddonIds.includes(a.addon_id))
  }, [dbAddons, selectedAddonIds])

  const addonsTotal = useMemo(() => {
    return selectedAddonsList.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0)
  }, [selectedAddonsList])

  // Custom Themes, Backdrops, Centerpieces & Presets
  const eventDesignThemes = [
    { id: 'royal_luxury', title: 'Royal Luxury Banquet', icon: 'diamond', color: 'from-amber-600 to-yellow-500', desc: 'Regal maroon, metallic gold ribbons, and warm crystal lighting' },
    { id: 'classic_minimalist', title: 'Classic Diner Minimalist', icon: 'deck', color: 'from-red-600 to-rose-500', desc: 'Timeless Jo\'s diner red & crisp white linen styling' },
    { id: 'rustic_garden', title: 'Rustic Garden & Wood', icon: 'park', color: 'from-emerald-700 to-amber-700', desc: 'Natural burlap, green eucalyptus garlands, and fairy lights' },
    { id: 'midnight_glamour', title: 'Midnight Glamour Gala', icon: 'nights_stay', color: 'from-blue-900 to-indigo-950', desc: 'Deep navy, shimmering silver stars, and blue ambiance glow' },
    { id: 'pastel_bloom', title: 'Pastel Floral Bloom', icon: 'local_florist', color: 'from-pink-400 to-purple-400', desc: 'Soft blush pink, baby blue accents, and fresh floral arches' },
    { id: 'corporate_exec', title: 'Corporate Executive', icon: 'business_center', color: 'from-slate-700 to-slate-900', desc: 'Clean formal navy & silver table numbers with spotlight podium' }
  ]

  const backdropOptions = [
    { id: 'Grand Arch with Fairy Lights & Floral Columns', label: 'Grand Floral Arch & Fairy Lights', icon: 'celebration' },
    { id: 'Sequin Shimmer Wall (Gold / Silver)', label: 'Sequin Shimmer Wall with Neon Sign', icon: 'auto_awesome' },
    { id: 'Geometric Wooden Frame with Pampas Grass', label: 'Rustic Wooden Frame with Pampas', icon: 'filter_vintage' },
    { id: 'Classic Velvet Drape Backdrop with Monogram', label: 'Velvet Drapes with Celebrant Monogram', icon: 'curtains' },
    { id: 'Greenery Grass Wall with 3D Logo / Letters', label: 'Lush Botanical Grass Wall', icon: 'yard' },
    { id: 'Standard Jo\'s Diner Venue Backdrop', label: 'Standard Diner Venue Setup', icon: 'storefront' }
  ]

  const centerpieceOptions = [
    { id: 'Tall Crystal Floral Candelabras', label: 'Tall Crystal Floral Candelabras', icon: 'wb_shade' },
    { id: 'Geometric Terrariums & Floating Candles', label: 'Geometric Terrariums & Candles', icon: 'grain' },
    { id: 'Rustic Wood Slices with Mason Jars & Pampas', label: 'Rustic Wood Slices with Mason Jars', icon: 'park' },
    { id: 'Low Lush Fresh Flower Runners', label: 'Low Lush Flower Runners', icon: 'local_florist' },
    { id: 'Minimalist Single Stem Bud Vases & Votives', label: 'Minimalist Single Stem Vases', icon: 'spa' },
    { id: 'Standard Jo\'s Diner Table Styling', label: 'Standard Diner Table Styling', icon: 'table_restaurant' }
  ]

  const presetEventAddons = [
    { id: 'ea_sound_system', name: 'Sound System & Wireless Mics', price: 3500, icon: 'volume_up', category: 'Audio / Visual', desc: 'High-power speakers, mixing console, and 2 wireless handheld mics' },
    { id: 'ea_projector', name: 'Projector & 100-inch Screen', price: 2000, icon: 'videocam', category: 'Audio / Visual', desc: 'Full HD multimedia projector with portable 100-inch tripod screen' },
    { id: 'ea_photobooth', name: 'Photobooth 2-Hours (Unlimited Prints)', price: 4500, icon: 'photo_camera', category: 'Entertainment', desc: 'Customized 4R photo template, high-speed sub-dye printer, fun props & coordinator' },
    { id: 'ea_dessert_buffet', name: 'Dessert & Grazing Buffet Table', price: 6500, icon: 'cake', category: 'Food & Dining', desc: 'Assorted pastries, cupcakes, fresh fruit skewers, brownies, and tiered stands' },
    { id: 'ea_emcee', name: 'Professional Emcee / Event Host', price: 3000, icon: 'mic', category: 'Staff', desc: 'Experienced bilingual host to facilitate games, program schedule, and toasts' },
    { id: 'ea_acoustic', name: 'Acoustic Duo / Live Singer (2 Hours)', price: 5000, icon: 'music_note', category: 'Entertainment', desc: 'Live guitar and vocal performance playing modern and classic hits' },
    { id: 'ea_coffee_bar', name: 'Mobile Coffee Bar Station (50 Cups)', price: 4000, icon: 'local_cafe', category: 'Food & Dining', desc: 'Freshly brewed espresso, iced caramel macchiato, and matcha lattes with barista' },
    { id: 'ea_cake', name: 'Customized Celebrant Cake (2-Tier)', price: 2500, icon: 'cake', category: 'Food & Dining', desc: 'Edible fondant/buttercream 2-tier custom motif design cake' },
    { id: 'ea_lechon_carver', name: 'Dedicated Lechon Carving Station & Chef', price: 1500, icon: 'restaurant', category: 'Service', desc: 'Assistance for customer\'s lechon, chef carving, warm sauces, and serving table' },
    { id: 'ea_unli_drinks', name: 'Unlimited Softdrinks & Chilled Juices (per pax)', price: 85, icon: 'local_drink', category: 'Food & Dining', perPax: true, desc: 'Flowing Coke, Sprite, Royal, and Iced Tea throughout the event' },
    { id: 'ea_red_carpet', name: 'Red Carpet Welcome Entrance & Stanchions', price: 1200, icon: 'star', category: 'Decor', desc: '10-meter plush red carpet runner with gold stanchions and velvet ropes' },
    { id: 'ea_lighting', name: 'Event Mood Lighting & Fog Machine', price: 2500, icon: 'flare', category: 'Audio / Visual', desc: '8 LED RGB par lights with wireless DMX control and low-lying smoke fogger' },
    { id: 'ea_coordinator', name: 'Dedicated On-Day Event Coordinator', price: 3500, icon: 'assignment_ind', category: 'Staff', desc: 'Professional on-the-day supervisor managing suppliers, timeline, and registration' }
  ]

  const quickCustomAddonSuggestions = [
    'Sariling Lechon (Customer to bring)',
    'Sariling Cake (Customer to bring)',
    'External Photobooth Supplier',
    'External Acoustic Band / Instruments',
    'Sariling Wine & Alcoholic Drinks',
    'Custom Souvenirs & Giveaways',
    'Tarpaulin Welcome Banner',
    'Celebrant Costumes & Props'
  ]

  const toggleEventAddon = (addonId) => {
    setSelectedEventAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    )
  }

  const handleAddUserCustomAddon = (textToAdd) => {
    const text = (typeof textToAdd === 'string' ? textToAdd : newCustomAddonInput).trim()
    if (!text) return
    if (!userCustomAddons.includes(text)) {
      setUserCustomAddons(prev => [...prev, text])
    }
    setNewCustomAddonInput('')
  }

  const handleRemoveUserCustomAddon = (textToRemove) => {
    setUserCustomAddons(prev => prev.filter(item => item !== textToRemove))
  }

  const selectedEventAddonsList = useMemo(() => {
    return presetEventAddons.filter(a => selectedEventAddonIds.includes(a.id))
  }, [selectedEventAddonIds])

  const eventAddonsTotal = useMemo(() => {
    return selectedEventAddonsList.reduce((sum, a) => {
      if (a.perPax) {
        return sum + (a.price * Math.max(1, guestCount))
      }
      return sum + a.price
    }, 0)
  }, [selectedEventAddonsList, guestCount])

  const themeMotifOptions = [
    { name: 'Royal Crimson & Gold (Jo\'s Signature)', c1: '#C8102E', c2: '#D4AF37', desc: 'Regal maroon & metallic gold' },
    { name: 'Midnight Navy & Silver', c1: '#0F172A', c2: '#94A3B8', desc: 'Sleek dark blue & silver' },
    { name: 'Emerald Green & Champagne Gold', c1: '#065F46', c2: '#FBBF24', desc: 'Lush botanical & champagne' },
    { name: 'Blush Pink & Rose Gold', c1: '#F43F5E', c2: '#FBCFE8', desc: 'Romantic floral pink & rose gold' },
    { name: 'Rustic Wood & Earth Tones', c1: '#78350F', c2: '#D97706', desc: 'Natural wood, burlap & amber' },
    { name: 'Classic Pearl White & Gold', c1: '#FFFFFF', c2: '#EAB308', desc: 'Pure banquet white & gold' },
    { name: 'Custom Motif Palette', c1: '#6366F1', c2: '#EC4899', desc: 'Specify your own custom color scheme' }
  ]

  const seatingLayoutOptions = [
    { id: 'Round Banquet Tables', title: 'Round Banquet Tables', icon: 'table_restaurant', desc: '8 to 10 guests per round table with centerpiece' },
    { id: 'Long Royal Feast Tables', title: 'Long Royal Feast Tables', icon: 'view_week', desc: 'Continuous grand banquet family tables' },
    { id: 'Cocktail & High-Tops', title: 'Cocktail & High-Tops', icon: 'local_bar', desc: 'Standing high tables for social minglers & mixers' },
    { id: 'Classroom / Seminar Style', title: 'Classroom / Seminar', icon: 'school', desc: 'Front-facing banquet tables with middle aisle' },
    { id: 'Theater Row Seating', title: 'Theater Row Seating', icon: 'theater_comedy', desc: 'Row chairs without tables for maximum guest seating' }
  ]

  const tableAreaOptions = [
    { id: 'Main Dining Area', label: 'Main Dining Center', icon: 'storefront' },
    { id: 'Window Side Seating', label: 'Window Side View', icon: 'window' },
    { id: 'Garden / Patio Area', label: 'Garden / Outdoor Patio', icon: 'yard' },
    { id: 'Quiet Corner Booth', label: 'Quiet Corner Booth', icon: 'chair' }
  ]

  const tableSetupOptions = [
    { id: 'Standard Festive', label: 'Standard Festive Setup', icon: 'celebration' },
    { id: 'Romantic Candlelight', label: 'Romantic Candlelight', icon: 'favorite' },
    { id: 'Business Meeting / Formal', label: 'Business Professional', icon: 'business_center' },
    { id: 'Family Kids Setup', label: 'Family & High Chairs', icon: 'child_friendly' }
  ]

  // Real Package Inclusions Helper (Strictly Database Data)
  const getPackageInclusionsList = (pkg) => {
    if (!pkg) return []
    const inclusions = []

    // 1. Real Category Allowances from database
    let allowances = {}
    if (pkg.category_allowances && typeof pkg.category_allowances === 'object') {
      allowances = pkg.category_allowances
    } else if (pkg.category_allowances_json) {
      try { allowances = JSON.parse(pkg.category_allowances_json) } catch (e) { allowances = {} }
    }

    Object.entries(allowances || {}).forEach(([catKey, count]) => {
      const num = Number(count)
      if (num > 0) {
        const formattedLabel = catKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        inclusions.push(`${num} ${formattedLabel}`)
      }
    })

    // 2. Real Curated Package Dishes from database if set
    let dishes = []
    if (Array.isArray(pkg.package_dishes)) {
      dishes = pkg.package_dishes
    } else if (pkg.package_dishes_json) {
      try { dishes = JSON.parse(pkg.package_dishes_json) } catch (e) { dishes = [] }
    }
    if (dishes.length > 0 && inclusions.length === 0) {
      inclusions.push(`${dishes.length} Curated Dishes Included`)
    }

    // 3. Real Features / Services from database
    let features = []
    if (Array.isArray(pkg.features)) {
      features = pkg.features
    } else if (pkg.features_json) {
      try {
        const parsed = typeof pkg.features_json === 'string' ? JSON.parse(pkg.features_json) : pkg.features_json
        if (Array.isArray(parsed)) features = parsed
      } catch (e) { features = [] }
    }
    features.forEach(feat => {
      if (typeof feat === 'string' && feat.trim()) {
        inclusions.push(feat.trim())
      }
    })

    return inclusions
  }

  // Custom Menu Helpers & Package Dish Allowance Tracking
  const activePackageAllowances = useMemo(() => {
    if (!activePackage) return {}
    let raw = activePackage.category_allowances
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch (e) { raw = {} }
    } else if (!raw && activePackage.category_allowances_json) {
      try { raw = JSON.parse(activePackage.category_allowances_json) } catch (e) { raw = {} }
    }
    if (raw && typeof raw === 'object') {
      const cleaned = {}
      Object.entries(raw).forEach(([k, v]) => {
        if (Number(v) > 0) cleaned[k] = Number(v)
      })
      return cleaned
    }
    return {}
  }, [activePackage])

  const activePackageCuratedDishes = useMemo(() => {
    if (!activePackage) return []
    let dishes = activePackage.package_dishes
    if (typeof dishes === 'string') {
      try { dishes = JSON.parse(dishes) } catch (e) { dishes = [] }
    } else if (!dishes && activePackage.package_dishes_json) {
      try { dishes = JSON.parse(activePackage.package_dishes_json) } catch (e) { dishes = [] }
    }
    return Array.isArray(dishes) ? dishes : []
  }, [activePackage])

  // Package Defined Category Breakdown Structure (Real DB Data Only)
  const packageCategoryStructure = useMemo(() => {
    if (!activePackage) return []

    const allowanceEntries = Object.entries(activePackageAllowances || {}).filter(([_, count]) => Number(count) > 0)
    if (allowanceEntries.length > 0) {
      return allowanceEntries.map(([k, count]) => {
        const formattedLabel = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        let icon = 'restaurant'
        const lowerKey = k.toLowerCase()
        if (lowerKey.includes('side') || lowerKey.includes('rice') || lowerKey.includes('pasta') || lowerKey.includes('salad') || lowerKey.includes('soup') || lowerKey.includes('noodle') || lowerKey.includes('vegetable') || lowerKey.includes('appetizer')) icon = 'ramen_dining'
        else if (lowerKey.includes('dessert') || lowerKey.includes('sweet') || lowerKey.includes('cake') || lowerKey.includes('flan') || lowerKey.includes('ice cream')) icon = 'icecream'
        else if (lowerKey.includes('drink') || lowerKey.includes('beverage') || lowerKey.includes('juice')) icon = 'local_bar'
        return {
          key: k,
          label: formattedLabel,
          required: Number(count) || 1,
          icon
        }
      })
    }

    // If package has curated dishes in DB, group them by their actual DB category
    if (activePackageCuratedDishes.length > 0) {
      const grouped = {}
      activePackageCuratedDishes.forEach(dish => {
        const cat = dish.category || dish.category_name || 'Main Dishes'
        if (!grouped[cat]) grouped[cat] = 0
        grouped[cat] += 1
      })
      return Object.entries(grouped).map(([catName, count]) => ({
        key: catName,
        label: catName,
        required: count,
        icon: 'restaurant'
      }))
    }

    return []
  }, [activePackage, activePackageAllowances, activePackageCuratedDishes])

  // Helper to categorize any dish from menu into matching category key
  const getDishCategoryKey = (dish) => {
    const rawCat = (dish.category || dish.category_name || dish.category_slug || '').toLowerCase().trim()
    const directMatch = packageCategoryStructure.find(c => {
      const cKey = c.key.toLowerCase().trim()
      return cKey === rawCat || rawCat.includes(cKey) || cKey.includes(rawCat)
    })
    if (directMatch) return directMatch.key

    if (rawCat.includes('dessert') || rawCat.includes('cake') || rawCat.includes('sweet') || rawCat.includes('flan') || rawCat.includes('ice cream') || rawCat.includes('pastry')) {
      const dessertCat = packageCategoryStructure.find(c => c.key.toLowerCase().includes('dessert'))
      if (dessertCat) return dessertCat.key
    }
    if (rawCat.includes('side') || rawCat.includes('salad') || rawCat.includes('soup') || rawCat.includes('pasta') || rawCat.includes('noodle') || rawCat.includes('vegetable') || rawCat.includes('appetizer') || rawCat.includes('fries') || rawCat.includes('potato') || rawCat.includes('rice')) {
      const sideCat = packageCategoryStructure.find(c => c.key.toLowerCase().includes('side'))
      if (sideCat) return sideCat.key
    }
    if (rawCat.includes('drink') || rawCat.includes('beverage') || rawCat.includes('juice') || rawCat.includes('tea')) {
      const drinkCat = packageCategoryStructure.find(c => c.key.toLowerCase().includes('drink') || c.key.toLowerCase().includes('beverage'))
      if (drinkCat) return drinkCat.key
    }

    const mainCat = packageCategoryStructure.find(c => c.key.toLowerCase().includes('main'))
    if (mainCat) return mainCat.key

    return packageCategoryStructure[0]?.key || rawCat
  }

  // Pre-populate category dish selection when package is chosen or changed
  useEffect(() => {
    if (activePackage) {
      const newCatDishes = {}
      packageCategoryStructure.forEach(cat => {
        newCatDishes[cat.key] = []
      })

      // Distribute curated dishes into matching categories
      if (activePackageCuratedDishes.length > 0) {
        activePackageCuratedDishes.forEach(dish => {
          const catKey = getDishCategoryKey(dish)
          const targetCat = packageCategoryStructure.find(c => c.key === catKey)
          const maxAllowed = targetCat?.required || 5
          if (!newCatDishes[catKey]) newCatDishes[catKey] = []
          if (newCatDishes[catKey].length < maxAllowed) {
            newCatDishes[catKey].push(dish)
          }
        })
      }

      // If category is not full, pull real dishes from dbMenuItems
      if (dbMenuItems.length > 0 && packageCategoryStructure.length > 0) {
        packageCategoryStructure.forEach(cat => {
          const currentCount = (newCatDishes[cat.key] || []).length
          const needed = cat.required - currentCount
          if (needed > 0) {
            const pool = dbMenuItems.filter(item => {
              const matchedKey = getDishCategoryKey(item)
              const isAlreadyIn = (newCatDishes[cat.key] || []).some(d => (d.item_id || d.id) === (item.item_id || item.id))
              return (matchedKey === cat.key || (item.category && item.category.toLowerCase() === cat.key.toLowerCase())) && !isAlreadyIn
            })
            const fill = pool.slice(0, needed)
            newCatDishes[cat.key] = [...(newCatDishes[cat.key] || []), ...fill]
          }
        })
      }

      setSelectedCategoryDishes(newCatDishes)
      setSelectedAdditionalDishes([])
    }
  }, [selectedPackageId, dbMenuItems.length, activePackageCuratedDishes.length, packageCategoryStructure])

  // Total Allowed Dishes across all package categories
  const totalAllowedDishes = useMemo(() => {
    return packageCategoryStructure.reduce((sum, cat) => sum + (Number(cat.required) || 0), 0)
  }, [packageCategoryStructure])

  // Flat array of all currently selected Included Dishes
  const includedMenuDishes = useMemo(() => {
    const list = []
    Object.values(selectedCategoryDishes || {}).forEach(dishes => {
      if (Array.isArray(dishes)) list.push(...dishes)
    })
    return list
  }, [selectedCategoryDishes])

  // Toggle Included Category Dish Selection in Step 4
  const toggleIncludedCategoryDish = (catKey, dish, maxAllowed) => {
    const dishId = dish.item_id || dish.id || dish.dish_id
    setSelectedCategoryDishes(prev => {
      const currentList = prev[catKey] || []
      const isAlreadySelected = currentList.some(d => (d.item_id || d.id || d.dish_id) === dishId)
      if (isAlreadySelected) {
        return {
          ...prev,
          [catKey]: currentList.filter(d => (d.item_id || d.id || d.dish_id) !== dishId)
        }
      } else {
        if (currentList.length >= maxAllowed) {
          if (showToast) showToast(`You have already selected ${maxAllowed} ${catKey.replace(/_/g, ' ')}. Deselect one to swap.`, 'info')
          return prev
        }
        return {
          ...prev,
          [catKey]: [...currentList, dish]
        }
      }
    })
  }

  // Toggle Additional Extra Dish Selection in Step 5
  const toggleAdditionalDish = (dish) => {
    const dishId = dish.item_id || dish.id || dish.dish_id
    setSelectedAdditionalDishes(prev => {
      const exists = prev.some(d => (d.item_id || d.id || d.dish_id) === dishId)
      if (exists) {
        return prev.filter(d => (d.item_id || d.id || d.dish_id) !== dishId)
      } else {
        return [...prev, dish]
      }
    })
  }

  // Additional Extra Dishes Cost Calculation (Step 5)
  const additionalDishesCost = useMemo(() => {
    if (reservationType !== 'catering' && !(reservationType === 'hall' && includeHallPackage)) return 0
    return selectedAdditionalDishes.reduce((sum, dish) => {
      const price = parseFloat(dish.price || dish.dish_price || 1500)
      return sum + (price > 0 ? price : 1500)
    }, 0)
  }, [reservationType, includeHallPackage, selectedAdditionalDishes])

  const extraDishesCost = additionalDishesCost
  const extraMenuDishes = selectedAdditionalDishes

  const menuCategories = useMemo(() => {
    const cats = new Set()
    dbMenuItems.forEach(item => {
      const c = item.category || item.category_name
      if (c) cats.add(c)
    })
    return ['all', ...Array.from(cats)]
  }, [dbMenuItems])

  const additionalMenuCategories = useMemo(() => {
    const cats = new Set()
    dbMenuItems.forEach(item => {
      const c = item.category || item.category_name
      if (c && typeof c === 'string' && c.trim()) cats.add(c.trim())
    })
    return ['all', ...Array.from(cats)]
  }, [dbMenuItems])

  const filteredAdditionalDishes = useMemo(() => {
    return dbMenuItems.filter(item => {
      const name = (item.name || item.dish_name || '').toLowerCase()
      const desc = (item.description || '').toLowerCase()
      const cat = (item.category || item.category_name || '').toLowerCase().trim()
      const query = additionalDishSearch.toLowerCase().trim()
      const matchQuery = !query || name.includes(query) || desc.includes(query) || cat.includes(query)
      const matchCat = additionalDishCategory === 'all' || cat === additionalDishCategory.toLowerCase().trim()
      return matchQuery && matchCat
    })
  }, [dbMenuItems, additionalDishSearch, additionalDishCategory])

  const filteredMenuItems = useMemo(() => {
    return dbMenuItems.filter(item => {
      const name = (item.name || item.dish_name || '').toLowerCase()
      const desc = (item.description || '').toLowerCase()
      const cat = (item.category || item.category_name || '').toLowerCase()
      const matchQuery = !menuSearchQuery || name.includes(menuSearchQuery.toLowerCase()) || desc.includes(menuSearchQuery.toLowerCase())
      const matchCat = selectedMenuCategory === 'all' || cat === selectedMenuCategory.toLowerCase()
      return matchQuery && matchCat
    })
  }, [dbMenuItems, menuSearchQuery, selectedMenuCategory])

  // Grand Total Calculation
  const calculateTotalAmount = () => {
    if (reservationType === 'table') {
      const dishesCost = (selectedMenuDishes || []).reduce((sum, d) => sum + (parseFloat(d.price || d.dish_price || 0) * (d.quantity || 1)), 0)
      return (isCustomizing ? eventAddonsTotal : 0) + dishesCost
    }
    if (reservationType === 'hall') {
      const rate = parseFloat(activeHall?.rate_per_hour || activeHall?.hourly_rate || activeHall?.price || 1250)
      const durationHours = getHallDurationHours()
      const hallRentalFee = rate * durationHours

      let packageTotal = 0
      if (includeHallPackage && activePackage) {
        const basePkgPrice = parseFloat(activePackage?.package_price || activePackage?.price_per_person || 0)
        const maxIncludedPax = parseInt(activePackage?.max_guests || 50, 10)
        const extraFeePerGuest = activePackage?.extra_guest_fee && Number(activePackage.extra_guest_fee) > 0 ? parseFloat(activePackage.extra_guest_fee) : 0
        const extraGuests = extraFeePerGuest > 0 ? Math.max(0, guestCount - maxIncludedPax) : 0
        const extraGuestsCost = extraGuests * extraFeePerGuest
        packageTotal = (basePkgPrice > 0 ? basePkgPrice : 15000) + extraGuestsCost + additionalDishesCost
      }

      return hallRentalFee + packageTotal + addonsTotal + eventAddonsTotal
    }
    if (reservationType === 'catering') {
      const basePkgPrice = parseFloat(activePackage?.package_price || activePackage?.price_per_person || 0)
      const maxIncludedPax = parseInt(activePackage?.max_guests || 50, 10)
      const extraFeePerGuest = activePackage?.extra_guest_fee && Number(activePackage.extra_guest_fee) > 0 ? parseFloat(activePackage.extra_guest_fee) : 0
      const extraGuests = extraFeePerGuest > 0 ? Math.max(0, guestCount - maxIncludedPax) : 0
      const extraCost = extraGuests * extraFeePerGuest
      return (basePkgPrice > 0 ? basePkgPrice : 15000) + extraCost + addonsTotal + eventAddonsTotal + additionalDishesCost
    }
    return 0
  }

  const grandTotal = calculateTotalAmount()
  const downpaymentAmount = 0
  const balanceAmount = 0
  const amountToPayNow = grandTotal

  // Step definitions per reservation mode
  const hallSteps = [
    { step: 1, title: 'Hall & Date Selection', subtitle: 'Choose Date, Hall & Time Slot', icon: 'meeting_room' },
    { step: 2, title: 'Package Decision', subtitle: 'Add Food Package?', icon: 'lunch_dining' },
    { step: 3, title: 'Select Package', subtitle: 'Buffet Catering Tier', icon: 'bento', conditional: true },
    { step: 4, title: 'Included Dishes', subtitle: 'Curated Course Selection', icon: 'restaurant_menu', conditional: true },
    { step: 5, title: 'Additional Dish Fee', subtitle: 'Extra Dish Calculation', icon: 'price_check', conditional: true },
    { step: 6, title: 'Hall Add-ons', subtitle: 'A/V, Lights & Staff', icon: 'extension' },
    { step: 7, title: 'Review Reservation', subtitle: 'Itemized Quotation', icon: 'fact_check' },
    { step: 8, title: 'Payment / Checkout', subtitle: 'Payment & Confirmation', icon: 'payments' },
    { step: 9, title: 'Confirmation', subtitle: 'QR Pass & Receipt', icon: 'verified' }
  ]

  const tableSteps = [
    { step: 1, title: 'Reservation Details', subtitle: 'Date, Time & Occasion', icon: 'event' },
    { step: 2, title: 'Menu Recommendation', subtitle: 'Curated for your Event', icon: 'restaurant_menu' },
    { step: 3, title: 'Payment & Review', subtitle: 'GCash / Maya & Contact', icon: 'payments' },
    { step: 4, title: 'Confirmation', subtitle: 'Table Reserved & QR', icon: 'verified' }
  ]

  const cateringSteps = [
    { step: 1, title: 'Event Details', subtitle: 'Date, Schedule & Guests', icon: 'event' },
    { step: 2, title: 'Location / Venue', subtitle: 'Diner Hall vs Own Venue', icon: 'place' },
    { step: 3, title: 'Catering Package', subtitle: 'Buffet Catering Tier', icon: 'bento' },
    { step: 4, title: 'Included Dishes', subtitle: 'Curated Course Selection', icon: 'restaurant_menu' },
    { step: 5, title: 'Additional Dishes', subtitle: 'Extra Course Items', icon: 'price_check' },
    { step: 6, title: 'Catering Add-ons', subtitle: 'Styling, Staff & Setup', icon: 'extension' },
    { step: 7, title: 'Review Quotation', subtitle: 'Summary & Contact Info', icon: 'fact_check' },
    { step: 8, title: 'Payment / Checkout', subtitle: 'Payment & Confirmation', icon: 'payments' },
    { step: 9, title: 'Confirmation', subtitle: 'QR Pass & Receipt', icon: 'verified' }
  ]

  const displayedSteps = reservationType === 'hall' ? hallSteps : reservationType === 'table' ? tableSteps : cateringSteps
  const maxSteps = displayedSteps.length

  // Navigation Logic with Branching
  const handleNextStep = () => {
    if (reservationType === 'hall') {
      if (currentStep === 1) {
        if (!selectedDateStr || selectedDateStr < todayStr) {
          if (showToast) showToast('Please select a valid future date on the calendar.', 'warning')
          return
        }
        if (!selectedHallId) {
          if (showToast) showToast('Please select a function hall venue.', 'warning')
          return
        }
        if (isSelectedTimeRangeConflicting()) {
          if (showToast) showToast('Selected time range conflicts with an existing booking. Please adjust hours.', 'error')
          return
        }
        setCurrentStep(2)
        return
      }

      if (currentStep === 2) {
        if (includeHallPackage) {
          setCurrentStep(3) // YES: Select Package
        } else {
          setCurrentStep(6) // NO: Skip directly to Hall Add-ons
        }
        return
      }

      if (currentStep === 3) {
        if (!selectedPackageId) {
          if (showToast) showToast('Please select a catering/buffet package.', 'warning')
          return
        }
        setCurrentStep(4)
        return
      }

      if (currentStep === 4) {
        // Enforce that every category in packageCategoryStructure satisfies its required inclusion count
        for (const cat of packageCategoryStructure) {
          const chosenCount = (selectedCategoryDishes[cat.key] || []).length
          if (chosenCount < cat.required) {
            if (showToast) {
              showToast(`Please select ${cat.required} ${cat.label} to continue (${chosenCount}/${cat.required} selected).`, 'warning')
            }
            return
          }
        }
        setCurrentStep(5)
        return
      }

      if (currentStep === 5) {
        setCurrentStep(6)
        return
      }

      if (currentStep === 6) {
        setCurrentStep(7)
        return
      }

      if (currentStep === 7) {
        const finalName = (customerName || currentUser?.full_name || currentUser?.username || '').trim()
        const finalPhone = (customerPhone || currentUser?.phone || '').trim()
        if (!finalName) {
          if (showToast) showToast('Please enter your contact name.', 'warning')
          return
        }
        if (!finalPhone) {
          if (showToast) showToast('Please enter your contact phone number.', 'warning')
          return
        }
        setCurrentStep(8)
        return
      }

      if (currentStep === 8) {
        handleFinalSubmitReservation()
        return
      }
    } else if (reservationType === 'catering') {
      if (currentStep === 1) {
        if (!selectedDateStr || selectedDateStr < todayStr) {
          if (showToast) showToast('Please select a valid future date on the calendar.', 'warning')
          return
        }
        if (!timeSlot) {
          if (showToast) showToast('Please select an event serving time.', 'warning')
          return
        }
        setCurrentStep(2)
        return
      }

      if (currentStep === 2) {
        if (venueType === 'customer_venue') {
          if (!venueName.trim()) {
            if (showToast) showToast('Please provide your venue or event location name.', 'warning')
            return
          }
          if (!venueAddress.trim()) {
            if (showToast) showToast('Please provide the complete street address.', 'warning')
            return
          }
        } else {
          if (!selectedHallId && dbHalls.length > 0) {
            setSelectedHallId(dbHalls[0].hall_id || dbHalls[0].id)
          }
        }
        setCurrentStep(3)
        return
      }

      if (currentStep === 3) {
        if (!selectedPackageId) {
          if (showToast) showToast('Please select a catering buffet package.', 'warning')
          return
        }
        setCurrentStep(4)
        return
      }

      if (currentStep === 4) {
        for (const cat of packageCategoryStructure) {
          const chosenCount = (selectedCategoryDishes[cat.key] || []).length
          if (chosenCount < cat.required) {
            if (showToast) {
              showToast(`Please select ${cat.required} ${cat.label} to continue (${chosenCount}/${cat.required} selected).`, 'warning')
            }
            return
          }
        }
        setCurrentStep(5)
        return
      }

      if (currentStep === 5) {
        setCurrentStep(6)
        return
      }

      if (currentStep === 6) {
        setCurrentStep(7)
        return
      }

      if (currentStep === 7) {
        const finalName = (customerName || currentUser?.full_name || currentUser?.username || '').trim()
        const finalPhone = (customerPhone || currentUser?.phone || '').trim()
        if (!finalName) {
          if (showToast) showToast('Please enter your contact name.', 'warning')
          return
        }
        if (!finalPhone) {
          if (showToast) showToast('Please enter your contact phone number.', 'warning')
          return
        }
        setCurrentStep(8)
        return
      }

      if (currentStep === 8) {
        handleFinalSubmitReservation()
        return
      }
    } else {
      // TABLE RESERVATION 4-STEP FLOW
      if (currentStep === 1) {
        if (!selectedDateStr || selectedDateStr < todayStr) {
          if (showToast) showToast('Please select a valid future date on the calendar.', 'warning')
          return
        }
        if (!timeSlot) {
          if (showToast) showToast('Please select a dining time slot.', 'warning')
          return
        }
        setCurrentStep(2) // Move to Step 2: Event Menu Recommendation
        return
      }
      if (currentStep === 2) {
        setCurrentStep(3) // Move from Step 2 (Menu Recommendations) to Step 3 (Payment & Review)
        return
      }
      if (currentStep === 3) {
        const finalName = (customerName || currentUser?.full_name || currentUser?.username || '').trim()
        const finalPhone = (customerPhone || currentUser?.phone || '').trim()
        if (!finalName) {
          if (showToast) showToast('Please enter your contact name.', 'warning')
          return
        }
        if (!finalPhone) {
          if (showToast) showToast('Please enter your contact phone number.', 'warning')
          return
        }
        handleFinalSubmitReservation()
        return
      }
    }
  }

  const handlePrevStep = () => {
    if (reservationType === 'hall') {
      if (currentStep === 9) return
      if (currentStep === 8) { setCurrentStep(7); return }
      if (currentStep === 7) { setCurrentStep(6); return }
      if (currentStep === 6) {
        if (includeHallPackage) {
          setCurrentStep(5)
        } else {
          setCurrentStep(2)
        }
        return
      }
      if (currentStep === 5) { setCurrentStep(4); return }
      if (currentStep === 4) { setCurrentStep(3); return }
      if (currentStep === 3) { setCurrentStep(2); return }
      if (currentStep === 2) { setCurrentStep(1); return }
    } else if (reservationType === 'catering') {
      if (currentStep === 9) return
      if (currentStep === 8) { setCurrentStep(7); return }
      if (currentStep === 7) { setCurrentStep(6); return }
      if (currentStep === 6) { setCurrentStep(5); return }
      if (currentStep === 5) { setCurrentStep(4); return }
      if (currentStep === 4) { setCurrentStep(3); return }
      if (currentStep === 3) { setCurrentStep(2); return }
      if (currentStep === 2) { setCurrentStep(1); return }
    } else {
      // Table step back
      if (currentStep === 4) return
      if (currentStep === 3) { setCurrentStep(2); return }
      if (currentStep === 2) { setCurrentStep(1); return }
      setCurrentStep(prev => Math.max(1, prev - 1))
    }
  }

  const resetBookingForm = (targetType = reservationType) => {
    setCurrentStep(1)
    setConfirmedReservation(null)
    setPendingReviewReservation(null)
    setSelectedAddonIds([])
    setIsCustomizing(false)
    setActiveCustomSubTab('design')
    setSelectedDesignTheme('royal_luxury')
    setSelectedBackdrop('Standard Jo\'s Diner Venue Backdrop')
    setSelectedCenterpiece('Standard Jo\'s Diner Table Styling')
    setSelectedMotif('Royal Crimson & Gold (Jo\'s Signature)')
    setCustomDesignNotes('')
    setSelectedEventAddonIds([])
    setUserCustomAddons([])
    setNewCustomAddonInput('')
    setSelectedMenuDishes([])
    setMenuDietaryNotes('')
    setSelectedSeatingLayout('Round Banquet Tables')
    setSelectedTableArea('Main Dining Area')
    setSeatingPreference('Indoor')
    setHasSpecialOccasion('No')
    setSpecialOccasionType('Birthday')
    setTableAmbiance('Standard Festive')
    setEventName('')
    setSpecialNotes('')
    setSpecialRequest('')
    setIncludeHallPackage(true)
    setIsCustomOccasion(false)
    setCustomOccasionText('')
    setPaymentReference('')
    setPaymentOption('downpayment')
    setPaymentMethod('GCash')
    setVenueAddress(currentUser?.address || '')
    if (targetType === 'table') {
      setGuestCount(4)
      setOccasion('Casual Dining')
    } else if (targetType === 'hall') {
      setGuestCount(80)
      setOccasion('Wedding Reception / Banquet')
    } else if (targetType === 'catering') {
      const minPax = activePackage?.min_guests ? parseInt(activePackage.min_guests, 10) : 30
      setGuestCount(minPax)
      setOccasion('Birthday Celebration')
    }
    setHallStartTime('18:00')
    setHallEndTime('22:00')
    const today = new Date()
    setSelectedDateStr(today.toISOString().split('T')[0])
    setCurrentCalendarDate(today)
    if (!currentUser) {
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
    }
  }

  const handleTypeChange = (newType) => {
    setReservationType(newType)
    resetBookingForm(newType)
  }

  // Dynamic Time Slots List
  const timeSlotsList = useMemo(() => {
    const dayOverride = reservationSettings?.date_overrides?.[selectedDateStr]
    const disabledOnDay = Array.isArray(dayOverride?.disabled_slots) ? dayOverride.disabled_slots : []

    const fallbackSlots = [
      { time: '11:00 AM', period: 'Lunch', enabled: true },
      { time: '12:30 PM', period: 'Lunch', enabled: true },
      { time: '02:00 PM', period: 'Lunch', enabled: true },
      { time: '05:30 PM', period: 'Dinner', enabled: true },
      { time: '07:00 PM', period: 'Dinner', enabled: true },
      { time: '08:30 PM', period: 'Dinner', enabled: true }
    ]

    const sourceSlots = Array.isArray(reservationSettings?.time_slots) && reservationSettings.time_slots.length > 0
      ? reservationSettings.time_slots.filter(s => s.enabled !== false)
      : fallbackSlots

    return sourceSlots.map(s => {
      const isDinner = s.period === 'Dinner' || (s.time.includes('PM') && parseInt(s.time, 10) >= 5 && parseInt(s.time, 10) !== 12)
      const isUnavailableToday = disabledOnDay.includes(s.time)
      const isPassed = isSlotTimePassed(s.time, selectedDateStr)
      const isDisabled = isUnavailableToday || isPassed

      return {
        time: s.time,
        period: s.period || (isDinner ? 'Dinner' : 'Lunch'),
        label: isPassed ? 'Passed' : isUnavailableToday ? 'Closed Today' : (s.label || 'Available'),
        icon: isDinner ? 'bedtime' : 'wb_sunny',
        disabled: isDisabled,
        isPassed: isPassed
      }
    })
  }, [reservationSettings, selectedDateStr])

  // Build Candidate Reservation
  const buildReservationCandidate = () => {
    const resCode = reservationType === 'table'
      ? `TAB-${Math.floor(1000 + Math.random() * 9000)}`
      : `RES-${Math.floor(10000 + Math.random() * 90000)}`
    const calculatedTotal = calculateTotalAmount()

    let finalEventTime = timeSlot
    let finalTitle = `${occasion}`
    let finalHallName = 'Main Dining Area'
    let finalPackageName = 'None'

    if (reservationType === 'table') {
      const occLabel = (isCustomOccasion ? customOccasionText : occasion) || 'Casual Dining / Normal'
      finalTitle = `${occLabel} Table Reservation`
      finalHallName = 'Main Dining Area (Auto-Assigned Table)'
      finalPackageName = 'Dining Table Reservation'
    } else if (reservationType === 'hall') {
      const durationHours = getHallDurationHours()
      finalEventTime = `${formatTimeDisplay(hallStartTime)} - ${formatTimeDisplay(hallEndTime)} (${durationHours} hrs)`
      finalTitle = `${activeHall?.name || activeHall?.hall_name || 'Function Hall'}: ${occasion}`
      finalHallName = activeHall?.name || activeHall?.hall_name || 'Jo\'s Diner Event Hall'
      finalPackageName = includeHallPackage
        ? `${activePackage?.package_name || 'Banquet Package'} (Included in Hall Booking)`
        : `Function Hall Rental Only (${durationHours} hrs)`
    } else if (reservationType === 'catering') {
      const maxIncludedPax = parseInt(activePackage?.max_guests || 50, 10)
      const extraFeePerGuest = activePackage?.extra_guest_fee && Number(activePackage.extra_guest_fee) > 0 ? parseFloat(activePackage.extra_guest_fee) : 0
      const extraGuests = extraFeePerGuest > 0 ? Math.max(0, guestCount - maxIncludedPax) : 0
      const extraCost = extraGuests * extraFeePerGuest

      finalTitle = `${activePackage?.package_name || 'Catering Package'} (${guestCount} Pax)`
      finalHallName = venueType === 'diner_function_hall' 
        ? (activeHall?.name || activeHall?.hall_name || "Jo's Diner Function Hall") 
        : (venueName.trim() || "Customer's Own Venue")
      finalPackageName = extraCost > 0
        ? `${activePackage?.package_name || 'Catering Package'} (+${extraGuests} excess pax: ₱${extraCost.toLocaleString()})`
        : activePackage?.package_name || 'Catering Package'
    }

    const finalName = (customerName || currentUser?.full_name || currentUser?.username || '').trim()
    const finalPhone = (customerPhone || currentUser?.phone || '').trim()
    const finalEmail = (customerEmail || currentUser?.email || '').trim()

    const finalVenueAddress = venueType === 'diner_function_hall'
      ? "Jo's Diner & Catering Services, General Santos Highway, Polomolok, South Cotabato"
      : `${venueAddress.trim()}${venueCity ? `, ${venueCity.trim()}` : ''}`

    const designSummaryParts = []
    if (includedMenuDishes.length > 0 || selectedAdditionalDishes.length > 0 || selectedMenuDishes.length > 0) {
      if (selectedAdditionalDishes.length > 0) {
        designSummaryParts.push(`Included Dishes (${includedMenuDishes.length}/${totalAllowedDishes}): ${includedMenuDishes.map(d => d.name || d.dish_name).join(', ')} | Additional Dishes (${selectedAdditionalDishes.length}): ${selectedAdditionalDishes.map(d => `${d.name || d.dish_name} (+₱${parseFloat(d.price || d.dish_price || 1500).toLocaleString()})`).join(', ')} (+₱${additionalDishesCost.toLocaleString()})`)
      } else if (includedMenuDishes.length > 0) {
        designSummaryParts.push(`Included Dishes (${includedMenuDishes.length}/${totalAllowedDishes}): ${includedMenuDishes.map(d => d.name || d.dish_name).join(', ')}`)
      } else if (selectedMenuDishes.length > 0) {
        designSummaryParts.push(`Custom Menu (${selectedMenuDishes.length} Items): ${selectedMenuDishes.map(d => d.name || d.dish_name).join(', ')}`)
      }
    }
    if (isCustomizing) {
      const activeThemeObj = eventDesignThemes.find(t => t.id === selectedDesignTheme)
      designSummaryParts.push(`Theme: ${activeThemeObj?.title || selectedDesignTheme}`)
      designSummaryParts.push(`Backdrop: ${selectedBackdrop}`)
      designSummaryParts.push(`Centerpiece: ${selectedCenterpiece}`)
      designSummaryParts.push(`Motif: ${selectedMotif}`)
      if (customDesignNotes.trim()) designSummaryParts.push(`Design Notes: ${customDesignNotes.trim()}`)
    }
    if (venueSetupInstructions.trim()) {
      designSummaryParts.push(`Setup/Delivery Notes: ${venueSetupInstructions.trim()}`)
    }

    const tableOccasionLabel = (isCustomOccasion ? customOccasionText : occasion) || 'Casual Dining / Normal'

    const allNotes = [
      specialRequest,
      specialNotes,
      designSummaryParts.join(' | ')
    ].filter(Boolean).join(' | ') || (reservationType === 'table' ? `Table reservation for ${guestCount} guests (${tableOccasionLabel})` : 'Standard event preparation')

    const combinedAddons = [
      ...selectedAddonsList,
      ...selectedEventAddonsList
    ]

    return {
      id: resCode,
      reservation_code: resCode,
      title: finalTitle,
      event_name: eventName.trim() || finalTitle,
      type: reservationType === 'table' ? 'Table Reservation' : reservationType === 'hall' ? 'Function Hall Booking' : 'Catering & Banquet Service',
      category: reservationType,
      hall_id: selectedHallId,
      hall_name: finalHallName,
      package_id: (includeHallPackage || reservationType === 'catering') ? selectedPackageId : null,
      package_name: finalPackageName,
      include_hall_package: includeHallPackage,
      event_date: selectedDateStr,
      event_time: finalEventTime,
      guest_count: parseInt(guestCount, 10) || 4,
      guests: parseInt(guestCount, 10) || 4,
      total_amount: calculatedTotal,
      downpayment_amount: downpaymentAmount,
      balance_amount: balanceAmount,
      amount_paid: amountToPayNow,
      payment_type: paymentOption,
      payment_method: paymentMethod,
      payment_reference: paymentReference.trim(),
      selected_addons: combinedAddons,
      addons_total: addonsTotal + eventAddonsTotal,
      event_addons_total: eventAddonsTotal,
      extra_dishes_total: extraDishesCost,
      extra_dishes_count: extraMenuDishes.length,
      included_dishes_count: totalAllowedDishes,
      status: 'Pending',
      created_at: new Date().toISOString().split('T')[0],
      contact_name: finalName,
      contact_person: finalName,
      contact_phone: finalPhone,
      phone: finalPhone,
      email: finalEmail,
      venue_address: finalVenueAddress,
      venue_type: venueType,
      venue_name: venueType === 'diner_function_hall' ? (activeHall?.name || activeHall?.hall_name || "Jo's Diner Function Hall") : (venueName.trim() || "Customer's Own Venue"),
      venue_city: venueType === 'diner_function_hall' ? 'Polomolok' : (venueCity.trim() || 'Polomolok'),
      venue_contact_person: (venueContactPerson || finalName).trim(),
      venue_contact_phone: (venueContactPhone || finalPhone).trim(),
      venue_setup_instructions: venueSetupInstructions.trim(),
      special_request: specialRequest || '',
      special_requests: allNotes,
      occasion: reservationType === 'table' ? tableOccasionLabel : occasion,
      seating_preference: 'Auto-Assigned',
      is_customized: isCustomizing,
      design_theme: isCustomizing ? (eventDesignThemes.find(t => t.id === selectedDesignTheme)?.title || selectedDesignTheme) : null,
      stage_backdrop: isCustomizing ? selectedBackdrop : null,
      centerpiece_styling: isCustomizing ? selectedCenterpiece : null,
      color_motif: isCustomizing ? selectedMotif : null,
      custom_design_notes: customDesignNotes,
      user_custom_addons: userCustomAddons,
      custom_menu_dishes: selectedMenuDishes,
      included_dishes: includedMenuDishes,
      extra_dishes: extraMenuDishes,
      seating_layout: reservationType === 'table' ? 'Dining Table (Auto-Assigned)' : selectedSeatingLayout
    }
  }

  const handleInitiateReview = (e) => {
    if (e) e.preventDefault()
    const candidate = buildReservationCandidate()
    setPendingReviewReservation(candidate)
  }

  const handleFinalSubmitReservation = async () => {
    setIsSubmitting(true)
    const newReservation = buildReservationCandidate()

    // IF TABLE RESERVATION WITH ONLINE PAYMONGO (GCASH / MAYA):
    if (reservationType === 'table' && (paymentMethod === 'GCash' || paymentMethod === 'Maya')) {
      const depositAmount = grandTotal > 0 ? grandTotal : 100
      newReservation.total_amount = depositAmount
      newReservation.amount_paid = depositAmount
      newReservation.payment_method = `PayMongo (${paymentMethod})`

      try {
        const res = await api.reservations.createReservation(newReservation)
        if (res && res.status === 'error') {
          if (showToast) showToast(res.message || 'Duplicate reservation found. Please choose another date or time.', 'error')
          setIsSubmitting(false)
          return
        }
        if (res && (res.status === 'success' || res.reservation_id)) {
          if (res.reservation_id) newReservation.raw_id = res.reservation_id
          if (res.reservation_code) newReservation.reservation_code = res.reservation_code
          newReservation.status = 'Pending'
        }
      } catch (err) {
        console.warn('Reservation creation fallback:', err)
      }

      // Save to localStorage & sessionStorage for PayMongo verification return
      try {
        localStorage.setItem(`josdiner_pending_checkout_${newReservation.reservation_code}`, JSON.stringify(newReservation))
        localStorage.setItem('josdiner_pending_order_code', newReservation.reservation_code)
        sessionStorage.setItem('josdiner_pending_checkout', JSON.stringify(newReservation))
      } catch (e) {}

      // Create PayMongo Checkout Session and redirect directly to PayMongo
      try {
        const checkoutPayload = {
          amount: depositAmount,
          description: `Table Reservation - ${(newReservation.occasion || 'Dining Table')} (${guestCount} Guests)`,
          customerName: newReservation.contact_name || currentUser?.full_name || 'Valued Guest',
          customerEmail: newReservation.email || currentUser?.email || 'guest@example.com',
          customerPhone: newReservation.phone || currentUser?.phone || '',
          paymentMethods: paymentMethod === 'Maya' ? ['paymaya', 'gcash'] : ['gcash', 'paymaya'],
          reference: newReservation.reservation_code,
          successUrl: `${window.location.origin}/checkout/success?order_code=${newReservation.reservation_code}&type=table`,
          cancelUrl: `${window.location.origin}/reservation?type=table&status=cancelled`,
          orderPayload: newReservation
        }

        const sessionRes = await api.payments.createCheckoutSession(checkoutPayload)
        if (sessionRes && sessionRes.checkoutUrl) {
          if (showToast) showToast('Directing to PayMongo checkout...', 'info')
          window.location.href = sessionRes.checkoutUrl
          return
        }
      } catch (err) {
        console.warn('PayMongo hosted checkout error:', err)
      }

      // Fallback: in-app PayMongo checkout page if direct URL is not available
      navigate(`/payment/${newReservation.reservation_code}`, {
        state: {
          order: newReservation,
          pendingOrder: newReservation,
          orderCode: newReservation.reservation_code,
          isPendingOnline: true,
          method: paymentMethod === 'Maya' ? 'paymaya' : 'gcash'
        }
      })
      setIsSubmitting(false)
      return
    }

    try {
      const res = await api.reservations.createReservation(newReservation)
      if (res && res.status === 'error') {
        if (showToast) showToast(res.message || 'Duplicate reservation found. Please choose another date or time.', 'error')
        setIsSubmitting(false)
        return
      }
      if (res && (res.status === 'success' || res.reservation_id)) {
        if (res.reservation_id) newReservation.raw_id = res.reservation_id
        if (res.reservation_code) newReservation.reservation_code = res.reservation_code
        newReservation.status = res.booking_status || 'Pending'
      }
      if (showToast) {
        if (paymentMethod === 'Cash' || paymentMethod === 'counter') {
          showToast('Table reservation confirmed! Settle at counter upon arrival.', 'success', 5000)
        } else {
          showToast(reservationType === 'table' ? 'Table reservation confirmed successfully!' : 'Reservation submitted successfully! Your booking is pending staff review.', 'success')
        }
      }
    } catch (err) {
      console.warn('API reservation fallback:', err)
    }

    try {
      const savedEvents = localStorage.getItem('josdiner_customer_events')
      const currentEvents = savedEvents ? JSON.parse(savedEvents) : []
      localStorage.setItem('josdiner_customer_events', JSON.stringify([newReservation, ...currentEvents]))
    } catch (e) { }

    setAllReservations(prev => [newReservation, ...prev])
    setConfirmedReservation(newReservation)
    setPendingReviewReservation(null)
    setIsSubmitting(false)

    if (reservationType === 'table') {
      setCurrentStep(4) // Step 4: Table Confirmation
    } else {
      setCurrentStep(9) // Step 9: Hall/Catering Confirmation
    }
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${isDarkMode ? 'bg-[#040D1A] text-slate-100' : 'bg-gray-50 text-gray-800'}`}>

      {/* ORIGINAL HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">

        {/* Page Header (Consistent with the rest of the customer pages) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition font-semibold cursor-pointer">
                Home
              </button>
              <span>/</span>
              <span className="text-[#C8102E]">Reservations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#071A3D] dark:text-white flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">calendar_month</span>
              <span>Reserve &amp; Book Your Event</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Choose your service below to reserve dining tables, book private function halls, or schedule catering services.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => navigate('/my-reservations')}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-2 active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="material-icons text-base">receipt_long</span>
              <span>My Reservations</span>
            </button>
          </div>
        </div>

        {/* 1. SERVICE SELECTOR TABS (Dine-in Table, Function Hall, Catering) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('table')}
            className={`p-4 rounded-lg border text-left transition flex items-center gap-3 cursor-pointer ${reservationType === 'table'
              ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
              : isDarkMode
                ? 'bg-[#071A3D] text-gray-200 border-slate-700 hover:border-slate-600'
                : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${reservationType === 'table' ? 'bg-white/20' : 'bg-red-50 dark:bg-slate-800 text-[#C8102E]'}`}>
              <span className="material-icons text-xl">table_restaurant</span>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs uppercase tracking-wider">Dine-in Table</div>
              <div className={`text-[11px] truncate ${reservationType === 'table' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Casual dining, dates &amp; family tables
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('hall')}
            className={`p-4 rounded-lg border text-left transition flex items-center gap-3 cursor-pointer ${reservationType === 'hall'
              ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
              : isDarkMode
                ? 'bg-[#071A3D] text-gray-200 border-slate-700 hover:border-slate-600'
                : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${reservationType === 'hall' ? 'bg-white/20' : 'bg-red-50 dark:bg-slate-800 text-[#C8102E]'}`}>
              <span className="material-icons text-xl">domain</span>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs uppercase tracking-wider">Function Hall</div>
              <div className={`text-[11px] truncate ${reservationType === 'hall' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Weddings, debuts &amp; private events
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('catering')}
            className={`p-4 rounded-lg border text-left transition flex items-center gap-3 cursor-pointer ${reservationType === 'catering'
              ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
              : isDarkMode
                ? 'bg-[#071A3D] text-gray-200 border-slate-700 hover:border-slate-600'
                : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${reservationType === 'catering' ? 'bg-white/20' : 'bg-red-50 dark:bg-slate-800 text-[#C8102E]'}`}>
              <span className="material-icons text-xl">bento</span>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs uppercase tracking-wider">Catering Buffet</div>
              <div className={`text-[11px] truncate ${reservationType === 'catering' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                Full banquet food &amp; dining packages
              </div>
            </div>
          </button>
        </div>

        {/* 2. STEPPER PROGRESS BAR */}
        <div className={`p-3.5 rounded-lg border border-gray-300 dark:border-slate-700 shadow-2xs overflow-x-auto ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
          <div className="flex items-center min-w-max gap-3 sm:gap-4">
            {displayedSteps.map((s, idx) => {
              const isCurrent = currentStep === s.step
              const isDone = currentStep > s.step
              const isSkipped = s.conditional && !includeHallPackage && currentStep > 3 && (s.step === 4 || s.step === 5 || s.step === 6)

              return (
                <div key={s.step} className="flex items-center gap-2">
                  <div
                    onClick={() => {
                      if (s.step < currentStep) setCurrentStep(s.step)
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-left transition ${s.step < currentStep ? 'cursor-pointer hover:border-gray-400' : ''
                      } ${isCurrent
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : isSkipped
                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-dashed border-gray-300 opacity-60'
                            : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isCurrent ? 'bg-white text-[#C8102E]' : isDone ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {isDone ? <span className="material-icons text-xs">check</span> : s.step}
                    </div>
                    <div>
                      <div className="font-black text-xs leading-none">{s.title}</div>
                      <div className="text-[9.5px] opacity-75 hidden md:block mt-0.5">{s.subtitle}</div>
                    </div>
                  </div>

                  {idx < displayedSteps.length - 1 && (
                    <span className="material-icons text-xs text-gray-300 dark:text-slate-600">chevron_right</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 3. STEP-BY-STEP WORKFLOW CONTENT */}
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* ================== STEP 1: DATE & TIME / SCHEDULE ======================= */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
              {/* Left 7 Cols: Interactive Calendar */}
              <div className="lg:col-span-7 space-y-4">
                <div className={`rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs overflow-hidden ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
                  {/* Calendar Header */}
                  <div className="p-4 sm:p-5 border-b border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-[#C8102E] text-xl">event</span>
                        <h3 className="text-base font-black text-[#071A3D] dark:text-white">
                          {monthNames[month]} {year}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetToToday}
                          className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                        >
                          Today
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <span className="material-icons text-sm">chevron_left</span>
                          </button>
                          <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <span className="material-icons text-sm">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {reservationType === 'hall' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-red-50/70 dark:bg-slate-900 border border-red-200/80 dark:border-slate-700 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 text-[#071A3D] dark:text-white min-w-0">
                          <span className="material-icons text-xs text-[#C8102E]">domain</span>
                          <span className="truncate">Schedule for: <strong className="text-[#C8102E]">{activeHall?.name || activeHall?.hall_name || 'Selected Hall'}</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] shrink-0">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Open All Day
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Partial Slots
                          </span>
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Fully Booked
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day Labels */}
                  <div className="grid grid-cols-7 border-b border-gray-300 dark:border-slate-700 bg-gray-100/70 dark:bg-slate-800/80 text-center text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 py-2.5">
                    <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-slate-800">
                    {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-12 sm:h-14 bg-gray-50/40 dark:bg-slate-950/30"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                      const avail = getDayAvailability(dayNum)
                      const isSelected = selectedDateStr === dateStr

                      const handleCellClick = () => {
                        if (avail.status === 'past') {
                          if (showToast) showToast(`Date has passed. Please choose a future date.`, 'info')
                          return
                        }
                        if (avail.status === 'full') {
                          if (showToast) showToast(`Date is fully booked. Please select another date.`, 'info')
                          return
                        }
                        setSelectedDateStr(dateStr)
                      }

                      return (
                        <button
                          key={dayNum}
                          onClick={handleCellClick}
                          className={`h-12 sm:h-14 p-2 transition-colors duration-150 flex flex-col justify-between items-center relative cursor-pointer ${isSelected
                            ? 'bg-[#C8102E] text-white font-extrabold z-10 shadow-inner'
                            : avail.status === 'past'
                              ? 'bg-gray-100/60 dark:bg-slate-900/40 text-gray-400 cursor-not-allowed'
                              : avail.status === 'full'
                                ? 'bg-red-50/60 dark:bg-red-950/20 text-gray-400 cursor-not-allowed'
                                : isDarkMode
                                  ? 'hover:bg-slate-800/80 text-gray-200'
                                  : 'hover:bg-red-50/50 text-gray-800'
                            }`}
                        >
                          <span className="text-xs font-bold leading-none">{dayNum}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${avail.dotColor}`}></span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Availability Legend */}
                  <div className="flex items-center justify-center gap-6 text-[11px] font-semibold p-3 border-t border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Filling Fast</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span>Fully Booked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Selected Date & Timing Configurator */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`p-5 sm:p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-4 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
                  <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                        Step 1: Event Details &amp; Timing
                      </span>
                      <h4 className="text-base font-black text-[#071A3D] dark:text-white flex items-center gap-1.5 mt-0.5">
                        <span className="material-icons text-[#C8102E] text-base">calendar_today</span>
                        <span>{new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 dark:bg-red-950/80 text-[#C8102E]">
                      {reservationType}
                    </span>
                  </div>

                  {/* Mode 1: Table Timeslots */}
                  {reservationType === 'table' && (
                    <div className="space-y-4">
                      {/* Time Slots */}
                      <div className="space-y-2">
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                          Reservation Time *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timeSlotsList.map((slot, idx) => {
                            const isSelected = timeSlot === slot.time && !slot.disabled
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={slot.disabled}
                                onClick={() => !slot.disabled && setTimeSlot(slot.time)}
                                className={`p-2 rounded-md border text-left transition text-xs font-bold ${slot.disabled
                                  ? 'bg-gray-100 dark:bg-slate-900/60 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                  : isSelected
                                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border-gray-300 text-gray-800 dark:text-gray-200 hover:border-gray-400'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{slot.time}</span>
                                  <span className={`text-[8px] uppercase px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
                                    {slot.isPassed ? 'Passed' : slot.period}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Number of Guests */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                          Number of Guests
                        </label>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setGuestCount(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 text-lg font-black border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs text-gray-800 dark:text-gray-200 shrink-0"
                            title="Decrease Guests"
                          >
                            −
                          </button>
                          <div className="flex-1 relative flex items-center">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={guestCount}
                              onChange={e => {
                                const val = e.target.value
                                if (val === '') {
                                  setGuestCount('')
                                } else {
                                  const parsed = parseInt(val, 10)
                                  if (!isNaN(parsed)) {
                                    setGuestCount(Math.max(1, parsed))
                                  }
                                }
                              }}
                              onBlur={() => {
                                if (!guestCount || parseInt(guestCount, 10) < 1) {
                                  setGuestCount(1)
                                }
                              }}
                              className="w-full px-3 py-2 text-center rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-black text-sm text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="e.g. 4"
                            />
                            <span className="absolute right-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                              {Number(guestCount) === 1 ? 'Guest' : 'Guests'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGuestCount(prev => Math.min(100, (parseInt(prev, 10) || 0) + 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 text-lg font-black border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs text-gray-800 dark:text-gray-200 shrink-0"
                            title="Increase Guests"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Occasion Type Selection */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                          Occasion Type *
                        </label>
                        <select
                          value={
                            isCustomOccasion || !['Casual Dining / Normal', 'Birthday Celebration', 'Anniversary Gala', 'Romantic Date', 'Family Gathering', 'Business Meeting / Lunch', 'Graduation / Victory Party'].includes(occasion)
                              ? 'Other'
                              : occasion
                          }
                          onChange={e => {
                            if (e.target.value === 'Other') {
                              setIsCustomOccasion(true)
                              if (['Casual Dining / Normal', 'Birthday Celebration', 'Anniversary Gala', 'Romantic Date', 'Family Gathering', 'Business Meeting / Lunch', 'Graduation / Victory Party'].includes(occasion)) {
                                setCustomOccasionText('')
                                setOccasion('')
                              }
                            } else {
                              setIsCustomOccasion(false)
                              setOccasion(e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white"
                        >
                          <option value="Casual Dining / Normal">Casual Dining / Normal</option>
                          <option value="Birthday Celebration">Birthday Celebration</option>
                          <option value="Anniversary Gala">Anniversary Gala</option>
                          <option value="Romantic Date">Romantic Date</option>
                          <option value="Family Gathering">Family Gathering</option>
                          <option value="Business Meeting / Lunch">Business Meeting / Lunch</option>
                          <option value="Graduation / Victory Party">Graduation / Victory Party</option>
                          <option value="Other">Other (Please specify)</option>
                        </select>
                      </div>

                      {(isCustomOccasion || (!['Casual Dining / Normal', 'Birthday Celebration', 'Anniversary Gala', 'Romantic Date', 'Family Gathering', 'Business Meeting / Lunch', 'Graduation / Victory Party'].includes(occasion) && occasion !== '')) && (
                        <div className="animate-in fade-in duration-150">
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Specify Other Occasion *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Milestone Party, Team Dinner..."
                            value={customOccasionText || (isCustomOccasion ? occasion : '')}
                            onChange={e => {
                              const val = e.target.value
                              setCustomOccasionText(val)
                              setOccasion(val)
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>
                      )}

                      {/* Special Request */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                          Special Request (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Birthday celebration, high chair requested, quiet corner..."
                          value={specialRequest}
                          onChange={e => setSpecialRequest(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-medium focus:ring-1 focus:ring-[#C8102E] focus:outline-none text-[#071A3D] dark:text-white"
                        />
                      </div>

                      {/* Automatic assignment note */}
                      <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200/80 dark:border-slate-700 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                        <span className="material-icons text-sm text-[#C8102E] shrink-0 mt-0.5">info</span>
                        <span>The system will automatically assign an appropriate available table based on the number of guests, date, and time.</span>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Function Hall Duration & Event Details */}
                  {reservationType === 'hall' && (
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                            Select Function Hall Venue *
                          </label>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {dbHalls.length} Available
                          </span>
                        </div>
                        <select
                          value={selectedHallId || ''}
                          onChange={e => setSelectedHallId(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                        >
                          {dbHalls.map(h => {
                            const hId = h.hall_id || h.id
                            const hCap = h.capacity || 100
                            const hRate = h.rate_per_hour || h.hourly_rate || 1250
                            return (
                              <option key={hId} value={hId}>
                                {h.name || h.hall_name} (Max: {hCap} Pax) — ₱{parseFloat(hRate).toLocaleString()}/hr
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      {activeHall && (
                        <div className="flex items-center gap-3 p-2.5 rounded-md bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700">
                          <img
                            src={activeHall.image || activeHall.hall_image || activeHall.image_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80'}
                            alt={activeHall.name || activeHall.hall_name}
                            className="w-14 h-14 rounded object-cover border border-gray-200 dark:border-slate-600 shrink-0"
                            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80' }}
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-[#071A3D] dark:text-white truncate">
                              {activeHall.name || activeHall.hall_name}
                            </h5>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Max Capacity: {activeHall.capacity || 100} Guests
                            </p>
                            <p className="text-[11px] font-black text-[#C8102E]">
                              ₱{parseFloat(activeHall.rate_per_hour || activeHall.hourly_rate || 1250).toLocaleString()} / hour
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Event Name / Occasion *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Santos & Reyes Wedding Reception"
                          value={eventName}
                          onChange={e => setEventName(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">Occasion Type</label>
                          <select
                            value={
                              isCustomOccasion || !['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion)
                                ? 'Other'
                                : occasion
                            }
                            onChange={e => {
                              if (e.target.value === 'Other') {
                                setIsCustomOccasion(true)
                                if (['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion)) {
                                  setCustomOccasionText('')
                                  setOccasion('')
                                }
                              } else {
                                setIsCustomOccasion(false)
                                setOccasion(e.target.value)
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white"
                          >
                            <option value="Wedding Reception / Banquet">Wedding Reception</option>
                            <option value="Birthday Celebration">Birthday Celebration</option>
                            <option value="18th Debut Party">18th Debut Party</option>
                            <option value="Corporate Seminar / Meeting">Corporate Seminar</option>
                            <option value="Anniversary Gala">Anniversary Gala</option>
                            <option value="Christening / Dedication">Christening</option>
                            <option value="Christmas / Year-End Party">Year-End Party</option>
                            <option value="Graduation / Victory Party">Graduation / Victory Party</option>
                            <option value="Other">Other (Please specify)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">Guest Count (Pax) *</label>
                          <input
                            type="number"
                            min="20"
                            max="500"
                            value={guestCount}
                            onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value || 1, 10)))}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                          />
                        </div>
                      </div>

                      {(isCustomOccasion || (!['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion) && occasion !== '')) && (
                        <div className="animate-in fade-in duration-150">
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Specify Other Occasion *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Grand Family Reunion, Product Launch, Thanksgiving..."
                            value={customOccasionText || (isCustomOccasion ? occasion : '')}
                            onChange={e => {
                              const val = e.target.value
                              setCustomOccasionText(val)
                              setOccasion(val)
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>
                      )}

                      {/* Event Duration & Hours */}
                      <div className="space-y-2 pt-1 border-t border-gray-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs">
                            Event Hours &amp; Duration *
                          </label>
                          <span className="text-[10px] font-black text-[#C8102E] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 font-mono">
                            {getHallDurationHours()} Hours Duration
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-1">Time On (Start)</span>
                            <select
                              value={hallStartTime}
                              onChange={e => {
                                const newStart = e.target.value
                                setHallStartTime(newStart)
                                const startH = parseInt(newStart.split(':')[0], 10)
                                const endH = parseInt(hallEndTime.split(':')[0], 10)
                                if (endH <= startH) {
                                  const nextEndH = Math.min(23, startH + 4)
                                  setHallEndTime(`${String(nextEndH).padStart(2, '0')}:00`)
                                }
                              }}
                              className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                            >
                              {hallTimeOptions.slice(0, -1).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-1">Time To (End)</span>
                            <select
                              value={hallEndTime}
                              onChange={e => setHallEndTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                            >
                              {hallTimeOptions
                                .filter(opt => parseInt(opt.value.split(':')[0], 10) > parseInt(hallStartTime.split(':')[0], 10))
                                .map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {isSelectedTimeRangeConflicting() && (
                          <div className="p-2.5 rounded-md bg-red-100 dark:bg-red-950/80 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2">
                            <span className="material-icons text-base text-red-600 shrink-0">error</span>
                            <span>Time conflicts with an existing booking. Please adjust hours.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Catering Event Details & Serving Time */}
                  {reservationType === 'catering' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Event Name / Occasion *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Santos & Reyes Wedding Reception, Mendoza 50th Birthday"
                          value={eventName}
                          onChange={e => setEventName(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">Occasion Type</label>
                          <select
                            value={
                              isCustomOccasion || !['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion)
                                ? 'Other'
                                : occasion
                            }
                            onChange={e => {
                              if (e.target.value === 'Other') {
                                setIsCustomOccasion(true)
                                if (['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion)) {
                                  setCustomOccasionText('')
                                  setOccasion('')
                                }
                              } else {
                                setIsCustomOccasion(false)
                                setOccasion(e.target.value)
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white"
                          >
                            <option value="Wedding Reception / Banquet">Wedding Reception</option>
                            <option value="Birthday Celebration">Birthday Celebration</option>
                            <option value="18th Debut Party">18th Debut Party</option>
                            <option value="Corporate Seminar / Meeting">Corporate Seminar</option>
                            <option value="Anniversary Gala">Anniversary Gala</option>
                            <option value="Christening / Dedication">Christening</option>
                            <option value="Christmas / Year-End Party">Year-End Party</option>
                            <option value="Graduation / Victory Party">Graduation / Victory Party</option>
                            <option value="Other">Other (Please specify)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">Guest Count (Pax) *</label>
                          <input
                            type="number"
                            min="20"
                            max="1000"
                            value={guestCount}
                            onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value || 1, 10)))}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                          />
                        </div>
                      </div>

                      {(isCustomOccasion || (!['Wedding Reception / Banquet', 'Birthday Celebration', '18th Debut Party', 'Corporate Seminar / Meeting', 'Anniversary Gala', 'Christening / Dedication', 'Christmas / Year-End Party', 'Graduation / Victory Party'].includes(occasion) && occasion !== '')) && (
                        <div className="animate-in fade-in duration-150">
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Specify Other Occasion *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Grand Family Reunion, Product Launch, Thanksgiving..."
                            value={customOccasionText || (isCustomOccasion ? occasion : '')}
                            onChange={e => {
                              const val = e.target.value
                              setCustomOccasionText(val)
                              setOccasion(val)
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Event Start / Serving Time *
                        </label>
                        <select
                          value={timeSlot}
                          onChange={e => setTimeSlot(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                        >
                          {timeSlotsList.map((slot, idx) => (
                            <option key={idx} value={slot.time} disabled={slot.disabled}>
                              {slot.time} ({slot.period})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span>
                        {reservationType === 'hall' 
                          ? 'Continue: Food Package Option' 
                          : reservationType === 'catering' 
                            ? 'Continue: Location / Venue Details' 
                            : 'Continue: Event Menu Suggestions'}
                      </span>
                      <span className="material-icons text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============ STEP 2: CATERING LOCATION & VENUE DETAILS ================== */}
          {/* ========================================================================= */}
          {currentStep === 2 && reservationType === 'catering' && (
            <div className={`p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-sm space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Step 2 of 9: Venue Details</span>
                  <h3 className="text-xl font-black text-[#071A3D] dark:text-white">
                    Event &amp; Location Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Where will the catering take place? Choose Jo's Diner Function Hall or your own private venue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold border border-gray-300 dark:border-slate-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 flex items-center gap-1.5">
                    <span className="material-icons text-sm text-[#C8102E]">event</span>
                    <span>{selectedDateStr} • {timeSlot}</span>
                  </span>
                </div>
              </div>

              {/* Venue Type Selection */}
              <div className="space-y-4">
                <label className="block text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider">
                  Where will the catering take place? *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Jo's Diner Function Hall */}
                  <div
                    onClick={() => setVenueType('diner_function_hall')}
                    className={`p-5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      venueType === 'diner_function_hall'
                        ? 'border-[#C8102E] bg-red-50/60 dark:bg-slate-900 ring-2 ring-[#C8102E]/30 shadow-xs'
                        : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`material-icons text-xl ${venueType === 'diner_function_hall' ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                          {venueType === 'diner_function_hall' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <h4 className="font-black text-sm text-[#071A3D] dark:text-white">
                            Jo's Diner Function Hall
                          </h4>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            On-site banquet hall with full dine-in setup
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Host your celebration inside Jo's Diner air-conditioned banquet facilities with dedicated buffet lines, tables, and sound system.
                    </p>
                  </div>

                  {/* Option 2: Customer's Own Venue */}
                  <div
                    onClick={() => setVenueType('customer_venue')}
                    className={`p-5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      venueType === 'customer_venue'
                        ? 'border-[#C8102E] bg-red-50/60 dark:bg-slate-900 ring-2 ring-[#C8102E]/30 shadow-xs'
                        : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`material-icons text-xl ${venueType === 'customer_venue' ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                          {venueType === 'customer_venue' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <h4 className="font-black text-sm text-[#071A3D] dark:text-white">
                            Customer's Own Venue
                          </h4>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Offsite catering delivered to your home or event place
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Our catering crew will travel to your residence, company grounds, or private pavilion with warmers and buffet setup.
                    </p>
                  </div>
                </div>

                {/* Conditional Form */}
                {venueType === 'diner_function_hall' ? (
                  <div className="p-5 rounded-xl bg-gray-50/90 dark:bg-slate-900/90 border border-gray-300 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1.5">
                        Select Function Hall *
                      </label>
                      <select
                        value={selectedHallId || ''}
                        onChange={e => setSelectedHallId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                      >
                        {dbHalls.map(h => (
                          <option key={h.hall_id || h.id} value={h.hall_id || h.id}>
                            {h.name || h.hall_name} (Capacity: {h.capacity || 100} Guests)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-gray-400 block">Diner Address</span>
                      <div className="font-black text-[#071A3D] dark:text-white">Jo's Diner &amp; Catering Services</div>
                      <div className="text-gray-600 dark:text-gray-300">General Santos Highway, Polomolok, South Cotabato</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-gray-50/90 dark:bg-slate-900/90 border border-gray-300 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
                    <div className="font-black text-xs uppercase text-[#C8102E] tracking-wider flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-800 pb-2">
                      <span className="material-icons text-sm">location_on</span>
                      <span>External Venue Information</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. St. Jude Multi-Purpose Pavilion, Private Residence"
                          value={venueName}
                          onChange={e => setVenueName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          City / Municipality *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Polomolok, General Santos City, Koronadal"
                          value={venueCity}
                          onChange={e => setVenueCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                        Complete Venue Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Purok 4, Brgy. Cannery Site (Near St. Paul Church)"
                        value={venueAddress}
                        onChange={e => setVenueAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Contact Person at Venue *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Juan Dela Cruz"
                          value={venueContactPerson}
                          onChange={e => setVenueContactPerson(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="09171234567"
                          value={venueContactPhone}
                          onChange={e => setVenueContactPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                        Special Delivery / Setup Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Gate 2 access, set up buffet line by the garden patio, 2 electrical outlets needed..."
                        value={venueSetupInstructions}
                        onChange={e => setVenueSetupInstructions(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-medium text-xs focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Event Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <span>Continue: Catering Package</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 2: HALL PACKAGE? (YES / NO) ====================== */}
          {/* ========================================================================= */}
          {currentStep === 2 && reservationType === 'hall' && (
            <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              {/* Step Header matching other steps */}
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 2 of 9: Package Decision
                  </span>
                  <h3 className="text-lg font-black text-[#071A3D] dark:text-white">
                    Include a Catering / Banquet Food Package?
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose whether you want Jo's Diner to provide complete buffet food catering for your event.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5 border border-gray-300 dark:border-slate-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900">
                    <span className="material-icons text-sm text-[#C8102E]">domain</span>
                    <span>{activeHall?.name || activeHall?.hall_name || 'Function Hall'}</span>
                  </span>
                </div>
              </div>

              {/* Decision Cards with standard clean borders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* OPTION YES: Include Food Package */}
                <div
                  onClick={() => setIncludeHallPackage(true)}
                  className={`p-5 rounded-lg border transition cursor-pointer flex flex-col justify-between space-y-4 ${includeHallPackage
                    ? 'border-[#C8102E] bg-red-50/40 dark:bg-slate-900/90 shadow-xs ring-1 ring-[#C8102E]'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-gray-400'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${includeHallPackage
                          ? 'bg-[#C8102E] text-white'
                          : 'bg-red-100 dark:bg-red-950/70 text-[#C8102E]'
                          }`}>
                          <span className="material-icons text-xl">restaurant_menu</span>
                        </div>
                        <div>
                          <h4 className="font-black text-base text-[#071A3D] dark:text-white">
                            YES — Include Food Package
                          </h4>
                          <span className="text-[11px] font-bold text-[#C8102E]">
                            Full Catering &amp; Buffet Service
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${includeHallPackage
                        ? 'border-[#C8102E] bg-[#C8102E] text-white'
                        : 'border-gray-400 dark:border-slate-600'
                        }`}>
                        {includeHallPackage && <span className="material-icons text-xs font-black">check</span>}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Add a comprehensive banquet buffet package featuring curated dishes, steamed rice, desserts, and refreshments served by our team.
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-gray-500">Food &amp; Dining Option</span>
                    <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${includeHallPackage
                      ? 'bg-[#C8102E] text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {includeHallPackage ? '✓ Selected' : 'Select YES'}
                    </span>
                  </div>
                </div>

                {/* OPTION NO: Hall Rental Only */}
                <div
                  onClick={() => setIncludeHallPackage(false)}
                  className={`p-5 rounded-lg border transition cursor-pointer flex flex-col justify-between space-y-4 ${!includeHallPackage
                    ? 'border-[#071A3D] dark:border-slate-400 bg-slate-50 dark:bg-slate-900/90 shadow-xs ring-1 ring-[#071A3D] dark:ring-slate-400'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-gray-400'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${!includeHallPackage
                          ? 'bg-[#071A3D] text-white dark:bg-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#071A3D] dark:text-white'
                          }`}>
                          <span className="material-icons text-xl">meeting_room</span>
                        </div>
                        <div>
                          <h4 className="font-black text-base text-[#071A3D] dark:text-white">
                            NO — Hall Rental Only
                          </h4>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            Venue Space Only
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${!includeHallPackage
                        ? 'border-[#071A3D] bg-[#071A3D] text-white dark:border-slate-400 dark:bg-slate-400 dark:text-slate-900'
                        : 'border-gray-400 dark:border-slate-600'
                        }`}>
                        {!includeHallPackage && <span className="material-icons text-xs font-black">check</span>}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Reserve the function hall space only. Ideal if you are bringing your own caterer, packed meals, or hosting a seminar/meeting without buffet services.
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-gray-500">Venue Only Option</span>
                    <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${!includeHallPackage
                      ? 'bg-[#071A3D] dark:bg-slate-300 text-white dark:text-slate-900 shadow-2xs'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {!includeHallPackage ? '✓ Selected' : 'Select NO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative Guidance banner */}
              <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="material-icons text-base text-[#C8102E] shrink-0 mt-0.5">info</span>
                <div className="leading-relaxed">
                  {includeHallPackage ? (
                    <span>
                      <strong>Food Package Included:</strong> Next steps will guide you through selecting your catering package, reviewing included dishes, and choosing any extra menu add-ons.
                    </span>
                  ) : (
                    <span>
                      <strong>Hall Rental Only:</strong> Catering package and menu steps will be skipped. You will proceed directly to <strong>Step 6: Function Hall Add-ons</strong> (A/V equipment, lights, staff, etc.).
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Event Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <span>{includeHallPackage ? 'Continue: Select Package' : 'Continue: Hall Add-ons'}</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 3: SELECT PACKAGE ================================ */}
          {/* ========================================================================= */}
          {currentStep === 3 && ((reservationType === 'hall' && includeHallPackage) || reservationType === 'catering') && (
            <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    {reservationType === 'catering' ? 'Step 3 of 9: Catering Package' : 'Step 3 of 9: Package Selection'}
                  </span>
                  <h3 className="text-lg font-black text-[#071A3D] dark:text-white">SELECT A PACKAGE</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose the banquet package that suits your budget and guest count.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold border border-gray-300 dark:border-slate-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900">
                    {guestCount} Guests Target
                  </span>
                </div>
              </div>

              {/* Package Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dbPackages.length === 0 ? (
                  <div className="col-span-full py-12 px-4 text-center rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/40 space-y-2">
                    <span className="material-icons text-4xl text-gray-400">bento</span>
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">No Packages Available</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">There are currently no catering packages configured in the database.</p>
                  </div>
                ) : (
                  dbPackages.map(pkg => {
                    const pkgId = pkg.package_id || pkg.id
                    const isSelected = String(selectedPackageId) === String(pkgId)
                    const pkgPrice = parseFloat(pkg.package_price || pkg.price_per_person || 0)
                    const inclusionsList = getPackageInclusionsList(pkg)

                    return (
                      <div
                        key={pkgId}
                        onClick={() => setSelectedPackageId(pkgId)}
                        className={`rounded-lg border p-5 transition cursor-pointer flex flex-col justify-between space-y-4 ${isSelected
                          ? 'border-[#C8102E] bg-red-50/40 dark:bg-slate-900/90 ring-1 ring-[#C8102E] shadow-xs'
                          : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-gray-400'
                          }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-[#C8102E]">
                              {pkg.min_guests || 30}–{pkg.max_guests || 100} Guests
                            </span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${isSelected
                              ? 'border-[#C8102E] bg-[#C8102E] text-white'
                              : 'border-gray-400 dark:border-slate-600'
                              }`}>
                              {isSelected && <span className="material-icons text-xs font-black">check</span>}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-black text-base text-[#071A3D] dark:text-white">
                              {pkg.package_name}
                            </h4>
                            <div className="font-mono font-black text-lg text-[#C8102E] mt-0.5">
                              ₱{pkgPrice.toLocaleString()}
                            </div>
                            {pkg.description ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug line-clamp-2">
                                {pkg.description}
                              </p>
                            ) : null}
                          </div>

                          {/* Package Inclusions Breakdown (Real DB Data Only) */}
                          <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                              Includes:
                            </span>
                            {inclusionsList.length > 0 ? (
                              inclusionsList.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 font-medium">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{item}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">No specific course inclusions defined for this package.</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-slate-700/80">
                          <span className="text-[11px] font-bold text-gray-500">Package Status</span>
                          <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${isSelected
                            ? 'bg-[#C8102E] text-white shadow-2xs'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {isSelected ? '✓ Selected' : 'Select Package'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>{reservationType === 'catering' ? 'Back: Location / Venue' : 'Back: Package Decision'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <span>Continue: Select Dishes</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============= STEP 4: PACKAGE-INCLUDED DISH SELECTION ==================== */}
          {/* ========================================================================= */}
          {currentStep === 4 && ((reservationType === 'hall' && includeHallPackage) || reservationType === 'catering') && (
            <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 4 of 9: Included Dishes
                  </span>
                  <h3 className="text-lg font-black text-[#071A3D] dark:text-white">
                    SELECT YOUR INCLUDED DISHES
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activePackage?.package_name} — Choose your included menu courses up to the required package allowance.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    {includedMenuDishes.length} / {totalAllowedDishes} Total Included Dishes
                  </span>
                </div>
              </div>

              {/* Package Inclusions Category Groups */}
              {packageCategoryStructure.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/40 space-y-2">
                  <span className="material-icons text-4xl text-gray-400">restaurant_menu</span>
                  <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">No Course Inclusions Configured</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This package does not specify course dish requirements. You may proceed to additional dishes or add-ons.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {packageCategoryStructure.map(category => {
                    const requiredCount = category.required
                    const currentCategoryDishes = selectedCategoryDishes[category.key] || []
                    const selectedCount = currentCategoryDishes.length
                    const isSatisfied = selectedCount >= requiredCount

                    // Filter real menu items belonging to this category
                    const categoryPool = dbMenuItems.filter(item => {
                      const dishKey = getDishCategoryKey(item)
                      return dishKey === category.key || (item.category && item.category.toLowerCase() === category.key.toLowerCase())
                    })

                    return (
                      <div
                        key={category.key}
                        className={`p-5 rounded-lg border transition space-y-4 ${isSatisfied
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                          }`}
                      >
                        {/* Category Header Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-700 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-[#C8102E] text-lg">{category.icon}</span>
                            <div>
                              <h4 className="font-black text-sm uppercase text-[#071A3D] dark:text-white">
                                {category.label}
                              </h4>
                              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                Included: Select <strong>{requiredCount}</strong>
                              </span>
                            </div>
                          </div>

                          <div>
                            {isSatisfied ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                                <span className="material-icons text-xs">check_circle</span>
                                <span>Selected: {selectedCount} / {requiredCount} (Satisfied)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 animate-pulse">
                                <span className="material-icons text-xs">pending</span>
                                <span>Selected: {selectedCount} / {requiredCount} (Select {requiredCount - selectedCount} more)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dishes Choice Grid with Checkboxes */}
                        {categoryPool.length === 0 ? (
                          <div className="py-6 text-center border border-dashed border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/40 text-xs text-gray-500 dark:text-gray-400">
                            No dishes found for {category.label} in the database menu catalog.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {categoryPool.map(dish => {
                              const dishId = dish.item_id || dish.id || dish.dish_id
                              const isChecked = currentCategoryDishes.some(d => (d.item_id || d.id || d.dish_id) === dishId)

                              return (
                                <div
                                  key={dishId}
                                  onClick={() => toggleIncludedCategoryDish(category.key, dish, requiredCount)}
                                  className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2.5 ${isChecked
                                    ? 'border-[#C8102E] bg-red-50/60 dark:bg-slate-900 shadow-xs ring-1 ring-[#C8102E]'
                                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${isChecked
                                      ? 'border-[#C8102E] bg-[#C8102E] text-white'
                                      : 'border-gray-400 dark:border-slate-600 bg-white dark:bg-slate-900'
                                      }`}>
                                      {isChecked && <span className="material-icons text-[10px] font-black">check</span>}
                                    </div>
                                    {dish.image && (
                                      <img
                                        src={dish.image}
                                        alt={dish.name}
                                        className="w-9 h-9 rounded object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                                      />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-[#071A3D] dark:text-white truncate">
                                        {dish.name || dish.dish_name}
                                      </div>
                                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        ₱0 (Included)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Navigation Actions & Quota Validation Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Select Package</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <span>Continue: Additional Dishes</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============ STEP 5: ADDITIONAL DISH / EXTRA FEE ========================= */}
          {/* ========================================================================= */}
          {currentStep === 5 && ((reservationType === 'hall' && includeHallPackage) || reservationType === 'catering') && (
            <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 5 of 9: Additional Dishes
                  </span>
                  <h3 className="text-lg font-black text-[#071A3D] dark:text-white">
                    ADDITIONAL DISHES
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your package inclusion is fully satisfied. Would you like to add extra dishes to your banquet menu?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg font-mono font-black text-xs ${selectedAdditionalDishes.length > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                    {selectedAdditionalDishes.length > 0
                      ? `+₱${additionalDishesCost.toLocaleString()} Additional Fee`
                      : '₱0 Additional Fee'}
                  </span>
                </div>
              </div>

              {/* Package Inclusions Satisfied Summary Card */}
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-emerald-600 text-lg">verified</span>
                    <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200">
                      Your Package Includes ({activePackage?.package_name}):
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    {totalAllowedDishes > 0 ? `${totalAllowedDishes} / ${totalAllowedDishes} Included Dishes Satisfied ✓` : 'Standard Inclusions Satisfied ✓'}
                  </span>
                </div>

                {packageCategoryStructure.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {packageCategoryStructure.map(cat => (
                      <span
                        key={cat.key}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5"
                      >
                        <span className="text-[#C8102E] font-black">{cat.required}</span>
                        <span>{cat.label}</span>
                        <span className="text-emerald-600 font-bold">✓</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 italic pt-1">
                    No specific category quotas configured for this package.
                  </div>
                )}
              </div>

              {/* Section: Want to add more? */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="font-black text-sm uppercase text-[#071A3D] dark:text-white">
                      Want to add more?
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Available Additional Dishes — clearly marked with transparent additional fees.
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                    {additionalMenuCategories.map(cat => {
                      const isAll = cat === 'all'
                      const isSelected = additionalDishCategory === cat
                      const label = isAll ? 'All Dishes' : cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setAdditionalDishCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${isSelected
                            ? 'bg-[#C8102E] text-white shadow-2xs font-extrabold'
                            : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                            }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative shrink-0 sm:w-64">
                    <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">search</span>
                    <input
                      type="text"
                      placeholder="Search extra dishes..."
                      value={additionalDishSearch}
                      onChange={e => setAdditionalDishSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-bold placeholder:font-normal focus:outline-none focus:border-[#C8102E]"
                    />
                    {additionalDishSearch && (
                      <button
                        type="button"
                        onClick={() => setAdditionalDishSearch('')}
                        className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        close
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Dishes Grid with transparent +₱ pricing */}
                {filteredAdditionalDishes.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/40 text-xs text-gray-500 dark:text-gray-400">
                    {dbMenuItems.length === 0
                      ? 'No additional dishes available from the menu database.'
                      : `No dishes found for ${additionalDishCategory !== 'all' ? additionalDishCategory : 'selected filter'}${additionalDishSearch ? ` matching "${additionalDishSearch}"` : ''}.`}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                    {filteredAdditionalDishes.map(dish => {
                      const dishId = dish.item_id || dish.id || dish.dish_id
                      const isAdded = selectedAdditionalDishes.some(d => (d.item_id || d.id || d.dish_id) === dishId)
                      const extraPrice = parseFloat(dish.price || dish.dish_price || 1500)
                      const isAlreadyIncluded = includedMenuDishes.some(d => (d.item_id || d.id || d.dish_id) === dishId)

                      return (
                        <div
                          key={dishId}
                          onClick={() => toggleAdditionalDish(dish)}
                          className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2.5 ${isAdded
                            ? 'border-[#C8102E] bg-red-50/60 dark:bg-slate-900 shadow-xs ring-1 ring-[#C8102E]'
                            : isAlreadyIncluded
                              ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 hover:border-emerald-400'
                              : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${isAdded
                              ? 'border-[#C8102E] bg-[#C8102E] text-white'
                              : 'border-gray-400 dark:border-slate-600 bg-white dark:bg-slate-900'
                              }`}>
                              {isAdded && <span className="material-icons text-[10px] font-black">check</span>}
                            </div>
                            {dish.image && (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className="w-9 h-9 rounded object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#071A3D] dark:text-white truncate">
                                {dish.name || dish.dish_name}
                              </div>
                              <div className="text-[10px] truncate">
                                {isAlreadyIncluded ? (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span>✓ 1x in Package</span>
                                    {isAdded ? <span className="text-[#C8102E] font-black">• +1 Extra Added</span> : <span className="text-gray-400 font-normal">• Add extra</span>}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">{dish.category || 'Specialty Dish'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="font-mono text-xs font-black text-[#C8102E] block">
                              +₱{extraPrice.toLocaleString()}
                            </span>
                            {isAlreadyIncluded && (
                              <span className="text-[9px] font-bold text-gray-400 uppercase block">
                                Extra Serving
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Live Additional Dishes Counter Box */}
              <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-[#071A3D] dark:text-white">
                    Additional Dishes: <strong>{selectedAdditionalDishes.length}</strong>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {selectedAdditionalDishes.length > 0
                      ? selectedAdditionalDishes.map(d => d.name || d.dish_name).join(', ')
                      : 'No additional dishes selected.'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Additional Fee</span>
                  <span className="font-mono font-black text-sm text-[#C8102E]">
                    +₱{additionalDishesCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Included Dishes</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <span>Continue: Hall Add-ons</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 6: FUNCTION HALL / CATERING ADD-ONS =============== */}
          {/* ========================================================================= */}
          {currentStep === 6 && (reservationType === 'hall' || reservationType === 'catering') && (
            <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="border-b pb-3 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 6 of 9: {reservationType === 'catering' ? 'Catering Add-ons & Equipment' : 'Hall Add-ons & Equipment'}
                  </span>
                  <h3 className="text-lg font-black text-[#071A3D] dark:text-white">
                    {reservationType === 'catering' ? 'Catering Add-ons, Styling & Equipment' : 'Event Add-ons, Audio/Visual & Equipment'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select optional equipment rentals, stage lighting, decorations, and coordinator services.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-[#C8102E] font-black text-xs shrink-0 font-mono">
                  {selectedEventAddonIds.length + selectedAddonIds.length} Added (+₱{(addonsTotal + eventAddonsTotal).toLocaleString()})
                </div>
              </div>

              {/* Add-ons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {presetEventAddons.map(addon => {
                  const isChecked = selectedEventAddonIds.includes(addon.id)
                  const cost = addon.perPax ? addon.price * Math.max(1, guestCount) : addon.price

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleEventAddon(addon.id)}
                      className={`p-3.5 rounded-lg border transition cursor-pointer select-none flex items-start gap-3 ${isChecked
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-[#C8102E] shadow-2xs'
                        : 'bg-white dark:bg-slate-800/80 border-gray-300 dark:border-slate-700 hover:border-gray-400'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        className="mt-1 text-[#C8102E] rounded accent-[#C8102E] cursor-pointer"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white leading-snug">
                          {addon.name}
                        </div>
                        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-tight">
                          {addon.desc}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            {addon.category}
                          </span>
                          <span className="font-mono font-black text-xs text-[#C8102E]">
                            ₱{cost.toLocaleString()}{addon.perPax ? ' /pax' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Customer-brought Items (Dadalhin ng Bisita) */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase text-[#071A3D] dark:text-white flex items-center gap-1.5">
                  <span className="material-icons text-sm text-amber-600">inventory_2</span>
                  <span>External / Customer-Brought Items (e.g. Sariling Lechon, Cake, Wine):</span>
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 1 Whole Roasted Lechon, 10 bote ng Red Wine..."
                    value={newCustomAddonInput}
                    onChange={e => setNewCustomAddonInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUserCustomAddon() } }}
                    className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddUserCustomAddon()}
                    className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>

                {userCustomAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {userCustomAddons.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-amber-300 text-xs font-bold text-[#071A3D] dark:text-white shadow-2xs">
                        <span>{item}</span>
                        <button type="button" onClick={() => handleRemoveUserCustomAddon(item)} className="text-gray-400 hover:text-red-600">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <span>Continue: Review Reservation</span>
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============ STEP 2: TABLE EVENT MENU RECOMMENDATION ==================== */}
          {/* ========================================================================= */}
          {currentStep === 2 && reservationType === 'table' && (
            <div className={`w-full p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-sm space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              {/* Step Header */}
              <div className="border-b pb-4 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 2 of 4: Event Menu Recommendation
                  </span>
                  <h3 className="text-xl font-black text-[#071A3D] dark:text-white flex items-center gap-2 flex-wrap">
                    <span>Curated Menu Suggestions</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#C8102E] border border-red-200 dark:border-red-900">
                      {isCustomOccasion ? customOccasionText : occasion}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart food &amp; package recommendations matching your planned event occasion and party size ({guestCount} {Number(guestCount) === 1 ? 'Guest' : 'Guests'}).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5 border border-gray-300 dark:border-slate-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900">
                    <span className="material-icons text-sm text-[#C8102E]">event</span>
                    <span>{selectedDateStr} • {timeSlot}</span>
                  </span>
                </div>
              </div>

              {/* Informative Occasion Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-50 via-amber-50 to-red-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-red-200/80 dark:border-slate-700 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C8102E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="material-icons text-base">auto_awesome</span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                  <strong className="text-[#071A3D] dark:text-white font-black block">
                    Tailored Recommendations for {isCustomOccasion ? customOccasionText : occasion} ({guestCount} {Number(guestCount) === 1 ? 'Guest' : 'Guests'})
                  </strong>
                  <span>
                    Our chef's recommendations below are curated specifically for your dining occasion. You can pre-select dishes or feast platters for your table now, or skip ahead if you prefer to order a la carte upon arrival.
                  </span>
                </div>
              </div>

              {/* Pre-Selected Dishes Banner if any */}
              {selectedMenuDishes.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 space-y-2.5 shadow-2xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span className="material-icons text-sm text-emerald-600">shopping_bag</span>
                      <span>Pre-Selected Dishes for Your Table ({selectedMenuDishes.length} items):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMenuDishes([])}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                    >
                      Clear Pre-Orders
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMenuDishes.map((dish, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-2xs"
                      >
                        <span>{dish.name || dish.dish_name}</span>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">₱{parseFloat(dish.price || dish.dish_price || 0).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedMenuDishes(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer font-black text-sm"
                          title="Remove dish"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Event-Based Menu Recommendation Component */}
              <EventBasedMenuRecommendation
                eventType={isCustomOccasion ? customOccasionText : occasion}
                guestCount={parseInt(guestCount, 10) || 4}
                showHeader={false}
                onAddDish={(dishes) => {
                  if (Array.isArray(dishes)) {
                    setSelectedMenuDishes(dishes)
                  }
                }}
                onSelectPackage={(pkg) => {
                  setSelectedPackageId(pkg.rawPackageId || pkg.id)
                  if (showToast) showToast(`Selected ${pkg.package_name || pkg.name} for your event!`, 'success')
                }}
              />

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Reservation Details</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs hover:shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <span>
                      {selectedMenuDishes.length > 0 
                        ? `Continue with Pre-Orders (${selectedMenuDishes.length} Dishes)` 
                        : 'Continue: Payment & Review'}
                    </span>
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============ STEP 3: TABLE REVIEW RESERVATION & PAYMENT ================== */}
          {/* ========================================================================= */}
          {currentStep === 3 && reservationType === 'table' && (
            <div className={`w-full p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-sm space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              {/* Step Header */}
              <div className="border-b pb-4 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                    Step 3 of 4: Payment &amp; Review
                  </span>
                  <h3 className="text-xl font-black text-[#071A3D] dark:text-white">
                    Review &amp; Confirm Table Reservation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select your payment method (GCash / Maya) and verify your contact details before confirming.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5 border border-gray-300 dark:border-slate-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900">
                    <span className="material-icons text-sm text-[#C8102E]">table_restaurant</span>
                    <span>Table Reservation</span>
                  </span>
                </div>
              </div>

              {/* 2-Column Balanced Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left (7 cols): Contact Information & Payment Channels */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Section 1: Contact Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#071A3D] dark:text-white flex items-center gap-1.5">
                      <span className="material-icons text-sm text-[#C8102E]">person</span>
                      <span>Primary Contact Details</span>
                    </h4>

                    {currentUser ? (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm uppercase shrink-0 shadow-2xs">
                            {(currentUser.full_name || currentUser.username || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                              {currentUser.full_name || currentUser.username}
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400">
                              {currentUser.phone || currentUser.email || 'Verified Diner Account'}
                            </div>
                          </div>
                        </div>
                        <span className="material-icons text-emerald-600 text-2xl">verified</span>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl bg-gray-50/60 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Full Name <span className="text-[#C8102E]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Maria Santos"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E] transition shadow-2xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                              Phone Number <span className="text-[#C8102E]">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="09171234567"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E] transition shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              placeholder="name@gmail.com"
                              value={customerEmail}
                              onChange={e => setCustomerEmail(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E] transition shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Payment Method (Direct to PayMongo for GCash & Maya) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#071A3D] dark:text-white flex items-center gap-1.5">
                        <span className="material-icons text-sm text-[#C8102E]">account_balance_wallet</span>
                        <span>Select Payment Method (Direct PayMongo)</span>
                        <span className="text-[#C8102E]">*</span>
                      </h4>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Choose payment channel</span>
                    </div>

                    {/* Payment Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'GCash', title: 'GCash', subtitle: 'PayMongo Direct', icon: gcashIcon },
                        { key: 'Maya', title: 'Maya Wallet', subtitle: 'PayMongo Direct', icon: mayaIcon },
                        { key: 'Cash', title: 'Pay at Counter', subtitle: 'Cashier Settlement', icon: counterPaymentIcon }
                      ].map((item) => {
                        const isSelected = paymentMethod === item.key
                        return (
                          <div
                            key={item.key}
                            onClick={() => setPaymentMethod(item.key)}
                            className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center relative flex flex-col items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'border-[#C8102E] bg-red-50/70 dark:bg-slate-900 ring-2 ring-[#C8102E]/30 shadow-xs'
                                : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                            }`}
                          >
                            <div className="w-12 h-12 flex items-center justify-center p-1 bg-white dark:bg-slate-950 rounded-lg shadow-2xs border border-gray-100 dark:border-slate-800">
                              <img src={item.icon} alt={item.title} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div>
                              <div className="font-black text-xs text-[#071A3D] dark:text-white">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.subtitle}
                              </div>
                            </div>
                            <span className={`material-icons text-base ${isSelected ? 'text-[#C8102E]' : 'text-gray-300 dark:text-gray-600'}`}>
                              {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* PayMongo Direct Gateway Information Box */}
                    {(paymentMethod === 'GCash' || paymentMethod === 'Maya') ? (
                      <div className="p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 space-y-3.5 shadow-2xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
                          <div className="inline-flex items-center gap-2 bg-[#0E1714] border border-[#00C389]/40 rounded-lg px-2.5 py-1">
                            <img src={paymongoLogo} alt="PayMongo" className="h-4 sm:h-5 object-contain" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 pl-1 border-l border-emerald-800 hidden sm:inline-block">
                              Official Gateway
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span className="material-icons text-xs">verified</span>
                            <span>Direct PayMongo Checkout</span>
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="font-bold text-[#071A3D] dark:text-white flex items-center gap-1.5">
                            <span className="material-icons text-sm text-[#00C389]">bolt</span>
                            <span>Instant Checkout with {paymentMethod}:</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-[11.5px] leading-relaxed">
                            Clicking the confirmation button below will direct you securely to the <strong>PayMongo checkout portal</strong> to authorize your payment using your <strong>{paymentMethod}</strong> account. No manual phone transfer or reference copying needed!
                          </p>
                        </div>

                        {/* Table Deposit Explainer */}
                        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
                          <span className="material-icons text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 shrink-0">payments</span>
                          <div className="text-[11px] leading-snug">
                            <strong className="text-emerald-950 dark:text-emerald-200 font-bold block">
                              Advance Table Holding Deposit: ₱100.00
                            </strong>
                            <span className="text-emerald-800 dark:text-emerald-300">
                              This deposit guarantees your table reservation and is <strong>100% credited / deductible</strong> towards your food order upon arrival at Jo's Diner.
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">lock</span>
                            <span>256-Bit SSL Encrypted</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">security</span>
                            <span>PCI-DSS Certified</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">done_all</span>
                            <span>Auto-Verified by PayMongo</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
                        <div className="font-bold text-[#071A3D] dark:text-white flex items-center gap-1.5">
                          <span className="material-icons text-sm text-amber-600">storefront</span>
                          <span>Pay at Cashier Counter</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-[11.5px] leading-relaxed">
                          Settle your bill in cash directly at the Jo's Diner cashier counter upon arrival. Table reservation is <strong>100% FREE</strong> with no upfront online payment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Instant Check-in QR pass callout */}
                  <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 flex items-center justify-center text-[#C8102E] shrink-0 shadow-2xs">
                      <span className="material-icons text-base">qr_code_2</span>
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                      <strong className="text-[#071A3D] dark:text-white font-bold block">Instant Diner Pass</strong>
                      A digital QR pass will be generated for quick check-in upon your arrival.
                    </div>
                  </div>
                </div>

                {/* Right (5 cols): Reservation Summary */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                    <div className="border-b pb-2.5 border-gray-200 dark:border-slate-700/80 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#071A3D] dark:text-white flex items-center gap-1.5">
                        <span className="material-icons text-sm text-[#C8102E]">receipt_long</span>
                        <span>Reservation Summary</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950 text-[#C8102E] border border-red-200 dark:border-red-900">
                        Dining Table
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-gray-400">calendar_today</span>
                          <span>Date</span>
                        </span>
                        <span className="font-extrabold text-[#071A3D] dark:text-white">
                          {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-gray-400">schedule</span>
                          <span>Time</span>
                        </span>
                        <span className="font-mono font-bold text-[#071A3D] dark:text-white">{timeSlot}</span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-gray-400">people</span>
                          <span>Party Size</span>
                        </span>
                        <span className="font-bold text-[#071A3D] dark:text-white">{guestCount} Guests</span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-gray-400">celebration</span>
                          <span>Occasion</span>
                        </span>
                        <span className="font-bold text-[#071A3D] dark:text-white">
                          {(isCustomOccasion ? customOccasionText : occasion) || 'Casual Dining / Normal'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shrink-0">
                          <span className="material-icons text-xs text-gray-400">note_alt</span>
                          <span>Special Request</span>
                        </span>
                        <span className="font-medium text-[#071A3D] dark:text-white text-right truncate max-w-[170px]">
                          {specialRequest || 'None'}
                        </span>
                      </div>

                      {/* Payment Method in Summary */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-gray-400">account_balance_wallet</span>
                          <span>Payment</span>
                        </span>
                        <span className="font-extrabold text-[#C8102E] flex items-center gap-1">
                          {paymentMethod === 'Cash' ? 'Pay at Counter' : `PayMongo (${paymentMethod})`}
                        </span>
                      </div>

                      <div className="pt-1 flex items-center justify-between font-bold text-xs">
                        <span className="text-gray-600 dark:text-gray-300">
                          {paymentMethod === 'Cash' ? 'Reservation Fee:' : 'Table Holding Deposit:'}
                        </span>
                        {paymentMethod === 'Cash' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            FREE
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-[#071A3D] dark:text-white">
                            ₱100.00 <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Consumable)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between font-black text-sm pt-2 border-t border-dashed border-gray-300 dark:border-slate-700">
                        <span className="text-[#071A3D] dark:text-white">TOTAL DUE NOW</span>
                        <span className="font-mono text-base text-[#C8102E]">
                          {paymentMethod === 'Cash' ? '₱0.00' : '₱100.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons across full width */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span>Back: Menu Recommendations</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmitReservation}
                  className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting to PayMongo...</span>
                    </>
                  ) : paymentMethod === 'Cash' ? (
                    <>
                      <span className="material-icons text-sm">check_circle</span>
                      <span>Confirm Table Reservation</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-sm">open_in_new</span>
                      <span>Proceed to PayMongo ({paymentMethod})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ============ STEP 4: TABLE CONFIRMATION ================================= */}
          {/* ========================================================================= */}
          {currentStep === 4 && reservationType === 'table' && confirmedReservation && (
            <div className={`p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-xl space-y-6 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-icons text-4xl">check_circle</span>
              </div>

              <div className="space-y-1.5">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-300 inline-block">
                  ✓ RESERVATION CONFIRMED
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#071A3D] dark:text-white pt-1">
                  Reservation #{confirmedReservation.reservation_code || confirmedReservation.id || 'TAB-1025'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Your table has been reserved. Table assignment will be handled upon arrival.
                </p>
              </div>

              {/* QR Code Pass Card */}
              <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 max-w-sm mx-auto space-y-3 shadow-2xs">
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 inline-block">
                    <QRCodeSVG
                      value={confirmedReservation.reservation_code || confirmedReservation.id || 'TAB-1025'}
                      size={150}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-black text-[#071A3D] dark:text-white">
                    {new Date((confirmedReservation.event_date || selectedDateStr) + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 font-bold">
                    {confirmedReservation.event_time || timeSlot} • {confirmedReservation.guest_count || guestCount} Guests
                  </div>
                  <div className="text-[11px] text-[#C8102E] font-bold">
                    Occasion: {confirmedReservation.occasion || (isCustomOccasion ? customOccasionText : occasion) || 'Casual Dining'}
                  </div>
                  {confirmedReservation.payment_method && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium pt-0.5">
                      Payment: <strong className="text-gray-800 dark:text-gray-200 font-bold">{confirmedReservation.payment_method}</strong>
                      {confirmedReservation.payment_reference && (
                        <span className="font-mono text-[11px] text-[#C8102E] ml-1 font-bold">({confirmedReservation.payment_reference})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQRPassModal(true)}
                    className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-[#C8102E] border border-red-200 dark:border-red-900 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-sm">fullscreen</span>
                    <span>View Official QR Pass</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/my-reservations')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <span className="material-icons text-sm">visibility</span>
                  <span>View Reservation</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-icons text-sm">home</span>
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 7: REVIEW RESERVATION (HALL & CATERING) ========== */}
          {/* ========================================================================= */}
          {currentStep === 7 && (reservationType === 'hall' || reservationType === 'catering') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
              {/* Left 7 Cols: Contact Details & Special Notes */}
              <div className="lg:col-span-7 space-y-4">
                <div className={`p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-4 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
                  <div className="border-b pb-3 border-gray-200 dark:border-slate-700">
                    <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                      Step 7 of 9: Primary Contact &amp; Review
                    </span>
                    <h3 className="text-base font-black text-[#071A3D] dark:text-white">
                      Primary Contact &amp; Event Instructions
                    </h3>
                  </div>

                  {currentUser ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs uppercase shrink-0">
                          {(currentUser.full_name || currentUser.username || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                            {currentUser.full_name || currentUser.username}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            {currentUser.phone || currentUser.email || 'Verified Diner Account'}
                          </div>
                        </div>
                      </div>
                      <span className="material-icons text-emerald-600 text-lg">verified</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maria Santos"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="09171234567"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="name@gmail.com"
                            value={customerEmail}
                            onChange={e => setCustomerEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                      Special Request / Setup Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Surprise birthday setup, wheelchair access, halal meals, high chairs..."
                      value={specialRequest}
                      onChange={e => setSpecialRequest(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-medium text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Live Quotation Summary Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`p-5 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-4 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
                  <div className="border-b pb-2.5 border-gray-200 dark:border-slate-700">
                    <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Quotation Summary</span>
                    <h4 className="text-sm font-black text-[#071A3D] dark:text-white">
                      Estimated Reservation Cost
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-extrabold text-[#C8102E] uppercase">{reservationType}</span>
                    </div>

                    {reservationType === 'catering' && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Venue Location:</span>
                        <span className="font-extrabold text-[#071A3D] dark:text-white truncate max-w-[190px]">
                          {venueType === 'diner_function_hall' 
                            ? `Jo's Diner (${activeHall?.name || 'Function Hall'})` 
                            : `${venueName || "Customer's Venue"} (${venueCity || 'Polomolok'})`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-gray-500">Event:</span>
                      <span className="font-extrabold text-[#071A3D] dark:text-white truncate max-w-[180px]">
                        {eventName.trim() || occasion}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-gray-500">Date &amp; Time:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {selectedDateStr} ({reservationType === 'hall' ? `${formatTimeDisplay(hallStartTime)} - ${formatTimeDisplay(hallEndTime)}` : timeSlot})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-gray-500">Party Size:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{guestCount} Pax</span>
                    </div>

                    {reservationType === 'hall' && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Hall Rental ({getHallDurationHours()} hrs):</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          ₱{(parseFloat(activeHall?.rate_per_hour || 1250) * getHallDurationHours()).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {((reservationType === 'hall' && includeHallPackage) || reservationType === 'catering') && activePackage && (
                      <>
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                          <div>
                            <span className="text-gray-500 block">Food Package ({activePackage.package_name}):</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ {includedMenuDishes.length} Included Dishes Selected
                            </span>
                          </div>
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                            ₱{parseFloat(activePackage.package_price || 0).toLocaleString()}
                          </span>
                        </div>
                        {selectedAdditionalDishes.length > 0 && (
                          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800 text-amber-700 dark:text-amber-400">
                            <div>
                              <span className="block font-bold">Additional Dishes ({selectedAdditionalDishes.length}):</span>
                              <span className="text-[10px] text-gray-500 block">
                                {selectedAdditionalDishes.map(d => d.name || d.dish_name).join(', ')}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-[#C8102E] shrink-0">+₱{additionalDishesCost.toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    )}

                    {(selectedAddonsList.length > 0 || selectedEventAddonsList.length > 0) && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Add-ons Total:</span>
                        <span className="font-mono text-[#C8102E] font-bold">+₱{(addonsTotal + eventAddonsTotal).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-black text-xs text-[#071A3D] dark:text-white uppercase">Estimated Total:</span>
                      <span className="font-black text-base text-[#C8102E] font-mono">
                        {calculateTotalAmount() > 0 ? `₱${calculateTotalAmount().toLocaleString()}` : '₱0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-3 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span className="material-icons text-base">payments</span>
                      <span>Proceed to Payment / Checkout</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-full py-2 rounded-md border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-icons text-sm">arrow_back</span>
                      <span>Back to Previous Step</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 8: PAYMENT / CHECKOUT ============================ */}
          {/* ========================================================================= */}
          {currentStep === 8 && (reservationType === 'hall' || reservationType === 'catering') && (
            <div className={`p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-sm space-y-6 animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              {/* Step Header */}
              <div className="border-b pb-4 border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900">
                      Step 8 of 9
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-icons text-xs text-emerald-600">lock</span>
                      <span>Secure Checkout</span>
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#071A3D] dark:text-white">
                    Payment &amp; Checkout
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Select your preferred payment channel to finalize and secure your {reservationType === 'catering' ? 'catering booking' : 'function hall reservation'}.
                  </p>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center p-3 sm:p-0 bg-gray-50 dark:bg-slate-800/60 sm:bg-transparent rounded-lg border sm:border-0 border-gray-200 dark:border-slate-700">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Total Amount Due
                  </span>
                  <span className="font-mono font-black text-xl sm:text-2xl text-[#C8102E]">
                    ₱{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (7 cols): Payment Channels & Instructions */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Section 1: Choose Payment Channel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white text-[10px] font-black flex items-center justify-center">1</span>
                        <span>Select Payment Channel</span>
                      </label>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Choose where to send your payment</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(PAYMENT_INFO).map(([key, info]) => {
                        const isSelected = paymentMethod === key
                        return (
                          <div
                            key={key}
                            onClick={() => setPaymentMethod(key)}
                            className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center relative flex flex-col items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'border-[#C8102E] bg-red-50/70 dark:bg-slate-900 ring-2 ring-[#C8102E]/30 shadow-xs'
                                : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-400'
                            }`}
                          >
                            <div className="w-12 h-12 flex items-center justify-center p-1 bg-white dark:bg-slate-950 rounded-lg shadow-2xs border border-gray-100 dark:border-slate-800">
                              <img src={info.icon} alt={info.title} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="font-black text-xs text-[#071A3D] dark:text-white line-clamp-1">
                              {info.title}
                            </div>
                            <span className={`material-icons text-base ${isSelected ? 'text-[#C8102E]' : 'text-gray-300 dark:text-gray-600'}`}>
                              {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Section 2: Account Details Box */}
                  {PAYMENT_INFO[paymentMethod] && (
                    <div className="p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                          Official Recipient Account
                        </span>
                        <span className="text-[11px] font-bold text-[#C8102E] bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                          {PAYMENT_INFO[paymentMethod].title}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Account Name</div>
                          <div className="font-black text-xs sm:text-sm text-[#071A3D] dark:text-white">
                            {PAYMENT_INFO[paymentMethod].accountName}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Account / Mobile Number</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs sm:text-sm text-[#C8102E] tracking-wider">
                              {PAYMENT_INFO[paymentMethod].accountNumber}
                            </span>
                            {PAYMENT_INFO[paymentMethod].accountNumber !== 'Over-the-Counter Deposit' && (
                              <button
                                type="button"
                                onClick={() => handleCopyAccountNumber(PAYMENT_INFO[paymentMethod].accountNumber)}
                                className="px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-icons text-xs">{copiedAccountNumber ? 'check' : 'content_copy'}</span>
                                <span>{copiedAccountNumber ? 'Copied' : 'Copy'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-2">
                        <span className="material-icons text-sm text-blue-600 shrink-0 mt-0.5">info</span>
                        <span>{PAYMENT_INFO[paymentMethod].instructions}</span>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Reference Code Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Payment Reference / Transaction ID</span>
                      {paymentMethod === 'Cash' ? (
                        <span className="text-[10px] text-gray-400 font-normal normal-case">(Optional for Counter Cash)</span>
                      ) : (
                        <span className="text-[#C8102E]">*</span>
                      )}
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder={paymentMethod === 'Cash' ? "Optional notes or cashier counter memo..." : "e.g. GCash Ref # 1002 9384 1928, Maya Trace # 938210..."}
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold text-[#071A3D] dark:text-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column (5 cols): Order Summary & Confirm Button */}
                <div className="lg:col-span-5 space-y-4">
                  <div className={`p-5 sm:p-6 rounded-xl border border-gray-300 dark:border-slate-700 shadow-xs space-y-4 ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
                    <div className="border-b pb-3 border-gray-200 dark:border-slate-700">
                      <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Reservation Summary</span>
                      <h4 className="text-sm font-black text-[#071A3D] dark:text-white">
                        {reservationType === 'catering' ? 'Catering Event Quotation' : 'Function Hall Booking'}
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Service:</span>
                        <span className="font-extrabold text-[#C8102E] uppercase">{reservationType === 'catering' ? 'Catering Buffet' : 'Function Hall Rental'}</span>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Venue / Location:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                          {reservationType === 'hall' ? activeHall?.name : (venueType === 'diner_function_hall' ? "Jo's Diner Hall" : (venueName || 'Customer Venue'))}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Scheduled Date:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{selectedDateStr}</span>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500">Guest Count:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{guestCount} Pax</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">Total Quotation:</span>
                          <span className="font-mono font-black text-sm text-[#071A3D] dark:text-white">₱{grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Amount Due Now:</span>
                          <span className="font-mono font-black text-base text-[#C8102E]">₱{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleFinalSubmitReservation}
                        className="w-full py-3 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Processing Reservation...</span>
                        ) : (
                          <>
                            <span className="material-icons text-base">verified</span>
                            <span>Confirm &amp; Finalize Booking</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-icons text-sm">arrow_back</span>
                        <span>Back: Review Details</span>
                      </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-xs text-emerald-600">verified</span>
                        <span>Instant QR Pass &amp; Confirmation Receipt generated</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-xs text-emerald-600">mark_email_read</span>
                        <span>Booking copy sent to your email address</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ================= STEP 9: CONFIRMATION SUCCESS (HALL & CATERING) ========= */}
          {/* ========================================================================= */}
          {currentStep === 9 && (reservationType === 'hall' || reservationType === 'catering') && confirmedReservation && (
            <div className={`p-6 sm:p-8 rounded-xl border border-gray-300 dark:border-slate-700 shadow-xl space-y-6 max-w-3xl mx-auto text-center ${isDarkMode ? 'bg-[#071A3D]' : 'bg-white'}`}>
              <img
                src={confirmReservationIcon}
                alt="Confirmed"
                className="w-20 h-20 mx-auto object-contain animate-in zoom-in-95 duration-200"
              />

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  <span>REF:</span>
                  <span className="text-[#C8102E] font-black">{confirmedReservation.id}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="uppercase text-[10px]">{confirmedReservation.status}</span>
                </div>

                <h3 className="text-2xl font-black text-[#071A3D] dark:text-white pt-1">
                  {reservationType === 'catering' ? 'Catering Reservation Confirmed!' : 'Function Hall Reservation Confirmed!'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Thank you, <strong>{confirmedReservation.contact_person || confirmedReservation.contact_name}</strong>. Your {reservationType === 'catering' ? 'catering event' : 'venue booking'} has been recorded. Present your official QR Code upon arrival.
                </p>
              </div>

              {/* QR Code Pass Card */}
              <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 inline-block">
                    <QRCodeSVG
                      value={confirmedReservation.reservation_code || confirmedReservation.id}
                      size={160}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-black text-[#071A3D] dark:text-white">
                    {confirmedReservation.hall_name || confirmedReservation.venue_name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {new Date(confirmedReservation.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {confirmedReservation.event_time}
                  </div>
                  <div className="font-mono text-[#C8102E] font-black pt-1">
                    Total: ₱{confirmedReservation.total_amount?.toLocaleString()} (Paid: ₱{confirmedReservation.amount_paid?.toLocaleString() || confirmedReservation.total_amount?.toLocaleString()})
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQRPassModal(true)}
                    className="py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-[#C8102E] border border-red-200 dark:border-red-900 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-sm">fullscreen</span>
                    <span>View Pass</span>
                  </button>

                  <button
                    type="button"
                    disabled={isResendingEmail}
                    onClick={handleResendConfirmationEmail}
                    className="py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-icons text-sm">{resendEmailSuccess ? 'check' : 'send'}</span>
                    <span>{resendEmailSuccess ? 'Sent to Gmail!' : 'Resend Email'}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedReservation(null)
                    resetBookingForm('hall')
                  }}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Book Another Event
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/my-reservations')}
                  className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  View My Reservations
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Full Screen / Printable QR Pass Modal */}
      {showQRPassModal && confirmedReservation && (
        <ReservationQRPass
          reservation={confirmedReservation}
          onClose={() => setShowQRPassModal(false)}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  )
}

export default Reservation
