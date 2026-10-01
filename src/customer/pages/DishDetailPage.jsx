import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import LoadingFallback from '../../components/LoadingFallback'

function DishDetailPage(props) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = useOutletContext() || {}

  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const onAddToCart = props.onAddToCart ?? context.handleAddToCart

  const [dish, setDish] = useState(location.state?.item || null)
  const [isLoading, setIsLoading] = useState(!dish)
  const [quantity, setQuantity] = useState(1)
  const [selectedOption, setSelectedOption] = useState(null)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [addedToast, setAddedToast] = useState(false)

  useEffect(() => {
    fetchDishDetails()
  }, [id])

  const cleanDescription = (desc) => {
    if (!desc) return ''
    const rawSentences = desc.split(/(?<=\.)|\n/).map(s => s.trim()).filter(Boolean)
    const unique = []
    for (const s of rawSentences) {
      if (!unique.some(existing => existing.toLowerCase() === s.toLowerCase())) {
        unique.push(s)
      }
    }
    return unique.join(' ')
  }

  const fetchDishDetails = async () => {
    try {
      setIsLoading(true)
      const data = await api.menu.getMenuItems()
      if (data.status === 'success' && data.items) {
        const found = data.items.find(i => String(i.id) === String(id) || String(i.item_id) === String(id))
        if (found) {
          const mapped = {
            id: found.id,
            category: found.category,
            categoryLabel: found.category_name || found.category,
            name: found.name,
            description: cleanDescription(found.description),
            price: parseFloat(found.price),
            prepTime: found.prep_time || '25 mins',
            servings: found.serving_size || '1 Serving',
            tag: found.availability === 'Available' ? 'AVAILABLE' : 'SOLD OUT',
            image: found.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            ingredients: found.ingredients,
            allergens: found.allergens,
            is_featured: !!found.is_featured,
            options: [
              { name: found.serving_size || 'Standard Portion', extraPrice: 0 }
            ]
          }
          setDish(mapped)
          setSelectedOption(mapped.options[0])
        }
      }
    } catch (e) {
      console.error('Error fetching dish details:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCartClick = () => {
    if (!dish || dish.tag !== 'AVAILABLE') return
    const payload = {
      ...dish,
      selectedOption,
      specialInstructions,
      quantity,
      finalPrice: (dish.price + (selectedOption?.extraPrice || 0)) * quantity
    }
    if (onAddToCart) onAddToCart(payload)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  if (isLoading && !dish) {
    return <LoadingFallback message="Loading Dish Details..." />
  }

  if (!dish) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <span className="material-icons text-5xl text-gray-400 mb-3">restaurant_menu</span>
        <h2 className="text-xl font-bold text-[#071A3D] dark:text-white">Dish Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">The dish you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
        >
          Back to Menu Catalog
        </button>
      </div>
    )
  }

  const totalPrice = (dish.price + (selectedOption?.extraPrice || 0)) * quantity

  return (
    <div className={`min-h-screen py-6 sm:py-10 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-300 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition cursor-pointer">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/menu')} className="hover:text-[#C8102E] transition cursor-pointer">Food Menu</button>
            <span>/</span>
            <span className="text-[#C8102E] font-bold">{dish.name}</span>
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-[#C8102E] transition cursor-pointer shadow-2xs"
          >
            <span className="material-icons text-sm">arrow_back</span>
            <span>Back to Menu</span>
          </button>
        </div>

        {/* Compact 2-Column Product Layout with Defined 1px Borders & Reduced Radius */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* Left Column: Image Banner (5 Cols) */}
          <div className="md:col-span-5">
            <div className={`rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700 shadow-md relative ${
              isDarkMode ? 'bg-[#071A3D]' : 'bg-white'
            }`}>
              <div className="relative h-64 sm:h-80 lg:h-[420px] w-full bg-gray-100 dark:bg-slate-900 overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Status Badge */}
                <span className={`absolute top-3 left-3 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                  dish.tag === 'AVAILABLE' ? 'bg-[#C8102E]' : 'bg-slate-900/90 text-slate-200 border border-slate-700'
                }`}>
                  {dish.tag}
                </span>

                {/* Featured Badge */}
                {dish.is_featured && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 border border-amber-300">
                    <span className="material-icons text-xs">star</span>
                    <span>Featured</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Information & Order Form (7 Cols) */}
          <div className={`md:col-span-7 p-5 sm:p-6 rounded-lg border border-gray-300 dark:border-slate-700 shadow-md space-y-4 ${
            isDarkMode ? 'bg-[#071A3D]' : 'bg-white'
          }`}>

            {/* Row 1: Category & Specs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#C8102E] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-3 py-0.5 rounded-md uppercase tracking-wider">
                {dish.categoryLabel}
              </span>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-700">
                  <span className="material-icons text-xs text-[#C8102E]">schedule</span>
                  <span>{dish.prepTime}</span>
                </span>
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-700">
                  <span className="material-icons text-xs text-[#C8102E]">groups</span>
                  <span>{dish.servings}</span>
                </span>
              </div>
            </div>

            {/* Row 2: Dish Title */}
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#071A3D]'
            }`}>
              {dish.name}
            </h1>

            {/* Row 3: Description Accent Box */}
            <div className={`border-l-3 border-[#C8102E] pl-3 py-1.5 rounded-r-md ${
              isDarkMode ? 'bg-red-950/20 text-gray-200' : 'bg-red-50/50 text-gray-700'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {dish.description}
              </p>
            </div>

            {/* Row 4: Defined Price Banner Box */}
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Unit Price</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-[#C8102E]">₱</span>
                  <span className="text-2xl font-black font-mono text-[#071A3D] dark:text-white">
                    {dish.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {dish.tag === 'AVAILABLE' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for Order</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-700">
                  <span>Currently Sold Out</span>
                </div>
              )}
            </div>

            {/* Row 5: Key Ingredients & Allergens */}
            {(dish.ingredients || dish.allergens) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {dish.ingredients && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-300 dark:border-slate-700">
                    <span className="font-bold text-gray-500 dark:text-gray-400 uppercase block text-[10px] mb-0.5">Key Ingredients</span>
                    <p className="text-gray-700 dark:text-gray-300 leading-tight">{dish.ingredients}</p>
                  </div>
                )}
                {dish.allergens && (
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60">
                    <span className="font-bold text-amber-600 dark:text-amber-400 uppercase block text-[10px] mb-0.5">Allergen Notice</span>
                    <p className="text-amber-700 dark:text-amber-300 leading-tight">{dish.allergens}</p>
                  </div>
                )}
              </div>
            )}

            {/* Row 6: Portion Options */}
            {dish.options && dish.options.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">Serving Options</label>
                <div className="flex flex-wrap gap-2">
                  {dish.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition border cursor-pointer active:scale-95 ${
                        selectedOption?.name === opt.name
                          ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                          : isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt.name} {opt.extraPrice > 0 && `(+₱${opt.extraPrice})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 7: Special Instructions */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-gray-400">Special Instructions / Preferences</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Extra spicy, sauce on the side, no onions"
                className={`w-full px-3.5 py-2 rounded-lg text-xs border outline-none transition ${
                  isDarkMode 
                    ? 'bg-[#0B1B36] border-slate-700 text-white focus:border-[#C8102E]' 
                    : 'bg-gray-50 border-gray-300 text-[#071A3D] focus:border-[#C8102E]'
                }`}
              />
            </div>

            {/* Row 8: Defined Order Action Bar */}
            <div className="pt-3 border-t border-gray-300 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                
                {/* Quantity Controls */}
                <div className="flex items-center justify-between gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-300 dark:border-slate-700 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-base shadow-2xs transition hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-base px-2 min-w-[1.75rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-base shadow-2xs transition hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Order Button */}
                <button
                  onClick={handleAddToCartClick}
                  disabled={dish.tag !== 'AVAILABLE'}
                  className={`flex-1 py-3 px-5 rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                    dish.tag === 'AVAILABLE'
                      ? 'bg-[#C8102E] hover:bg-[#9B0B21] text-white hover:shadow-md'
                      : 'bg-gray-300 dark:bg-slate-800 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span className="material-icons text-base">shopping_cart</span>
                  <span>Add to Order — ₱{totalPrice.toLocaleString()}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default DishDetailPage
