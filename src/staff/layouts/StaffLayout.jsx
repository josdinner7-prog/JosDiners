import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import logo from '../../assets/logo.png'
import { useAuth } from '../../auth/AuthContext'
import QRScannerModal from '../../components/QRScannerModal'
import api from '../../services/api'

const tabToPath = {
  dashboard: '/staff',
  pos: '/staff/pos',
  orders: '/staff/orders',
  payments: '/staff/payments',
  reservations: '/staff/reservations',
  beo: '/staff/beo',
  'staff-schedule': '/staff/staff-schedule',
  inventory: '/staff/inventory',
  menu: '/staff/menu',
  packages: '/staff/packages',
  halls: '/staff/halls',
  messages: '/staff/messages',
  analytics: '/staff/analytics',
}

const pathToTab = {
  '/staff': 'dashboard',
  '/staff/': 'dashboard',
  '/staff/pos': 'pos',
  '/staff/orders': 'orders',
  '/staff/payments': 'payments',
  '/staff/reservations': 'reservations',
  '/staff/beo': 'beo',
  '/staff/staff-schedule': 'staff-schedule',
  '/staff/inventory': 'inventory',
  '/staff/menu': 'menu',
  '/staff/packages': 'packages',
  '/staff/halls': 'halls',
  '/staff/messages': 'messages',
  '/staff/analytics': 'analytics',
}

