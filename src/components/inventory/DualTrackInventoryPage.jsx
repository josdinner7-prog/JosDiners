import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../ToastNotification'
import api from '../../services/api'

// Preset Categories
const PERISHABLE_CATEGORIES = [
  'All',
  'Meat & Poultry',
  'Seafood',
  'Fresh Produce',
  'Dairy & Eggs',
  'Grains & Pasta',
  'Pantry Supplies',
  'Beverages'
]

const ASSET_CATEGORIES = [
  'All',
  'Furniture & Seating',
  'Buffet & Chafers',
  'Chinaware & Cutlery',
  'Audio & Visual',
  'Linens & Drapery',
  'Lighting & Stage'
]

export default function DualTrackInventoryPage({ isStaff = false }) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()
  const isDarkMode = context.isDarkMode ?? false

  // Main Dual-Track Tabs: 'perishables', 'assets', 'planner', 'logs'
  const [activeTab, setActiveTab] = useState('perishables')

  // Summary Metrics
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Track 1: Perishables State
  const [perishables, setPerishables] = useState([])
  const [perishableCategory, setPerishableCategory] = useState('All')
  const [perishableSearch, setPerishableSearch] = useState('')
  const [perishableFilter, setPerishableFilter] = useState('all') // 'all', 'low_stock', 'expiring'

  // Track 2: Reusable Assets State
  const [assets, setAssets] = useState([])
  const [assetCategory, setAssetCategory] = useState('All')
  const [assetSearch, setAssetSearch] = useState('')

  // Track 2: Event Allocations & Planner State
  const [allocations, setAllocations] = useState([])
  const [plannerDate, setPlannerDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dateAvailability, setDateAvailability] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([])

  // Modals
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [isAddPerishableOpen, setIsAddPerishableOpen] = useState(false)
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  // Active Selection for Modals
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedAllocation, setSelectedAllocation] = useState(null)

  // Form states
  const [usageForm, setUsageForm] = useState({
    quantity: '',
    change_type: 'usage',
    event_title: '',
    reservation_id: '',
    logged_by: isStaff ? 'Staff Member' : 'Inventory Admin',
    remarks: ''
  })

  const [restockForm, setRestockForm] = useState({
    quantity: '',
    new_expiry_date: '',
    supplier: '',
    logged_by: isStaff ? 'Staff Member' : 'Inventory Admin',
    remarks: ''
  })

  const [perishableForm, setPerishableForm] = useState({
    item_code: '',
    item_name: '',
    category: 'Meat & Poultry',
    quantity_on_hand: '',
    unit: 'kg',
    min_threshold: '10',
    cost_per_unit: '',
    supplier: '',
    storage_location: 'Walk-in Meat Freezer',
    expiry_date: '',
    notes: ''
  })

  const [assetForm, setAssetForm] = useState({
    asset_code: '',
    asset_name: '',
    category: 'Furniture & Seating',
    total_quantity: '20',
    unit: 'pcs',
    replacement_cost: '1500',
    condition_status: 'Good',
    storage_location: 'Warehouse Bay 1',
    notes: ''
  })

  const [allocationForm, setAllocationForm] = useState({
    asset_id: '',
    reservation_id: '',
    event_title: '',
    event_date: new Date().toISOString().split('T')[0],
    allocated_quantity: 1,
    remarks: ''
  })

  const [returnForm, setReturnForm] = useState({
    returned_by: isStaff ? 'Staff Member' : 'Inventory Admin',
    damaged_qty: 0,
    missing_qty: 0,
    remarks: ''
  })

  // Initial Load
  useEffect(() => {
    loadAllData()
  }, [])

  // When date in planner changes
  useEffect(() => {
    if (activeTab === 'planner' && plannerDate) {
      loadDateAvailability(plannerDate)
    }
  }, [plannerDate, activeTab])

  const loadAllData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchSummary(),
      fetchPerishables(),
      fetchAssets(),
      fetchAllocations(),
      fetchUpcomingEvents(),
      fetchAuditLogs()
    ])
    setIsLoading(false)
  }

  const fetchSummary = async () => {
    try {
      const res = await api.inventory.getSummary()
      if (res?.status === 'success') {
        setSummary(res.data)
      }
    } catch (e) {
      console.error('Failed to load inventory summary:', e)
    }
  }

  const fetchPerishables = async () => {
    try {
      const res = await api.inventory.getPerishables()
      if (res?.status === 'success') {
        setPerishables(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load perishables:', e)
    }
  }

  const fetchAssets = async () => {
    try {
      const res = await api.inventory.getAssets()
      if (res?.status === 'success') {
        setAssets(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load assets:', e)
    }
  }

  const fetchAllocations = async () => {
    try {
      const res = await api.inventory.getAllocations()
      if (res?.status === 'success') {
        setAllocations(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load allocations:', e)
    }
  }

  const fetchUpcomingEvents = async () => {
    try {
      const res = await api.reservations.getReservations({ limit: 40 })
      const list = res?.reservations || res?.data || []
      const filtered = list.filter(r => r.status !== 'Cancelled' && r.status !== 'Completed')
      setUpcomingEvents(filtered)
    } catch (e) {
      console.error('Failed to load events for allocation:', e)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await api.inventory.getPerishableLogs({ limit: 40 })
      if (res?.status === 'success') {
        setAuditLogs(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load logs:', e)
    }
  }

  const loadDateAvailability = async (date) => {
    try {
      const res = await api.inventory.getAssetAvailability(date)
      if (res?.status === 'success') {
        setDateAvailability(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load availability for date:', e)
    }
  }

  // Action: Log Usage
  const handleLogUsageSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || !usageForm.quantity) return
    try {
      const res = await api.inventory.logPerishableChange(selectedItem.item_id, usageForm)
      if (res?.status === 'success') {
        showToast(res.message || 'Stock usage logged successfully!', 'success')
        setIsUsageModalOpen(false)
        setUsageForm({
          quantity: '',
          change_type: 'usage',
          event_title: '',
          reservation_id: '',
          logged_by: isStaff ? 'Staff Member' : 'Inventory Admin',
          remarks: ''
        })
        fetchPerishables()
        fetchSummary()
        fetchAuditLogs()
      } else {
        showToast(res?.message || 'Failed to log usage.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error logging stock usage.', 'error')
    }
  }

  // Action: Restock Batch
  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || !restockForm.quantity) return
    try {
      const payload = {
        change_type: 'restock',
        quantity: restockForm.quantity,
        new_expiry_date: restockForm.new_expiry_date || null,
        logged_by: restockForm.logged_by,
        remarks: restockForm.supplier ? `Supplier: ${restockForm.supplier}. ${restockForm.remarks}` : restockForm.remarks
      }
      const res = await api.inventory.logPerishableChange(selectedItem.item_id, payload)
      if (res?.status === 'success') {
        showToast(res.message || 'Stock received and restocked!', 'success')
        setIsRestockModalOpen(false)
        setRestockForm({
          quantity: '',
          new_expiry_date: '',
          supplier: '',
          logged_by: isStaff ? 'Staff Member' : 'Inventory Admin',
          remarks: ''
        })
        fetchPerishables()
        fetchSummary()
        fetchAuditLogs()
      }
    } catch (err) {
      showToast(err.message || 'Error logging restock.', 'error')
    }
  }

  // Action: Add Perishable
  const handleAddPerishableSubmit = async (e) => {
    e.preventDefault()
    if (!perishableForm.item_name || !perishableForm.unit) {
      showToast('Please enter item name and unit.', 'warning')
      return
    }
    try {
      const res = await api.inventory.createPerishable(perishableForm)
      if (res?.status === 'success') {
        showToast('New perishable ingredient added to inventory!', 'success')
        setIsAddPerishableOpen(false)
        setPerishableForm({
          item_code: '',
          item_name: '',
          category: 'Meat & Poultry',
          quantity_on_hand: '',
          unit: 'kg',
          min_threshold: '10',
          cost_per_unit: '',
          supplier: '',
          storage_location: 'Walk-in Meat Freezer',
          expiry_date: '',
          notes: ''
        })
        fetchPerishables()
        fetchSummary()
      }
    } catch (err) {
      showToast(err.message || 'Error creating perishable.', 'error')
    }
  }

  // Action: Add Reusable Asset
  const handleAddAssetSubmit = async (e) => {
    e.preventDefault()
    if (!assetForm.asset_name) {
      showToast('Please enter asset name.', 'warning')
      return
    }
    try {
      const res = await api.inventory.createAsset(assetForm)
      if (res?.status === 'success') {
        showToast('New reusable catering asset added to inventory!', 'success')
        setIsAddAssetOpen(false)
        setAssetForm({
          asset_code: '',
          asset_name: '',
          category: 'Furniture & Seating',
          total_quantity: '20',
          unit: 'pcs',
          replacement_cost: '1500',
          condition_status: 'Good',
          storage_location: 'Warehouse Bay 1',
          notes: ''
        })
        fetchAssets()
        fetchSummary()
      }
    } catch (err) {
      showToast(err.message || 'Error creating asset.', 'error')
    }
  }

  // Action: Allocate Asset to Event
  const handleAllocateSubmit = async (e) => {
    e.preventDefault()
    if (!allocationForm.asset_id || !allocationForm.event_title || !allocationForm.event_date) {
      showToast('Please select an asset, event title, and date.', 'warning')
      return
    }
    try {
      const res = await api.inventory.createAllocation(allocationForm)
      if (res?.status === 'success') {
        showToast(res.message || 'Equipment allocated to event successfully!', 'success')
        setIsAllocateModalOpen(false)
        setAllocationForm({
          asset_id: '',
          reservation_id: '',
          event_title: '',
          event_date: new Date().toISOString().split('T')[0],
          allocated_quantity: 1,
          remarks: ''
        })
        fetchAllocations()
        fetchAssets()
        fetchSummary()
        if (plannerDate) loadDateAvailability(plannerDate)
      }
    } catch (err) {
      showToast(err.message || 'Could not allocate equipment.', 'error')
    }
  }

  // Action: Dispatch Allocation
  const handleDispatchAllocation = async (alloc) => {
    try {
      const res = await api.inventory.dispatchAllocation(alloc.allocation_id, {
        dispatched_by: isStaff ? 'Staff Member' : 'Inventory Admin'
      })
      if (res?.status === 'success') {
        showToast(`Dispatched ${alloc.allocated_quantity} ${alloc.unit} of "${alloc.asset_name}" to venue!`, 'success')
        fetchAllocations()
        fetchSummary()
      }
    } catch (err) {
      showToast(err.message || 'Error dispatching allocation.', 'error')
    }
  }

  // Action: Return Allocation Submit
  const handleReturnSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAllocation) return
    try {
      const res = await api.inventory.returnAllocation(selectedAllocation.allocation_id, returnForm)
      if (res?.status === 'success') {
        showToast(res.message || 'Asset return processed successfully!', 'success')
        setIsReturnModalOpen(false)
        setSelectedAllocation(null)
        setReturnForm({
          returned_by: isStaff ? 'Staff Member' : 'Inventory Admin',
          damaged_qty: 0,
          missing_qty: 0,
          remarks: ''
        })
        fetchAllocations()
        fetchAssets()
        fetchSummary()
      }
    } catch (err) {
      showToast(err.message || 'Error processing return.', 'error')
    }
  }

  // Filtered Perishables
  const filteredPerishables = perishables.filter(item => {
    const matchesCat = perishableCategory === 'All' || item.category === perishableCategory
    const matchesSearch = !perishableSearch ||
      item.item_name?.toLowerCase().includes(perishableSearch.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(perishableSearch.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(perishableSearch.toLowerCase())
    const matchesFilter =
      perishableFilter === 'all' ||
      (perishableFilter === 'low_stock' && (item.status === 'Low Stock' || item.status === 'Out of Stock')) ||
      (perishableFilter === 'expiring' && item.days_until_expiry !== null && item.days_until_expiry <= 7)
    return matchesCat && matchesSearch && matchesFilter
  })

  // Filtered Reusable Assets
  const filteredAssets = assets.filter(asset => {
    const matchesCat = assetCategory === 'All' || asset.category === assetCategory
    const matchesSearch = !assetSearch ||
      asset.asset_name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.asset_code?.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.storage_location?.toLowerCase().includes(assetSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-5 font-sans">
      
      {/* 1. PAGE HEADER & ACTIONS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            Dual-Track Inventory System
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Seamlessly monitor consumable perishable ingredients alongside date-allocated reusable event hardware to power flawless catering banquets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddPerishableOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base text-[#C8102E]">egg_alt</span>
            <span>Add Ingredient</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddAssetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base text-blue-600">chair</span>
            <span>Add Event Asset</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAllocationForm(prev => ({
                ...prev,
                event_date: plannerDate || new Date().toISOString().split('T')[0]
              }))
              setIsAllocateModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base">event_seat</span>
            <span>Allocate to Event</span>
          </button>
        </div>
      </header>

      {/* 2. METRICS & SUMMARY CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Perishable Stock Health */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-[#C8102E] flex items-center justify-center border border-rose-200 shrink-0">
            <span className="material-icons text-2xl">soup_kitchen</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Track 1: Consumables</span>
            <span className="text-xl font-black text-[#071A3D] tracking-tight">
              {summary?.perishables?.total_items || perishables.length} Items
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold">
              <span className="text-amber-600">{summary?.perishables?.low_stock_count || 0} Low Stock</span>
              <span className="text-gray-300">•</span>
              <span className="text-red-500">{summary?.perishables?.expiring_soon_count || 0} Expiring</span>
            </div>
          </div>
        </div>

        {/* Card 2: Reusable Asset Pool */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <span className="material-icons text-2xl">table_restaurant</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Track 2: Equipment</span>
            <span className="text-xl font-black text-blue-700 tracking-tight">
              {summary?.assets?.total_units_owned || 0} Units
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-gray-500">
              <span>{summary?.assets?.total_asset_types || assets.length} Classes</span>
              <span className="text-gray-300">•</span>
              <span>₱{(summary?.assets?.total_replacement_value || 0).toLocaleString()} Value</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Event Allocations */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <span className="material-icons text-2xl">local_shipping</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Event Reservations</span>
            <span className="text-xl font-black text-emerald-700 tracking-tight">
              {summary?.allocations?.total_active_allocations || 0} Active
            </span>
            <div className="text-[10px] font-bold text-gray-500 mt-0.5">
              <span>{summary?.allocations?.active_dispatched_count || 0} Dispatched to Venue</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dark Navy Accent Card */}
        <div className="bg-[#071A3D] p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3 text-white">
          <div className="w-12 h-12 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center border border-white/20 shrink-0">
            <span className="material-icons text-2xl">build_circle</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider block">Maintenance & Loss</span>
            <span className="text-xl font-black text-amber-400 tracking-tight font-mono">
              {summary?.assets?.total_units_repair || 0} In Repair
            </span>
            <div className="text-[10px] font-bold text-gray-300 mt-0.5">
              <span>{summary?.assets?.total_units_lost || 0} Damaged / Lost</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL-TRACK MODE SELECTOR TABS */}
      <div className="bg-white p-2 rounded-lg border border-gray-400 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('perishables')}
          className={`px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'perishables'
              ? 'bg-[#C8102E] text-white shadow-2xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <span className="material-icons text-base">restaurant</span>
          <span>Track 1: Perishable Ingredients</span>
          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black ${
            activeTab === 'perishables' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {perishables.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'assets'
              ? 'bg-[#C8102E] text-white shadow-2xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <span className="material-icons text-base">weekend</span>
          <span>Track 2: Reusable Event Assets</span>
          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black ${
            activeTab === 'assets' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {assets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('planner')
            if (plannerDate) loadDateAvailability(plannerDate)
          }}
          className={`px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'planner'
              ? 'bg-[#C8102E] text-white shadow-2xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <span className="material-icons text-base">calendar_month</span>
          <span>Event Availability Planner</span>
          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black ${
            activeTab === 'planner' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {allocations.filter(a => a.status === 'Reserved' || a.status === 'Dispatched').length} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'bg-[#C8102E] text-white shadow-2xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <span className="material-icons text-base">history</span>
          <span>Usage &amp; Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERISHABLE INGREDIENTS VIEW                                        */}
      {/* ========================================================================= */}
      {activeTab === 'perishables' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Controls & Filter Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-400 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {PERISHABLE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPerishableCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold shrink-0 transition cursor-pointer ${
                    perishableCategory === cat
                      ? 'bg-[#071A3D] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="relative w-full md:w-64">
                <span className="material-icons text-sm text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
                <input
                  type="text"
                  placeholder="Search ingredient, supplier..."
                  value={perishableSearch}
                  onChange={e => setPerishableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:border-[#C8102E] text-xs font-medium"
                />
              </div>

              <select
                value={perishableFilter}
                onChange={e => setPerishableFilter(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] bg-white text-gray-700 shrink-0"
              >
                <option value="all">All Statuses</option>
                <option value="low_stock">Low / Out of Stock</option>
                <option value="expiring">Expiring in 7 Days</option>
              </select>
            </div>
          </div>

          {/* Perishables Table */}
          <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
                  <tr>
                    <th className="p-3.5">Item Code &amp; Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Stock on Hand</th>
                    <th className="p-3.5">Reorder Alert</th>
                    <th className="p-3.5">Freshness / Expiry</th>
                    <th className="p-3.5">Storage Location</th>
                    <th className="p-3.5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {filteredPerishables.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 font-bold space-y-2">
                        <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                          <span className="material-icons text-2xl">inventory_2</span>
                        </div>
                        <p className="text-sm font-black text-[#071A3D]">No Perishable Ingredients Found</p>
                        <p className="text-xs text-gray-500">No ingredients match the selected category or search keywords.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPerishables.map(item => {
                      const qty = parseFloat(item.quantity_on_hand) || 0
                      const min = parseFloat(item.min_threshold) || 0
                      const isLow = qty <= min && qty > 0
                      const isOut = qty === 0
                      const days = item.days_until_expiry
                      const isExpiringSoon = days !== null && days <= 7 && days >= 0
                      const isExpired = days !== null && days < 0

                      return (
                        <tr key={item.item_id} className="hover:bg-gray-50/70 transition">
                          {/* Item Code & Name */}
                          <td className="p-3.5">
                            <span className="font-black text-sm text-[#071A3D] block">{item.item_name}</span>
                            <span className="text-[10px] text-gray-400 font-mono font-bold block">{item.item_code}</span>
                          </td>

                          {/* Category */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-gray-100 text-gray-700 border border-gray-200">
                              {item.category}
                            </span>
                          </td>

                          {/* Stock on Hand */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`font-mono font-black text-sm ${
                              isOut ? 'text-[#C8102E]' : isLow ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {qty.toFixed(2)} {item.unit}
                            </span>
                            <span className="block text-[10px] font-bold text-gray-400">
                              ₱{parseFloat(item.cost_per_unit || 0).toFixed(2)} / {item.unit}
                            </span>
                          </td>

                          {/* Reorder Threshold */}
                          <td className="p-3.5 whitespace-nowrap">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-[#C8102E] border border-red-300">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                Low Stock (&le;{min} {item.unit})
                              </span>
                            ) : (
                              <span className="text-gray-500 font-bold text-xs">
                                Min: {min} {item.unit}
                              </span>
                            )}
                          </td>

                          {/* Expiry */}
                          <td className="p-3.5 whitespace-nowrap">
                            {item.expiry_date ? (
                              <div>
                                <span className={`text-[11px] font-mono font-bold block ${
                                  isExpired ? 'text-[#C8102E]' : isExpiringSoon ? 'text-amber-600' : 'text-gray-700'
                                }`}>
                                  {new Date(item.expiry_date).toLocaleDateString()}
                                </span>
                                <span className={`text-[9px] font-black uppercase ${
                                  isExpired ? 'text-[#C8102E]' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'
                                }`}>
                                  {isExpired ? 'Expired' : isExpiringSoon ? `Expires in ${days} days` : 'Fresh'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No date</span>
                            )}
                          </td>

                          {/* Location */}
                          <td className="p-3.5 text-gray-700 font-medium whitespace-nowrap">
                            {item.storage_location || 'Kitchen Pantry'}
                          </td>

                          {/* Quick Actions */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setUsageForm(prev => ({
                                    ...prev,
                                    quantity: '',
                                    reservation_id: ''
                                  }))
                                  setIsUsageModalOpen(true)
                                }}
                                className="p-1.5 px-2.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-[#C8102E] font-bold text-[11px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                title="Deduct stock for event cooking"
                              >
                                <span className="material-icons text-xs">remove_circle_outline</span>
                                <span>Use</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setRestockForm(prev => ({
                                    ...prev,
                                    quantity: '',
                                    supplier: item.supplier || ''
                                  }))
                                  setIsRestockModalOpen(true)
                                }}
                                className="p-1.5 px-2.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-emerald-700 font-bold text-[11px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                title="Log newly delivered batch"
                              >
                                <span className="material-icons text-xs">add_circle_outline</span>
                                <span>Restock</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REUSABLE EVENT ASSETS VIEW                                         */}
      {/* ========================================================================= */}
      {activeTab === 'assets' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Category Filter & Search */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-400 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {ASSET_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAssetCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold shrink-0 transition cursor-pointer ${
                    assetCategory === cat
                      ? 'bg-[#071A3D] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <span className="material-icons text-sm text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input
                type="text"
                placeholder="Search equipment, sound gear..."
                value={assetSearch}
                onChange={e => setAssetSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:border-[#C8102E] text-xs font-medium"
              />
            </div>
          </div>

          {/* Asset Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-400 font-bold bg-white rounded-lg border border-gray-400 shadow-xs space-y-2">
                <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                  <span className="material-icons text-2xl">chair_alt</span>
                </div>
                <p className="text-sm font-black text-[#071A3D]">No Reusable Catering Assets Found</p>
                <p className="text-xs text-gray-500">No assets match your search parameters.</p>
              </div>
            ) : (
              filteredAssets.map(asset => {
                const total = parseInt(asset.total_quantity, 10) || 0
                const repair = parseInt(asset.in_repair_quantity, 10) || 0
                const lost = parseInt(asset.damaged_lost_quantity, 10) || 0
                const allocated = parseInt(asset.allocated_today, 10) || 0
                const available = parseInt(asset.available_today, 10) || 0

                return (
                  <div
                    key={asset.asset_id}
                    className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            {asset.category}
                          </span>
                          <h3 className="font-black text-sm text-[#071A3D] mt-1.5 leading-snug">
                            {asset.asset_name}
                          </h3>
                          <p className="font-mono text-[10px] text-gray-400 font-bold">{asset.asset_code}</p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          asset.condition_status === 'Excellent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : asset.condition_status === 'Good'
                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}>
                          {asset.condition_status}
                        </span>
                      </div>

                      {/* Stock Counts Metric Row */}
                      <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-center my-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Total</span>
                          <span className="font-black text-xs text-[#071A3D]">{total}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-emerald-700 block">Ready</span>
                          <span className="font-black text-xs text-emerald-700">{available}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-blue-700 block">In-Use</span>
                          <span className="font-black text-xs text-blue-700">{allocated}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#C8102E] block">Repair</span>
                          <span className="font-black text-xs text-[#C8102E]">{repair + lost}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 mb-3 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-gray-500">
                            <span className="material-icons text-xs">place</span>
                            <span>Storage Bay:</span>
                          </span>
                          <span className="font-bold text-[#071A3D]">{asset.storage_location || 'Warehouse Bay 1'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-gray-500">
                            <span className="material-icons text-xs">payments</span>
                            <span>Unit Value:</span>
                          </span>
                          <span className="font-mono font-bold text-[#071A3D]">₱{parseFloat(asset.replacement_cost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setAllocationForm(prev => ({
                            ...prev,
                            asset_id: asset.asset_id,
                            event_date: plannerDate
                          }))
                          setIsAllocateModalOpen(true)
                        }}
                        className="w-full py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-icons text-xs">event_seat</span>
                        <span>Book for Catering Event</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EVENT AVAILABILITY PLANNER                                         */}
      {/* ========================================================================= */}
      {activeTab === 'planner' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Planner Date Selector Banner */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-400 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block">Conflict Prevention Engine</span>
              <h3 className="font-black text-sm text-[#071A3D]">Select Catering Event Date to Check Asset Free Capacity:</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="material-icons text-gray-500 text-sm">calendar_today</span>
              <input
                type="date"
                value={plannerDate}
                onChange={e => setPlannerDate(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
              />
            </div>
          </div>

          {/* Availability Grid for Selected Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#071A3D]">
                Equipment Capacity on {new Date(plannerDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <span className="text-[11px] font-bold text-gray-400">
                {dateAvailability.length} Reusable Assets Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {dateAvailability.map(item => {
                const total = item.effective_stock || 0
                const booked = item.allocated_on_date || 0
                const free = item.available_on_date || 0
                const isFull = free <= 0

                return (
                  <div
                    key={item.asset_id}
                    className={`p-3.5 rounded-lg border shadow-xs transition ${
                      isFull
                        ? 'border-red-300 bg-red-50/40'
                        : 'bg-white border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[9px] font-black uppercase text-gray-400 truncate">{item.category}</span>
                      {isFull ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#C8102E] text-white">
                          Fully Booked
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {free} Available
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-xs text-[#071A3D] leading-tight truncate">
                      {item.asset_name}
                    </h4>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 my-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isFull ? 'bg-[#C8102E]' : booked > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${total > 0 ? Math.min(100, (booked / total) * 100) : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                      <span>Booked: {booked} {item.unit}</span>
                      <span>Total Pool: {total}</span>
                    </div>

                    {!isFull && (
                      <button
                        type="button"
                        onClick={() => {
                          setAllocationForm(prev => ({
                            ...prev,
                            asset_id: item.asset_id,
                            event_date: plannerDate,
                            allocated_quantity: 1
                          }))
                          setIsAllocateModalOpen(true)
                        }}
                        className="mt-2.5 w-full py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-black text-[#C8102E] transition flex items-center justify-center gap-1 cursor-pointer border border-gray-200"
                      >
                        <span className="material-icons text-xs">add</span>
                        <span>Book for Event</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Allocations List & Dispatch Tracker */}
          <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold">
                  <span className="material-icons text-sm">assignment</span>
                </div>
                <h3 className="font-black text-sm text-[#071A3D]">Active Event Asset Allocations &amp; Dispatch Manifests</h3>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {allocations.length} Allocations Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
                  <tr>
                    <th className="p-3.5">Event &amp; Date</th>
                    <th className="p-3.5">Allocated Equipment</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Dispatched / Returned By</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                        No active asset allocations found.
                      </td>
                    </tr>
                  ) : (
                    allocations.map(alloc => (
                      <tr key={alloc.allocation_id} className="hover:bg-gray-50/70 transition">
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-black text-sm text-[#071A3D] block">{alloc.event_title}</span>
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-xs">event</span>
                            {new Date(alloc.event_date).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold text-[#071A3D]">{alloc.asset_name}</span>
                          <span className="text-[9px] font-bold text-gray-400 block">{alloc.asset_category}</span>
                        </td>

                        <td className="p-3.5 font-mono font-black text-[#071A3D] whitespace-nowrap">
                          {alloc.allocated_quantity} {alloc.unit}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                            alloc.status === 'Dispatched'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : alloc.status === 'Returned'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}>
                            {alloc.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-xs text-gray-600">
                          {alloc.status === 'Dispatched' && alloc.dispatched_by && (
                            <span>Dispatched by {alloc.dispatched_by}</span>
                          )}
                          {alloc.status === 'Returned' && alloc.returned_by && (
                            <div>
                              <span>Returned by {alloc.returned_by}</span>
                              {(alloc.damaged_qty > 0 || alloc.missing_qty > 0) && (
                                <span className="block text-[10px] text-[#C8102E] font-bold">
                                  ⚠️ {alloc.damaged_qty || 0} damaged, {alloc.missing_qty || 0} missing
                                </span>
                              )}
                            </div>
                          )}
                          {alloc.status === 'Reserved' && (
                            <span className="italic text-gray-400">Awaiting event day dispatch</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          {alloc.status === 'Reserved' && (
                            <button
                              type="button"
                              onClick={() => handleDispatchAllocation(alloc)}
                              className="px-3 py-1.5 rounded-md bg-[#071A3D] hover:bg-[#0f2c5f] text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                            >
                              Dispatch to Venue
                            </button>
                          )}

                          {alloc.status === 'Dispatched' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAllocation(alloc)
                                setReturnForm(prev => ({
                                  ...prev,
                                  damaged_qty: 0,
                                  missing_qty: 0
                                }))
                                setIsReturnModalOpen(true)
                              }}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                            >
                              Check-In &amp; Return
                            </button>
                          )}

                          {alloc.status === 'Returned' && (
                            <span className="text-gray-400 font-bold text-xs">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USAGE & AUDIT LOGS VIEW                                            */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-4 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold">
                <span className="material-icons text-sm">receipt_long</span>
              </div>
              <h3 className="font-black text-sm text-[#071A3D]">Perishable Stock Consumption &amp; Restock Audit Trail</h3>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {auditLogs.length} Transactions Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
                <tr>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">Ingredient</th>
                  <th className="p-3.5">Activity Type</th>
                  <th className="p-3.5">Quantity Changed</th>
                  <th className="p-3.5">Balance After</th>
                  <th className="p-3.5">Linked Event / Remarks</th>
                  <th className="p-3.5">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 font-bold">
                      No inventory logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.log_id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-black text-[#071A3D] block">{log.item_name}</span>
                        <span className="text-[10px] font-bold text-gray-400 block">{log.item_code}</span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                          log.change_type === 'restock'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.change_type === 'usage'
                            ? 'bg-red-50 text-[#C8102E] border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {log.change_type}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-black whitespace-nowrap">
                        <span className={log.change_type === 'restock' ? 'text-emerald-700' : 'text-[#C8102E]'}>
                          {log.change_type === 'restock' ? '+' : '-'}{parseFloat(log.quantity_changed || 0).toFixed(2)} {log.unit}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-gray-700 whitespace-nowrap">
                        {parseFloat(log.balance_after || 0).toFixed(2)} {log.unit}
                      </td>

                      <td className="p-3.5 text-gray-700">
                        {log.event_title && (
                          <span className="font-black text-[#C8102E] block">{log.event_title}</span>
                        )}
                        <span className="text-[11px] text-gray-500">{log.remarks || 'No notes'}</span>
                      </td>

                      <td className="p-3.5 font-bold text-gray-600 whitespace-nowrap">
                        {log.logged_by}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOG USAGE MODAL                                                  */}
      {/* ========================================================================= */}
      {isUsageModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">soup_kitchen</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Log Ingredient Usage</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Deduct stock consumed for kitchen prep or catering events</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUsageModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleLogUsageSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div className="p-3 rounded-xl bg-white border border-gray-300 shadow-2xs">
                <p className="font-black text-[#071A3D] text-sm">{selectedItem.item_name}</p>
                <p className="text-[11px] text-gray-500">
                  Current Stock: <span className="font-black text-[#C8102E]">{parseFloat(selectedItem.quantity_on_hand).toFixed(2)} {selectedItem.unit}</span>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Quantity to Deduct ({selectedItem.unit}): *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5.5"
                  value={usageForm.quantity}
                  onChange={e => setUsageForm({ ...usageForm, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] font-black text-sm text-[#071A3D] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Catering Event / Reservation (Optional):
                </label>
                <select
                  value={usageForm.reservation_id}
                  onChange={e => {
                    const sel = upcomingEvents.find(ev => String(ev.reservation_id) === e.target.value)
                    setUsageForm({
                      ...usageForm,
                      reservation_id: e.target.value,
                      event_title: sel ? (sel.event_name || sel.event_type || `Reservation #${sel.reservation_id}`) : ''
                    })
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                >
                  <option value="">General Kitchen Preparation</option>
                  {upcomingEvents.map(ev => (
                    <option key={ev.reservation_id} value={ev.reservation_id}>
                      {ev.event_name || ev.event_type} ({new Date(ev.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Remarks / Recipe Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepped for 120 pax buffet dinner"
                  value={usageForm.remarks}
                  onChange={e => setUsageForm({ ...usageForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUsageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">check</span>
                  <span>Confirm &amp; Deduct Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESTOCK BATCH MODAL                                              */}
      {/* ========================================================================= */}
      {isRestockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-300 shrink-0">
                  <span className="material-icons text-base">add_business</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Receive &amp; Restock Batch</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Log newly delivered supplier ingredients</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleRestockSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div className="p-3 rounded-xl bg-white border border-gray-300 shadow-2xs">
                <p className="font-black text-[#071A3D] text-sm">{selectedItem.item_name}</p>
                <p className="text-[11px] text-gray-500">
                  Current Stock: <span className="font-bold text-gray-800">{parseFloat(selectedItem.quantity_on_hand).toFixed(2)} {selectedItem.unit}</span>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Incoming Quantity to Add ({selectedItem.unit}): *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25"
                  value={restockForm.quantity}
                  onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] font-black text-sm text-[#071A3D] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Batch Expiration Date (Optional):
                </label>
                <input
                  type="date"
                  value={restockForm.new_expiry_date}
                  onChange={e => setRestockForm({ ...restockForm, new_expiry_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Supplier / Delivery Invoice:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro Fresh Delivery #DR-8902"
                  value={restockForm.supplier}
                  onChange={e => setRestockForm({ ...restockForm, supplier: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">done_all</span>
                  <span>Confirm Restock Intake</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ALLOCATE ASSETS TO EVENT MODAL                                  */}
      {/* ========================================================================= */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-300 shrink-0">
                  <span className="material-icons text-base">event_seat</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Allocate Equipment to Event</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Reserve catering hardware and prevent booking date conflicts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleAllocateSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Select Reusable Asset: *
                </label>
                <select
                  required
                  value={allocationForm.asset_id}
                  onChange={e => setAllocationForm({ ...allocationForm, asset_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                >
                  <option value="">-- Choose Equipment / Asset --</option>
                  {assets.map(a => (
                    <option key={a.asset_id} value={a.asset_id}>
                      {a.asset_name} ({a.category}) - Total Owned: {a.total_quantity} {a.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Event Date: *
                  </label>
                  <input
                    type="date"
                    required
                    value={allocationForm.event_date}
                    onChange={e => setAllocationForm({ ...allocationForm, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Quantity to Reserve: *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allocationForm.allocated_quantity}
                    onChange={e => setAllocationForm({ ...allocationForm, allocated_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-black text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Link to Upcoming Reservation (Optional):
                </label>
                <select
                  value={allocationForm.reservation_id}
                  onChange={e => {
                    const sel = upcomingEvents.find(ev => String(ev.reservation_id) === e.target.value)
                    if (sel) {
                      const dateStr = sel.event_date ? new Date(sel.event_date).toISOString().split('T')[0] : allocationForm.event_date
                      setAllocationForm({
                        ...allocationForm,
                        reservation_id: sel.reservation_id,
                        event_title: sel.event_name || sel.event_type || `Reservation #${sel.reservation_id}`,
                        event_date: dateStr
                      })
                    } else {
                      setAllocationForm({
                        ...allocationForm,
                        reservation_id: '',
                        event_title: ''
                      })
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                >
                  <option value="">-- Or enter custom event title below --</option>
                  {upcomingEvents.map(ev => (
                    <option key={ev.reservation_id} value={ev.reservation_id}>
                      {ev.event_name || ev.event_type} - {new Date(ev.event_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Event / Banquet Title: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dela Cruz Silver Wedding Anniversary"
                  value={allocationForm.event_title}
                  onChange={e => setAllocationForm({ ...allocationForm, event_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Logistics &amp; Setup Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Setup by 10:00 AM on stage left"
                  value={allocationForm.remarks}
                  onChange={e => setAllocationForm({ ...allocationForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">check</span>
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RETURN ALLOCATION CHECKLIST MODAL                                */}
      {/* ========================================================================= */}
      {isReturnModalOpen && selectedAllocation && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-300 shrink-0">
                  <span className="material-icons text-base">check_circle</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Check-in &amp; Return Equipment</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Verify hardware condition post-event before releasing back to ready pool</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleReturnSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div className="p-3 rounded-xl bg-white border border-gray-300 shadow-2xs space-y-0.5">
                <p className="font-black text-[#071A3D] text-sm">{selectedAllocation.asset_name}</p>
                <p className="text-[11px] text-gray-500">
                  Event: <span className="font-bold text-[#071A3D]">{selectedAllocation.event_title}</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  Dispatched Quantity: <span className="font-black text-[#C8102E]">{selectedAllocation.allocated_quantity} {selectedAllocation.unit}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Damaged / Broken:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedAllocation.allocated_quantity}
                    value={returnForm.damaged_qty}
                    onChange={e => setReturnForm({ ...returnForm, damaged_qty: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block">Routed to repair queue</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                    Missing / Lost:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedAllocation.allocated_quantity}
                    value={returnForm.missing_qty}
                    onChange={e => setReturnForm({ ...returnForm, missing_qty: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                  <span className="text-[9px] text-gray-400 mt-0.5 block">Logged for billing / replacement</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Inspection Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Checked by Banquet Captain, all cleaned"
                  value={returnForm.remarks}
                  onChange={e => setReturnForm({ ...returnForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">done_all</span>
                  <span>Confirm Return &amp; Check-in</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD NEW PERISHABLE ITEM                                          */}
      {/* ========================================================================= */}
      {isAddPerishableOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">egg_alt</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Add Perishable Food Item</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Register a consumable ingredient into catering pantry inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPerishableOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleAddPerishableSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Ingredient Name: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Beef Sirloin"
                  value={perishableForm.item_name}
                  onChange={e => setPerishableForm({ ...perishableForm, item_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Category: *</label>
                  <select
                    value={perishableForm.category}
                    onChange={e => setPerishableForm({ ...perishableForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  >
                    {PERISHABLE_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Unit: *</label>
                  <select
                    value={perishableForm.unit}
                    onChange={e => setPerishableForm({ ...perishableForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Liters)</option>
                    <option value="packs">packs</option>
                    <option value="sacks">sacks</option>
                    <option value="trays">trays</option>
                    <option value="cans">cans</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Initial Qty on Hand:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={perishableForm.quantity_on_hand}
                    onChange={e => setPerishableForm({ ...perishableForm, quantity_on_hand: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Reorder Min Alert:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={perishableForm.min_threshold}
                    onChange={e => setPerishableForm({ ...perishableForm, min_threshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Unit Cost (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₱350.00"
                    value={perishableForm.cost_per_unit}
                    onChange={e => setPerishableForm({ ...perishableForm, cost_per_unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Expiry Date:</label>
                  <input
                    type="date"
                    value={perishableForm.expiry_date}
                    onChange={e => setPerishableForm({ ...perishableForm, expiry_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Storage Location:</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Meat Freezer"
                  value={perishableForm.storage_location}
                  onChange={e => setPerishableForm({ ...perishableForm, storage_location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPerishableOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">save</span>
                  <span>Save Ingredient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD NEW REUSABLE ASSET                                           */}
      {/* ========================================================================= */}
      {isAddAssetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-300 shrink-0">
                  <span className="material-icons text-base">chair</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Add Reusable Event Asset</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Add equipment, furniture, or catering hardware into inventory pool</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAssetOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <form onSubmit={handleAddAssetSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Asset / Equipment Name: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Tiffany Chairs"
                  value={assetForm.asset_name}
                  onChange={e => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Category: *</label>
                  <select
                    value={assetForm.category}
                    onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  >
                    {ASSET_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Total Owned Qty: *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assetForm.total_quantity}
                    onChange={e => setAssetForm({ ...assetForm, total_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 font-black text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Unit of Measure:</label>
                  <select
                    value={assetForm.unit}
                    onChange={e => setAssetForm({ ...assetForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  >
                    <option value="pcs">pcs</option>
                    <option value="sets">sets</option>
                    <option value="units">units</option>
                    <option value="pairs">pairs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Condition:</label>
                  <select
                    value={assetForm.condition_status}
                    onChange={e => setAssetForm({ ...assetForm, condition_status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Replacement Cost (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    value={assetForm.replacement_cost}
                    onChange={e => setAssetForm({ ...assetForm, replacement_cost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Storage Bay:</label>
                  <input
                    type="text"
                    placeholder="e.g. Warehouse Bay 1"
                    value={assetForm.storage_location}
                    onChange={e => setAssetForm({ ...assetForm, storage_location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E] shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAssetOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                >
                  <span className="material-icons text-sm">save</span>
                  <span>Save Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
