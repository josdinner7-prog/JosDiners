import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// High-Fidelity Featured Dish Card Skeleton
function FeaturedDishSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shadow-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#0B1B36] flex flex-col justify-between animate-pulse">
      <div>
        {/* Photo Header Skeleton */}
        <div className="relative h-48 w-full bg-gray-200 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700">
          <div className="absolute top-2.5 left-2.5 w-16 h-5 bg-gray-300 dark:bg-slate-700 rounded-md"></div>
          <div className="absolute top-2.5 right-2.5 w-18 h-5 bg-gray-300 dark:bg-slate-700 rounded-md"></div>
        </div>

        {/* Body Content Skeleton */}
        <div className="p-4 space-y-2.5">
          {/* Chips Row Skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-16 h-5 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
            <div className="w-16 h-5 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
          </div>

          {/* Dish Name */}
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>

          {/* Dish Description */}
          <div className="space-y-1">
            <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
            <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Footer Price Skeleton */}
      <div className="p-4 pt-3 flex items-center justify-between border-t border-gray-300 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40">
        <div className="space-y-1">
          <div className="w-8 h-2 bg-gray-300 dark:bg-slate-700 rounded"></div>
          <div className="w-16 h-4 bg-gray-300 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="w-20 h-4 bg-gray-300 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  )
}

