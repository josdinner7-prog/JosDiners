import React from 'react'

export default function MenuFilterBar({
  menuSearchQuery,
  handleSearchInputChange,
  setMenuSearchQuery,
  setCurrentPage,
  menuFilter,
  categories,
  filteredMenuCount,
  menuItems,
  categoryScrollRef,
  handleCategoryWheelScroll,
  handleSelectCategoryFilter,
}) {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-400 shadow-sm space-y-3">
      {/* Top Control Bar: Search Input & Active Filter Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80 shrink-0">
          <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search dish by name, ingredient, or description..."
            value={menuSearchQuery}
            onChange={handleSearchInputChange}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-semibold text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition shadow-2xs"
          />
          {menuSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setMenuSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
              title="Clear Search"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-bold text-gray-500">
          <span className="flex items-center gap-1 text-gray-500 font-semibold">
            <span className="material-icons text-sm text-[#C8102E]">filter_alt</span>
            <span>Active Filter:</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#C8102E] border border-red-200 font-extrabold capitalize text-[11px]">
            {menuFilter === 'featured' ? '★ Featured Dishes' : (categories.find(c => c.id === menuFilter)?.label || 'All Dishes')}
          </span>
          <span className="text-gray-400 font-medium">({filteredMenuCount} items)</span>
        </div>
      </div>

      {/* Bottom Category Scroll Bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            if (categoryScrollRef.current) categoryScrollRef.current.scrollLeft -= 220
          }}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 shrink-0 border border-gray-300 transition active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
          title="Scroll Categories Left"
        >
          <span className="material-icons text-base">chevron_left</span>
        </button>

        <div
          ref={categoryScrollRef}
          onWheel={handleCategoryWheelScroll}
          className="flex-1 overflow-x-auto py-1 no-scrollbar scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap w-max">
            <button
              type="button"
              onClick={() => handleSelectCategoryFilter('featured')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                menuFilter === 'featured'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <span className="material-icons text-xs text-amber-600">star</span>
              <span>Featured Dishes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${menuFilter === 'featured' ? 'bg-black/20 text-slate-950 font-black' : 'bg-amber-200 text-amber-900 font-bold'}`}>
                {menuItems.filter(i => i.is_featured).length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = cat.id === 'all'
                ? menuItems.length
                : menuItems.filter(i => i.category === cat.id).length

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    menuFilter === cat.id
                      ? 'bg-[#C8102E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${menuFilter === cat.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (categoryScrollRef.current) categoryScrollRef.current.scrollLeft += 220
          }}
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 shrink-0 border border-gray-300 transition active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
          title="Scroll Categories Right"
        >
          <span className="material-icons text-base">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
