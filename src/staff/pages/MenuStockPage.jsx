import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function MenuStockPage(props) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [menuStockCategory, setMenuStockCategory] = useState('all')
  const [menuStockSearch, setMenuStockSearch] = useState('')
  const [menuStockStatus, setMenuStockStatus] = useState('all')

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    try {
      const data = await api.menu.getMenuItems()
      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        setMenuItems(data.data)
      } else if (data.status === 'success' && Array.isArray(data.items) && data.items.length > 0) {
        setMenuItems(data.items)
      }
    } catch (e) {
      console.error('Failed to fetch menu items:', e)
    }

    try {
      const catData = await api.menu.getCategories()
      if (catData.status === 'success' && Array.isArray(catData.data)) {
        setCategories(catData.data)
      } else if (catData.status === 'success' && Array.isArray(catData.categories)) {
        setCategories(catData.categories)
      } else if (Array.isArray(catData)) {
        setCategories(catData)
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  const handleUpdateMenuAvailability = async (itemId, newAvailability) => {
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, availability: newAvailability } : item))
    showToast(`Dish status updated to "${newAvailability}"`, 'success')
    try {
      await api.menu.updateAvailability(itemId, newAvailability)
    } catch (e) {
      // Local state kept
    }
  }

  const filteredStockMenuItems = (menuItems || []).filter(item => {
    if (!item) return false
    const matchesCat = menuStockCategory === 'all' || item.category === menuStockCategory || item.category_id === menuStockCategory || String(item.category_id) === String(menuStockCategory)
    const search = (menuStockSearch || '').toLowerCase().trim()
    const matchesSearch = !search ||
      (item.name || '').toLowerCase().includes(search) ||
      (item.code && String(item.code).toLowerCase().includes(search))
    const matchesStatus = menuStockStatus === 'all' || (item.availability || 'Available') === menuStockStatus
    return matchesCat && matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4 pb-10 text-xs animate-in fade-in duration-150">
      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Menu Items</span>
            <span className="text-xl font-black text-[#C8102E]">{menuItems.length}</span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-red-500/10 text-[#C8102E] flex items-center justify-center font-bold">
            <span className="material-icons text-lg">restaurant_menu</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Available</span>
            <span className="text-xl font-black text-emerald-500">
              {menuItems.filter(i => i.availability === 'Available' || !i.availability).length}
            </span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <span className="material-icons text-lg">check_circle</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Low Stock</span>
            <span className="text-xl font-black text-amber-500">
              {menuItems.filter(i => i.availability === 'Low Stock').length}
            </span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <span className="material-icons text-lg">warning</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sold Out</span>
            <span className="text-xl font-black text-rose-500">
              {menuItems.filter(i => i.availability === 'Sold Out').length}
            </span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <span className="material-icons text-lg">block</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[{ id: 'all', name: 'All Catalog' }, ...categories].map(cat => {
            const catId = cat.id || cat.name || cat.category_name || cat
            const catLabel = cat.name || cat.category_name || cat.label || cat
            return (
              <button
                key={catId}
                onClick={() => setMenuStockCategory(catId)}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition cursor-pointer ${menuStockCategory === catId
                  ? 'bg-[#C8102E] text-white shadow-xs'
                  : isDarkMode ? 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {catLabel}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-icons text-slate-400 absolute left-3 top-2 text-sm">search</span>
            <input
              type="text"
              placeholder="Search dish or code..."
              value={menuStockSearch}
              onChange={(e) => setMenuStockSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
            />
          </div>

          <select
            value={menuStockStatus}
            onChange={(e) => setMenuStockStatus(e.target.value)}
            className={`p-1.5 rounded-xl text-xs font-bold border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
          >
            <option value="all">All Availability</option>
            <option value="Available">Available Only</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Sold Out">Sold Out</option>
          </select>
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredStockMenuItems.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${isDarkMode ? 'bg-[#1C2541]/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <span className="material-icons text-5xl mb-3 opacity-50">inventory_2</span>
          <p className="font-bold text-lg">No stock items found</p>
          <p className="text-sm opacity-70 mt-1">Try adjusting your category or availability filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStockMenuItems.map(dish => {
            const avail = dish.availability || 'Available'
            return (
              <div
                key={dish.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <div>
                  <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3 bg-slate-800">
                    <img
                      src={dish.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80'}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${avail === 'Available' ? 'bg-emerald-500 text-white border-emerald-400' :
                      avail === 'Low Stock' ? 'bg-amber-500 text-slate-950 border-amber-400' :
                        'bg-rose-600 text-white border-rose-500'
                      }`}>
                      {avail}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{dish.code || `DISH-${dish.id}`}</span>
                      <h4 className="font-extrabold text-sm leading-tight mt-0.5">{dish.name}</h4>
                    </div>
                    <span className="font-mono font-black text-sm text-[#C8102E] shrink-0">₱{Number(dish.price).toFixed(2)}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{dish.description || 'Authentic Filipino signature dining specialty.'}</p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>⏱️ {dish.prep_time || '15m'}</span>
                    <span>•</span>
                    <span>🍽️ {dish.serving_size || '1-2 Pax'}</span>
                  </div>
                </div>

                {/* Stock Availability Action Toggles */}
                <div className="border-t pt-3 mt-3 border-slate-200 dark:border-slate-700 flex gap-1">
                  <button
                    onClick={() => handleUpdateMenuAvailability(dish.id, 'Available')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${avail === 'Available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/20'
                      }`}
                  >
                    In Stock
                  </button>
                  <button
                    onClick={() => handleUpdateMenuAvailability(dish.id, 'Low Stock')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${avail === 'Low Stock'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500/20'
                      }`}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => handleUpdateMenuAvailability(dish.id, 'Sold Out')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${avail === 'Sold Out'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500/20'
                      }`}
                  >
                    Out
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
