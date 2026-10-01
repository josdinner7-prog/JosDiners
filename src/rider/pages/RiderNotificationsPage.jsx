import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function RiderNotificationsPage() {
  const { riderData, fetchRiderData } = useOutletContext()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const riderId = riderData?.user_id || riderData?.rider_id

  const loadNotifications = async () => {
    if (!riderId) return
    setIsLoading(true)
    try {
      const res = await api.riders.getNotifications(riderId)
      if (res.status === 'success') {
        setNotifications(res.notifications || [])
      }
    } catch (err) {
      showToast('Could not load notifications.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [riderId])

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.notifications.markAsRead(notif.notification_id, true)
        setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n))
        await fetchRiderData()
      } catch (e) {}
    }

    if (notif.action_url) {
      navigate(notif.action_url)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead('rider')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      await fetchRiderData()
      showToast('All notifications marked as read.', 'success')
    } catch (e) {
      showToast('Could not mark all as read.', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#071A3D] flex items-center gap-2">
            <span className="material-icons text-[#C8102E]">notifications</span>
            <span>Rider Notifications</span>
          </h2>
          <p className="text-xs text-slate-400">
            Dispatch alerts, assignment requests, and staff updates
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-bold text-slate-600 hover:text-[#071A3D] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <span className="material-icons text-3xl text-slate-300 animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-bold">Checking alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
            <span className="material-icons text-2xl">notifications_off</span>
          </div>
          <h4 className="font-bold text-sm text-slate-600">No Notifications</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You're completely up to date. You will be alerted whenever an order is assigned or updated.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map(notif => {
            const isUnread = !notif.is_read

            return (
              <div
                key={notif.notification_id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-lg border transition cursor-pointer space-y-1.5 active:scale-98 ${
                  isUnread
                    ? 'bg-[#C8102E]/5 border-[#C8102E]/30 shadow-sm'
                    : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isUnread ? 'bg-[#C8102E] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span className="material-icons text-sm">
                        {notif.type === 'assignment' ? 'two_wheeler' : 'notifications'}
                      </span>
                    </div>
                    <strong className="text-xs font-black text-[#071A3D] leading-tight">
                      {notif.title}
                    </strong>
                  </div>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#C8102E] shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-xs text-slate-500 pl-9 leading-relaxed">
                  {notif.message}
                </p>

                <div className="pl-9 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                  {notif.action_url && (
                    <span className="text-[#C8102E] font-bold font-sans flex items-center gap-0.5">
                      <span>View</span>
                      <span className="material-icons text-xs">arrow_forward</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
