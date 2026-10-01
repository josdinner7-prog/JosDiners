import React, { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import FoodCategoryBar from '../../components/FoodCategoryBar'
import MenuGrid from '../../components/MenuGrid'

function Menu(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const onAddToCart = props.onAddToCart ?? context.handleAddToCart
  const openAiConcierge = context.openAiConcierge || (() => {})

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [budgetLimit, setBudgetLimit] = useState(null)
  const [isFilterActive, setIsFilterActive] = useState(false)

  const handleApplyFilter = (amount) => {
    setBudgetLimit(amount)
    setIsFilterActive(true)
  }

  const handleResetFilter = () => {
    setBudgetLimit(null)
    setIsFilterActive(false)
  }

  const dark = isDarkMode

  return (
    <div className={`min-h-screen py-8 sm:py-10 px-3 sm:px-6 lg:px-8 transition-colors duration-300 ${
      dark ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition cursor-pointer font-semibold">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">Food Menu</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">restaurant_menu</span>
              <span>Food Catalog &amp; Menu</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Explore our full selection of signature Filipino dishes, sizzlers, catering platters, and house desserts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {isFilterActive && (
              <button
                onClick={handleResetFilter}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-icons text-sm text-gray-400">filter_alt_off</span>
                <span>Reset Budget Filter (≤ ₱{budgetLimit})</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        {isFilterActive && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="material-icons text-base text-emerald-500">check_circle</span>
              <span>
                Filtering catalog to dishes <strong>₱{budgetLimit.toLocaleString('en-PH')} and below</strong>
              </span>
            </div>
            <button
              onClick={handleResetFilter}
              className="text-xs font-black underline hover:text-emerald-900 dark:hover:text-white cursor-pointer"
            >
              Show All Dishes
            </button>
          </div>
        )}

        {/* Dedicated Food Menu Category Tabs */}
        <FoodCategoryBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isDarkMode={isDarkMode}
        />

        {/* Interactive Menu Grid */}
        <MenuGrid
          selectedCategory={selectedCategory}
          isDarkMode={isDarkMode}
          onAddToCart={onAddToCart}
          maxPrice={isFilterActive ? budgetLimit : null}
        />

      </div>
    </div>
  )
}

export default Menu