export default function FeaturedDishes({ isDarkMode, onViewMore, selectedCategory = 'all' }) {
  const navigate = useNavigate()
  const [featuredItems, setFeaturedItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFeaturedDishes()
  }, [])

  const formatPrepTime = (t) => {
    if (!t) return '20-25 mins'
    return String(t).replace(/minutes?/gi, 'mins').replace(/hours?/gi, 'hrs')
  }

  const fetchFeaturedDishes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const itemsData = await api.menu.getMenuItems()

      if (itemsData?.status === 'success' && Array.isArray(itemsData.items)) {
        const mapped = itemsData.items.map(item => ({
          id: item.id,
          category: item.category,
          category_name: item.category_name || item.category,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price || 0),
          prepTime: item.prep_time || '20-25 mins',
          servings: item.serving_size || '1-2 Pax',
          tag: item.availability === 'Available' ? 'AVAILABLE' : 'SOLD OUT',
          image: item.image,
          ingredients: item.ingredients,
          allergens: item.allergens,
          is_featured: Boolean(item.is_featured),
        }))
        setFeaturedItems(mapped)
      } else {
        setFeaturedItems([])
      }
    } catch (e) {
      console.error('Error fetching featured dishes:', e)
      setError('Unable to load featured dishes at this time.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and display strictly ONLY featured items (up to 8 dishes)
  const displayDishes = useMemo(() => {
    // 1. Strictly filter ONLY items marked as is_featured === true in the database
    let list = featuredItems.filter(item => Boolean(item.is_featured))

    // 2. If a specific category is selected from the CategorySelector on the homepage
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'featured') {
      const target = selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '')
      list = list.filter(item => {
        const cat = (item.category || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const catName = (item.category_name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        return cat === target || catName === target || cat.includes(target) || catName.includes(target)
      })
    }

    // 3. Sort: Available first, then by ID
    const sorted = list.slice().sort((a, b) => {
      const aAvail = a.tag === 'AVAILABLE' ? 1 : 0
      const bAvail = b.tag === 'AVAILABLE' ? 1 : 0
      if (aAvail !== bAvail) return bAvail - aAvail
      return a.id - b.id
    })

    // 4. Return at most 8 featured dishes
    return sorted.slice(0, 8)
  }, [featuredItems, selectedCategory])

  const handleDishClick = (item) => {
    navigate(`/dish/${item.id}`, { state: { item } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewAllMenu = () => {
    if (onViewMore) {
      onViewMore()
    } else {
      navigate('/menu')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <section id="menu-section" className={`py-8 sm:py-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-transparent text-white' : 'bg-transparent text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-icons text-[#C8102E] text-base">star</span>
              <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider">
                Chef's Recommendations
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
              Featured Dishes
            </h2>
            <p className={`text-xs sm:text-sm mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Freshly prepared with top quality ingredients by Jo's Diner kitchen team
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-bold px-3 py-1 rounded-md border ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-gray-300'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}>
              Showing {displayDishes.length} Items
            </span>

            <button
              onClick={handleViewAllMenu}
              className="inline-flex items-center gap-1 text-xs font-black text-[#C8102E] hover:text-[#9B0B21] transition group cursor-pointer"
            >
              <span className="group-hover:underline">View Full Menu</span>
              <span className="material-icons text-sm transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Error Alert State */}
        {error ? (
          <div className="py-12 text-center bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs">
            <div className="w-12 h-12 rounded-md bg-red-100 dark:bg-red-950/60 text-[#C8102E] flex items-center justify-center mx-auto mb-3">
              <span className="material-icons text-2xl">error_outline</span>
            </div>
            <p className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 mb-3">{error}</p>
            <button
              onClick={fetchFeaturedDishes}
              className="px-4 py-2 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-md font-black text-xs shadow-xs transition cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : isLoading ? (
          /* High-Fidelity Loading Skeleton Grid (4-Column Layout) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <FeaturedDishSkeleton key={n} />
            ))}
          </div>
        ) : displayDishes.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs">
            <div className="w-14 h-14 rounded-md bg-red-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-[#C8102E]">
              <span className="material-icons text-3xl">restaurant_menu</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-slate-100">No Featured Dishes Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Please check back soon or browse our complete food catalog.
            </p>
          </div>
        ) : (
          /* Grid of Real Database Food Cards (4-Column Layout) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayDishes.map((item) => {
              const hasImage = Boolean(item.image && item.image.trim() !== '')

              return (
                <div
                  key={item.id}
                  onClick={() => handleDishClick(item)}
                  className={`group rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 border cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#0B1B36] border-slate-700 hover:border-slate-600'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div>
                    {/* Image Banner with Fallback Box */}
                    <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 flex items-center justify-center">
                      {hasImage ? (
                        <>
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div style={{ display: 'none' }} className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-400">
                            <span className="material-icons text-3xl opacity-50">image_not_supported</span>
                            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-60">No Image Available</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-400">
                          <span className="material-icons text-3xl opacity-50">image_not_supported</span>
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-60">No Image Available</span>
                        </div>
                      )}

                      {/* Status Tag */}
                      {item.tag && (
                        <span className={`absolute top-2.5 left-2.5 h-5 text-white text-[9px] font-black px-2 inline-flex items-center justify-center rounded-md uppercase tracking-wider shadow-xs leading-none ${
                          item.tag === 'AVAILABLE'
                            ? 'bg-emerald-600 border border-emerald-500'
                            : 'bg-slate-700/90 text-slate-200 border border-slate-600'
                        }`}>
                          {item.tag}
                        </span>
                      )}

                      {/* Featured Star Badge */}
                      {item.is_featured && (
                        <span className="absolute top-2.5 right-2.5 h-5 bg-amber-500 text-slate-950 text-[9px] font-black px-2 inline-flex items-center justify-center gap-0.5 rounded-md uppercase tracking-wider shadow-xs leading-none border border-amber-300">
                          <span className="material-icons text-[10px] text-slate-950">star</span>
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      {/* Time & Servings Non-Wrapping Chips */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-gray-300 dark:border-slate-700 whitespace-nowrap">
                          <span className="material-icons text-xs text-[#C8102E]">schedule</span>
                          <span>{formatPrepTime(item.prepTime)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-gray-300 dark:border-slate-700 whitespace-nowrap">
                          <span className="material-icons text-xs text-[#C8102E]">groups</span>
                          <span>{item.servings}</span>
                        </span>
                      </div>

                      {/* Dish Title */}
                      <h3 className={`font-black text-sm sm:text-base tracking-tight transition line-clamp-1 h-6 flex items-center group-hover:text-[#C8102E] ${
                        isDarkMode ? 'text-white' : 'text-[#071A3D]'
                      }`}>
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed line-clamp-2 h-9 overflow-hidden ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600 font-medium'
                      }`}>
                        {item.description || 'Delicately seasoned and freshly prepared using house-special ingredients.'}
                      </p>
                    </div>
                  </div>

                  {/* Defined Footer Price Box */}
                  <div className={`p-4 pt-3 flex items-center justify-between border-t border-gray-300 dark:border-slate-700 mt-1 ${
                    isDarkMode ? 'bg-slate-900/40' : 'bg-gray-50/80'
                  }`}>
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold uppercase tracking-wider">Price</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold text-[#C8102E]">₱</span>
                        <span className="text-lg font-black font-mono text-[#071A3D] dark:text-white">
                          {item.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-[#C8102E] group-hover:translate-x-1 transition-transform">
                      <span>View Dish</span>
                      <span className="material-icons text-sm">arrow_forward</span>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}
