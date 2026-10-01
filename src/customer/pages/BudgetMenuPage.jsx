import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import { getDishImage, getCategoryFallbackImage } from '../../components/AIBudgetConciergeDrawer'

const EVENT_TYPES = [
  { value: 'dining', label: '🍽️ Family & Group Dining', desc: 'Everyday hearty Filipino favorites' },
  { value: 'birthday', label: '🎂 Birthday Celebration', desc: 'Party trays & festive crowd-pleasers' },
  { value: 'office', label: '💼 Office / Team Lunch', desc: 'Professional, packed & balanced meal' },
  { value: 'gathering', label: '👨‍👩‍👧 Family Gathering / Reunion', desc: 'Comforting traditional banquet' },
  { value: 'party', label: '🎉 Holiday & Milestone Feast', desc: 'Special party trays & desserts' },
]

const QUICK_BUDGETS = [1500, 3000, 5000, 10000, 15000, 25000, 50000]
const QUICK_GUESTS = [4, 8, 15, 25, 40, 60, 100]

const DIETARY_OPTIONS = [
  { id: 'no-pork', label: '🚫 No Pork' },
  { id: 'no-beef', label: '🚫 No Beef' },
  { id: 'include-dessert', label: '🍰 Include Dessert' },
  { id: 'include-pasta', label: '🍝 Include Noodles/Pasta' },
  { id: 'seafood-friendly', label: '🦐 Seafood Preferred' },
]

