import { useState } from 'react'
import api from '../services/api'
import { useToast } from './ToastNotification'

export default function CreateCustomerEventModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast()
  const todayStr = new Date().toISOString().split('T')[0]

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventForm, setEventForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_name: '',
    event_type: 'Birthday Celebration',
    category: 'hall',
    hall_name: 'Grand Diamond Function Hall (150 Pax)',
    package_name: 'Standard Banquet Feasts',
    event_date: todayStr,
    event_time: '11:00 AM - 03:00 PM',
    guest_count: 50,
    total_amount: 35000,
    status: 'Confirmed',
    special_requests: '',
    venue_address: "Jo's Diner Grand Ballroom"
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!eventForm.customer_name || !eventForm.event_name) {
      showToast('Please enter customer full name and event title.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const code = `EVT-${Math.floor(10000 + Math.random() * 90000)}`
      const payload = {
        code,
        name: eventForm.customer_name,
        email: eventForm.customer_email,
        phone: eventForm.customer_phone,
        event_name: eventForm.event_name,
        event_type: eventForm.event_type,
        category: eventForm.category,
        hall_name: eventForm.hall_name,
        package_name: eventForm.package_name,
        event_date: eventForm.event_date,
        time: eventForm.event_time,
        count: parseInt(eventForm.guest_count, 10) || 30,
        total: parseFloat(eventForm.total_amount) || 0,
        status: eventForm.status || 'Confirmed',
        special_requests: eventForm.special_requests,
        venue_address: eventForm.venue_address
      }

      const res = await api.reservations.createReservation(payload)
      if (res?.status === 'success' || res?.reservation_id) {
        showToast(`🎉 Event "${eventForm.event_name}" successfully scheduled for ${eventForm.customer_name}!`, 'success')
        window.dispatchEvent(new CustomEvent('reservation-updated'))
        if (onSuccess) onSuccess(res)
        onClose()
      } else {
        showToast(res?.message || 'Failed to create event reservation.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error creating event booking.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8A1224] text-white flex items-center justify-center shadow-md">
              <span className="material-icons text-xl">celebration</span>
            </div>
            <div>
              <h3 className="text-base font-black text-[#071A3D] leading-tight">
                Create Event &amp; Booking for Customer
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Saves directly into the database and enables Event-Based Menu Recommendations for the customer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Section 1: Customer Profile */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold text-[10px]">1</span>
              <span className="text-xs font-black uppercase text-[#C8102E] tracking-wider">
                Customer Information
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={eventForm.customer_name}
                  onChange={(e) => setEventForm({ ...eventForm, customer_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@gmail.com"
                  value={eventForm.customer_email}
                  onChange={(e) => setEventForm({ ...eventForm, customer_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="0917-555-0199"
                  value={eventForm.customer_phone}
                  onChange={(e) => setEventForm({ ...eventForm, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Event Details */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold text-[10px]">2</span>
              <span className="text-xs font-black uppercase text-[#C8102E] tracking-wider">
                Event Setup &amp; Service Type
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Title / Occasion *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santos Golden 50th Wedding Anniversary"
                  value={eventForm.event_name}
                  onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Category / Theme</label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                >
                  <option value="Birthday Celebration">Birthday Celebration</option>
                  <option value="Wedding / Gala">Wedding / Gala</option>
                  <option value="Corporate Seminar">Corporate Seminar / Meeting</option>
                  <option value="Family Reunion / Anniversary">Family Reunion / Anniversary</option>
                  <option value="Debut / Milestone Party">Debut / Milestone Party</option>
                  <option value="Casual Banquet Feasts">Casual Banquet Feasts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Venue / Function Hall</label>
                <select
                  value={eventForm.hall_name}
                  onChange={(e) => setEventForm({ ...eventForm, hall_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                >
                  <option value="Grand Diamond Function Hall (150 Pax)">Grand Diamond Function Hall (150 Pax)</option>
                  <option value="Emerald Banquet Hall (80 Pax)">Emerald Banquet Hall (80 Pax)</option>
                  <option value="Executive Meeting Boardroom (30 Pax)">Executive Meeting Boardroom (30 Pax)</option>
                  <option value="Jo's Diner Main Dining Area">Jo's Diner Main Dining Area</option>
                  <option value="Off-site Customer Venue (Catering Only)">Off-site Customer Venue (Catering Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catering / Banquet Package</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Banquet Package"
                  value={eventForm.package_name}
                  onChange={(e) => setEventForm({ ...eventForm, package_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule, Guest Count & Budget */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold text-[10px]">3</span>
              <span className="text-xs font-black uppercase text-[#C8102E] tracking-wider">
                Schedule &amp; Cost Estimation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Date</label>
                <input
                  type="date"
                  required
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Time</label>
                <input
                  type="text"
                  placeholder="11:00 AM - 03:00 PM"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Guest Capacity (Pax)</label>
                <input
                  type="number"
                  min="1"
                  value={eventForm.guest_count}
                  onChange={(e) => setEventForm({ ...eventForm, guest_count: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={eventForm.total_amount}
                  onChange={(e) => setEventForm({ ...eventForm, total_amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-mono font-bold text-[#C8102E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Booking Status</label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-medium"
                >
                  <option value="Confirmed">Confirmed (Immediately Active)</option>
                  <option value="Pending">Pending Customer Review</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Special Inclusions / Setup Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Stage lighting, projector, extra buffet line"
                  value={eventForm.special_requests}
                  onChange={(e) => setEventForm({ ...eventForm, special_requests: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#8A1224] hover:bg-[#6E0E1C] text-white text-xs font-black transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-icons text-sm">{isSubmitting ? 'sync' : 'event_available'}</span>
              <span>{isSubmitting ? 'Creating Event...' : 'Create & Save Customer Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
