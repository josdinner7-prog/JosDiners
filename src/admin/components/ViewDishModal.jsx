import React from 'react'

export default function ViewDishModal({ dish, onClose, onEdit }) {
  if (!dish) return null

  // Format Helper Values
  const formattedId = `#${String(dish.item_id || dish.id || 125).padStart(5, '0')}`
  const categoryName = dish.category
    ? dish.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Pasta'
  const formattedPrice = `₱${parseFloat(dish.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const isAvailable = dish.availability === 'Available'
  const isFeatured = Boolean(dish.is_featured)
  const isActive = (dish.status || 'Active') === 'Active'

  // Ingredients list parsing
  const rawIngredients = dish.ingredients || 'Pasta, Grilled Chicken, Cream, Parmesan Cheese, Garlic, Butter, Italian Herbs, Salt & Pepper'
  const ingredientsArray = rawIngredients.split(',').map(item => item.trim()).filter(Boolean)

  // Allergens parsing
  const rawAllergens = dish.allergens || 'Milk, Wheat'
  const allergensArray = rawAllergens.toLowerCase() === 'none'
    ? []
    : rawAllergens.split(',').map(a => a.trim()).filter(Boolean)

  // Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Aug 27, 2026'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col max-h-[90vh] my-auto text-[#071A3D]">
        
        {/* 1. TOP HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-300 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-sm">restaurant_menu</span>
            </div>
            <div>
              <h2 className="text-base font-black text-[#071A3D] tracking-tight">View Dish Details</h2>
              <p className="text-[10px] text-gray-500 font-medium">Complete specifications and system information.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer active:scale-95"
            title="Close Modal"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-700 bg-gray-50/40">
          
          {/* 2. TOP HERO SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white p-3.5 rounded-xl border border-gray-300 shadow-2xs">
            {/* Left Column: Food Photo */}
            <div className="sm:col-span-5 h-38 sm:h-40 w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-900 relative shrink-0 shadow-xs group">
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <span className="bg-[#071A3D]/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/20 shadow-xs">
                  {categoryName}
                </span>
              </div>
            </div>

            {/* Right Column: Key Meta */}
            <div className="sm:col-span-7 space-y-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#071A3D] leading-tight tracking-tight">{dish.name}</h3>
                <span className="text-xl sm:text-2xl font-black text-[#C8102E] tracking-tight font-mono block mt-0.5">{formattedPrice}</span>
              </div>

              {/* Status Badges Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs border ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                    : 'bg-red-50 text-red-800 border-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                  <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                </span>

                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-400 shadow-2xs">
                    <span className="material-icons text-xs text-amber-500">star</span>
                    <span>Featured Dish</span>
                  </span>
                )}
              </div>

              {/* Portion & Prep Specs */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-300">
                <div className="flex items-center gap-2 text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-300">
                  <span className="material-icons text-xs text-blue-600">person_outline</span>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold block">Portion</span>
                    <span className="font-extrabold text-gray-800 truncate">{dish.serving_size || '1 Serving'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-300">
                  <span className="material-icons text-xs text-amber-600">schedule</span>
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold block">Prep Time</span>
                    <span className="font-extrabold text-gray-800 truncate">{dish.prep_time || '25 mins'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BALANCED 2-COLUMN CONTENT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* LEFT COLUMN: Food Culinary Details (60% width) */}
            <div className="md:col-span-7 space-y-4">
              
              {/* DESCRIPTION CARD */}
              <div className="bg-white rounded-xl border border-gray-300 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#071A3D]">
                  <span className="material-icons text-xs text-blue-600">assignment</span>
                  <h4 className="text-[11px] font-black uppercase tracking-wider">Description</h4>
                </div>
                <p className="text-[11px] text-gray-600 font-medium leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-300">
                  {dish.description || 'Creamy pasta with grilled chicken, Parmesan cheese, and a blend of herbs and spices.'}
                </p>
              </div>

              {/* INGREDIENTS CARD */}
              <div className="bg-white rounded-xl border border-gray-300 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#071A3D]">
                  <span className="material-icons text-xs text-emerald-600">eco</span>
                  <h4 className="text-[11px] font-black uppercase tracking-wider">Ingredients</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-gray-700 font-semibold bg-gray-50 p-2.5 rounded-lg border border-gray-300">
                  {ingredientsArray.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                      <span className="truncate">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Operational & System Metadata (50% / 40% width) */}
            <div className="md:col-span-5 space-y-4">
              
              {/* ALLERGENS CARD */}
              <div className="bg-white rounded-xl border border-gray-300 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#071A3D]">
                  <span className="material-icons text-xs text-amber-600">warning_amber</span>
                  <h4 className="text-[11px] font-black uppercase tracking-wider">Allergens Notice</h4>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-300 space-y-1.5">
                  {allergensArray.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {allergensArray.map((alg, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-md bg-amber-100/90 text-amber-950 font-black text-[10px] border border-amber-300">
                            {alg}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium pt-0.5">May contain traces of nuts.</p>
                    </>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <span className="material-icons text-emerald-600 text-xs">check_circle</span>
                      <span>No known allergens</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DISH SYSTEM INFORMATION CARD */}
              <div className="bg-white rounded-xl border border-gray-300 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#071A3D]">
                  <span className="material-icons text-xs text-indigo-600">info</span>
                  <h4 className="text-[11px] font-black uppercase tracking-wider">Dish System Info</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2">
                    <span className="material-icons text-xs text-blue-600">qr_code_2</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Item ID</span>
                      <span className="font-mono font-black text-[#071A3D]">{formattedId}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2">
                    <span className="material-icons text-xs text-purple-600">folder</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Category</span>
                      <span className="font-bold text-[#071A3D] truncate block max-w-[70px]">{categoryName}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2">
                    <span className="material-icons text-xs text-emerald-600">verified_user</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Status</span>
                      <span className="font-bold text-emerald-800">{isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2">
                    <span className="material-icons text-xs text-amber-500">star</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Featured</span>
                      <span className="font-bold text-[#071A3D]">{isFeatured ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2 col-span-2">
                    <span className="material-icons text-xs text-blue-500">calendar_today</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Date Added</span>
                      <span className="font-bold text-[#071A3D]">{formatDate(dish.date_added)}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-300 flex items-center gap-2 col-span-2">
                    <span className="material-icons text-xs text-blue-500">event</span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Last Updated</span>
                      <span className="font-bold text-[#071A3D]">{formatDate(dish.last_updated)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 4. MODAL FOOTER */}
        <div className="p-3 sm:px-5 bg-white border-t border-gray-300 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onEdit) onEdit(dish)
            }}
            className="px-6 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-icons text-xs">edit</span>
            <span>Edit Dish</span>
          </button>
        </div>

      </div>
    </div>
  )
}
