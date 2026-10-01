import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import api from '../../services/api'

function FunctionHallPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const setSelectedHallForBooking = context.setSelectedHallForBooking
  const onSelectHallToBook = props.onSelectHallToBook || ((hall) => {
    if (setSelectedHallForBooking) setSelectedHallForBooking(hall)
    navigate('/reservation', { state: { selectedHall: hall } })
  })
  const [selectedHallForDetails, setSelectedHallForDetails] = useState(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [favorites, setFavorites] = useState([4]) // array of favorited hall_ids

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 02:00 PM')
  const [selectedHallFilter, setSelectedHallFilter] = useState('all')
  const [liveHallsList, setLiveHallsList] = useState([])

  useEffect(() => {
    fetchLiveHalls()
  }, [])

  const fetchLiveHalls = async () => {
    try {
      const data = await api.functionHalls.getHalls()
      if (data.status === 'success' && data.halls && data.halls.length > 0) {
        setLiveHallsList(data.halls.map(h => {
          const parsedGallery = Array.isArray(h.gallery) && h.gallery.length > 0
            ? h.gallery
            : [h.hall_image || h.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80']
          const parsedAmenities = Array.isArray(h.amenities) && h.amenities.length > 0
            ? h.amenities
            : Array.isArray(h.facilities) && h.facilities.length > 0
              ? h.facilities
              : ['Air Conditioning', 'Tables & Chairs', 'Sound System', 'Stage']

          return {
            hall_id: h.hall_id,
            hall_name: h.hall_name,
            capacity: h.capacity,
            min_capacity: Math.round(h.capacity * 0.3),
            fixed_price: h.fixed_price || h.hourly_rate || 10000,
            hourly_rate: h.hourly_rate || 1250,
            image: h.hall_image || h.image || parsedGallery[0],
            gallery: parsedGallery,
            specs: h.description || h.specs || 'A spacious venue suitable for weddings, birthdays, corporate events and private celebrations.',
            amenities: parsedAmenities,
            suitable_for: ['Birthdays', 'Corporate', 'Meetings'],
            availability_status: h.status || 'Available'
          }
        }))
      }
    } catch (e) {
      // Fallback to default hallsList
    }
  }

  const activeHallsList = liveHallsList

  const toggleFavorite = (hallId) => {
    setFavorites(prev =>
      prev.includes(hallId) ? prev.filter(id => id !== hallId) : [...prev, hallId]
    )
  }

  const filteredHalls = activeHallsList.filter(hall => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchesName = hall.hall_name.toLowerCase().includes(q)
      const matchesSpecs = (hall.specs || '').toLowerCase().includes(q)
      if (!matchesName && !matchesSpecs) return false
    }
    if (selectedHallFilter === 'small' && hall.capacity > 30) return false
    if (selectedHallFilter === 'medium' && (hall.capacity <= 30 || hall.capacity > 50)) return false
    if (selectedHallFilter === 'large' && hall.capacity <= 50) return false
    return true
  })

  const handleBookHall = (hall) => {
    onSelectHallToBook(hall)
  }

  const handleViewDetails = (hall) => {
    navigate(`/function-hall/${hall.hall_id}`, { state: { hall } })
  }

  // DEFAULT VIEW: BROWSE HALLS LIST MATCHING WIREFRAME
  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header matching Wireframe: Function Halls / Find the perfect venue for your event */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">Function Halls</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">corporate_fare</span>
              <span>Function Halls</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Find the perfect venue for your event
            </p>
          </div>

          <button
            onClick={() => navigate('/catering')}
            className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-2 active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-icons text-base">bento</span>
            <span>Book Hall with Catering</span>
          </button>
        </div>

        {/* SEARCH & FILTER BAR matching Wireframe: [ Search... ] [ Date ] [ Guests ] */}
        <div className={`p-4 sm:p-5 rounded-lg border shadow-xs ${isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'
          }`}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">

            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <span className="material-icons text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#C8102E] text-[#071A3D] dark:text-white"
              />
            </div>

            {/* Date Input */}
            <div className="sm:col-span-3">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#C8102E] text-[#071A3D] dark:text-white"
              />
            </div>

            {/* Guests Capacity Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedHallFilter}
                onChange={e => setSelectedHallFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#C8102E] text-[#071A3D] dark:text-white cursor-pointer"
              >
                <option value="all">All Guests (30 to 300 Pax)</option>
                <option value="small">Small (up to 30 Guests)</option>
                <option value="medium">Medium (31 to 50 Guests)</option>
                <option value="large">Large (51 to 300 Guests)</option>
              </select>
            </div>

          </div>
        </div>

        {/* HALLS GRID matching Wireframe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHalls.map((hall) => {
            return (
              <div
                key={hall.hall_id}
                className={`rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md group flex flex-col justify-between ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
                  }`}
              >
                {/* HALL PHOTO */}
                <div className="relative h-52 sm:h-56 bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center" onClick={() => handleViewDetails(hall)}>
                  {hall.image ? (
                    <img
                      src={hall.image}
                      alt={hall.hall_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : null}

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-gray-400 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none">
                    <span className="material-icons text-3xl text-gray-500 mb-1">corporate_fare</span>
                    <span className="font-extrabold text-xs text-gray-300">{hall.hall_name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">No cover photo uploaded</span>
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                    <span className="h-5 px-2 rounded font-black text-[9px] uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center justify-center">
                      {hall.availability_status}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Hall Title */}
                    <h3
                      onClick={() => handleViewDetails(hall)}
                      className="text-lg font-black text-[#071A3D] dark:text-white tracking-tight cursor-pointer hover:text-[#C8102E] transition"
                    >
                      {hall.hall_name}
                    </h3>

                    {/* Capacity & Price Row */}
                    <div className="flex items-center justify-between text-xs border-b pb-2.5 border-gray-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 font-bold text-gray-600 dark:text-gray-300">
                        <span className="material-icons text-sm text-[#C8102E]">groups</span>
                        <span>Up to {hall.capacity} guests</span>
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Base Price</span>
                        <span className="font-black text-[#C8102E] text-sm sm:text-base font-mono">
                          ₱{(hall.fixed_price || hall.hourly_rate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">
                      {hall.specs}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2.5">
                    <button
                      onClick={() => handleViewDetails(hall)}
                      className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-icons text-sm">info</span>
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleBookHall(hall)}
                      className="flex-1 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-extrabold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-icons text-sm">event</span>
                      <span>Book Venue</span>
                    </button>
                  </div>

                </div>

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default FunctionHallPage
