import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from './ToastNotification'

// Category and occasion keywords for intelligent matching against Admin Menu Items
const OCCASION_MATCH_KEYWORDS = {
  'Birthday Celebration': ['spaghetti', 'pasta', 'chicken', 'fried', 'bbq', 'barbecue', 'lumpia', 'shanghai', 'cake', 'brownie', 'dessert', 'juice', 'tea', 'ice cream', 'sweet'],
  'Wedding / Gala': ['beef', 'roast', 'steak', 'kare-kare', 'seafood', 'prawn', 'shrimp', 'fish', 'fillet', 'carbonara', 'alfredo', 'gourmet', 'pastry', 'wine', 'punch', 'salad'],
  'Corporate Seminar': ['chicken', 'grilled', 'fish', 'lemon', 'butter', 'vegetable', 'salad', 'sandwich', 'snack', 'coffee', 'tea', 'fruit', 'soup', 'healthy'],
  'Family Reunion / Anniversary': ['lechon', 'caldereta', 'pancit', 'bihon', 'canton', 'lumpia', 'sisig', 'pork', 'halo-halo', 'flan', 'kare-kare', 'native'],
  'Debut / Milestone Party': ['pasta', 'alfredo', 'fettuccine', 'nacho', 'ham', 'chicken', 'mocktail', 'cocktail', 'cupcake', 'pastry', 'dessert', 'snack', 'glam'],
  'Casual Banquet Feasts': ['inasal', 'sisig', 'pork', 'chicken', 'bihon', 'leche flan', 'bbq', 'crispy', 'diner', 'rice', 'calamansi']
}

// Default fallback themes if DB is still loading or has minimal entries
const DEFAULT_FALLBACK_THEMES = {
  'Birthday Celebration': {
    badge: '🎂 Top Pick for Birthdays & Celebrations',
    description: 'Festive crowd-pleasers featuring sweet-style pasta, savory skewers, and crispy specialties beloved by guests of all ages.',
    avgPerHead: 480
  },
  'Wedding / Gala': {
    badge: '💍 Elegant Banquet Selections',
    description: 'Sophisticated gourmet courses with carving stations, fresh seafood medleys, and rich banqueting entrees tailored for formal receptions.',
    avgPerHead: 780
  },
  'Corporate Seminar': {
    badge: '💼 Professional Meeting & Workshop Catering',
    description: 'Energizing corporate buffet selections with balanced proteins, fresh crisp greens, and continuous brewed artisan coffee stations.',
    avgPerHead: 520
  },
  'Family Reunion / Anniversary': {
    badge: '🎉 Heritage Pinoy Salo-Salo Feast',
    description: 'Abundant native Filipino favorites designed for sharing, nostalgia, and celebratory family gatherings.',
    avgPerHead: 550
  },
  'Debut / Milestone Party': {
    badge: '✨ Glamour Banquet & Mocktail Bar',
    description: 'Chic, picture-perfect courses tailored for 18th debuts, milestone celebrations, and evening banquets.',
    avgPerHead: 650
  },
  'Casual Banquet Feasts': {
    badge: '🍗 All-Time Diner Favorites Buffet',
    description: 'Hearty, affordable banquet set featuring bestselling grilled and fried specialties for community & family get-togethers.',
    avgPerHead: 420
  }
}

// Fallback high quality food photography if an admin item has no photo
const CATEGORY_DEFAULT_IMAGES = {
  pork: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  chicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  beef: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
  seafood: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  dessert: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
  beverage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  appetizer: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80'
}

function getItemImage(item) {
  if (item?.image && item.image.trim() !== '') return item.image
  const cat = (item?.category || item?.category_name || '').toLowerCase()
  for (const key of Object.keys(CATEGORY_DEFAULT_IMAGES)) {
    if (cat.includes(key)) return CATEGORY_DEFAULT_IMAGES[key]
  }
  return CATEGORY_DEFAULT_IMAGES.default
}

function getPackageImage(pkg, index = 0) {
  if (pkg?.package_image && pkg.package_image.trim() !== '') return pkg.package_image
  const fallbacks = [
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519225424564-96cf4dfda158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80'
  ]
  return fallbacks[index % fallbacks.length]
}

