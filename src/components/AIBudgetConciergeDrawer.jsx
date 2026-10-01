import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { useToast } from './ToastNotification'

// Fallback curated food photography for various culinary categories
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
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80'
}

export function getCategoryFallbackImage(item) {
  const text = `${item?.name || ''} ${item?.category_name || ''} ${item?.category || ''}`.toLowerCase()
  if (text.includes('mango') || text.includes('float') || text.includes('dessert') || text.includes('flan') || text.includes('buko') || text.includes('cake') || text.includes('sweet') || text.includes('ice cream')) {
    return CATEGORY_DEFAULT_IMAGES.dessert
  }
  if (text.includes('spaghetti') || text.includes('carbonara') || text.includes('pasta') || text.includes('pancit') || text.includes('noodle') || text.includes('bihon') || text.includes('canton')) {
    return CATEGORY_DEFAULT_IMAGES.pasta
  }
  if (text.includes('tuna') || text.includes('kinilaw') || text.includes('fish') || text.includes('seafood') || text.includes('shrimp') || text.includes('bangus') || text.includes('squid') || text.includes('calamares')) {
    return CATEGORY_DEFAULT_IMAGES.seafood
  }
  if (text.includes('chicken') || text.includes('cordon') || text.includes('inasal') || text.includes('wings') || text.includes('manok') || text.includes('poultry')) {
    return CATEGORY_DEFAULT_IMAGES.chicken
  }
  if (text.includes('beef') || text.includes('steak') || text.includes('bulalo') || text.includes('caldereta') || text.includes('kare-kare') || text.includes('bistek')) {
    return CATEGORY_DEFAULT_IMAGES.beef
  }
  if (text.includes('chopsuey') || text.includes('vegetable') || text.includes('pinakbet') || text.includes('salad') || text.includes('gulay')) {
    return CATEGORY_DEFAULT_IMAGES.vegetables
  }
  if (text.includes('pork') || text.includes('sisig') || text.includes('lechon') || text.includes('liempo') || text.includes('pata') || text.includes('bbq') || text.includes('barbecue')) {
    return CATEGORY_DEFAULT_IMAGES.pork
  }
  if (text.includes('tea') || text.includes('juice') || text.includes('drink') || text.includes('beverage') || text.includes('shake') || text.includes('soda')) {
    return CATEGORY_DEFAULT_IMAGES.drinks
  }
  if (text.includes('rice') || text.includes('kanin')) {
    return CATEGORY_DEFAULT_IMAGES.rice
  }
  if (text.includes('lumpia') || text.includes('appetizer') || text.includes('roll') || text.includes('finger food')) {
    return CATEGORY_DEFAULT_IMAGES.appetizer
  }
  return CATEGORY_DEFAULT_IMAGES.default
}

export function getDishImage(item) {
  if (item?.image && typeof item.image === 'string' && item.image.trim().length > 10) {
    return item.image
  }
  return getCategoryFallbackImage(item)
}

