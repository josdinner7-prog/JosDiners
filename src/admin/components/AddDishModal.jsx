import React from 'react'

export default function AddDishModal({
  isOpen,
  onClose,
  handleAddDishSubmit,
  formName,
  setFormName,
  formCategory,
  setFormCategory,
  formDescription,
  setFormDescription,
  formPrice,
  setFormPrice,
  formServingSize,
  setFormServingSize,
  formPrepTime,
  setFormPrepTime,
  formImage,
  setFormImage,
  formIngredients,
  setFormIngredients,
  formAllergens,
  setFormAllergens,
  formIsFeatured,
  setFormIsFeatured,
  handleFileUpload,
  categories,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto text-[#071A3D]">

        {/* Modal Header */}
        <header className="bg-white border-b border-gray-300 p-3 sm:p-3.5 px-3.5 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-base">add_circle</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-black text-[#071A3D] tracking-tight truncate">Add New Dish Item</h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">Create a new entry in Jo's Diner catalog</p>
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
        <form onSubmit={handleAddDishSubmit} className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/40">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">

            {/* LEFT COLUMN: Image Upload & Pricing Specs (5 Cols) */}
            <div className="lg:col-span-5 space-y-3 bg-white p-3 sm:p-3.5 rounded-xl border border-gray-300 shadow-2xs">
              <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <span className="material-icons text-xs text-[#C8102E]">photo_camera</span>
                <span>Photo & Pricing</span>
              </h4>

              {/* Dish Photo / File Upload */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Dish Image / Photo *</label>
                <div className="border border-dashed border-gray-400 bg-gray-50/90 hover:bg-gray-100/90 p-2.5 sm:p-3 rounded-lg text-center transition relative">
                  {formImage ? (
                    <div className="space-y-2">
                      <div className="w-full h-28 sm:h-32 rounded-md overflow-hidden border border-gray-300 bg-gray-900 relative">
                        <img src={formImage} alt="Dish Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <label className="font-black text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
                          <span className="material-icons text-xs">file_upload</span>
                          <span>Change File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setFormImage)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="font-black text-red-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span className="material-icons text-xs">delete</span>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-3 cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-red-50 text-[#C8102E] flex items-center justify-center mb-1 border border-red-100">
                        <span className="material-icons text-lg">cloud_upload</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#071A3D]">Upload Image File</span>
                      <span className="text-[9px] text-gray-500 font-medium mt-0.5">PNG, JPG, WEBP, GIF</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setFormImage)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="mt-1.5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Or Paste Image URL:</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-md bg-gray-50 border border-gray-300 font-medium text-[11px] text-gray-800 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Price (₱) *</label>
                <input
                  type="number"
                  required
                  placeholder="250"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-black text-sm text-[#C8102E] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                />
              </div>

              {/* Portion & Prep Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[10px]">Portion Size</label>
                  <input
                    type="text"
                    placeholder="e.g., 2-3 Persons"
                    value={formServingSize}
                    onChange={(e) => setFormServingSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[10px]">Prep Time</label>
                  <input
                    type="text"
                    placeholder="e.g., 20 mins"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Culinary Specifications & Flags (7 Cols) */}
            <div className="lg:col-span-7 space-y-3 bg-white p-3 sm:p-3.5 rounded-xl border border-gray-300 shadow-2xs">
              <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                <span className="material-icons text-xs text-[#C8102E]">restaurant</span>
                <span>Dish Specifications</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Crispy Lechon Kawali"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Description</label>
                <textarea
                  rows="2"
                  placeholder="Short description of dish flavors and ingredients..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Key Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g. Pork belly, garlic, soy sauce"
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Allergens Notice</label>
                  <input
                    type="text"
                    placeholder="e.g. Soy, Peanuts, Dairy, None"
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-gray-200">
                <label className="flex items-center gap-2.5 p-2 rounded-lg border bg-amber-50/80 border-amber-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <span className="material-icons text-sm text-amber-500">star</span>
                    <span>Mark as Featured Dish (Highlight on Homepage)</span>
                  </div>
                </label>
              </div>

            </div>

          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              Create Dish Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
