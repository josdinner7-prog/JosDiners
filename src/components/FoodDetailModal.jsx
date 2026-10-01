import { useState, useEffect } from 'react'

function FoodDetailModal({ item, onClose, onAddToCart, isDarkMode }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOption, setSelectedOption] = useState(item?.options ? item.options[0] : null)
  const [specialInstructions, setSpecialInstructions] = useState('')

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
      setQuantity(1)
      setSelectedOption(item.options ? item.options[0] : null)
      setSpecialInstructions('')
    } else {
      document.body.style.overflow = ''
      setQuantity(1)
      setSelectedOption(null)
      setSpecialInstructions('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  if (!item) return null

  const handleAdd = () => {
    onAddToCart({
      ...item,
      selectedOption,
      specialInstructions,
      quantity,
      finalPrice: (item.price + (selectedOption?.extraPrice || 0)) * quantity
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4">
      <div className={`rounded-md max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-400 dark:border-slate-500 transition-colors duration-300 animate-in fade-in zoom-in duration-200 ${
        isDarkMode 
          ? 'bg-[#071A3D] text-white' 
          : 'bg-white text-[#071A3D]'
      }`}>
        
        {/* Header Image */}
        <div className="relative h-40 sm:h-56 md:h-64 bg-gray-100 overflow-hidden border-b border-gray-300 dark:border-slate-700 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition cursor-pointer border border-white/20"
          >
            ✕
          </button>
          <span className="absolute bottom-4 left-4 bg-[#C8102E] text-white text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider shadow-xs border border-red-700">
            {item.categoryLabel}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>{item.name}</h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.description}</p>
            </div>
            <span className="text-lg font-extrabold text-[#C8102E] font-mono shrink-0">
              ₱{item.price.toLocaleString()}
            </span>
          </div>

          <div className={`flex items-center gap-4 text-xs p-3 rounded-lg border ${
            isDarkMode ? 'bg-[#0B1B36] border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'
          }`}>
            <span className="flex items-center gap-1 font-semibold text-[#F59E0B]">
              <span className="material-icons text-amber-500 text-sm">star</span>
              {item.rating} ({item.reviewsCount} reviews)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-icons text-sm text-gray-400">schedule</span>
              Prep: {item.prepTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-icons text-sm text-gray-400">groups</span>
              {item.servings}
            </span>
          </div>

          {/* Options if available */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-2">
              <label className={`block text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-[#071A3D]'
              }`}>
                Select Option / Serving Size:
              </label>
              <div className="space-y-2">
                {item.options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                      selectedOption?.name === opt.name
                        ? 'border-[#C8102E] bg-red-500/10 text-[#C8102E]'
                        : isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="food-option"
                        checked={selectedOption?.name === opt.name}
                        onChange={() => setSelectedOption(opt)}
                        className="accent-[#C8102E]"
                      />
                      <span>{opt.name}</span>
                    </div>
                    {opt.extraPrice > 0 && (
                      <span className="font-bold">+₱{opt.extraPrice}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-[#071A3D]'
            }`}>
              Special Instructions / Dietary Preferences:
            </label>
            <textarea
              rows="2"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, separate sauce, extra cutlery..."
              className={`w-full border rounded-lg p-3 text-xs focus:outline-none focus:border-[#C8102E] ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
            ></textarea>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`border-t p-4 sm:p-5 flex items-center justify-between gap-4 ${
          isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-gray-50 border-gray-300'
        }`}>
          
          {/* Quantity Selector */}
          <div className={`flex items-center border rounded-lg px-3 py-1.5 shadow-xs ${
            isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-gray-300 bg-white text-[#071A3D]'
          }`}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="hover:text-[#C8102E] font-bold text-lg px-2"
            >
              -
            </button>
            <span className="text-sm font-extrabold px-3">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="hover:text-[#C8102E] font-bold text-lg px-2"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-[#C8102E] hover:bg-[#9B0B21] text-white py-3 px-6 rounded-lg font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-between"
          >
            <span>Add to Order</span>
            <span className="font-mono">₱{((item.price + (selectedOption?.extraPrice || 0)) * quantity).toLocaleString()}</span>
          </button>

        </div>

      </div>
    </div>
  )
}

export default FoodDetailModal
