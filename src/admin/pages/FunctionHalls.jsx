import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import api from '../../services/api'
import FunctionHallModal from '../components/FunctionHallModal'
import ConfirmationModal from '../components/ConfirmationModal'
import AddonManagementModal from '../components/AddonManagementModal'

// High-fidelity Skeleton Component matching Function Hall cards
function FunctionHallCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden flex flex-col justify-between animate-pulse text-[#071A3D]">
      <div>
        {/* Photo Header Skeleton */}
        <div className="relative h-44 w-full bg-gray-200">
          <div className="absolute top-2.5 left-2.5 w-20 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute top-2.5 right-2.5 w-20 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute bottom-2.5 left-2.5 w-20 h-4 bg-gray-300 rounded-md"></div>
          <div className="absolute bottom-2.5 right-2.5 w-20 h-5 bg-gray-300 rounded-md"></div>
        </div>

        {/* Content Body Skeleton */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          <div className="space-y-1.5 border-b border-gray-200 pb-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>

          <div className="h-8 bg-gray-100 rounded-md border border-gray-200"></div>

          <div className="space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          <div className="h-6 bg-blue-50/50 rounded-md border border-blue-200/60"></div>
        </div>
      </div>

      {/* Card Action Footer Skeleton */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 mt-3">
        <div className="w-16 h-7 bg-gray-200 rounded-md"></div>
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-7 bg-gray-200 rounded-md"></div>
          <div className="w-7 h-7 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  )
}

function FunctionHalls(props) {
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  const [functionHalls, setFunctionHalls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hallSearchQuery, setHallSearchQuery] = useState('')
  const [hallStatusFilter, setHallStatusFilter] = useState('All')
  const [hallCurrentPage, setHallCurrentPage] = useState(1)
  const hallItemsPerPage = 8

  // Add-on Management Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false)
  const [addonCount, setAddonCount] = useState(0)

  // Modal States
  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [editingHall, setEditingHall] = useState(null)
  const [hallToDelete, setHallToDelete] = useState(null)
  const [isDeletingHall, setIsDeletingHall] = useState(false)

  const [hallName, setHallName] = useState('')
  const [hallDesc, setHallDesc] = useState('')
  const [hallCapacity, setHallCapacity] = useState('50')
  const [hallLocation, setHallLocation] = useState('Main Building - 2nd Floor')
  const [hallHourlyRate, setHallHourlyRate] = useState('1250')
  const [hallStatus, setHallStatus] = useState('Available')
  const [hallImage, setHallImage] = useState('')
  const [hallGalleryText, setHallGalleryText] = useState('')
  const [hallAmenitiesText, setHallAmenitiesText] = useState('')
  const [hallFacilities, setHallFacilities] = useState([])
  const [hallSchedule, setHallSchedule] = useState([])

  useEffect(() => {
    fetchFunctionHalls()
    fetchAddonsCount()
  }, [])

  const fetchFunctionHalls = async () => {
    setIsLoading(true)
    try {
      const data = await api.functionHalls.getHalls()
      if (data.status === 'success' && data.halls) {
        setFunctionHalls(data.halls)
      }
    } catch (e) {
      showToast('Could not fetch function halls from database.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAddonsCount = async () => {
    try {
      const data = await api.catering.getAddons()
      if (data.status === 'success' && Array.isArray(data.addons)) {
        setAddonCount(data.addons.length)
      }
    } catch (e) {
      // Non-blocking
    }
  }

  const handleOpenAddHall = () => {
    setEditingHall(null)
    setHallName('')
    setHallDesc('')
    setHallCapacity('50')
    setHallLocation('Main Building - 2nd Floor')
    setHallHourlyRate('1250')
    setHallStatus('Available')
    setHallImage('')
    setHallGalleryText('')
    setHallAmenitiesText('Air Conditioning, Tables & Chairs, Sound System, Stage')
    setHallFacilities(['Air Conditioning', 'Sound System', 'Tables & Chairs', 'Stage'])
    setHallSchedule([])
    setIsHallModalOpen(true)
  }

  const handleOpenEditHall = (hall) => {
    setEditingHall(hall)
    setHallName(hall.hall_name)
    setHallDesc(hall.description || '')
    setHallCapacity(String(hall.capacity || 50))
    setHallLocation(hall.location || 'Main Building')
    setHallHourlyRate(String(hall.hourly_rate || hall.rental_price || 1250))
    setHallStatus(hall.status || 'Available')
    setHallImage(hall.hall_image || hall.image || '')
    setHallGalleryText(Array.isArray(hall.gallery) ? hall.gallery.join('\n') : (hall.gallery || ''))

    const amenitiesArr = Array.isArray(hall.amenities || hall.facilities)
      ? (hall.amenities || hall.facilities)
      : ['Air Conditioning', 'Tables & Chairs', 'Sound System', 'Stage']
    setHallAmenitiesText(amenitiesArr.join(', '))
    setHallFacilities(amenitiesArr)
    setHallSchedule(hall.schedule || [])
    setIsHallModalOpen(true)
  }

  const handleCoverFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 550
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.55)
          setHallImage(compressed)
          showToast('Cover photo uploaded!', 'success')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryFilesUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    let loadedCount = 0
    const newPhotos = []

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 550
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.55)
          newPhotos.push(compressed)
          loadedCount++

          if (loadedCount === files.length) {
            setHallGalleryText(prev => {
              const existing = prev ? prev.trim() : ''
              return existing ? `${existing}\n${newPhotos.join('\n')}` : newPhotos.join('\n')
            })
            showToast(`${files.length} gallery photo(s) uploaded!`, 'success')
          }
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSaveHallSubmit = async (e) => {
    e.preventDefault()
    if (!hallName || !hallHourlyRate || !hallCapacity) {
      showToast('Hall Name, Capacity, and Hourly Rate are required.', 'error')
      return
    }

    const parsedGallery = typeof hallGalleryText === 'string'
      ? hallGalleryText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      : (Array.isArray(hallGalleryText) ? hallGalleryText : [])
    const parsedAmenities = hallAmenitiesText.split(',').map(s => s.trim()).filter(Boolean)

    const payload = {
      hall_name: hallName,
      description: hallDesc,
      capacity: parseInt(hallCapacity),
      location: hallLocation,
      hall_image: hallImage,
      gallery: parsedGallery.length > 0 ? parsedGallery : (hallImage ? [hallImage] : []),
      hourly_rate: parseFloat(hallHourlyRate),
      status: hallStatus,
      facilities: parsedAmenities,
      amenities: parsedAmenities,
      schedule: hallSchedule
    }

    try {
      const data = editingHall
        ? await api.functionHalls.updateHall(editingHall.hall_id, payload)
        : await api.functionHalls.createHall(payload)

      if (data.status === 'success') {
        showToast(editingHall ? 'Function Hall updated!' : 'New Function Hall added!', 'success')
        fetchFunctionHalls()
        setIsHallModalOpen(false)
      } else {
        showToast(data.message || 'Error saving hall', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Could not connect to the server.', 'error')
    }
  }

  const handleToggleHallStatus = async (hall) => {
    const nextStatus = hall.status === 'Available' ? 'Unavailable' : 'Available'
    try {
      const data = await api.functionHalls.updateHall(hall.hall_id, { status: nextStatus })
      if (data.status === 'success') {
        showToast(`Function Hall "${hall.hall_name}" set to ${nextStatus}`, 'info')
        fetchFunctionHalls()
      } else {
        showToast(data.message || 'Failed to update hall status.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    }
  }

  const handleDeleteHall = (hall_id) => {
    const hall = functionHalls.find(h => h.hall_id === hall_id)
    if (hall) {
      setHallToDelete(hall)
    }
  }

  const handleConfirmDeleteHall = async () => {
    if (!hallToDelete) return
    setIsDeletingHall(true)
    try {
      const data = await api.functionHalls.deleteHall(hallToDelete.hall_id)
      if (data.status === 'success') {
        showToast(`Function hall "${hallToDelete.hall_name}" deleted.`, 'info')
        setHallToDelete(null)
        fetchFunctionHalls()
      } else {
        showToast(data.message || 'Failed to delete function hall.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    } finally {
      setIsDeletingHall(false)
    }
  }

  const activeSearch = hallSearchQuery || searchQuery

  const filteredHalls = functionHalls.filter((hall) => {
    const matchesSearch =
      hall.hall_name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (hall.location || '').toLowerCase().includes(activeSearch.toLowerCase()) ||
      (hall.description || '').toLowerCase().includes(activeSearch.toLowerCase())

    const matchesStatus = hallStatusFilter === 'All' || hall.status === hallStatusFilter
    return matchesSearch && matchesStatus
  })

  const hallTotalPages = Math.ceil(filteredHalls.length / hallItemsPerPage) || 1
  const paginatedHalls = filteredHalls.slice(
    (hallCurrentPage - 1) * hallItemsPerPage,
    hallCurrentPage * hallItemsPerPage
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Function Hall Management</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage banquet halls, venue capacities, locations, and per-hour rental rates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add-on Management Button */}
          <button
            type="button"
            onClick={() => setIsAddonModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-400 text-[#071A3D] hover:bg-gray-50 font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
            title="Manage audio/visual equipment, decor, furniture, and event add-ons"
          >
            <span className="material-icons text-base text-[#C8102E]">extension</span>
            <span>Add-ons Management</span>
            {addonCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-[#C8102E] text-[10px] font-black">
                {addonCount}
              </span>
            )}
          </button>

          {/* Add Function Hall Button */}
          <button
            type="button"
            onClick={handleOpenAddHall}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base">add_circle</span>
            <span>Add Function Hall</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search venue name or location..."
            value={hallSearchQuery}
            onChange={(e) => {
              setHallSearchQuery(e.target.value)
              setHallCurrentPage(1)
            }}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-gray-400 text-xs font-semibold focus:outline-none focus:border-[#C8102E] transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-400 w-full sm:w-auto text-xs font-semibold">
          {['All', 'Available', 'Unavailable'].map((filter) => {
            const count = filter === 'All'
              ? functionHalls.length
              : functionHalls.filter(h => h.status === filter).length
            const isActive = hallStatusFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setHallStatusFilter(filter)
                  setHallCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md transition text-xs cursor-pointer ${isActive
                  ? 'bg-white text-gray-900 font-bold border border-gray-400 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 font-semibold'
                  }`}
              >
                {filter} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* SKELETON LOADING VIEW OR FUNCTION HALL CARDS GRID OR EMPTY STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, idx) => (
            <FunctionHallCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredHalls.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-400 p-10 text-center space-y-3">
          <span className="material-icons text-3xl text-gray-400">meeting_room</span>
          <p className="text-xs text-gray-500 font-medium">No function halls match your search query.</p>
          <button
            type="button"
            onClick={() => {
              setHallSearchQuery('')
              setHallStatusFilter('All')
            }}
            className="px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-400 text-xs font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedHalls.map((hall) => {
              const isAvail = hall.status === 'Available'
              const facilitiesList = Array.isArray(hall.facilities) ? hall.facilities : (hall.facilities ? String(hall.facilities).split(',').map(s => s.trim()).filter(Boolean) : [])
              const galleryImages = Array.isArray(hall.gallery) ? hall.gallery : (hall.gallery ? [hall.gallery] : [])

              return (
                <div
                  key={hall.hall_id}
                  className="group bg-white rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between text-[#071A3D]"
                >
                  <div
                    onClick={() => navigate(`/admin/halls/${hall.hall_id}`)}
                    className="cursor-pointer space-y-3"
                  >
                    {/* 1. PHOTO HEADER CONTAINER */}
                    <div className="relative h-44 w-full bg-gray-900 overflow-hidden border-b border-gray-300">
                      {hall.hall_image ? (
                        <img
                          src={hall.hall_image}
                          alt={hall.hall_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800">
                          <span className="material-icons text-4xl">meeting_room</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                      {/* Top Left Availability Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleHallStatus(hall)
                        }}
                        className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[9px] font-black shadow-md backdrop-blur-md border transition-all active:scale-95 cursor-pointer ${isAvail
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
                            : 'bg-red-950/90 text-red-300 border-red-500/60 hover:bg-red-900'
                          }`}
                        title="Click to toggle hall availability"
                      >
                        {isAvail ? '● AVAILABLE' : '○ UNAVAILABLE'}
                      </button>

                      {/* Top Right Capacity Badge */}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/70 text-white backdrop-blur-md border border-white/20">
                        👥 {hall.capacity} Pax
                      </span>

                      {/* Bottom Left Location Pin */}
                      <div className="absolute bottom-2.5 left-2.5 text-[10px] text-gray-200 font-semibold flex items-center gap-1 drop-shadow-md">
                        <span className="material-icons text-xs text-[#C8102E]">place</span>
                        <span className="truncate max-w-[170px]">{hall.location || 'Main Floor'}</span>
                      </div>

                      {/* Bottom Right Hourly Rate Badge */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#C8102E] text-white text-[10px] font-black tracking-wide shadow-md">
                        ₱{parseFloat(hall.hourly_rate || hall.rental_price || 1250).toLocaleString()} <span className="text-[8px] font-normal opacity-90">/hr</span>
                      </div>
                    </div>

                    {/* 2. CARD CONTENT CONTAINER */}
                    <div className="p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-1.5 border-b border-gray-200 pb-2">
                        <div>
                          <h3 className="font-bold text-sm text-[#071A3D] group-hover:text-[#C8102E] transition truncate max-w-[200px]" title={hall.hall_name}>
                            {hall.hall_name}
                          </h3>
                          <p className="text-[10px] text-gray-500 line-clamp-1">
                            {hall.description || 'Full-service air-conditioned banquet hall.'}
                          </p>
                        </div>
                      </div>

                      {/* Included Facilities / Amenities Tags */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Included Facilities
                        </span>
                        <div className="flex flex-wrap gap-1 min-h-[38px]">
                          {facilitiesList.slice(0, 3).map((facility, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200 truncate max-w-[120px]"
                            >
                              ✓ {facility}
                            </span>
                          ))}
                          {facilitiesList.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 text-[10px] font-bold border border-gray-200">
                              +{facilitiesList.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Booking Notice / Schedule Indicator */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 bg-blue-50/50 p-1.5 rounded-md border border-blue-200/60 font-medium">
                        <span className="flex items-center gap-1 text-blue-800">
                          <span className="material-icons text-xs">calendar_today</span>
                          <span>Reservations Active</span>
                        </span>
                        <span className="font-bold text-blue-900 hover:underline">
                          View Calendar →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. CARD ACTION FOOTER */}
                  <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/halls/${hall.hall_id}`)}
                      className="px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-[11px] font-bold text-[#071A3D] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-icons text-xs text-[#071A3D]">visibility</span>
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditHall(hall)}
                        className="px-2.5 py-1.5 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span className="material-icons text-xs">edit</span>
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHallToDelete(hall)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer border border-transparent hover:border-red-200"
                        title="Delete Function Hall"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          <PaginationControls
            currentPage={hallCurrentPage}
            totalPages={hallTotalPages}
            onPageChange={(p) => setHallCurrentPage(p)}
            totalItems={filteredHalls.length}
            itemsPerPage={hallItemsPerPage}
          />
        </>
      )}

      {/* CREATE / EDIT HALL MODAL COMPONENT */}
      <FunctionHallModal
        isOpen={isHallModalOpen}
        editingHall={editingHall}
        onClose={() => setIsHallModalOpen(false)}
        handleSaveHallSubmit={handleSaveHallSubmit}
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

      {/* ADD-ONS MANAGEMENT MODAL COMPONENT */}
      <AddonManagementModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onAddonsUpdated={(list) => {
          if (Array.isArray(list)) setAddonCount(list.length)
        }}
      />

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!hallToDelete}
        onClose={() => setHallToDelete(null)}
        onConfirm={handleConfirmDeleteHall}
        title={`Delete "${hallToDelete?.hall_name}"?`}
        message="Are you sure you want to delete this function hall venue? This action is permanent and cannot be undone."
        confirmText="Yes, Delete Venue"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingHall}
      />
    </div>
  )
}

export default FunctionHalls
