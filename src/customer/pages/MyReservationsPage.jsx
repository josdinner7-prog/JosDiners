import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import ReservationQRPass from '../../components/ReservationQRPass'
import LoginPrompt from '../../components/LoginPrompt'

function MyReservationsPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [selectedResModal, setSelectedResModal] = useState(null)
  const [qrPassReservation, setQrPassReservation] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [reservationsList, setReservationsList] = useState([])

  // Synchronize with API real reservations for current user
  useEffect(() => {
    if (currentUser?.email) {
      fetchRemoteReservations()
    } else {
      setReservationsList([])
    }
  }, [currentUser?.email])

  const fetchRemoteReservations = async () => {
    if (!currentUser?.email) {
      setReservationsList([])
      return
    }

    setIsLoading(true)
    try {
      const userEmail = currentUser.email.trim().toLowerCase()
      const res = await api.reservations.getReservations({ role: 'customer', email: userEmail })
      if (res?.status === 'success' && Array.isArray(res.reservations)) {
        const mapped = res.reservations
          .filter(r => (r.category || 'table') === 'table')
          .filter(r => !r.email || r.email.trim().toLowerCase() === userEmail)
          .map(r => ({
            id: r.reservation_code || `RES-${r.reservation_id || r.id}`,
            raw_id: r.reservation_id || r.id,
            reservation_code: r.reservation_code,
            qr_token: r.qr_token,
            email: r.email,
            checked_in_at: r.checked_in_at,
            checked_in_by: r.checked_in_by,
            title: r.event_type || 'Table Reservation',
            type: 'Table Reservation',
            category: 'table',
            hall_name: r.hall_name || `Dining Table (Party of ${r.guest_count || r.guests || 2})`,
            package_name: r.package_name || 'Standard Table Reservation',
            event_date: r.event_date ? r.event_date.split('T')[0] : '',
            event_time: r.event_time || '07:00 PM',
            guests: parseInt(r.guest_count || r.guests, 10) || 2,
            total_amount: parseFloat(r.total_amount || 0),
            status: r.status || 'Pending',
            table_number: r.table_number || null,
            created_at: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            contact_person: r.contact_name || currentUser?.full_name || 'Customer',
            phone: r.contact_phone || r.phone || 'N/A',
            special_requests: r.special_requests || 'Standard dining reservation'
          }))
          .sort((a, b) => b.raw_id - a.raw_id)

        setReservationsList(mapped)
      }
    } catch (e) {
      console.log('Error fetching reservations:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReservations = reservationsList.filter(res => {
    const isSeated = Boolean(res.checked_in_at) || res.status === 'Seated'
    if (activeTab === 'upcoming') return (res.status === 'Confirmed' || res.status === 'Pending') && !isSeated
    if (activeTab === 'completed') return res.status === 'Completed' || isSeated
    if (activeTab === 'cancelled') return res.status === 'Cancelled'
    return true
  })

  const handleCancelReservation = (resId) => {
    setReservationsList(prev => {
      const updated = prev.map(item => item.id === resId ? { ...item, status: 'Cancelled' } : item)
      try {
        const savedEvents = localStorage.getItem('josdiner_customer_events')
        if (savedEvents) {
          const events = JSON.parse(savedEvents)
          const merged = events.map(e => e.id === resId ? { ...e, status: 'Cancelled' } : e)
          localStorage.setItem('josdiner_customer_events', JSON.stringify(merged))
        }
      } catch (e) { }
      return updated
    })
    setCancelModal(null)
    if (showToast) showToast(`Reservation ${resId} has been cancelled.`, 'info')
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">My Reservations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">calendar_month</span>
              <span>My Table Reservations</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              View, manage, and track your table bookings at Jo's Diner
            </p>
          </div>

          <button
            onClick={() => navigate('/reservation')}
            className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer active:scale-95"
          >
            <span className="material-icons text-base">add</span>
            <span>Book a New Table</span>
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-300 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Reservations', count: reservationsList.length },
            { id: 'upcoming', label: 'Upcoming', count: reservationsList.filter(r => r.status === 'Confirmed' || r.status === 'Pending').length },
            { id: 'completed', label: 'Completed', count: reservationsList.filter(r => r.status === 'Completed').length },
            { id: 'cancelled', label: 'Cancelled', count: reservationsList.filter(r => r.status === 'Cancelled').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-[#C8102E] text-white shadow-xs'
                  : isDarkMode
                    ? 'bg-slate-900 border border-slate-700 text-gray-300 hover:bg-slate-800'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content View: Login Prompt or Reservations List */}
        {!currentUser ? (
          <LoginPrompt
            title="Please Log In to View Your Reservations"
            description="Sign in or register to view your table reservations, QR passes, and assigned tables."
            icon="table_restaurant"
            isDarkMode={isDarkMode}
          />
        ) : filteredReservations.length === 0 ? (
          <div className="py-16 text-center rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-[#071A3D] p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-[#C8102E]">
              <span className="material-icons text-3xl">event_busy</span>
            </div>
            <h3 className="text-lg font-black text-[#071A3D] dark:text-white">No Table Reservations Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              You don't have any {activeTab !== 'all' ? activeTab : ''} table bookings registered under your account.
            </p>
            <button
              onClick={() => navigate('/reservation')}
              className="px-5 py-2.5 bg-[#C8102E] text-white rounded-lg font-bold text-xs shadow-xs hover:bg-[#9B0B21] transition cursor-pointer"
            >
              Reserve a Table Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReservations.map((res) => {
              const isSeated = Boolean(res.checked_in_at) || res.status === 'Seated'
              const statusColor = isSeated
                ? 'bg-blue-600 text-white border-blue-500'
                : res.status === 'Confirmed'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : res.status === 'Completed'
                    ? 'bg-slate-700 text-slate-200 border-slate-600'
                    : 'bg-amber-600 text-white border-amber-500'
              const displayStatus = isSeated ? 'Seated' : res.status

              return (
                <div
                  key={res.id}
                  className={`rounded-lg border shadow-xs transition-all duration-200 flex flex-col justify-between p-5 space-y-4 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
                    }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Code & Status */}
                    <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-base text-[#C8102E]">calendar_today</span>
                        <span className="font-mono font-black text-xs text-[#071A3D] dark:text-white tracking-wider">
                          {res.id}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs border ${statusColor}`}>
                        {displayStatus}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base text-[#071A3D] dark:text-white tracking-tight">
                      {res.title || 'Table Reservation'}
                    </h3>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-md border border-gray-200 dark:border-slate-800">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Date & Time</span>
                        <p className="font-bold text-[#071A3D] dark:text-white mt-0.5">
                          {res.event_date} @ {res.event_time}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-md border border-gray-200 dark:border-slate-800">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Party Size</span>
                        <p className="font-bold text-[#071A3D] dark:text-white mt-0.5">
                          {res.guests} Guests (Pax)
                        </p>
                      </div>
                    </div>

                    {/* Assigned Table Badge */}
                    {res.table_number ? (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-extrabold">
                        <span className="material-icons text-base text-emerald-600">table_restaurant</span>
                        <span>Assigned Table: <strong>{res.table_number}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        <span className="material-icons text-xs text-amber-600">info</span>
                        <span>Table assignment will be confirmed upon diner check-in</span>
                      </div>
                    )}

                    {/* Contact Person */}
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-bold text-gray-700 dark:text-gray-200">Reserved for: </span>
                      <span>{res.contact_person} ({res.phone})</span>
                    </div>

                    {/* Special Requests */}
                    {res.special_requests && (
                      <div className="p-2.5 rounded-md bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                        <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Notes & Special Requests:</span>
                        <p className="mt-0.5 leading-relaxed">{res.special_requests}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedResModal(res)}
                        className="px-3.5 py-1.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        View Details
                      </button>

                      {isSeated ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-extrabold flex items-center gap-1">
                            <span className="material-icons text-xs">done_all</span>
                            <span>Already Seated</span>
                          </span>
                          <button
                            onClick={() => setQrPassReservation(res)}
                            className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold transition cursor-pointer"
                            title="View Previous QR Pass"
                          >
                            View Pass
                          </button>
                        </div>
                      ) : res.status === 'Confirmed' ? (
                        <button
                          onClick={() => setQrPassReservation(res)}
                          className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#C8102E] to-[#9B0B21] hover:from-[#A00D24] hover:to-[#7E0A1D] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer border border-red-700"
                          title="Open Scannable Entry Pass"
                        >
                          <span className="material-icons text-sm">qr_code_2</span>
                          <span>Open Entry QR Pass</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                          <span className="material-icons text-xs animate-pulse">hourglass_top</span>
                          <span>Pending Approval</span>
                        </span>
                      )}
                    </div>

                    {res.status === 'Confirmed' && (
                      <button
                        onClick={() => setCancelModal(res)}
                        className="px-3.5 py-1.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-bold text-[#C8102E] dark:text-red-400 hover:bg-red-100 transition cursor-pointer"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Details Modal */}
      {selectedResModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-md p-5 space-y-4 border border-gray-300 dark:border-slate-700 shadow-2xl ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#C8102E]">calendar_month</span>
                <h3 className="font-extrabold text-base">Reservation Details</h3>
              </div>
              <button
                onClick={() => setSelectedResModal(null)}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-700"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Reservation Code:</span>
                <span className="font-mono font-bold text-[#C8102E]">{selectedResModal.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Date:</span>
                <span className="font-bold">{selectedResModal.event_date}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Time Slot:</span>
                <span className="font-bold">{selectedResModal.event_time}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Guests (Pax):</span>
                <span className="font-bold">{selectedResModal.guests} Guests</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-emerald-600">{selectedResModal.status}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Assigned Table:</span>
                <span className="font-bold text-emerald-600">{selectedResModal.table_number || 'Auto-Assigned on Arrival'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500">Reserved For:</span>
                <span className="font-bold">{selectedResModal.contact_person}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Notes & Special Requests:</span>
                <p className="p-2.5 rounded-sm bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 leading-relaxed font-medium">
                  {selectedResModal.special_requests || 'No special requests.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setQrPassReservation(selectedResModal)
                  setSelectedResModal(null)
                }}
                className="flex-1 py-2.5 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span className="material-icons text-sm">qr_code_2</span>
                <span>Open QR Pass</span>
              </button>

              <button
                onClick={() => setSelectedResModal(null)}
                className="py-2.5 px-4 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 transition cursor-pointer text-gray-700 dark:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Pass Voucher Modal */}
      {qrPassReservation && (
        <ReservationQRPass
          reservation={qrPassReservation}
          onClose={() => setQrPassReservation(null)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-md p-5 space-y-4 border border-gray-300 dark:border-slate-700 shadow-2xl ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-950/60 text-[#C8102E] flex items-center justify-center mx-auto border border-red-200 dark:border-red-900">
              <span className="material-icons text-2xl">warning</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base">Cancel Reservation?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to cancel reservation <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{cancelModal.id}</span> for {cancelModal.event_date}?
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 transition cursor-pointer text-gray-700 dark:text-gray-200"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelReservation(cancelModal.id)}
                className="flex-1 py-2.5 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold shadow-xs transition cursor-pointer border border-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MyReservationsPage
