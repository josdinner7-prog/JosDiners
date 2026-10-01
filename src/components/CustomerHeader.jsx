import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import cartIcon from '../assets/Cart_icon.png'
import AuthModal from './AuthModal'
import SearchModal from './SearchModal'
import { useAuth } from '../auth/AuthContext'
import { useToast } from './ToastNotification'
import api from '../services/api'

function CustomerHeader({ cartCount, onOpenCart, isDarkMode, onToggleDarkMode, onAddToCart }) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { customerUser: user, loginCustomer, logoutCustomer } = useAuth()

  const handleLoginSuccess = (userData) => {
    loginCustomer(userData)
  }

  const handleLogout = () => {
    logoutCustomer()
    showToast('Logged out of your customer account.', 'info')
    navigate('/')
  }

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const userMenuRef = useRef(null)

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

  useEffect(() => {
    let isMounted = true
    if (!user?.email) {
      setUnreadNotificationsCount(0)
      return
    }

    const loadUnreadCount = async () => {
      try {
        const res = await api.notifications.getNotifications({
          role: 'customer',
          email: user.email,
          is_read: '0'
        })
        if (isMounted && res?.status === 'success') {
          setUnreadNotificationsCount(res.unread_count || 0)
        }
      } catch (e) { }
    }
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user?.email, location.pathname])

  const modes = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/menu', label: 'Menu', icon: 'restaurant_menu' },
    { path: '/reservation', label: 'Reservations', icon: 'event_available' },
    { path: '/function-halls', label: 'Function Halls', icon: 'corporate_fare' },
    { path: '/catering', label: 'Catering', icon: 'bento' },
    { path: '/my-events', label: 'My Events', icon: 'event_note' },
    { path: '/my-orders', label: 'My Orders', icon: 'inventory_2' },
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Listen for custom event fired by LoginPrompt
  useEffect(() => {
    const handleOpenAuthModal = () => setIsAuthModalOpen(true)
    window.addEventListener('openAuthModal', handleOpenAuthModal)
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal)
  }, [])

  const handleModeClick = (targetPath) => {
    navigate(targetPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className={`sticky top-0 z-40 shadow-xs border-b transition-colors duration-300 ${isDarkMode
      ? 'bg-[#071A3D] border-slate-700 text-white'
      : 'bg-white border-gray-300 text-[#071A3D]'
      }`}>

      {/* Row 1: Logo, Actions, Theme Toggle & Cart */}
      <div className={`max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 md:border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 xs:gap-2 sm:gap-4">

          {/* Brand Logo & Compact Subtitle */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => handleModeClick('/')}
              className="flex items-center gap-1.5 sm:gap-3 group py-1 text-left cursor-pointer"
            >
              <img
                src={logo}
                alt="Jo's Diner Logo"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 shrink-0 self-center py-0.5"
              />
              <div className="flex flex-col justify-center my-auto leading-none">
                <span className="jos-diner-brand-title text-sm sm:text-lg md:text-xl font-black block leading-none tracking-wide text-left">
                  JO'S DINER
                </span>
                <span className="hidden md:flex text-[7px] md:text-[8px] font-bold text-gray-500 dark:text-gray-400 tracking-widest items-center gap-1 mt-0.5 leading-none uppercase">
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                  <span className="whitespace-nowrap">Function Hall & Catering Services</span>
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                </span>
              </div>
            </button>
          </div>

          {/* Right Controls: User Profile / Login, Theme Switcher, Notifications, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

            {/* Premium Customer User Account or Login Button (Desktop only) */}
            {user ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2.5 py-1.5 rounded-xl transition active:scale-95 ${isDarkMode
                    ? 'text-white hover:bg-slate-800/80'
                    : 'text-[#071A3D] hover:bg-gray-100'
                    }`}
                >
                  <span className="material-icons text-lg sm:text-xl">person_outline</span>
                  <span className="text-xs sm:text-sm font-bold tracking-tight max-w-[50px] xs:max-w-[80px] sm:max-w-[120px] truncate">
                    {user.full_name ? user.full_name.split(' ')[0] : 'Customer'}
                  </span>
                  <span className={`material-icons text-sm sm:text-base text-[#C8102E] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''
                    }`}>
                    keyboard_arrow_down
                  </span>
                </button>

                {/* Enhanced Dropdown Card */}
                {isUserMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-50 transform animate-in fade-in zoom-in-95 duration-150 ${isDarkMode
                      ? 'bg-[#071A3D] border-slate-700 text-white shadow-black/60'
                      : 'bg-white border-gray-300 text-[#071A3D] shadow-gray-200/80'
                      }`}
                  >
                    {/* User Info Header Banner */}
                    <div className={`p-3 rounded-lg mb-1 flex items-center gap-3 border ${isDarkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="w-10 h-10 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-sm font-black uppercase shadow-xs shrink-0">
                        {user.full_name ? user.full_name.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-extrabold truncate">{user.full_name || 'Customer'}</p>
                          <span className="material-icons text-xs text-emerald-500" title="Verified Customer">verified</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Quick Menu Items */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleModeClick('/profile')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-icons text-base text-gray-400">person</span>
                          <span>My Account Profile</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleModeClick('/my-reservations')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-icons text-base text-[#C8102E]">calendar_month</span>
                          <span>My Table Reservations</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleModeClick('/my-events')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-icons text-base text-amber-500">corporate_fare</span>
                          <span>My Events & Catering</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleModeClick('/my-orders')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-icons text-base text-amber-500">inventory_2</span>
                          <span>My Food Orders</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleModeClick('/notifications')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-icons text-base text-blue-500">notifications</span>
                          <span>Notification Center</span>
                        </div>
                      </button>
                    </div>

                    <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>

                    {/* Log Out Action */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-500 flex items-center justify-between transition ${isDarkMode ? 'hover:bg-red-950/40' : 'hover:bg-red-50'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-icons text-base">logout</span>
                        <span>Log Out of Account</span>
                      </div>
                      <span className="material-icons text-xs">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="hidden md:flex bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition shadow-xs items-center gap-1 sm:gap-1.5 active:scale-95 shrink-0 whitespace-nowrap"
              >
                <span className="material-icons text-base sm:text-sm">account_circle</span>
                <span>Login / Register</span>
              </button>
            )}

            {/* Interactive Theme Switcher Icon Button (Desktop only, mobile has it in drawer) */}
            <button
              onClick={onToggleDarkMode}
              className={`hidden md:flex p-1.5 sm:p-2 rounded-xl transition active:scale-95 items-center justify-center ${isDarkMode
                ? 'text-[#F59E0B] hover:bg-slate-800/80 hover:text-amber-400'
                : 'text-[#071A3D] hover:bg-gray-100 hover:text-[#C8102E]'
                }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-icons text-xl">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Plain Notification Bell Icon Button */}
            <button
              onClick={() => handleModeClick('/notifications')}
              className={`relative p-1.5 sm:p-2 rounded-xl transition active:scale-95 flex items-center justify-center ${location.pathname === '/notifications'
                ? 'text-[#C8102E]'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-[#071A3D] hover:bg-gray-100 hover:text-[#C8102E]'
                }`}
              title="Notifications Center"
            >
              <span className="material-icons text-xl">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C8102E] text-white font-extrabold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Compact Custom PNG Cart Icon Button */}
            <button
              onClick={onOpenCart}
              className={`relative p-1.5 sm:p-2 rounded-xl transition active:scale-95 flex items-center justify-center group ${isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-gray-100'}`}
              title="View Order Tray"
            >
              <img
                src={cartIcon}
                alt="Cart"
                className={`w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain transition-transform group-hover:scale-110 ${isDarkMode ? 'brightness-120' : ''
                  }`}
              />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C8102E] text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs border border-white dark:border-slate-900">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Navigation Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 sm:p-2 rounded-xl transition active:scale-95 flex md:hidden items-center justify-center ${isDarkMode ? 'hover:bg-slate-800/80 text-white' : 'hover:bg-gray-100 text-[#071A3D]'
                }`}
              title={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-icons text-2xl transition-transform duration-200">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

          </div>

        </div>
      </div>

      {/* Row 2: Mode Navigation Tabs & Trigger Search Modal (Desktop only) */}
      <div className="hidden md:block max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-2 pb-1.5 gap-2.5 sm:gap-4 overflow-x-auto scrollbar-none">

          {/* Mode Tabs */}
          <div className="flex items-center gap-3.5 sm:gap-6 shrink-0">
            {modes.map((mode) => {
              const currentPath = location.pathname
              const isActive = mode.path === '/'
                ? (currentPath === '/' || currentPath === '')
                : currentPath.toLowerCase().startsWith(mode.path.toLowerCase())
              return (
                <button
                  key={mode.path}
                  onClick={() => handleModeClick(mode.path)}
                  className={`relative flex items-center gap-1 sm:gap-1.5 pb-2 text-[11px] sm:text-xs transition whitespace-nowrap cursor-pointer ${isActive
                    ? isDarkMode ? 'font-bold text-white' : 'font-bold text-[#071A3D]'
                    : isDarkMode ? 'font-semibold text-gray-400 hover:text-white' : 'font-semibold text-gray-500 hover:text-gray-900'
                    }`}
                >
                  <span className={`material-icons text-base sm:text-lg ${isActive
                    ? 'text-[#C8102E]'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {mode.icon}
                  </span>
                  <span>{mode.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8102E] rounded-full"></span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search Trigger Input (Desktop & Tablet) */}
          <div
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden md:flex relative min-w-[160px] sm:min-w-[220px] sm:w-80 lg:w-96 cursor-pointer group shrink-0"
          >
            <span className="material-icons absolute left-2.5 sm:left-3 top-2 text-gray-400 text-base sm:text-lg group-hover:text-[#C8102E] transition">search</span>
            <div className={`w-full border pl-7 sm:pl-10 pr-2.5 sm:pr-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${isDarkMode
              ? 'bg-slate-900 border-slate-700 text-gray-300 hover:border-[#C8102E]'
              : 'bg-[#F8FAFC] border-gray-300 hover:border-gray-400 text-gray-600'
              }`}>
              <span className="truncate">Search dishes...</span>
              <span className="hidden sm:inline-block text-[10px] bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono font-bold border border-gray-300 dark:border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop overlay (matches login modal overlay) */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Sheet */}
          <div
            className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] h-full shadow-2xl z-50 flex flex-col justify-between p-4 overflow-y-auto transition-transform duration-200 border-l ${isDarkMode ? 'bg-[#071A3D] text-white border-slate-700' : 'bg-white text-[#071A3D] border-gray-200'
              }`}
          >
            {/* Drawer Top Header */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                  <div>
                    <span className="jos-diner-brand-title text-sm font-black tracking-wide block leading-none">JO'S DINER</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Navigation Menu</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-1.5 rounded-lg border transition ${isDarkMode ? 'border-slate-700 text-gray-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  aria-label="Close menu"
                >
                  <span className="material-icons text-lg">close</span>
                </button>
              </div>

              {/* Mobile Drawer Search Shortcut */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsSearchModalOpen(true)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 mb-4 rounded-xl border text-xs transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-base text-[#C8102E]">search</span>
                  <span>Search food, menu, drinks...</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-800">⌘K</span>
              </button>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-2 pb-1">Browse Portal</p>
                {modes.map((mode) => {
                  const currentPath = location.pathname
                  const isActive = mode.path === '/'
                    ? (currentPath === '/' || currentPath === '')
                    : currentPath.toLowerCase().startsWith(mode.path.toLowerCase())
                  return (
                    <button
                      key={mode.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleModeClick(mode.path)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${isActive
                          ? 'bg-[#C8102E] text-white shadow-xs'
                          : isDarkMode
                            ? 'text-gray-200 hover:bg-slate-800/80'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <span className={`material-icons text-lg ${isActive ? 'text-white' : 'text-[#C8102E]'}`}>
                        {mode.icon}
                      </span>
                      <span>{mode.label}</span>
                      {isActive && (
                        <span className="material-icons text-sm ml-auto">check</span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Drawer Bottom Controls & User Info */}
            <div className="pt-3 mt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
              {/* If Logged In */}
              {user ? (
                <div className="space-y-2">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs font-black uppercase shrink-0">
                      {user.full_name ? user.full_name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{user.full_name || 'Customer'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleModeClick('/profile')
                      }}
                      className={`p-2 rounded-lg border text-center transition flex items-center justify-center gap-1 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      <span className="material-icons text-sm">person</span>
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleModeClick('/notifications')
                      }}
                      className={`p-2 rounded-lg border text-center transition flex items-center justify-center gap-1 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      <span className="material-icons text-sm">notifications</span>
                      <span>Alerts</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center justify-center gap-1.5"
                  >
                    <span className="material-icons text-base">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsAuthModalOpen(true)
                  }}
                  className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-icons text-base">account_circle</span>
                  <span>Customer Login / Register</span>
                </button>
              )}

              {/* Theme Toggle in Mobile Drawer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700 text-xs font-semibold">
                <span className="text-gray-400">Appearance Mode:</span>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                >
                  <span className="material-icons text-sm">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                  <span>{isDarkMode ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Login / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDarkMode={isDarkMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        isDarkMode={isDarkMode}
        onAddToCart={onAddToCart}
      />

    </header>
  )
}

export default CustomerHeader
