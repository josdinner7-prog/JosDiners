import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import ReservationQRPass from '../../components/ReservationQRPass'
import EventBasedMenuRecommendation from '../../components/EventBasedMenuRecommendation'
import LoginPrompt from '../../components/LoginPrompt'

function MyEventsPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser
  const [activeSubTab, setActiveSubTab] = useState('upcoming')
  const [selectedEventModal, setSelectedEventModal] = useState(null)
  const [qrPassEvent, setQrPassEvent] = useState(null)
  const [cancelConfirmModal, setCancelConfirmModal] = useState(null)
  const [recommendMenuEvent, setRecommendMenuEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [eventsList, setEventsList] = useState([])

  useEffect(() => {
    if (currentUser?.email) {
      fetchRemoteEvents()
    } else {
      setEventsList([])
    }
  }, [currentUser?.email])

  const fetchRemoteEvents = async () => {
    if (!currentUser?.email) {
      setEventsList([])
      return
    }

    setIsLoading(true)
    try {
      const userEmail = currentUser.email.trim().toLowerCase()
      const [res, catRes] = await Promise.all([
        api.reservations.getReservations({ role: 'customer', email: userEmail }),
        api.catering.getBookings({ role: 'customer', email: userEmail }).catch(() => ({ bookings: [] }))
      ])

      const combined = []

      // 1. Function Hall & Catering records from reservations table
      if (res?.status === 'success' && Array.isArray(res.reservations)) {
        const hallEvents = res.reservations
          .filter(r => (r.category !== 'table' && r.event_type !== 'Casual Dining Table'))
          .filter(r => !r.email || r.email.trim().toLowerCase() === userEmail)
          .map(r => ({
            id: r.reservation_code || `EVT-${r.reservation_id || r.id}`,
            raw_id: r.reservation_id || r.id,
            title: r.event_name || r.event_type || 'Function Hall Event',
            type: r.event_type || 'Event Booking',
            category: r.category || 'hall',
            hall_name: r.hall_name || 'Jo\'s Diner Event Hall',
            package_name: r.package_name || 'Event Reservation',
            event_date: r.event_date ? r.event_date.split('T')[0] : '',
            event_time: r.event_time || '12:00 PM',
            guests: parseInt(r.guest_count || r.guests, 10) || 30,
            total_amount: parseFloat(r.total_amount || 0),
            status: r.status || 'Pending',
            created_at: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            contact_person: r.contact_name || currentUser?.full_name || 'Customer',
            phone: r.contact_phone || r.phone || 'N/A',
            special_requests: r.special_requests || ''
          }))
        combined.push(...hallEvents)
      }

      // 2. Catering bookings from catering_bookings table
      if (catRes?.status === 'success' && Array.isArray(catRes.bookings)) {
        const catEvents = catRes.bookings
          .filter(b => !b.customer_email || b.customer_email.trim().toLowerCase() === userEmail)
          .map(b => ({
            id: b.booking_code || `CAT-${b.booking_id}`,
            raw_id: b.booking_id,
            title: `Catering: ${b.package_name || b.event_type || 'Event Package'}`,
            type: b.event_type || 'Catering Package',
            category: 'catering',
            hall_name: b.hall_name || b.event_venue || 'Function Hall / Venue',
            package_name: b.package_name || 'Catering Booking',
            event_date: b.event_date ? b.event_date.split('T')[0] : '',
            event_time: b.event_time || '12:00 PM',
            guests: parseInt(b.guest_count, 10) || 30,
            total_amount: parseFloat(b.total_amount || 0),
            status: b.status || 'Pending',
            created_at: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            contact_person: b.customer_name || currentUser?.full_name || 'Customer',
            phone: b.customer_phone || 'N/A',
            special_requests: b.special_requests || ''
          }))
        combined.push(...catEvents)
      }

      setEventsList(combined)
    } catch (e) {
      console.warn('Error fetching events:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = eventsList.filter((evt) => {
    if (activeSubTab === 'upcoming') return evt.status === 'Confirmed' || evt.status === 'Pending'
    if (activeSubTab === 'completed') return evt.status === 'Completed'
    if (activeSubTab === 'cancelled') return evt.status === 'Cancelled'
    return true
  })

  const handleCancelEvent = (eventId) => {
    const updated = eventsList.map((evt) => {
      if (evt.id === eventId) {
        return { ...evt, status: 'Cancelled' }
      }
      return evt
    })
    setEventsList(updated)
    try {
      localStorage.setItem('josdiner_customer_events', JSON.stringify(updated))
    } catch (e) { }
    setCancelConfirmModal(null)
    if (selectedEventModal && selectedEventModal.id === eventId) {
      setSelectedEventModal({ ...selectedEventModal, status: 'Cancelled' })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Confirmed</span>
          </span>
        )
      case 'Completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <span className="material-icons text-sm">check_circle</span>
            <span>Completed</span>
          </span>
        )
      case 'Cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
            <span className="material-icons text-sm">cancel</span>
            <span>Cancelled</span>
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <span className="material-icons text-sm">schedule</span>
            <span>Pending Review</span>
          </span>
        )
    }
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition font-semibold cursor-pointer">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">My Events</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">event_note</span>
              <span>My Reserved Events & Bookings</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Manage your upcoming event reservations, view past completed banquets, and check event schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/reservation?type=hall')}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-4 py-2.5 rounded-lg text-xs font-black shadow transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span className="material-icons text-base">add_circle</span>
              <span>Book New Event</span>
            </button>
          </div>
        </div>

        {/* Main Content: Login Prompt or Events List */}
        {!currentUser ? (
          <LoginPrompt
            title="Please Log In to View Your Events"
            description="Sign in or register to view and manage your function hall reservations, banquet bookings, and event itineraries."
            icon="event_busy"
            isDarkMode={isDarkMode}
          />
        ) : (
          <>
            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-200/70 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 w-fit">
              <button
                onClick={() => setActiveSubTab('upcoming')}
                className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${activeSubTab === 'upcoming'
                  ? 'bg-white dark:bg-[#071A3D] text-[#C8102E] border border-gray-300 dark:border-slate-700 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-base">upcoming</span>
                <span>Upcoming Events</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950 text-[#C8102E]">
                  {eventsList.filter(e => e.status === 'Confirmed' || e.status === 'Pending').length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('completed')}
                className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${activeSubTab === 'completed'
                  ? 'bg-white dark:bg-[#071A3D] text-[#C8102E] border border-gray-300 dark:border-slate-700 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-base">task_alt</span>
                <span>Completed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                  {eventsList.filter(e => e.status === 'Completed').length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('cancelled')}
                className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${activeSubTab === 'cancelled'
                  ? 'bg-white dark:bg-[#071A3D] text-[#C8102E] border border-gray-300 dark:border-slate-700 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <span className="material-icons text-base">block</span>
                <span>Cancelled</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                  {eventsList.filter(e => e.status === 'Cancelled').length}
                </span>
              </button>
            </div>

            {/* Events Grid / List */}
            {isLoading ? (
              <div className={`p-12 rounded-xl border text-center space-y-4 shadow-xs ${isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'}`}>
                <span className="material-icons text-4xl animate-spin text-[#C8102E]">refresh</span>
                <p className="text-sm font-semibold">Loading your reserved events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className={`p-12 rounded-xl border text-center space-y-4 shadow-xs ${isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'}`}>
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-[#C8102E] rounded-full flex items-center justify-center mx-auto text-3xl">
                  <span className="material-icons text-4xl">event_busy</span>
                </div>
                <h3 className="text-xl font-bold">No {activeSubTab} events found</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You do not have any {activeSubTab} event reservations registered under your account yet.
                </p>
                <button
                  onClick={() => navigate('/catering')}
                  className="px-6 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold transition shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <span className="material-icons text-sm">add</span>
                  <span>Book Catering or Hall</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-md space-y-4 relative ${isDarkMode ? 'bg-[#071A3D] border-slate-700 hover:border-slate-600' : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
              >
                {/* Event Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 font-mono">
                      Ref: {evt.id}
                    </span>
                    <h3 className="text-lg font-black text-[#071A3D] dark:text-white mt-0.5 leading-snug">
                      {evt.title}
                    </h3>
                  </div>
                  {getStatusBadge(evt.status)}
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Date & Time</span>
                    <span className="text-[#071A3D] dark:text-gray-200 font-bold block mt-0.5">
                      📅 {evt.event_date}
                    </span>
                    <span className="text-gray-500 text-[11px] font-medium block">
                      ⏰ {evt.event_time}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Venue / Hall</span>
                    <span className="text-[#071A3D] dark:text-gray-200 font-bold block mt-0.5 truncate">
                      🏛️ {evt.hall_name}
                    </span>
                    <span className="text-gray-500 text-[11px] font-medium block">
                      👥 {evt.guests} Guest Capacity
                    </span>
                  </div>
                </div>

                {/* Cost & Inclusions Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Package</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{evt.package_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Total Amount</span>
                    <span className="text-lg font-black text-[#C8102E] font-mono">
                      {evt.total_amount > 0 ? `₱${evt.total_amount.toLocaleString()}` : 'Free Table Booking'}
                    </span>
                  </div>
                </div>

                {/* Event-Based Menu Recommendation Quick Strip */}
                <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-[#C8102E] text-base">restaurant_menu</span>
                    <div>
                      <span className="text-[11px] font-black text-slate-800 dark:text-white block">Event-Based Menu Package</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Curated dishes &amp; budget estimation for {evt.guests} Pax</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecommendMenuEvent(evt)}
                    className="px-2.5 py-1 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-[10px] font-extrabold shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span className="material-icons text-xs">auto_awesome</span>
                    <span>View Menu</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEventModal(evt)}
                      className="px-4 py-2 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer"
                    >
                      View Details
                    </button>

                    {evt.status === 'Confirmed' ? (
                      <button
                        onClick={() => setQrPassEvent(evt)}
                        className="px-3.5 py-2 rounded-md bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-300 dark:border-red-800 text-xs font-bold text-[#C8102E] dark:text-red-400 flex items-center gap-1 transition cursor-pointer"
                        title="View Event Check-In Pass"
                      >
                        <span className="material-icons text-sm">qr_code_2</span>
                        <span>QR Pass</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                        <span className="material-icons text-xs animate-pulse">hourglass_top</span>
                        <span>Pending Approval</span>
                      </span>
                    )}
                  </div>

                  {evt.status === 'Confirmed' && (
                    <button
                      onClick={() => setCancelConfirmModal(evt)}
                      className="px-3.5 py-2 rounded-md bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-300 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 transition cursor-pointer"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
        </>
        )}

      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-md shadow-2xl border border-gray-400 dark:border-slate-500 p-5 space-y-4 overflow-hidden max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-3 border-gray-300 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase font-mono">Reference: {selectedEventModal.id}</span>
                <h3 className="text-lg font-black">{selectedEventModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-500 flex items-center justify-center hover:text-black dark:hover:text-white transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Status</span>
                {getStatusBadge(selectedEventModal.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold block">Event Date</span>
                  <span className="font-bold text-xs text-[#071A3D] dark:text-white">{selectedEventModal.event_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold block">Time Slot</span>
                  <span className="font-bold text-xs text-[#071A3D] dark:text-white">{selectedEventModal.event_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold block">Venue / Function Hall</span>
                  <span className="font-bold text-xs text-[#071A3D] dark:text-white">{selectedEventModal.hall_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold block">Expected Guests</span>
                  <span className="font-bold text-xs text-[#071A3D] dark:text-white">{selectedEventModal.guests} Guests</span>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase font-black block">Contact & Special Notes</span>
                <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300 font-medium">
                  <p><strong>Primary Contact:</strong> {selectedEventModal.contact_person} ({selectedEventModal.phone})</p>
                  <p><strong>Package Type:</strong> {selectedEventModal.package_name}</p>
                  <p><strong>Special Instructions:</strong> {selectedEventModal.special_requests || 'None specified'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-[#071A3D] text-white border border-slate-700 flex items-center justify-between font-black">
                <span className="text-xs">Total Event Pricing:</span>
                <span className="text-lg text-[#C8102E] font-mono">
                  {selectedEventModal.total_amount > 0 ? `₱${selectedEventModal.total_amount.toLocaleString()}` : 'Free Table Booking'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-gray-300 dark:border-slate-700 flex items-center justify-between gap-2">
              {selectedEventModal.status === 'Confirmed' ? (
                <button
                  type="button"
                  onClick={() => {
                    setQrPassEvent(selectedEventModal)
                    setSelectedEventModal(null)
                  }}
                  className="py-2.5 px-4 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <span className="material-icons text-sm">qr_code_2</span>
                  <span>Open Event QR Pass</span>
                </button>
              ) : (
                <div className="text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                  <span className="material-icons text-sm">lock_clock</span>
                  <span>QR Pass unlocks upon confirmation</span>
                </div>
              )}

              <button
                onClick={() => setSelectedEventModal(null)}
                className="py-2.5 px-6 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className={`w-full max-w-md rounded-md p-5 space-y-4 border border-gray-400 dark:border-slate-500 shadow-2xl ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-950/60 text-[#C8102E] border border-red-200 flex items-center justify-center mx-auto text-2xl">
              <span className="material-icons text-2xl">warning</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black">Cancel Reservation?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to cancel event reservation <strong>{cancelConfirmModal.id}</strong> ({cancelConfirmModal.title})?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setCancelConfirmModal(null)}
                className="flex-1 py-2 rounded-md border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer text-gray-700 dark:text-gray-200"
              >
                Keep Reservation
              </button>
              <button
                onClick={() => handleCancelEvent(cancelConfirmModal.id)}
                className="flex-1 py-2 rounded-md bg-[#C8102E] text-white text-xs font-bold hover:bg-[#9B0B21] transition cursor-pointer shadow-xs border border-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event QR Pass Modal */}
      {qrPassEvent && (
        <ReservationQRPass
          reservation={qrPassEvent}
          onClose={() => setQrPassEvent(null)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* EVENT-BASED MENU RECOMMENDATION MODAL */}
      {recommendMenuEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#071A3D] rounded-2xl shadow-2xl border border-gray-300 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-red-50/80 to-white dark:from-[#1C2541] dark:to-[#071A3D]">
              <div>
                <span className="text-[10px] font-mono font-black text-[#C8102E] uppercase">
                  Event Reference: {recommendMenuEvent.id}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-white leading-tight mt-0.5">
                  Menu Recommendations for "{recommendMenuEvent.title}"
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tailored banquet courses for {recommendMenuEvent.guests} Guests at {recommendMenuEvent.hall_name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRecommendMenuEvent(null)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <EventBasedMenuRecommendation
                eventType={recommendMenuEvent.type || recommendMenuEvent.title}
                guestCount={recommendMenuEvent.guests || 30}
                budget={recommendMenuEvent.total_amount || 25000}
                onSelectPackage={(pkg) => {
                  setRecommendMenuEvent(null)
                  navigate(`/catering?package=${encodeURIComponent(pkg.name)}&guests=${recommendMenuEvent.guests}`)
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500">
                Packages can be customized according to your dietary requirements.
              </span>
              <button
                type="button"
                onClick={() => setRecommendMenuEvent(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MyEventsPage