function StaffLayout({ staffUser: propStaffUser, onLogout, onSwitchToCustomer }) {
  const { showToast } = useToast()
  const { staffUser: authStaffUser, logoutStaff } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const staffUser = propStaffUser || authStaffUser

  const handleLogout = () => {
    if (onLogout) onLogout()
    logoutStaff()
    showToast('Logged out of Staff Portal.', 'info')
    navigate('/Rolelogin')
  }

  const handleSwitchToCustomer = () => {
    if (onSwitchToCustomer) onSwitchToCustomer()
    navigate('/')
  }

  const currentPath = location.pathname.toLowerCase().replace(/\/$/, '')
  const activeTab = pathToTab[currentPath] || 'dashboard'

  const setActiveTab = (tabId) => {
    const targetPath = tabToPath[tabId] || (tabId.startsWith('/') ? tabId : `/staff/${tabId}`)
    navigate(targetPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [isShiftDarkMode, setIsShiftDarkMode] = useState(() => {
    return localStorage.getItem('jos_staff_dark_mode') === 'true'
  })

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [accountTab, setAccountTab] = useState('profile')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Automatically close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)
  const notifMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem('jos_staff_op_tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    localStorage.setItem('jos_staff_dark_mode', isShiftDarkMode)
  }, [isShiftDarkMode])

  const [currentTime, setCurrentTime] = useState(new Date())
  const [shiftStartTime] = useState(() => new Date(Date.now() - 4 * 3600000 - 18 * 60000))

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getElapsedShiftTime = () => {
    const diffMs = currentTime.getTime() - shiftStartTime.getTime()
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    return `${hours}h ${mins}m active`
  }

  const displayName = staffUser?.full_name || staffUser?.name || staffUser?.username || 'Maria Santos'
  const [staffName, setStaffName] = useState(displayName)
  const [staffUsername, setStaffUsername] = useState(staffUser?.username || 'staff')
  const [staffEmail, setStaffEmail] = useState(staffUser?.email || 'staff@josdiner.com.ph')
  const [employeeId, setEmployeeId] = useState(staffUser?.id || staffUser?.user_id || 'EMP-104')
  const [phone, setPhone] = useState('0917-555-0199')
  const [assignedRegister] = useState('Front Counter')
  const [shiftName] = useState('Morning Shift (08:00 AM - 04:00 PM)')

  useEffect(() => {
    if (staffUser) {
      setStaffName(staffUser.full_name || staffUser.name || staffUser.username || 'Maria Santos')
      setStaffUsername(staffUser.username || 'staff')
      if (staffUser.email) setStaffEmail(staffUser.email)
      if (staffUser.id || staffUser.user_id) setEmployeeId(staffUser.id || staffUser.user_id)
    }
  }, [staffUser])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const roleLabel = (staffUser?.role || 'staff').toUpperCase()

  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [unpaidCounterOrdersCount, setUnpaidCounterOrdersCount] = useState(0)

  const operationalTabs = [
    { id: 'dashboard', label: 'Shift Overview', icon: 'space_dashboard' },
    {
      id: 'pos',
      label: 'POS Terminal',
      icon: 'point_of_sale',
      badge: unpaidCounterOrdersCount > 0 ? `${unpaidCounterOrdersCount} DUE` : 'FAST POS',
      badgeColor: unpaidCounterOrdersCount > 0 ? 'bg-[#C8102E] text-white font-bold' : null
    },
    {
      id: 'orders',
      label: 'Dispatch Orders',
      icon: 'receipt_long',
      badge: newOrdersCount > 0 ? `${newOrdersCount} NEW` : null,
      badgeColor: newOrdersCount > 0 ? 'bg-[#C8102E] text-white font-bold' : null
    },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'reservations', label: 'Reservations', icon: 'event_available', badge: '2 TODAY' },
    { id: 'beo', label: 'Banquet Orders (BEO)', icon: 'fact_check', badge: 'BEO' },
    { id: 'staff-schedule', label: 'Event Staff Roster', icon: 'schedule_send', badge: 'ROSTER' },
    { id: 'inventory', label: 'Catering Inventory', icon: 'warehouse', badge: 'DUAL-TRACK' },
    { id: 'menu', label: 'Menu & Stock', icon: 'restaurant_menu' },
    { id: 'packages', label: 'Catering & Events', icon: 'celebration' },
    { id: 'halls', label: 'Function Halls', icon: 'meeting_room' },
    { id: 'messages', label: 'Shift Notes', icon: 'forum', badge: '1 NEW' },
    { id: 'analytics', label: 'Shift Sales', icon: 'insights' },
  ]

  const [staffNotifications, setStaffNotifications] = useState([])
  const [staffUnreadCount, setStaffUnreadCount] = useState(0)

  const loadStaffNotifs = async () => {
    try {
      const res = await api.notifications.getNotifications({ role: 'staff', limit: 8 })
      if (res?.status === 'success') {
        setStaffNotifications(res.notifications || [])
        setStaffUnreadCount(res.unread_count || 0)
      }
    } catch (e) { }

    try {
      const ordersRes = await api.orders.getOrders()
      const list = (ordersRes?.status === 'success' && Array.isArray(ordersRes.orders || ordersRes.data)) ? (ordersRes.orders || ordersRes.data) : []
      // Only PAID orders appear in the Dispatch Kanban
      const paidPending = list.filter(o => (o.status === 'New' || o.status === 'Pending') && (o.payment_status || '').toLowerCase() === 'paid')
      const unpaidCounter = list.filter(o => (o.status === 'New' || o.status === 'Pending') && (o.payment_status || '').toLowerCase() !== 'paid')
      setNewOrdersCount(paidPending.length)
      setUnpaidCounterOrdersCount(unpaidCounter.length)
    } catch (e) { }
  }

  useEffect(() => {
    loadStaffNotifs()
    const interval = setInterval(loadStaffNotifs, 15000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleSaveAccount = (e) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error')
      return
    }
    showToast('Staff account settings updated successfully!', 'success')
    setIsAccountModalOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isShiftDarkMode ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}>

      <header className={`sticky top-0 z-40 transition-colors duration-300 border-b ${isShiftDarkMode
        ? 'bg-[#1C2541] border-slate-600 shadow-lg text-white'
        : 'bg-white border-slate-400 shadow-sm text-slate-900'
        }`}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8">

          <div className="h-14 flex items-center justify-between gap-4 py-1">

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img src={logo} alt="Jo's Diner" className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform hover:scale-105" />
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`jos-diner-brand-title text-sm sm:text-base font-black block leading-none tracking-wide text-left ${isShiftDarkMode ? '!text-white' : '!text-[#C8102E]'}`}>
                    JO'S DINER
                  </span>
                  <span className="bg-emerald-500 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span className="hidden xs:inline">STAFF PORTAL</span>
                    <span className="xs:hidden">STAFF</span>
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-slate-400 font-semibold truncate">
                  Counter POS & Shift Workspace
                </p>
              </div>
            </div>

            <div className={`hidden lg:flex items-center gap-4 text-xs font-bold transition ${isShiftDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{shiftName}</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-600 dark:text-emerald-400">{getElapsedShiftTime()} active</span>
              <span className="text-slate-400">|</span>
              <span className="text-[#C8102E] dark:text-amber-300">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">

              {/* Instant QR Check-in Button (Desktop only) */}
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Scan Customer Reservation QR Pass"
              >
                <span className="material-icons text-base">qr_code_scanner</span>
                <span className="hidden sm:inline">Scan QR Pass</span>
              </button>

              {/* Theme Toggle (Desktop only) */}
              <button
                onClick={() => setIsShiftDarkMode(!isShiftDarkMode)}
                className={`hidden md:flex p-1.5 sm:p-2 rounded-xl transition active:scale-95 items-center justify-center cursor-pointer ${isShiftDarkMode
                  ? 'text-[#F59E0B] hover:bg-slate-800/80 hover:text-amber-400'
                  : 'text-[#071A3D] hover:bg-gray-100 hover:text-[#C8102E]'
                  }`}
                title={isShiftDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isShiftDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-icons text-xl">
                  {isShiftDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen)
                    setIsUserMenuOpen(false)
                  }}
                  className={`relative p-1.5 sm:p-2 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer ${isShiftDarkMode
                    ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-[#071A3D] hover:bg-gray-100 hover:text-[#C8102E]'
                    }`}
                  title="Shift Notifications"
                  aria-label="Shift Notifications"
                >
                  <span className="material-icons text-xl">notifications</span>
                  {staffUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#C8102E] text-white font-extrabold text-[9px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
                      {staffUnreadCount > 9 ? '9+' : staffUnreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-2xl border p-3 z-50 transform animate-in fade-in zoom-in-95 duration-150 ${isShiftDarkMode ? 'bg-[#1C2541] border-slate-700 text-white shadow-black/60' : 'bg-white border-gray-300 text-[#071A3D] shadow-gray-200/80'
                    }`}>
                    <div className="flex items-center justify-between border-b pb-2.5 mb-2.5 border-slate-400 dark:border-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs">Live Shift &amp; Booking Alerts</span>
                      </div>
                      {staffUnreadCount > 0 ? (
                        <span className="text-[10px] bg-red-100 text-[#C8102E] font-black px-2 py-0.5 rounded-full border border-red-300">
                          {staffUnreadCount} New
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          All Caught Up
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                      {staffNotifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <span className="material-icons text-2xl">notifications_none</span>
                          <p className="text-xs font-semibold mt-1">No alerts recorded yet</p>
                        </div>
                      ) : (
                        staffNotifications.map((n) => {
                          const isUnread = !n.is_read
                          return (
                            <div
                              key={n.notification_id}
                              onClick={async () => {
                                if (isUnread) {
                                  try {
                                    await api.notifications.markAsRead(n.notification_id, true)
                                    setStaffUnreadCount(prev => Math.max(0, prev - 1))
                                  } catch (e) { }
                                }
                                setIsNotificationsOpen(false)
                                if (n.action_url) navigate(n.action_url)
                              }}
                              className={`flex gap-2.5 text-xs p-2.5 rounded-xl transition cursor-pointer border ${isShiftDarkMode
                                ? isUnread ? 'bg-red-950/40 border-red-800 hover:bg-red-950/60' : 'bg-slate-800/80 border-slate-600 hover:bg-slate-800'
                                : isUnread ? 'bg-red-50/70 border-red-200 hover:bg-red-50' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                                }`}
                            >
                              <span className="material-icons text-base text-[#C8102E] shrink-0 mt-0.5">
                                {n.type === 'approval_notice' ? 'fact_check' : n.type === 'payment_confirmation' ? 'payments' : 'event_available'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-extrabold truncate">{n.title}</p>
                                  {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] shrink-0" />}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                                {n.reservation_code && (
                                  <span className="inline-block mt-1 font-mono font-bold text-[10px] text-slate-500 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                                    {n.reservation_code}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-300 dark:border-slate-600 mt-2 flex items-center justify-between gap-2">
                      {staffUnreadCount > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await api.notifications.markAllAsRead({ role: 'staff' })
                              setStaffNotifications(prev => prev.map(item => ({ ...item, is_read: 1 })))
                              setStaffUnreadCount(0)
                              showToast('All notifications marked read.', 'success')
                            } catch (e) { }
                          }}
                          className="text-[11px] font-bold text-[#C8102E] hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer ml-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Staff User Menu (Desktop only) */}
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen)
                    setIsNotificationsOpen(false)
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition active:scale-95 cursor-pointer ${isShiftDarkMode
                    ? 'text-white hover:bg-slate-800/80'
                    : 'text-[#071A3D] hover:bg-gray-100'
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                    {staffName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-extrabold leading-tight truncate max-w-[110px]">{staffName}</p>
                    <p className="text-[9px] text-[#C8102E] font-extrabold uppercase tracking-wider">{roleLabel}</p>
                  </div>
                  <span className={`material-icons text-sm sm:text-base text-[#C8102E] transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}>
                    keyboard_arrow_down
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-50 transform animate-in fade-in zoom-in-95 duration-150 ${isShiftDarkMode
                      ? 'bg-[#1C2541] border-slate-700 text-white shadow-black/60'
                      : 'bg-white border-gray-300 text-[#071A3D] shadow-gray-200/80'
                    }`}
                  >
                    {/* User Info Header Banner (Identical style to CustomerHeader) */}
                    <div className={`p-3 rounded-lg mb-1 flex items-center gap-3 border ${isShiftDarkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="w-10 h-10 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-sm font-black uppercase shadow-xs shrink-0">
                        {staffName ? staffName.substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-extrabold truncate">{staffName}</p>
                          <span className="material-icons text-xs text-emerald-500" title="Active Staff">verified</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono font-bold truncate">{employeeId} • {roleLabel}</p>
                        <p className="text-[10px] text-gray-400 truncate">{staffEmail}</p>
                      </div>
                    </div>

                    {/* Duty Assignment Row */}
                    <div className={`px-2.5 py-1 mb-1.5 rounded-md flex justify-between items-center text-[10px] border ${
                      isShiftDarkMode ? 'bg-slate-900/60 border-slate-700/60 text-slate-300' : 'bg-gray-100/70 border-gray-200 text-gray-600'
                    }`}>
                      <span className="font-semibold text-gray-400">Assigned Duty:</span>
                      <span className="font-bold text-[#C8102E] truncate max-w-[130px]">{assignedRegister}</span>
                    </div>

                    {/* Quick Menu Items */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setAccountTab('profile')
                          setIsAccountModalOpen(true)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          isShiftDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="material-icons text-base text-emerald-500">badge</span>
                        <span>Employee ID & Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setAccountTab('shift')
                          setIsAccountModalOpen(true)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          isShiftDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="material-icons text-base text-amber-500">schedule</span>
                        <span>Shift Metrics & Stats</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setAccountTab('security')
                          setIsAccountModalOpen(true)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          isShiftDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="material-icons text-base text-sky-500">lock</span>
                        <span>Security & Password</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleSwitchToCustomer()
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          isShiftDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="material-icons text-base text-purple-500">storefront</span>
                        <span>Customer Website View</span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>

                    {/* Clock Out / Sign Out Action */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="material-icons text-base">logout</span>
                      <span>Clock Out & Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Staff Mobile Navigation Hamburger Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-1.5 sm:p-2 rounded-xl transition active:scale-95 flex lg:hidden items-center justify-center cursor-pointer ${isShiftDarkMode
                    ? 'hover:bg-slate-800/80 text-white'
                    : 'hover:bg-gray-100 text-[#071A3D]'
                  }`}
                title={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Staff Navigation Menu'}
                aria-label="Toggle Staff Navigation"
              >
                <span className="material-icons text-xl transition-transform duration-200">
                  {isMobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>

            </div>

          </div>

          <div className={`hidden lg:flex px-4 sm:px-8 items-center justify-between gap-4 overflow-x-auto no-scrollbar border-t ${isShiftDarkMode ? 'border-slate-600 bg-[#1C2541]/90 backdrop-blur-sm' : 'border-slate-300 bg-white/90 backdrop-blur-sm'}`}>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
              {operationalTabs.map((tab) => {
                const isActive = activeTab === tab.id
                const targetUrl = tabToPath[tab.id] || `/staff/${tab.id}`
                return (
                  <Link
                    key={tab.id}
                    to={targetUrl}
                    className={`relative px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-extrabold transition-all duration-150 shrink-0 active:scale-95 cursor-pointer no-underline ${isActive
                      ? 'text-[#C8102E] dark:text-red-400 border-b-2 border-[#C8102E] dark:border-red-400'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent'
                      }`}
                  >
                    <span className={`material-icons text-base transition-colors ${isActive ? 'text-[#C8102E] dark:text-red-400' : 'text-slate-400'}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>

                    {tab.badge && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${tab.badgeColor || (isActive
                          ? 'bg-[#C8102E] text-white shadow-2xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                        }`}>
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center relative w-60 lg:w-72 shrink-0 pb-1 group">
              <span className="material-icons absolute left-3 text-slate-400 group-focus-within:text-[#C8102E] text-base transition-colors duration-200 pointer-events-none">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dishes, orders, guests..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-1.5 rounded-xl border border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 shadow-2xs transition-all duration-200"
              />

              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Clear Search"
                >
                  <span className="material-icons text-xs block">close</span>
                </button>
              ) : (
                <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 pointer-events-none shadow-2xs">
                  Ctrl+K
                </kbd>
              )}

              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1C2541] border border-slate-400 dark:border-slate-600 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-300 dark:border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Search Matches</span>
                    <span className="text-[10px] font-mono text-[#C8102E] font-bold">"{searchQuery}"</span>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                    <button
                      onClick={() => {
                        setActiveTab('pos')
                        setIsSearchFocused(false)
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-xs text-[#C8102E]">point_of_sale</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#C8102E]">Search in POS Catalogue</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">→</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('orders')
                        setIsSearchFocused(false)
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-xs text-amber-500">soup_kitchen</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500">Search Live Orders Queue</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">→</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('reservations')
                        setIsSearchFocused(false)
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-xs text-emerald-500">event_available</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500">Search Reservations Directory</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Responsive Staff Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
            {/* Backdrop (matches login modal overlay) */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Sheet */}
            <div
              className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] h-full shadow-2xl z-50 flex flex-col justify-between p-4 overflow-y-auto transition-transform duration-200 border-l ${isShiftDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            >
              <div>
                {/* Header with Staff Info & Close Button */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#8A1224] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {staffName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-xs truncate max-w-[130px]">{staffName}</p>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-1.5 py-0.2 rounded uppercase">
                          {roleLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">{employeeId} • {assignedRegister}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${isShiftDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    aria-label="Close menu"
                  >
                    <span className="material-icons text-lg">close</span>
                  </button>
                </div>

                {/* Live Shift Telemetry Banner */}
                <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between text-xs ${isShiftDarkMode ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-[11px] truncate max-w-[130px]">{shiftName.split('(')[0].trim()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-500 font-mono font-bold block text-[11px] leading-tight">{getElapsedShiftTime()}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Quick QR Scanner & Customer Portal Switch */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsQRScannerOpen(true)
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-xs transition cursor-pointer border border-red-700/80"
                  >
                    <span className="material-icons text-base">qr_code_scanner</span>
                    <span>Scan QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleSwitchToCustomer()
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border font-bold text-xs transition cursor-pointer ${isShiftDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    <span className="material-icons text-base text-purple-500">storefront</span>
                    <span>Customer</span>
                  </button>
                </div>

                {/* Staff Operational Modules */}
                <nav className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-2 pb-1">
                    Operational Modules
                  </p>
                  {operationalTabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const targetUrl = tabToPath[tab.id] || `/staff/${tab.id}`
                    return (
                      <Link
                        key={tab.id}
                        to={targetUrl}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition no-underline cursor-pointer ${isActive
                            ? 'bg-[#C8102E] text-white shadow-xs'
                            : isShiftDarkMode
                              ? 'text-slate-200 hover:bg-slate-800/80'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`material-icons text-base ${isActive ? 'text-white' : 'text-[#C8102E]'}`}>
                            {tab.icon}
                          </span>
                          <span>{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isActive
                              ? 'bg-white/20 text-white'
                              : tab.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                            {tab.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 mt-4 border-t border-slate-300 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Shift Theme:</span>
                  <button
                    type="button"
                    onClick={() => setIsShiftDarkMode(!isShiftDarkMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${isShiftDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                  >
                    <span className="material-icons text-sm">{isShiftDarkMode ? 'light_mode' : 'dark_mode'}</span>
                    <span>{isShiftDarkMode ? 'Light' : 'Dark'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  <span className="material-icons text-base">logout</span>
                  <span>Clock Out & Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet context={{ activeTab, setActiveTab, staffUser, isDarkMode: isShiftDarkMode, openQRScanner: () => setIsQRScannerOpen(true) }} />
      </main>

      {/* Instant QR Code Check-In & Verification Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        staffUser={staffUser}
        isDarkMode={isShiftDarkMode}
      />

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl p-6 shadow-2xl border transition-all duration-200 ${isShiftDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>

            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8A1224] text-white flex items-center justify-center font-black text-base shadow-md">
                  {staffName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight">Staff Account Operations Center</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{employeeId} • {shiftName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="flex border-b border-slate-300 dark:border-slate-700 mb-5 gap-2">
              <button
                onClick={() => setAccountTab('profile')}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${accountTab === 'profile'
                  ? 'border-[#C8102E] text-[#C8102E]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <span className="material-icons text-sm">badge</span>
                <span>Employee Badge</span>
              </button>

              <button
                onClick={() => setAccountTab('shift')}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${accountTab === 'shift'
                  ? 'border-[#C8102E] text-[#C8102E]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <span className="material-icons text-sm">analytics</span>
                <span>Shift Metrics</span>
              </button>

              <button
                onClick={() => setAccountTab('security')}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${accountTab === 'security'
                  ? 'border-[#C8102E] text-[#C8102E]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                <span className="material-icons text-sm">lock</span>
                <span>Security & Password</span>
              </button>
            </div>

            {accountTab === 'profile' && (
              <form onSubmit={handleSaveAccount} className="space-y-4">

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8A1224] to-[#C8102E] text-white flex items-center justify-between shadow-lg border border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white text-[#8A1224] flex items-center justify-center font-black text-lg shadow-sm">
                      {staffName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1">
                        OFFICIAL STAFF BADGE
                      </span>
                      <p className="font-extrabold text-sm">{staffName}</p>
                      <p className="text-xs text-white/80 font-mono">{employeeId} • {roleLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/80 block font-semibold">STATION</span>
                    <span className="text-xs font-black text-amber-200">{assignedRegister.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      Phone Contact
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white font-extrabold text-xs shadow-md cursor-pointer">
                    Update Profile
                  </button>
                  <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer">
                    Cancel
                  </button>
                </div>

              </form>
            )}

            {accountTab === 'shift' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">ORDERS PROCESSED</span>
                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">24</span>
                    <span className="text-[9px] text-slate-500">Today's Shift</span>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">POS SALES TOTAL</span>
                    <span className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1 block">₱18,450</span>
                    <span className="text-[9px] text-slate-500">Registered Payments</span>
                  </div>

                  <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/40 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 block uppercase">SHIFT DURATION</span>
                    <span className="text-xl font-black text-sky-800 dark:text-sky-300 mt-1 block">{getElapsedShiftTime()}</span>
                    <span className="text-[9px] text-slate-500">On Duty Time</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Assigned Duty Station:</span>
                    <span className="font-extrabold">{assignedRegister}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Scheduled Shift Hours:</span>
                    <span className="font-extrabold text-[#C8102E]">{shiftName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Shift Clock-In Timestamp:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Today at 08:00:00 AM</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Close Shift Summary
                </button>
              </div>
            )}

            {accountTab === 'security' && (
              <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min. 6 chars"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold ${isShiftDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white font-extrabold text-xs shadow-md cursor-pointer">
                    Save New Password
                  </button>
                  <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Universal Staff Header QR Scanner */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        staffUser={staffUser}
        onCheckInSuccess={() => {
          showToast('Guest checked in successfully!', 'success')
        }}
        isDarkMode={isShiftDarkMode}
      />

    </div>
  )
}

export default StaffLayout

