import React, { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { useToast } from './ToastNotification'

export default function PackageOrderModal({
  isOpen,
  onClose,
  packageData,
  onAddToCart,
  isDarkMode
}) {
  const { showToast } = useToast()
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [selectedDishes, setSelectedDishes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Load menu catalog
  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    Promise.allSettled([
      api.menu.getMenuItems(),
      api.menu.getCategories()
    ]).then(([itemsRes, catRes]) => {
      if (itemsRes.status === 'fulfilled' && itemsRes.value?.status === 'success' && Array.isArray(itemsRes.value.items)) {
        setMenuItems(itemsRes.value.items)
      }
      if (catRes.status === 'fulfilled' && catRes.value?.status === 'success' && Array.isArray(catRes.value.categories)) {
        setCategories(catRes.value.categories.filter(c => c.status !== 'Inactive'))
      }
    }).finally(() => setIsLoading(false))
  }, [isOpen])

  // Parse allowances and curated dishes from package
  const { allowances, curatedDishes, totalAllowedDishes, basePrice } = useMemo(() => {
    if (!packageData) return { allowances: {}, curatedDishes: [], totalAllowedDishes: 5, basePrice: 0 }

    let rawAllowances = packageData.category_allowances
    if (typeof rawAllowances === 'string') {
      try { rawAllowances = JSON.parse(rawAllowances) } catch { rawAllowances = {} }
    } else if (!rawAllowances && packageData.category_allowances_json) {
      try { rawAllowances = JSON.parse(packageData.category_allowances_json) } catch { rawAllowances = {} }
    }
    const cleanAllowances = rawAllowances && typeof rawAllowances === 'object' ? rawAllowances : {}

    let rawDishes = packageData.package_dishes
    if (typeof rawDishes === 'string') {
      try { rawDishes = JSON.parse(rawDishes) } catch { rawDishes = [] }
    } else if (!rawDishes && packageData.package_dishes_json) {
      try { rawDishes = JSON.parse(packageData.package_dishes_json) } catch { rawDishes = [] }
    }
    const cleanDishes = Array.isArray(rawDishes) ? rawDishes : []

    const sumAllowances = Object.values(cleanAllowances).reduce((sum, n) => sum + (Number(n) || 0), 0)
    const allowed = sumAllowances > 0 ? sumAllowances : (cleanDishes.length > 0 ? cleanDishes.length : 5)
    const price = parseFloat(packageData.package_price || packageData.price_per_person || packageData.price || 0)

    return {
      allowances: cleanAllowances,
      curatedDishes: cleanDishes,
      totalAllowedDishes: allowed,
      basePrice: price
    }
  }, [packageData])

  // Initialize selected dishes with admin's curated dishes
  useEffect(() => {
    if (isOpen && packageData) {
      if (curatedDishes.length > 0) {
        setSelectedDishes(curatedDishes)
      } else {
        setSelectedDishes([])
      }
      setQuantity(1)
      setSpecialInstructions('')
      setSearchQuery('')
      setActiveCategory('all')
    }
  }, [isOpen, packageData, curatedDishes])

  if (!isOpen || !packageData) return null

  // Included vs Extra Dishes
  const includedDishes = selectedDishes.slice(0, totalAllowedDishes)
  const extraDishes = selectedDishes.slice(totalAllowedDishes)
  const extraDishesCost = extraDishes.reduce((sum, d) => sum + parseFloat(d.price || 0), 0)
  const unitPrice = basePrice + extraDishesCost
  const finalPrice = unitPrice * quantity

  const toggleDish = (dish) => {
    const dishId = dish.item_id || dish.id || dish.dish_id
    setSelectedDishes(prev => {
      const exists = prev.some(d => (d.item_id || d.id || d.dish_id) === dishId)
      if (exists) {
        return prev.filter(d => (d.item_id || d.id || d.dish_id) !== dishId)
      } else {
        return [...prev, dish]
      }
    })
  }

  const handleAddToCartSubmit = () => {
    const payload = {
      id: `package-${packageData.package_id || packageData.id || Date.now()}`,
      package_id: packageData.package_id || packageData.id,
      name: packageData.package_name || packageData.name || 'Custom Catering Package',
      description: packageData.description,
      image: packageData.package_image || packageData.image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=700&auto=format&fit=crop&q=80',
      price: unitPrice,
      basePrice: basePrice,
      extraDishesCost: extraDishesCost,
      finalPrice: finalPrice,
      quantity: quantity,
      isPackage: true,
      totalAllowedDishes: totalAllowedDishes,
      customDishes: selectedDishes,
      includedDishes: includedDishes,
      extraDishes: extraDishes,
      specialInstructions: specialInstructions,
      selectedOption: {
        name: `${selectedDishes.length} Dishes (${includedDishes.length} Inc + ${extraDishes.length} Extra)`
      }
    }

    if (onAddToCart) {
      onAddToCart(payload)
    }
    onClose()
  }

  const allowanceEntries = Object.entries(allowances).filter(([_, qty]) => Number(qty) > 0)

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = !searchQuery ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`rounded-2xl max-w-4xl w-full shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto transition-colors duration-200 ${
        isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
      }`}>

        {/* Modal Header */}
        <header className={`p-4 px-5 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/30 shrink-0">
              <span className="material-icons text-xl">bento</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-amber-950">
                  Package Menu Order
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                  {packageData.min_guests ? `${packageData.min_guests}–${packageData.max_guests || 150} Pax` : 'Group Meal'}
                </span>
              </div>
              <h3 className={`text-base sm:text-lg font-black tracking-tight truncate ${
                isDarkMode ? 'text-white' : 'text-[#071A3D]'
              }`}>
                {packageData.package_name || packageData.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold">

          {/* Package Overview Card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-center ${
            isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <img
              src={packageData.package_image || packageData.image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=700&auto=format&fit=crop&q=80'}
              alt={packageData.package_name}
              className="w-full sm:w-32 h-28 rounded-xl object-cover border border-amber-300 dark:border-slate-700 shrink-0 shadow-sm"
            />
            <div className="flex-1 space-y-1.5 min-w-0 w-full">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                    {packageData.package_name}
                  </h4>
                  <p className={`text-xs line-clamp-2 mt-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {packageData.description || 'Complete package menu curated with specialty dishes and servings.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Base Price</span>
                  <span className="text-lg font-black font-mono text-[#C8102E]">
                    ₱{basePrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Allowance Tags */}
              <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                  ✓ {totalAllowedDishes} Included Dishes
                </span>
                {allowanceEntries.map(([catKey, qty]) => (
                  <span
                    key={catKey}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-[10px] font-extrabold capitalize text-gray-800 dark:text-gray-200"
                  >
                    {qty}× {catKey.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Current Selection & Extra Surcharge Live Tracker */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 ${
            selectedDishes.length > totalAllowedDishes
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm text-emerald-600 dark:text-emerald-400">
                  {selectedDishes.length > totalAllowedDishes ? 'notification_important' : 'check_circle'}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Selected Menu Items ({selectedDishes.length} Dishes):
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
                selectedDishes.length <= totalAllowedDishes
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-amber-500 text-amber-950 border-amber-600'
              }`}>
                {selectedDishes.length <= totalAllowedDishes
                  ? `${selectedDishes.length} / ${totalAllowedDishes} Included (₱0 extra)`
                  : `${selectedDishes.length} Dishes (${totalAllowedDishes} Included + ${extraDishes.length} Extra)`}
              </span>
            </div>

            {/* Selected Dishes Chips */}
            {selectedDishes.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">
                No dishes selected yet. Click dishes below to build your package.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                {selectedDishes.map((dish, idx) => {
                  const isExtra = idx >= totalAllowedDishes
                  const dishId = dish.item_id || dish.id || dish.dish_id
                  return (
                    <span
                      key={dishId || idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                        isExtra
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {dish.image && (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      )}
                      <span className="truncate max-w-[130px]">{dish.name || dish.dish_name}</span>
                      <span className={`text-[10px] font-black font-mono ${isExtra ? 'text-[#C8102E]' : 'text-emerald-600'}`}>
                        {isExtra ? `+₱${parseFloat(dish.price || 0).toLocaleString()}` : '₱0 (Inc)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDish(dish)}
                        className="text-gray-400 hover:text-red-600 font-black ml-1 cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Extra Fee Notice */}
            {extraDishes.length > 0 && (
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-bold">
                <span>⚠️ {extraDishes.length} Extra Dish(es) added beyond the {totalAllowedDishes} package allowance:</span>
                <span className="font-mono font-black text-[#C8102E] text-sm">+₱{extraDishesCost.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Curated Package Dishes Preset Box if available */}
          {curatedDishes.length > 0 && (
            <div className={`p-3 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <span className="material-icons text-amber-500 text-sm">stars</span>
                  <span>Admin Curated Preset Dishes ({curatedDishes.length}):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDishes(curatedDishes)}
                  className="text-[11px] font-black text-[#C8102E] hover:underline cursor-pointer"
                >
                  Reset to Curated Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {curatedDishes.map((dish, i) => {
                  const dishId = dish.item_id || dish.id || dish.dish_id
                  const isSelected = selectedDishes.some(d => (d.item_id || d.id || d.dish_id) === dishId)
                  return (
                    <div
                      key={dishId || i}
                      onClick={() => toggleDish(dish)}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400'
                          : 'bg-white dark:bg-slate-800 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {dish.image && (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-7 h-7 rounded-md object-cover shrink-0"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        )}
                        <span className="text-xs font-bold truncate">{dish.name || dish.dish_name}</span>
                      </div>
                      <span className={`text-xs font-black ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full Menu Catalog Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Browse & Add From Restaurant Menu:
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {filteredMenuItems.length} dishes available
              </span>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search dishes by name or ingredients..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:border-[#C8102E] cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id || c.category_slug} value={c.id || c.category_slug}>
                    {c.label || c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredMenuItems.map(item => {
                const itemId = item.id || item.item_id
                const isSelected = selectedDishes.some(d => (d.item_id || d.id || d.dish_id) === itemId)

                return (
                  <div
                    key={itemId}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 shadow-2xs'
                        : isDarkMode ? 'bg-slate-900/60 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-slate-700"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                          <span className="material-icons text-base">restaurant</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-extrabold text-xs truncate leading-tight">
                          {item.name}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 capitalize truncate">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-black text-[#C8102E]">
                            ₱{parseFloat(item.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDish(item)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer shrink-0 active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-[#C8102E] text-gray-700 hover:text-white dark:bg-slate-800 dark:text-gray-200'
                      }`}
                    >
                      {isSelected ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Special Instructions & Notes */}
          <div>
            <label className="block text-gray-600 dark:text-gray-300 font-bold mb-1 text-xs">
              Special Cooking Instructions / Preparation Notes (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g., Less spicy for beef, separate gravy, add extra kalamansi..."
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            />
          </div>

        </div>

        {/* Modal Footer / Checkout Action Bar */}
        <footer className={`p-4 px-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Quantity Stepper & Price Breakdown */}
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-bold">Qty:</span>
              <div className={`flex items-center border rounded-lg overflow-hidden ${
                isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-white'
              }`}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 font-black text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-black text-xs font-mono">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-emerald-500 font-black text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Package Amount</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-[#C8102E]">₱</span>
                <span className="text-xl font-black font-mono text-[#C8102E]">
                  {finalPrice.toLocaleString()}
                </span>
                {extraDishes.length > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">
                    (incl. +₱{(extraDishesCost * quantity).toLocaleString()} extra)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddToCartSubmit}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-icons text-base">add_shopping_cart</span>
              <span>Add Package to Order Tray (₱{finalPrice.toLocaleString()})</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  )
}
