import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import counterPaymentIcon from '../../assets/CounterPayment_icon.png'

export default function PaymentsPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  // Active sub-tab: 'transactions', 'pending', 'refunds', 'reports'
  const currentTab = searchParams.get('tab') || 'transactions'
  const setTab = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all') // 'all', 'cash', 'online', 'refunded'
  const [dateFilter, setDateFilter] = useState('today') // 'today', 'yesterday', 'week', 'month', 'all'

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
      console.error('Failed to load payments data:', err)
      showToast('Failed to load payment records.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
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

  // 1. TRANSACTIONS LIST
  const completedTransactions = useMemo(() => {
    return orders.filter(o => {
      const payStatus = (o.payment_status || 'unpaid').toLowerCase()
      // Include paid orders and refunded orders
      const isPaidOrRefunded = payStatus === 'paid' || payStatus === 'refunded' || o.refund_amount
      if (!isPaidOrRefunded) return false

      // Filter by Date
      const dateToCheck = o.paid_at || o.created_at
      if (!isDateInRange(dateToCheck, dateFilter)) return false

      // Filter by Method
      const method = (o.payment_method || 'counter').toLowerCase()
      if (methodFilter === 'cash' && !method.includes('cash') && !method.includes('counter')) return false
      if (methodFilter === 'online' && !method.includes('online') && !method.includes('gcash') && !method.includes('card') && !method.includes('maya')) return false
      if (methodFilter === 'refunded' && payStatus !== 'refunded') return false

      // Search Query
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

  // 2. PENDING OTC ORDERS LIST
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

  // 3. REFUNDS LIST
  const refundRecords = useMemo(() => {
    return orders.filter(o => {
      const payStatus = (o.payment_status || '').toLowerCase()
      const isRefunded = payStatus === 'refunded' || o.refund_amount !== null
      // Also include orders that were paid but then rejected/cancelled (eligible for refund)
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

  // 4. FINANCIAL REPORTS CALCULATIONS
  const reportStats = useMemo(() => {
    const periodOrders = orders.filter(o => {
      const d = o.paid_at || o.created_at
      return isDateInRange(d, dateFilter)
    })

    let totalCollected = 0
    let cashVolume = 0
    let onlineVolume = 0
    let transactionCount = 0
    let refundTotal = 0
    let pendingReceivable = 0

    const methodCounts = {
      cash: 0,
      gcash: 0,
      card: 0,
      maya: 0,
      other: 0
    }

    periodOrders.forEach(o => {
      const payStatus = (o.payment_status || 'unpaid').toLowerCase()
      const amount = Number(o.grand_total || o.total_amount || 0)
      const method = (o.payment_method || 'counter').toLowerCase()

      if (payStatus === 'paid' || payStatus === 'refunded') {
        totalCollected += amount
        transactionCount += 1

        if (method.includes('cash') || method.includes('counter')) {
          cashVolume += amount
          methodCounts.cash += amount
        } else if (method.includes('gcash')) {
          onlineVolume += amount
          methodCounts.gcash += amount
        } else if (method.includes('card')) {
          onlineVolume += amount
          methodCounts.card += amount
        } else if (method.includes('maya')) {
          onlineVolume += amount
          methodCounts.maya += amount
        } else {
          onlineVolume += amount
          methodCounts.other += amount
        }
      }

      if (payStatus === 'refunded' || o.refund_amount) {
        refundTotal += Number(o.refund_amount || amount)
      }

      if (payStatus === 'unpaid') {
        pendingReceivable += amount
      }
    })

    return {
      totalCollected,
      cashVolume,
      onlineVolume,
      transactionCount,
      refundTotal,
      pendingCount: pendingOrders.length,
      pendingReceivable,
      methodCounts
    }
  }, [orders, dateFilter, pendingOrders])

  // Action: Process refund
  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return
    setIsProcessingRefund(true)
    try {
      const res = await api.orders.refundOrder(refundModalOrder.order_id, {
        refund_amount: refundModalOrder.grand_total,
        refund_reason: refundReason,
        refund_method: refundMethod
      })

      if (res?.status === 'success') {
        showToast(`Refund of ₱${Number(refundModalOrder.grand_total).toFixed(2)} processed!`, 'success')
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

  // Action: Redirect Pending Order to POS
  const handleProcessInPOS = (order) => {
    navigate('/staff/pos', { state: { selectOrder: order } })
  }

  return (
    <div className="space-y-5 pb-12 text-xs animate-in fade-in duration-150">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            Payments &amp; Financial Ledger
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Financial auditing, transaction history, OTC collections, and refund tracking for Jo's Diner.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPaymentsData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-400 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <span className={`material-icons text-base text-gray-600 ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/staff/pos')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A3D] hover:bg-[#0c2b66] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base text-amber-400">point_of_sale</span>
            <span>Open POS Terminal</span>
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Collected', value: `₱${reportStats.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'payments', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
          { label: 'Pending OTC', value: `₱${reportStats.pendingReceivable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'pending_actions', color: 'text-amber-700 bg-amber-50 border-amber-300' },
          { label: 'Total Refunds', value: `₱${reportStats.refundTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'currency_exchange', color: 'text-rose-700 bg-rose-50 border-rose-300' },
          { label: 'Transactions', value: reportStats.transactionCount, icon: 'receipt_long', color: 'text-[#071A3D] bg-slate-50 border-gray-300' },
        ].map(card => (
          <div key={card.label} className={`flex items-center gap-3 p-3 rounded-xl border ${card.color} shadow-xs`}>
            <span className="material-icons text-2xl">{card.icon}</span>
            <div>
              <div className="text-xl font-black">{card.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto [scrollbar-width:none]">
        {[
          { id: 'transactions', label: '1. Transactions', icon: 'receipt_long', count: completedTransactions.length },
          { id: 'pending', label: '2. Pending OTC', icon: 'pending_actions', count: pendingOrders.length, highlight: pendingOrders.length > 0 },
          { id: 'refunds', label: '3. Refunds', icon: 'currency_exchange', count: refundRecords.length },
          { id: 'reports', label: '4. Financial Reports', icon: 'analytics' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 border ${currentTab === tab.id
                ? 'bg-[#071A3D] text-white border-[#071A3D] shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
              }`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${currentTab === tab.id
                  ? 'bg-white text-[#071A3D]'
                  : tab.highlight
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TRANSACTIONS (Complete Payment History) */}
      {/* ========================================================================= */}
      {currentTab === 'transactions' && (
        <div className="space-y-3">

          {/* Controls Bar: Search + Filters */}
          <div className={`p-3.5 rounded-xl border shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
            }`}>
            {/* Search */}
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
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <span className="material-icons text-xs">close</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Method Filter */}
              <div className="flex items-center p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'cash', label: 'Cash / OTC' },
                  { id: 'online', label: 'Online' },
                  { id: 'refunded', label: 'Refunded' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethodFilter(m.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${methodFilter === m.id
                        ? 'bg-[#071A3D] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                    <th className="py-3 px-3.5">Payment ID</th>
                    <th className="py-3 px-3.5">Order Code</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Date & Time</th>
                    <th className="py-3 px-3.5">Method</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {completedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400">
                        <span className="material-icons text-3xl block opacity-40 mb-1">receipt</span>
                        <p className="font-bold text-xs">No transactions match your current filter.</p>
                      </td>
                    </tr>
                  ) : (
                    completedTransactions.map(order => {
                      const isRefunded = (order.payment_status || '').toLowerCase() === 'refunded'
                      const method = (order.payment_method || 'counter').toLowerCase()
                      const isCash = method.includes('cash') || method.includes('counter')
                      const paymentId = order.payment_id || `PAY-${order.order_id}`
                      const paidDate = order.paid_at ? new Date(order.paid_at) : new Date(order.created_at)

                      return (
                        <tr
                          key={order.order_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => setSelectedTransaction(order)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-[#C8102E]">
                            {paymentId}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold">
                            {order.order_code || `#${order.order_id}`}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-bold block">{order.customer_name || 'Walk-in Guest'}</span>
                            <span className="text-[10px] text-slate-400">{order.customer_phone || 'No phone'}</span>
                          </td>
                          <td className="py-3 px-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <div>{paidDate.toLocaleDateString()}</div>
                            <div className="text-[10px]">{paidDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${isCash
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              }`}>
                              <span className="material-icons text-xs">{isCash ? 'payments' : 'credit_card'}</span>
                              <span>{order.payment_method || 'Cash'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-xs text-[#C8102E]">
                            ₱{Number(order.grand_total || order.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isRefunded
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                              }`}>
                              {isRefunded ? 'Refunded' : 'Paid'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(order)}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition border border-slate-300 dark:border-slate-600 cursor-pointer"
                            >
                              View Details
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
      {/* TAB 2: PENDING (Unpaid OTC Orders awaiting Counter Payment) */}
      {/* ========================================================================= */}
      {currentTab === 'pending' && (
        <div className="space-y-4">

          {/* Information banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-[#151D36] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
            <div className="flex items-center gap-3">
              <img src={counterPaymentIcon} alt="Counter Payment" className="w-9 h-9 object-contain shrink-0" />
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm">
                  {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'} Awaiting Counter Payment
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Customers placed these orders on their phone. Click "Process Payment" to load into the POS terminal.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-black bg-[#C8102E] text-white">
              OTC QUEUE
            </span>
          </div>

          {/* Pending Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingOrders.length === 0 ? (
              <div className={`col-span-full text-center py-14 rounded-xl border ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-400'
                }`}>
                <span className="material-icons text-3xl text-emerald-500 block mb-1">done_all</span>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No Pending Counter Orders</p>
                <p className="text-xs text-slate-500 mt-0.5">All customer orders have been settled!</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div
                  key={order.order_id}
                  className={`p-4 rounded-xl border shadow-xs space-y-3 flex flex-col justify-between transition hover:border-[#C8102E]/60 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-sm text-[#C8102E]">
                          {order.order_code || `#${order.order_id}`}
                        </span>
                        <h4 className="font-bold text-xs mt-0.5">{order.customer_name || 'Walk-in Guest'}</h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 uppercase">
                        Awaiting Cash
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="material-icons text-xs text-[#C8102E]">restaurant</span>
                      <span>{order.order_type || 'Takeout'}</span>
                      <span>•</span>
                      <span>{order.table_number || 'Pickup Counter'}</span>
                    </div>

                    {/* Docket Breakdown */}
                    <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-[11px] space-y-1">
                      {(order.items || []).slice(0, 3).map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate pr-2 font-medium">
                            <span className="font-bold text-[#C8102E] mr-1">{it.quantity}x</span>
                            {it.name}
                          </span>
                          <span className="font-mono font-semibold">₱{(Number(it.price || 0) * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="text-[10px] text-slate-400 italic">
                          + {(order.items || []).length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Process Button */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Due</span>
                      <span className="font-mono font-extrabold text-base text-[#C8102E]">
                        ₱{Number(order.grand_total || order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleProcessInPOS(order)}
                      className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-icons text-sm">point_of_sale</span>
                      <span>Process Payment</span>
                      <span className="material-icons text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REFUNDS (Money Returned / Reversals) */}
      {/* ========================================================================= */}
      {currentTab === 'refunds' && (
        <div className="space-y-3">

          {/* Header Summary */}
          <div className={`p-4 rounded-xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center font-bold shrink-0 border border-rose-200">
                <span className="material-icons text-xl">currency_exchange</span>
              </span>
              <div>
                <h3 className="font-bold text-sm">Refund Management &amp; Reversals</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Track returned payments for rejected, unavailable, or customer-cancelled orders without deleting financial audit trails.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Refunds Issued</span>
              <span className="font-mono font-black text-lg text-rose-600">
                ₱{reportStats.refundTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Refunds Table */}
          <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                    <th className="py-3 px-3.5">Order</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Amount</th>
                    <th className="py-3 px-3.5">Reason</th>
                    <th className="py-3 px-3.5">Original Method</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {refundRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <span className="material-icons text-3xl block opacity-40 mb-1">done</span>
                        <p className="font-bold text-xs">No pending or processed refunds recorded.</p>
                      </td>
                    </tr>
                  ) : (
                    refundRecords.map(order => {
                      const isProcessed = (order.payment_status || '').toLowerCase() === 'refunded'
                      return (
                        <tr key={order.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3.5 font-mono font-bold text-[#C8102E]">
                            {order.order_code || `#${order.order_id}`}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-bold block">{order.customer_name || 'Valued Guest'}</span>
                            <span className="text-[10px] text-slate-400">{order.customer_phone || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-xs text-rose-600">
                            ₱{Number(order.refund_amount || order.grand_total || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3.5 text-[11px] text-slate-600 dark:text-slate-300">
                            {order.refund_reason || (order.status === 'Rejected' ? 'Order Rejected by Staff' : 'Cancelled Order')}
                          </td>
                          <td className="py-3 px-3.5 text-[11px] uppercase font-bold text-slate-500">
                            {order.payment_method || 'Cash'}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isProcessed
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 animate-pulse'
                              }`}>
                              {isProcessed ? 'Refunded' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {!isProcessed ? (
                              <button
                                type="button"
                                onClick={() => setRefundModalOrder(order)}
                                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                              >
                                Process Refund
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedTransaction(order)}
                                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] border border-slate-300 dark:border-slate-600 transition hover:text-slate-900 cursor-pointer"
                              >
                                View Slip
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
      {/* TAB 4: FINANCIAL REPORTS (Executive & Accounting Summaries) */}
      {/* ========================================================================= */}
      {currentTab === 'reports' && (
        <div className="space-y-4">

          {/* Time Filter Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Payment Summary ({dateFilter.toUpperCase()})
            </h3>
            <div className="flex items-center gap-1.5">
              {['today', 'yesterday', 'week', 'month', 'all'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateFilter(r)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${dateFilter === r
                      ? 'bg-[#071A3D] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                  {r === 'all' ? 'All Time' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Collected */}
            <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Collected</span>
                <span className="material-icons text-base text-emerald-500">account_balance_wallet</span>
              </div>
              <div className="font-mono font-black text-xl text-emerald-600">
                ₱{reportStats.totalCollected.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {reportStats.transactionCount} Successful {reportStats.transactionCount === 1 ? 'Transaction' : 'Transactions'}
              </span>
            </div>

            {/* Cash / OTC Volume */}
            <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash / OTC Volume</span>
                <span className="material-icons text-base text-emerald-500">point_of_sale</span>
              </div>
              <div className="font-mono font-black text-xl text-slate-900 dark:text-white">
                ₱{reportStats.cashVolume.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {reportStats.totalCollected > 0
                  ? `${Math.round((reportStats.cashVolume / reportStats.totalCollected) * 100)}% of total volume`
                  : '0%'}
              </span>
            </div>

            {/* Online Payments */}
            <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Online (GCash/Cards)</span>
                <span className="material-icons text-base text-blue-500">credit_card</span>
              </div>
              <div className="font-mono font-black text-xl text-blue-600">
                ₱{reportStats.onlineVolume.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {reportStats.totalCollected > 0
                  ? `${Math.round((reportStats.onlineVolume / reportStats.totalCollected) * 100)}% of total volume`
                  : '0%'}
              </span>
            </div>

            {/* Total Refunds */}
            <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${isDarkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-300'
              }`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Refunds Issued</span>
                <span className="material-icons text-base text-rose-500">currency_exchange</span>
              </div>
              <div className="font-mono font-black text-xl text-rose-600">
                ₱{reportStats.refundTotal.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Order cancellations &amp; reversals
              </span>
            </div>
          </div>

          {/* Channel Comparison and Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Breakdown Bars */}
            <div className={`p-5 rounded-xl border shadow-xs space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Payment Channel Distribution
              </h4>

              <div className="space-y-3">
                {/* Cash */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="material-icons text-sm text-emerald-500">payments</span>
                      <span>Cash / Counter Collection</span>
                    </span>
                    <span className="font-mono">₱{reportStats.cashVolume.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${reportStats.totalCollected > 0 ? (reportStats.cashVolume / reportStats.totalCollected) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* GCash */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="material-icons text-sm text-blue-500">smartphone</span>
                      <span>GCash (PayMongo)</span>
                    </span>
                    <span className="font-mono">₱{reportStats.methodCounts.gcash.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${reportStats.totalCollected > 0 ? (reportStats.methodCounts.gcash / reportStats.totalCollected) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="material-icons text-sm text-indigo-500">credit_card</span>
                      <span>Credit / Debit Cards</span>
                    </span>
                    <span className="font-mono">₱{reportStats.methodCounts.card.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${reportStats.totalCollected > 0 ? (reportStats.methodCounts.card / reportStats.totalCollected) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Receivables & Reconciliation Notice */}
            <div className={`p-5 rounded-xl border shadow-xs space-y-4 flex flex-col justify-between ${isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Unsettled Receivables (Pending OTC)
                </h4>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Pending Counter Orders</span>
                    <span className="text-base font-black">{reportStats.pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Estimated Awaiting Collection:</span>
                    <span className="font-mono font-black text-sm text-[#C8102E]">₱{reportStats.pendingReceivable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Data updated live from database records.
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  <span className="material-icons text-sm">print</span>
                  <span>Print Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANSACTION DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => setSelectedTransaction(null)} />

          <div className={`relative z-10 w-full max-w-lg rounded-md p-5 sm:p-6 space-y-4 border border-gray-400 dark:border-slate-500 shadow-2xl transition-colors max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-300 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#C8102E]">receipt_long</span>
                <h3 className="font-extrabold text-base">
                  Payment #{selectedTransaction.payment_id || `PAY-${selectedTransaction.order_id}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* Content info */}
            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Reference:</span>
                  <span className="font-mono font-bold text-[#C8102E]">
                    {selectedTransaction.order_code || `#${selectedTransaction.order_id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-bold">{selectedTransaction.customer_name || 'Walk-in Guest'}</span>
                </div>
                {selectedTransaction.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span>{selectedTransaction.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-bold uppercase text-emerald-600">{selectedTransaction.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-bold uppercase">{selectedTransaction.payment_status || 'Paid'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span>{new Date(selectedTransaction.paid_at || selectedTransaction.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Itemized Docket */}
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                  Ordered Items &amp; Charges
                </span>
                <div className="p-3 rounded-md border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-950/40 space-y-1.5">
                  {(selectedTransaction.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span>
                        <span className="font-bold text-[#C8102E] mr-1.5">{it.quantity}x</span>
                        {it.name}
                      </span>
                      <span className="font-mono font-semibold">
                        ₱{(Number(it.price || 0) * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-300 dark:border-slate-700 flex justify-between font-extrabold text-sm">
                    <span>Total Paid</span>
                    <span className="font-mono text-[#C8102E]">
                      ₱{Number(selectedTransaction.grand_total || selectedTransaction.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Notice if applicable */}
              {(selectedTransaction.refund_amount || selectedTransaction.payment_status === 'refunded') && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <span className="material-icons text-sm">currency_exchange</span>
                    <span>Refund Record Details</span>
                  </div>
                  <div className="text-[11px] flex justify-between">
                    <span>Amount Refunded:</span>
                    <span className="font-mono font-bold">₱{Number(selectedTransaction.refund_amount || selectedTransaction.grand_total).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] flex justify-between">
                    <span>Reason:</span>
                    <span>{selectedTransaction.refund_reason || 'Order Cancelled'}</span>
                  </div>
                  {selectedTransaction.refunded_at && (
                    <div className="text-[11px] flex justify-between">
                      <span>Processed At:</span>
                      <span>{new Date(selectedTransaction.refunded_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-gray-300 dark:border-slate-700 flex justify-between items-center shrink-0">
              {selectedTransaction.payment_status === 'paid' ? (
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedTransaction
                    setSelectedTransaction(null)
                    setRefundModalOrder(ord)
                  }}
                  className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                >
                  Initiate Refund
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Archived Record</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="py-1.5 px-4 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REFUND CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0" onClick={() => !isProcessingRefund && setRefundModalOrder(null)} />

          <div className={`relative z-10 w-full max-w-md rounded-md p-5 sm:p-6 space-y-4 border border-gray-400 dark:border-slate-500 shadow-2xl transition-colors ${isDarkMode ? 'bg-[#071A3D] text-white' : 'bg-white text-[#071A3D]'
            }`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-300 dark:border-slate-700">
              <div className="flex items-center gap-2 text-rose-600">
                <span className="material-icons">currency_exchange</span>
                <h3 className="font-extrabold text-base">Process Refund</h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order:</span>
                  <span className="font-mono font-bold text-[#C8102E]">
                    {refundModalOrder.order_code || `#${refundModalOrder.order_id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-bold">{refundModalOrder.customer_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Amount:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    ₱{Number(refundModalOrder.grand_total || refundModalOrder.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 font-bold mb-1">
                  Reason for Refund
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className={`w-full p-2 rounded-md border font-semibold text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                >
                  <option value="Customer Request / Order Cancelled">Customer Request / Order Cancelled</option>
                  <option value="Staff Rejected Order (Kitchen unavailable)">Staff Rejected Order (Kitchen unavailable)</option>
                  <option value="Dish / Ingredients Out of Stock">Dish / Ingredients Out of Stock</option>
                  <option value="Duplicate Charge or Billing Error">Duplicate Charge or Billing Error</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 font-bold mb-1">
                  Refund Channel
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className={`w-full p-2 rounded-md border font-semibold text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                >
                  <option value="Cash Returned at Counter">Cash Returned at Counter</option>
                  <option value="PayMongo Online Gateway Reversal">PayMongo Online Gateway Reversal</option>
                  <option value="Manual Bank Transfer">Manual Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                disabled={isProcessingRefund}
                className="flex-1 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isProcessingRefund}
                className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessingRefund ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span className="material-icons text-sm">check</span>
                    <span>Confirm Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
