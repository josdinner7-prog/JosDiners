import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import PackageOrderModal from '../../components/PackageOrderModal'
import api from '../../services/api'

// High-Fidelity Catering Package Card Skeleton
function CateringCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#071A3D] rounded-xl border border-gray-300 dark:border-slate-700 shadow-xs flex flex-col justify-between overflow-hidden animate-pulse">
      <div>
        <div className="h-48 w-full bg-gray-200 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700"></div>
        <div className="p-4 space-y-3.5">
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-gray-100 dark:bg-slate-800">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="h-14 bg-gray-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="h-9 w-full rounded-lg bg-gray-300 dark:bg-slate-700"></div>
      </div>
    </div>
  )
}

export default function CateringPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const onAddToCart = props.onAddToCart ?? context.handleAddToCart
  const { showToast } = useToast()

  // Real Database Data State
  const [packages, setPackages] = useState([])
  const [addonsList, setAddonsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailModalPackage, setDetailModalPackage] = useState(null)
  const [orderModalPackage, setOrderModalPackage] = useState(null)

  useEffect(() => {
    loadRealCateringData()
  }, [])

  // Lock background scroll when modal is open
  useEffect(() => {
    if (detailModalPackage || orderModalPackage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [detailModalPackage, orderModalPackage])

  const loadRealCateringData = async () => {
    setIsLoading(true)
    try {
      const [pkgRes, addonRes] = await Promise.allSettled([
        api.catering.getPackages(),
        api.catering.getAddons()
      ])

      if (pkgRes.status === 'fulfilled' && pkgRes.value?.status === 'success' && Array.isArray(pkgRes.value.packages)) {
        setPackages(pkgRes.value.packages)
      } else {
        setPackages([])
      }

      if (addonRes.status === 'fulfilled' && addonRes.value?.status === 'success' && Array.isArray(addonRes.value.addons)) {
        setAddonsList(addonRes.value.addons)
      } else {
        setAddonsList([])
      }
    } catch (e) {
      console.error('Error loading real database catering catalog:', e)
      setPackages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPackage = (pkg) => {
    if (pkg.status === 'Unavailable') {
      showToast('This package is currently unavailable.', 'warning')
      return
    }
    setOrderModalPackage(pkg)
  }

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition cursor-pointer font-semibold">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">Catering Packages</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">bento</span>
              <span>Catering Packages &amp; Offers</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Explore our chef-curated catering packages and banquet offers for weddings, birthdays, and celebrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => navigate('/function-halls')}
              className="bg-gray-100/80 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-white px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="material-icons text-base">corporate_fare</span>
              <span>Browse Function Halls</span>
            </button>
            <button
              onClick={() => navigate('/reservation', { state: { reservationType: 'catering' } })}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-4 py-2.5 rounded-md text-xs font-black shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span className="material-icons text-base">calendar_month</span>
              <span>Reserve &amp; Book Now</span>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-gray-300 dark:border-slate-700 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Signature Tiers</span>
            <h2 className="text-xl sm:text-2xl font-black text-[#071A3D] dark:text-white tracking-tight">
              Featured Catering Packages
            </h2>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Includes professional chafing setup, service staff, and tableware.
          </div>
        </div>

        {/* CATERING OFFER CARDS GRID (4-COLUMN LAYOUT) */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <CateringCardSkeleton key={n} />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs space-y-3">
              <span className="material-icons text-5xl text-gray-400">inventory_2</span>
              <h3 className="text-lg font-black text-[#071A3D] dark:text-white">No Catering Packages Available</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                There are currently no catering packages in the database. Please check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
              {packages.map((pkg, idx) => {
                const packageName = pkg.package_name || 'Unnamed Package'
                const hasImage = Boolean(pkg.package_image && pkg.package_image.trim() !== '')
                const minPax = pkg.min_guests ? parseInt(pkg.min_guests, 10) : 20
                const maxPax = pkg.max_guests ? parseInt(pkg.max_guests, 10) : 50
                const pkgPrice = parseFloat(pkg.package_price || pkg.price_per_person || 0)
                const prepTime = pkg.prep_time && pkg.prep_time.trim() !== '' ? pkg.prep_time : '2 - 3 Hours'
                const recommendedFor = pkg.recommended_for && pkg.recommended_for.trim() !== '' ? pkg.recommended_for : null
                const description = pkg.description && pkg.description.trim() !== '' ? pkg.description : null
                const isUnavailable = pkg.status === 'Unavailable'
                const hasExtraFee = pkg.extra_guest_fee && Number(pkg.extra_guest_fee) > 0
                const pricePerHead = minPax > 0 && pkgPrice > 0 ? Math.round(pkgPrice / minPax) : null

                // Parse category allowances
                let allowances = {}
                if (pkg.category_allowances) {
                  allowances = typeof pkg.category_allowances === 'string' ? JSON.parse(pkg.category_allowances || '{}') : pkg.category_allowances
                } else if (pkg.category_allowances_json) {
                  try { allowances = JSON.parse(pkg.category_allowances_json) } catch (e) { allowances = {} }
                }

                const allowancePills = Object.entries(allowances)
                  .filter(([_, count]) => Number(count) > 0)
                  .map(([catKey, count]) => `${count} ${catKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`)

                // Parse custom service features
                let customServices = []
                if (Array.isArray(pkg.features) && pkg.features.length > 0) {
                  customServices = pkg.features
                } else if (pkg.features_json) {
                  try {
                    const parsed = typeof pkg.features_json === 'string' ? JSON.parse(pkg.features_json) : pkg.features_json
                    if (Array.isArray(parsed) && parsed.length > 0) customServices = parsed
                  } catch (e) {
                    customServices = []
                  }
                }

                // Parse curated package dishes
                let curatedDishes = []
                if (Array.isArray(pkg.package_dishes) && pkg.package_dishes.length > 0) {
                  curatedDishes = pkg.package_dishes
                } else if (pkg.package_dishes_json) {
                  try {
                    const parsed = typeof pkg.package_dishes_json === 'string' ? JSON.parse(pkg.package_dishes_json) : pkg.package_dishes_json
                    if (Array.isArray(parsed)) curatedDishes = parsed
                  } catch (e) {
                    curatedDishes = []
                  }
                }

                return (
                  <div
                    key={pkg.package_id || idx}
                    className="bg-white dark:bg-[#071A3D] rounded-xl border border-gray-300 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#C8102E]/60 h-full"
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-900 border-b border-gray-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {hasImage ? (
                        <>
                          <img
                            src={pkg.package_image}
                            alt={packageName}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div style={{ display: 'none' }} className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-400">
                            <span className="material-icons text-3xl opacity-50">image_not_supported</span>
                            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-60">No Image Uploaded</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-400">
                          <span className="material-icons text-3xl opacity-50">image_not_supported</span>
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-60">No Image Uploaded</span>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        </div>
                      )}

                      {/* Top Overlay Badge: Availability Status Pill */}
                      <div className="absolute top-2.5 left-3 pointer-events-none">
                        {isUnavailable ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-red-200 bg-red-950/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-red-500/60 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            <span>Unavailable</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100 bg-emerald-950/85 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-500/60 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Available</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Price & Capacity Overlay */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8.5px] uppercase font-black text-amber-300 tracking-wider leading-none">
                              Package Price
                            </span>
                            {pricePerHead && (
                              <span className="text-[8px] font-bold text-gray-300">
                                (~₱{pricePerHead.toLocaleString()}/pax)
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            {pkgPrice > 0 ? (
                              <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono drop-shadow-sm">
                                ₱{pkgPrice.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-base font-black text-white tracking-tight">
                                Price on Inquiry
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right bg-black/60 backdrop-blur-xs px-2 py-1 rounded-md border border-white/20">
                          <span className="text-[7.5px] uppercase font-bold text-gray-300 block leading-none">
                            Base Included
                          </span>
                          <span className="text-[11px] font-black text-white font-mono mt-0.5 block leading-tight">
                            {minPax}–{maxPax} Pax
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">

                        {/* Title, Recommended For & Description */}
                        <div>
                          <h3 className="text-base font-black text-[#071A3D] dark:text-white tracking-tight uppercase group-hover:text-[#C8102E] transition-colors leading-snug line-clamp-1">
                            {packageName}
                          </h3>

                          {recommendedFor && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-extrabold text-[#C8102E] dark:text-red-400">
                              <span className="material-icons text-xs">celebration</span>
                              <span className="truncate">Ideal for: {recommendedFor}</span>
                            </div>
                          )}

                          <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium line-clamp-2 leading-relaxed min-h-[32px] mt-1">
                            {description || 'Complete catering buffet experience crafted for memorable celebrations and gatherings.'}
                          </p>
                        </div>

                        {/* 2-COLUMN SPECIFICATIONS BOX */}
                        <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="material-icons text-[#C8102E] text-sm">groups</span>
                            <div className="min-w-0">
                              <span className="text-[8px] uppercase font-bold text-gray-400 block leading-none mb-0.5">Capacity</span>
                              <span className="font-extrabold text-[#071A3D] dark:text-white font-mono truncate block">
                                {minPax}–{maxPax} Guests
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-slate-800 pl-2">
                            <span className="material-icons text-emerald-500 text-sm">person_add</span>
                            <div className="min-w-0">
                              <span className="text-[8px] uppercase font-bold text-gray-400 block leading-none mb-0.5">Extra Pax Fee</span>
                              <span className={`font-extrabold font-mono truncate block ${hasExtraFee ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {hasExtraFee ? `+₱${parseFloat(pkg.extra_guest_fee).toLocaleString()}/pax` : 'No Extra Fee'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* UNIFIED INCLUSIONS CONTAINER (Only Real DB Data) */}
                        <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-2 min-h-[96px]">
                          {/* Curated Package Dishes (Admin Defined) */}
                          {curatedDishes.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                                <span>Curated Package Menu ({curatedDishes.length} Items):</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {curatedDishes.slice(0, 3).map((d, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-900/50 text-[10px] font-bold truncate max-w-[140px]"
                                    title={d.name || d.dish_name}
                                  >
                                    🍲 {d.name || d.dish_name}
                                  </span>
                                ))}
                                {curatedDishes.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[9px] font-extrabold">
                                    +{curatedDishes.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Category Dish Course Selection */}
                          {allowancePills.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                                Dish Course Selection ({allowancePills.length} Categories):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {allowancePills.slice(0, 4).map((pill, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-[#C8102E] border border-red-200 dark:border-red-900/50 text-[10px] font-extrabold"
                                  >
                                    🍱 {pill}
                                  </span>
                                ))}
                                {allowancePills.length > 4 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[9px] font-bold">
                                    +{allowancePills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : customServices.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">
                                Included Services &amp; Inclusions:
                              </span>
                              <ul className="space-y-1 text-[10.5px] text-gray-700 dark:text-gray-200 font-bold">
                                {customServices.slice(0, 3).map((svc, sIdx) => (
                                  <li key={sIdx} className="flex items-center gap-1.5 truncate">
                                    <span className="material-icons text-emerald-500 text-xs shrink-0">check_circle</span>
                                    <span className="truncate">{svc}</span>
                                  </li>
                                ))}
                                {customServices.length > 3 && (
                                  <li className="text-[10px] font-black text-[#C8102E] pl-4">
                                    +{customServices.length - 3} more services
                                  </li>
                                )}
                              </ul>
                            </div>
                          ) : curatedDishes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-4 px-2 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg text-center h-full min-h-[85px] bg-gray-50/50 dark:bg-slate-900/50">
                              <span className="text-[10.5px] text-gray-400 dark:text-gray-500 italic">
                                No inclusions configured.
                              </span>
                            </div>
                          ) : null}
                        </div>

                      </div>

                      {/* CARD FOOTER (Action Buttons) */}
                      <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalPackage(pkg)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 text-gray-700 dark:text-gray-200 font-bold text-[11px] transition active:scale-95 cursor-pointer shrink-0"
                          title="View Full Inclusions"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition active:scale-95 shadow-xs text-center flex items-center justify-center gap-1.5 ${isUnavailable
                            ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-slate-700'
                            : 'bg-[#C8102E] hover:bg-[#9B0B21] text-white cursor-pointer group-hover:shadow-md'
                            }`}
                        >
                          <span>{isUnavailable ? 'Unavailable' : 'Select Package'}</span>
                          {!isUnavailable && <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                        </button>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* QUICK VIEW DETAILS MODAL (Mounted directly to document.body via Portal) */}
        {detailModalPackage && typeof document !== 'undefined' && createPortal(
          (() => {
            // Parse real modal allowances
            let modalAllowances = []
            let rawAllowances = detailModalPackage.category_allowances
            if (typeof rawAllowances === 'string') {
              try { rawAllowances = JSON.parse(rawAllowances) } catch (e) { rawAllowances = {} }
            } else if (!rawAllowances && detailModalPackage.category_allowances_json) {
              try { rawAllowances = JSON.parse(detailModalPackage.category_allowances_json) } catch (e) { rawAllowances = {} }
            }
            if (rawAllowances && typeof rawAllowances === 'object') {
              modalAllowances = Object.entries(rawAllowances).filter(([_, count]) => Number(count) > 0)
            }

            // Parse real modal features
            let modalFeatures = []
            if (Array.isArray(detailModalPackage.features) && detailModalPackage.features.length > 0) {
              modalFeatures = detailModalPackage.features
            } else if (detailModalPackage.features_json) {
              try {
                const parsed = typeof detailModalPackage.features_json === 'string' ? JSON.parse(detailModalPackage.features_json) : detailModalPackage.features_json
                if (Array.isArray(parsed) && parsed.length > 0) modalFeatures = parsed
              } catch (e) {
                modalFeatures = []
              }
            }

            // Parse curated package dishes
            let modalCuratedDishes = []
            if (Array.isArray(detailModalPackage.package_dishes) && detailModalPackage.package_dishes.length > 0) {
              modalCuratedDishes = detailModalPackage.package_dishes
            } else if (detailModalPackage.package_dishes_json) {
              try {
                const parsed = typeof detailModalPackage.package_dishes_json === 'string' ? JSON.parse(detailModalPackage.package_dishes_json) : detailModalPackage.package_dishes_json
                if (Array.isArray(parsed)) modalCuratedDishes = parsed
              } catch (e) {
                modalCuratedDishes = []
              }
            }

            return (
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-none flex items-center justify-center p-3 sm:p-4 animate-fade-in"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setDetailModalPackage(null)
                }}
              >
                <div
                  className="relative rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#071A3D] text-[#071A3D] dark:text-white transition-all duration-300 transform animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto"
                  onClick={(e) => e.stopPropagation()}
                >

                  {/* Modal Header Banner */}
                  <div className="relative h-36 sm:h-40 bg-gray-900 overflow-hidden shrink-0">
                    {detailModalPackage.package_image ? (
                      <img
                        src={detailModalPackage.package_image}
                        alt={detailModalPackage.package_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#071A3D] to-[#C8102E]">
                        <span className="material-icons text-4xl text-white/50">restaurant</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>

                    {/* Top Left Availability Pill */}
                    <div className="absolute top-2.5 left-3 pointer-events-none">
                      {detailModalPackage.status === 'Unavailable' ? (
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-200 bg-red-950/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-red-500/60 flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span>Unavailable</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100 bg-emerald-950/85 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-500/60 flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Available</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailModalPackage(null)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black transition cursor-pointer border border-white/20"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>

                    <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                      <h2 className="text-lg sm:text-xl font-black text-white font-['Russo_One'] uppercase leading-tight">
                        {detailModalPackage.package_name}
                      </h2>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">

                    {/* Pricing & Capacity Metric Strip */}
                    <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Package Price</span>
                        <span className="text-sm sm:text-base font-black text-[#C8102E] font-mono">
                          ₱{parseFloat(detailModalPackage.package_price || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-x border-gray-200 dark:border-slate-800">
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Included Guests</span>
                        <span className="text-sm sm:text-base font-black text-[#071A3D] dark:text-white font-mono">
                          {detailModalPackage.min_guests ? (detailModalPackage.max_guests ? `${detailModalPackage.min_guests}–${detailModalPackage.max_guests}` : `Min. ${detailModalPackage.min_guests}`) : 'Flexible'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Extra Pax Fee</span>
                        <span className={`text-xs sm:text-sm font-black font-mono ${detailModalPackage.extra_guest_fee && Number(detailModalPackage.extra_guest_fee) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {detailModalPackage.extra_guest_fee && Number(detailModalPackage.extra_guest_fee) > 0
                            ? `+₱${parseFloat(detailModalPackage.extra_guest_fee).toLocaleString()}/pax`
                            : 'None'}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Package Overview</h4>
                      {detailModalPackage.description && detailModalPackage.description.trim() !== '' ? (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-[11px]">
                          {detailModalPackage.description}
                        </p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic text-[11px]">No package description provided.</p>
                      )}
                    </div>

                    {/* Curated Package Dishes (Admin Configured) */}
                    {modalCuratedDishes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                            <span className="material-icons text-xs">lunch_dining</span>
                            <span>Included Package Dishes ({modalCuratedDishes.length} Items)</span>
                          </h4>
                          <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300">
                            Chef Curated
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {modalCuratedDishes.map((dish, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-1.5 rounded-md bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2 font-bold text-[11px]"
                            >
                              {dish.image && (
                                <img
                                  src={dish.image}
                                  alt={dish.name || dish.dish_name}
                                  className="w-7 h-7 rounded object-cover shrink-0 border border-amber-200"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[#071A3D] dark:text-white truncate block leading-tight">
                                  {dish.name || dish.dish_name}
                                </span>
                                <span className="text-[9px] text-amber-800 dark:text-amber-400 font-semibold capitalize">
                                  {dish.category || 'Included'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Dish Selection Allowances */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          Customer Dish Selection Allowances
                        </h4>
                        {modalAllowances.length > 0 && (
                          <span className="text-[10px] font-black text-[#C8102E] font-mono">
                            {modalAllowances.reduce((acc, [_, c]) => acc + Number(c), 0)} Included Dishes
                          </span>
                        )}
                      </div>

                      {modalAllowances.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {modalAllowances.map(([k, v]) => (
                              <div key={k} className="p-1.5 rounded-md bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between font-bold text-[11px]">
                                <span className="capitalize text-[#071A3D] dark:text-white truncate">{k.replace(/_/g, ' ')}</span>
                                <span className="text-[#C8102E] font-black shrink-0 ml-1">{v} {Number(v) > 1 ? 'dishes' : 'dish'}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                            💡 You can customize and pick your dishes upon booking. Orders exceeding the included allowance will incur an additional dish fee.
                          </p>
                        </div>
                      ) : (
                        <div className="py-2 px-2.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 text-center">
                          <span className="text-gray-400 dark:text-gray-500 italic text-[10.5px]">
                            No dish selection allowances configured.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Included Services & Inclusions */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                        Included Services &amp; Inclusions
                      </h4>
                      {modalFeatures.length > 0 ? (
                        <ul className="space-y-1 font-bold text-gray-700 dark:text-gray-200 text-[11px]">
                          {modalFeatures.map((svc, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="material-icons text-emerald-500 text-xs">check_circle</span>
                              <span>{svc}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-2 px-2.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 text-center">
                          <span className="text-gray-400 dark:text-gray-500 italic text-[10.5px]">
                            No additional services or inclusions specified.
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex items-center justify-between gap-2.5 shrink-0">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-gray-400 block">Total Package</span>
                      <span className="text-base font-black text-[#C8102E] font-mono">
                        ₱{parseFloat(detailModalPackage.package_price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailModalPackage(null)}
                        className="px-3.5 py-2 rounded-md border border-gray-300 dark:border-slate-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition cursor-pointer text-xs"
                      >
                        Close
                      </button>
                      {detailModalPackage.status === 'Unavailable' ? (
                        <button
                          type="button"
                          disabled={true}
                          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider border border-gray-300 dark:border-slate-700 cursor-not-allowed text-xs"
                        >
                          Currently Unavailable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const sel = detailModalPackage
                            setDetailModalPackage(null)
                            handleSelectPackage(sel)
                          }}
                          className="px-4 py-2 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black uppercase tracking-wider transition active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <span>Proceed to Book</span>
                          <span className="material-icons text-xs">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )
          })(),
          document.body
        )}

        {/* EVENT ADD-ONS & BANQUET ENHANCEMENTS */}
        {isLoading ? (
          <section className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 p-5 sm:p-6 shadow-xs space-y-5 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-300 dark:border-slate-700 pb-3">
              <div className="space-y-1.5">
                <div className="w-28 h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="w-64 h-5 bg-gray-300 dark:bg-slate-600 rounded"></div>
              </div>
              <div className="w-48 h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-3.5 rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gray-200 dark:bg-slate-700"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-3 bg-gray-300 dark:bg-slate-700 rounded"></div>
                      <div className="w-16 h-2.5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  <div className="w-14 h-4 bg-gray-300 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </section>
        ) : addonsList.length > 0 ? (
          <section className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-300 dark:border-slate-700 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-300 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Optional Enhancements</span>
                <h2 className="text-lg sm:text-xl font-black text-[#071A3D] dark:text-white tracking-tight">
                  Audio-Visual, Styling &amp; Add-on Services
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium max-w-sm">
                Enhance your event setup with audio-visual equipment, styling backdrops, and entertainment hosts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {addonsList.map((item) => (
                <div
                  key={item.addon_id}
                  className="p-3.5 rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-red-50 dark:bg-red-950/40 text-[#C8102E] flex items-center justify-center shrink-0 font-bold border border-red-200 dark:border-red-900">
                      <span className="material-icons text-lg">{item.icon || 'star'}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-[#071A3D] dark:text-white truncate">{item.addon_name || 'Add-on Item'}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">{item.category || 'Event Service'}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#C8102E] font-mono">₱{(item.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* PACKAGE MENU CUSTOMIZER & ORDER MODAL */}
        <PackageOrderModal
          isOpen={Boolean(orderModalPackage)}
          onClose={() => setOrderModalPackage(null)}
          packageData={orderModalPackage}
          onAddToCart={onAddToCart}
          isDarkMode={isDarkMode}
        />

      </div>
    </div>
  )
}
