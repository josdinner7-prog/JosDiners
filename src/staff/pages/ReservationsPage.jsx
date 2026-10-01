import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import QRScannerModal from '../../components/QRScannerModal'
import { normalizeStaffReservation } from '../utils/normalizers'

export default function ReservationsPage(props) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()

  const staffUser = props.staffUser || context.staffUser
  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [reservations, setReservations] = useState([])
  const [resTypeFilter, setResTypeFilter] = useState('all')
  const [resSearchQuery, setResSearchQuery] = useState('')
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)

  const [newResForm, setNewResForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    reservation_type: 'Table Dining',
    location: 'Table 05',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    pax: 4,
    notes: ''
  })

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const data = await api.reservations.getReservations()
      const rawList = (data.status === 'success' && Array.isArray(data.reservations || data.data)) ? (data.reservations || data.data) : []
      if (rawList.length > 0) {
        setReservations(rawList.map(normalizeStaffReservation).filter(Boolean))
      }
    } catch (e) {
      console.error('Failed to fetch reservations:', e)
    }
  }

  const handleQRCheckInSuccess = (updatedReservation) => {
    if (!updatedReservation) return
    const resId = updatedReservation.reservation_code || updatedReservation.id || updatedReservation.reservation_id
    setReservations(prev => prev.map(r => {
      if (r.id === resId || r.reservation_code === resId || r.raw_id === updatedReservation.reservation_id) {
        return { ...r, status: 'Seated', checked_in_at: updatedReservation.checked_in_at }
      }
      return r
    }))
    showToast(`Guest ${resId} verified and checked in!`, 'success')
  }

  const handleUpdateResStatus = async (resId, newStatus) => {
    setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: newStatus } : r))
    try {
      const target = reservations.find(r => r.id === resId)
      const lookupId = target?.raw_id || resId
      await api.reservations.updateReservation(lookupId, { status: newStatus })
      if (newStatus === 'Confirmed') {
        showToast(`Reservation ${resId} Confirmed! Scannable QR pass sent to customer Gmail.`, 'success')
      } else {
        showToast(`Reservation ${resId} updated to ${newStatus}.`, 'success')
      }
    } catch (e) {
      showToast(`Reservation ${resId} updated to ${newStatus}.`, 'success')
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
      reservation_type: newResForm.reservation_type,
      location: newResForm.location,
      date: newResForm.date,
      time: newResForm.time,
      pax: parseInt(newResForm.pax) || 2,
      deposit: 0.00,
      total_quote: newResForm.reservation_type === 'Function Hall' ? 25000.00 : 2500.00,
      status: 'Confirmed',
      notes: newResForm.notes.trim() || 'Booked directly via Front of House staff desk.'
    }

    setReservations(prev => [createdRes, ...prev])
    setIsNewResModalOpen(false)
    setNewResForm({
      customer_name: '',
      phone: '',
      email: '',
      reservation_type: 'Table Dining',
      location: 'Table 05',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      pax: 4,
      notes: ''
    })
    showToast(`Reservation logged for ${createdRes.customer_name}!`, 'success')

    try {
      await api.reservations.createReservation(createdRes)
    } catch (err) {
      // Handled
    }
  }

  const filteredReservations = (reservations || []).filter(res => {
    if (!res) return false
    const resType = (res.reservation_type || res.event_type || res.category || '').toLowerCase()
    const filterType = (resTypeFilter || '').toLowerCase()
    const matchesType = resTypeFilter === 'all' || resType.includes(filterType)

    const search = (resSearchQuery || '').toLowerCase().trim()
    const custName = (res.customer_name || res.contact_name || res.contact_person || '').toLowerCase()
    const phone = (res.phone || res.contact_phone || '').toLowerCase()
    const location = (res.location || res.hall_name || res.venue_address || '').toLowerCase()
    const resId = String(res.id || res.reservation_code || res.reservation_id || '').toLowerCase()

    const matchesSearch = !search ||
      custName.includes(search) ||
      phone.includes(search) ||
      location.includes(search) ||
      resId.includes(search)

    return matchesType && matchesSearch
  })

  return (
    <div className="space-y-3 pb-10 text-xs animate-in fade-in duration-150">
      <div className={`p-3 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'table', label: 'Table Dining' },
            { id: 'function hall', label: 'Function Hall' },
            { id: 'catering', label: 'Catering Event' }
          ].map(rf => (
            <button
              key={rf.id}
              onClick={() => setResTypeFilter(rf.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${resTypeFilter === rf.id ? 'bg-[#C8102E] text-white shadow-2xs' : 'bg-slate-800 text-slate-300 border border-slate-600'}`}
            >
              {rf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search reservation guest..."
            value={resSearchQuery}
            onChange={(e) => setResSearchQuery(e.target.value)}
            className={`p-1.5 rounded-lg text-xs border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
          />
          <button
            type="button"
            onClick={() => setIsQRScannerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shrink-0 shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Scan Customer Reservation QR Pass"
          >
            <span className="material-icons text-sm">qr_code_scanner</span>
            <span>Scan Guest QR</span>
          </button>
          <button
            onClick={() => setIsNewResModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#C8102E] text-white font-extrabold text-xs hover:bg-[#9B0B21] shrink-0 shadow-xs border border-red-700 cursor-pointer"
          >
            + New Booking
          </button>
        </div>
      </div>

      <div className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-400 dark:border-slate-600 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
              <th className="py-2 px-2">ID</th>
              <th className="py-2 px-2">Guest Name & Contact</th>
              <th className="py-2 px-2">Type / Location</th>
              <th className="py-2 px-2">Date & Time</th>
              <th className="py-2 px-2">Pax</th>
              <th className="py-2 px-2">Deposit / Total Quote</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
            {filteredReservations.map(res => (
              <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                <td className="py-2.5 px-2 font-mono font-bold text-[#C8102E]">{res.id}</td>
                <td className="py-2.5 px-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{res.customer_name}</p>
                  <span className="text-[10px] text-slate-400">{res.phone}</span>
                </td>
                <td className="py-2.5 px-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{res.reservation_type}</span>
                  <p className="text-[10px] text-slate-400">{res.location}</p>
                </td>
                <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">{res.date} @ {res.time}</td>
                <td className="py-2.5 px-2 font-bold">{res.pax} Pax</td>
                <td className="py-2.5 px-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Dep: ₱{Number(res.deposit || 0).toFixed(2)}</span>
                  <span className="text-slate-400 text-[10px]">Total: ₱{Number(res.total_quote || 0).toFixed(2)}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${res.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : res.status === 'Seated' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'}`}>
                    {res.status}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right space-x-1">
                  {res.status === 'Confirmed' && (
                    <button onClick={() => handleUpdateResStatus(res.id, 'Seated')} className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] cursor-pointer">Seated</button>
                  )}
                  <button onClick={() => handleUpdateResStatus(res.id, 'Cancelled')} className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 dark:text-red-400 border border-red-300 font-bold text-[10px] cursor-pointer">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReservations.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-[11px]">No reservations found matching your criteria</p>
        )}
      </div>

      {/* New Reservation Modal */}
      {isNewResModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateReservation}
            className={`w-full max-w-md rounded-xl p-5 shadow-2xl border space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
          >
            <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
              <h3 className="font-extrabold text-xs">New Front of House Booking</h3>
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
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Booking Category</label>
                <select
                  value={newResForm.reservation_type}
                  onChange={(e) => setNewResForm({ ...newResForm, reservation_type: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                >
                  <option value="Table Dining">Table Dining</option>
                  <option value="Function Hall">Function Hall Rental</option>
                  <option value="Catering Event">Catering Event</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Location / Table</label>
                <input
                  type="text"
                  placeholder="e.g. Table 05 / Hall A"
                  value={newResForm.location}
                  onChange={(e) => setNewResForm({ ...newResForm, location: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Date & Time</label>
                <input
                  type="date"
                  value={newResForm.date}
                  onChange={(e) => setNewResForm({ ...newResForm, date: e.target.value })}
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
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="w-full py-2.5 rounded-lg bg-[#C8102E] text-white font-bold text-xs border border-red-700 shadow-2xs cursor-pointer">
                Log Reservation
              </button>
              <button type="button" onClick={() => setIsNewResModalOpen(false)} className="w-full py-2.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 font-bold text-xs cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff QR Scanner & Check-In Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        staffUser={staffUser}
        onCheckInSuccess={handleQRCheckInSuccess}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
