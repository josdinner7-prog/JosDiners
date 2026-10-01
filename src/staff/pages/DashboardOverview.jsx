import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import { normalizeStaffOrder, normalizeStaffReservation } from '../utils/normalizers'

export default function DashboardOverview(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const { showToast } = useToast()

  const staffUser = props.staffUser || context.staffUser
  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [cateringSchedules, setCateringSchedules] = useState([])
  const [messages, setMessages] = useState([])
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false)
  const [newHandoffSubject, setNewHandoffSubject] = useState('')
  const [newHandoffBody, setNewHandoffBody] = useState('')
  const [newHandoffPriority, setNewHandoffPriority] = useState('MEDIUM')

  useEffect(() => {
    loadOverviewData()
  }, [])

  const loadOverviewData = async () => {
    try {
      const data = await api.orders.getOrders()
      const list = (data.status === 'success' && Array.isArray(data.orders || data.data)) ? (data.orders || data.data) : []
      if (list.length > 0) {
        setOrders(list.map(normalizeStaffOrder))
      }
    } catch (e) {
      // Keep empty
    }

    try {
      const data = await api.reservations.getReservations()
      const rawList = (data.status === 'success' && Array.isArray(data.reservations || data.data)) ? (data.reservations || data.data) : []
      if (rawList.length > 0) {
        setReservations(rawList.map(normalizeStaffReservation).filter(Boolean))
      }
    } catch (e) {
      // Keep empty
    }
  }

  const handleCreateHandoff = (e) => {
    e.preventDefault()
    if (!newHandoffSubject || !newHandoffBody) {
      showToast('Subject and Details are required.', 'error')
      return
    }

    const newNote = {
      id: Date.now(),
      priority: newHandoffPriority,
      type: 'Shift Handoff Note',
      sender: `${staffUser?.username || 'Staff User'} (${staffUser?.role || 'Front of House'})`,
      contact: 'Internal Desk',
      subject: newHandoffSubject.trim(),
      time: 'Just now',
      unread: false,
      message: newHandoffBody.trim(),
      replies: []
    }

    setMessages(prev => [newNote, ...prev])
    setIsHandoffModalOpen(false)
    setNewHandoffSubject('')
    setNewHandoffBody('')
    setNewHandoffPriority('MEDIUM')
    showToast('Internal Front of House log note posted!', 'success')
  }

  const pendingOrders = orders.filter(o => (o.status === 'Pending' || o.status === 'New') && (o.payment_status || '').toLowerCase() === 'paid')
  const cookingOrders = orders.filter(o => o.status === 'In Progress' || o.status === 'Preparing')

  return (
    <div className="space-y-5 pb-10 text-xs animate-in fade-in duration-150">
      {/* Front of House Operational Console Banner Header */}
      <div className="rounded-2xl bg-[#C8102E] p-6 text-white border border-slate-600 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">SHIFT ACTIVE • ONLINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome back, {staffUser?.full_name || staffUser?.name || 'Maria Santos'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Morning Shift (08:00 AM - 04:00 PM)
            </p>
          </div>

          {/* Quick Action Shortcut Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/staff/pos')}
              className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 border border-red-700 cursor-pointer"
            >
              <span className="material-icons text-base">add_shopping_cart</span>
              <span>+ Open Counter POS</span>
            </button>

            <button
              onClick={() => navigate('/staff/reservations')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-extrabold text-xs transition active:scale-95 shadow-xs border border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-icons text-base">event</span>
              <span>+ Log Reservation</span>
            </button>

            <button
              onClick={() => navigate('/staff/packages')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-extrabold text-xs transition active:scale-95 shadow-xs border border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-icons text-base">celebration</span>
              <span>+ Schedule Catering</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview Row */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Shift Operational Summary
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">Live Sync</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: New Pending Orders */}
          <div className={`p-5 rounded-2xl border border-l-4 border-l-[#C8102E] transition-all duration-300 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Orders</span>
                <div className="text-2xl font-black text-[#C8102E] mt-1">{pendingOrders.length}</div>
              </div>
              <span className="w-10 h-10 rounded-xl bg-red-50 text-[#C8102E] dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center font-bold shadow-xs border border-red-300">
                <span className="material-icons text-xl">receipt_long</span>
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-slate-300 dark:border-slate-700 text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Needs Kitchen Approval</span>
              </span>
              <button onClick={() => navigate('/staff/orders')} className="text-[#C8102E] hover:underline font-extrabold text-xs cursor-pointer">
                Review →
              </button>
            </div>
          </div>

          {/* Card 2: Kitchen Cooking */}
          <div className={`p-5 rounded-2xl border border-l-4 border-l-amber-500 transition-all duration-300 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kitchen Cooking</span>
                <div className="text-2xl font-black text-amber-500 mt-1">{cookingOrders.length}</div>
              </div>
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs border border-amber-300">
                <span className="material-icons text-xl">soup_kitchen</span>
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-slate-300 dark:border-slate-700 text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">Active Stovetop Queue</span>
              <span className="text-slate-400 font-semibold">Live</span>
            </div>
          </div>

          {/* Card 3: Table Reservations */}
          <div className={`p-5 rounded-2xl border border-l-4 border-l-emerald-500 transition-all duration-300 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reservations Today</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{reservations.length}</div>
              </div>
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-emerald-300">
                <span className="material-icons text-xl">event_available</span>
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-slate-300 dark:border-slate-700 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Scheduled Guest Bookings</span>
              <button onClick={() => navigate('/staff/reservations')} className="text-emerald-600 hover:underline font-extrabold text-xs cursor-pointer">
                View Queue →
              </button>
            </div>
          </div>

          {/* Card 4: Catering & Events */}
          <div className={`p-5 rounded-2xl border border-l-4 border-l-purple-500 transition-all duration-300 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Catering Events</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{cateringSchedules.length}</div>
              </div>
              <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs border border-purple-300">
                <span className="material-icons text-xl">celebration</span>
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-slate-300 dark:border-slate-700 text-[11px]">
              <span className="text-purple-600 dark:text-purple-400 font-extrabold">Event Contracts Active</span>
              <button onClick={() => navigate('/staff/packages')} className="text-purple-600 hover:underline font-extrabold text-xs cursor-pointer">
                Dispatch →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Tickets Table & Express Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Broad Operational Overview */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Upcoming Reservations */}
          <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-400 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-emerald-600 text-lg">event_seat</span>
                <h3 className="font-extrabold text-sm tracking-tight">Upcoming Bookings</h3>
              </div>
              <button onClick={() => navigate('/staff/reservations')} className="text-xs font-extrabold text-emerald-600 hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-3">
              {reservations.slice(0, 4).map(res => (
                <div key={res.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-bold text-xs">{res.customer_name}</p>
                    <p className="text-[10px] text-slate-500">{res.date} at {res.time} • {res.pax || res.guests || 2} Guests</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {res.status}
                  </span>
                </div>
              ))}
              {reservations.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No upcoming bookings</p>}
            </div>
          </div>

          {/* Today's Events / Catering */}
          <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-400 dark:border-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-purple-600 text-lg">celebration</span>
                <h3 className="font-extrabold text-sm tracking-tight">Today's Events</h3>
              </div>
              <button onClick={() => navigate('/staff/packages')} className="text-xs font-extrabold text-purple-600 hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-3">
              {cateringSchedules.slice(0, 4).map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="font-bold text-xs">{event.customer_name || event.client_name}</p>
                    <p className="text-[10px] text-slate-500">{event.event_title || event.event_type} • {event.event_date || event.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-300">
                    {event.status}
                  </span>
                </div>
              ))}
              {cateringSchedules.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No events scheduled today</p>}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Station Shortcuts & Shift Notes */}
        <div className="lg:col-span-4 space-y-5">
          {/* Station Express Shortcuts Card */}
          <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <h3 className="font-extrabold text-xs flex items-center gap-2 uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="material-icons text-[#C8102E] text-base">bolt</span>
              <span>Station Express Checkout</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/staff/pos?type=Dine-in')}
                className={`p-3.5 rounded-xl border text-left transition shadow-xs hover:shadow-md active:scale-95 cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 hover:border-[#C8102E]' : 'bg-slate-50 border-slate-400 hover:border-[#C8102E] hover:bg-red-50/20'}`}
              >
                <span className="material-icons text-xl text-[#C8102E] block mb-1">restaurant</span>
                <span className="font-extrabold text-xs block">Dine-In POS</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Table Order</span>
              </button>

              <button
                onClick={() => navigate('/staff/pos?type=Takeout')}
                className={`p-3.5 rounded-xl border text-left transition shadow-xs hover:shadow-md active:scale-95 cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-600 hover:border-amber-500' : 'bg-slate-50 border-slate-400 hover:border-amber-500 hover:bg-amber-50/20'}`}
              >
                <span className="material-icons text-xl text-amber-500 block mb-1">takeout_dining</span>
                <span className="font-extrabold text-xs block">Takeout Counter</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Fast Pick</span>
              </button>
            </div>
          </div>

          {/* Shift Notes Log Box */}
          <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-400 dark:border-slate-600">
              <h3 className="font-extrabold text-xs flex items-center gap-2 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="material-icons text-amber-500 text-base">forum</span>
                <span>Internal Shift Notes</span>
              </h3>
              <button
                onClick={() => setIsHandoffModalOpen(true)}
                className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#C8102E] text-white hover:bg-[#9B0B21] shadow-xs cursor-pointer"
              >
                + Log Note
              </button>
            </div>

            <div className="space-y-2.5">
              {messages.slice(0, 2).map(note => (
                <div key={note.id} className={`p-3 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center text-[10px] font-extrabold">
                    <span className="text-[#C8102E] dark:text-amber-400">{note.sender}</span>
                    <span className="text-slate-400">{note.time}</span>
                  </div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-1.5">{note.subject}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-2">No shift notes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Handoff Note Modal */}
      {isHandoffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateHandoff}
            className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
          >
            <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
              <h3 className="font-black text-sm">Post Front of House Log Note</h3>
              <button type="button" onClick={() => setIsHandoffModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                <select
                  value={newHandoffPriority}
                  onChange={(e) => setNewHandoffPriority(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Reservation or Kitchen Alert..."
                  value={newHandoffSubject}
                  onChange={(e) => setNewHandoffSubject(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write shift note details..."
                  value={newHandoffBody}
                  onChange={(e) => setNewHandoffBody(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer">
                Post Note
              </button>
              <button type="button" onClick={() => setIsHandoffModalOpen(false)} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold text-xs cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
