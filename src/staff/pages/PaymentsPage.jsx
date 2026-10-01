import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import counterPaymentIcon from '../../assets/CounterPayment_icon.png'

export default function StaffPaymentsPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  // Active sub-tab: 'pending', 'transactions', 'refunds', 'summary'
  const currentTab = searchParams.get('tab') || 'pending'
  const setTab = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [refundModalOrder, setRefundModalOrder] = useState(null)
  const [refundReason, setRefundReason] = useState('Customer Request / Order Cancelled')
  const [refundMethod, setRefundMethod] = useState('Cash Returned at Counter')
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  // Fetch orders with payment details
  const fetchPaymentsData = async () => {
    setIsLoading(true)
    try {
      const res = await api.orders.getOrders()
      const list = (res?.status === 'success' && Array.isArray(res.orders || res.data)) ? (res.orders || res.data) : []
      setOrders(list)
    } catch (err) {
      console.error('Failed to load staff payments data:', err)
      showToast('Failed to load payment records.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchPaymentsData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Helper date checker
  const isDateInRange = (dateStr, range) => {
    if (!dateStr) return range === 'all'
    const d = new Date(dateStr)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    if (range === 'today') {
      return d >= startOfToday
    } else if (range === 'yesterday') {
      return d >= startOfYesterday && d < startOfToday
    } else if (range === 'week') {
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfWeek.getDate() - 7)
      return d >= startOfWeek
    } else if (range === 'month') {
      const startOfMonth = new Date(startOfToday)
      startOfMonth.setDate(startOfMonth.getDate() - 30)
      return d >= startOfMonth
    }
    return true
  }

  // 1. PENDING OTC ORDERS LIST (Primary for Staff Cashiers)
  const pendingOrders = useMemo(() => {
    return orders.filter(o => {
      const payStatus = (o.payment_status || 'unpaid').toLowerCase()
      const isUnpaid = payStatus !== 'paid' && payStatus !== 'refunded'
      if (!isUnpaid) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const orderCode = (o.order_code || '').toLowerCase()
        const custName = (o.customer_name || '').toLowerCase()
        return orderCode.includes(q) || custName.includes(q)
      }

      return true
    })
  }, [orders, searchQuery])

  // 2. COMPLETED TRANSACTIONS LIST
  const completedTransactions = useMemo(() => {
    return orders.filter(o => {
      const payStatus = (o.payment_status || 'unpaid').toLowerCase()
      const isPaidOrRefunded = payStatus === 'paid' || payStatus === 'refunded' || o.refund_amount
      if (!isPaidOrRefunded) return false

      const dateToCheck = o.paid_at || o.created_at
      if (!isDateInRange(dateToCheck, dateFilter)) return false

      const method = (o.payment_method || 'counter').toLowerCase()
      if (methodFilter === 'cash' && !method.includes('cash') && !method.includes('counter')) return false
      if (methodFilter === 'online' && !method.includes('online') && !method.includes('gcash') && !method.includes('card') && !method.includes('maya')) return false
      if (methodFilter === 'refunded' && payStatus !== 'refunded') return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const orderCode = (o.order_code || '').toLowerCase()
        const custName = (o.customer_name || '').toLowerCase()
        const payId = (o.payment_id || `PAY-${o.order_id}`).toLowerCase()
        return orderCode.includes(q) || custName.includes(q) || payId.includes(q)
      }

      return true
    })
  }, [orders, dateFilter, methodFilter, searchQuery])

  // 3. REFUNDS LIST
  const refundRecords = useMemo(() => {
    return orders.filter(o => {
      const payStatus = (o.payment_status || '').toLowerCase()
      const isRefunded = payStatus === 'refunded' || o.refund_amount !== null
      const isPaidAndCancelled = (payStatus === 'paid') && (o.status === 'Cancelled' || o.status === 'Rejected')
      if (!isRefunded && !isPaidAndCancelled) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const orderCode = (o.order_code || '').toLowerCase()
        const custName = (o.customer_name || '').toLowerCase()
        return orderCode.includes(q) || custName.includes(q)
      }

      return true
    })
  }, [orders, searchQuery])

  // 4. SHIFT / REGISTER SUMMARY
  const shiftStats = useMemo(() => {
    const todayOrders = orders.filter(o => {
      const d = o.paid_at || o.created_at
      return isDateInRange(d, 'today')
    })

    let todayCash = 0
    let todayOnline = 0
    let todayTotal = 0
    let todayCount = 0
    let todayRefunds = 0

    todayOrders.forEach(o => {
      const payStatus = (o.payment_status || 'unpaid').toLowerCase()
      const amount = Number(o.grand_total || o.total_amount || 0)
      const method = (o.payment_method || 'counter').toLowerCase()

      if (payStatus === 'paid' || payStatus === 'refunded') {
        todayTotal += amount
        todayCount += 1
        if (method.includes('cash') || method.includes('counter')) {
          todayCash += amount
        } else {
          todayOnline += amount
        }
      }

      if (payStatus === 'refunded' || o.refund_amount) {
        todayRefunds += Number(o.refund_amount || amount)
      }
    })

    return {
      todayCash,
      todayOnline,
      todayTotal,
      todayCount,
      todayRefunds,
      pendingCount: pendingOrders.length,
      pendingTotal: pendingOrders.reduce((sum, o) => sum + Number(o.grand_total || o.total_amount || 0), 0)
    }
  }, [orders, pendingOrders])

  // Open refund modal
  const handleOpenRefundModal = (order) => {
    setRefundModalOrder(order)
    setRefundReason('Order cancelled by customer at counter')
    setRefundMethod('Cash Returned at Counter')
  }

  // Execute refund
  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return
    setIsProcessingRefund(true)
    try {
      const orderId = refundModalOrder.order_id
      const refundAmt = refundModalOrder.grand_total || refundModalOrder.total_amount || 0

      const res = await api.orders.refundOrder(orderId, {
        refund_amount: refundAmt,
        refund_reason: `${refundReason} (${refundMethod})`
      })

      if (res?.status === 'success') {
        showToast(`Order #${refundModalOrder.order_code || refundModalOrder.order_id} marked as refunded.`, 'success')
        setRefundModalOrder(null)
        await fetchPaymentsData()
      } else {
        showToast(res?.message || 'Failed to process refund.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error executing refund.', 'error')
    } finally {
      setIsProcessingRefund(false)
    }
  }

  // Forward to POS
  const handleProcessInPOS = (order) => {
    navigate('/staff/pos', { state: { selectOrder: order } })
  }

  return (
    <div className="space-y-4 pb-12 text-xs animate-in fade-in duration-150">

      {/* Top Console Stats Bar */}
      <div className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
        }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold shrink-0 border border-[#C8102E]/20">
            <span className="material-icons text-2xl">point_of_sale</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm uppercase tracking-wide">Staff Cashier &amp; Payments Terminal</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Register Online</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Collect cash for customer mobile orders, print receipts, and issue cash refunds.
            </p>
          </div>
        </div>

        {/* Quick Search & POS Shortcut */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={fetchPaymentsData}
            disabled={isLoading}
            className={`p-2 rounded-lg border font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            title="Refresh payment records"
          >
            <span className={`material-icons text-sm ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/staff/pos')}
            className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span className="material-icons text-base">point_of_sale</span>
            <span>Open POS Terminal</span>
            {pendingOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[#C8102E] text-[10px] font-black">
                {pendingOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-2 overflow-x-auto [scrollbar-width:none]">
        {[
          { id: 'pending', label: '1. Pending OTC Counter', icon: 'pending_actions', count: pendingOrders.length, highlight: pendingOrders.length > 0 },
          { id: 'transactions', label: '2. Transactions', icon: 'receipt_long', count: completedTransactions.length },
          { id: 'refunds', label: '3. Refunds', icon: 'currency_exchange', count: refundRecords.length },
          { id: 'summary', label: '4. Shift Summary', icon: 'analytics' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${currentTab === tab.id
                ? 'bg-[#C8102E] text-white shadow-xs'
                : isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${currentTab === tab.id
                  ? 'bg-white text-[#C8102E]'
                  : tab.highlight
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENDING OTC (Front-of-House Cashier Collection Queue) */}
      {/* ========================================================================= */}
      {currentTab === 'pending' && (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-black shrink-0 border border-amber-500/40">
                <span className="material-icons text-2xl text-amber-600 dark:text-amber-400">hourglass_top</span>
              </div>
              <div>
                <p className="font-extrabold text-xs">Customer Over-The-Counter (OTC) Cash Queue</p>
                <p className="text-[11px] opacity-80">
                  Customers order via their phone and must pay cash at this register before their ticket reaches the kitchen board.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black">{pendingOrders.length} Waiting</span>
              <span className="block text-[10px] opacity-70">₱{shiftStats.pendingTotal.toFixed(2)} total</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="material-icons absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Filter by Order # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
            />
          </div>

          {/* Orders Cards Grid */}
          {pendingOrders.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
              <span className="material-icons text-4xl text-emerald-500 mb-2">check_circle</span>
              <p className="font-black text-sm text-slate-800 dark:text-slate-200">No Unpaid Counter Orders</p>
              <p className="text-xs text-slate-400 mt-1">All mobile orders have settled payment or none are pending.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingOrders.map(order => {
                const total = Number(order.grand_total || order.total_amount || 0)
                const items = Array.isArray(order.items) ? order.items : []
                return (
                  <div
                    key={order.order_id}
                    className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between transition hover:shadow-md ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
                      }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[#C8102E]">{order.order_code || `#${order.order_id}`}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/30">
                              Awaiting Cash
                            </span>
                          </div>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mt-0.5">
                            {order.customer_name || 'Guest Diner'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 dark:text-white">₱{total.toFixed(2)}</span>
                          <span className="block text-[10px] text-slate-400 uppercase font-bold">{order.order_type || 'Dine-in'}</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="py-2 space-y-1">
                        {items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[180px]">
                              {it.quantity}x {it.name || it.item_name}
                            </span>
                            <span className="text-slate-500 font-mono">
                              ₱{(Number(it.price || it.unit_price || 0) * Number(it.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[10px] text-slate-400 italic">+{items.length - 3} more items...</p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleProcessInPOS(order)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-icons text-base">point_of_sale</span>
                        <span>Settle ₱{total.toFixed(2)} in POS</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TRANSACTIONS (Completed Payments History) */}
      {/* ========================================================================= */}
      {currentTab === 'transactions' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className={`p-3.5 rounded-xl border shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
            }`}>
            <div className="relative flex-1 max-w-md">
              <span className="material-icons absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Search Order #, Customer, or Payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-7 py-1.5 rounded-md text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'cash', label: 'Cash' },
                  { id: 'online', label: 'Online' },
                  { id: 'refunded', label: 'Refunded' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMethodFilter(tab.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${methodFilter === tab.id
                        ? 'bg-white dark:bg-slate-800 text-[#C8102E] shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#C8102E] cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
            }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                    <th className="py-3 px-3.5">Payment ID</th>
                    <th className="py-3 px-3.5">Order Code</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Method</th>
                    <th className="py-3 px-3.5">Amount</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Time</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {completedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No transactions found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    completedTransactions.map(tx => {
                      const total = Number(tx.grand_total || tx.total_amount || 0)
                      const isRefunded = tx.payment_status?.toLowerCase() === 'refunded' || tx.refund_amount
                      const method = (tx.payment_method || 'counter').toLowerCase()
                      const dateStr = tx.paid_at || tx.created_at

                      return (
                        <tr
                          key={tx.order_id}
                          className={`transition ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                            {tx.payment_id || `PAY-${tx.order_id}`}
                          </td>
                          <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-white">
                            {tx.order_code || `#${tx.order_id}`}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {tx.customer_name || 'Guest Diner'}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center gap-1 font-extrabold uppercase text-[10px]">
                              <span className="material-icons text-xs text-slate-400">
                                {method.includes('cash') || method.includes('counter') ? 'payments' : 'credit_card'}
                              </span>
                              <span>{tx.payment_method || 'Cash'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-white font-mono">
                            ₱{total.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3.5">
                            {isRefunded ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/30">
                                Refunded
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                                Paid
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-[11px] text-slate-500 font-mono">
                            {dateStr ? new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer"
                            >
                              View Ticket
                            </button>
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
      {/* TAB 3: REFUNDS (Customer Returns & Cancelled Order Settle) */}
      {/* ========================================================================= */}
      {currentTab === 'refunds' && (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center font-black shrink-0 border border-rose-500/40">
                <span className="material-icons text-2xl text-rose-600 dark:text-rose-400">currency_exchange</span>
              </div>
              <div>
                <p className="font-extrabold text-xs">Customer Refund Claims &amp; Reversals</p>
                <p className="text-[11px] opacity-80">
                  Manage refunded transactions, return cash to diner, and document cancellation reasons.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black">{refundRecords.length} Records</span>
            </div>
          </div>

          <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
            }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                    <th className="py-3 px-3.5">Order Code</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Original Total</th>
                    <th className="py-3 px-3.5">Refund Status</th>
                    <th className="py-3 px-3.5">Refund Reason</th>
                    <th className="py-3 px-3.5 text-right">Cashier Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {refundRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No refund records or eligible cancelled orders.
                      </td>
                    </tr>
                  ) : (
                    refundRecords.map(order => {
                      const total = Number(order.grand_total || order.total_amount || 0)
                      const isAlreadyRefunded = order.payment_status?.toLowerCase() === 'refunded' || order.refund_amount !== null

                      return (
                        <tr
                          key={order.order_id}
                          className={`transition ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-white">
                            {order.order_code || `#${order.order_id}`}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {order.customer_name || 'Guest Diner'}
                          </td>
                          <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-white font-mono">
                            ₱{total.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3.5">
                            {isAlreadyRefunded ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/30">
                                Refunded (₱{Number(order.refund_amount || total).toFixed(2)})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                Cancelled - Refund Pending
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-[11px] text-slate-500 max-w-xs truncate">
                            {order.refund_reason || order.cancellation_reason || 'Customer request'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            {isAlreadyRefunded ? (
                              <span className="text-[11px] font-bold text-slate-400">Settled</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRefundModal(order)}
                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                Issue Cash Refund
                              </button>
                            )}
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
      {/* TAB 4: SHIFT SUMMARY (Register Cash Balance) */}
      {/* ========================================================================= */}
      {currentTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border shadow-xs ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Today's Total Settled</span>
                <span className="material-icons text-emerald-500">payments</span>
              </div>
              <div className="text-xl font-black text-emerald-600">₱{shiftStats.todayTotal.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">{shiftStats.todayCount} completed transactions</span>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Cash Drawer Intake</span>
                <span className="material-icons text-blue-500">point_of_sale</span>
              </div>
              <div className="text-xl font-black text-blue-600">₱{shiftStats.todayCash.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">Cash received at counter</span>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Online / PayMongo</span>
                <span className="material-icons text-purple-500">qr_code_2</span>
              </div>
              <div className="text-xl font-black text-purple-600">₱{shiftStats.todayOnline.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">GCash / Maya / Card</span>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Pending Counter Cash</span>
                <span className="material-icons text-amber-500">pending</span>
              </div>
              <div className="text-xl font-black text-amber-600">₱{shiftStats.pendingTotal.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">{shiftStats.pendingCount} unpaid tickets</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-emerald-500">receipt</span>
                <h3 className="font-black text-sm">Transaction Receipt Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Order Code:</span>
                <span className="font-black text-[#C8102E]">{selectedTransaction.order_code || `#${selectedTransaction.order_id}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Payment Ref:</span>
                <span className="font-mono font-bold">{selectedTransaction.payment_id || `PAY-${selectedTransaction.order_id}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold">{selectedTransaction.customer_name || 'Guest'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-black uppercase">{selectedTransaction.payment_method || 'Cash'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-black text-emerald-600 font-mono text-sm">
                  ₱{Number(selectedTransaction.grand_total || selectedTransaction.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs transition cursor-pointer"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-icons text-rose-500">currency_exchange</span>
                <h3 className="font-black text-sm">Issue Cash Refund</h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
              Refunding <strong>₱{Number(refundModalOrder.grand_total || refundModalOrder.total_amount || 0).toFixed(2)}</strong> to diner for Order{' '}
              <strong>{refundModalOrder.order_code || `#${refundModalOrder.order_id}`}</strong>.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Refund:</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Refund Method:</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                >
                  <option value="Cash Returned at Counter">Cash Returned at Counter</option>
                  <option value="Online GCash Transfer">Online GCash Transfer</option>
                  <option value="Customer Store Credit">Customer Store Credit</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                disabled={isProcessingRefund}
                className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isProcessingRefund}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                {isProcessingRefund ? 'Processing...' : 'Confirm Cash Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
