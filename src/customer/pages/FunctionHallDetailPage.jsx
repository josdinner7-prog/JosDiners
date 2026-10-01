import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import api from '../../services/api'

function FunctionHallDetailPage(props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const context = useOutletContext() || {}
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const setSelectedHallForBooking = context.setSelectedHallForBooking

  const [hall, setHall] = useState(location.state?.hall || null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!location.state?.hall)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex(prev => (prev + 1) % Math.max(1, (hall?.gallery?.length || 1)))
      }
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex(prev => (prev - 1 + Math.max(1, (hall?.gallery?.length || 1))) % Math.max(1, (hall?.gallery?.length || 1)))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, hall])

  useEffect(() => {
    fetchHallDetails()
  }, [id])

  const fetchHallDetails = async () => {
    try {
      const data = await api.functionHalls.getHalls()
      if (data.status === 'success' && data.halls) {
        const found = data.halls.find(h => String(h.hall_id) === String(id))
        if (found) {
          const coverImg = found.hall_image || found.image || ''
          const parsedGallery = parseGalleryArray(found.gallery || found.gallery_json, coverImg)
          let parsedAmenities = ['Air Conditioning', 'Tables & Chairs', 'Sound System', 'Stage']
          
          if (Array.isArray(found.amenities) && found.amenities.length > 0) {
            parsedAmenities = found.amenities
          } else if (Array.isArray(found.facilities) && found.facilities.length > 0) {
            parsedAmenities = found.facilities
          } else if (typeof found.facilities_json === 'string') {
            try { parsedAmenities = JSON.parse(found.facilities_json) } catch (e) {}
          }

          setHall({
            hall_id: found.hall_id,
            hall_name: found.hall_name,
            capacity: found.capacity,
            min_capacity: Math.round(found.capacity * 0.3),
            fixed_price: found.fixed_price || found.hourly_rate || 10000,
            hourly_rate: found.hourly_rate || 1250,
            image: coverImg || parsedGallery[0],
            gallery: parsedGallery,
            specs: found.description || found.specs || 'A spacious venue suitable for events.',
            amenities: parsedAmenities,
            availability_status: found.status || 'Available'
          })
          setIsLoading(false)
          return
        }
      }
    } catch (e) {}

    setHall(null)
    setIsLoading(false)
  }

  const parseGalleryArray = (input, coverImg) => {
    let arr = []
    if (Array.isArray(input)) {
      arr = input.filter(Boolean)
    } else if (typeof input === 'string' && input.trim()) {
      try {
        const parsed = JSON.parse(input)
        if (Array.isArray(parsed)) arr = parsed.filter(Boolean)
      } catch (e) {
        arr = input.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      }
    }
    if (coverImg && !arr.includes(coverImg)) {
      arr = [coverImg, ...arr]
    }
    if (arr.length === 0 && coverImg) {
      arr = [coverImg]
    }
    return arr.length > 0 ? arr : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80']
  }

  const handleBookHall = () => {
    if (!hall) return
    if (setSelectedHallForBooking) setSelectedHallForBooking(hall)
    navigate(`/function-hall/${hall.hall_id}/availability`, { state: { hall } })
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen py-16 flex items-center justify-center ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'}`}>
        <div className="flex items-center gap-3 font-bold text-sm">
          <span className="w-5 h-5 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"></span>
          <span>Loading Function Hall Details...</span>
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className={`min-h-screen py-20 px-4 flex flex-col items-center justify-center text-center ${
        isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-[#C8102E] flex items-center justify-center mb-4">
          <span className="material-icons text-3xl">corporate_fare</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-2">Function Hall Not Found</h2>
        <p className="text-xs text-gray-500 max-w-sm mb-6 font-medium">
          The function hall venue you are looking for does not exist or may have been removed.
        </p>
        <button
          onClick={() => navigate('/function-halls')}
          className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <span className="material-icons text-sm">arrow_back</span>
          <span>Back to Function Halls</span>
        </button>
      </div>
    )
  }

  const galleryPhotos = parseGalleryArray(hall.gallery, hall.image)
  const currentPhoto = galleryPhotos[activePhotoIndex] || galleryPhotos[0] || hall.image

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Top Bar: Back Button */}
        <div className="flex items-center justify-between border-b pb-4 border-gray-300 dark:border-slate-700">
          <button
            onClick={() => navigate('/function-halls')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#C8102E] hover:text-[#9B0B21] transition cursor-pointer group"
          >
            <span className="material-icons text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span className="group-hover:underline">Back to Function Halls</span>
          </button>
        </div>

        {/* TWO-COLUMN DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Gallery Showcase */}
          <div className="lg:col-span-7 space-y-4">
            {/* Hero Photo Box (Clickable for Fullscreen View) */}
            <div
              onClick={() => currentPhoto && setIsLightboxOpen(true)}
              className="relative h-80 sm:h-96 rounded-lg overflow-hidden shadow-xs border border-gray-300 dark:border-slate-700 bg-slate-900 flex items-center justify-center cursor-pointer group"
              title="Click to expand full screen photo"
            >
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={hall.hall_name}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 relative z-10"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : null}

              {/* Hover Zoom Overlay Badge */}
              {currentPhoto && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-1.5 text-white font-black text-xs pointer-events-none">
                  <span className="w-10 h-10 rounded-full bg-black/60 border border-white/30 flex items-center justify-center shadow-lg">
                    <span className="material-icons text-xl">zoom_in</span>
                  </span>
                  <span>Click to view full photo</span>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-gray-400 shadow-inner">
                  <span className="material-icons text-3xl">corporate_fare</span>
                </div>
                <span className="font-extrabold text-sm text-gray-200 tracking-tight">{hall.hall_name}</span>
                <span className="text-xs text-gray-400 mt-1 font-medium max-w-xs">
                  No venue photos uploaded yet. Check back soon or contact management.
                </span>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-2 z-30">
                <span className="h-5 px-2 rounded font-black text-[9px] uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center justify-center">
                  {hall.availability_status}
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {galleryPhotos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  <span className="material-icons text-xs text-[#C8102E]">collections</span>
                  <span>Venue Photos ({galleryPhotos.length})</span>
                </span>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {galleryPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer bg-slate-900 flex items-center justify-center ${
                        activePhotoIndex === idx
                          ? 'border-[#C8102E] scale-105 shadow-xs'
                          : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-slate-800 pointer-events-none">
                        <span className="material-icons text-base text-gray-500">photo</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Photo {idx + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Hall Information & Booking Action */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#071A3D] dark:text-white">
                {hall.hall_name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                Air-conditioned Event & Banquet Venue
              </p>
            </div>

            {/* Price & Capacity Summary Card */}
            <div className={`p-5 rounded-lg border shadow-xs space-y-3 ${
              isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'
            }`}>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">BASE PRICE</span>
                  <span className="text-2xl font-black text-[#C8102E] font-mono">
                    ₱{(hall.fixed_price || hall.hourly_rate).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-bold">Base Rental</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Max Capacity</span>
                  <span className="font-black text-[#071A3D] dark:text-white">Up to {hall.capacity} Pax</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Hourly Extension</span>
                  <span className="font-black text-[#071A3D] dark:text-white">₱{hall.hourly_rate.toLocaleString()} / hr</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Venue Overview</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                {hall.specs}
              </p>
            </div>

            {/* Included Amenities */}
            <div>
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2.5">Included Amenities</h4>
              <div className="grid grid-cols-2 gap-2">
                {hall.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span className="material-icons text-sm text-emerald-500">check_circle</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking CTA Button (Navigates to the Availability Page) */}
            <button
              onClick={handleBookHall}
              className="w-full py-3 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-icons text-base">calendar_month</span>
              <span>Check Availability</span>
            </button>
          </div>

        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Lightbox Top Control Bar */}
          <div className="flex items-center justify-between text-white border-b border-gray-800 pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight">{hall.hall_name}</h3>
              <p className="text-xs text-gray-400 font-semibold">
                Photo {activePhotoIndex + 1} of {galleryPhotos.length}
              </p>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title="Close full screen photo viewer"
            >
              <span className="material-icons text-2xl">close</span>
            </button>
          </div>

          {/* Lightbox Main Image & Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {galleryPhotos.length > 1 && (
              <button
                onClick={() => setActivePhotoIndex(prev => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)}
                className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-95"
                title="Previous photo"
              >
                <span className="material-icons text-xl sm:text-2xl">chevron_left</span>
              </button>
            )}

            <img
              src={currentPhoto}
              alt={hall.hall_name}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            />

            {galleryPhotos.length > 1 && (
              <button
                onClick={() => setActivePhotoIndex(prev => (prev + 1) % galleryPhotos.length)}
                className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-95"
                title="Next photo"
              >
                <span className="material-icons text-xl sm:text-2xl">chevron_right</span>
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip */}
          {galleryPhotos.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto pt-2 border-t border-gray-800">
              {galleryPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-16 h-12 rounded-md overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activePhotoIndex === idx ? 'border-[#C8102E] scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default FunctionHallDetailPage
