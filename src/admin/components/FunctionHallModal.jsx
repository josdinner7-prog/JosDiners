import React from 'react'

export default function FunctionHallModal({
  isOpen,
  editingHall,
  onClose,
  handleSaveHallSubmit,
  hallName,
  setHallName,
  hallDesc,
  setHallDesc,
  hallCapacity,
  setHallCapacity,
  hallLocation,
  setHallLocation,
  hallHourlyRate,
  setHallHourlyRate,
  hallStatus,
  setHallStatus,
  hallImage,
  setHallImage,
  hallGalleryText,
  setHallGalleryText,
  hallAmenitiesText,
  setHallAmenitiesText,
  handleCoverFileUpload,
  handleGalleryFilesUpload
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto text-[#071A3D]">

        {/* Modal Header */}
        <header className="bg-white border-b border-gray-300 p-3 sm:p-3.5 px-3.5 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-base">{editingHall ? 'edit' : 'add_business'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-black text-[#071A3D] tracking-tight truncate">
                {editingHall ? 'Edit Function Hall Specifications' : 'Add New Function Hall Venue'}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {editingHall ? `Updating venue record for "${editingHall.hall_name}"` : 'Create a new function hall venue record for customer bookings'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </header>

        {/* Modal Form */}
        <form onSubmit={handleSaveHallSubmit} className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/40">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">

            {/* LEFT COLUMN: Photos & Image Uploads (5 Cols) */}
            <div className="lg:col-span-5 space-y-3 bg-white p-3 sm:p-3.5 rounded-xl border border-gray-300 shadow-2xs">
              <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <span className="material-icons text-xs text-[#C8102E]">photo_camera</span>
                <span>Cover & Gallery Photos</span>
              </h4>

              {/* Cover Photo Upload */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Cover Photo *</label>
                <div className="border border-dashed border-gray-400 bg-gray-50/90 hover:bg-gray-100/90 p-2.5 sm:p-3 rounded-lg text-center transition relative">
                  {hallImage ? (
                    <div className="space-y-2">
                      <div className="w-full h-28 sm:h-32 rounded-md overflow-hidden border border-gray-300 bg-gray-900 relative">
                        <img src={hallImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <label className="font-black text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
                          <span className="material-icons text-xs">file_upload</span>
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setHallImage('')}
                          className="font-black text-red-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span className="material-icons text-xs">delete</span>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-3 space-y-1">
                      <span className="material-icons text-2xl text-gray-400 block">cloud_upload</span>
                      <span className="text-[11px] font-bold text-blue-600 hover:underline block">Click to upload cover image</span>
                      <span className="text-[10px] text-gray-400 font-normal block">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste cover photo URL..."
                  value={hallImage}
                  onChange={(e) => setHallImage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 mt-2 text-[11px] focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Multiple Gallery Photos Upload */}
              <div className="space-y-2">
                {(() => {
                  const galleryItems = typeof hallGalleryText === 'string'
                    ? hallGalleryText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
                    : (Array.isArray(hallGalleryText) ? hallGalleryText : [])
                  
                  return (
                    <>
                      <label className="block text-gray-700 font-bold text-[11px]">
                        Venue Gallery Showcase Photos ({galleryItems.length})
                      </label>
                      
                      {/* Upload Dropzone */}
                      <label className="border border-dashed border-[#C8102E]/40 bg-[#C8102E]/5 hover:bg-[#C8102E]/10 p-2.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold text-[#C8102E]">
                        <span className="material-icons text-xl">collections</span>
                        <span>Upload Multiple Gallery Photos</span>
                        <span className="text-[9px] font-medium text-gray-500">Click to select files from device</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGalleryFilesUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Gallery Live Thumbnail Previews Grid */}
                      {galleryItems.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Uploaded Gallery Photos ({galleryItems.length})
                          </span>
                          <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-gray-300 rounded-lg bg-gray-50">
                            {galleryItems.map((url, idx) => (
                              <div key={idx} className="relative h-14 rounded-md overflow-hidden border border-gray-300 bg-gray-900 group">
                                <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = galleryItems.filter((_, i) => i !== idx)
                                    setHallGalleryText(updated.join('\n'))
                                  }}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition cursor-pointer"
                                  title="Remove photo"
                                >
                                  <span className="material-icons text-[10px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                <textarea
                  rows="2"
                  placeholder="Or paste gallery photo URLs (one URL per line)"
                  value={hallGalleryText}
                  onChange={(e) => setHallGalleryText(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E] font-mono text-[10px]"
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Venue Details & Specifications (7 Cols) */}
            <div className="lg:col-span-7 space-y-3 bg-white p-3 sm:p-3.5 rounded-xl border border-gray-300 shadow-2xs">
              <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <span className="material-icons text-xs text-[#C8102E]">business</span>
                <span>Hall Specifications & Pricing</span>
              </h4>

              {/* Hall Name */}
              <div>
                <label className="block mb-1 text-gray-700 font-bold text-[11px]">Hall Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Hall (Ballroom)"
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E] font-bold"
                />
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700 font-bold text-[11px]">Building Location</label>
                  <input
                    type="text"
                    placeholder="Main Building - 2nd Floor"
                    value={hallLocation}
                    onChange={(e) => setHallLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 font-bold text-[11px]">Availability Status</label>
                  <select
                    value={hallStatus}
                    onChange={(e) => setHallStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Under Maintenance</option>
                    <option value="Booked">Fully Booked</option>
                  </select>
                </div>
              </div>

              {/* Capacity & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700 font-bold text-[11px]">Capacity (Pax) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={hallCapacity}
                    onChange={(e) => setHallCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-extrabold focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 font-bold text-[11px]">Hourly Extension Rate (₱) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1250"
                    value={hallHourlyRate}
                    onChange={(e) => setHallHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-black text-sm text-[#C8102E] focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              {/* Included Amenities & Facilities */}
              <div>
                <label className="block mb-1 text-gray-700 font-bold text-[11px]">Included Amenities (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Air Conditioning, Tables & Chairs, Sound System, Stage"
                  value={hallAmenitiesText}
                  onChange={(e) => setHallAmenitiesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E]"
                />
                {hallAmenitiesText && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {hallAmenitiesText.split(',').map((item, idx) => {
                      const trimmed = item.trim()
                      if (!trimmed) return null
                      return (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <span className="material-icons text-[10px] text-emerald-600">check</span>
                          <span>{trimmed}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Overview / Description */}
              <div>
                <label className="block mb-1 text-gray-700 font-bold text-[11px]">Venue Description / Overview</label>
                <textarea
                  rows="3"
                  placeholder="A spacious venue suitable for weddings, birthdays, corporate events..."
                  value={hallDesc}
                  onChange={(e) => setHallDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E]"
                />
              </div>

            </div>

          </div>

          {/* Modal Footer matching Menu Management */}
          <div className="bg-white border-t border-gray-300 p-3 sm:p-3.5 px-4 sm:px-5 flex items-center justify-end gap-2.5 shrink-0 -mx-3.5 sm:-mx-5 -mb-3.5 sm:-mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-icons text-sm">save</span>
              <span>{editingHall ? 'Save Changes' : 'Create Hall'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
