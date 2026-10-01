import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PaginationControls from './PaginationControls'
import PackageOrderModal from './PackageOrderModal'
import api from '../services/api'

// High-Fidelity Dish Card Skeleton matching exact dish card structure and dimensions
function DishCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shadow-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#0B1B36] flex flex-col justify-between animate-pulse">
      <div>
        {/* Photo Header Skeleton */}
        <div className="relative h-48 w-full bg-gray-200 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700">
          <div className="absolute top-2.5 left-2.5 w-16 h-5 bg-gray-300 dark:bg-slate-700 rounded-md"></div>
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

function MenuGrid({ selectedCategory, isDarkMode, onViewMore, limit, sectionTitle, hideHeader, maxPrice, onAddToCart }) {
  const navigate = useNavigate()
  const [realItems, setRealItems] = useState([])
  const [cateringPackages, setCateringPackages] = useState([])
  const [selectedPackageForOrder, setSelectedPackageForOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    fetchRealMenuData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, maxPrice])

  const formatPrepTime = (t) => {
    if (!t) return '20-25 mins'
    return String(t).replace(/minutes?/gi, 'mins').replace(/hours?/gi, 'hrs')
  }

  const fetchRealMenuData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [itemsData, catData, pkgData] = await Promise.allSettled([
        api.menu.getMenuItems(),
        api.menu.getCategories(),
        api.catering.getPackages()
      ])

      const categoryMap = {}
      if (catData.status === 'fulfilled' && catData.value?.status === 'success' && Array.isArray(catData.value.categories)) {
        catData.value.categories.forEach(c => {
          categoryMap[c.id || c.category_slug] = c.label || c.category_name
        })
      }

      if (itemsData.status === 'fulfilled' && itemsData.value?.status === 'success' && Array.isArray(itemsData.value.items)) {
        const mappedItems = itemsData.value.items.map(item => ({
          id: item.id,
          category: item.category,
          categoryLabel: categoryMap[item.category] || item.category_name || item.category,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price || 0),
          prepTime: item.prep_time || '20-25 mins',
          servings: item.serving_size || '1-2 Pax',
          tag: item.availability === 'Available' ? 'AVAILABLE' : 'SOLD OUT',
          image: item.image,
          ingredients: item.ingredients,
          allergens: item.allergens,
          is_featured: !!item.is_featured,
          options: [
            { name: item.serving_size || 'Standard Portion', extraPrice: 0 }
          ]
        }))
        setRealItems(mappedItems)
      } else {
        setRealItems([])
      }

      if (pkgData.status === 'fulfilled' && pkgData.value?.status === 'success' && Array.isArray(pkgData.value.packages)) {
        setCateringPackages(pkgData.value.packages)
      } else {
        setCateringPackages([])
      }
    } catch (e) {
      console.error('Error fetching real menu data from database:', e)
      setError('Failed to load menu items from database. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDishClick = (item) => {
    navigate(`/dish/${item.id}`, { state: { item } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectPackage = (pkg) => {
    setSelectedPackageForOrder(pkg)
  }

  const isPackagesSelected = selectedCategory === 'packages' || selectedCategory === 'catering' || selectedCategory === 'catering_packages'

  // 1. Clean category + budget filtering using useMemo
  const categoryFiltered = useMemo(() => {
    if (isPackagesSelected) {
      let pkgs = cateringPackages.map(pkg => ({
        id: `pkg-${pkg.package_id}`,
        isPackage: true,
        package_id: pkg.package_id,
        category: 'packages',
        categoryLabel: 'Catering Package',
        name: pkg.package_name,
        description: pkg.description,
        price: parseFloat(pkg.package_price || pkg.price_per_person || 0),
        prepTime: pkg.prep_time || '3 Hours',
        servings: `${pkg.min_guests || 30}-${pkg.max_guests || 150} Guests`,
        tag: pkg.status === 'Available' ? 'AVAILABLE' : 'UNAVAILABLE',
        image: pkg.package_image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=700&auto=format&fit=crop&q=80',
        is_featured: true,
        category_allowances: pkg.category_allowances,
        package_dishes: pkg.package_dishes,
        features: pkg.features,
        rawPackage: pkg
      }))
      if (typeof maxPrice === 'number' && maxPrice > 0) {
        pkgs = pkgs.filter(p => p.price <= maxPrice)
      }
      return pkgs
    }

    let list = realItems
    if (typeof maxPrice === 'number' && maxPrice > 0) {
      list = list.filter(item => item.price <= maxPrice)
    }
    if (selectedCategory === 'all') return list
    if (selectedCategory === 'featured') return list.filter(item => item.is_featured)

    const target = (selectedCategory || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    return list.filter((item) => {
      if (item.category === selectedCategory) return true
      const catSlug = (item.category || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const catLabel = (item.categoryLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return catSlug === target || catSlug.includes(target) || target.includes(catSlug) ||
        catLabel.includes(target) || target.includes(catLabel)
    })
  }, [realItems, cateringPackages, selectedCategory, isPackagesSelected, maxPrice])

  // 2. Sort items: Featured first -> Available next -> Sold Out last using useMemo
  const sortedData = useMemo(() => {
    return categoryFiltered.slice().sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return b.is_featured ? -1 : 1
      }
      const aAvail = a.tag === 'AVAILABLE' ? 1 : 0
      const bAvail = b.tag === 'AVAILABLE' ? 1 : 0
      if (aAvail !== bAvail) {
        return bAvail - aAvail
      }
      return a.id - b.id
    })
  }, [categoryFiltered])

  // 3. Apply limit filtering using useMemo
  const filteredData = useMemo(() => {
    if (!limit) return sortedData
    const featuredOnly = sortedData.filter(item => item.is_featured)
    return featuredOnly.length > 0 ? featuredOnly : sortedData.slice(0, limit)
  }, [sortedData, limit])

  // 4. Calculate total pages and active page slices using useMemo
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredData.length / itemsPerPage)), [filteredData.length, itemsPerPage])

  const displayData = useMemo(() => {
    return limit
      ? filteredData.slice(0, limit)
      : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredData, limit, currentPage, itemsPerPage])

  const headingTitle = sectionTitle || (limit ? 'Featured Dishes' : 'Full Food Catalog')

  return (
    <section id="menu-section" className={`py-4 transition-colors duration-300 ${isDarkMode ? 'bg-transparent text-white' : 'bg-transparent text-[#071A3D]'}`}>
      <div>

        {/* Header Title & Controls (Only shown for featured section with limit on home page) */}
        {!hideHeader && limit && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 pb-3 border-b border-gray-300 dark:border-slate-700">
            <div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                {headingTitle}
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Freshly prepared with top quality ingredients by Jo's Diner kitchen team
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-md border ${isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-gray-300'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                Showing {filteredData.length} Items
              </span>
              <button
                onClick={onViewMore || (() => { navigate('/menu'); window.scrollTo({ top: 0, behavior: 'smooth' }) })}
                className="inline-flex items-center gap-1 text-xs font-black text-[#C8102E] hover:text-[#9B0B21] transition group cursor-pointer"
              >
                <span className="group-hover:underline">View More Menu</span>
                <span className="material-icons text-sm transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert State */}
        {error ? (
          <div className="py-12 text-center bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs">
            <div className="w-12 h-12 rounded-md bg-red-100 dark:bg-red-950/60 text-[#C8102E] flex items-center justify-center mx-auto mb-3">
              <span className="material-icons text-2xl">error_outline</span>
            </div>
            <p className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 mb-3">{error}</p>
            <button
              onClick={fetchRealMenuData}
              className="px-4 py-2 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-md font-black text-xs shadow-xs transition cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : isLoading ? (
          /* High-Fidelity Loading Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, limit || 8).map((n) => (
              <DishCardSkeleton key={n} />
            ))}
          </div>
        ) : displayData.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs">
            <div className="w-14 h-14 rounded-md bg-red-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-[#C8102E]">
              <span className="material-icons text-3xl">restaurant_menu</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-slate-100">No Dishes Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              There are currently no menu items matching the selected category.
            </p>
          </div>
        ) : (
          /* Grid of Real Database Food Cards (4-Column Layout) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayData.map((item) => {
              if (item.isPackage) {
                const pkg = item.rawPackage || item
                const allowances = pkg.category_allowances && typeof pkg.category_allowances === 'object' ? pkg.category_allowances : {}
                const allowanceEntries = Object.entries(allowances).filter(([_, qty]) => Number(qty) > 0)
                const dishesList = Array.isArray(pkg.package_dishes) ? pkg.package_dishes : []

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 border-2 cursor-pointer ${
                      isDarkMode
                        ? 'bg-[#0B1B36] border-amber-500/40 hover:border-amber-400'
                        : 'bg-white border-amber-300 hover:border-amber-500'
                    }`}
                  >
                    <div>
                      {/* Package Photo Banner */}
                      <div className="relative h-48 overflow-hidden bg-gray-900 border-b border-gray-200 dark:border-slate-700">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Package Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-amber-950 font-black text-[10px] shadow-md uppercase tracking-wider">
                          <span className="material-icons text-xs">bento</span>
                          <span>Catering Package</span>
                        </div>

                        {/* Guest Capacity Badge */}
                        <span className="absolute bottom-2.5 left-2.5 text-white bg-black/70 backdrop-blur-xs text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1">
                          <span className="material-icons text-xs text-amber-400">groups</span>
                          <span>{item.servings}</span>
                        </span>
                      </div>

                      {/* Package Info Content */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-black text-base sm:text-lg tracking-tight group-hover:text-[#C8102E] transition line-clamp-1 ${
                            isDarkMode ? 'text-white' : 'text-[#071A3D]'
                          }`}>
                            {item.name}
                          </h3>
                        </div>

                        <p className={`text-xs line-clamp-2 leading-relaxed ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {item.description || 'Special catering set created by Jo\'s Diner team for events and parties.'}
                        </p>

                        {/* Inclusions & Allowances Highlights */}
                        <div className="space-y-1.5 pt-1">
                          {allowanceEntries.length > 0 && (
                            <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1">
                                <span className="material-icons text-xs">restaurant</span>
                                <span>Included Dish Allowances:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {allowanceEntries.slice(0, 4).map(([catKey, qty]) => (
                                  <span
                                    key={catKey}
                                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-bold text-gray-800 dark:text-gray-200 border border-amber-200 dark:border-amber-800/60 capitalize"
                                  >
                                    {qty}× {catKey.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {allowanceEntries.length > 4 && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-[9.5px] font-black text-amber-800 dark:text-amber-200">
                                    +{allowanceEntries.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {dishesList.length > 0 && (
                            <div className="flex items-center gap-1 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <span className="material-icons text-xs">check_circle</span>
                              <span>{dishesList.length} Curated Dishes Available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Price & Action */}
                    <div className={`p-4 pt-3 flex items-center justify-between border-t border-gray-300 dark:border-slate-700 mt-2 ${
                      isDarkMode ? 'bg-slate-900/60' : 'bg-amber-50/40'
                    }`}>
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold uppercase tracking-wider">Base Package Price</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-sm font-bold text-[#C8102E]">₱</span>
                          <span className="text-xl font-black font-mono text-[#071A3D] dark:text-white">
                            {item.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectPackage(pkg)
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Customize</span>
                        <span className="material-icons text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )
              }

              const hasImage = Boolean(item.image && item.image.trim() !== '')

              return (
                <div
                  key={item.id}
                  onClick={() => handleDishClick(item)}
                  className={`group rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 border cursor-pointer ${isDarkMode
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
                        <span className={`absolute top-2.5 left-2.5 h-5 text-white text-[9px] font-black px-2 inline-flex items-center justify-center rounded-md uppercase tracking-wider shadow-xs leading-none ${item.tag === 'AVAILABLE'
                            ? 'bg-emerald-600 border border-emerald-500'
                            : 'bg-slate-700/90 text-slate-200 border border-slate-600'
                          }`}>
                          {item.tag}
                        </span>
                      )}

                      {/* Featured Tag */}
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
                      <h3 className={`font-black text-sm sm:text-base tracking-tight transition line-clamp-1 h-6 flex items-center group-hover:text-[#C8102E] ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed line-clamp-2 h-9 overflow-hidden ${isDarkMode ? 'text-gray-300' : 'text-gray-600 font-medium'}`}>
                        {item.description || 'Delicately seasoned and freshly prepared using house-special ingredients.'}
                      </p>
                    </div>
                  </div>

                  {/* Defined Softer Footer Price Box */}
                  <div className={`p-4 pt-3 flex items-center justify-between border-t border-gray-300 dark:border-slate-700 mt-1 ${isDarkMode ? 'bg-slate-900/40' : 'bg-gray-50/80'}`}>
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

        {/* Pagination Controls */}
        {!limit && !isLoading && (
          <div className="mt-8">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                const elem = document.getElementById('menu-section')
                if (elem) elem.scrollIntoView({ behavior: 'smooth' })
              }}
              itemLabel="dishes"
              className={isDarkMode ? 'border-slate-700 text-gray-300' : ''}
            />
          </div>
        )}

        {/* PACKAGE MENU CUSTOMIZER & ORDER MODAL */}
        <PackageOrderModal
          isOpen={Boolean(selectedPackageForOrder)}
          onClose={() => setSelectedPackageForOrder(null)}
          packageData={selectedPackageForOrder}
          onAddToCart={onAddToCart}
          isDarkMode={isDarkMode}
        />

      </div>
    </section>
  )
}

export default MenuGrid
