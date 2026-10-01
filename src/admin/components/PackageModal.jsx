import React, { useState, useEffect } from 'react'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function PackageModal({
  isOpen,
  onClose,
  editingPackage = null,
  onSaveSuccess,
  passedCategories = null,
  passedMenuItems = null
}) {
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [menuCategories, setMenuCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])

  // Form Fields
  const [pkgName, setPkgName] = useState('')
  const [pkgDesc, setPkgDesc] = useState('')
  const [pkgImage, setPkgImage] = useState('')
  const [pkgPrice, setPkgPrice] = useState('15000')
  const [pkgMinGuests, setPkgMinGuests] = useState(30)
  const [pkgMaxGuests, setPkgMaxGuests] = useState(150)
  const [pkgExtraGuestFee, setPkgExtraGuestFee] = useState('')
  const [pkgPrepTime, setPkgPrepTime] = useState('3 Hours')
  const [pkgRecommendedFor, setPkgRecommendedFor] = useState('')

  // Dynamic Category Allowances State: { [category_slug_or_id]: number }
  const [categoryAllowances, setCategoryAllowances] = useState({})

  // Package Curated Specific Dishes State: Array of dish objects
  const [selectedPackageDishes, setSelectedPackageDishes] = useState([])
  const [packageMenuTab, setPackageMenuTab] = useState('allowances') // 'allowances' | 'dishes'
  const [dishSearchQuery, setDishSearchQuery] = useState('')
  const [dishCategoryFilter, setDishCategoryFilter] = useState('all')

  // Dynamic Custom Services / Inclusions List: string[]
  const [customServices, setCustomServices] = useState([])
  const [newServiceInput, setNewServiceInput] = useState('')

  // Helper to resolve food thumbnail images for categories
  const getCategoryImg = (catKey) => {
    const keyStr = String(catKey || '').toLowerCase()
    const matchingItem = menuItems.find(item => {
      const itemCat = String(item.category || item.category_slug || item.category_name || item.category_id || '').toLowerCase()
      return item.image && (itemCat === keyStr || keyStr.includes(itemCat) || itemCat.includes(keyStr))
    })
    if (matchingItem?.image) return matchingItem.image

    if (keyStr.includes('pork') || keyStr.includes('lechon') || keyStr.includes('sisig') || keyStr.includes('bbq')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('chicken') || keyStr.includes('inasal') || keyStr.includes('wings') || keyStr.includes('fried')) {
      return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('beef') || keyStr.includes('steak') || keyStr.includes('caldereta') || keyStr.includes('bulalo')) {
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('seafood') || keyStr.includes('fish') || keyStr.includes('shrimp') || keyStr.includes('tuna') || keyStr.includes('squid')) {
      return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('dessert') || keyStr.includes('cake') || keyStr.includes('sweet') || keyStr.includes('flan') || keyStr.includes('pastr')) {
      return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('drink') || keyStr.includes('beverage') || keyStr.includes('juice') || keyStr.includes('tea')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('sizzler') || keyStr.includes('sizzle') || keyStr.includes('tray') || keyStr.includes('platter')) {
      return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('pasta') || keyStr.includes('noodle') || keyStr.includes('spaghetti') || keyStr.includes('bihon')) {
      return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('salad') || keyStr.includes('vegetable') || keyStr.includes('appetizer') || keyStr.includes('soup')) {
      return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=150&auto=format&fit=crop&q=80'
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'
  }

  // Load Categories & Items when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (passedCategories && passedCategories.length > 0) {
      setMenuCategories(passedCategories.filter(c => c.id !== 'all' && c.id !== 'featured'))
    } else {
      api.menu.getCategories().then(res => {
        if (res.status === 'success' && Array.isArray(res.categories)) {
          setMenuCategories(res.categories.filter(c => c.id !== 'all' && c.id !== 'featured'))
        }
      }).catch(console.warn)
    }

    if (passedMenuItems && passedMenuItems.length > 0) {
      setMenuItems(passedMenuItems)
    } else {
      api.menu.getMenuItems().then(res => {
        if (res.status === 'success' && Array.isArray(res.items)) {
          setMenuItems(res.items)
        }
      }).catch(console.warn)
    }
  }, [isOpen, passedCategories, passedMenuItems])

  // Initialize or Reset form on open / change
  useEffect(() => {
    if (!isOpen) return

    if (editingPackage) {
      setPkgName(editingPackage.package_name || '')
      setPkgDesc(editingPackage.description || '')
      setPkgImage(editingPackage.package_image || '')
      setPkgPrice(String(editingPackage.package_price || editingPackage.price_per_person || 15000))
      setPkgMinGuests(editingPackage.min_guests || 30)
      setPkgMaxGuests(editingPackage.max_guests || 150)
      setPkgExtraGuestFee(editingPackage.extra_guest_fee && Number(editingPackage.extra_guest_fee) > 0 ? String(editingPackage.extra_guest_fee) : '')
      setPkgPrepTime(editingPackage.prep_time || '24 Hours Advance Notice')
      setPkgRecommendedFor(editingPackage.recommended_for || '')

      let loadedAllowances = {}
      if (editingPackage.category_allowances && typeof editingPackage.category_allowances === 'object') {
        Object.entries(editingPackage.category_allowances).forEach(([k, v]) => {
          if (Number(v) > 0) loadedAllowances[k] = Number(v)
        })
      }
      setCategoryAllowances(loadedAllowances)

      let loadedDishes = []
      if (Array.isArray(editingPackage.package_dishes)) {
        loadedDishes = [...editingPackage.package_dishes]
      }
      setSelectedPackageDishes(loadedDishes)

      let feats = []
      if (Array.isArray(editingPackage.features)) {
        feats = [...editingPackage.features]
      } else if (typeof editingPackage.features === 'string') {
        try {
          const parsed = JSON.parse(editingPackage.features)
          if (Array.isArray(parsed)) feats = parsed
        } catch {
          feats = editingPackage.features.split(',').map(s => s.trim()).filter(Boolean)
        }
      }
      setCustomServices(feats)
    } else {
      setPkgName('')
      setPkgDesc('')
      setPkgImage('')
      setPkgPrice('15000')
      setPkgMinGuests(30)
      setPkgMaxGuests(150)
      setPkgExtraGuestFee('')
      setPkgPrepTime('24 Hours Advance Notice')
      setPkgRecommendedFor('')
      setCategoryAllowances({})
      setSelectedPackageDishes([])
      setCustomServices([])
      setNewServiceInput('')
    }
    setPackageMenuTab('allowances')
    setDishSearchQuery('')
    setDishCategoryFilter('all')
  }, [isOpen, editingPackage])

  if (!isOpen) return null

  // Category Allowance handlers
  const handleToggleCategory = (catKey) => {
    setCategoryAllowances(prev => {
      const copy = { ...prev }
      if (copy[catKey] && copy[catKey] > 0) {
        delete copy[catKey]
      } else {
        copy[catKey] = 1
      }
      return copy
    })
  }

  const handleSetCategoryQty = (catKey, value) => {
    const val = Math.max(1, parseInt(value, 10) || 1)
    setCategoryAllowances(prev => ({
      ...prev,
      [catKey]: val
    }))
  }

  const handleRemoveCategory = (catKey) => {
    setCategoryAllowances(prev => {
      const copy = { ...prev }
      delete copy[catKey]
      return copy
    })
  }

  // Dish Selection Handlers
  const handleTogglePackageDish = (dish) => {
    const dishId = dish.item_id || dish.id || dish.dish_id
    setSelectedPackageDishes(prev => {
      const exists = prev.some(d => (d.item_id || d.id || d.dish_id) === dishId)
      if (exists) {
        return prev.filter(d => (d.item_id || d.id || d.dish_id) !== dishId)
      } else {
        return [...prev, {
          item_id: dishId,
          dish_id: dishId,
          name: dish.name || dish.dish_name,
          category: dish.category || dish.category_name || 'General',
          price: dish.price || 0,
          image: dish.image || ''
        }]
      }
    })
  }

  // Custom Service handlers
  const handleAddCustomService = () => {
    const trimmed = newServiceInput.trim()
    if (!trimmed) return
    if (customServices.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('This service is already in the list.', 'info')
      return
    }
    setCustomServices(prev => [...prev, trimmed])
    setNewServiceInput('')
  }

  const handleRemoveCustomService = (indexToRemove) => {
    setCustomServices(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // Image Upload handler
  const handleFileUpload = (e, setImageState) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 600
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
          const compressed = canvas.toDataURL('image/jpeg', 0.6)
          setImageState(compressed)
          showToast('Photo uploaded successfully!', 'success')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // Save Submit
  const handleSavePackageSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const dynamicCategoryFeatures = []
    let totalMainCount = 0
    let totalSideCount = 0
    let totalDessertCount = 0
    let totalBeverageCount = 0

    menuCategories.forEach(cat => {
      const key = cat.id || cat.category_id || cat.label
      const count = categoryAllowances[key] || 0
      if (count > 0) {
        const label = cat.label || cat.category_name || cat.id
        dynamicCategoryFeatures.push(`${count} ${label}`)

        const lower = label.toLowerCase()
        if (lower.includes('side') || lower.includes('veg') || lower.includes('pasta') || lower.includes('salad')) {
          totalSideCount += count
        } else if (lower.includes('dessert')) {
          totalDessertCount += count
        } else if (lower.includes('drink') || lower.includes('beverage')) {
          totalBeverageCount += count
        } else {
          totalMainCount += count
        }
      }
    })

    const rawPrice = Number(pkgPrice) || 0
    const minGuests = Number(pkgMinGuests) || 30
    const payload = {
      package_name: pkgName,
      description: pkgDesc,
      package_image: pkgImage,
      package_price: rawPrice,
      price_per_person: Math.round(rawPrice / minGuests),
      min_guests: minGuests,
      max_guests: Number(pkgMaxGuests) || 150,
      extra_guest_fee: pkgExtraGuestFee !== '' ? parseFloat(pkgExtraGuestFee) : 0,
      prep_time: pkgPrepTime,
      main_dishes_count: totalMainCount || 2,
      side_dishes_count: totalSideCount || 1,
      dessert_count: totalDessertCount || 1,
      beverage_count: totalBeverageCount || 1,
      category_allowances: categoryAllowances,
      package_dishes: selectedPackageDishes,
      has_rice: customServices.some(s => s.toLowerCase().includes('rice')) ? 1 : 0,
      has_buffet_setup: customServices.some(s => s.toLowerCase().includes('buffet')) ? 1 : 0,
      has_table_setup: customServices.some(s => s.toLowerCase().includes('table')) ? 1 : 0,
      has_staff: customServices.some(s => s.toLowerCase().includes('staff') || s.toLowerCase().includes('waiter')) ? 1 : 0,
      has_decorations: customServices.some(s => s.toLowerCase().includes('decor')) ? 1 : 0,
      recommended_for: pkgRecommendedFor,
      features: customServices,
      status: 'Available'
    }

    try {
      if (editingPackage) {
        const data = await api.catering.updatePackage(editingPackage.package_id, payload)
        if (data.status === 'success') {
          showToast(`Updated package "${pkgName}"!`, 'success')
          onSaveSuccess?.(data)
          onClose()
        } else {
          showToast(data.message || 'Error updating package', 'error')
        }
      } else {
        const data = await api.catering.createPackage(payload)
        if (data.status === 'success') {
          showToast(`Created new package menu "${pkgName}"!`, 'success')
          onSaveSuccess?.(data)
          onClose()
        } else {
          showToast(data.message || 'Error creating package', 'error')
        }
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const includedCategoryKeys = Object.keys(categoryAllowances).filter(k => (categoryAllowances[k] || 0) > 0)

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = !dishSearchQuery ||
      (item.name || '').toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(dishSearchQuery.toLowerCase())
    const matchesCat = dishCategoryFilter === 'all' || item.category === dishCategoryFilter
    return matchesSearch && matchesCat
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] my-auto text-[#071A3D]">

        {/* Modal Header */}
        <header className="bg-white border-b border-gray-300 p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-base">bento</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-black text-[#071A3D] tracking-tight truncate">
                {editingPackage ? 'Edit Catering Package Menu' : 'Create Package Menu for Customers'}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                Configure package rates, guest capacity, category dish allowances, and custom included services
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
        <form onSubmit={handleSavePackageSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/50">

          {/* SECTION 1: TOP ROW (General Info & Media VS Pricing & Capacity) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* CARD 1: PACKAGE GENERAL INFO & MEDIA (6 Cols) */}
            <div className="lg:col-span-6 space-y-3.5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                  <span className="material-icons text-xs text-[#C8102E]">inventory_2</span>
                  <span>Package Overview & Media</span>
                </h4>
                <span className="text-[10px] font-bold text-gray-400">Core Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Classic Banquet Package"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Recommended For</label>
                  <input
                    type="text"
                    placeholder="e.g., Birthdays & family events"
                    value={pkgRecommendedFor}
                    onChange={(e) => setPkgRecommendedFor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Description</label>
                <textarea
                  rows="2"
                  placeholder="Short description of what makes this catering tier special..."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition resize-none"
                />
              </div>

              {/* Compact Image Upload & URL */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Banner Image</label>
                <div className="flex gap-3 items-center">
                  {pkgImage ? (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-900 shrink-0 relative group">
                      <img src={pkgImage} alt="Package Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPkgImage('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs cursor-pointer"
                        title="Remove Image"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center shrink-0 text-gray-400">
                      <span className="material-icons text-base text-gray-400">image</span>
                      <span className="text-[9px] font-bold">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition shrink-0">
                        <span className="material-icons text-xs text-[#C8102E]">file_upload</span>
                        <span>{pkgImage ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setPkgImage)}
                          className="hidden"
                        />
                      </label>
                      {pkgImage && (
                        <button
                          type="button"
                          onClick={() => setPkgImage('')}
                          className="text-red-600 hover:underline font-bold text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={pkgImage}
                      onChange={(e) => setPkgImage(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-md bg-gray-50 border border-gray-300 font-medium text-[10px] text-gray-800 focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PRICING & CAPACITY STRUCTURE (6 Cols) */}
            <div className="lg:col-span-6 space-y-3.5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                  <span className="material-icons text-xs text-[#C8102E]">payments</span>
                  <span>Pricing & Guest Capacity</span>
                </h4>
                <span className="text-[10px] font-bold text-gray-400">Rates & Limits</span>
              </div>

              {/* Pricing Inputs Grid (Side-by-Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Base Package Price (₱) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500 text-xs">₱</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="15000"
                      value={pkgPrice}
                      onChange={(e) => setPkgPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-black text-xs text-[#C8102E] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[9.5px] text-gray-400 mt-0.5 block">Flat base package price</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Fee Per Extra Guest (₱ / Person)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500 text-xs">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="None (leave blank if no extra fee)"
                      value={pkgExtraGuestFee}
                      onChange={(e) => setPkgExtraGuestFee(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[9.5px] text-gray-400 mt-0.5 block">For guests exceeding max capacity</span>
                </div>
              </div>

              {/* Capacity & Advance Notice Configuration */}
              <div className="space-y-3">
                {/* Capacity Grid (2 Columns) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Min Guests *</label>
                    <input
                      type="number"
                      required
                      min="5"
                      value={pkgMinGuests}
                      onChange={(e) => setPkgMinGuests(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Max Included *</label>
                    <input
                      type="number"
                      required
                      min="5"
                      value={pkgMaxGuests}
                      onChange={(e) => setPkgMaxGuests(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition text-center"
                    />
                  </div>
                </div>

                {/* Advance Notice Field */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[10px] flex items-center justify-between">
                    <span>Advance Order Notice (Kitchen Lead Time)</span>
                    <span className="text-[9px] text-gray-400 font-normal">e.g. 24 Hours, 2 Days</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xs">notifications_active</span>
                    <input
                      type="text"
                      placeholder="e.g. 24 Hours Advance Notice"
                      value={pkgPrepTime}
                      onChange={(e) => setPkgPrepTime(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">
                    Advance booking notice required for kitchen prep (not dining event duration).
                  </span>
                </div>
              </div>

              {/* Live Capacity & Pricing Snapshot Pill */}
              <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <span className="material-icons text-xs text-amber-700">info</span>
                  <span>Included: {pkgMinGuests || 20}–{pkgMaxGuests || 50} Guests</span>
                </div>
                <span className="font-extrabold text-[#C8102E] font-mono">
                  ₱{Number(pkgPrice || 0).toLocaleString()}
                  {pkgExtraGuestFee && Number(pkgExtraGuestFee) > 0 ? ` (+₱${Number(pkgExtraGuestFee).toLocaleString()}/extra pax)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: BOTTOM ROW (Dish Allowances & Custom Included Services) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* CARD 3: PACKAGE MENU & DISH ALLOWANCES (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-gray-300 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold">
                    <span className="material-icons text-base">restaurant_menu</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#071A3D] uppercase tracking-wide">
                      Package Menu Configuration
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Set category dish allowances or curate specific included menu dishes
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs Switcher */}
                <div className="flex items-center p-0.5 rounded-lg bg-gray-100 border border-gray-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPackageMenuTab('allowances')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      packageMenuTab === 'allowances'
                        ? 'bg-white text-[#C8102E] shadow-2xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span className="material-icons text-xs">tune</span>
                    <span>Category Allowances</span>
                    {includedCategoryKeys.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-red-100 text-[#C8102E] rounded-full text-[9px] font-black">
                        {includedCategoryKeys.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPackageMenuTab('dishes')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      packageMenuTab === 'dishes'
                        ? 'bg-white text-[#C8102E] shadow-2xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span className="material-icons text-xs">lunch_dining</span>
                    <span>Curate Dishes</span>
                    {selectedPackageDishes.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black">
                        {selectedPackageDishes.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* TAB 1: CATEGORY DISH ALLOWANCES */}
              {packageMenuTab === 'allowances' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Category Toggle Chips */}
                  <div className="space-y-2">
                    <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                      Included Food Categories (Click to toggle):
                    </span>
                    {menuCategories.length === 0 ? (
                      <div className="text-xs text-gray-400 italic py-1">
                        No menu categories available. Please configure categories in Menu Management.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {menuCategories.map((cat) => {
                          const key = cat.id || cat.category_id || cat.label
                          const label = cat.label || cat.category_name || cat.id
                          const isIncluded = (categoryAllowances[key] || 0) > 0

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleToggleCategory(key)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isIncluded
                                  ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 font-extrabold shadow-xs'
                                  : 'bg-white text-slate-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <img
                                src={getCategoryImg(key)}
                                alt={label}
                                className="w-4 h-4 rounded-full object-cover shrink-0 border border-gray-300 shadow-2xs"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                              <span>{label}</span>
                              <span className={`text-xs font-black ${isIncluded ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {isIncluded ? '✓' : '+'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Categories Quantities Grid */}
                  {includedCategoryKeys.length === 0 ? (
                    <div className="py-4 px-4 text-center text-gray-400 text-xs italic font-medium bg-[#FAFAFA] rounded-xl border border-dashed border-gray-300">
                      No categories selected. Click the category badges above to include dish allowances.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {includedCategoryKeys.map((catKey) => {
                        const foundCat = menuCategories.find(c => (c.id === catKey || c.category_id === Number(catKey) || c.label === catKey))
                        const label = foundCat?.label || foundCat?.category_name || catKey.replace(/_/g, ' ')
                        const currentQty = categoryAllowances[catKey] || 1

                        return (
                          <div key={catKey} className="p-2 rounded-xl bg-gray-50 border border-gray-300 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={getCategoryImg(catKey)}
                                alt={label}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-300 shadow-2xs"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                              <div className="min-w-0">
                                <label className="block text-[#071A3D] font-bold text-xs truncate capitalize leading-tight" title={label}>
                                  {label}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCategory(catKey)}
                                  className="text-gray-400 hover:text-red-600 text-[10px] font-semibold transition cursor-pointer leading-none mt-0.5 block"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={currentQty}
                                onChange={(e) => handleSetCategoryQty(catKey, e.target.value)}
                                className="w-11 py-1 px-1 rounded-lg border border-gray-300 font-extrabold text-xs text-center bg-white text-[#071A3D] shadow-2xs focus:outline-none focus:border-[#C8102E]"
                              />
                              <span className="text-[9.5px] text-gray-400 font-bold">qty</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CURATE SPECIFIC DISHES */}
              {packageMenuTab === 'dishes' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Search & Category Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search dishes by name or keywords..."
                        value={dishSearchQuery}
                        onChange={(e) => setDishSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-semibold text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                      />
                      {dishSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setDishSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      value={dishCategoryFilter}
                      onChange={(e) => setDishCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {menuCategories.map((c) => {
                        const val = c.id || c.category_id || c.label
                        const lbl = c.label || c.category_name || val
                        return (
                          <option key={val} value={val}>
                            {lbl}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Selected Dishes Tray */}
                  <div className="space-y-1 bg-gray-50/80 p-2.5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                        <span className="material-icons text-xs text-emerald-600">check_circle</span>
                        <span>Included in Package ({selectedPackageDishes.length} dishes):</span>
                      </span>
                      {selectedPackageDishes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPackageDishes([])}
                          className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {selectedPackageDishes.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic py-1">
                        No specific dishes added yet. Click dishes below to include them in this package.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                        {selectedPackageDishes.map((dish) => {
                          const dishId = dish.item_id || dish.id || dish.dish_id
                          return (
                            <div
                              key={dishId}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-[11px] font-bold shadow-2xs"
                            >
                              {dish.image && (
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-4 h-4 rounded-full object-cover shrink-0 border border-emerald-200"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <span className="truncate max-w-[130px]">{dish.name || dish.dish_name}</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePackageDish(dish)}
                                className="text-gray-400 hover:text-red-600 font-black ml-0.5 cursor-pointer text-xs"
                                title="Remove dish"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dishes Catalog Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                      Available Menu Catalog ({filteredMenuItems.length}):
                    </span>

                    {filteredMenuItems.length === 0 ? (
                      <div className="py-4 text-center text-gray-400 text-xs italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No menu items found matching "{dishSearchQuery}".
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {filteredMenuItems.map((item) => {
                          const itemId = item.item_id || item.id
                          const isSelected = selectedPackageDishes.some(d => (d.item_id || d.id || d.dish_id) === itemId)

                          return (
                            <div
                              key={itemId}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                                isSelected
                                  ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <img
                                  src={item.image || getCategoryImg(item.category)}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 shadow-2xs"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-extrabold text-xs text-[#071A3D] truncate leading-tight">
                                    {item.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 capitalize truncate">
                                      {item.category || 'General'}
                                    </span>
                                    <span className="text-[10px] font-black text-[#C8102E]">
                                      ₱{parseFloat(item.price || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleTogglePackageDish(item)}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer shrink-0 active:scale-95 shadow-2xs ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-gray-100 hover:bg-[#C8102E] text-gray-700 hover:text-white border border-gray-200'
                                }`}
                              >
                                {isSelected ? '✓ Included' : '+ Add'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: INCLUDED SERVICES & SETUP (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                  <span className="material-icons text-xs text-[#C8102E]">check_circle</span>
                  <span>Included Services & Setup</span>
                </h4>
                <span className="text-[10px] text-gray-400 font-bold">
                  Custom Inclusions
                </span>
              </div>

              {/* Input Field with Add Button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Buffet Table, Waiters..."
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomService()
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs font-semibold text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomService}
                  className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span className="material-icons text-xs">add</span>
                  <span>Add</span>
                </button>
              </div>

              {/* List of Added Services */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">
                  Current Inclusions ({customServices.length}):
                </span>

                {customServices.length === 0 ? (
                  <div className="py-3 px-3 text-center text-gray-400 text-[11px] italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No custom services added yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-0.5">
                    {customServices.map((service, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-950 text-[11px] font-bold shadow-2xs"
                      >
                        <span className="material-icons text-xs text-emerald-600">check</span>
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomService(index)}
                          className="text-gray-400 hover:text-red-600 font-bold ml-1 transition cursor-pointer text-xs"
                          title="Remove service"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[10.5px] text-gray-500">
                <p className="font-semibold text-gray-700 mb-0.5">💡 Quick Inclusions Examples:</p>
                <div className="flex flex-wrap gap-1">
                  {['Standard Buffet Table', 'Waitstaff & Servers', 'Free Flow Iced Tea', 'Complete Chafing Dishes', 'Sound & Lights'].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!customServices.includes(example)) {
                          setCustomServices(prev => [...prev, example])
                        }
                      }}
                      className="text-[9.5px] text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 cursor-pointer font-medium"
                    >
                      + {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer / Save Actions */}
          <footer className="bg-white border-t border-gray-300 p-3.5 sm:p-4 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 flex items-center justify-between gap-3 mt-4 shrink-0 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs border border-gray-300 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-icons text-sm">{editingPackage ? 'save' : 'add_task'}</span>
              <span>{isLoading ? 'Saving Package Menu...' : (editingPackage ? 'Save Package Changes' : 'Create Package Menu')}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
