import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import ReservationQRPass from '../../components/ReservationQRPass'
import LoginPrompt from '../../components/LoginPrompt'

function NotificationsPage(props) {
  const { showToast } = useToast()
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser

  const [filterCategory, setFilterCategory] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeQRPassModal, setActiveQRPassModal] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.email) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await api.notifications.getNotifications({
        role: 'customer',
        email: currentUser.email
      })
      if (res && res.status === 'success') {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unread_count || 0)
      }
    } catch (err) {
      console.warn('Load notifications error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.email])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead({
        role: 'customer',
        email: currentUser?.email || ''
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
      if (showToast) showToast('All notifications marked as read.', 'success')
    } catch (err) {
      if (showToast) showToast('Failed to mark notifications as read.', 'error')
    }
  }

  const toggleReadStatus = async (item) => {
    const nextRead = item.is_read ? 0 : 1
    try {
      await api.notifications.markAsRead(item.notification_id, nextRead === 1)
      setNotifications(prev => prev.map(n => 
        n.notification_id === item.notification_id ? { ...n, is_read: nextRead } : n
      ))
      setUnreadCount(prev => Math.max(0, nextRead ? prev - 1 : prev + 1))
    } catch (err) {
      if (showToast) showToast('Failed to update notification.', 'error')
    }
  }

  const handleDeleteNotification = async (id) => {
    try {
      await api.notifications.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.notification_id !== id))
      showToast('Notification dismissed', 'info')
    } catch (err) {
      console.error(err)
      showToast('Failed to dismiss notification.', 'error')
    }
  }

  const handleSendToGmail = async (item) => {
    const targetEmail = currentUser?.email || item.recipient_email
    if (!targetEmail) {
      showToast('Please make sure you have a valid Gmail address in your account.', 'warning')
      return
    }

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
      showToast('Failed to send notification email.', 'error')
    } finally {
      setSendingEmailId(null)
    }
  }

  const filtered = notifications.filter((n) => {
    if (filterCategory === 'unread') return !n.is_read
    if (filterCategory === 'approval_notice') return n.type === 'approval_notice'
    if (filterCategory === 'payment_confirmation') return n.type === 'payment_confirmation'
    if (filterCategory === 'booking_reminder') return n.type === 'booking_reminder'
    if (filterCategory === 'cancellation_alert') return n.type === 'cancellation_alert'
    if (filterCategory === 'completion_notice') return n.type === 'completion_notice'
    if (filterCategory === 'booking_update') return n.type === 'booking_update'
    return true
  })

  // Format notification time
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now'
    try {
      const d = new Date(timeStr)
      const now = new Date()
      const diffMs = now - d
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (e) {
      return timeStr
    }
  }

  // Get icon and color by notification type
  const getTypeMeta = (type) => {
    switch (type) {
      case 'approval_notice':
        return {
          icon: 'verified',
          badge: 'Approval Notice',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        }
      case 'completion_notice':
        return {
          icon: 'task_alt',
          badge: 'Visit Completed',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        }
      case 'payment_confirmation':
        return {
          icon: 'payments',
          badge: 'Payment Confirmation',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
        }
      case 'booking_reminder':
        return {
          icon: 'alarm',
          badge: 'Booking Reminder',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        }
      case 'cancellation_alert':
        return {
          icon: 'cancel',
          badge: 'Cancellation Alert',
          badgeClass: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
          iconBg: 'bg-red-500/15 text-red-600 dark:text-red-400'
        }
      case 'order_update':
        return {
          icon: 'restaurant',
          badge: 'Food Order Update',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        }
      case 'booking_update':
      default:
        return {
          icon: 'calendar_month',
          badge: 'Reservation Update',
          badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          iconBg: 'bg-[#C8102E]/10 text-[#C8102E]'
        }
    }
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition font-semibold cursor-pointer">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">Reservation Notification Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">notifications_active</span>
              <span>Notification Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Central hub for your reservation approvals, payment updates, food order updates, check-in passes, and event reminders.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={fetchNotifications}
              className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-xs font-bold rounded-lg transition border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 cursor-pointer"
              title="Refresh Notifications"
            >
              <span className={`material-icons text-base ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            </button>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 bg-[#C8102E] hover:bg-[#9B0B21] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-icons text-base">done_all</span>
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          </div>
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'order_update', label: 'Food Orders', count: notifications.filter(n => n.type === 'order_update').length },
            { id: 'approval_notice', label: 'Approvals', count: notifications.filter(n => n.type === 'approval_notice').length },
            { id: 'completion_notice', label: 'Completed', count: notifications.filter(n => n.type === 'completion_notice').length },
            { id: 'payment_confirmation', label: 'Payments', count: notifications.filter(n => n.type === 'payment_confirmation').length },
            { id: 'booking_reminder', label: 'Reminders', count: notifications.filter(n => n.type === 'booking_reminder').length },
            { id: 'cancellation_alert', label: 'Cancellations', count: notifications.filter(n => n.type === 'cancellation_alert').length },
            { id: 'booking_update', label: 'Booking Updates', count: notifications.filter(n => n.type === 'booking_update').length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border cursor-pointer flex items-center gap-1.5 ${
                filterCategory === tab.id
                  ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filterCategory === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content View: Login Required or Notifications List */}
        {!currentUser ? (
          <LoginPrompt
            title="Please Log In to View Notifications"
            description="Sign in or create an account to track your reservation confirmations, table assignments, and dining updates."
            icon="notifications_off"
            isDarkMode={isDarkMode}
          />
        ) : filtered.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center space-y-4 shadow-xs ${
            isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'
          }`}>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-[#C8102E] rounded-full flex items-center justify-center mx-auto text-3xl">
              <span className="material-icons text-4xl">notifications_none</span>
            </div>
            <h3 className="text-lg font-bold">No notifications found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filterCategory === 'unread' ? 'You are all caught up on all notices.' : 'No notifications in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const meta = getTypeMeta(item.type)
              return (
                <div
                  key={item.notification_id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                    !item.is_read
                      ? isDarkMode
                        ? 'bg-slate-900/95 border-[#C8102E]/60 ring-1 ring-[#C8102E]/30'
                        : 'bg-red-50/40 border-red-300 ring-1 ring-red-200'
                      : isDarkMode
                      ? 'bg-[#071A3D] border-slate-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                    <span className="material-icons text-xl">{meta.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${meta.badgeClass}`}>
                          {meta.badge}
                        </span>
                        {item.reservation_code && (
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                            item.type === 'order_update'
                              ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'text-[#C8102E] bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
                          }`}>
                            {item.reservation_code}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                        {formatTime(item.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-[#071A3D] dark:text-white flex items-center gap-2">
                      <span>{item.title}</span>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#C8102E] shrink-0 animate-ping"></span>
                      )}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      {item.message}
                    </p>

                    {/* Notification Actions */}
                    <div className="pt-2 flex items-center gap-3 flex-wrap">
                      {item.type === 'order_update' ? (
                        <button
                          type="button"
                          onClick={() => navigate('/my-orders')}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-icons text-xs">receipt_long</span>
                          <span>View in My Orders</span>
                        </button>
                      ) : (
                        <>
                          {item.reservation_code && item.type !== 'cancellation_alert' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQRPassModal({
                                  reservation_code: item.reservation_code,
                                  id: item.reservation_code,
                                  contact_name: currentUser?.full_name || 'Customer',
                                  status: item.type === 'approval_notice' ? 'Confirmed' : 'Pending'
                                })
                              }}
                              className="text-xs font-black text-[#C8102E] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-icons text-xs">qr_code_2</span>
                              <span>View QR Pass</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate('/my-reservations')}
                            className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#C8102E] flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-icons text-xs">table_restaurant</span>
                            <span>My Bookings</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={sendingEmailId === item.notification_id}
                        onClick={() => handleSendToGmail(item)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Send this notification directly to your Gmail"
                      >
                        <span className="material-icons text-xs">
                          {sendingEmailId === item.notification_id ? 'hourglass_top' : 'mail'}
                        </span>
                        <span>{sendingEmailId === item.notification_id ? 'Sending...' : 'Send to Gmail'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReadStatus(item)}
                        className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
                      >
                        {item.is_read ? 'Mark Unread' : 'Mark Read'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(item.notification_id)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition cursor-pointer ml-auto"
                        title="Dismiss"
                      >
                        <span className="material-icons text-xs">delete_outline</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Interactive Reservation Pass Modal if opened from notification */}
      {activeQRPassModal && (
        <ReservationQRPass
          reservation={activeQRPassModal}
          onClose={() => setActiveQRPassModal(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

export default NotificationsPage