function EventBasedMenuRecommendation({
  eventType = 'Birthday Celebration',
  guestCount = 30,
  budget = 20000,
  onSelectPackage,
  onAddDish,
  compact = false,
  allowCategorySwitch = true,
  showHeader = true
}) {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState(eventType)
  const [internalPax, setInternalPax] = useState(guestCount || 30)
  
  // Real Admin Menu & Catering Packages State from Database
  const [adminMenuItems, setAdminMenuItems] = useState([])
  const [adminPackages, setAdminPackages] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Recommended')
  const [selectedDishesList, setSelectedDishesList] = useState([])

  // Keep in sync if parent changes eventType or guestCount
  useEffect(() => {
    if (eventType) {
      setActiveCategory(eventType)
    }
  }, [eventType])

  useEffect(() => {
    if (guestCount) {
      setInternalPax(guestCount)
    }
  }, [guestCount])

  // Fetch live Admin Menu and Catering Packages from DB
  useEffect(() => {
    let isMounted = true
    async function fetchAdminMenuData() {
      try {
        setIsLoadingData(true)
        const [menuRes, pkgRes] = await Promise.all([
          api.menu.getMenuItems().catch(() => ({ items: [] })),
          api.catering.getPackages().catch(() => ({ packages: [] }))
        ])

        if (!isMounted) return

        if (menuRes?.items && Array.isArray(menuRes.items)) {
          setAdminMenuItems(menuRes.items.filter(it => it.availability !== 'Unavailable' && it.status !== 'Inactive'))
        }
        if (pkgRes?.packages && Array.isArray(pkgRes.packages)) {
          setAdminPackages(pkgRes.packages.filter(p => p.status !== 'Inactive'))
        }
      } catch (err) {
        console.error('Failed to load admin menu data for recommendations:', err)
      } finally {
        if (isMounted) setIsLoadingData(false)
      }
    }

    fetchAdminMenuData()
    return () => { isMounted = false }
  }, [])

  // Resolve occasion theme meta
  const currentThemeMeta = useMemo(() => {
    const norm = (activeCategory || '').toLowerCase()
    if (norm.includes('wedding') || norm.includes('gala')) return DEFAULT_FALLBACK_THEMES['Wedding / Gala']
    if (norm.includes('corp') || norm.includes('seminar') || norm.includes('workshop') || norm.includes('meeting')) return DEFAULT_FALLBACK_THEMES['Corporate Seminar']
    if (norm.includes('reunion') || norm.includes('anniversary') || norm.includes('family')) return DEFAULT_FALLBACK_THEMES['Family Reunion / Anniversary']
    if (norm.includes('debut') || norm.includes('prom') || norm.includes('milestone')) return DEFAULT_FALLBACK_THEMES['Debut / Milestone Party']
    if (norm.includes('casual') || norm.includes('diner') || norm.includes('party')) return DEFAULT_FALLBACK_THEMES['Casual Banquet Feasts']
    return DEFAULT_FALLBACK_THEMES['Birthday Celebration'] || Object.values(DEFAULT_FALLBACK_THEMES)[0]
  }, [activeCategory])

  // Dynamically Match & Filter Admin Packages for the selected occasion
  const recommendedPackages = useMemo(() => {
    const normCat = (activeCategory || '').toLowerCase()
    
    if (adminPackages.length > 0) {
      // Prioritize packages matching recommended_for or name
      const matched = adminPackages.filter(pkg => {
        const rec = (pkg.recommended_for || '').toLowerCase()
        const name = (pkg.package_name || '').toLowerCase()
        const desc = (pkg.description || '').toLowerCase()
        
        if (normCat.includes('wedding') && (rec.includes('wedding') || name.includes('wedding') || desc.includes('wedding') || rec.includes('large'))) return true
        if (normCat.includes('birthday') && (rec.includes('birthday') || name.includes('birthday') || rec.includes('celebration') || desc.includes('birthday'))) return true
        if (normCat.includes('corp') && (rec.includes('corp') || rec.includes('meeting') || name.includes('corp') || name.includes('executive'))) return true
        if (normCat.includes('reunion') && (rec.includes('reunion') || rec.includes('family') || rec.includes('gathering'))) return true
        if (normCat.includes('debut') && (rec.includes('debut') || rec.includes('milestone') || name.includes('debut') || rec.includes('prom'))) return true
        return false
      })

      // If matched packages exist, use them, otherwise return all active admin packages
      const listToUse = matched.length > 0 ? matched : adminPackages

      return listToUse.map((pkg, idx) => {
        const pricePerHead = pkg.price_per_person || (pkg.package_price ? Math.round(pkg.package_price / (pkg.min_guests || 30)) : 500)
        
        // Build readable feature inclusions from features or allowances
        let includes = []
        if (Array.isArray(pkg.features) && pkg.features.length > 0) {
          includes = pkg.features
        } else if (pkg.category_allowances && Object.keys(pkg.category_allowances).length > 0) {
          includes = Object.entries(pkg.category_allowances).map(([cat, qty]) => `${qty} ${cat.charAt(0).toUpperCase() + cat.slice(1)} Dish${qty > 1 ? 'es' : ''}`)
          includes.push('Steamed Rice Included', 'Buffet Table & Staff Setup')
        } else {
          includes = ['Buffet Table & Food Warmers Setup', 'Complete Utensils & Glassware', 'Uniformed Catering Service Staff', 'Steamed Rice & Bottomless Beverage']
        }

        return {
          id: pkg.package_id || pkg.id || `pkg-${idx}`,
          rawPackageId: pkg.package_id,
          name: pkg.package_name,
          image: getPackageImage(pkg, idx),
          pricePerHead: pricePerHead,
          minGuests: pkg.min_guests || 20,
          maxGuests: pkg.max_guests || 150,
          description: pkg.description || '',
          includes: includes,
          isPopular: idx === 0 || pkg.is_featured || false,
          isFromAdmin: true
        }
      })
    }

    // High quality presets fallback if no packages created yet by admin
    return [
      {
        id: 'pkg-preset-classic',
        name: `Classic ${activeCategory} Feast`,
        image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        pricePerHead: currentThemeMeta.avgPerHead || 480,
        minGuests: 25,
        maxGuests: 100,
        description: 'Complete banquet set designed for gatherings and celebrations.',
        includes: ['Signature Main Courses (Pork & Chicken)', 'Pasta / Noodle Platter', 'Appetizers & Lumpiang Shanghai', 'Special Dessert Tray', 'Bottomless House Beverage', 'Complete Buffet Setup & Staff'],
        isPopular: true,
        isFromAdmin: false
      }
    ]
  }, [adminPackages, activeCategory, currentThemeMeta])

  const [selectedPkg, setSelectedPkg] = useState(recommendedPackages[0] || null)

  useEffect(() => {
    if (recommendedPackages.length > 0) {
      setSelectedPkg(recommendedPackages[0])
    }
  }, [recommendedPackages])

  // Extract Distinct Categories from Live Admin Menu
  const availableCategories = useMemo(() => {
    const cats = new Set(['Recommended', 'All Dishes'])
    adminMenuItems.forEach(item => {
      const catLabel = item.category_name || item.category
      if (catLabel) cats.add(catLabel.charAt(0).toUpperCase() + catLabel.slice(1))
    })
    return Array.from(cats)
  }, [adminMenuItems])

  // Dynamically Filter & Recommend Real Admin Menu Dishes for the Event
  const recommendedDishes = useMemo(() => {
    if (adminMenuItems.length === 0) {
      // High-quality fallback dishes if database is empty
      return [
        { id: 'fb-1', name: 'Classic Sweet Spaghetti Platter', image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80', category: 'Pasta', tag: 'Must-Have', price: 1200, serves: '15-20 Pax' },
        { id: 'fb-2', name: 'Crispy Garlic Fried Chicken Tray', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', category: 'Mains', tag: 'Bestseller', price: 1450, serves: '15-20 Pax' },
        { id: 'fb-3', name: 'Pork BBQ Skewers (50 pcs)', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', category: 'Appetizers', tag: 'Party Favorite', price: 1750, serves: '25-30 Pax' },
        { id: 'fb-4', name: 'Creamy Buko Pandan Salad Tray', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', category: 'Dessert', tag: 'Refreshing', price: 850, serves: '15-20 Pax' }
      ]
    }

    const keywords = OCCASION_MATCH_KEYWORDS[activeCategory] || OCCASION_MATCH_KEYWORDS['Birthday Celebration']
    
    // Filter by search query if any
    let filtered = adminMenuItems
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(it => 
        (it.name || '').toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q) ||
        (it.category_name || it.category || '').toLowerCase().includes(q)
      )
    }

    // Filter by category tab
    if (selectedFilterCategory !== 'Recommended' && selectedFilterCategory !== 'All Dishes') {
      filtered = filtered.filter(it => {
        const cat = (it.category_name || it.category || '').toLowerCase()
        return cat.includes(selectedFilterCategory.toLowerCase())
      })
    }

    // If 'Recommended' mode, score dishes based on event occasion relevance & featured flag
    if (selectedFilterCategory === 'Recommended' && searchQuery.trim() === '') {
      const scored = filtered.map(item => {
        let score = 0
        const nameLow = (item.name || '').toLowerCase()
        const catLow = (item.category_name || item.category || '').toLowerCase()
        const descLow = (item.description || '').toLowerCase()

        if (item.is_featured) score += 5
        keywords.forEach(kw => {
          if (nameLow.includes(kw)) score += 4
          if (catLow.includes(kw)) score += 3
          if (descLow.includes(kw)) score += 1
        })

        return { item, score }
      })

      scored.sort((a, b) => b.score - a.score)
      filtered = scored.slice(0, 8).map(s => s.item)
    }

    return filtered.map(item => {
      const cat = item.category_name || item.category || 'Mains'
      let tag = item.is_featured ? '⭐ Chef Pick' : 'Popular'
      const nameLow = (item.name || '').toLowerCase()
      if (nameLow.includes('lechon') || nameLow.includes('beef') || nameLow.includes('seafood')) tag = 'Signature'
      if (nameLow.includes('bbq') || nameLow.includes('lumpia') || nameLow.includes('spaghetti')) tag = 'Party Hit'

      return {
        id: item.id || item.item_id,
        name: item.name,
        image: getItemImage(item),
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        tag: tag,
        price: parseFloat(item.price || 0),
        serves: item.serving_size || '10-15 Pax',
        description: item.description,
        isFromAdmin: true
      }
    })
  }, [adminMenuItems, activeCategory, searchQuery, selectedFilterCategory])

  const effectivePax = Math.max(1, parseInt(internalPax, 10) || 30)

  const handleApplyPackage = (pkg) => {
    setSelectedPkg(pkg)
    const pkgTotal = pkg.pricePerHead * Math.max(effectivePax, pkg.minGuests)
    const packageData = {
      ...pkg,
      eventType: activeCategory,
      guestCount: effectivePax,
      totalAmount: pkgTotal,
      inclusionsText: (pkg.includes || []).join(', '),
      selectedAddonDishes: selectedDishesList
    }

    if (onSelectPackage) {
      onSelectPackage(packageData)
    } else {
      showToast(`Selected "${pkg.name}" based on Admin Menu for your ${activeCategory}!`, 'success')
      navigate(`/catering?package=${encodeURIComponent(pkg.name)}&guests=${effectivePax}`)
    }
  }

  const handleToggleDishSelect = (dish) => {
    const exists = selectedDishesList.find(d => d.id === dish.id)
    let updated = []
    if (exists) {
      updated = selectedDishesList.filter(d => d.id !== dish.id)
      showToast(`Removed "${dish.name}" from event menu`, 'info')
    } else {
      updated = [...selectedDishesList, dish]
      showToast(`Added "${dish.name}" to event selection!`, 'success')
    }
    setSelectedDishesList(updated)
    if (onAddDish) onAddDish(updated)
  }

  return (
    <div className="rounded-2xl border border-red-200 dark:border-slate-700 bg-gradient-to-br from-red-50/40 via-white to-amber-50/30 dark:from-[#0B132B] dark:via-[#071A3D] dark:to-slate-900 p-4 sm:p-5 shadow-xs space-y-4 text-slate-800 dark:text-slate-100">
      
      {/* Category Tabs / Switcher */}
      {allowCategorySwitch && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-black uppercase text-[#C8102E] tracking-wider block">
                ✨ Select Event Theme / Occasion:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin Menu Live ({adminMenuItems.length} Dishes, {adminPackages.length} Packages)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold ml-auto">
              <label className="text-gray-500 dark:text-gray-400">Guests:</label>
              <input
                type="number"
                min="1"
                value={internalPax}
                onChange={(e) => setInternalPax(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-center text-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(DEFAULT_FALLBACK_THEMES).map(catKey => {
              const isActive = activeCategory === catKey
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => {
                    setActiveCategory(catKey)
                    setSelectedFilterCategory('Recommended')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    isActive
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs font-black'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {catKey}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Header Banner */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-100 dark:border-slate-700">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C8102E] text-white shadow-2xs">
              <span className="material-icons text-xs">auto_awesome</span>
              <span>Event-Based Menu Recommendation (Admin Catalog)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-white mt-1">
              Curated Menu for {activeCategory || 'Your Special Event'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentThemeMeta.description}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Admin Catalog Rate</span>
            <span className="text-sm font-black text-[#C8102E] font-mono">
              ~₱{selectedPkg?.pricePerHead || currentThemeMeta.avgPerHead} <span className="text-[10px] font-sans text-slate-500">/ Pax</span>
            </span>
          </div>
        </div>
      )}

      {/* Loading state indicator if fetching */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
          <span className="material-icons text-sm animate-spin text-[#C8102E]">refresh</span>
          <span>Loading live Admin Menu and Banquet Packages...</span>
        </div>
      )}

      {/* Recommended Catering Packages Section (Direct from Admin database) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            Admin Catering Packages ({recommendedPackages.length} Available):
          </span>
          <span className="text-[10px] text-[#C8102E] font-bold">
            1-Click Apply to Reservation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedPackages.map(pkg => {
            const isSelected = selectedPkg?.id === pkg.id
            const pkgTotal = pkg.pricePerHead * Math.max(effectivePax, pkg.minGuests)

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${isSelected
                  ? 'border-[#C8102E] bg-red-50/40 dark:bg-red-950/20 ring-2 ring-[#C8102E]/30'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                }`}
                onClick={() => setSelectedPkg(pkg)}
              >
                {/* Package Cover Image Banner */}
                {pkg.image && (
                  <div className="relative h-44 sm:h-48 w-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 group">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
                    
                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      {pkg.isPopular && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider shadow-md">
                          ★ Most Popular Pick
                        </span>
                      )}
                      {pkg.isFromAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#071A3D]/80 backdrop-blur-xs text-white border border-white/20">
                          Admin Menu Package
                        </span>
                      )}
                    </div>

                    {/* Bottom Floating Title & Price over Image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2 text-white">
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-white leading-tight drop-shadow-md">
                          {pkg.name}
                        </h4>
                        <span className="text-[10px] text-gray-200 font-medium">Min. {pkg.minGuests} Guests (Capacity up to {pkg.maxGuests})</span>
                      </div>
                      <div className="text-right shrink-0 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 shadow-xs">
                        <span className="font-mono font-black text-sm sm:text-base text-red-400">
                          ₱{pkg.pricePerHead}
                        </span>
                        <span className="text-[9px] text-gray-300 block leading-none">/ guest</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Package Content & Included Courses */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Included Buffet Courses &amp; Setup:
                    </span>
                    <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-200 font-medium max-h-36 overflow-y-auto pr-1">
                      {pkg.includes.map((dish, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-icons text-sm text-emerald-500 shrink-0">check_circle</span>
                          <span className="truncate">{dish}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold font-mono">
                      Total ({effectivePax} Pax): <strong className="text-sm font-black text-[#C8102E]">₱{pkgTotal.toLocaleString()}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApplyPackage(pkg)
                      }}
                      className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-icons text-sm">restaurant_menu</span>
                      <span>Apply Menu</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggested Ala-Carte & Buffet Trays (Direct from Admin Menu Items) */}
      {!compact && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Recommended Admin Menu Dishes for {activeCategory}:
              </span>
              <span className="text-[10px] text-slate-400">
                Pulled directly from Admin Menu Catalog ({adminMenuItems.length} total active items)
              </span>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search admin dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 sm:w-44 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-md py-0.5">
                {availableCategories.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedFilterCategory === cat
                        ? 'bg-[#C8102E] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Dishes Summary Bar if any added */}
          {selectedDishesList.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold">
                <span className="material-icons text-sm text-emerald-600">check_circle</span>
                <span>{selectedDishesList.length} Extra Admin Dish(es) Selected: {selectedDishesList.map(d => d.name).join(', ')}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDishesList([])}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 underline hover:no-underline cursor-pointer shrink-0"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Dishes Grid */}
          {recommendedDishes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No dishes found matching your search. Try another category or keyword.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recommendedDishes.map((dish) => {
                const isSelected = selectedDishesList.some(d => d.id === dish.id)

                return (
                  <div
                    key={dish.id}
                    onClick={() => handleToggleDishSelect(dish)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 text-xs shadow-2xs overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400'
                    }`}
                  >
                    {/* Dish Photo */}
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = CATEGORY_DEFAULT_IMAGES.default
                        }}
                      />
                      <span className="absolute top-1.5 right-1.5 text-[8.5px] font-black uppercase text-amber-950 bg-amber-400/90 px-1.5 py-0.5 rounded shadow-2xs">
                        {dish.tag}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-md">
                          <span className="material-icons text-xs block">check</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        {dish.category}
                      </span>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight line-clamp-2 mt-0.5">
                        {dish.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-slate-100 dark:border-slate-700 font-semibold">
                      <span className="text-slate-400">{dish.serves}</span>
                      <span className="font-mono font-bold text-[#C8102E]">
                        ₱{dish.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleDishSelect(dish)
                      }}
                      className={`w-full py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#C8102E] hover:text-white'
                      }`}
                    >
                      <span className="material-icons text-xs">{isSelected ? 'check' : 'add'}</span>
                      <span>{isSelected ? 'Selected' : 'Select Dish'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EventBasedMenuRecommendation
export { DEFAULT_FALLBACK_THEMES as EVENT_MENU_RECOMMENDATIONS }


