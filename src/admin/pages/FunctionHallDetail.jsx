import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import FunctionHallModal from '../components/FunctionHallModal'
import ConfirmationModal from '../components/ConfirmationModal'
import AddonManagementModal from '../components/AddonManagementModal'

export default function FunctionHallDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [hall, setHall] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMediaPreview, setActiveMediaPreview] = useState('')
  const [associatedBookings, setAssociatedBookings] = useState([])

  // Add-on Management Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false)

  // Confirmation Modal States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Availability Calendar States
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [selectedCalDateStr, setSelectedCalDateStr] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [isViewingDateDetail, setIsViewingDateDetail] = useState(false)

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [hallName, setHallName] = useState('')
  const [hallDesc, setHallDesc] = useState('')
  const [hallCapacity, setHallCapacity] = useState('50')
  const [hallLocation, setHallLocation] = useState('')
  const [hallHourlyRate, setHallHourlyRate] = useState('1250')
  const [hallStatus, setHallStatus] = useState('Available')
  const [hallImage, setHallImage] = useState('')
  const [hallGalleryText, setHallGalleryText] = useState('')
  const [hallAmenitiesText, setHallAmenitiesText] = useState('')
  const [hallFacilities, setHallFacilities] = useState([])
  const [hallSchedule, setHallSchedule] = useState([])

  useEffect(() => {
    fetchHallDetail()
    fetchRelatedBookings()
  }, [id])

  const fetchHallDetail = async () => {
    setIsLoading(true)
    try {
      const data = await api.functionHalls.getHalls()
      if (data.status === 'success' && Array.isArray(data.halls)) {
        const found = data.halls.find(h => String(h.hall_id) === String(id))
        if (found) {
          setHall(found)
          const gallery = Array.isArray(found.gallery) && found.gallery.length > 0
            ? found.gallery
            : (found.hall_image ? [found.hall_image] : [])
          setActiveMediaPreview(found.hall_image || gallery[0] || '')
        } else {
          showToast(`Function Hall #${id} not found in database.`, 'error')
          navigate('/admin/halls')
        }
      }
    } catch (e) {
      showToast('Could not load function hall details.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelatedBookings = async () => {
    try {
      const data = await api.catering.getBookings()
      if (data.status === 'success' && Array.isArray(data.bookings)) {
        const matched = data.bookings.filter(b => 
          b.hall_id === parseInt(id, 10) || 
          (b.hall_name && b.hall_name.toLowerCase().includes(String(id).toLowerCase()))
        )
        setAssociatedBookings(matched)
      }
    } catch (e) {
      // Non-blocking
    }
  }

  const handleToggleStatus = async () => {
    if (!hall) return
    const nextStatus = hall.status === 'Available' ? 'Unavailable' : 'Available'
    try {
      const res = await api.functionHalls.updateHall(hall.hall_id, {
        ...hall,
        status: nextStatus
      })
      if (res.status === 'success') {
        setHall(prev => ({ ...prev, status: nextStatus }))
        showToast(`Function hall status updated to "${nextStatus}".`, 'success')
      }
    } catch (e) {
      showToast('Failed to update venue status.', 'error')
    }
  }

  const handleDeleteHall = () => {
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!hall) return
    setIsDeleting(true)
    try {
      const res = await api.functionHalls.deleteHall(hall.hall_id)
      if (res.status === 'success') {
        showToast(`Venue record "${hall.hall_name}" deleted successfully.`, 'success')
        setIsDeleteConfirmOpen(false)
        navigate('/admin/halls')
      } else {
        showToast(res.message || 'Failed to delete function hall.', 'error')
      }
    } catch (e) {
      showToast('Failed to delete function hall.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenEdit = () => {
    if (!hall) return
    setHallName(hall.hall_name || '')
    setHallDesc(hall.description || '')
    setHallCapacity(String(hall.capacity || '50'))
    setHallLocation(hall.location || 'Main Building')
    setHallHourlyRate(String(hall.hourly_rate || hall.rental_price || '1250'))
    setHallStatus(hall.status || 'Available')
    setHallImage(hall.hall_image || '')

    const galleryArr = Array.isArray(hall.gallery) ? hall.gallery : []
    setHallGalleryText(galleryArr.join('\n'))

    const facilitiesArr = Array.isArray(hall.facilities) ? hall.facilities : []
    setHallFacilities(facilitiesArr)
    setHallAmenitiesText(facilitiesArr.join(', '))
    setHallSchedule(hall.schedule || [])

    setIsEditModalOpen(true)
  }

  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size exceeds 2MB limit.', 'error')
        return
      }
      const reader = new FileReader()
      reader.onload = () => setHallImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryFilesUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = () => {
        setHallGalleryText(prev => prev ? `${prev}\n${reader.result}` : reader.result)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSaveEditSubmit = async (e) => {
    e.preventDefault()
    if (!hallName.trim() || !hallCapacity || !hallHourlyRate) {
      showToast('Please fill out all required fields.', 'error')
      return
    }

    const galleryArray = hallGalleryText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const finalFacilities = hallAmenitiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    try {
      const payload = {
        hall_name: hallName.trim(),
        description: hallDesc.trim(),
        capacity: parseInt(hallCapacity, 10),
        location: hallLocation.trim(),
        hall_image: hallImage.trim(),
        gallery: galleryArray,
        hourly_rate: parseFloat(hallHourlyRate),
        status: hallStatus,
        facilities: finalFacilities,
        schedule: hallSchedule
      }

      const res = await api.functionHalls.updateHall(hall.hall_id, payload)
      if (res.status === 'success') {
        showToast('Function hall specifications updated successfully!', 'success')
        setIsEditModalOpen(false)
        fetchHallDetail()
      }
    } catch (err) {
      showToast(err.message || 'Failed to update function hall.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse text-[#071A3D]">
        <div className="h-16 bg-gray-200 rounded-xl"></div>
        <div className="bg-white rounded-xl border border-gray-300 p-6 space-y-4">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!hall) return null

  const isAvailable = hall.status === 'Available'
  const hourlyRate = parseFloat(hall.hourly_rate || hall.rental_price || 1250)
  const facilitiesList = Array.isArray(hall.facilities)
    ? hall.facilities
    : (hall.facilities ? String(hall.facilities).split(',').map(s => s.trim()).filter(Boolean) : [])

  const galleryImages = Array.isArray(hall.gallery) && hall.gallery.length > 0
    ? hall.gallery
    : (hall.hall_image ? [hall.hall_image] : [])

  return (
    <div className="space-y-5 text-[#071A3D]">
      
      {/* 1. STANDARD ADMIN PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/halls')}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-400 flex items-center justify-center text-gray-700 transition cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title="Back to Function Halls List"
          >
            <span className="material-icons text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight uppercase">
                {hall.hall_name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border shadow-2xs ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : 'bg-red-50 text-red-800 border-red-400'
              }`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isAvailable ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-icons text-xs text-gray-400">place</span>
              <span>{hall.location || 'Main Building Venue'}</span>
            </p>
          </div>
        </div>

        {/* Administrative Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsAddonModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-400 text-[#071A3D] hover:bg-gray-50 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            title="Manage event and function hall equipment add-ons"
          >
            <span className="material-icons text-base text-[#C8102E]">extension</span>
            <span>Add-ons</span>
          </button>

          <button
            type="button"
            onClick={handleToggleStatus}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-2xs ${
              isAvailable
                ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-900 border-emerald-400 hover:bg-emerald-100'
            }`}
          >
            {isAvailable ? 'Deactivate Venue' : 'Activate Venue'}
          </button>

          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base">edit</span>
            <span>Edit Specifications</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteHall}
            className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-400 hover:border-red-300 text-gray-500 transition cursor-pointer active:scale-95"
            title="Delete Venue Record"
          >
            <span className="material-icons text-base">delete</span>
          </button>
        </div>
      </header>

      {/* 2. PRIMARY VENUE PROFILE (100% Dynamic Real Data) */}
      <div className="bg-white rounded-xl border border-gray-400 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 items-start">
          
          {/* LEFT COLUMN: Media Showcase (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-gray-300 bg-gray-900 shadow-xs">
              {activeMediaPreview ? (
                <img
                  src={activeMediaPreview}
                  alt={hall.hall_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                  <span className="material-icons text-5xl">meeting_room</span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md border ${
                  isAvailable
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                    : 'bg-red-950/90 text-red-300 border-red-500/60'
                }`}>
                  {isAvailable ? '● AVAILABLE' : '○ UNAVAILABLE'}
                </span>
              </div>
            </div>

            {/* Gallery Thumbnail Selector (Only if multiple gallery files exist) */}
            {galleryImages.length > 1 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Gallery Photos ({galleryImages.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaPreview(imgUrl)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                        activeMediaPreview === imgUrl
                          ? 'border-[#C8102E] ring-2 ring-red-200 scale-105'
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.parentElement.style.display = 'none'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Real Data Parameters, Description & Amenities (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Real Data Metrics (3 Tiles) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <span className="text-[10px] font-bold uppercase text-gray-500 block">Hourly Rate</span>
                <span className="text-xl font-black text-[#C8102E] font-mono block mt-0.5">
                  ₱{hourlyRate.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400">per hour</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <span className="text-[10px] font-bold uppercase text-gray-500 block">Capacity</span>
                <span className="text-xl font-black text-[#071A3D] block mt-0.5">
                  {hall.capacity} Pax
                </span>
                <span className="text-[10px] text-gray-400">maximum guests</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <span className="text-[10px] font-bold uppercase text-gray-500 block">Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                    <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <span className="material-icons text-xs text-[#C8102E]">description</span>
                <span>Description</span>
              </h3>
              {hall.description ? (
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-3.5 rounded-lg border border-gray-300">
                  {hall.description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-3.5 rounded-lg border border-dashed border-gray-300 text-center">
                  No description provided for this function hall.
                </p>
              )}
            </div>

            {/* Included Amenities & Facilities */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                  <span className="material-icons text-xs text-blue-600">room_preferences</span>
                  <span>Included Amenities & Facilities</span>
                </h3>
                {facilitiesList.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {facilitiesList.length} Items
                  </span>
                )}
              </div>

              {facilitiesList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {facilitiesList.map((facility, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-950 font-bold text-xs shadow-2xs"
                    >
                      <span className="text-blue-600 font-black text-xs">✓</span>
                      <span>{facility}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-400 italic">
                  No specific amenities or facilities listed.
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 3. SIDE-BY-SIDE: AVAILABILITY CALENDAR & ASSOCIATED BOOKINGS */}
      {(() => {
        const calYear = calendarDate.getFullYear()
        const calMonth = calendarDate.getMonth()
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

        const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1))
        const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1))

        const selectedDayBookings = associatedBookings.filter(b => b.event_date === selectedCalDateStr)

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            
            {/* LEFT COLUMN: VENUE AVAILABILITY CALENDAR / DATE INSPECTOR */}
            <div className="bg-white rounded-xl border border-gray-400 shadow-2xs overflow-hidden flex flex-col min-h-[440px]">
              {isViewingDateDetail ? (
                /* REPLACING DATE INSPECTOR VIEW */
                <div className="flex flex-col h-full">
                  <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsViewingDateDetail(false)}
                        className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-[#C8102E] bg-white border border-gray-300 px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <span className="material-icons text-sm">arrow_back</span>
                        <span>Back to Calendar</span>
                      </button>
                      <span className="text-xs font-black text-[#071A3D] font-mono">
                        {selectedCalDateStr}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      selectedDayBookings.length > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {selectedDayBookings.length > 0 ? `${selectedDayBookings.length} Event(s) Booked` : 'Venue Available'}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
                    {selectedDayBookings.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <span className="material-icons text-lg">check_circle</span>
                        </span>
                        <h4 className="text-sm font-black text-emerald-900">
                          Venue Available on this Date
                        </h4>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                          No reservations or catering events currently booked. The venue is 100% available.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {selectedDayBookings.map((b) => (
                          <div
                            key={b.booking_id}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-300 text-xs space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold font-mono text-[#C8102E]">{b.booking_code || `#${b.booking_id}`}</span>
                              <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {b.event_time || 'Scheduled Slot'}
                              </span>
                            </div>
                            <div className="font-black text-gray-900 text-sm">{b.customer_name || 'Guest'}</div>
                            <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1 border-t border-gray-200 mt-1">
                              <span>{b.event_type || 'Event'} · {b.guest_count || hall.capacity} Guests</span>
                              <span className="font-black font-mono text-[#071A3D]">₱{(b.total_amount || b.package_total || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MONTHLY CALENDAR VIEW */
                <div className="flex flex-col h-full">
                  <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center">
                        <span className="material-icons text-base">calendar_month</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-[#071A3D] tracking-wide">
                          Venue Availability
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Click a date to inspect schedule</p>
                      </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-gray-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-600 active:scale-90 cursor-pointer"
                        title="Previous Month"
                      >
                        <span className="material-icons text-sm">chevron_left</span>
                      </button>
                      <span className="text-xs font-black text-[#071A3D] uppercase tracking-wider min-w-[100px] text-center font-mono select-none">
                        {monthNames[calMonth]} {calYear}
                      </span>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-600 active:scale-90 cursor-pointer"
                        title="Next Month"
                      >
                        <span className="material-icons text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Calendar Grid Container with Hairline Dividers */}
                    <div className="rounded-xl overflow-hidden border border-gray-300 shadow-2xs">
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 bg-gray-50/90 border-b border-gray-300 text-center text-[10px] font-black uppercase text-gray-500 py-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="tracking-wider">{d}</div>
                        ))}
                      </div>

                      {/* 1px Hairline Divided Month Grid */}
                      <div className="grid grid-cols-7 bg-gray-300 gap-[1px]">
                        {/* Empty cells before month start */}
                        {[...Array(firstDayOfWeek)].map((_, i) => (
                          <div key={`empty-${i}`} className="bg-gray-50/60 min-h-[46px] sm:min-h-[50px]" />
                        ))}

                        {/* Calendar Days */}
                        {[...Array(daysInMonth)].map((_, i) => {
                          const dayNum = i + 1
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                          const dayBookings = associatedBookings.filter(b => b.event_date === dateStr)
                          const isBooked = dayBookings.length > 0
                          const isToday = new Date().toISOString().slice(0, 10) === dateStr

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => {
                                setSelectedCalDateStr(dateStr)
                                setIsViewingDateDetail(true)
                              }}
                              className={`min-h-[46px] sm:min-h-[50px] p-1.5 flex flex-col justify-between items-start text-left transition-colors cursor-pointer active:scale-98 ${
                                isBooked
                                  ? 'bg-amber-50/80 hover:bg-amber-100/90 text-amber-950'
                                  : isToday
                                  ? 'bg-blue-50/70 hover:bg-blue-100/90 text-blue-950'
                                  : 'bg-white hover:bg-gray-50 text-gray-800'
                              }`}
                              title={isBooked ? `${dayBookings.length} event(s) booked - Click to inspect` : 'Available - Click to inspect'}
                            >
                              <div className="w-full flex items-center justify-between">
                                <span className={`text-[11px] font-bold leading-none ${
                                  isToday
                                    ? 'w-5 h-5 rounded-full bg-[#071A3D] text-white flex items-center justify-center -ml-0.5 -mt-0.5 font-black text-[10px]'
                                    : isBooked
                                    ? 'font-black text-amber-900'
                                    : 'text-gray-700'
                                }`}>
                                  {dayNum}
                                </span>
                                {isBooked && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E]"></span>
                                )}
                              </div>

                              <div className="w-full truncate text-[9px] mt-1">
                                {isBooked ? (
                                  <span className="text-[8px] font-black text-amber-800 uppercase block truncate">
                                    {dayBookings.length} Booked
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-semibold text-emerald-600 block truncate">
                                    Free
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}

                        {/* Trailing empty cells to cleanly fill out the last row */}
                        {(() => {
                          const totalCells = firstDayOfWeek + daysInMonth
                          const trailingCells = (7 - (totalCells % 7)) % 7
                          return [...Array(trailingCells)].map((_, i) => (
                            <div key={`trailing-${i}`} className="bg-gray-50/60 min-h-[46px] sm:min-h-[50px]" />
                          ))
                        })()}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-5 text-[11px] font-bold text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C8102E]"></span>
                        <span>Booked Event</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ASSOCIATED CATERING & VENUE BOOKINGS */}
            <div className="bg-white rounded-xl border border-gray-400 shadow-2xs overflow-hidden flex flex-col min-h-[440px]">
              <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5 truncate">
                  <span className="material-icons text-sm text-[#C8102E]">event_note</span>
                  <span>Associated Bookings ({associatedBookings.length})</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-500 shrink-0">Live Audit Records</span>
              </div>

              <div className="flex-1 flex flex-col">
                {associatedBookings.length === 0 ? (
                  <div className="p-8 my-auto text-center space-y-2">
                    <span className="material-icons text-3xl text-gray-300">event_busy</span>
                    <p className="text-xs text-gray-400 italic">
                      No customer bookings currently scheduled for this function hall.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 font-bold uppercase text-[10px] sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 sm:p-3">Booking ID</th>
                          <th className="p-2.5 sm:p-3">Customer</th>
                          <th className="p-2.5 sm:p-3">Event Date</th>
                          <th className="p-2.5 sm:p-3">Guests</th>
                          <th className="p-2.5 sm:p-3">Amount</th>
                          <th className="p-2.5 sm:p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {associatedBookings.map((b) => (
                          <tr key={b.booking_id} className="hover:bg-gray-50">
                            <td className="p-2.5 sm:p-3 font-bold font-mono text-[#C8102E] whitespace-nowrap">{b.booking_code || `#${b.booking_id}`}</td>
                            <td className="p-2.5 sm:p-3 font-bold text-gray-800 whitespace-nowrap">{b.customer_name || 'Guest'}</td>
                            <td className="p-2.5 sm:p-3 text-gray-600 whitespace-nowrap">{b.event_date || 'TBD'}</td>
                            <td className="p-2.5 sm:p-3 font-bold text-gray-700 whitespace-nowrap">{b.guest_count || hall.capacity} Pax</td>
                            <td className="p-2.5 sm:p-3 font-bold font-mono text-gray-800 whitespace-nowrap">₱{(b.total_amount || b.package_total || 0).toLocaleString()}</td>
                            <td className="p-2.5 sm:p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                b.status === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : b.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}>
                                {b.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        )
      })()}

      {/* 4. EDIT FUNCTION HALL MODAL */}
      <FunctionHallModal
        isOpen={isEditModalOpen}
        editingHall={hall}
        onClose={() => setIsEditModalOpen(false)}
        handleSaveHallSubmit={handleSaveEditSubmit}
        hallName={hallName}
        setHallName={setHallName}
        hallDesc={hallDesc}
        setHallDesc={setHallDesc}
        hallCapacity={hallCapacity}
        setHallCapacity={setHallCapacity}
        hallLocation={hallLocation}
        setHallLocation={setHallLocation}
        hallHourlyRate={hallHourlyRate}
        setHallHourlyRate={setHallHourlyRate}
        hallStatus={hallStatus}
        setHallStatus={setHallStatus}
        hallImage={hallImage}
        setHallImage={setHallImage}
        hallGalleryText={hallGalleryText}
        setHallGalleryText={setHallGalleryText}
        hallAmenitiesText={hallAmenitiesText}
        setHallAmenitiesText={setHallAmenitiesText}
        handleCoverFileUpload={handleCoverFileUpload}
        handleGalleryFilesUpload={handleGalleryFilesUpload}
      />

      {/* 5. ADD-ONS MANAGEMENT MODAL */}
      <AddonManagementModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />

      {/* 6. REUSABLE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${hall?.hall_name}"?`}
        message="Are you sure you want to permanently delete this venue record? This action cannot be undone."
        confirmText="Yes, Delete Venue"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  )
}