export default function AIBudgetConciergeDrawer({ isOpen, onClose, isDarkMode, onAddToCart }) {
  const { showToast } = useToast()
  const dark = isDarkMode

  const [messages, setMessages] = useState([])
  const [inputVal, setInputVal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      scrollToBottom()
    } else {
      document.body.style.overflow = ''
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [messages, isOpen, onClose])

  const handleSend = async (customPrompt) => {
    const query = customPrompt || inputVal.trim()
    if (!query || isLoading) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!customPrompt) setInputVal('')
    setIsLoading(true)

    try {
      // 3-second realistic thinking delay
      const [res] = await Promise.all([
        api.ai.chat(query),
        new Promise(resolve => setTimeout(resolve, 3000))
      ])

      if (res && res.status === 'success') {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.reply || "Here are meal recommendations from Jo's Diner:",
          packages: res.packages || null,
          dish: res.dish || null,
          dishes: res.dishes || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const fallbackMsg = res?.reply || "I couldn't process that right now. Please try typing a budget like '₱350' or 'best sellers'!"
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackMsg,
          packages: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }
    } catch (err) {
      console.error('AI Concierge error:', err)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I'm having trouble connecting to Jo's Diner menu server. Please try again in a moment!",
        packages: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPackageToCart = (pkg) => {
    if (!onAddToCart || !pkg?.items) return
    let count = 0

    pkg.items.forEach(dish => {
      onAddToCart({
        id: dish.item_id || Math.random().toString(),
        name: dish.name,
        price: parseFloat(dish.price || dish.unit_price || 0),
        finalPrice: parseFloat(dish.price || dish.unit_price || 0),
        quantity: 1,
        category: dish.category_name || 'AI Concierge Set',
        image: getDishImage(dish),
        specialInstructions: `From AI Concierge (${pkg.title})`
      })
      count++
    })

    if (showToast) {
      showToast(`Added ${count} items from "${pkg.title}" to your Order Tray!`, 'success')
    }
  }

  const handleResetChat = () => {
    setMessages([])
  }

  const quickPrompts = [
    { label: '₱150 Student Sulit', query: 'I have ₱150 budget for solo meal' },
    { label: '₱250 Worker Lunch', query: 'Recommend ₱250 meal with rice and drink' },
    { label: '₱350 Diner Favorites', query: 'Budget ₱350 for 1 person with pork BBQ or inasal' },
    { label: '₱500 Duo Sizzlers (2p)', query: 'Budget ₱500 for 2 people' },
    { label: '₱1,000 Group Banquet (5p)', query: 'Budget ₱1,000 for 5 people family dinner' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 transition-opacity animate-in fade-in duration-150">
      {/* Clickable Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-in Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className={`w-screen max-w-md sm:max-w-lg shadow-2xl flex flex-col justify-between border-l transition-colors duration-300 animate-in slide-in-from-right duration-300 ${
          dark
            ? 'bg-[#071A3D] border-slate-700 text-white'
            : 'bg-white border-gray-200 text-[#071A3D]'
        }`}>

          {/* Sidebar Header with Brand Font Styling */}
          <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${
            dark ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-200 text-[#071A3D]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#C8102E] to-[#E53935] text-white flex items-center justify-center shadow-xs border border-white/20">
                  <span className="material-icons text-xl sm:text-2xl">smart_toy</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div className="flex flex-col justify-center leading-none">
                <div className="flex items-center gap-2">
                  <h2 className="jos-diner-brand-title text-sm sm:text-base font-black leading-none tracking-wide text-left">
                    CLAUDINE AI CONCIERGE
                  </h2>
                  <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    Online
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-gray-500 dark:text-gray-400 tracking-widest flex items-center gap-1 mt-1 leading-none uppercase">
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                  <span className="whitespace-nowrap">Smart Budget &amp; Meal Pairings</span>
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Reset Conversation"
              >
                <span className="material-icons text-lg">refresh</span>
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close AI Concierge"
              >
                <span className="material-icons text-base sm:text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Quick Ideas Chips Bar */}
          <div className={`px-3.5 sm:px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
            dark ? 'bg-[#040D21] border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 shrink-0 flex items-center gap-1">
              <span className="material-icons text-xs text-amber-500">lightbulb</span>
              <span>Ideas:</span>
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.query)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 border transition cursor-pointer active:scale-95 whitespace-nowrap ${
                  dark
                    ? 'bg-slate-900 border-slate-700 hover:border-[#C8102E] text-gray-300'
                    : 'bg-white border-gray-200 hover:border-[#C8102E] text-gray-700 shadow-2xs'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Feed Area */}
          <div className={`flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 transition-colors ${
            dark ? 'bg-[#040D21]/60' : 'bg-[#F8FAFC]'
          }`}>
            {messages.length === 0 && (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-3.5 my-auto animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C8102E] to-[#E53935] text-white flex items-center justify-center shadow-lg border border-white/20">
                  <span className="material-icons text-2xl sm:text-3xl">smart_toy</span>
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="jos-diner-brand-title text-sm sm:text-base font-black tracking-wide">
                    JO'S DINER FOOD CONCIERGE
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Type your food budget below (e.g. <strong>₱200</strong>, <strong>₱350</strong>) or click an idea above to start!
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai'

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-7 h-7 rounded-lg bg-[#C8102E] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs mt-0.5">
                      <span className="material-icons text-xs">smart_toy</span>
                    </div>
                  )}

                  <div className={`max-w-[88%] sm:max-w-[85%] space-y-2.5 ${
                    isAI
                      ? (dark ? 'bg-[#071A3D] border border-slate-700 text-gray-100' : 'bg-white border border-gray-200 text-[#071A3D] shadow-xs')
                      : 'bg-[#C8102E] text-white shadow-xs'
                  } p-3.5 rounded-xl`}>

                    {/* Message Text */}
                    <div className="text-xs font-medium leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Embedded Interactive Meal Cards (if any) */}
                    {msg.packages && msg.packages.length > 0 && (
                      <div className="space-y-3 pt-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b pb-1 border-gray-200 dark:border-slate-700 flex items-center justify-between">
                          <span>Select a Curated Set:</span>
                          <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                            <span className="material-icons text-[11px]">photo_camera</span>
                            <span>With Photos</span>
                          </span>
                        </div>

                        {msg.packages.map((pkg, pIdx) => (
                          <div
                            key={pIdx}
                            className={`rounded-xl p-3 sm:p-3.5 border transition-all space-y-2.5 ${
                              dark ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600' : 'bg-gray-50/90 border-gray-200 hover:border-gray-300 shadow-xs'
                            }`}
                          >
                            {/* Badges Bar */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#C8102E] text-white shadow-2xs">
                                {pkg.badge}
                              </span>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Pasok sa Budget
                              </span>
                            </div>

                            {/* Visual Dish Photo Preview Strip */}
                            {pkg.items && pkg.items.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80">
                                {pkg.items.slice(0, 3).map((dishItem, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="relative aspect-[4/3] rounded-md overflow-hidden bg-slate-200 dark:bg-slate-900 border border-black/5 dark:border-white/5 group"
                                  >
                                    <img
                                      src={getDishImage(dishItem)}
                                      alt={dishItem.name}
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src = getCategoryFallbackImage(dishItem)
                                      }}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-1 left-1 right-1 leading-tight">
                                      <span className="block text-[9px] font-black text-white truncate capitalize drop-shadow-sm">
                                        {dishItem.name}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Set Title and Pricing */}
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                                {pkg.title}
                              </h4>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xs text-gray-500 font-bold">Total Meal Cost:</span>
                                <span className="text-sm font-black text-[#C8102E] dark:text-red-400">
                                  ₱{pkg.total_estimated_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                <span>Sukli / Savings:</span>
                                <span>+₱{pkg.remaining_budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            {/* Inclusions with Dish Thumbnails */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-slate-700">
                              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between px-0.5">
                                <span>Included Dishes ({pkg.items?.length || 0}):</span>
                                <span>Price</span>
                              </div>

                              {pkg.items?.map((item, iIdx) => {
                                const dishImg = getDishImage(item)
                                return (
                                  <div
                                    key={iIdx}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border transition ${
                                      dark
                                        ? 'bg-slate-800/80 border-slate-700/80 text-gray-200'
                                        : 'bg-white border-gray-200 text-gray-800 shadow-2xs'
                                    }`}
                                  >
                                    {/* Thumbnail Image */}
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md overflow-hidden bg-gray-100 dark:bg-slate-900 shrink-0 border border-gray-200/80 dark:border-slate-700 relative">
                                      <img
                                        src={dishImg}
                                        alt={item.name}
                                        loading="lazy"
                                        onError={(e) => {
                                          e.target.onerror = null
                                          e.target.src = getCategoryFallbackImage(item)
                                        }}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>

                                    {/* Name & Category */}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-bold text-gray-900 dark:text-white capitalize truncate leading-tight">
                                        {item.name}
                                      </h5>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          dark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {item.category_name || item.category || 'Specialty'}
                                        </span>
                                        {item.serving_size && (
                                          <span className="text-[9px] text-gray-400 font-medium truncate">
                                            {item.serving_size}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-black text-[#C8102E] dark:text-red-400">
                                        ₱{parseFloat(item.price || item.unit_price || 0).toFixed(0)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* 1-Click Order Button */}
                            <button
                              type="button"
                              onClick={() => handleAddPackageToCart(pkg)}
                              className="w-full py-2.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 mt-1"
                            >
                              <span className="material-icons text-sm">add_shopping_cart</span>
                              <span>Add this set to Tray</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Embedded Single Dish Result (if any) */}
                    {msg.dish && (
                      <div className={`rounded-xl p-3 border transition-all space-y-2.5 mt-2 ${
                        dark ? 'bg-slate-900/90 border-slate-700' : 'bg-gray-50/90 border-gray-200 shadow-xs'
                      }`}>
                        <div className="flex gap-3 items-center">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 shrink-0 border border-gray-200/80 dark:border-slate-700">
                            <img
                              src={getDishImage(msg.dish)}
                              alt={msg.dish.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = getCategoryFallbackImage(msg.dish)
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white capitalize truncate">
                              {msg.dish.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                dark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {msg.dish.category_name || msg.dish.category || 'Specialty'}
                              </span>
                              <span className="text-[10px] font-black text-[#C8102E] dark:text-red-400">
                                ₱{parseFloat(msg.dish.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {onAddToCart && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddToCart({
                                id: msg.dish.item_id || Math.random().toString(),
                                name: msg.dish.name,
                                price: parseFloat(msg.dish.price || 0),
                                finalPrice: parseFloat(msg.dish.price || 0),
                                quantity: 1,
                                category: msg.dish.category_name || 'AI Concierge',
                                image: getDishImage(msg.dish),
                                specialInstructions: 'From Claudine AI Recommendation'
                              })
                              showToast(`Added "${msg.dish.name}" to your Order Tray!`, 'success')
                            }}
                            className="w-full py-2 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <span className="material-icons text-sm">add_shopping_cart</span>
                            <span>Add this dish to Tray</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className={`text-[9px] font-bold ${isAI ? 'text-gray-400' : 'text-white/80'} text-right`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-center animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-[#C8102E] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                  <span className="material-icons text-xs">smart_toy</span>
                </div>
                <div className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 shadow-2xs ${
                  dark ? 'bg-[#071A3D] border-slate-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Computing budget meal set...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Input Bar at Bottom of Sidebar */}
          <div className={`p-3 sm:p-3.5 border-t shrink-0 ${
            dark ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type budget (e.g. ₱350 solo meal)..."
                className={`w-full py-2 px-3.5 rounded-xl text-xs font-semibold outline-none border transition-all ${
                  dark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-[#C8102E]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#C8102E]'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputVal.trim()}
                className="bg-[#C8102E] hover:bg-[#9B0B21] disabled:opacity-50 text-white font-black px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                <span className="material-icons text-sm">send</span>
                <span className="hidden xs:inline">Ask AI</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
