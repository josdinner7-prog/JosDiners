import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import BanquetEventOrderModal from '../../components/BanquetEventOrderModal'

export default function CateringSchedulePage(props) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [cateringSchedules, setCateringSchedules] = useState([])
  const [cateringViewMode, setCateringViewMode] = useState('board') // 'board', 'contracts', 'beo'
  const [selectedBEOEvent, setSelectedBEOEvent] = useState(null)
  const [isNewCateringModalOpen, setIsNewCateringModalOpen] = useState(false)
  const [newCateringForm, setNewCateringForm] = useState({
    event_title: '',
    customer_name: '',
    phone: '',
    email: '',
    event_date: new Date().toISOString().split('T')[0],
    dispatch_time: '09:00 AM',
    setup_time: '10:00 AM',
    service_time: '11:30 AM - 02:30 PM',
    venue_address: '',
    guests: 50,
    package_name: 'Front of House Lechon & Kare-Kare Tray Package',
    assigned_chef: 'Chef Eduardo (Head Chef)',
    assigned_crew: 'Kuya Ben (Driver), Marco (Server), Lina (Server)',
    equipment: '4x Chafing Trays, 2x Beverage Dispensers',
    total_quote: 35000.00,
    deposit_paid: 10000.00,
    notes: ''
  })

  const handleUpdateCateringStatus = (catId, newStatus) => {
    setCateringSchedules(prev => prev.map(c => c.id === catId ? { ...c, status: newStatus } : c))
    showToast(`Catering ${catId} status updated to "${newStatus}"`, 'success')
  }

  const handleCreateCateringSchedule = (e) => {
    e.preventDefault()
    if (!newCateringForm.customer_name || !newCateringForm.phone) {
      showToast('Customer Name and Phone Number are required.', 'error')
      return
    }

    const createdCat = {
      id: `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
      event_title: newCateringForm.event_title.trim() || 'Catering Booking',
      customer_name: newCateringForm.customer_name.trim(),
      phone: newCateringForm.phone.trim(),
      email: newCateringForm.email.trim() || 'N/A',
      event_date: newCateringForm.event_date,
      dispatch_time: newCateringForm.dispatch_time,
      setup_time: newCateringForm.setup_time,
      service_time: newCateringForm.service_time,
      venue_address: newCateringForm.venue_address.trim() || "Jo's Diner Function Hall",
      guests: parseInt(newCateringForm.guests) || 50,
      package_name: newCateringForm.package_name,
      assigned_chef: newCateringForm.assigned_chef,
      assigned_crew: newCateringForm.assigned_crew,
      equipment: newCateringForm.equipment,
      total_quote: parseFloat(newCateringForm.total_quote) || 35000.00,
      deposit_paid: parseFloat(newCateringForm.deposit_paid) || 10000.00,
      balance_due: (parseFloat(newCateringForm.total_quote) || 35000.00) - (parseFloat(newCateringForm.deposit_paid) || 10000.00),
      status: 'Scheduled',
      notes: newCateringForm.notes.trim() || 'Catering contract scheduled.'
    }

    setCateringSchedules(prev => [createdCat, ...prev])
    setIsNewCateringModalOpen(false)
    showToast(`Catering schedule ${createdCat.id} created for ${createdCat.customer_name}!`, 'success')
  }

  return (
    <div className="space-y-4 pb-10 text-xs animate-in fade-in duration-150">
      {/* Header & Sub-view Switcher */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-[#C8102E]">celebration</span>
            <h3 className="font-extrabold text-sm tracking-tight">Catering Services & Event Operations Schedule</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Manage off-site catering dispatch schedules, team assignments, chafing dish equipment, and venue setup times.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-600">
            <button
              onClick={() => setCateringViewMode('board')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${cateringViewMode === 'board' ? 'bg-[#C8102E] text-white shadow-2xs' : 'text-slate-400'}`}
            >
              📅 Schedule Board
            </button>
            <button
              onClick={() => setCateringViewMode('beo')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${cateringViewMode === 'beo' ? 'bg-[#C8102E] text-white shadow-2xs' : 'text-slate-400'}`}
            >
              <span>📋 BEO Sheets</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewCateringModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 active:scale-95 border border-red-700 cursor-pointer"
          >
            <span className="material-icons text-sm">add_business</span>
            <span>+ Schedule Catering</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CATERING PRODUCTION SCHEDULE CARDS */}
      {cateringViewMode === 'board' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cateringSchedules.map(cat => (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl border space-y-3.5 shadow-sm hover:shadow-md transition-shadow duration-300 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
            >
              {/* Event Header */}
              <div className="flex justify-between items-start border-b pb-3 border-slate-300 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-[#C8102E]">{cat.id}</span>
                    <h4 className="font-extrabold text-sm">{cat.event_title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Client: <strong className="text-slate-800 dark:text-slate-200">{cat.customer_name}</strong> ({cat.phone})
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${cat.status === 'Setup Completed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40' :
                  cat.status === 'En Route' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' :
                    'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40'
                  }`}>
                  {cat.status === 'Setup Completed' ? '⛺ Setup Completed' : cat.status === 'En Route' ? '🚚 En Route' : '📅 Scheduled'}
                </span>
              </div>

              {/* Timings & Address Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Event Date:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{cat.event_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispatch Departure:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.dispatch_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Service Meal Start:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.service_time}</span>
                </div>
              </div>

              {/* Location & Team Assignment */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <span className="material-icons text-amber-500 text-sm">location_on</span>
                  <span className="truncate">{cat.venue_address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="material-icons text-emerald-500 text-sm">face</span>
                  <span><strong>Lead Chef:</strong> {cat.assigned_chef}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="material-icons text-purple-500 text-sm">groups</span>
                  <span><strong>Crew:</strong> {cat.assigned_crew}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="material-icons text-sky-500 text-sm mt-0.5">inventory_2</span>
                  <span><strong>Equipment:</strong> {cat.equipment}</span>
                </div>
              </div>

              {/* Status Stepper Actions & BEO Sheet Button */}
              <div className="border-t pt-3 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">TOTAL CONTRACT QUOTE</span>
                  <span className="font-black text-sm text-[#C8102E]">₱{Number(cat.total_quote || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBEOEvent(cat)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1 cursor-pointer border border-slate-300 dark:border-slate-600 transition shadow-2xs"
                  >
                    <span className="material-icons text-sm text-[#C8102E]">fact_check</span>
                    <span>BEO Sheet</span>
                  </button>

                  {cat.status === 'Scheduled' && (
                    <button
                      onClick={() => handleUpdateCateringStatus(cat.id, 'En Route')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 cursor-pointer"
                    >
                      🚚 Dispatch
                    </button>
                  )}

                  {cat.status === 'En Route' && (
                    <button
                      onClick={() => handleUpdateCateringStatus(cat.id, 'Setup Completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 cursor-pointer"
                    >
                      ⛺ Setup Done
                    </button>
                  )}

                  {cat.status === 'Setup Completed' && (
                    <button
                      onClick={() => handleUpdateCateringStatus(cat.id, 'Teardown Completed')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-black text-xs hover:bg-blue-700 cursor-pointer"
                    >
                      ✅ Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {cateringSchedules.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-400">
              <span className="material-icons text-4xl block mb-2 opacity-50">celebration</span>
              <p className="font-bold">No catering events scheduled</p>
              <p className="text-xs mt-1">Click "+ Schedule Catering" to create a new event dispatch.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: BANQUET EVENT ORDERS (BEO) PRODUCTION DIRECTORY */}
      {cateringViewMode === 'beo' && (
        <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-300 dark:border-slate-700">
            <div>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <span className="material-icons text-[#C8102E] text-base">fact_check</span>
                <span>Banquet Event Orders (BEO) Production Directory</span>
              </h4>
              <p className="text-xs text-slate-400">
                Comprehensive kitchen production sheets, crew assignments, equipment checklists, and client sign-offs.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {cateringSchedules.length} Active Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500">
                  <th className="py-2.5 px-3">BEO Reference</th>
                  <th className="py-2.5 px-3">Event &amp; Host Client</th>
                  <th className="py-2.5 px-3">Date &amp; Meal Serving Time</th>
                  <th className="py-2.5 px-3">Venue / Location</th>
                  <th className="py-2.5 px-3">Pax</th>
                  <th className="py-2.5 px-3">Head Chef &amp; Captain</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {cateringSchedules.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-[#C8102E]">
                      BEO-{cat.id}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{cat.event_title}</p>
                      <span className="text-[11px] text-slate-400">{cat.customer_name} ({cat.phone})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">{cat.event_date}</span>
                      <span className="text-[11px] text-slate-400">{cat.service_time}</span>
                    </td>
                    <td className="py-3 px-3 truncate max-w-[150px]">
                      {cat.venue_address}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {cat.guests} Pax
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <p className="font-bold">{cat.assigned_chef}</p>
                      <span className="text-slate-400">{cat.assigned_crew}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBEOEvent(cat)}
                        className="px-3 py-1 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-icons text-xs">print</span>
                        <span>Open BEO</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cateringSchedules.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-xs">No BEO records available</p>
            )}
          </div>
        </div>
      )}

      {/* New Catering Modal */}
      {isNewCateringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCateringSchedule}
            className={`w-full max-w-lg rounded-2xl p-5 shadow-2xl border space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
          >
            <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#C8102E]">celebration</span>
                <h3 className="font-extrabold text-sm">Schedule Catering Service Booking</h3>
              </div>
              <button type="button" onClick={() => setIsNewCateringModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Luncheon Gala / Wedding Reception"
                  value={newCateringForm.event_title}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, event_title: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Client full name..."
                  value={newCateringForm.customer_name}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, customer_name: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="0917-XXX-XXXX"
                  value={newCateringForm.phone}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, phone: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Event Date *</label>
                <input
                  type="date"
                  required
                  value={newCateringForm.event_date}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, event_date: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Dispatch Departure Time</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={newCateringForm.dispatch_time}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, dispatch_time: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Venue Address / Off-site Location *</label>
                <input
                  type="text"
                  required
                  placeholder="Full venue address..."
                  value={newCateringForm.venue_address}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, venue_address: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Guest Count (Pax)</label>
                <input
                  type="number"
                  min="10"
                  value={newCateringForm.guests}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, guests: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold text-center ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Total Quote (₱)</label>
                <input
                  type="number"
                  value={newCateringForm.total_quote}
                  onChange={(e) => setNewCateringForm({ ...newCateringForm, total_quote: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md cursor-pointer">
                Confirm & Schedule Catering
              </button>
              <button type="button" onClick={() => setIsNewCateringModalOpen(false)} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-600 cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banquet Event Order (BEO) Production Modal */}
      {selectedBEOEvent && (
        <BanquetEventOrderModal
          isOpen={Boolean(selectedBEOEvent)}
          onClose={() => setSelectedBEOEvent(null)}
          booking={selectedBEOEvent}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}
