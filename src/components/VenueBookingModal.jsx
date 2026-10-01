import { useState, useEffect } from 'react'

function VenueBookingModal({ isOpen, onClose }) {
  const [eventType, setEventType] = useState('Wedding')
  const [eventDate, setEventDate] = useState('')
  const [guestCount, setGuestCount] = useState(80)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const resetForm = () => {
    setEventType('Wedding')
    setEventDate('')
    setGuestCount(80)
    setContactName('')
    setContactPhone('')
    setSpecialRequests('')
    setIsSubmitted(false)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      resetForm()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white text-[#071A3D] rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-300 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-[#071A3D] p-5 sm:p-6 text-white relative border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white w-7 h-7 rounded-full flex items-center justify-center transition hover:bg-white/10"
          >
            <span className="material-icons text-lg">close</span>
          </button>
          <div className="flex items-center gap-1.5 mb-1 text-[#F59E0B] text-xs font-bold uppercase tracking-wider">
            <span className="material-icons text-sm">corporate_fare</span>
            <span>Jo's Diner Function Hall</span>
          </div>
          <h2 className="text-xl font-black">Reserve Function Hall</h2>
          <p className="text-xs text-gray-300 mt-0.5">
            Book our air-conditioned venue in Polomolok for weddings, birthdays, debuts & corporate galas.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
              <span className="material-icons text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#071A3D]">Inquiry Sent Successfully!</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Thank you, <strong className="text-[#071A3D]">{contactName}</strong>! Our event coordinator will contact you at <strong>{contactPhone}</strong> to confirm your reservation details for {eventDate}.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false)
                onClose()
              }}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-6 py-2.5 rounded-lg text-xs font-extrabold shadow transition active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#071A3D] mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                >
                  <option value="Wedding">Wedding Reception</option>
                  <option value="Birthday">Birthday / Debut</option>
                  <option value="Corporate">Corporate Event</option>
                  <option value="Christening">Christening / Baptism</option>
                  <option value="Reunion">Anniversary / Reunion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#071A3D] mb-1">
                  Target Event Date
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-extrabold text-[#071A3D]">
                  Estimated Guest Count
                </label>
                <span className="text-xs font-black text-[#C8102E]">
                  {guestCount} Pax
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full accent-[#C8102E]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>30 Guests</span>
                <span>100 Guests</span>
                <span>200 Max Guests</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#071A3D] mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#071A3D] mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0910 379 3664"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#071A3D] mb-1">
                Notes & Additional Requests
              </label>
              <textarea
                rows="2"
                placeholder="Mention preferred theme, sound requirements, or catering menu preferences..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
              ></textarea>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex gap-2 items-center">
              <span className="material-icons text-base text-amber-700 shrink-0">lightbulb</span>
              <span>Hall rental packages include full air-con, tables & chairs setup, pro sound system, and buffet setup!</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-extrabold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-lg text-xs font-extrabold shadow transition active:scale-95"
              >
                Submit Reservation Request
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}

export default VenueBookingModal
