import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom'
import api from '../../services/api'
import LoginPrompt from '../../components/LoginPrompt'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import logo from '../../assets/logo.png'

function MyOrdersPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser

  // Main UI states
  const [ordersList, setOrdersList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modals
  const [selectedReceiptModal, setSelectedReceiptModal] = useState(null) // Original receipt modal
  const [trackingOrderModal, setTrackingOrderModal] = useState(null) // Order progress tracker modal

  // Handle URL query redirects
  useEffect(() => {
    const query = new URLSearchParams(location.search)
    if (query.get('payment') === 'success') {
      const code = query.get('order_code')
      showToast(`Payment confirmed for Order #${code || ''}! Order transmitted to kitchen.`, 'success')
    }
  }, [location.search])

  // Fetch orders on user change
  useEffect(() => {
    if (currentUser?.email) {
      fetchCustomerOrders()
    } else {
      setOrdersList([])
    }
  }, [currentUser?.email])

  const fetchCustomerOrders = async () => {
    if (!currentUser?.email) {
      setOrdersList([])
      return
    }
    setIsLoading(true)
    try {
      const res = await api.orders.getOrders({
        role: 'customer',
        email: currentUser.email.trim().toLowerCase(),
        phone: currentUser.phone || ''
      })
      if (res?.status === 'success' && Array.isArray(res.orders)) {
        const mapped = res.orders.map(o => {
          const rawStatus = (o.status || 'Pending').trim()
          let statusCategory = 'pending'
          let statusStep = 1

          if (rawStatus === 'Completed' || rawStatus === 'Delivered' || rawStatus === 'Served') {
            statusCategory = 'completed'
            statusStep = 5
          } else if (rawStatus === 'Out for Delivery') {
            statusCategory = 'ready'
            statusStep = 4
          } else if (rawStatus === 'Ready' || rawStatus === 'Ready for Pickup') {
            statusCategory = 'ready'
            statusStep = 4
          } else if (rawStatus === 'Preparing' || rawStatus === 'In Progress') {
            statusCategory = 'preparing'
            statusStep = 3
          } else if (rawStatus === 'Accepted') {
            statusCategory = 'preparing'
            statusStep = 2
          } else if (rawStatus === 'Cancelled' || rawStatus === 'Rejected') {
            statusCategory = 'cancelled'
            statusStep = 0
          } else {
            statusCategory = 'pending'
            statusStep = 1
          }

          const rawDeliv = o.delivery_address || ''
          const isDeliv = (o.order_type || '').toLowerCase().includes('delivery') || (!rawDeliv.toLowerCase().includes('pickup') && !rawDeliv.toLowerCase().includes('counter') && !rawDeliv.toLowerCase().includes('table') && rawDeliv.trim().length > 3)
          const resolvedOrderType = isDeliv ? 'Delivery' : (o.order_type || 'Pickup')

          return {
            id: o.order_code || `ORD-${o.order_id}`,
            raw_id: o.order_id,
            order_date: o.created_at ? new Date(o.created_at).toLocaleString() : 'Recent',
            created_at: o.created_at,
            status: rawStatus,
            status_category: statusCategory,
            status_step: statusStep,
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: parseFloat(o.subtotal || o.grand_total || o.total_amount || 0),
            delivery_fee: parseFloat(o.delivery_fee || o.packaging_fee || 0),
            discount: parseFloat(o.discount || 0),
            total_amount: parseFloat(o.grand_total || o.total_amount || 0),
            payment_method: o.payment_method || 'counter',
            payment_status: (o.payment_status || 'unpaid').toLowerCase(),
            payment_id: o.payment_id || null,
            paid_at: o.paid_at || null,
            order_type: resolvedOrderType,
            delivery_address: o.delivery_address || (resolvedOrderType === 'Delivery' ? 'Home Address' : 'Main Diner Counter • Terminal 01'),
            delivery_notes: o.delivery_notes || null,
            rider_id: o.rider_id || null,
            rider_name: o.rider_name || null,
            rider_phone: o.rider_phone || null,
            vehicle_info: o.vehicle_info || null,
            delivery_status: o.delivery_status || (rawStatus === 'Out for Delivery' ? 'On the Way' : null),
            estimated_delivery_time: o.estimated_delivery_time || null,
            dispatched_at: o.dispatched_at || null,
            delivered_at: o.delivered_at || null,
            customer_name: o.customer_name || currentUser.full_name || 'Customer',
            phone: o.customer_phone || currentUser.phone || 'N/A',
            cancel_reason: o.cancel_reason || o.rejection_reason || o.notes || 'Cancelled by customer'
          }
        })
        setOrdersList(mapped)
      }
    } catch (e) {
      console.warn('Error fetching orders:', e)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date helper: "September 19, 2026 • 7:30 PM"
  const formatOrderDate = (dateStr) => {
    if (!dateStr || dateStr === 'Recent') return 'Recent'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const datePart = d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      const timePart = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return `${datePart} • ${timePart}`
    } catch (e) {
      return dateStr
    }
  }

  // Format currency helper
  const formatCurrency = (amount) => {
    return `₱${(parseFloat(amount) || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Reorder action: clone order items into cart drawer
  const handleReorder = (order) => {
    try {
      let currentCart = []
      const savedCart = localStorage.getItem('josdiner_cart')
      if (savedCart) {
        currentCart = JSON.parse(savedCart)
      }
      if (!Array.isArray(currentCart)) currentCart = []

      const newItems = (order.items || []).map(i => ({
        id: i.dish_id || i.id || `dish-${Date.now()}-${Math.random()}`,
        name: i.name || i.dish_name || 'Delicious Dish',
        price: parseFloat(i.price || 0),
        finalPrice: parseFloat(i.price || 0) * parseInt(i.quantity || 1, 10),
        quantity: parseInt(i.quantity || 1, 10),
        selectedOption: i.option ? { name: i.option } : null,
        specialInstructions: i.special_instructions || ''
      }))

      const updatedCart = [...currentCart, ...newItems]
      localStorage.setItem('josdiner_cart', JSON.stringify(updatedCart))
      window.dispatchEvent(new Event('josdiner_cart_updated'))
      window.dispatchEvent(new Event('cartUpdated'))
      window.dispatchEvent(new Event('storage'))

      showToast(`Added ${newItems.length} item(s) from Order #${order.id} to your tray!`, 'success')
      navigate('/menu')
    } catch (e) {
      console.error('Reorder error:', e)
      showToast('Could not add items to cart. Please try again.', 'error')
    }
  }

  // Filter orders by tab and search keyword
  const filteredOrders = useMemo(() => {
    return ordersList.filter(order => {
      // Tab filter
      if (activeTab !== 'all' && order.status_category !== activeTab) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchId = (order.id || '').toLowerCase().includes(query)
        const matchCustomer = (order.customer_name || '').toLowerCase().includes(query)
        const matchItem = (order.items || []).some(item =>
          (item.name || item.dish_name || '').toLowerCase().includes(query)
        )
        return matchId || matchCustomer || matchItem
      }
      return true
    })
  }, [ordersList, activeTab, searchQuery])

  // Reset to first page when changing tabs or searching
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  // Pagination computations
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  }, [filteredOrders.length, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  // Count badges for tabs
  const tabCounts = useMemo(() => {
    const counts = { all: ordersList.length, pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 }
    ordersList.forEach(o => {
      if (counts[o.status_category] !== undefined) {
        counts[o.status_category]++
      }
    })
    return counts
  }, [ordersList])

  // Status dot & badge presentation helper
  const renderStatusBadge = (order) => {
    if (order.status === 'Out for Delivery') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
          <span className="material-icons text-xs">two_wheeler</span>
          <span>{order.delivery_status || 'Out for Delivery'}</span>
        </span>
      )
    }

    if (order.status === 'Delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
          <span className="material-icons text-xs">task_alt</span>
          <span>Delivered</span>
        </span>
      )
    }

    switch (order.status_category) {
      case 'pending':
        if (order.payment_status === 'refund_required') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-300 dark:border-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Refund Required</span>
            </span>
          )
        }
        if (order.order_type === 'Delivery' && (order.payment_method === 'cod' || order.payment_method === 'counter')) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              <span className="material-icons text-xs text-amber-600">two_wheeler</span>
              <span>Cash on Delivery (Pending)</span>
            </span>
          )
        }
        if (order.payment_status !== 'paid') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Waiting for Payment</span>
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Pending Acceptance</span>
          </span>
        )
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Preparing</span>
          </span>
        )
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{order.order_type === 'Delivery' ? 'Ready for Dispatch' : 'Ready for Pickup'}</span>
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
            <span className="material-icons text-xs">task_alt</span>
            <span>Completed</span>
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-300 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Cancelled</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-300 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            <span>{order.status}</span>
          </span>
        )
    }
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Page Header (Consistent with the rest of the pages) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition font-semibold cursor-pointer">
                Home
              </button>
              <span>/</span>
              <span className="text-[#C8102E]">My Orders</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">inventory_2</span>
              <span>My Food Tray & Pickup Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Track active food tray orders, inspect kitchen preparation status, and review order receipts.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order or food item..."
                className={`w-full pl-9 pr-7 py-2 rounded-lg text-xs border transition focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => navigate('/menu')}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-4 py-2.5 rounded-lg text-xs font-black shadow-sm transition flex items-center gap-2 active:scale-95 cursor-pointer shrink-0"
            >
              <span className="material-icons text-base">restaurant_menu</span>
              <span className="hidden sm:inline">Order Food Trays</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs (Border styled like rest of the pages) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-300 dark:border-slate-800 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'ready', label: 'Ready' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => {
            const count = tabCounts[tab.id] || 0
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : isDarkMode
                      ? 'bg-slate-900 border border-slate-700 text-gray-300 hover:bg-slate-800'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDarkMode
                        ? 'bg-slate-800 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content View: Login Prompt or Orders List */}
        {!currentUser ? (
          <LoginPrompt
            title="Please Log In to View Your Orders"
            description="Sign in or register to track your food orders, delivery status, and purchase receipts."
            icon="receipt_long"
            isDarkMode={isDarkMode}
          />
        ) : isLoading ? (
          <div className={`p-12 rounded-xl border border-gray-300 dark:border-slate-700 text-center space-y-4 shadow-xs ${
            isDarkMode ? 'bg-[#071A3D]' : 'bg-white'
          }`}>
            <span className="material-icons text-4xl animate-spin text-[#C8102E]">refresh</span>
            <p className="text-sm font-semibold">Loading your food orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Contextual Empty State */
          <div className={`p-12 rounded-xl border border-gray-300 dark:border-slate-700 text-center space-y-4 shadow-xs ${
            isDarkMode ? 'bg-[#071A3D]' : 'bg-white'
          }`}>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-[#C8102E] rounded-full flex items-center justify-center mx-auto text-3xl">
              {searchQuery ? (
                <span className="material-icons text-4xl">search_off</span>
              ) : activeTab === 'cancelled' ? (
                <span className="material-icons text-4xl text-emerald-500">check_circle_outline</span>
              ) : (
                <span className="material-icons text-4xl">shopping_basket</span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold">
                {searchQuery
                  ? 'No Orders Match Your Search'
                  : activeTab === 'cancelled'
                    ? 'No Cancelled Orders'
                    : activeTab === 'pending'
                      ? 'No Pending Orders'
                      : activeTab === 'preparing'
                        ? 'No Orders Currently Cooking'
                        : activeTab === 'ready'
                          ? 'No Orders Ready for Pickup'
                          : activeTab === 'completed'
                            ? 'No Completed Orders Yet'
                            : 'No orders placed yet'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchQuery
                  ? `We could not find any order matching "${searchQuery}".`
                  : activeTab === 'cancelled'
                    ? "You don't have any cancelled orders."
                    : activeTab === 'all'
                      ? "You do not have any active or past food orders associated with this account. Explore our food menu and order party trays, bentos, or solo entrees."
                      : `You currently have no ${activeTab} orders.`}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow transition cursor-pointer inline-flex items-center gap-2"
                >
                  <span className="material-icons text-sm">restaurant_menu</span>
                  <span>Browse Menu</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Clean Horizontal Order Rows (Border styled like rest of the pages) */
          <div className="space-y-4">
            {paginatedOrders.map(order => {
              const previewItems = (order.items || []).slice(0, 3)
              const remainingCount = Math.max(0, (order.items || []).length - 3)
              const isCancelled = order.status_category === 'cancelled'
              const isCompleted = order.status_category === 'completed'
              const isUnpaidOnline = order.payment_status !== 'paid' && order.payment_method === 'online'

              return (
                <div
                  key={order.id}
                  className={`p-5 rounded-xl border border-gray-300 dark:border-slate-700 shadow-xs transition-all duration-200 hover:shadow-md ${
                    isDarkMode ? 'bg-[#071A3D]' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Left: Order Ref, Date, Dining Option */}
                    <div className="space-y-1 lg:w-1/4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#071A3D] dark:text-white">
                          Order #{order.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {formatOrderDate(order.created_at)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                          order.order_type === 'Delivery'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-700'
                        }`}>
                          {order.order_type === 'Delivery' ? '🛵 Delivery' : (order.order_type || 'Pickup')}
                        </span>
                        {order.payment_status === 'paid' ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <span className="material-icons text-[12px]">verified</span>
                            <span>Paid</span>
                          </span>
                        ) : order.order_type === 'Delivery' ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <span className="material-icons text-[12px]">payments</span>
                            <span>Cash on Delivery</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <span className="material-icons text-[12px]">payments</span>
                            <span>Pay at Counter</span>
                          </span>
                        )}
                      </div>

                      {order.order_type === 'Delivery' && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 pt-0.5">
                          <span className="material-icons text-xs text-[#C8102E]">location_on</span>
                          <span className="truncate">{order.delivery_address}</span>
                        </p>
                      )}

                      {order.rider_name && (
                        <div className="mt-1 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-300 dark:border-amber-700 flex items-center gap-1.5">
                          <span className="material-icons text-xs text-amber-600">sports_motorsports</span>
                          <span>Rider: <strong>{order.rider_name}</strong></span>
                          {order.vehicle_info && <span className="opacity-75 font-normal">({order.vehicle_info})</span>}
                          {order.estimated_delivery_time && <span>• ETA: {order.estimated_delivery_time}</span>}
                        </div>
                      )}
                    </div>

                    {/* Middle: Food Preview */}
                    <div className="lg:w-2/5 space-y-1 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-200 dark:border-slate-800 lg:px-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block lg:hidden">
                        Order Items:
                      </span>
                      {previewItems.length > 0 ? (
                        <div className="space-y-0.5 text-xs">
                          {previewItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <span className="font-mono font-bold text-[#C8102E] shrink-0">
                                {item.quantity || 1}×
                              </span>
                              <span className="truncate font-medium">
                                {item.name || item.dish_name}
                              </span>
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <p className="text-[11px] text-gray-400 font-semibold pt-0.5 italic">
                              + {remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No items listed</p>
                      )}

                      {/* Cancellation Reason Callout if Cancelled */}
                      {isCancelled && (
                        <div className="mt-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-[11px] text-red-800 dark:text-red-300">
                          <span className="font-bold">Reason: </span>
                          <span>{order.cancel_reason || 'Cancelled by customer'}</span>
                        </div>
                      )}

                      {/* Prompt: Proceed to counter to pay if unpaid */}
                      {order.status_category === 'pending' && order.payment_status !== 'paid' && (
                        <div className="mt-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                          <span className="material-icons text-sm text-amber-600 shrink-0">storefront</span>
                          <span>Please proceed to the counter to pay for your order.</span>
                        </div>
                      )}

                      {/* Prompt: Refund required notification if rejected/cancelled after payment */}
                      {order.payment_status === 'refund_required' && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                          <span className="material-icons text-sm text-rose-600 shrink-0">currency_exchange</span>
                          <span>Refund required: Please claim your cash refund at the counter.</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Price, Status & Actions */}
                    <div className="lg:w-1/3 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                      
                      {/* Price & Status Badge */}
                      <div className="flex items-center sm:flex-col lg:items-end gap-3 sm:gap-1">
                        <span className="text-base sm:text-lg font-mono font-black text-[#C8102E]">
                          {formatCurrency(order.total_amount)}
                        </span>
                        <div>{renderStatusBadge(order)}</div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                        
                        {/* Pay Now Button (if online unpaid) */}
                        {isUnpaidOnline && (
                          <button
                            type="button"
                            onClick={() => navigate(`/payment/${order.id}`)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">payment</span>
                            <span>Pay Now</span>
                          </button>
                        )}

                        {/* View Order: Opens Original Receipt Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptModal(order)}
                          className="px-3.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-200 text-xs font-extrabold transition flex items-center gap-1.5 text-gray-800 dark:text-gray-200 cursor-pointer"
                        >
                          <span className="material-icons text-sm">receipt_long</span>
                          <span>View Order</span>
                        </button>

                        {/* Track Order: Active orders */}
                        {!isCancelled && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => setTrackingOrderModal(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">navigation</span>
                            <span>Track Order</span>
                          </button>
                        )}

                        {/* Reorder: Completed orders (Rate is removed as requested) */}
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">repeat</span>
                            <span>Reorder</span>
                          </button>
                        )}

                        {/* Order Again: Cancelled orders */}
                        {isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">replay</span>
                            <span>Order Again</span>
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                </div>
              )
            })}

            {/* Pagination Controls (Matching Menu pagination design) */}
            {filteredOrders.length > 0 && (
              <div className="pt-2">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredOrders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  itemLabel="orders"
                  className={isDarkMode ? 'border-slate-700 text-gray-300' : ''}
                />
              </div>
            )}
          </div>
        )}

      </div>

      {/* ORIGINAL ORDER DETAILS RECEIPT MODAL (Restored exactly as original) */}
      {selectedReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setSelectedReceiptModal(null)}></div>
          <div className="relative z-10 w-full max-w-md my-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-sm shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top Perforated Receipt Header Accent */}
            <div className="h-2.5 bg-gradient-to-r from-[#C8102E] via-red-500 to-[#C8102E]"></div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Header & Logo with Close Button */}
              <div className="relative text-center pb-3.5 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <button
                  onClick={() => setSelectedReceiptModal(null)}
                  className="absolute right-0 top-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-icons text-base">close</span>
                </button>

                <div className="flex items-center justify-center gap-2 mb-1">
                  <img src={logo} alt="Jo's Diner" className="h-7 object-contain" />
                  <span className="font-black text-sm tracking-tight font-sans text-gray-900 dark:text-white">JO'S DINER</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-sans font-bold">
                  Official Order Receipt Slip
                </p>
                <p className="text-[9px] text-gray-400 font-sans">Main Diner Counter • Terminal 01</p>

                <div className="pt-2 flex items-center justify-center gap-2">
                  {selectedReceiptModal.payment_status === 'paid' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-sans flex items-center gap-1.5">
                      <span className="material-icons text-xs text-emerald-600">verified</span>
                      <span>Payment Authorized & Paid</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-sans flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      <span>Pending Cash Payment</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Big Scannable Order Code Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-gray-200 dark:border-slate-700 text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block font-sans">
                  Order Reference Code
                </span>
                <span className="text-2xl font-black tracking-widest text-[#C8102E] block select-all">
                  {selectedReceiptModal.id}
                </span>
                {/* Simulated Barcode Graphic */}
                <div className="pt-1.5 flex flex-col items-center justify-center gap-1 opacity-80">
                  <div className="flex items-center gap-[2px] h-7">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 4, 1, 3, 2].map((w, i) => (
                      <span
                        key={i}
                        className="bg-gray-800 dark:bg-gray-200 h-full rounded-xs inline-block"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[8.5px] tracking-widest text-gray-400 font-sans">
                    *{selectedReceiptModal.id}*
                  </span>
                </div>
              </div>

              {/* Order Meta Info */}
              <div className="text-[11px] space-y-1 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Date:</span>
                  <span className="font-bold">{selectedReceiptModal.order_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Customer:</span>
                  <span className="font-bold text-gray-900 dark:text-white font-sans">{selectedReceiptModal.customer_name}</span>
                </div>
                {selectedReceiptModal.phone && selectedReceiptModal.phone !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Phone / SMS:</span>
                    <span className="font-bold">{selectedReceiptModal.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Pickup Location:</span>
                  <span className="font-bold font-sans">{selectedReceiptModal.delivery_address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Payment Method:</span>
                  <span className="font-bold uppercase font-sans text-emerald-600 dark:text-emerald-400">
                    {selectedReceiptModal.payment_method}
                  </span>
                </div>
              </div>

              {/* Itemized Docket Lines */}
              <div className="space-y-2 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex justify-between text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans">
                  <span>Qty & Description</span>
                  <span>Amount</span>
                </div>

                <div className="space-y-1.5 pt-0.5 max-h-44 overflow-y-auto">
                  {selectedReceiptModal.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] items-start gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          <span className="text-[#C8102E] font-black mr-1">{item.quantity}x</span>
                          {item.name}
                          {item.option && item.option.trim() && <span className="text-gray-400 font-normal"> ({item.option})</span>}
                        </span>
                        <span className="font-extrabold shrink-0">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {item.special_instructions && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic pl-4 font-sans">
                          * Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Totals */}
              <div className="space-y-1.5 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700 text-xs">
                <div className="flex justify-between text-gray-500 dark:text-gray-400 font-sans">
                  <span>Subtotal:</span>
                  <span className="font-bold font-mono">
                    ₱{selectedReceiptModal.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedReceiptModal.delivery_fee > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 font-sans">
                    <span>Packaging & Service:</span>
                    <span className="font-bold font-mono">₱{selectedReceiptModal.delivery_fee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1.5 text-sm font-black border-t border-gray-200 dark:border-slate-800 font-sans">
                  <span className="uppercase tracking-wider text-gray-900 dark:text-white">
                    {selectedReceiptModal.payment_status === 'paid' ? 'Total Paid:' : 'Total Due:'}
                  </span>
                  <span className="text-lg font-black text-[#C8102E] font-mono">
                    ₱{selectedReceiptModal.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-3 rounded-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 font-extrabold text-xs text-gray-800 dark:text-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-icons text-sm">print</span>
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptModal(null)}
                  className="flex-1 py-2.5 px-3 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-sm text-xs font-black text-center transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Close Receipt</span>
                </button>
              </div>

            </div>

            {/* Bottom Perforated Edge */}
            <div className="h-1.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent border-t border-dashed border-gray-300 dark:border-slate-700"></div>
          </div>
        </div>
      )}

      {/* TRACK ORDER PROGRESS TIMELINE MODAL */}
      {trackingOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setTrackingOrderModal(null)}></div>

          <div className={`relative z-10 w-full max-w-md rounded-md p-5 sm:p-6 space-y-4 border border-gray-400 dark:border-slate-500 shadow-2xl transition-colors ${
            isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#C8102E]">navigation</span>
                <h3 className="font-extrabold text-base">Track Order #{trackingOrderModal.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrderModal(null)}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-700"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* Quick Order Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-gray-400">Order Reference:</span>
                <span className="font-mono font-bold text-[#C8102E]">{trackingOrderModal.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-gray-400">Placed On:</span>
                <span className="font-bold">{formatOrderDate(trackingOrderModal.created_at)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-slate-800">
                <span className="text-gray-500 dark:text-gray-400">Current Status:</span>
                <div>{renderStatusBadge(trackingOrderModal)}</div>
              </div>
              {trackingOrderModal.order_type === 'Delivery' && (
                <div className="border-b pb-2 border-gray-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-icons text-xs text-[#C8102E]">location_on</span>
                      <span>Deliver To:</span>
                    </span>
                    <span className="font-bold text-right max-w-[220px]">{trackingOrderModal.delivery_address}</span>
                  </div>
                  {trackingOrderModal.delivery_notes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-4 italic">
                      Landmark/Note: {trackingOrderModal.delivery_notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Rider Dispatch Info Card (If Rider Assigned) */}
            {trackingOrderModal.order_type === 'Delivery' && trackingOrderModal.rider_name && (
              <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                      <span className="material-icons text-base">sports_motorsports</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block tracking-wider">
                        Assigned Delivery Rider
                      </span>
                      <strong className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                        {trackingOrderModal.rider_name}
                      </strong>
                    </div>
                  </div>

                  {trackingOrderModal.rider_phone && (
                    <a
                      href={`tel:${trackingOrderModal.rider_phone}`}
                      className="px-2.5 py-1 rounded bg-[#C8102E] text-white font-bold text-[11px] flex items-center gap-1 hover:bg-[#9B0B21] transition shadow-2xs"
                    >
                      <span className="material-icons text-xs">call</span>
                      <span>Call Rider</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200 dark:border-amber-900/60 text-[11px]">
                  {trackingOrderModal.vehicle_info && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Vehicle / Plate:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{trackingOrderModal.vehicle_info}</span>
                    </div>
                  )}
                  {trackingOrderModal.estimated_delivery_time && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Estimated Arrival:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{trackingOrderModal.estimated_delivery_time}</span>
                    </div>
                  )}
                </div>

                {trackingOrderModal.delivery_status && (
                  <div className="flex items-center justify-between p-2 rounded bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/60 font-bold text-amber-950 dark:text-amber-200 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-icons text-sm text-[#C8102E] animate-bounce">navigation</span>
                      <span>Delivery Milestone:</span>
                    </span>
                    <span className="text-[#C8102E] dark:text-red-300 font-extrabold font-mono">
                      {trackingOrderModal.delivery_status}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Step Timeline */}
            <div className="p-4 rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 space-y-3">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                {trackingOrderModal.order_type === 'Delivery' ? 'Express Delivery Order Timeline' : 'Live Kitchen Preparation Timeline'}
              </span>

              <div className="space-y-0 text-xs pl-1">
                {(trackingOrderModal.order_type === 'Delivery' ? [
                  {
                    step: 1,
                    label: trackingOrderModal.payment_method === 'cod' ? 'Delivery Order Placed' : (trackingOrderModal.payment_status !== 'paid' ? 'Waiting for Payment' : 'Order Placed'),
                    desc: trackingOrderModal.payment_method === 'cod'
                      ? 'Cash on Delivery • Settle ₱' + Number(trackingOrderModal.total_amount || 0).toLocaleString() + ' with rider'
                      : 'Payment verified • Awaiting kitchen dispatch'
                  },
                  { step: 2, label: 'Order Accepted', desc: 'Sent to kitchen for cooking' },
                  { step: 3, label: 'Kitchen Preparing', desc: 'Chefs cooking in kitchen express' },
                  {
                    step: 4,
                    label: trackingOrderModal.delivery_status || 'Out for Delivery',
                    desc: trackingOrderModal.rider_name
                      ? `${trackingOrderModal.rider_name} (${trackingOrderModal.delivery_status || 'On the Way'})`
                      : 'Rider dispatched to your address'
                  },
                  { step: 5, label: 'Delivered', desc: 'Food safely delivered to your doorstep' }
                ] : [
                  {
                    step: 1,
                    label: trackingOrderModal.payment_status !== 'paid' ? 'Waiting for Payment' : 'Pending Acceptance',
                    desc: trackingOrderModal.payment_status !== 'paid'
                      ? 'Please proceed to counter to pay'
                      : 'Payment verified • Awaiting staff review'
                  },
                  { step: 2, label: 'Order Accepted', desc: 'Sent to kitchen for cooking' },
                  { step: 3, label: 'Preparing', desc: 'Chefs cooking in kitchen express' },
                  { step: 4, label: 'Ready for Pickup', desc: 'Food is ready at pickup counter' },
                  { step: 5, label: 'Completed', desc: 'Order claimed & released' }
                ]).map((s, idx, arr) => {
                  const isCompletedStep = trackingOrderModal.status_step > s.step || trackingOrderModal.status_step === 5
                  const isCurrentStep = trackingOrderModal.status_step === s.step && trackingOrderModal.status_step !== 5

                  return (
                    <div key={s.step} className="flex items-start gap-3 relative pb-4 last:pb-0">
                      {/* Connecting line */}
                      {idx < arr.length - 1 && (
                        <span
                          className={`absolute left-[11px] top-6 w-[2px] h-[calc(100%-20px)] ${
                            isCompletedStep ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
                          }`}
                        />
                      )}

                      {/* Node icon */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                        isCompletedStep
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isCurrentStep
                            ? 'bg-[#C8102E] text-white ring-4 ring-red-100 dark:ring-red-950/60 animate-pulse shadow-xs'
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                      }`}>
                        {isCompletedStep ? '✓' : isCurrentStep ? '●' : '○'}
                      </div>

                      <div className="space-y-0.5">
                        <span className={`font-bold block ${
                          isCurrentStep
                            ? 'text-[#C8102E] font-black'
                            : isCompletedStep
                              ? (isDarkMode ? 'text-white' : 'text-[#071A3D]')
                              : 'text-gray-400'
                        }`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const order = trackingOrderModal
                  setTrackingOrderModal(null)
                  setSelectedReceiptModal(order)
                }}
                className="flex-1 py-2.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-gray-800 dark:text-gray-200"
              >
                <span className="material-icons text-sm">receipt_long</span>
                <span>View Receipt Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setTrackingOrderModal(null)}
                className="px-5 py-2.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-md text-xs font-black transition cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default MyOrdersPage
