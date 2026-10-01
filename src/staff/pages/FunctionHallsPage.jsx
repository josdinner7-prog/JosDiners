import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function FunctionHallsPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [functionHalls, setFunctionHalls] = useState([])
  const [hallFilter, setHallFilter] = useState('all')
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false)
  const [newResForm, setNewResForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    reservation_type: 'Function Hall',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    pax: 50,
    notes: ''
  })

  useEffect(() => {
    loadHalls()
  }, [])

  const loadHalls = async () => {
    try {
      const hallRes = await api.functionHalls.getHalls()
      if (hallRes.status === 'success' && Array.isArray(hallRes.halls || hallRes.data)) {
        const list = hallRes.halls || hallRes.data
        if (list.length > 0) {
          setFunctionHalls(list.map(h => ({
            ...h,
            facilities: typeof h.facilities_json === 'string' ? JSON.parse(h.facilities_json) : (Array.isArray(h.facilities) ? h.facilities : (h.facilities_json || []))
          })))
        }
      }
    } catch (e) {
      console.error('Failed to fetch halls:', e)
    }
  }

  const handleCreateReservation = async (e) => {
    e.preventDefault()
    if (!newResForm.customer_name || !newResForm.phone) {
      showToast('Customer Name and Phone Number are required.', 'error')
      return
    }

    const createdRes = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      customer_name: newResForm.customer_name.trim(),
      phone: newResForm.phone.trim(),
      email: newResForm.email.trim() || 'N/A',
      reservation_type: 'Function Hall',
      location: newResForm.location,
      date: newResForm.date,
      time: newResForm.time,
      pax: parseInt(newResForm.pax) || 50,
      deposit: 5000.00,
      total_quote: 25000.00,
      status: 'Confirmed',
      notes: newResForm.notes.trim() || 'Booked directly via Front of House halls directory.'
    }

    setIsNewResModalOpen(false)
    showToast(`Function Hall reservation logged for ${createdRes.customer_name}!`, 'success')

    try {
      await api.reservations.createReservation(createdRes)
    } catch (err) {
      // Handled
    }
  }

  const filteredHalls = (functionHalls || []).filter(hall => {
    if (!hall) return false
    return hallFilter === 'all' || hall.status === hallFilter
  })

  return (
    <div className="space-y-4 pb-10 text-xs animate-in fade-in duration-150">
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-[#C8102E]">meeting_room</span>
            <h3 className="font-extrabold text-sm tracking-tight">Function Halls & Event Venues Directory</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Inspect venue banquet room capacity, hourly rates, acoustic facilities, and book directly for guests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewResForm(prev => ({ ...prev, reservation_type: 'Function Hall', location: functionHalls[0]?.hall_name || 'Grand Ballroom' }))
              setIsNewResModalOpen(true)
            }}
            className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-icons text-sm">event_available</span>
            <span>+ Book Venue Reservation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {filteredHalls.map(hall => {
          const facilities = Array.isArray(hall.facilities) ? hall.facilities : (
            typeof hall.facilities_json === 'string' ? JSON.parse(hall.facilities_json) : ['Centralized Air Conditioning', 'Integrated Audio System', 'Presentation Stage']
          )

          return (
            <div
              key={hall.hall_id || hall.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
            >
              <div>
                <div className="relative h-48 w-full bg-slate-800">
                  <img
                    src={hall.hall_image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'}
                    alt={hall.hall_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {hall.status || 'Available'}
                  </span>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-black text-base drop-shadow-md">{hall.hall_name}</h4>
                    <p className="text-[11px] text-slate-200 flex items-center gap-1 mt-0.5">
                      <span className="material-icons text-xs text-amber-400">location_on</span>
                      <span>{hall.location || "Jo's Diner Banquet Wing"}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue Capacity</span>
                      <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">Up to {hall.capacity} Pax</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Rental Rate</span>
                      <span className="font-mono font-black text-sm text-[#C8102E]">₱{Number(hall.hourly_rate || 0).toLocaleString()}/hr</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    {hall.description || 'Spacious event venue with premium audio-visual equipment.'}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Amenities & Facilities:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {facilities.slice(0, 4).map((fac, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          ✓ {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setNewResForm(prev => ({
                      ...prev,
                      reservation_type: 'Function Hall',
                      location: hall.hall_name,
                      pax: hall.capacity
                    }))
                    setIsNewResModalOpen(true)
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-icons text-sm">edit_calendar</span>
                  <span>Reserve {hall.hall_name}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredHalls.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <span className="material-icons text-4xl block mb-2 opacity-50">meeting_room</span>
          <p className="font-bold">No function halls found</p>
        </div>
      )}

      {/* New Reservation Modal */}
      {isNewResModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateReservation}
            className={`w-full max-w-md rounded-xl p-5 shadow-2xl border space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
          >
            <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
              <h3 className="font-extrabold text-xs">New Function Hall Reservation</h3>
              <button type="button" onClick={() => setIsNewResModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full name..."
                  value={newResForm.customer_name}
                  onChange={(e) => setNewResForm({ ...newResForm, customer_name: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="0917-XXX-XXXX"
                  value={newResForm.phone}
                  onChange={(e) => setNewResForm({ ...newResForm, phone: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Hall Location</label>
                <input
                  type="text"
                  value={newResForm.location}
                  onChange={(e) => setNewResForm({ ...newResForm, location: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Pax</label>
                <input
                  type="number"
                  min="1"
                  value={newResForm.pax}
                  onChange={(e) => setNewResForm({ ...newResForm, pax: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold text-center ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Date & Time</label>
                <input
                  type="date"
                  value={newResForm.date}
                  onChange={(e) => setNewResForm({ ...newResForm, date: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="w-full py-2.5 rounded-lg bg-[#C8102E] text-white font-bold text-xs border border-red-700 shadow-2xs cursor-pointer">
                Confirm Reservation
              </button>
              <button type="button" onClick={() => setIsNewResModalOpen(false)} className="w-full py-2.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 font-bold text-xs cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