function BudgetMenuPage() {
  const context = useOutletContext() || {}
  const isDarkMode = context.isDarkMode || false
  const onAddToCart = context.handleAddToCart
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  // Form State
  const [budgetMode, setBudgetMode] = useState('total') // 'total' | 'perHead'
  const [budget, setBudget] = useState('5000')
  const [perHeadInput, setPerHeadInput] = useState('350')
  const [guests, setGuests] = useState('15')
  const [eventType, setEventType] = useState('dining')
  const [preferences, setPreferences] = useState('')
  const [selectedDietary, setSelectedDietary] = useState(['include-dessert', 'include-pasta'])

  // Loading & Results
  const [loading, setLoading] = useState(false)
  const [recommendationData, setRecommendationData] = useState(null)
  const [selectedTierId, setSelectedTierId] = useState('balanced') // 'value' | 'balanced' | 'gourmet'
  const [customPackageItems, setCustomPackageItems] = useState({}) // tierId -> items array
  const [allMenuCatalog, setAllMenuCatalog] = useState([])
  const [step, setStep] = useState(1) // 1=Setup, 2=Recommendations

  // Dish Swapper Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swapTargetItemIndex, setSwapTargetItemIndex] = useState(null)
  const [dishSearchQuery, setDishSearchQuery] = useState('')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all')

  const resultRef = useRef(null)

  // Parse URL search parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlBudget = params.get('budget')
    const urlGuests = params.get('guests')
    const urlEvent = params.get('event')

    if (urlBudget) setBudget(urlBudget)
    if (urlGuests) setGuests(urlGuests)
    if (urlEvent && EVENT_TYPES.some(e => e.value === urlEvent)) setEventType(urlEvent)

    // Load menu catalogue
    api.menu.getMenuItems()
      .then(data => {
        const items = Array.isArray(data) ? data : (data.items || data.menu_items || [])
        setAllMenuCatalog(items.filter(i => i.availability !== 'Unavailable' && i.status !== 'Inactive'))
      })
      .catch(e => console.warn('Could not load menu items:', e))

    if (urlBudget && urlGuests) {
      setTimeout(() => {
        handleAutoRun(parseFloat(urlBudget), parseInt(urlGuests), urlEvent || 'dining')
      }, 300)
    }
  }, [location.search])

  const handleAutoRun = async (bAmt, gCnt, evType) => {
    if (bAmt <= 0 || gCnt <= 0) return
    setLoading(true)
    try {
      const res = await api.ai.getBudgetRecommendations({
        budget: bAmt,
        guest_count: gCnt,
        event_type: evType,
        preferences: '',
        dietary_flags: selectedDietary
      })
      if (res && res.status === 'success') {
        setRecommendationData(res)
        const initialCustom = {}
        res.packages.forEach(pkg => {
          initialCustom[pkg.id] = [...pkg.items]
        })
        setCustomPackageItems(initialCustom)
        setSelectedTierId('balanced')
        setStep(2)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Derived calculations
  const effectiveTotalBudget = budgetMode === 'total'
    ? (parseFloat(budget) || 0)
    : ((parseFloat(perHeadInput) || 0) * (parseInt(guests) || 1))

  const effectiveGuests = parseInt(guests) || 1
  const effectivePerHead = effectiveGuests > 0 ? (effectiveTotalBudget / effectiveGuests).toFixed(2) : '0.00'

  const toggleDietary = (id) => {
    setSelectedDietary(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleGenerateRecommendations = async () => {
    if (effectiveTotalBudget <= 0 || effectiveGuests <= 0) {
      showToast('Please enter a valid budget and number of guests.', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        budget: effectiveTotalBudget,
        guest_count: effectiveGuests,
        event_type: eventType,
        preferences: preferences,
        dietary_flags: selectedDietary
      }

      const res = await api.ai.getBudgetRecommendations(payload)

      if (res && res.status === 'success') {
        setRecommendationData(res)
        const initialCustom = {}
        res.packages.forEach(pkg => {
          initialCustom[pkg.id] = [...pkg.items]
        })
        setCustomPackageItems(initialCustom)
        setSelectedTierId('balanced')
        setStep(2)
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        showToast(res.message || 'Could not generate recommendations.', 'error')
      }
    } catch (err) {
      console.error('AI Budget Recommendation Error:', err)
      showToast('Failed to connect to AI recommendation service. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Active package metrics
  const activePackageData = recommendationData?.packages?.find(p => p.id === selectedTierId)
  const currentItems = customPackageItems[selectedTierId] || activePackageData?.items || []

  // Dynamic metrics based on current customized items
  const currentTotalCost = currentItems.reduce((sum, item) => sum + (parseFloat(item.price || item.unit_price || 0) * effectiveGuests), 0)
  const currentCostPerHead = effectiveGuests > 0 ? currentTotalCost / effectiveGuests : 0
  const currentRemaining = effectiveTotalBudget - currentTotalCost
  const isOverBudget = currentRemaining < 0
  const currentSavingsPercent = effectiveTotalBudget > 0 ? Math.max(0, Math.round((currentRemaining / effectiveTotalBudget) * 100)) : 0
  const currentUtilization = effectiveTotalBudget > 0 ? Math.min(100, Math.round((currentTotalCost / effectiveTotalBudget) * 100)) : 0

  // Dish Swapper handlers
  const openSwapperForItem = (index) => {
    setSwapTargetItemIndex(index)
    setDishSearchQuery('')
    setSwapModalOpen(true)
  }

  const handleSwapWithDish = (newDish) => {
    if (swapTargetItemIndex === null) return
    const updatedList = [...currentItems]
    updatedList[swapTargetItemIndex] = {
      ...newDish,
      price: parseFloat(newDish.price || 0),
      unit_price: parseFloat(newDish.price || 0),
      quantity_for_event: effectiveGuests,
      item_total_cost: parseFloat(newDish.price || 0) * effectiveGuests,
      cost_per_head: parseFloat(newDish.price || 0)
    }

    setCustomPackageItems(prev => ({
      ...prev,
      [selectedTierId]: updatedList
    }))

    setSwapModalOpen(false)
    setSwapTargetItemIndex(null)
    showToast(`Swapped for "${newDish.name}"!`, 'success')
  }

  const handleRemoveDish = (index) => {
    if (currentItems.length <= 1) {
      showToast('A menu set must include at least one dish.', 'warning')
      return
    }
    const updatedList = currentItems.filter((_, i) => i !== index)
    setCustomPackageItems(prev => ({
      ...prev,
      [selectedTierId]: updatedList
    }))
    showToast('Removed dish from menu.', 'info')
  }

  const handleAddDishToPackage = (newDish) => {
    if (currentItems.some(i => i.item_id === newDish.item_id)) {
      showToast('This dish is already in the menu set.', 'warning')
      return
    }

    const newItem = {
      ...newDish,
      price: parseFloat(newDish.price || 0),
      unit_price: parseFloat(newDish.price || 0),
      quantity_for_event: effectiveGuests,
      item_total_cost: parseFloat(newDish.price || 0) * effectiveGuests,
      cost_per_head: parseFloat(newDish.price || 0)
    }

    setCustomPackageItems(prev => ({
      ...prev,
      [selectedTierId]: [...currentItems, newItem]
    }))
    showToast(`Added "${newDish.name}" to menu set!`, 'success')
  }

  // 1-Click Action: Add All to Order Tray
  const handleAddAllToCart = () => {
    if (!onAddToCart) {
      showToast('Cart service is not ready.', 'error')
      return
    }

    let addedCount = 0
    currentItems.forEach(dish => {
      onAddToCart({
        id: dish.item_id || Math.random().toString(),
        name: dish.name,
        price: parseFloat(dish.price || dish.unit_price || 0),
        finalPrice: parseFloat(dish.price || dish.unit_price || 0) * 1,
        quantity: 1,
        category: dish.category_name || 'AI Menu Recommendation',
        image: getDishImage(dish),
        specialInstructions: `From AI Budget Menu (${activePackageData?.title || 'Custom Set'}) for ${effectiveGuests} diners`
      })
      addedCount++
    })

    showToast(`Added ${addedCount} dishes from "${activePackageData?.title || 'Selected Menu Set'}" to your Order Tray!`, 'success')
  }

  // Copy plan summary
  const handleCopySummary = () => {
    const lines = [
      `🍽️ Jo's Diner - AI Budget Menu Recommendation`,
      `Occasion: ${EVENT_TYPES.find(e => e.value === eventType)?.label || eventType}`,
      `Diners: ${effectiveGuests} Pax | Total Budget: ₱${effectiveTotalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      `Selected Menu: ${activePackageData?.title || 'Custom Set'}`,
      `Estimated Cost: ₱${currentTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (₱${currentCostPerHead.toFixed(2)}/head)`,
      `Savings Reserve: ₱${Math.max(0, currentRemaining).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      ``,
      `Dishes Included:`,
      ...currentItems.map((d, i) => `${i + 1}. ${d.name} (₱${parseFloat(d.price || d.unit_price || 0).toFixed(2)}/head)`),
      ``,
      `Generated by Claudine AI at Jo's Diner`
    ]

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('Menu plan copied to clipboard!', 'success')
    }).catch(() => {
      showToast('Could not copy to clipboard.', 'error')
    })
  }

  const dark = isDarkMode

  return (
    <div className={`min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 transition-colors duration-300 ${dark ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'}`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hero Header */}
        <div className="rounded-3xl overflow-hidden shadow-2xl relative" style={{ background: 'linear-gradient(135deg, #9B0B21 0%, #C8102E 50%, #071A3D 100%)' }}>
          <div className="p-6 sm:p-10 text-white relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider">
                  <span className="material-icons text-sm text-amber-300">auto_awesome</span>
                  AI Food Menu Planner
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  AI Budget Menu Recommendations
                </h1>
                <p className="text-white/85 text-xs sm:text-sm font-medium leading-relaxed">
                  Select delicious food options according to your available budget. Type your total budget or budget per person, and our AI will recommend suitable menu combinations so you can compare choices without exceeding your spending limit.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Budget-Aware Menu Choices', 'Compare 3 Menu Options', 'Swap Individual Dishes', '1-Click Add to Order Tray'].map(badge => (
                    <span key={badge} className="text-[11px] bg-black/25 text-white/95 px-3 py-1 rounded-full font-bold border border-white/10">
                      ✓ {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick KPI Widget */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[240px] shrink-0 text-center md:text-right space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-white/70 block">Target Food Budget</span>
                <p className="text-3xl font-black text-amber-300">₱{effectiveTotalBudget.toLocaleString('en-PH')}</p>
                <p className="text-xs text-white/80 font-semibold">
                  ₱{effectivePerHead} / person ({effectiveGuests} {effectiveGuests === 1 ? 'Diner' : 'Diners'})
                </p>
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 w-full py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-sm">tune</span> Adjust Budget
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition cursor-pointer">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/menu')} className="hover:text-[#C8102E] transition cursor-pointer">Menu</button>
          <span>/</span>
          <span className="text-[#C8102E] font-bold">AI Budget Menu Recommendations</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          {[
            { n: 1, label: '1. Type Your Budget & Details', icon: 'tune' },
            { n: 2, label: '2. Compare AI Menu Recommendations', icon: 'auto_awesome' }
          ].map(s => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => s.n <= step && setStep(s.n)}
                disabled={s.n > step && !recommendationData}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-black transition cursor-pointer disabled:cursor-not-allowed ${step === s.n
                    ? 'bg-[#C8102E] text-white shadow-lg shadow-red-900/20'
                    : step > s.n
                      ? 'bg-emerald-600 text-white'
                      : dark ? 'bg-slate-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                  {step > s.n ? '✓' : s.n}
                </span>
                <span>{s.label}</span>
              </button>
              {s.n < 2 && (
                <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#C8102E]' : dark ? 'bg-slate-800' : 'bg-gray-200'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: TYPE BUDGET FORM */}
        {step === 1 && (
          <div className={`rounded-3xl border p-6 sm:p-10 shadow-xl space-y-8 ${dark ? 'bg-[#0B1730] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="border-b pb-4 border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                  <span className="material-icons text-[#C8102E]">account_balance_wallet</span>
                  Type Your Available Budget
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter your target budget to generate menu options that fit your financial requirements.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className={`p-1 rounded-xl border flex items-center gap-1 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setBudgetMode('total')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${budgetMode === 'total'
                      ? 'bg-[#C8102E] text-white shadow-xs'
                      : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                >
                  Total Food Budget (₱)
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMode('perHead')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${budgetMode === 'perHead'
                      ? 'bg-[#C8102E] text-white shadow-xs'
                      : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                >
                  Budget Per Person (₱/pax)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Financial Inputs */}
              <div className="space-y-6">
                {budgetMode === 'total' ? (
                  <div>
                    <label className={`block text-xs sm:text-sm font-extrabold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                      💰 Type Your Food Budget Amount (₱) <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-base font-black text-gray-400">₱</span>
                      <input
                        type="number"
                        value={budget}
                        onChange={e => setBudget(e.target.value)}
                        placeholder="Type your budget here... e.g. 5000"
                        min="100"
                        className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition ${dark ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-[#071A3D] placeholder-gray-400'
                          }`}
                      />
                    </div>
                    {/* Quick Budget Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {QUICK_BUDGETS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setBudget(amt.toString())}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${budget === amt.toString()
                              ? 'bg-[#C8102E] text-white border-[#C8102E]'
                              : dark ? 'bg-slate-800 border-slate-700 text-gray-300 hover:border-gray-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                        >
                          ₱{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`block text-xs sm:text-sm font-extrabold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                      🍽️ Type Budget Per Person (₱/pax) <span className="text-[#C8102E]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-base font-black text-gray-400">₱</span>
                      <input
                        type="number"
                        value={perHeadInput}
                        onChange={e => setPerHeadInput(e.target.value)}
                        placeholder="Type per-person budget... e.g. 350"
                        min="50"
                        className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition ${dark ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-[#071A3D] placeholder-gray-400'
                          }`}
                      />
                    </div>
                  </div>
                )}

                {/* Diners Count */}
                <div>
                  <label className={`block text-xs sm:text-sm font-extrabold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                    👥 Number of Diners / Guests <span className="text-[#C8102E]">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-icons absolute left-4 top-3.5 text-gray-400 text-lg">groups</span>
                    <input
                      type="number"
                      value={guests}
                      onChange={e => setGuests(e.target.value)}
                      placeholder="e.g. 15"
                      min="1"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition ${dark ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-[#071A3D]'
                        }`}
                    />
                  </div>
                  {/* Quick Guest Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {QUICK_GUESTS.map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setGuests(cnt.toString())}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${guests === cnt.toString()
                            ? 'bg-[#C8102E] text-white border-[#C8102E]'
                            : dark ? 'bg-slate-800 border-slate-700 text-gray-300 hover:border-gray-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                      >
                        {cnt} Pax
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Pill */}
                {effectiveTotalBudget > 0 && effectiveGuests > 0 && (
                  <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${dark ? 'bg-blue-950/30 border-blue-800/40 text-blue-200' : 'bg-blue-50/80 border-blue-200 text-blue-900'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-blue-500 text-lg">calculate</span>
                      <div>
                        <p className="text-xs font-bold">Allocated Per Diner</p>
                        <p className="text-base font-black text-[#C8102E]">₱{effectivePerHead} <span className="text-xs font-medium text-gray-400">/ person</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">Total Budget Cap</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">₱{effectiveTotalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Occasion & Dietary Preferences */}
              <div className="space-y-6">
                <div>
                  <label className={`block text-xs sm:text-sm font-extrabold mb-2.5 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                    🍽️ Dining Type / Occasion
                  </label>
                  <div className="space-y-2">
                    {EVENT_TYPES.map(et => {
                      const isSelected = eventType === et.value
                      return (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => setEventType(et.value)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${isSelected
                              ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md'
                              : dark ? 'bg-slate-900 border-slate-700 text-gray-300 hover:border-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                          <div>
                            <span className="font-extrabold block">{et.label}</span>
                            <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{et.desc}</span>
                          </div>
                          {isSelected && <span className="material-icons text-sm">check</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dietary Inclusions */}
                <div>
                  <label className={`block text-xs sm:text-sm font-extrabold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                    🥗 Dietary Preferences &amp; Inclusions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map(opt => {
                      const isChecked = selectedDietary.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleDietary(opt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${isChecked
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : dark ? 'bg-slate-900 border-slate-700 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-black'
                            }`}
                        >
                          <span>{isChecked ? '✓' : '+'}</span>
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Form Action Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span className="material-icons text-emerald-500 text-base">verified_user</span>
                <span>Recommendations will strictly stay within ₱{effectiveTotalBudget.toLocaleString('en-PH')}.</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateRecommendations}
                disabled={loading || effectiveTotalBudget <= 0 || effectiveGuests <= 0}
                className="px-8 py-4 bg-[#C8102E] hover:bg-[#9B0B21] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Allocating Menu Options Within Budget...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-xl text-amber-300">auto_awesome</span>
                    <span>Generate Menu Options for ₱{effectiveTotalBudget.toLocaleString('en-PH')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COMPARATIVE MENU RECOMMENDATIONS DASHBOARD */}
        {step === 2 && recommendationData && (
          <div ref={resultRef} className="space-y-8">

            {/* Top AI Concierge Briefing Card */}
            <div className={`rounded-3xl border p-6 sm:p-8 shadow-xl relative overflow-hidden ${dark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-red-50/70 via-white to-orange-50/50 border-red-100'
              }`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#9B0B21] flex items-center justify-center text-white text-xl font-black shadow-lg shrink-0">
                    🤖
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#C8102E]">Claudine AI Concierge</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        Menu Comparison Ready
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black">
                      Menu Recommendations for ₱{effectiveTotalBudget.toLocaleString('en-PH')} ({effectiveGuests} Diners)
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed max-w-3xl whitespace-pre-line ${dark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      {recommendationData.ai_concierge.advice}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => setStep(1)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${dark ? 'border-slate-700 bg-slate-800 text-gray-200 hover:border-[#C8102E]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#C8102E]'
                      }`}
                  >
                    <span className="material-icons text-sm">edit</span> Change Budget
                  </button>
                </div>
              </div>
            </div>

            {/* 3-TIER COMPARISON CARDS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                  <span className="material-icons text-[#C8102E]">compare</span>
                  Compare 3 Menu Options
                </h3>
                <span className={`text-xs font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select a set to view details or add to your Order Tray
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendationData.packages.map(pkg => {
                  const isSelected = selectedTierId === pkg.id
                  const itemsForTier = customPackageItems[pkg.id] || pkg.items
                  const tierCost = itemsForTier.reduce((sum, i) => sum + (parseFloat(i.price || i.unit_price || 0) * effectiveGuests), 0)
                  const tierRemaining = effectiveTotalBudget - tierCost
                  const tierSavingsPct = effectiveTotalBudget > 0 ? Math.max(0, Math.round((tierRemaining / effectiveTotalBudget) * 100)) : 0
                  const tierCostPerHead = effectiveGuests > 0 ? tierCost / effectiveGuests : 0

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedTierId(pkg.id)}
                      className={`rounded-3xl p-5 sm:p-6 border transition duration-200 cursor-pointer relative flex flex-col justify-between ${isSelected
                          ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40 shadow-2xl scale-[1.01] ' + (dark ? 'bg-slate-800/90' : 'bg-white')
                          : (dark ? 'bg-slate-900/70 border-slate-700 hover:border-slate-500' : 'bg-white/80 border-gray-200 hover:border-gray-400')
                        }`}
                    >
                      {pkg.is_recommended && (
                        <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                          ⭐ Recommended Set
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isSelected
                              ? 'bg-[#C8102E] text-white'
                              : dark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {pkg.badge}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-500">
                            {tierSavingsPct}% Reserve
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base sm:text-lg font-black">{pkg.title}</h4>
                          <p className={`text-xs mt-1 font-medium line-clamp-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {pkg.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-slate-700 space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Estimated Cost</span>
                            <span className="text-lg font-black text-[#C8102E]">
                              ₱{tierCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className={dark ? 'text-gray-400' : 'text-gray-500'}>Cost Per Person</span>
                            <span className="font-bold">₱{tierCostPerHead.toFixed(2)}/pax</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className={dark ? 'text-gray-400' : 'text-gray-500'}>Remaining Savings</span>
                            <span className="font-bold text-emerald-500">
                              +₱{Math.max(0, tierRemaining).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Dishes Preview */}
                        <div className="pt-2 space-y-1">
                          <span className={`text-[11px] font-bold uppercase tracking-wider block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Dishes Included ({itemsForTier.length}):
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {itemsForTier.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-1 rounded-lg bg-gray-50/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60">
                                <img
                                  src={getDishImage(item)}
                                  alt={item.name}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = getCategoryFallbackImage(item)
                                  }}
                                  className="w-7 h-7 rounded-md object-cover shrink-0 border border-black/5 dark:border-white/10"
                                />
                                <span className="font-semibold text-[11px] truncate flex-1 capitalize">{item.name}</span>
                                <span className="text-gray-400 font-bold shrink-0 text-[10px]">₱{parseFloat(item.price).toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setSelectedTierId(pkg.id)}
                          className={`w-full py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${isSelected
                              ? 'bg-[#C8102E] text-white shadow-md'
                              : dark ? 'bg-slate-700 text-gray-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                          <span>{isSelected ? '✓ Currently Selected' : 'Select This Menu Option'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SELECTED MENU DETAILED INSPECTOR & CUSTOMIZER */}
            <div className={`rounded-3xl border p-6 sm:p-8 shadow-xl space-y-6 ${dark ? 'bg-[#0B1730] border-slate-700' : 'bg-white border-gray-200'}`}>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-[#C8102E] text-white px-2.5 py-0.5 rounded-full uppercase">
                        Active Menu
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black">
                        {activePackageData?.title}
                      </h3>
                    </div>
                    <p className={`text-xs sm:text-sm mt-1 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activePackageData?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${dark ? 'border-slate-700 bg-slate-800 text-gray-300 hover:text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      title="Copy menu summary"
                    >
                      <span className="material-icons text-sm">content_copy</span> Copy Menu Summary
                    </button>
                  </div>
                </div>

                {/* Live Budget Progress Bar */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${isOverBudget
                    ? (dark ? 'bg-red-950/40 border-red-800/50' : 'bg-red-50 border-red-200')
                    : (dark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')
                  }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons text-sm text-[#C8102E]">monetization_on</span>
                      <span>Budget Utilization: <strong className="text-base font-black">{currentUtilization}%</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Total: <strong className="text-sm font-black text-[#C8102E]">₱{currentTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></span>
                      <span className="text-gray-400">/</span>
                      <span>Budget: <strong>₱{effectiveTotalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isOverBudget
                          ? 'bg-red-500'
                          : currentUtilization > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      style={{ width: `${Math.min(100, currentUtilization)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={dark ? 'text-gray-400' : 'text-gray-500'}>
                      Per Person: <strong>₱{currentCostPerHead.toFixed(2)}</strong> for {effectiveGuests} diners
                    </span>
                    {isOverBudget ? (
                      <span className="text-red-500 font-black flex items-center gap-1">
                        <span className="material-icons text-sm">warning</span>
                        Over budget by ₱{Math.abs(currentRemaining).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <span className="material-icons text-sm">savings</span>
                        ₱{currentRemaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })} Savings ({currentSavingsPercent}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dishes List with Swapping */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <span className="material-icons text-base text-[#C8102E]">restaurant_menu</span>
                    Dishes in this Menu Set ({currentItems.length})
                  </h4>
                  <span className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Click "Swap" to replace any dish with another affordable favorite!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentItems.map((dish, index) => {
                    const itemUnitPrice = parseFloat(dish.price || dish.unit_price || 0)
                    const itemTotal = itemUnitPrice * effectiveGuests

                    return (
                      <div
                        key={index}
                        className={`rounded-2xl border p-4 transition flex items-start gap-3.5 ${dark ? 'bg-slate-900/90 border-slate-700 hover:border-slate-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0 border border-black/10 dark:border-white/10 relative">
                          <img
                            src={getDishImage(dish)}
                            alt={dish.name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getCategoryFallbackImage(dish)
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-sm font-black truncate">{dish.name}</h5>
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(index)}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition"
                              title="Remove this dish"
                            >
                              <span className="material-icons text-sm">close</span>
                            </button>
                          </div>

                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${dark ? 'bg-slate-800 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'
                            }`}>
                            {dish.category_name || dish.category || 'Specialty'}
                          </span>

                          <div className="flex items-baseline justify-between mt-2 text-xs">
                            <span className="font-extrabold text-[#C8102E]">
                              ₱{itemUnitPrice.toFixed(2)} <span className="font-normal text-[10px] text-gray-400">/portion</span>
                            </span>
                            <span className={`font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                              ×{effectiveGuests} = <strong className="font-black text-emerald-500">₱{itemTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openSwapperForItem(index)}
                              className="text-[11px] font-bold text-[#C8102E] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-icons text-xs">swap_horiz</span>
                              Swap Dish
                            </button>
                            {dish.item_id && (
                              <button
                                type="button"
                                onClick={() => navigate(`/dish/${dish.item_id}`)}
                                className={`text-[11px] font-medium hover:underline ${dark ? 'text-gray-400' : 'text-gray-500'}`}
                              >
                                Dish Details →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* PRIMARY ACTION BUTTON: ADD COMPLETE SET TO ORDER TRAY */}
              <div className="pt-6 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Food Cost Estimate</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₱{currentTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddAllToCart}
                    className="flex-1 sm:flex-none px-8 py-4 bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
                  >
                    <span className="material-icons text-lg">shopping_bag</span>
                    <span>Add Complete Menu to Order Tray</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/menu')}
                    className={`flex-1 sm:flex-none px-5 py-3.5 rounded-2xl border font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${dark ? 'border-slate-700 text-white hover:border-[#C8102E]' : 'border-gray-300 text-[#071A3D] hover:border-[#C8102E]'
                      }`}
                  >
                    <span className="material-icons text-base">restaurant_menu</span>
                    <span>Browse Full Menu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BROWSE ALL DISHES WITHIN YOUR BUDGET */}
            <div className={`rounded-3xl border p-6 sm:p-8 shadow-xl space-y-6 ${dark ? 'bg-[#0B1730] border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <span className="material-icons text-[#C8102E]">menu_book</span>
                    All Dishes Within Your Budget (₱{effectivePerHead}/person)
                  </h3>
                  <p className={`text-xs mt-1 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Single dishes that fit your ₱{effectiveTotalBudget.toLocaleString('en-PH')} budget.
                  </p>
                </div>

                <div className="relative min-w-[200px] sm:w-64">
                  <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-base">search</span>
                  <input
                    type="text"
                    value={dishSearchQuery}
                    onChange={e => setDishSearchQuery(e.target.value)}
                    placeholder="Search affordable dishes..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8102E] ${dark ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800'
                      }`}
                  />
                </div>
              </div>

              {/* Filtered Dishes Grid */}
              {(() => {
                const affordableList = (recommendationData.affordable_dishes || allMenuCatalog)
                  .filter(d => {
                    const matchesSearch = !dishSearchQuery || (d.name || '').toLowerCase().includes(dishSearchQuery.toLowerCase())
                    const matchesCat = catalogCategoryFilter === 'all' || (d.category_name || d.category || '').toLowerCase() === catalogCategoryFilter.toLowerCase()
                    return matchesSearch && matchesCat
                  })

                if (affordableList.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <span className="material-icons text-4xl text-gray-400">search_off</span>
                      <p className={`text-sm font-bold ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No dishes found for this filter.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {affordableList.map((dish, i) => {
                      const unitP = parseFloat(dish.price || 0)
                      const isAlreadyInCurrent = currentItems.some(item => item.item_id === dish.item_id)

                      return (
                        <div
                          key={i}
                          className={`rounded-2xl border p-3.5 flex flex-col justify-between transition hover:border-[#C8102E] ${dark ? 'bg-slate-900/80 border-slate-700' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs sm:text-sm font-black line-clamp-1">{dish.name}</h5>
                              <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                                Fits Budget
                              </span>
                            </div>

                            <p className={`text-[11px] line-clamp-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {dish.description || 'Jo\'s Diner chef specialty'}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-[#C8102E]">₱{unitP.toFixed(2)}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddDishToPackage(dish)}
                              disabled={isAlreadyInCurrent}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${isAlreadyInCurrent
                                  ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-[#C8102E] hover:bg-[#9B0B21] text-white shadow-xs active:scale-95'
                                }`}
                            >
                              <span>{isAlreadyInCurrent ? 'In Menu' : '+ Add to Set'}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

          </div>
        )}

      </div>

      {/* DISH SWAPPER MODAL */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`rounded-3xl border max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col ${dark ? 'bg-[#0B1730] border-slate-700 text-white' : 'bg-white border-gray-200 text-[#071A3D]'
            }`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-slate-700">
              <div>
                <h4 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <span className="material-icons text-[#C8102E]">swap_horiz</span>
                  Swap Dish in Menu
                </h4>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Replacing: <strong className="text-[#C8102E]">{currentItems[swapTargetItemIndex]?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSwapModalOpen(false); setSwapTargetItemIndex(null); }}
                className="text-gray-400 hover:text-red-500 p-1 rounded-lg"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-base">search</span>
              <input
                type="text"
                value={dishSearchQuery}
                onChange={e => setDishSearchQuery(e.target.value)}
                placeholder="Search dishes to swap with..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8102E] ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {allMenuCatalog
                .filter(d => !dishSearchQuery || (d.name || '').toLowerCase().includes(dishSearchQuery.toLowerCase()))
                .map((candidate, idx) => {
                  const unitPrice = parseFloat(candidate.price || 0)
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${dark ? 'bg-slate-900/80 border-slate-700 hover:border-[#C8102E]' : 'bg-gray-50 border-gray-200 hover:border-[#C8102E]'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{candidate.name}</p>
                        <p className={`text-[10px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {candidate.category_name || 'Specialty'} · ₱{unitPrice.toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwapWithDish(candidate)}
                        className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                      >
                        Choose
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default BudgetMenuPage
