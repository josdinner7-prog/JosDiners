import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { useToast } from '../../components/ToastNotification'
import { useAuth } from '../../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import api from '../../services/api'

const tabToPath = {
  dashboard: '/admin',
  menu: '/admin/menu',
  packages: '/admin/packages',
  halls: '/admin/halls',
  addons: '/admin/addons',
  reservations: '/admin/reservations',
  beo: '/admin/beo',
  inventory: '/admin/inventory',
  sms: '/admin/sms',
  notifications: '/admin/notifications',
  orders: '/admin/orders',
  payments: '/admin/payments',
  customers: '/admin/customers',
  staff: '/admin/staff',
  'staff-schedule': '/admin/staff-schedule',
  messages: '/admin/messages',
  analytics: '/admin/analytics',
}

const pathToTab = {
  '/admin': 'dashboard',
  '/admin/': 'dashboard',
  '/admin/menu': 'menu',
  '/admin/packages': 'packages',
  '/admin/halls': 'halls',
  '/admin/addons': 'addons',
  '/admin/reservations': 'reservations',
  '/admin/beo': 'beo',
  '/admin/inventory': 'inventory',
  '/admin/sms': 'sms',
  '/admin/notifications': 'notifications',
  '/admin/orders': 'orders',
  '/admin/payments': 'payments',
  '/admin/customers': 'customers',
  '/admin/staff': 'staff',
  '/admin/staff-schedule': 'staff-schedule',
  '/admin/messages': 'messages',
  '/admin/analytics': 'analytics',
}

