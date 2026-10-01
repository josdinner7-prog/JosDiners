import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

function FoodCategoryBar({ selectedCategory, setSelectedCategory, isDarkMode }) {
  const [categoriesList, setCategoriesList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    fetchRealCategoriesFromDB()
  }, [])

  const handleScroll = (direction) => {
    if (!scrollRef.current) return
    const scrollAmount = direction === 'left' ? -220 : 220
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const getCategoryIcon = (slug, label) => {
    const s = `${slug} ${label}`.toLowerCase()
    if (s.includes('featured') || s.includes('star')) return 'star'
    if (s.includes('tray') || s.includes('party')) return 'dinner_dining'
    if (s.includes('bento') || s.includes('solo') || s.includes('rice')) return 'rice_bowl'
    if (s.includes('soup') || s.includes('noodle')) return 'ramen_dining'
    if (s.includes('catering') || s.includes('package')) return 'bento'
    if (s.includes('drink') || s.includes('beverage') || s.includes('dessert') || s.includes('cake')) return 'cake'
    if (s.includes('sea') || s.includes('fish') || s.includes('shrimp')) return 'set_meal'
    return 'flatware'
  }

  const fetchRealCategoriesFromDB = async () => {
    try {
      setIsLoading(true)
      const data = await api.menu.getCategories()
      
      const systemTabs = [
        { id: 'all', label: 'All Dishes', icon: 'restaurant' },
        { id: 'packages', label: 'Catering Packages', icon: 'bento' },
        { id: 'featured', label: 'Featured Dishes', icon: 'star' }
      ]

      if (data.status === 'success' && Array.isArray(data.categories)) {
        const liveMapped = data.categories
          .filter(c => c.status !== 'Inactive')
          .map(c => ({
            id: c.id || c.category_slug,
            label: c.label || c.category_name,
            icon: getCategoryIcon(c.id || c.category_slug, c.label || c.category_name)
          }))
        setCategoriesList([...systemTabs, ...liveMapped])
      } else {
        setCategoriesList(systemTabs)
      }
    } catch (e) {
      console.error('Error fetching real database categories for menu bar:', e)
      setCategoriesList([
        { id: 'all', label: 'All Dishes', icon: 'restaurant' },
        { id: 'featured', label: 'Featured Dishes', icon: 'star' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`p-4 sm:p-4.5 rounded-lg border transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#071A3D] border-slate-700 text-white' 
        : 'bg-white border-gray-300 text-[#071A3D] shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[#C8102E] text-lg sm:text-xl">category</span>
          <h3 className="font-black text-sm sm:text-base tracking-tight">Food Menu Categories</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
            Click a category to filter dishes
          </span>
          {/* Scroll Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              title="Scroll Left"
              className={`w-7 h-7 rounded-md border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'bg-[#0B1B36] border-slate-700 text-gray-300 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E]'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E]'
              }`}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <button
              onClick={() => handleScroll('right')}
              title="Scroll Right"
              className={`w-7 h-7 rounded-md border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'bg-[#0B1B36] border-slate-700 text-gray-300 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E]'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E]'
              }`}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex items-center">
        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth w-full"
        >
          {isLoading ? (
            // Loading skeleton pills
            [...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="h-8.5 w-28 bg-gray-200 dark:bg-slate-700/60 rounded-md animate-pulse shrink-0"
              />
            ))
          ) : (
            categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 border cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-xs'
                      : isDarkMode
                        ? 'bg-[#0B1B36] text-gray-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodCategoryBar
