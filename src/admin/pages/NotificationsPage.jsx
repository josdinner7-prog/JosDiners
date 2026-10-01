import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import ReservationQRPass from '../../components/ReservationQRPass'
import SMSModal from '../../components/SMSModal'
import PaginationControls from '../../components/PaginationControls'

const CATEGORY_TABS = [
  { id: 'all', label: 'All Alerts', icon: 'notifications' },
  { id: 'unread', label: 'Unread Alerts', icon: 'mark_email_unread' },
  { id: 'order_update', label: 'Food Orders', icon: 'restaurant' },
  { id: 'approval_notice', label: 'Approval Notices', icon: 'fact_check' },
  { id: 'payment_confirmation', label: 'Payment Confirmations', icon: 'payments' },
  { id: 'booking_reminder', label: 'Reminders', icon: 'alarm' },
  { id: 'cancellation_alert', label: 'Cancellations', icon: 'cancel' },
  { id: 'booking_update', label: 'Booking Updates', icon: 'update' },
  { id: 'system_alert', label: 'System Notices', icon: 'campaign' },
]

function MetricTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-2.5 w-20 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-6 w-12 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-2 w-16 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0"></div>
        </div>
      ))}
    </div>
  )
}

function NotificationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs animate-pulse space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
        </div>
        <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
      </div>
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
      <div className="h-3 w-5/6 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
    </div>
  )
}

function NotificationsPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  
  // Modals & Inspection State
  const [inspectingReservation, setInspectingReservation] = useState(null)
  const [inspectingNotification, setInspectingNotification] = useState(null)
  const [isLoadingReservation, setIsLoadingReservation] = useState(false)
  const [activeQRPass, setActiveQRPass] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [smsModal, setSmsModal] = useState(null)

  const itemsPerPage = 10

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.notifications.getNotifications({
        role: 'admin'
      })
      if (res && res.status === 'success') {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unread_count || 0)
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err)
      showToast('Could not load notifications.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 25000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead({ role: 'admin' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
      showToast('All notifications marked as read.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Failed to mark all as read.', 'error')
    }
  }

  // Toggle single item read status
  const toggleReadStatus = async (item, e) => {
    e?.stopPropagation()
    const newStatus = !item.is_read
    try {
      await api.notifications.markAsRead(item.notification_id, newStatus)
      setNotifications(prev =>
        prev.map(n => (n.notification_id === item.notification_id ? { ...n, is_read: newStatus ? 1 : 0 } : n))
      )
      setUnreadCount(prev => (newStatus ? Math.max(0, prev - 1) : prev + 1))
    } catch (err) {
      console.error(err)
      showToast('Failed to update status.', 'error')
    }
  }

  // Single delete
  const deleteNotification = async (item, e) => {
    e?.stopPropagation()
    try {
      await api.notifications.deleteNotification(item.notification_id)
      setNotifications(prev => prev.filter(n => n.notification_id !== item.notification_id))
      setSelectedIds(prev => prev.filter(id => id !== item.notification_id))
      if (!item.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      showToast('Notification dismissed.', 'info')
    } catch (err) {
      console.error(err)
      showToast('Failed to delete notification.', 'error')
    }
  }

  // Bulk Mark Read
  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => api.notifications.markAsRead(id, true)))
      setNotifications(prev =>
        prev.map(n => (selectedIds.includes(n.notification_id) ? { ...n, is_read: 1 } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - selectedIds.length))
      showToast(`Marked ${selectedIds.length} notifications as read.`, 'success')
      setSelectedIds([])
    } catch (err) {
      console.error(err)
      showToast('Failed to perform bulk read.', 'error')
    }
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => api.notifications.deleteNotification(id)))
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.notification_id)))
      showToast(`Dismissed ${selectedIds.length} notifications.`, 'info')
      setSelectedIds([])
      fetchNotifications()
    } catch (err) {
      console.error(err)
      showToast('Failed to dismiss selected notifications.', 'error')
    }
  }

  // Helper to resolve the database reservation object associated with a notification
  const resolveReservationForNotification = async (item) => {
    let resId = item.reservation_id
    let resCode = item.reservation_code

    if (!resId || !resCode) {
      if (item.metadata_json) {
        try {
          const meta = typeof item.metadata_json === 'string' ? JSON.parse(item.metadata_json) : item.metadata_json
          if (meta.reservation_id) resId = meta.reservation_id
          if (meta.reservation_code) resCode = meta.reservation_code
        } catch { }
      }
    }

    if (!resId && !resCode) {
      const match = (item.title + ' ' + item.message).match(/(RES|CAT|EVT)-[\w\d]+/i)
      if (match) resCode = match[0].toUpperCase()
    }

    // 1. Check reservations table
    try {
      const check = await api.reservations.getAll()
      const resList = check?.reservations || []
      const found = resList.find(r =>
        (resId && String(r.reservation_id || r.id) === String(resId)) ||
        (resCode && String(r.reservation_code || '').toUpperCase() === String(resCode).toUpperCase()) ||
        (r.contact_name && item.message && item.message.toLowerCase().includes(r.contact_name.toLowerCase()))
      )
      if (found) return { ...found, _source: 'reservation' }
    } catch (e) {
      console.warn('Could not query reservations:', e)
    }

    // 2. Check catering bookings
    try {
      const catCheck = await api.catering.getBookings()
      const catList = catCheck?.bookings || catCheck?.data || (Array.isArray(catCheck) ? catCheck : [])
      const catFound = catList.find(b =>
        (resId && String(b.booking_id || b.id) === String(resId)) ||
        (resCode && String(b.booking_code || '').toUpperCase() === String(resCode).toUpperCase())
      )
      if (catFound) return { ...catFound, _source: 'catering' }
    } catch (e) {
      console.warn('Could not query catering bookings:', e)
    }

    // 3. Synthesize fallback if code or email exists
    return {
      reservation_id: resId || Date.now(),
      reservation_code: resCode || 'RES-NOTICE',
      contact_name: item.title.replace(/New Reservation Inquired:?|Reservation/i, '').trim() || 'Guest Customer',
      contact_phone: item.recipient_phone || '0917-123-4567',
      email: item.recipient_email || 'client@example.com',
      event_type: item.type === 'approval_notice' ? 'Catering & Banquet Event' : 'Diner Reservation',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '12:00 PM',
      guest_count: 50,
      total_amount: 25000,
      deposit_paid: 10000,
      status: 'Pending',
      venue_name: "Jo's Diner Complex",
      venue_address: 'General Santos Highway, Polomolok',
      special_requests: item.message,
      _source: 'synthetic'
    }
  }

  // Resolve target administrative handling route and search parameters
  const getNotificationHandlingRoute = (item) => {
    if (!item) return { path: '/admin/reservations', label: 'View Booking', icon: 'open_in_new', state: {} }
    
    // 1. Order alerts / updates
    if (
      item.type === 'order_update' ||
      item.type === 'order_alert' ||
      (item.title && item.title.toLowerCase().includes('order'))
    ) {
      return {
        path: '/admin/orders',
        label: 'View Order',
        icon: 'receipt_long',
        state: { search: item.order_code || item.reservation_code || '' }
      }
    }
    
    // 2. Banquet Event Order (BEO)
    if (
      item.type === 'beo_update' ||
      (item.title && (item.title.toLowerCase().includes('banquet') || item.title.toLowerCase().includes('beo')))
    ) {
      return {
        path: '/admin/beo',
        label: 'View BEO',
        icon: 'event_seat',
        state: { search: item.reservation_code || '' }
      }
    }

    // 3. Default: Reservations & Catering Booking Management Hub
    const code = item.reservation_code || ''
    return {
      path: '/admin/reservations',
      label: 'Handle Booking',
      icon: 'open_in_new',
      state: {
        highlightCode: code,
        search: code,
        statusFilter: item.type === 'approval_notice' ? 'Pending' : 'all'
      }
    }
  }

  // Redirect to the dedicated management page that handles the action
  const handleNavigateToResource = (item, e) => {
    e?.stopPropagation()
    const target = getNotificationHandlingRoute(item)
    // Automatically mark as read when navigating to handle it
    if (!item.is_read && api.notifications?.markAsRead) {
      api.notifications.markAsRead(item.notification_id, true).catch(() => {})
      setNotifications(prev =>
        prev.map(n => (n.notification_id === item.notification_id ? { ...n, is_read: 1 } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    navigate(target.path, { state: target.state })
  }

  // Action: INSPECT RESERVATION DETAILS MODAL
  const handleInspectReservation = async (item, e) => {
    e?.stopPropagation()
    setInspectingNotification(item)
    setIsLoadingReservation(true)
    try {
      const targetRes = await resolveReservationForNotification(item)
      setInspectingReservation(targetRes)
    } catch (err) {
      console.error('Inspect error:', err)
      showToast('Could not load reservation details.', 'error')
    } finally {
      setIsLoadingReservation(false)
    }
  }

  // QR Pass modal launcher
  const handleOpenQRPass = async (item, e) => {
    e?.stopPropagation()
    try {
      const code = item.reservation_code
      if (!code) {
        navigate('/admin/reservations')
        return
      }
      const verifyRes = await api.reservations.verify(code)
      if (verifyRes?.reservation) {
        setActiveQRPass(verifyRes.reservation)
      } else {
        showToast(`Viewing reservation #${code}`, 'info')
        navigate('/admin/reservations')
      }
    } catch (err) {
      console.warn(err)
      navigate('/admin/reservations')
    }
  }

  // Dispatch to Gmail
  const handleSendToGmail = async (item, e) => {
    e?.stopPropagation()
    const targetEmail = item.recipient_email || 'admin@josdiner.com.ph'
    setSendingEmailId(item.notification_id)
    try {
      const res = await api.notifications.sendNotificationEmail(item.notification_id, targetEmail)
      if (res?.status === 'success') {
        showToast(`Notification delivered to ${targetEmail} via Gmail!`, 'success')
      } else {
        showToast(res?.message || 'Could not send email.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to dispatch notification to Gmail.', 'error')
    } finally {
      setSendingEmailId(null)
    }
  }

  // Filter & Search Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterCategory === 'unread') {
        if (n.is_read) return false
      } else if (filterCategory !== 'all') {
        if (n.type !== filterCategory) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = (n.title || '').toLowerCase().includes(q)
        const msgMatch = (n.message || '').toLowerCase().includes(q)
        const codeMatch = (n.reservation_code || '').toLowerCase().includes(q)
        const emailMatch = (n.recipient_email || '').toLowerCase().includes(q)
        if (!titleMatch && !msgMatch && !codeMatch && !emailMatch) return false
      }

      return true
    })
  }, [notifications, filterCategory, searchQuery])

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredNotifications.slice(start, start + itemsPerPage)
  }, [filteredNotifications, currentPage, itemsPerPage])

  // Stats calculation
  const stats = useMemo(() => {
    const total = notifications.length
    const pendingApprovals = notifications.filter(n => n.type === 'approval_notice' && !n.is_read).length
    const paymentAlerts = notifications.filter(n => n.type === 'payment_confirmation').length
    const unread = unreadCount
    return { total, pendingApprovals, paymentAlerts, unread }
  }, [notifications, unreadCount])

  // Type styling helper
  const getTypeTheme = (type) => {
    switch (type) {
      case 'approval_notice':
        return {
          icon: 'fact_check',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:border-blue-900',
          badge: 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200',
          iconColor: 'text-blue-600',
          label: 'Approval Notice'
        }
      case 'payment_confirmation':
        return {
          icon: 'payments',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900',
          badge: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200',
          iconColor: 'text-emerald-600',
          label: 'Payment Confirmation'
        }
      case 'booking_reminder':
        return {
          icon: 'alarm',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:border-amber-900',
          badge: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200',
          iconColor: 'text-amber-600',
          label: 'Booking Reminder'
        }
      case 'cancellation_alert':
        return {
          icon: 'cancel',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:border-rose-900',
          badge: 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200',
          iconColor: 'text-rose-600',
          label: 'Cancellation Alert'
        }
      case 'system_alert':
        return {
          icon: 'campaign',
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:border-purple-900',
          badge: 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200',
          iconColor: 'text-purple-600',
          label: 'System Notice'
        }
      case 'order_update':
        return {
          icon: 'restaurant',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:border-amber-900',
          badge: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200',
          iconColor: 'text-amber-600',
          label: 'Food Order'
        }
      case 'booking_update':
      default:
        return {
          icon: 'event_available',
          bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/80 dark:border-teal-900',
          badge: 'bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200',
          iconColor: 'text-teal-600',
          label: 'Booking Update'
        }
    }
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Recently'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Toggle select all on current page
  const handleToggleSelectAll = () => {
    const pageIds = paginatedNotifications.map(n => n.notification_id)
    const allSelected = pageIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            Reservation Notification Center
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Real-time alerts for customer reservations, payment confirmations, booking reminders, and approval workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            title="Sync and refresh alerts"
          >
            <span className={`material-icons text-base text-blue-600 ${isLoading ? 'animate-spin' : ''}`}>sync</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow transition active:scale-95 cursor-pointer ${
              unreadCount > 0
                ? 'bg-[#C8102E] text-white hover:bg-[#9B0B21]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <span className="material-icons text-base">done_all</span>
            <span>Mark All as Read</span>
          </button>
        </div>
      </header>

      {/* 2. EXECUTIVE METRIC TILES */}
      {isLoading && notifications.length === 0 ? (
        <MetricTilesSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Tile 1: Total Alerts */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">
                Total Alerts
              </span>
              <span className="text-2xl font-black font-mono text-[#071A3D] dark:text-white mt-0.5 block">
                {stats.total}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">All Alert Records</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">notifications</span>
            </div>
          </div>

          {/* Tile 2: Action Needed */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                  Action Needed
                </span>
                {stats.pendingApprovals > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </div>
              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                {stats.pendingApprovals}
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Pending Approvals</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">pending_actions</span>
            </div>
          </div>

          {/* Tile 3: Payment Confirmations */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                Payment Alerts
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {stats.paymentAlerts}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">GCash & Bank Proofs</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">paid</span>
            </div>
          </div>

          {/* Tile 4: Unread Alerts */}
          <div className="bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">
                  Unread Alerts
                </span>
                {stats.unread > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-ping"></span>
                )}
              </div>
              <span className="text-2xl font-black font-mono text-[#C8102E] mt-0.5 block">
                {stats.unread}
              </span>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Unacknowledged</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 text-[#C8102E] flex items-center justify-center shrink-0">
              <span className="material-icons text-xl">mark_email_unread</span>
            </div>
          </div>

        </div>
      )}

      {/* 3. FILTER, SEARCH & BULK ACTIONS TOOLBAR */}
      <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs p-3.5 sm:p-4 space-y-3">
        
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0">
            {CATEGORY_TABS.map((tab) => {
              const isActive = filterCategory === tab.id
              const count = tab.id === 'all'
                ? notifications.length
                : tab.id === 'unread'
                  ? unreadCount
                  : notifications.filter(n => n.type === tab.id).length

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilterCategory(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-2xs font-black'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <span className="material-icons text-xs">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-black/25 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search & Bulk Operations Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by code, title, customer, or message..."
              className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-[#071A3D] dark:text-white placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bulk Operations Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              {paginatedNotifications.length > 0 && paginatedNotifications.every(n => selectedIds.includes(n.notification_id))
                ? 'Deselect Page'
                : 'Select Page'}
            </button>

            {selectedIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleBulkMarkRead}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-icons text-xs">done_all</span>
                  <span>Mark Read ({selectedIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#C8102E] border border-red-200 font-bold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-icons text-xs">delete_sweep</span>
                  <span>Dismiss ({selectedIds.length})</span>
                </button>
              </>
            )}
          </div>

        </div>

      </div>

      {/* 4. NOTIFICATIONS LIST CONTAINER */}
      <div className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <NotificationCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-white dark:bg-[#071A3D] rounded-lg border border-dashed border-gray-300 dark:border-slate-700 shadow-xs">
            <span className="material-icons text-4xl text-gray-300 dark:text-slate-600 block">notifications_off</span>
            <h3 className="text-base font-black text-[#071A3D] dark:text-white">No Notification Alerts Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? `No alerts matched "${searchQuery}". Try adjusting your search keyword.`
                : filterCategory === 'unread'
                  ? 'All caught up! You have 0 unread notification alerts.'
                  : 'There are no notification records matching the selected filter.'}
            </p>
            {(searchQuery || filterCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setFilterCategory('all')
                }}
                className="mt-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white font-bold text-xs shadow-xs hover:bg-[#9B0B21] transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          paginatedNotifications.map((item) => {
            const theme = getTypeTheme(item.type)
            const isUnread = !item.is_read
            const isSelected = selectedIds.includes(item.notification_id)

            return (
              <div
                key={item.notification_id}
                className={`rounded-lg border bg-white dark:bg-[#071A3D] p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isUnread
                    ? 'border-l-4 border-l-[#C8102E] border-gray-300 dark:border-slate-700 bg-red-50/15'
                    : 'border-gray-400 dark:border-slate-700'
                }`}
              >
                {/* Left: Checkbox + Icon + Details */}
                <div 
                  className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={(e) => handleInspectReservation(item, e)}
                  title="Click to inspect full reservation specs and actions"
                >
                  
                  {/* Select Checkbox */}
                  <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== item.notification_id)
                            : [...prev, item.notification_id]
                        )
                      }}
                      className="w-4 h-4 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E] cursor-pointer"
                    />
                  </div>

                  {/* Themed Icon Box */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${theme.bg}`}>
                    <span className={`material-icons text-lg ${theme.iconColor}`}>{theme.icon}</span>
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border ${theme.badge}`}>
                        {theme.label}
                      </span>

                      {item.reservation_code && (
                        <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 flex items-center gap-1">
                          <span className="material-icons text-xs text-gray-400">confirmation_number</span>
                          {item.reservation_code}
                        </span>
                      )}

                      {isUnread && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase bg-red-100 text-[#C8102E] border border-red-200">
                          Unread
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-400 ml-auto md:ml-0 font-mono">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-[#071A3D] dark:text-white leading-snug hover:text-[#C8102E] transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      {item.message}
                    </p>

                    {item.recipient_email && (
                      <div className="text-[10.5px] text-gray-400 dark:text-gray-400 font-medium pt-0.5 flex items-center gap-1">
                        <span className="material-icons text-xs">mail</span>
                        <span>Recipient: <strong className="text-gray-700 dark:text-gray-300">{item.recipient_email}</strong></span>
                      </div>
                    )}

                  </div>

                </div>

                {/* Right: Actions Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-slate-800 w-full md:w-auto justify-end flex-wrap">
                  
                  {/* Primary Action: Direct Navigation to Handling Page */}
                  {(() => {
                    const route = getNotificationHandlingRoute(item)
                    return (
                      <button
                        type="button"
                        onClick={(e) => handleNavigateToResource(item, e)}
                        className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                        title={`Redirect to ${route.path} to handle this record`}
                      >
                        <span className="material-icons text-xs">{route.icon || 'open_in_new'}</span>
                        <span>{route.label}</span>
                      </button>
                    )
                  })()}

                  {/* Secondary Action: Inspect Details Modal */}
                  <button
                    type="button"
                    onClick={(e) => handleInspectReservation(item, e)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-900 font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Inspect complete reservation details and specs"
                  >
                    <span className="material-icons text-xs">manage_search</span>
                    <span>Inspect</span>
                  </button>

                  {/* Action: View QR Pass (if reservation code exists) */}
                  {item.reservation_code && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenQRPass(item, e)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                      title="View Scannable QR Pass"
                    >
                      <span className="material-icons text-xs text-[#C8102E]">qr_code</span>
                      <span className="hidden sm:inline">QR Pass</span>
                    </button>
                  )}

                  {/* Action 5: Send Gmail */}
                  <button
                    type="button"
                    disabled={sendingEmailId === item.notification_id}
                    onClick={(e) => handleSendToGmail(item, e)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Forward notice via Gmail"
                  >
                    <span className="material-icons text-sm block">
                      {sendingEmailId === item.notification_id ? 'hourglass_top' : 'forward_to_inbox'}
                    </span>
                  </button>

                  {/* Action 6: Send SMS */}
                  <button
                    type="button"
                    onClick={() => setSmsModal({
                      number: item.recipient_phone || '',
                      message: `${item.title}\n${item.message}`
                    })}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-50 text-gray-500 hover:text-purple-600 border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Dispatch SMS notification"
                  >
                    <span className="material-icons text-sm block">sms</span>
                  </button>

                  {/* Action 7: Toggle Read */}
                  <button
                    type="button"
                    onClick={(e) => toggleReadStatus(item, e)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 text-gray-500 hover:text-[#071A3D] dark:text-gray-300 border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                    title={isUnread ? 'Mark as read' : 'Mark as unread'}
                  >
                    <span className="material-icons text-sm block">
                      {isUnread ? 'check' : 'mark_email_unread'}
                    </span>
                  </button>

                  {/* Action 8: Dismiss */}
                  <button
                    type="button"
                    onClick={(e) => deleteNotification(item, e)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 text-gray-400 hover:text-[#C8102E] border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Dismiss alert"
                  >
                    <span className="material-icons text-sm block">delete_outline</span>
                  </button>

                </div>

              </div>
            )
          })
        )}
      </div>

      {/* 5. PAGINATION CONTROLS */}
      {filteredNotifications.length > itemsPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredNotifications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="alerts"
        />
      )}

      {/* ========================================================================= */}
      {/* 6. COMPREHENSIVE RESERVATION INSPECTOR & ACTIONS MODAL                     */}
      {/* ========================================================================= */}
      {(inspectingReservation || isLoadingReservation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#071A3D] rounded-xl border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black">
                  <span className="material-icons text-xl">event_available</span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-[#071A3D] dark:text-white">
                      Reservation Inspection &amp; Direct Actions
                    </h3>
                    {inspectingReservation?.reservation_code && (
                      <span className="font-mono text-xs font-black text-[#C8102E] bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-200">
                        #{inspectingReservation.reservation_code}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Review booking specifications, client contact, payment settlements, and trigger workflows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInspectingReservation(null)
                  setInspectingNotification(null)
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-medium text-gray-800 dark:text-gray-200">
              {isLoadingReservation ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-red-200 border-t-[#C8102E] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 font-bold">Fetching reservation details from database...</p>
                </div>
              ) : inspectingReservation ? (
                <>
                  {/* Status Banner */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        inspectingReservation.status === 'Confirmed' ? 'bg-emerald-500' :
                        inspectingReservation.status === 'Completed' ? 'bg-blue-500' :
                        inspectingReservation.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></span>
                      <span className="font-black text-xs uppercase tracking-wider text-[#071A3D] dark:text-white">
                        Status: <strong>{inspectingReservation.status}</strong>
                      </span>
                    </div>

                    <span className="font-mono text-xs font-black text-[#C8102E]">
                      Total: ₱{(parseFloat(inspectingReservation.total_amount) || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* 2-Column Specs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Client Details */}
                    <div className="p-3.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block border-b pb-1 border-gray-200 dark:border-slate-800">
                        Client &amp; Contact Info
                      </span>
                      <div className="space-y-1 text-xs">
                        <p><strong>Customer:</strong> {inspectingReservation.contact_name || 'N/A'}</p>
                        <p><strong>Phone:</strong> {inspectingReservation.contact_phone || inspectingReservation.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> {inspectingReservation.email || 'N/A'}</p>
                        <p><strong>Guests Pax:</strong> <span className="font-bold text-[#C8102E]">{inspectingReservation.guest_count || inspectingReservation.guests || 2} Pax</span></p>
                      </div>
                    </div>

                    {/* Schedule & Venue Details */}
                    <div className="p-3.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block border-b pb-1 border-gray-200 dark:border-slate-800">
                        Event Schedule &amp; Venue
                      </span>
                      <div className="space-y-1 text-xs">
                        <p><strong>Event:</strong> {inspectingReservation.event_type || inspectingReservation.event_name || 'Catering Event'}</p>
                        <p><strong>Date:</strong> <span className="font-bold">{inspectingReservation.event_date}</span></p>
                        <p><strong>Time Slot:</strong> {inspectingReservation.event_time || inspectingReservation.service_time || '12:00 PM'}</p>
                        <p><strong>Venue:</strong> {inspectingReservation.venue_name || inspectingReservation.hall_name || "Jo's Diner Complex"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Package & Menu Details */}
                  {inspectingReservation.package_name && (
                    <div className="p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60 space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-[#071A3D] dark:text-white font-bold">
                        <span className="material-icons text-sm text-[#C8102E]">bento</span>
                        <span>Package Tier: <strong>{inspectingReservation.package_name}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Special Requests / Alert Message */}
                  <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-amber-800 dark:text-amber-400">
                      <span className="material-icons text-xs">notes</span>
                      <span>Notification / Dietary Alert:</span>
                    </div>
                    <p className="leading-relaxed">
                      {inspectingReservation.special_requests || inspectingNotification?.message || 'No special dietary requests logged.'}
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Actions Footer */}
            {inspectingReservation && (
              <div className="p-3.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* SMS Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setSmsModal({
                        number: inspectingReservation.contact_phone || inspectingReservation.phone || '',
                        message: `Hello ${inspectingReservation.contact_name}, regarding your reservation #${inspectingReservation.reservation_code} at Jo's Diner...`
                      })
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-xs">sms</span>
                    <span>Send SMS</span>
                  </button>

                  {/* QR Pass Action */}
                  <button
                    type="button"
                    onClick={() => setActiveQRPass(inspectingReservation)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-xs text-[#C8102E]">qr_code</span>
                    <span>View QR Pass</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingReservation(null)
                      setInspectingNotification(null)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>

                  {/* Navigate to Dedicated Management Page */}
                  <button
                    type="button"
                    onClick={(e) => {
                      const notif = inspectingNotification || {
                        reservation_code: inspectingReservation.reservation_code,
                        type: inspectingReservation._source === 'catering' ? 'approval_notice' : 'booking_update'
                      }
                      setInspectingReservation(null)
                      setInspectingNotification(null)
                      handleNavigateToResource(notif, e)
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-icons text-xs">open_in_new</span>
                    <span>Handle in Reservations Hub</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 7. QR PASS PREVIEW MODAL */}
      {activeQRPass && (
        <ReservationQRPass
          reservation={activeQRPass}
          onClose={() => setActiveQRPass(null)}
          isDarkMode={false}
        />
      )}

      {/* 8. SMS MODAL */}
      {smsModal && (
        <SMSModal
          defaultNumber={smsModal.number}
          defaultMessage={smsModal.message}
          onClose={() => setSmsModal(null)}
        />
      )}

    </div>
  )
}

export default NotificationsPage
