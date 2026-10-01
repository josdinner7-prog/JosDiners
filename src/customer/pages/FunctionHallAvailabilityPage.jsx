import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import api from '../../services/api'

function FunctionHallAvailabilityPage(props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const context = useOutletContext() || {}
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const setSelectedHallForBooking = context.setSelectedHallForBooking

  const [hall, setHall] = useState(location.state?.hall || null)
  const [isLoading, setIsLoading] = useState(!location.state?.hall)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [startTime, setStartTime] = useState('6:00 PM')
  const [endTime, setEndTime] = useState('10:00 PM')
  const [guestCount, setGuestCount] = useState(100)
  const [dbReservations, setDbReservations] = useState([])
  const [dbSettings, setDbSettings] = useState(null)

  useEffect(() => {
    fetchHallDetails()
  }, [id])

  const fetchHallDetails = async () => {
    setIsLoading(true)
    try {
      const [hallsRes, resRes, settingsRes] = await Promise.allSettled([
        api.functionHalls.getHalls(),
        api.reservations.getReservations(),
        api.reservations.getSettings()
      ])

      if (hallsRes.status === 'fulfilled' && hallsRes.value?.status === 'success' && Array.isArray(hallsRes.value.halls)) {
        const found = hallsRes.value.halls.find(h => String(h.hall_id || h.id) === String(id))
        if (found) {
          const hObj = {
            hall_id: found.hall_id || found.id,
            hall_name: found.hall_name || found.name,
            capacity: found.capacity || 300,
            fixed_price: found.fixed_price || found.hourly_rate || 30000,
            hourly_rate: found.hourly_rate || 1250,
            specs: found.description || found.specs || 'A spacious venue suitable for events.',
            availability_status: found.status || 'Available'
          }
          setHall(hObj)
          setGuestCount(Math.min(100, hObj.capacity))
        }
      }

      if (resRes.status === 'fulfilled' && resRes.value?.status === 'success') {
        setDbReservations(resRes.value.reservations || [])
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.status === 'success') {
        setDbSettings(settingsRes.value.settings)
      }
    } catch (e) { }

    setIsLoading(false)
  }

  const handleContinueBooking = () => {
    if (!hall) return
    if (setSelectedHallForBooking) setSelectedHallForBooking(hall)
    navigate('/reservation', {
      state: {
        selectedHall: hall,
        selectedDate,
        startTime,
        endTime,
        guestCount
      }
    })
  }

  // Calendar Helpers (Monday to Sunday order)
  const calYear = currentCalendarDate.getFullYear()
  const calMonth = currentCalendarDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const firstDayObj = new Date(calYear, calMonth, 1)
  const startDayOfWeek = (firstDayObj.getDay() + 6) % 7
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1))
  }

  // Status mapping for calendar date items from real database
  const getCalendarDayInfo = (dayNum) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const isSelected = dateStr === selectedDate
    const isPast = dateStr < todayStr

    const isDateBlocked = (dbSettings?.blocked_dates || []).includes(dateStr) ||
      Boolean(dbSettings?.date_overrides?.[dateStr]?.is_blackout)

    const isHallBooked = dbReservations.some(r => {
      if (r.status === 'Cancelled' || r.status === 'Declined') return false
      const rDate = r.event_date ? r.event_date.split('T')[0] : ''
      if (rDate !== dateStr) return false
      const rHall = (r.hall_name || '').toLowerCase()
      const currentHallName = (hall?.hall_name || '').toLowerCase()
      return rHall.includes(currentHallName) || String(r.hall_id) === String(hall?.hall_id)
    })

    const isBooked = isDateBlocked || isHallBooked

    return {
      dateStr,
      isSelected,
      isBooked,
      isPast,
      isAvailable: !isBooked && !isPast
    }
  }

  const timeOptions = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ]

  if (isLoading) {
    return (
      <div className={`min-h-screen py-16 flex items-center justify-center ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'}`}>
        <div className="flex items-center gap-3 font-bold text-sm">
          <span className="w-5 h-5 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"></span>
          <span>Loading Venue Availability...</span>
        </div>
      </div>
    )
  }

  const hallNameUpper = (hall?.hall_name || 'GRAND HALL').toUpperCase()

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-300 dark:border-slate-700">
          <button
            onClick={() => navigate(`/function-hall/${id}`, { state: { hall } })}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#C8102E] hover:text-[#9B0B21] transition cursor-pointer group"
          >
            <span className="material-icons text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span>Back to Function Halls</span>
          </button>
        </div>

        {/* MAIN AVAILABILITY CARD */}
        <div className={`p-6 sm:p-8 rounded-2xl border shadow-lg space-y-6 ${isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
          }`}>

          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-gray-200 dark:border-slate-800">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              {hallNameUpper} AVAILABILITY
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select your event date
            </p>
          </div>

          {/* Month Header Navigation Controls */}
          <div className="flex items-center justify-between max-w-sm mx-auto px-2">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer text-gray-700 dark:text-gray-200"
              title="Previous Month"
            >
              <span className="material-icons text-base">chevron_left</span>
            </button>

            <span className="text-base font-black tracking-wide">
              {monthNames[calMonth]} {calYear}
            </span>

            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer text-gray-700 dark:text-gray-200"
              title="Next Month"
            >
              <span className="material-icons text-base">chevron_right</span>
            </button>
          </div>

          {/* Calendar Table Grid (Mon to Sun) */}
          <div className="max-w-md mx-auto space-y-2">
            {/* Days of Week Row */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-gray-400">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Empty leading padding slots */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-11 rounded-lg bg-transparent" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const info = getCalendarDayInfo(dayNum)

                return (
                  <button
                    key={dayNum}
                    disabled={info.isBooked}
                    onClick={() => setSelectedDate(info.dateStr)}
                    className={`h-11 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center relative cursor-pointer border ${info.isSelected
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105 ring-2 ring-red-300'
                        : info.isBooked
                          ? 'bg-gray-100 dark:bg-slate-800/60 text-gray-400 border-transparent opacity-50 cursor-not-allowed'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      }`}
                  >
                    <span>
                      {info.isSelected ? `[${dayNum}]` : info.isBooked ? `× ${dayNum}` : dayNum}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legend Bar (Exact ASCII Wireframe Alignment) */}
            <div className="flex items-center justify-center gap-6 text-xs font-bold pt-4 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">✓</span>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#C8102E] font-black text-base">●</span>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-black text-sm">×</span>
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Event Time & Guests Form Controls */}
          <div className="max-w-md mx-auto space-y-6 pt-6 border-t border-gray-200 dark:border-slate-800">

            {/* Event Time Selectors */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider block">
                Event Time
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-bold text-[#071A3D] dark:text-white cursor-pointer focus:outline-none focus:border-[#C8102E]"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>[ {t} ]</option>
                    ))}
                  </select>
                </div>
                <span className="text-xs font-bold text-gray-400">to</span>
                <div className="flex-1 relative">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-bold text-[#071A3D] dark:text-white cursor-pointer focus:outline-none focus:border-[#C8102E]"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>[ {t} ]</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Number of Guests counter */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider block">
                Number of Guests
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setGuestCount(prev => Math.max(10, prev - 10))}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-black text-[#071A3D] dark:text-white hover:bg-gray-100 cursor-pointer shadow-xs transition active:scale-95"
                >
                  [ − ]
                </button>
                <span className="font-black text-base text-[#071A3D] dark:text-white font-mono">
                  {guestCount} Pax
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount(prev => Math.min(hall?.capacity || 300, prev + 10))}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-black text-[#071A3D] dark:text-white hover:bg-gray-100 cursor-pointer shadow-xs transition active:scale-95"
                >
                  [ + ]
                </button>
              </div>
            </div>

            {/* CONTINUE BOOKING CTA Button */}
            <button
              type="button"
              onClick={handleContinueBooking}
              className="w-full py-4 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>[ CONTINUE BOOKING ]</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

export default FunctionHallAvailabilityPage
