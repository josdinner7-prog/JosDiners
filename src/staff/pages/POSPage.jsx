import React, { useState, useEffect } from 'react'
import { useSearchParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import counterPaymentIcon from '../../assets/CounterPayment_icon.png'

// High-Fidelity Skeleton for Category Pills
function POSCategoryPillsSkeleton() {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 animate-pulse [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          className="h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/50 shrink-0"
        />
      ))}
    </div>
  )
}

// High-Fidelity Skeleton for POS Dish Cards (Grid View)
function POSCardSkeleton({ isDarkMode }) {
  return (
    <div className={`p-2.5 rounded-lg border shadow-2xs flex flex-col justify-between space-y-2 animate-pulse ${
      isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50/70 border-slate-200'
    }`}>
      <div>
        {/* Thumbnail skeleton */}
        <div className="relative h-28 w-full rounded-md overflow-hidden mb-2 bg-slate-200 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/40">
          <div className="absolute top-1.5 right-1.5 w-14 h-4 bg-slate-300 dark:bg-slate-700 rounded text-[9px]"></div>
        </div>

        {/* Category and code */}
        <div className="flex justify-between items-center mb-1">
          <div className="w-16 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="w-10 h-2 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>

        {/* Dish Name */}
        <div className="space-y-1">
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-4/5"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
        </div>

        {/* Prep Time & Serving Size */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-12 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="w-12 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>

      {/* Price & Action Buttons Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
        <div className="w-14 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div className="grid grid-cols-2 gap-1.5 w-full">
          <div className="h-7 rounded-md bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-7 rounded-md bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
    </div>
  )
}

// High-Fidelity Skeleton for POS Operational Table View
function POSTableSkeleton({ isDarkMode }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
            <th className="py-2 px-2">Dish</th>
            <th className="py-2 px-2">Category</th>
            <th className="py-2 px-2">Serving</th>
            <th className="py-2 px-2">Prep Time</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2 text-right">Price</th>
            <th className="py-2 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <tr key={i}>
              <td className="py-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1">
                    <div className="w-28 h-3 bg-slate-300 dark:bg-slate-700 rounded" />
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </td>
              <td className="py-2 px-2"><div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" /></td>
              <td className="py-2 px-2"><div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded" /></td>
              <td className="py-2 px-2"><div className="w-10 h-3 bg-slate-200 dark:bg-slate-800 rounded" /></td>
              <td className="py-2 px-2"><div className="w-14 h-4 rounded bg-slate-200 dark:bg-slate-800" /></td>
              <td className="py-2 px-2 text-right"><div className="w-12 h-3 bg-slate-300 dark:bg-slate-700 rounded ml-auto" /></td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function POSPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [newOnlineOrdersCount, setNewOnlineOrdersCount] = useState(0)
  const [posViewMode, setPosViewMode] = useState('grid') // 'grid' or 'table'
  const [posCategory, setPosCategory] = useState('all')
  const [posSearch, setPosSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [tableNumber, setTableNumber] = useState('Table 01')
  const [orderType, setOrderType] = useState(() => searchParams.get('type') || 'Dine-in')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discountType, setDiscountType] = useState('none')
  const [cashTendered, setCashTendered] = useState('')
  const [mobileTab, setMobileTab] = useState('menu') // 'menu' or 'receipt' on mobile screens

  // Detailed Dish Inspection Modal State
  const [selectedDishForView, setSelectedDishForView] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalInstructions, setModalInstructions] = useState('')

  // Counter Payment Settlement for Unpaid / OTC Online Orders
  const [pendingCounterOrders, setPendingCounterOrders] = useState([])
  const [isCounterOrdersModalOpen, setIsCounterOrdersModalOpen] = useState(false)
  const [selectedOTCPhoneOrder, setSelectedOTCPhoneOrder] = useState(null)
  const [settleSearchQuery, setSettleSearchQuery] = useState('')

  useEffect(() => {
    loadPOSData()
    const interval = setInterval(async () => {
      try {
        const ordersRes = await api.orders.getOrders()
        const list = (ordersRes.status === 'success' && Array.isArray(ordersRes.orders || ordersRes.data)) ? (ordersRes.orders || ordersRes.data) : []
        const newOrders = list.filter(o => o.status === 'New' || o.status === 'Pending')
        setNewOnlineOrdersCount(newOrders.length)
        const unpaidOrders = list.filter(o => (o.payment_status || 'unpaid').toLowerCase() !== 'paid' && (o.status === 'New' || o.status === 'Pending'))
        setPendingCounterOrders(unpaidOrders)
      } catch (e) {}
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  // Auto-load order into terminal if directed from Kanban via query param
  useEffect(() => {
    const settleParam = searchParams.get('settleOrder') || searchParams.get('orderId')
    if (settleParam) {
      api.orders.getOrders().then(res => {
        const list = (res.status === 'success' && Array.isArray(res.orders || res.data)) ? (res.orders || res.data) : []
        const found = list.find(o => String(o.order_id) === String(settleParam) || String(o.order_code) === String(settleParam))
        if (found) {
          handleSelectOrderForTerminal(found)
        }
      }).catch(() => {})
    }
  }, [searchParams])

  const loadPOSData = async () => {
    setIsLoading(true)
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

    try {
      const ordersRes = await api.orders.getOrders()
      const list = (ordersRes.status === 'success' && Array.isArray(ordersRes.orders || ordersRes.data)) ? (ordersRes.orders || ordersRes.data) : []
      const newOrders = list.filter(o => o.status === 'New' || o.status === 'Pending')
      setNewOnlineOrdersCount(newOrders.length)
      const unpaidOrders = list.filter(o => (o.payment_status || 'unpaid').toLowerCase() !== 'paid' && (o.status === 'New' || o.status === 'Pending'))
      setPendingCounterOrders(unpaidOrders)
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  // Load an unpaid phone order directly into the Receipt Terminal
  const handleSelectOrderForTerminal = (order) => {
    if (!order) return
    setSelectedOTCPhoneOrder(order)

    const orderItems = (order.items || []).map((it, idx) => ({
      id: it.item_id || it.id || `otc-item-${idx}`,
      item_id: it.item_id || it.id || `otc-item-${idx}`,
      name: it.name,
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      special_instructions: it.special_instructions || '',
      serving_size: it.serving_size || '1 Serving',
      image: it.image || null
    }))

    setCart(orderItems)
    setCustomerName(order.customer_name || '')
    setOrderType(order.order_type || 'Takeout')
    if (order.table_number && order.table_number !== 'Takeout Counter') {
      setTableNumber(order.table_number)
    }
    setPaymentMethod('Cash')
    setCashTendered('')
    setDiscountType('none')
    setIsCounterOrdersModalOpen(false)
    setMobileTab('receipt')
    showToast(`Loaded Order #${order.order_code || order.order_id} (${order.customer_name || 'Guest'}) into Receipt Terminal!`, 'info')
  }

  // Auto-load order if passed via navigation state (e.g. from Payments -> Pending queue)
  useEffect(() => {
    if (location.state?.selectOrder) {
      handleSelectOrderForTerminal(location.state.selectOrder)
    }
  }, [location.state])

  // Unload phone order from Terminal and reset
  const handleClearSelectedOTCPhoneOrder = () => {
    setSelectedOTCPhoneOrder(null)
    setCart([])
    setCustomerName('')
    setCashTendered('')
    setDiscountType('none')
    showToast('Cleared phone order from Receipt Terminal.', 'info')
  }

  // Confirm OTC payment directly from Terminal, mark PAID, and send to Kanban
  const handleConfirmOTCPaymentInTerminal = async () => {
    if (!selectedOTCPhoneOrder) return
    const orderId = selectedOTCPhoneOrder.order_id
    const orderCode = selectedOTCPhoneOrder.order_code || `#${orderId}`
    const totalDue = grandTotal

    if (paymentMethod === 'Cash' && cashTendered !== '' && cashNum < totalDue) {
      showToast(`Tendered amount (₱${cashNum.toFixed(2)}) is less than Grand Total (₱${totalDue.toFixed(2)}).`, 'warning')
      return
    }

    try {
      await api.orders.updatePayment(orderId, {
        payment_status: 'paid',
        payment_method: paymentMethod.toLowerCase()
      })

      showToast(`Payment of ₱${totalDue.toFixed(2)} received for Order ${orderCode}! Order is now PAID and dispatched to Kanban.`, 'success')

      // Remove from pending counter list
      setPendingCounterOrders(prev => prev.filter(o => o.order_id !== orderId))

      // Clear terminal
      setSelectedOTCPhoneOrder(null)
      setCart([])
      setCustomerName('')
      setCashTendered('')
      setDiscountType('none')

      // Refresh list
      loadPOSData()
    } catch (e) {
      console.error('Failed to settle payment:', e)
      showToast(e.message || 'Failed to settle payment.', 'error')
    }
  }

  const resolveImageUrl = (image) => {
    if (!image) return null
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
      return image
    }
    const base = api.baseUrl || 'http://localhost:5000'
    return `${base}${image.startsWith('/') ? '' : '/'}${image}`
  }

  const handleAddToCart = (dish, quantity = 1, instructions = '') => {
    if (dish.availability === 'Sold Out') {
      showToast(`"${dish.name}" is currently Sold Out.`, 'warning')
      return
    }

    const dishId = dish.id ?? dish.item_id ?? dish.code ?? dish.name

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => (item.id ?? item.item_id) === dishId)
      if (existingIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                special_instructions: instructions ? instructions : item.special_instructions
              }
            : item
        )
      }
      return [
        ...prevCart,
        {
          ...dish,
          id: dishId,
          quantity: quantity,
          special_instructions: instructions || ''
        }
      ]
    })
    showToast(`+${quantity} "${dish.name}" added to receipt`, 'success')
  }

  const handleUpdateCartQty = (id, delta) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if ((item.id ?? item.item_id) === id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    })
  }

  const handleUpdateCartInstruction = (id, text) => {
    setCart(prev => prev.map(item => (item.id ?? item.item_id) === id ? { ...item, special_instructions: text } : item))
  }

  const handleRemoveCartItem = (id) => {
    setCart(prev => prev.filter(item => (item.id ?? item.item_id) !== id))
  }

  const formatReceiptPrice = (val) => {
    const num = Number(val) || 0
    return `₱${num.toFixed(2)}`
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = (discountType === 'senior' || discountType === 'pwd') ? subtotal * 0.20 : 0
  const deliveryFee = orderType === 'Delivery' ? 49.00 : 0.00
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee)
  const cashNum = parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, cashNum - grandTotal)

  const handlePOSOrderSubmit = async () => {
    if (cart.length === 0) {
      showToast('POS Receipt is empty.', 'error')
      return
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      showToast('Please enter a delivery address for delivery orders.', 'warning')
      return
    }

    if (paymentMethod === 'Cash' && cashNum < grandTotal && cashTendered !== '') {
      showToast(`Tendered amount (₱${cashNum.toFixed(2)}) is less than Grand Total (₱${grandTotal.toFixed(2)}).`, 'warning')
      return
    }

    const newOrderId = `JOS-${Math.floor(100000 + Math.random() * 900000)}`
    const isCod = paymentMethod === 'Cash' && orderType === 'Delivery'
    const newOrder = {
      order_id: newOrderId,
      customer_name: customerName.trim() || (orderType === 'Dine-in' ? `${tableNumber} Guest` : orderType === 'Delivery' ? 'Delivery Customer' : 'Walk-in Customer'),
      phone: orderType === 'Delivery' ? (deliveryPhone.trim() || 'Counter Terminal') : 'Counter Terminal',
      order_type: orderType,
      table_number: orderType === 'Dine-in' ? tableNumber : orderType === 'Delivery' ? 'Delivery (Rider Dispatch)' : 'Takeout Counter',
      delivery_address: orderType === 'Delivery' ? deliveryAddress.trim() : null,
      delivery_fee: deliveryFee,
      delivery_notes: orderType === 'Delivery' ? (deliveryNotes.trim() || null) : null,
      status: 'Accepted',
      elapsed_mins: 1,
      total_amount: grandTotal,
      payment_method: isCod ? 'Cash on Delivery (COD)' : paymentMethod,
      payment_status: isCod ? 'Pending' : 'Paid',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
        completed: false
      }))
    }

    setCart([])
    setCustomerName('')
    setDeliveryAddress('')
    setDeliveryNotes('')
    setDeliveryPhone('')
    setCashTendered('')
    setDiscountType('none')
    showToast(`Order #${newOrderId} submitted directly to Kitchen Queue!`, 'success')

    try {
      await api.orders.createOrder(newOrder)
    } catch (e) {
      // Handled
    }
  }

  const openDishDetails = (dish) => {
    setSelectedDishForView(dish)
    setModalQty(1)
    setModalInstructions('')
  }

  const filteredPOSItems = (menuItems || []).filter(item => {
    if (!item) return false
    const matchesCat = posCategory === 'all' || item.category === posCategory || item.category_id === posCategory || String(item.category_id) === String(posCategory)
    const search = (posSearch || '').toLowerCase().trim()
    const matchesSearch = !search ||
      (item.name || '').toLowerCase().includes(search) ||
      (item.code && String(item.code).toLowerCase().includes(search)) ||
      (item.description && item.description.toLowerCase().includes(search)) ||
      (item.allergens && item.allergens.toLowerCase().includes(search)) ||
      (item.ingredients && item.ingredients.toLowerCase().includes(search))
    return matchesCat && matchesSearch
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-10 text-xs items-start animate-in fade-in duration-150">

      {/* Counter Orders Alert Banner */}
      {pendingCounterOrders.length > 0 && (
        <div
          onClick={() => setIsCounterOrdersModalOpen(true)}
          className={`lg:col-span-12 p-3 sm:p-3.5 rounded-md border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition hover:border-[#C8102E]/60 group ${
            isDarkMode
              ? 'bg-[#151D36] border-slate-700 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-red-50 dark:bg-red-950/40 text-[#C8102E] flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50 group-hover:scale-105 transition">
              <span className="material-icons text-xl sm:text-2xl">point_of_sale</span>
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm block truncate text-slate-900 dark:text-white">
                  💰 {pendingCounterOrders.length} Online {pendingCounterOrders.length === 1 ? 'Order Awaiting Counter Payment' : 'Orders Awaiting Counter Payment'}!
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#C8102E] dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/50 uppercase tracking-wide shrink-0">
                  Pay at Counter
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                Customer online orders awaiting counter payment. Click to review and load into terminal.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsCounterOrdersModalOpen(true)
            }}
            className="px-4 py-2 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0 self-end sm:self-auto"
          >
            <span>View Counter Orders ({pendingCounterOrders.length})</span>
            <span className="material-icons text-xs">receipt_long</span>
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible on small & medium screens < lg) */}
      <div className="lg:hidden col-span-1 flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'menu'
              ? 'bg-[#C8102E] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <span className="material-icons text-sm">restaurant_menu</span>
          <span>Menu Catalog</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('receipt')}
          className={`flex-1 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition relative ${
            mobileTab === 'receipt'
              ? 'bg-[#C8102E] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <span className="material-icons text-sm">receipt_long</span>
          <span>Receipt Tray</span>
          {cart.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              mobileTab === 'receipt' ? 'bg-white text-[#C8102E]' : 'bg-[#C8102E] text-white'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Left Column: Unified Menu Catalog & Filter Container (7 Cols) */}
      <div className={`lg:col-span-7 rounded-xl border shadow-sm overflow-hidden flex flex-col ${mobileTab === 'menu' ? 'flex' : 'hidden lg:flex'} ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
        {/* Integrated Filter Bar Header */}
        <div className={`p-3 border-b space-y-2.5 ${isDarkMode ? 'bg-[#151D36] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-icons absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Search dishes, ingredients, allergens..."
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                className={`w-full pl-8 pr-8 py-1.5 rounded-md text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
              />
              {posSearch && (
                <button
                  onClick={() => setPosSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <span className="material-icons text-xs block">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isLoading ? (
                <span className="hidden sm:inline-block w-14 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  {filteredPOSItems.length} {filteredPOSItems.length === 1 ? 'dish' : 'dishes'}
                </span>
              )}

              {/* Settle Counter Orders Button */}
              <button
                type="button"
                onClick={() => setIsCounterOrdersModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                  pendingCounterOrders.length > 0
                    ? 'bg-red-50 hover:bg-red-100 text-[#C8102E] border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Settle unpaid counter orders"
              >
                <span className="material-icons text-sm">point_of_sale</span>
                <span className="hidden sm:inline">Counter Orders</span>
                {pendingCounterOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C8102E] text-white text-[10px] font-black">
                    {pendingCounterOrders.length}
                  </span>
                )}
              </button>

              <div className="flex border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden shrink-0">
                <button
                  onClick={() => setPosViewMode('grid')}
                  className={`p-1.5 text-xs cursor-pointer transition ${posViewMode === 'grid' ? 'bg-[#C8102E] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                  title="Grid View"
                >
                  <span className="material-icons text-base block">grid_view</span>
                </button>
                <button
                  onClick={() => setPosViewMode('table')}
                  className={`p-1.5 text-xs cursor-pointer transition ${posViewMode === 'table' ? 'bg-[#C8102E] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
                  title="Table View"
                >
                  <span className="material-icons text-base block">view_list</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (No ugly scrollbar arrows) */}
          {isLoading ? (
            <POSCategoryPillsSkeleton />
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: 'all', name: 'All Items' }, ...categories].map(cat => {
                const catId = cat.id || cat.name || cat.category_name || cat
                const catLabel = cat.name || cat.category_name || cat.label || cat
                const isSelected = posCategory === catId

                return (
                  <button
                    key={catId}
                    onClick={() => setPosCategory(catId)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs'
                        : isDarkMode
                        ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    {catLabel}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Integrated Menu Items Body (Natural flow without internal scroll) */}
        <div className="p-3">
          {isLoading ? (
            posViewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <POSCardSkeleton key={n} isDarkMode={isDarkMode} />
                ))}
              </div>
            ) : (
              <POSTableSkeleton isDarkMode={isDarkMode} />
            )
          ) : filteredPOSItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="material-icons text-4xl mb-2 opacity-50">restaurant_menu</span>
              <p className="font-bold text-xs">No dishes found</p>
              <p className="text-[11px] opacity-70 mt-0.5">Try searching with a different keyword or category.</p>
            </div>
          ) : posViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredPOSItems.map(dish => {
                const imgUrl = resolveImageUrl(dish.image)
                const avail = dish.availability || 'Available'
                const isSoldOut = avail === 'Sold Out'

                return (
                  <div
                    key={dish.id}
                    className={`group p-2.5 rounded-lg border transition-all duration-150 shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-2 overflow-hidden ${isDarkMode ? 'bg-slate-900/80 border-slate-700 text-white hover:border-[#C8102E]' : 'bg-slate-50/70 border-slate-200 text-slate-900 hover:border-[#C8102E] hover:bg-red-50/20'}`}
                  >
                    {/* Card Header & Thumbnail */}
                    <div>
                      <div className="relative h-28 w-full rounded-md overflow-hidden mb-2 bg-slate-800 flex items-center justify-center group/img border border-slate-200 dark:border-slate-700">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover transition duration-300 group-hover/img:scale-105"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80'
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <span className="material-icons text-3xl mb-1 opacity-50">restaurant</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{dish.category_name || 'Dish Item'}</span>
                          </div>
                        )}

                        {/* Availability Tag */}
                        <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-2xs ${
                          avail === 'Available'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : avail === 'Low Stock'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-rose-600 text-white border-rose-500'
                        }`}>
                          {avail}
                        </span>

                        {/* Featured Badge */}
                        {Boolean(dish.is_featured) && (
                          <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5">
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      {/* Category Label */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                        <span className="truncate">{dish.category_name || dish.category}</span>
                        <span className="font-mono text-[9px] text-slate-400">{dish.code || `#${dish.id}`}</span>
                      </div>

                      {/* Dish Name */}
                      <h4 className="font-extrabold text-xs leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-2">
                        {dish.name}
                      </h4>

                      {/* Key Info: Prep Time & Serving Size */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-1">
                        <span className="flex items-center gap-0.5">
                          <span className="material-icons text-xs text-amber-500">schedule</span>
                          {dish.prep_time || '25m'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 truncate">
                          <span className="material-icons text-xs text-purple-400">group</span>
                          {dish.serving_size || '1 Serving'}
                        </span>
                      </div>
                    </div>

                    {/* Price & Action Buttons Footer */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-black text-sm text-[#C8102E]">
                          ₱{Number(dish.price).toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        {/* View All Info Button */}
                        <button
                          type="button"
                          onClick={() => openDishDetails(dish)}
                          className="h-7 w-full rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-slate-300 dark:border-slate-600"
                          title="View Full Dish Details & Ingredients"
                        >
                          <span className="material-icons text-xs text-slate-500 dark:text-slate-400">info</span>
                          <span>View</span>
                        </button>

                        {/* Fast Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(dish)}
                          disabled={isSoldOut}
                          className={`h-7 w-full rounded-md text-white text-[10px] font-black transition active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer border ${
                            isSoldOut
                              ? 'bg-slate-400 border-slate-400 opacity-50 cursor-not-allowed'
                              : 'bg-[#C8102E] hover:bg-[#9B0B21] border-[#C8102E]'
                          }`}
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Menu Items View Mode 2: Compact Operational Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-2 px-2">Dish</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Serving</th>
                    <th className="py-2 px-2">Prep Time</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2 text-right">Price</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPOSItems.map(dish => {
                    const imgUrl = resolveImageUrl(dish.image)
                    const avail = dish.availability || 'Available'
                    const isSoldOut = avail === 'Sold Out'

                    return (
                      <tr key={dish.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={dish.name}
                                className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <span className="material-icons text-xs text-slate-400">restaurant</span>
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-xs block leading-tight">{dish.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{dish.code || `#${dish.id}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{dish.category_name || dish.category}</td>
                        <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{dish.serving_size || '1 Serving'}</td>
                        <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{dish.prep_time || '25m'}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            avail === 'Available'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : avail === 'Low Stock'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}>
                            {avail}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-[#C8102E]">
                          ₱{Number(dish.price).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => openDishDetails(dish)}
                            className="h-6 w-[52px] rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer border border-slate-300 dark:border-slate-600 inline-flex items-center justify-center gap-0.5"
                          >
                            <span className="material-icons text-[11px] text-slate-500 dark:text-slate-400">info</span>
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(dish)}
                            disabled={isSoldOut}
                            className={`h-6 w-[52px] rounded-md text-white text-[10px] font-black cursor-pointer border inline-flex items-center justify-center ${
                              isSoldOut ? 'bg-slate-400 border-slate-400 opacity-50 cursor-not-allowed' : 'bg-[#C8102E] hover:bg-[#9B0B21] border-[#C8102E]'
                            }`}
                          >
                            + ADD
                          </button>
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

      {/* Right Column: Pinned Sticky Live Terminal Receipt (5 Cols) */}
      <div className={`lg:col-span-5 lg:sticky lg:top-[115px] z-20 ${mobileTab === 'receipt' ? 'block' : 'hidden lg:block'}`}>
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col h-[calc(100vh-180px)] min-h-[520px] lg:h-[calc(100vh-130px)] lg:min-h-[640px] ${isDarkMode ? 'bg-[#1C2541]/95 backdrop-blur-md border-slate-700 text-white' : 'bg-slate-50/95 backdrop-blur-md border-slate-300 text-slate-900'}`}>
          {/* Receipt Top Header (shrink-0) */}
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-300 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#C8102E] text-base">receipt_long</span>
              <h3 className="font-black text-xs uppercase tracking-widest text-[#C8102E]">Receipt Terminal</h3>
              {cart.length > 0 && (
                <span className="bg-red-100 dark:bg-red-950/60 text-[#C8102E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                  {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setCart([])
                setSelectedOTCPhoneOrder(null)
                setCustomerName('')
                setCashTendered('')
                setDiscountType('none')
              }}
              disabled={cart.length === 0 && !selectedOTCPhoneOrder}
              className="text-[10px] font-bold text-red-500 hover:underline disabled:opacity-40 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Selected Online Order Active Status in Terminal */}
          {selectedOTCPhoneOrder && (
            <div className="my-2 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 border-l-4 border-l-[#C8102E] bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shrink-0 space-y-1.5 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-icons text-[#C8102E] text-base shrink-0">receipt_long</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    Settling Online Order <span className="font-mono text-[#C8102E]">#{selectedOTCPhoneOrder.order_code || selectedOTCPhoneOrder.order_id}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedOTCPhoneOrder}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition cursor-pointer shrink-0"
                  title="Unload from terminal"
                >
                  ✕ Unload
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-bold truncate text-slate-700 dark:text-slate-300">
                  Customer: {selectedOTCPhoneOrder.customer_name || 'Walk-in Guest'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-[#C8102E] dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/50 uppercase tracking-wide shrink-0">
                  Pay at Counter
                </span>
              </div>
            </div>
          )}

          {/* Service Switcher & Table Bar (Single Compact Row) */}
          <div className="my-2 shrink-0 flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700/80 shrink-0">
              {[
                { id: 'Dine-in', label: 'Dine-in', icon: 'restaurant' },
                { id: 'Takeout', label: 'Takeout', icon: 'shopping_bag' },
                { id: 'Delivery', label: 'Delivery', icon: 'two_wheeler' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setOrderType(st.id)}
                  className={`py-1 px-2 rounded-md font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                    orderType === st.id
                      ? 'bg-[#C8102E] text-white shadow-2xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-icons text-xs">{st.icon}</span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {orderType === 'Dine-in' ? (
                <div className="relative">
                  <span className="material-icons absolute left-2 top-1.5 text-slate-400 text-sm pointer-events-none">
                    table_restaurant
                  </span>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className={`w-full pl-6 pr-3 py-1 rounded-md font-bold border text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06', 'VIP Table 08', 'VIP Table 12'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ) : orderType === 'Takeout' ? (
                <div className="relative">
                  <span className="material-icons absolute left-2 top-1.5 text-slate-400 text-sm pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    placeholder="Customer / Pickup Tag..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full pl-6 pr-3 py-1 rounded-md font-bold border text-xs focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              ) : (
                <div className="relative">
                  <span className="material-icons absolute left-2 top-1.5 text-slate-400 text-sm pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    placeholder="Customer Name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full pl-6 pr-3 py-1 rounded-md font-bold border text-xs focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details Form (Shown only when Delivery is selected) */}
          {orderType === 'Delivery' && (
            <div className={`p-2 rounded-lg border mb-2 space-y-1.5 text-xs animate-in fade-in ${
              isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="material-icons text-xs text-amber-600 shrink-0">location_on</span>
                <input
                  type="text"
                  placeholder="Delivery Address (Required: House #, Street, Brgy)..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={`flex-1 px-2 py-1 rounded font-medium text-[11px] border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                    isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="material-icons text-xs text-slate-400 shrink-0">phone</span>
                  <input
                    type="tel"
                    placeholder="Recipient Phone..."
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    className={`w-full px-2 py-0.5 rounded font-medium text-[11px] border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-icons text-xs text-slate-400 shrink-0">notes</span>
                  <input
                    type="text"
                    placeholder="Landmark / Notes..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className={`w-full px-2 py-0.5 rounded font-medium text-[11px] border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-semibold px-0.5">
                <span className="flex items-center gap-1">
                  <span className="material-icons text-[11px]">two_wheeler</span> Doorstep Dispatch
                </span>
                <span className="font-mono bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800 font-bold">+₱49.00 Flat Delivery Fee</span>
              </div>
            </div>
          )}

          {/* Receipt Cart Itemized Table (Clean bottom border under each item) */}
          <div className="flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 text-xs font-semibold">
                <span className="material-icons text-4xl block mb-2 text-slate-400 opacity-60">shopping_cart</span>
                <p className="text-xs font-bold">Receipt is empty</p>
                <p className="text-[10px] text-slate-400 opacity-70 mt-0.5">Click + ADD on any dish to begin</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id ?? item.item_id}
                  className="py-2.5 px-1 text-xs space-y-1.5 transition border-b border-slate-200 dark:border-slate-700/80"
                >
                  {/* Top Line: Item Name, Serving Chip, Price, & Remove */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {item.serving_size || '1 Serving'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-xs text-[#C8102E]">
                        ₱{(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(item.id ?? item.item_id)}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                        title="Remove item"
                      >
                        <span className="material-icons text-sm block">close</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Line: Stepper on Left, Note on Right */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Stepper */}
                    <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.id ?? item.item_id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#C8102E] font-bold text-xs cursor-pointer select-none"
                        title="Decrease"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-xs text-slate-900 dark:text-white select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(item.id ?? item.item_id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#C8102E] font-bold text-xs cursor-pointer select-none"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>

                    {/* Note input field with amber active state */}
                    <div className="flex-1 max-w-[210px] relative">
                      <input
                        type="text"
                        placeholder="+ Add note / instruction..."
                        value={item.special_instructions || ''}
                        onChange={(e) => handleUpdateCartInstruction(item.id ?? item.item_id, e.target.value)}
                        className={`w-full pl-2 pr-6 py-0.5 rounded text-[10px] border focus:outline-none transition ${
                          item.special_instructions
                            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                            : isDarkMode
                            ? 'bg-transparent border-slate-700/80 text-slate-300 placeholder-slate-500 hover:border-slate-600 focus:border-[#C8102E]'
                            : 'bg-white border-slate-300 text-slate-700 placeholder-slate-400 hover:border-slate-400 focus:border-[#C8102E]'
                        }`}
                      />
                      {item.special_instructions && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCartInstruction(item.id ?? item.item_id, '')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-amber-700 dark:text-amber-300 hover:text-rose-600 text-[10px] font-bold p-0.5"
                          title="Clear note"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Financial Calculation Breakdown (Clean & Compact) */}
          <div className={`p-2.5 rounded-lg border space-y-1 text-xs my-2 shrink-0 ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-100/70 border-slate-300/80'}`}>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₱{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Discount:</span>
              <div className="flex items-center gap-1.5">
                {discountAmount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px]">
                    -₱{discountAmount.toFixed(2)}
                  </span>
                )}
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className={`px-1.5 py-0.5 text-[10px] rounded font-bold border cursor-pointer ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-300'}`}
                >
                  <option value="none">Standard (0%)</option>
                  <option value="senior">Senior (20%)</option>
                  <option value="pwd">PWD (20%)</option>
                </select>
              </div>
            </div>

            {orderType === 'Delivery' && (
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="material-icons text-[12px]">two_wheeler</span> Delivery Fee:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₱49.00</span>
              </div>
            )}

            <div className="border-t border-slate-300 dark:border-slate-700 pt-1 flex justify-between items-baseline">
              <span className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Grand Total:</span>
              <span className="font-mono font-black text-base text-[#C8102E]">₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector (shrink-0) */}
          <div className="space-y-1.5 shrink-0">
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'Cash', label: orderType === 'Delivery' ? 'Cash / COD' : 'Cash', icon: 'payments' },
                { id: 'GCash', label: 'GCash', icon: 'qr_code_scanner' },
                { id: 'Card', label: 'Card', icon: 'credit_card' }
              ].map(pm => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-1 rounded-md font-bold text-xs border transition flex items-center justify-center gap-1 cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-2xs'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-icons text-xs">{pm.icon}</span>
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'Cash' && (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-xs">₱</span>
                    <input
                      type="number"
                      placeholder="Cash Tendered..."
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className={`w-full pl-5 pr-2 py-1 rounded-md font-mono font-bold border text-xs focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[9px] font-sans font-bold mr-1">Change:</span>
                    <span className={`font-bold text-xs ${changeDue > 0 ? 'text-emerald-500 font-black' : 'text-slate-400'}`}>
                      ₱{changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quick Tender Keys */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal.toString())}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black border cursor-pointer transition ${
                      isDarkMode
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}
                    title="Exact Amount"
                  >
                    Exact
                  </button>
                  {[500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className={`flex-1 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      ₱{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'GCash' && (
              <div className="p-1.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-[10px] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 text-sky-700 dark:text-sky-300">
                  <span className="material-icons text-sm">qr_code</span>
                  <span className="font-bold">Scan GCash QR</span>
                </div>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-300">₱{grandTotal.toFixed(2)}</span>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
                  <span className="material-icons text-sm">credit_card</span>
                  <span className="font-bold">Swipe / Tap Card</span>
                </div>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">₱{grandTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Submit Order Button (shrink-0) */}
          <button
            type="button"
            onClick={selectedOTCPhoneOrder ? handleConfirmOTCPaymentInTerminal : handlePOSOrderSubmit}
            disabled={
              cart.length === 0 ||
              (paymentMethod === 'Cash' && cashTendered !== '' && cashNum < grandTotal)
            }
            className={`w-full mt-2.5 py-2.5 rounded-lg text-white font-black text-xs shadow-xs transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              selectedOTCPhoneOrder
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-[#C8102E] hover:bg-[#9B0B21]'
            }`}
          >
            <span className="material-icons text-base">
              {selectedOTCPhoneOrder ? 'check_circle' : 'print'}
            </span>
            <span>
              {selectedOTCPhoneOrder
                ? `RECEIVE ${paymentMethod.toUpperCase()} & SEND TO KANBAN`
                : 'SUBMIT ORDER & PRINT TICKET'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED DISH SPECIFICATIONS & INGREDIENTS MODAL */}
      {/* ========================================================================= */}
      {selectedDishForView && (() => {
        const dish = selectedDishForView
        const imgUrl = resolveImageUrl(dish.image)
        const avail = dish.availability || 'Available'
        const isSoldOut = avail === 'Sold Out'

        // Parse ingredients if comma-separated or string
        const ingredientsList = dish.ingredients
          ? typeof dish.ingredients === 'string'
            ? dish.ingredients.split(',').map(s => s.trim()).filter(Boolean)
            : Array.isArray(dish.ingredients)
            ? dish.ingredients
            : []
          : []

        // Parse allergens
        const hasAllergens = dish.allergens && dish.allergens.toLowerCase() !== 'none' && dish.allergens.trim().length > 0

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div
              className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto ${
                isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {/* Modal Header Bar */}
              <div className="px-5 py-3 border-b flex justify-between items-center border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#C8102E] text-lg">restaurant_menu</span>
                  <div>
                    <h3 className="font-black text-xs tracking-tight">Dish Specifications & Overview</h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Item #{dish.id || dish.item_id} • {dish.category_name || dish.category || 'Kitchen Menu'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDishForView(null)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <span className="material-icons text-base">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                {/* Hero Dish Visual & Basic Info */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative w-full sm:w-52 h-40 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <span className="material-icons text-4xl opacity-50">restaurant</span>
                        <span className="text-[10px] font-bold uppercase mt-1">No Image</span>
                      </div>
                    )}

                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-2xs ${
                      avail === 'Available'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : avail === 'Low Stock'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-rose-600 text-white border-rose-500'
                    }`}>
                      {avail}
                    </span>

                    {Boolean(dish.is_featured) && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {dish.category_name || dish.category}
                        </span>
                        <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {dish.name}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                        <span className="font-mono font-black text-lg text-[#C8102E]">
                          ₱{Number(dish.price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {dish.description || 'No detailed description provided for this menu specialty.'}
                    </p>

                    {/* Operational Badges Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Serving Size</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {dish.serving_size || '1 Serving'}
                        </span>
                      </div>

                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Prep Time</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                          {dish.prep_time || '25 mins'}
                        </span>
                      </div>

                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Status</span>
                        <span className={`font-extrabold ${dish.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {dish.status || 'Active'}
                        </span>
                      </div>

                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Updated</span>
                        <span className="font-bold text-slate-500 text-[10px]">
                          {dish.last_updated || 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allergens Warning Banner */}
                {hasAllergens ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-700 dark:text-amber-300">
                    <span className="material-icons text-lg text-amber-500 shrink-0">warning_amber</span>
                    <div className="text-xs">
                      <strong className="font-black uppercase tracking-wider block text-[10px]">Allergen Notice:</strong>
                      <span>Contains: {dish.allergens}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <span className="material-icons text-base text-emerald-500 shrink-0">check_circle</span>
                    <span className="text-xs font-semibold">No allergens reported.</span>
                  </div>
                )}

                {/* Ingredients Breakdown */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span className="material-icons text-xs text-[#C8102E]">kitchen</span>
                    <span>Recipe Ingredients & Composition</span>
                  </h4>

                  {ingredientsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {ingredientsList.map((ing, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700"
                        >
                          🌿 {ing}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic">
                      {dish.ingredients || 'Standard secret house marinade, spices, and fresh produce.'}
                    </p>
                  )}
                </div>

                {/* Special Instructions & Add to Order in Modal */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="font-black text-xs block">Order Preparation Notes:</span>
                      <span className="text-[10px] text-slate-400">e.g. Less spicy, gravy on side, extra crispy</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Qty:</span>
                      <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="w-7 h-7 font-black text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black text-xs">{modalQty}</span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="w-7 h-7 font-black text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Add special kitchen instructions..."
                    value={modalInstructions}
                    onChange={(e) => setModalInstructions(e.target.value)}
                    className={`w-full p-2 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-3.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Total</span>
                  <span className="font-mono font-black text-base text-[#C8102E]">
                    ₱{(Number(dish.price) * modalQty).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDishForView(null)}
                    className="px-3.5 py-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => {
                      handleAddToCart(dish, modalQty, modalInstructions)
                      setSelectedDishForView(null)
                    }}
                    className={`px-4 py-2 rounded-md text-white font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                      isSoldOut ? 'bg-slate-400 opacity-50 cursor-not-allowed' : 'bg-[#C8102E] hover:bg-[#9B0B21]'
                    }`}
                  >
                    <span className="material-icons text-sm">add_shopping_cart</span>
                    <span>Add {modalQty} to Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      {/* Floating Bottom Cart Bar for Mobile when browsing menu */}
      {mobileTab === 'menu' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#1C2541] text-white p-3 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#C8102E] flex items-center justify-center text-white font-black text-xs shadow-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Current Order</span>
                <span className="text-sm font-black text-white">₱{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('receipt')}
              className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>View Receipt</span>
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. COUNTER ORDERS QUEUE MODAL (Browse & Select Pending OTC Phone Orders) */}
      {/* ========================================================================= */}
      {/* COUNTER ORDERS QUEUE MODAL - Styled with Customer Page Design Basis */}
      {isCounterOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => { setIsCounterOrdersModalOpen(false); setSettleSearchQuery(''); }}></div>

          <div className={`relative z-10 w-full max-w-2xl rounded-md p-5 sm:p-6 space-y-4 border border-gray-400 dark:border-slate-500 shadow-2xl transition-colors max-h-[90vh] flex flex-col ${
            isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-300 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={counterPaymentIcon}
                  alt="Counter Payment"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base">Counter Orders Queue</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[#C8102E] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                    {pendingCounterOrders.length} Pending
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setIsCounterOrdersModalOpen(false); setSettleSearchQuery(''); }}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-700"
                title="Close dialog"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* Subtitle description */}
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 shrink-0">
              Customer online orders awaiting OTC payment at the counter. Select an order to load directly into the POS Receipt Terminal.
            </p>

            {/* Quick Filter Search */}
            <div className="relative shrink-0">
              <span className="material-icons absolute left-2.5 top-2.5 text-gray-400 text-sm pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Search customer name, phone, or order code..."
                value={settleSearchQuery}
                onChange={(e) => setSettleSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-7 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-gray-50 border-gray-300 text-[#071A3D] placeholder-gray-400'
                }`}
              />
              {settleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSettleSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                >
                  <span className="material-icons text-xs">close</span>
                </button>
              )}
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const filtered = pendingCounterOrders.filter(o => {
                  if (!settleSearchQuery) return true
                  const q = settleSearchQuery.toLowerCase()
                  return (
                    (o.order_code && o.order_code.toLowerCase().includes(q)) ||
                    (String(o.order_id).includes(q)) ||
                    (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                    (o.phone && o.phone.toLowerCase().includes(q))
                  )
                })

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400 space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <span className="material-icons text-2xl">done_all</span>
                      </div>
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-200">
                        {settleSearchQuery ? 'No Matching Orders' : 'All Online Orders Settled!'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {settleSearchQuery ? 'Try another search term.' : 'There are no customer online orders awaiting payment at the counter right now.'}
                      </p>
                    </div>
                  )
                }

                return filtered.map(order => (
                  <div
                    key={order.order_id}
                    className={`p-4 rounded-md border space-y-3 transition ${
                      isDarkMode
                        ? 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                        : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {/* Header Row: Code, Badge, Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#C8102E]">
                            {order.order_code || `#${order.order_id}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-[#C8102E] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                            PAY AT COUNTER
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm mt-1">
                          {order.customer_name || 'Walk-in Guest'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="material-icons text-xs text-[#C8102E]">restaurant</span>
                          <span>{order.order_type || 'Takeout'}</span>
                          {order.table_number && order.table_number !== 'Takeout Counter' && (
                            <>
                              <span>•</span>
                              <span>{order.table_number}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Online Order</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                          Total Due
                        </span>
                        <span className="font-mono font-extrabold text-base sm:text-lg text-[#C8102E]">
                          ₱{Number(order.total_amount || order.grand_total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Itemized Docket Box */}
                    <div className="p-3 rounded-md border border-dashed border-gray-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950/40 text-xs space-y-1.5">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            <span className="font-bold text-[#C8102E] mr-1.5">{it.quantity}x</span>
                            {it.name}
                            {it.special_instructions && (
                              <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 font-normal italic">
                                ({it.special_instructions})
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-bold text-gray-600 dark:text-gray-300">
                            ₱{(Number(it.price || 0) * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectOrderForTerminal(order)}
                        className="w-full sm:w-auto py-2 px-4 rounded-md bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <span className="material-icons text-sm">receipt_long</span>
                        <span>Load into POS Terminal</span>
                        <span className="material-icons text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                {pendingCounterOrders.length} {pendingCounterOrders.length === 1 ? 'order' : 'orders'} waiting at counter
              </span>
              <button
                type="button"
                onClick={() => { setIsCounterOrdersModalOpen(false); setSettleSearchQuery(''); }}
                className="py-2 px-4 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 transition cursor-pointer text-gray-700 dark:text-gray-200"
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