function AdminLayout({ staffUser: propStaffUser, onLogout, onSwitchToCustomer }) {
  const { showToast } = useToast()
  const { staffUser: authStaffUser, logoutStaff } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const staffUser = propStaffUser || authStaffUser

  const handleLogout = () => {
    if (onLogout) onLogout()
    logoutStaff()
    showToast('Logged out of Admin Portal.', 'info')
    navigate('/Rolelogin')
  }

  const handleSwitchToCustomer = () => {
    if (onSwitchToCustomer) onSwitchToCustomer()
    navigate('/')
  }

  const getActiveTab = (pathname) => {
    const clean = pathname.toLowerCase().replace(/\/$/, '')
    if (pathToTab[clean]) return pathToTab[clean]
    if (clean.startsWith('/admin/halls')) return 'halls'
    if (clean.startsWith('/admin/menu')) return 'menu'
    if (clean.startsWith('/admin/packages')) return 'packages'
    if (clean.startsWith('/admin/addons')) return 'addons'
    if (clean.startsWith('/admin/reservations')) return 'reservations'
    if (clean.startsWith('/admin/beo')) return 'beo'
    if (clean.startsWith('/admin/inventory')) return 'inventory'
    if (clean.startsWith('/admin/sms')) return 'sms'
    if (clean.startsWith('/admin/staff-schedule')) return 'staff-schedule'
    if (clean.startsWith('/admin/orders')) return 'orders'
    if (clean.startsWith('/admin/payments')) return 'payments'
    if (clean.startsWith('/admin/customers')) return 'customers'
    if (clean.startsWith('/admin/staff')) return 'staff'
    if (clean.startsWith('/admin/messages')) return 'messages'
    if (clean.startsWith('/admin/analytics')) return 'analytics'
    return 'dashboard'
  }

  const activeTab = getActiveTab(location.pathname)

  const setActiveTab = (tabId) => {
    const targetPath = tabToPath[tabId] || (tabId.startsWith('/') ? tabId : `/admin/${tabId}`)
    navigate(targetPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('jos_admin_sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('jos_admin_sidebar_collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  const [adminUsername, setAdminUsername] = useState(staffUser?.username || 'admin')
  const [adminEmail, setAdminEmail] = useState('admin@josdiner.com.ph')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const roleBadgeColor =
    staffUser?.role === 'kitchen' ? 'bg-amber-500' :
      staffUser?.role === 'staff' ? 'bg-emerald-600' : 'bg-[#C8102E]'

  const tabTitles = {
    dashboard: 'Dashboard Overview',
    menu: 'Individual Food Menu Catalog',
    packages: 'Catering & Event Package Management',
    halls: 'Function Hall Management',
    addons: 'Optional Add-ons & Extra Services',
    reservations: 'Customer Package Reservations Queue',
    beo: 'Banquet Event Orders (BEO)',
    inventory: 'Dual-Track Catering Inventory',
    sms: 'SMS Gateway & Live Webhook Center',
    notifications: 'Reservation Notification Center',
    orders: 'Customer Orders Management',
    payments: 'Payments & Transactions Ledger',
    customers: 'Customer Directory',
    staff: 'Staff & System Accounts',
    messages: 'Customer Messages & Inquiries',
    analytics: 'Sales & Revenue Analytics',
  }

  const [adminNotifications, setAdminNotifications] = useState([])
  const [adminUnreadCount, setAdminUnreadCount] = useState(0)

  const fetchAdminNotifications = async () => {
    try {
      const res = await api.notifications.getNotifications({ role: 'admin', limit: 6 })
      if (res?.status === 'success') {
        setAdminNotifications(res.notifications || [])
        setAdminUnreadCount(res.unread_count || 0)
      }
    } catch (e) { }
  }

  useEffect(() => {
    fetchAdminNotifications()
    const interval = setInterval(fetchAdminNotifications, 20000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleSaveAccountSettings = (e) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error')
      return
    }
    showToast('Admin account details updated successfully!', 'success')
    setIsManageAccountOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans relative">

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Interactive Burgundy/Dark Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setIsMobileSidebarOpen(false)
        }}
        staffUser={staffUser}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Admin Content Area - Mini 80px margin on desktop when collapsed, 0 on mobile */}
      <main className={`min-h-screen transition-all duration-300 ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}>

        {/* Top Header Bar */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-gray-300 bg-white px-4 sm:px-6 sticky top-0 z-20">

          {/* Left: Mobile Hamburger + Page Title + Clock */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200 transition active:scale-95 flex items-center justify-center shrink-0"
              title="Open Navigation Menu"
            >
              <span className="material-icons text-lg">menu</span>
            </button>

            {/* Page Title */}
            <div className="min-w-0">
              <h1 className="text-sm font-black text-[#071A3D] uppercase tracking-wide truncate leading-tight">
                {tabTitles[activeTab] || 'Dashboard'}
              </h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest hidden sm:block leading-tight">
                Jo's Diner Admin Portal
              </p>
            </div>

            {/* Live Clock Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-[11px] text-gray-600 font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-bold text-[#071A3D]">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-gray-300">·</span>
              <span>{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Right: Search, Notifications & User */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Search Input */}
            <div className="relative hidden md:block w-52">
              <span className="material-icons absolute left-2.5 top-2 text-gray-400 text-base">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <span className="material-icons text-xs">close</span>
                </button>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false) }}
                className="relative p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-[#C8102E] border border-gray-200 transition active:scale-95 cursor-pointer"
                title="Notifications Hub"
              >
                <span className="material-icons text-[20px]">notifications</span>
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#C8102E] text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b pb-3 mb-2 border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-[#071A3D]">Reservation & System Alerts</span>
                    </div>
                    {adminUnreadCount > 0 ? (
                      <span className="text-[10px] bg-red-50 text-[#C8102E] font-black px-2 py-0.5 rounded-full border border-red-200">
                        {adminUnreadCount} New
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        All Caught Up
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin py-1">
                    {adminNotifications.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <span className="material-icons text-2xl text-gray-300">notifications_none</span>
                        <p className="text-xs font-semibold mt-1">No alerts recorded yet</p>
                      </div>
                    ) : (
                      adminNotifications.map((n) => {
                        const isUnread = !n.is_read
                        return (
                          <div
                            key={n.notification_id}
                            onClick={async () => {
                              if (isUnread) {
                                try {
                                  await api.notifications.markAsRead(n.notification_id, true)
                                  setAdminUnreadCount(prev => Math.max(0, prev - 1))
                                } catch (e) { }
                              }
                              setIsNotificationsOpen(false)
                              navigate('/admin/notifications')
                            }}
                            className={`flex gap-3 text-xs p-2.5 rounded-xl transition cursor-pointer border ${isUnread
                                ? 'bg-red-50/40 border-red-100 hover:bg-red-50'
                                : 'bg-gray-50/60 border-transparent hover:bg-gray-100'
                              }`}
                          >
                            <span className="material-icons text-base text-[#C8102E] shrink-0 mt-0.5">
                              {n.type === 'approval_notice' ? 'fact_check' : n.type === 'payment_confirmation' ? 'payments' : 'notifications'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-extrabold text-[#071A3D] truncate">{n.title}</p>
                                {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] shrink-0" />}
                              </div>
                              <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{n.message}</p>
                              {n.reservation_code && (
                                <span className="inline-block mt-1 font-mono font-bold text-[10px] text-gray-500 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                                  {n.reservation_code}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false)
                        navigate('/admin/notifications')
                      }}
                      className="w-full py-2 text-center text-xs font-black text-white bg-[#C8102E] hover:bg-[#A00D24] rounded-xl transition cursor-pointer shadow-xs"
                    >
                      Open Full Notification Center
                    </button>
                    {adminUnreadCount > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await api.notifications.markAllAsRead({ role: 'admin' })
                            setAdminNotifications(prev => prev.map(item => ({ ...item, is_read: 1 })))
                            setAdminUnreadCount(0)
                            showToast('All notifications marked read.', 'success')
                          } catch (e) { }
                        }}
                        className="w-full py-1 text-center text-[11px] font-bold text-gray-500 hover:text-[#071A3D] cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative shrink-0">
              <button
                onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false) }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition active:scale-95 cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C8102E] text-white font-black text-xs uppercase shrink-0">
                  {staffUser?.username ? staffUser.username.charAt(0) : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-black text-[11px] text-[#071A3D] leading-tight">
                    {staffUser?.username ? staffUser.username.toUpperCase() : 'ADMIN'}
                  </p>
                  <p className="text-[9px] text-[#C8102E] font-bold uppercase tracking-wide leading-tight">
                    {staffUser?.role || 'Admin'}
                  </p>
                </div>
                <span className={`material-icons text-gray-400 text-sm hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-lg mb-1">
                    <p className="text-xs font-black text-[#071A3D] uppercase">
                      {staffUser?.username || 'Administrator'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">
                        {staffUser?.role || 'Admin'} · Online
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsUserMenuOpen(false); setIsManageAccountOpen(true) }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-[#C8102E]">manage_accounts</span>
                      <span>Manage Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        navigate('/admin/sms')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-[#C8102E]">sms</span>
                      <span>SMS &amp; Webhooks</span>
                    </button>
                    <button
                      onClick={() => { setIsUserMenuOpen(false); handleSwitchToCustomer() }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-gray-400">storefront</span>
                      <span>Customer Website</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-100 pt-1 mt-1">
                    <button
                      onClick={() => { setIsUserMenuOpen(false); setIsLogoutConfirmOpen(true) }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-xs font-semibold text-red-600 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="material-icons text-base text-red-500">logout</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Manage Admin Account Modal */}
        {isManageAccountOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">

              <div className="flex items-start justify-between border-b pb-4 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-[#C8102E] flex items-center justify-center font-bold">
                    <span className="material-icons text-xl">manage_accounts</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#071A3D]">Manage Admin Account</h3>
                    <p className="text-xs text-gray-400">Update credentials & security preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsManageAccountOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveAccountSettings} className="space-y-4 text-xs font-semibold">

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Username / ID</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#C8102E] text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Administrator Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#C8102E] text-gray-800"
                  />
                </div>

                <div className="border-t pt-3 border-gray-100 space-y-3">
                  <p className="text-xs font-black text-[#071A3D] uppercase">Change Password</p>

                  <div>
                    <label className="block text-gray-600 mb-1">New Password (optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#C8102E] text-gray-800"
                    />
                  </div>

                  {newPassword && (
                    <div>
                      <label className="block text-gray-600 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#C8102E] text-gray-800"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManageAccountOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold transition shadow cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Active Tab View via Outlet */}
        <section className="p-4 sm:p-6 lg:p-8">
          <Outlet context={{ activeTab, staffUser, searchQuery }} />
        </section>

      </main>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Log Out of Admin Portal?"
        message="Are you sure you want to log out of your admin session? You will need your credentials to log back in."
        confirmText="Log Out"
        cancelText="Stay Logged In"
        variant="logout"
      />

    </div>
  )
}

export default AdminLayout
