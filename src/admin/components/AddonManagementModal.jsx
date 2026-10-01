import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import ConfirmationModal from './ConfirmationModal'

const DEFAULT_UNITS = [
  'per event',
  'per hour',
  'per set',
  'per piece',
  'per day',
  'per person'
]

export default function AddonManagementModal({ isOpen, onClose, onAddonsUpdated }) {
  const { showToast } = useToast()

  const [addons, setAddons] = useState([])
  const [categories, setCategories] = useState([])   // loaded from DB
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Form State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState(null)
  const [addonName, setAddonName] = useState('')
  const [addonCode, setAddonCode] = useState('')
  const [addonPrice, setAddonPrice] = useState('')
  const [addonUnit, setAddonUnit] = useState('per event')
  const [addonCategory, setAddonCategory] = useState('')
  const [addonStatus, setAddonStatus] = useState('Available')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete State
  const [addonToDelete, setAddonToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchAddons()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const data = await api.hallAddons.getCategories()
      if (data.status === 'success' && Array.isArray(data.categories)) {
        setCategories(data.categories.map(c => c.category_name))
        // Set default form category to first DB category if not already set
        if (data.categories.length > 0 && !addonCategory) {
          setAddonCategory(data.categories[0].category_name)
        }
      }
    } catch (e) {
      console.warn('Could not load hall add-on categories:', e.message)
    }
  }

  const fetchAddons = async () => {
    setIsLoading(true)
    try {
      const data = await api.hallAddons.getAddons()
      if (data.status === 'success' && Array.isArray(data.addons)) {
        setAddons(data.addons)
        if (onAddonsUpdated) onAddonsUpdated(data.addons)
      } else {
        setAddons([])
      }
    } catch (e) {
      showToast('Could not load hall add-ons from server.', 'error')
      setAddons([])
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEditingAddon(null)
    setAddonName('')
    setAddonCode('')
    setAddonPrice('')
    setAddonUnit('per event')
    setAddonCategory(categories[0] || '')
    setAddonStatus('Available')
    setIsFormOpen(false)
  }

  const handleOpenAddForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (addon) => {
    setEditingAddon(addon)
    setAddonName(addon.addon_name || '')
    setAddonCode(addon.addon_code || '')
    setAddonPrice(String(addon.price || '0'))
    setAddonUnit(addon.unit || 'per event')
    setAddonCategory(addon.category || categories[0] || '')
    setAddonStatus(addon.status || 'Available')
    setIsFormOpen(true)
  }

  const handleSaveAddonSubmit = async (e) => {
    e.preventDefault()
    if (!addonName.trim()) {
      showToast('Please enter an add-on item name.', 'error')
      return
    }
    const numPrice = parseFloat(addonPrice)
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Please enter a valid rental price (₱0 or higher).', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        addon_code: addonCode.trim() || undefined,
        addon_name: addonName.trim(),
        price: numPrice,
        unit: addonUnit.trim() || 'per event',
        category: addonCategory.trim() || categories[0] || 'Equipment & Services',
        status: addonStatus
      }

      if (editingAddon) {
        const res = await api.hallAddons.updateAddon(editingAddon.addon_id, payload)
        if (res.status === 'success') {
          showToast(`Add-on "${payload.addon_name}" updated successfully!`, 'success')
          resetForm()
          await fetchAddons()
        } else {
          showToast(res.message || 'Failed to update add-on.', 'error')
        }
      } else {
        const res = await api.hallAddons.createAddon(payload)
        if (res.status === 'success') {
          showToast(`Add-on "${payload.addon_name}" created successfully!`, 'success')
          resetForm()
          await fetchAddons()
        } else {
          showToast(res.message || 'Failed to create add-on.', 'error')
        }
      }
    } catch (err) {
      showToast(err.message || 'Could not connect to database server.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleAddonStatus = async (addon) => {
    const nextStatus = addon.status === 'Available' ? 'Unavailable' : 'Available'
    try {
      const res = await api.hallAddons.updateAddon(addon.addon_id, {
        ...addon,
        status: nextStatus
      })
      if (res.status === 'success') {
        setAddons(prev => prev.map(a => a.addon_id === addon.addon_id ? { ...a, status: nextStatus } : a))
        showToast(`Add-on "${addon.addon_name}" is now ${nextStatus.toLowerCase()}.`, 'success')
        if (onAddonsUpdated) onAddonsUpdated()
      } else {
        showToast(res.message || 'Failed to toggle availability.', 'error')
      }
    } catch (e) {
      showToast('Could not update status on server.', 'error')
    }
  }

  const handleConfirmDeleteAddon = async () => {
    if (!addonToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.hallAddons.deleteAddon(addonToDelete.addon_id)
      if (res.status === 'success') {
        showToast(`Add-on "${addonToDelete.addon_name}" deleted successfully.`, 'info')
        setAddonToDelete(null)
        await fetchAddons()
      } else {
        showToast(res.message || 'Failed to delete add-on.', 'error')
      }
    } catch (e) {
      showToast('Could not delete add-on from server.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  // Build category filter list: All + DB categories + any extra from existing addon data
  const allCategories = ['All', ...Array.from(new Set([...categories, ...addons.map(a => a.category).filter(Boolean)]))]

  const filteredAddons = addons.filter(a => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      (a.addon_name || '').toLowerCase().includes(query) ||
      (a.addon_code || '').toLowerCase().includes(query) ||
      (a.category || '').toLowerCase().includes(query)

    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#071A3D] rounded-lg max-w-3xl w-full shadow-2xl border border-gray-400 dark:border-slate-700 overflow-hidden flex flex-col max-h-[88vh] my-auto text-[#071A3D] dark:text-white">
        
        {/* Modal Header */}
        <header className="bg-white dark:bg-[#071A3D] border-b border-gray-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#C8102E] flex items-center justify-center font-bold border border-red-200 dark:border-red-900/50 shrink-0">
              <span className="material-icons text-base">extension</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm font-['Russo_One'] uppercase tracking-tight">
                  Function Hall Add-ons
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-[#C8102E] dark:bg-red-950/80 dark:text-red-300 text-[9px] font-black uppercase">
                  {addons.length} items
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={isFormOpen ? resetForm : handleOpenAddForm}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 ${
                isFormOpen
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 border border-gray-300 dark:border-slate-700'
                  : 'bg-[#C8102E] hover:bg-[#9B0B21] text-white'
              }`}
            >
              <span className="material-icons text-sm">{isFormOpen ? 'close' : 'add_circle'}</span>
              <span>{isFormOpen ? 'Cancel' : 'New Add-on'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              title="Close"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="px-3 py-2.5 overflow-y-auto space-y-2.5 text-xs bg-gray-50/50 dark:bg-slate-900/40">
          
          {/* SECTION 1: CREATE / EDIT ADDON FORM (Collapsible) */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveAddonSubmit}
              className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-400 shadow-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                <h4 className="font-black text-xs uppercase text-[#C8102E] flex items-center gap-1.5 font-['Russo_One'] tracking-wide">
                  <span className="material-icons text-sm">{editingAddon ? 'edit' : 'add_box'}</span>
                  <span>{editingAddon ? `Edit Add-on: ${editingAddon.addon_name}` : 'Create New Event Add-on'}</span>
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">* Required fields</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Add-on Name (6 cols) */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Add-on Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Microphones & Mixer"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                {/* Category (3 cols) */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <select
                    value={addonCategory}
                    onChange={(e) => setAddonCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#C8102E]"
                  >
                    {categories.length > 0
                      ? categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      : <option value="">Loading categories...</option>
                    }
                  </select>
                </div>

                {/* Status (3 cols) */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={addonStatus}
                    onChange={(e) => setAddonStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="Available">● Available (Bookable)</option>
                    <option value="Unavailable">○ Unavailable (Hidden)</option>
                  </select>
                </div>

                {/* Price (4 cols) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Rental Price (₱) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">₱</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      placeholder="1500"
                      value={addonPrice}
                      onChange={(e) => setAddonPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>

                {/* Billing Unit (4 cols) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Pricing Unit *
                  </label>
                  <select
                    value={addonUnit}
                    onChange={(e) => setAddonUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#C8102E]"
                  >
                    {DEFAULT_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Custom Item Code (4 cols) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[10.5px] font-black uppercase text-gray-700 dark:text-gray-300">
                    Item Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADD-MIC (Auto if empty)"
                    value={addonCode}
                    onChange={(e) => setAddonCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-400 bg-white dark:bg-slate-800 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-icons text-sm">{isSubmitting ? 'hourglass_top' : 'check'}</span>
                  <span>{isSubmitting ? 'Saving...' : editingAddon ? 'Save Changes' : 'Create Add-on'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: SEARCH & CATEGORY FILTER BAR */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-400 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search add-on name, code, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-400 bg-gray-50/70 dark:bg-slate-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C8102E]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <span className="material-icons text-xs">close</span>
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-300 dark:border-slate-700">
                {['All', 'Available', 'Unavailable'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-[#071A3D] dark:text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-gray-400 mr-1">Category:</span>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs font-black'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: ADD-ONS TABLE / CARDS LIST */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center space-y-2">
                <span className="material-icons text-3xl text-gray-400 animate-spin">refresh</span>
                <p className="text-xs text-gray-400 font-medium">Loading add-on inventory...</p>
              </div>
            ) : filteredAddons.length === 0 ? (
              <div className="p-10 text-center space-y-2.5">
                <span className="material-icons text-4xl text-gray-300 dark:text-slate-600">extension_off</span>
                <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 font-['Russo_One'] uppercase">
                  No Add-ons Found
                </h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'All' || statusFilter !== 'All'
                    ? 'No add-ons match the current filter or search criteria.'
                    : 'No event add-ons configured yet. Click "New Add-on" to create your first add-on.'}
                </p>
                {!isFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="px-3.5 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-bold hover:bg-[#9B0B21] transition shadow-xs cursor-pointer"
                  >
                    Add First Add-on
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 uppercase text-[9px] font-black tracking-wider border-b border-gray-300 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Add-on Item &amp; Category</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {filteredAddons.map((addon) => {
                      const isAvail = addon.status === 'Available'
                      return (
                        <tr key={addon.addon_id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                          {/* Code */}
                          <td className="px-3 py-2 whitespace-nowrap font-mono font-black text-[10px] text-[#C8102E]">
                            {addon.addon_code || `HA-${addon.addon_id}`}
                          </td>

                          {/* Name & Category */}
                          <td className="px-3 py-2">
                            <div className="font-semibold text-xs text-gray-900 dark:text-white leading-snug">
                              {addon.addon_name}
                            </div>
                            <span className="inline-block px-1 py-0.5 rounded text-[8px] font-black uppercase bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 mt-0.5">
                              {addon.category}
                            </span>
                          </td>

                          {/* Rate */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="font-mono font-black text-xs text-[#C8102E]">₱{parseFloat(addon.price || 0).toLocaleString()}</div>
                            <div className="text-[9px] text-gray-400">/ {addon.unit || 'per event'}</div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleAddonStatus(addon)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition cursor-pointer active:scale-95 ${
                                isAvail
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                  : 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200'
                              }`}
                              title="Click to toggle"
                            >
                              {isAvail ? '● Available' : '○ Unavailable'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(addon)}
                                className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Edit"
                              >
                                <span className="material-icons text-sm">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddonToDelete(addon)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Delete"
                              >
                                <span className="material-icons text-sm">delete_outline</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <footer className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            Showing {filteredAddons.length} of {addons.length} add-ons.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </footer>

      </div>

      {/* Confirmation Modal for deleting an add-on */}
      <ConfirmationModal
        isOpen={Boolean(addonToDelete)}
        title="Delete Add-on Item?"
        message={`Are you sure you want to permanently delete "${addonToDelete?.addon_name}"? This item will no longer be available for event bookings.`}
        confirmText="Delete Add-on"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteAddon}
        onClose={() => setAddonToDelete(null)}
      />
    </div>
  )
}
