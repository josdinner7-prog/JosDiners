import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import logo from '../../assets/logo.png'
import { setupRiderStatusBar, triggerHaptic, notifyRiderDevice } from '../utils/riderNative'

export default function RiderLayout() {
  const { staffUser, logoutStaff } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [riderData, setRiderData] = useState(null)
  const [activeDelivery, setActiveDelivery] = useState(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const riderId = staffUser?.user_id

  const fetchRiderData = useCallback(async () => {
    if (!riderId) return
    try {
      const res = await api.riders.getRider(riderId)
      if (res.status === 'success' && res.rider) {
        setRiderData(res.rider)
        setActiveDelivery(res.rider.active_delivery || null)
        setPendingRequestsCount(res.rider.pending_requests_count || 0)
      }

      // Check notifications
      const notifRes = await api.riders.getNotifications(riderId)
      if (notifRes.status === 'success') {
        setUnreadNotifsCount(notifRes.unread_count || 0)
      }
    } catch (err) {
      console.warn('[RiderLayout] fetch error:', err.message)
    } finally {
      setIsLoading(false)
    }
  }, [riderId])

  useEffect(() => {
    setupRiderStatusBar()
    fetchRiderData()
    // Poll every 8 seconds for new delivery assignments and status changes
    const interval = setInterval(fetchRiderData, 8000)
    return () => clearInterval(interval)
  }, [fetchRiderData])

  const isOnline = riderData?.rider_status === 'Available' || riderData?.rider_status === 'Delivering'
  const isDelivering = riderData?.rider_status === 'Delivering' || Boolean(activeDelivery)

  const handleToggleOnline = async () => {
    if (!riderId || isUpdatingStatus) return
    if (isDelivering) {
      triggerHaptic('warning')
      showToast('You currently have an active delivery in progress. Complete it before going offline.', 'warning')
      return
    }

    const newStatus = isOnline ? 'Offline' : 'Available'
    setIsUpdatingStatus(true)
    try {
      await api.riders.updateStatus(riderId, newStatus)
      setRiderData(prev => prev ? { ...prev, rider_status: newStatus, effective_status: newStatus } : null)
      triggerHaptic(newStatus === 'Available' ? 'success' : 'medium')
      showToast(newStatus === 'Available' ? 'You are now ONLINE and ready for delivery requests!' : 'You are now OFFLINE.', newStatus === 'Available' ? 'success' : 'info')
    } catch (err) {
      triggerHaptic('warning')
      showToast('Could not update status. Please try again.', 'error')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleLogout = () => {
    logoutStaff()
    showToast('Logged out from Rider Application.', 'info')
    navigate('/rider/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-[#C8102E] selection:text-white pb-20">
      
      {/* Rider Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md px-3.5 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          
          {/* Logo & Rider Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#071A3D] p-1 border border-slate-700/80 shadow-xs shrink-0 flex items-center justify-center">
              <img src={logo} alt="Jo's Diner" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white truncate leading-tight">
                  {riderData?.full_name || staffUser?.full_name || 'Rider Courier'}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#C8102E] text-white shrink-0 tracking-wider">
                  Rider
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>{riderData?.employee_code || `RIDER-${riderId}`}</span>
                <span>•</span>
                <span className="truncate">{riderData?.plate_number || 'Motorcycle'}</span>
              </span>
            </div>
          </div>

          {/* Online/Offline Toggle & Notifications */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications Button */}
            <NavLink
              to="/rider/notifications"
              className={({ isActive }) => `relative p-2 rounded-xl border transition ${
                isActive 
                  ? 'bg-[#C8102E] text-white border-[#C8102E]' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Notifications"
            >
              <span className="material-icons text-lg">notifications</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C8102E] text-white font-black text-[9px] flex items-center justify-center animate-pulse border border-slate-900">
                  {unreadNotifsCount}
                </span>
              )}
            </NavLink>

            {/* Quick Online Switch Button */}
            <button
              type="button"
              onClick={handleToggleOnline}
              disabled={isUpdatingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] border transition cursor-pointer active:scale-95 shadow-xs ${
                isDelivering
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Online / Offline Status"
            >
              <span className={`w-2 h-2 rounded-full ${isDelivering ? 'bg-amber-400 animate-ping' : isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isDelivering ? 'Delivering' : isOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet Container (Mobile First layout, responsive centered on larger screens) */}
      <main className="flex-1 max-w-md w-full mx-auto p-3.5 sm:p-4">
        <Outlet context={{
          riderData,
          activeDelivery,
          pendingRequestsCount,
          unreadNotifsCount,
          isOnline,
          isDelivering,
          fetchRiderData,
          handleToggleOnline,
          handleLogout
        }} />
      </main>

      {/* Bottom Fixed Navigation Bar (Native Mobile Experience) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl py-1.5 px-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          
          {/* 1. Dashboard */}
          <NavLink
            to="/rider"
            end
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive ? 'text-[#C8102E] font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <span className="material-icons text-xl leading-none">dashboard</span>
            <span className="text-[10px] mt-0.5">Home</span>
          </NavLink>

          {/* 2. Delivery Requests */}
          <NavLink
            to="/rider/requests"
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 rounded-xl relative transition ${
              isActive ? 'text-[#C8102E] font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <span className="material-icons text-xl leading-none">assignment</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#C8102E] text-white font-black text-[9px] flex items-center justify-center animate-bounce">
                  {pendingRequestsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Requests</span>
          </NavLink>

          {/* 3. Active Delivery */}
          <NavLink
            to="/rider/active"
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 rounded-xl relative transition ${
              isActive ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <span className="material-icons text-xl leading-none">two_wheeler</span>
              {activeDelivery && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">Active</span>
          </NavLink>

          {/* 4. Earnings */}
          <NavLink
            to="/rider/earnings"
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive ? 'text-[#C8102E] font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <span className="material-icons text-xl leading-none">account_balance_wallet</span>
            <span className="text-[10px] mt-0.5">Earnings</span>
          </NavLink>

          {/* 5. Profile */}
          <NavLink
            to="/rider/profile"
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive ? 'text-[#C8102E] font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <span className="material-icons text-xl leading-none">person</span>
            <span className="text-[10px] mt-0.5">Profile</span>
          </NavLink>
        </div>
      </nav>

    </div>
  )
}
