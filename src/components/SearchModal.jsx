import { useState, useEffect } from 'react'

const recentLocations = [
  { id: 1, title: 'Current Location', desc: 'Polomolok, South Cotabato', icon: 'my_location', isGps: true },
  { id: 2, title: 'Jo\'s Diner Main Branch', desc: 'Lerio St, cor Cadena de Amor, Polomolok', icon: 'storefront' },
  { id: 3, title: 'Jo\'s Diner Function Hall', desc: 'Lerio St, Polomolok, South Cotabato', icon: 'corporate_fare' },
]

const foodpandaCategories = [
  { name: 'Catering Packages', count: '12 Packages', icon: 'bento', color: 'bg-red-50 text-[#C8102E]' },
  { name: 'Party Trays (10-20 Pax)', count: '24 Platters', icon: 'dinner_dining', color: 'bg-amber-50 text-amber-800' },
  { name: 'Function Hall Booking', count: 'Available Now', icon: 'corporate_fare', color: 'bg-blue-50 text-blue-900' },
  { name: 'Solo Bento Meals', count: 'From ₱185', icon: 'rice_bowl', color: 'bg-emerald-50 text-emerald-800' },
]

const menuSearchDatabase = [
  { name: 'Crispy Lechon Kawali Tray', type: 'Party Tray', price: '₱1,650', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80' },
  { name: 'Pork Sisig Platter', type: 'Party Tray', price: '₱1,250', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80' },
  { name: 'Grand Fiesta Buffet Catering', type: 'Catering', price: '₱8,500', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chicken Inasal Bento', type: 'Solo Meal', price: '₱199', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80' },
]

function SearchModal({ isOpen, onClose, isDarkMode, onSelectLocation }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredItems = query.trim() === ''
    ? []
    : menuSearchDatabase.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start sm:items-center justify-center pt-8 sm:pt-0 px-3 sm:px-4">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className={`relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 transform animate-in fade-in zoom-in-95 duration-200 z-10 ${
        isDarkMode 
          ? 'bg-[#071A3D] border-slate-700 text-white' 
          : 'bg-white border-gray-200 text-[#071A3D]'
      }`}>
        
        {/* Foodpanda Top Location / Search Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'bg-[#040D21] border-slate-800' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#C8102E] flex items-center gap-1">
              <span className="material-icons text-sm">search</span>
              <span>Food & Event Search</span>
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="material-icons absolute left-3.5 text-[#C8102E] text-lg">search</span>
            <input
              type="text"
              autoFocus
              placeholder="Search for address, dishes, or catering packages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] transition ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5 scrollbar-none">
          
          {query.trim() === '' ? (
            <>
              {/* Use Current Location Action */}
              <button
                onClick={() => {
                  if (onSelectLocation) onSelectLocation('Quezon City, Metro Manila')
                  onClose()
                }}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 transition text-left group ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800' 
                    : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#C8102E] text-white flex items-center justify-center shrink-0 shadow">
                  <span className="material-icons text-lg">my_location</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#C8102E] group-hover:underline flex items-center gap-1">
                    <span>Use current location</span>
                    <span className="material-icons text-xs">chevron_right</span>
                  </h4>
                  <p className="text-[10px] text-gray-400">Find Jo's Diner branch in Polomolok</p>
                </div>
              </button>

              {/* Saved Recent Locations */}
              <div>
                <h3 className={`text-[11px] font-extrabold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Saved Locations
                </h3>
                <div className="space-y-1.5">
                  {recentLocations.slice(1).map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => {
                        if (onSelectLocation) onSelectLocation(loc.desc)
                        onClose()
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isDarkMode 
                          ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-gray-400 text-lg">{loc.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold">{loc.title}</h4>
                          <p className="text-[10px] text-gray-400">{loc.desc}</p>
                        </div>
                      </div>
                      <span className="material-icons text-xs text-gray-400">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foodpanda Style Offerings Grid */}
              <div>
                <h3 className={`text-[11px] font-extrabold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Browse Offerings
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {foodpandaCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setQuery(cat.name)
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        isDarkMode 
                          ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' 
                          : 'bg-gray-50 border-gray-200 hover:bg-white'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <span className="material-icons text-lg">{cat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{cat.name}</h4>
                        <p className="text-[10px] text-gray-400">{cat.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Live Filter Results */
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400">Search results for "{query}":</p>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 space-y-1">
                  <span className="material-icons text-3xl text-gray-400">search_off</span>
                  <p className="text-xs font-bold">No matching results found</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={onClose}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isDarkMode 
                        ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-xs font-bold truncate">{item.name}</h4>
                        <span className="text-[10px] text-gray-400">{item.type}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#C8102E]">{item.price}</span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default SearchModal
