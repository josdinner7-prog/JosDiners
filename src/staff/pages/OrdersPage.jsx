import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import { normalizeStaffOrder } from '../utils/normalizers'
import AssignRiderModal from '../../components/AssignRiderModal'

// High-Fidelity Skeleton for Dispatch Board Cards
function OrderCardSkeleton({ isDarkMode }) {
  return (
    <div className={`p-3 rounded-lg border shadow-xs space-y-2.5 animate-pulse ${
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 w-3/4">
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-20"></div>
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        </div>
        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>

      {/* Items Skeleton */}
      <div className="border-t border-b border-dashed py-2 border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10"></div>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-16"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-14"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-1.5 pt-1">
        <div className="flex-1 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
  )
}

export default function OrdersPage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selectedOrderTicket, setSelectedOrderTicket] = useState(null)
  const [rejectingOrderId, setRejectingOrderId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [assignRiderOrder, setAssignRiderOrder] = useState(null)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => {
      loadOrders(true)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await api.orders.getOrders()
      const list = (data.status === 'success' && Array.isArray(data.orders || data.data)) ? (data.orders || data.data) : []
      if (list.length > 0) {
        setOrders(list.map(normalizeStaffOrder))
      }
    } catch (e) {
      if (!silent) console.error('Failed to fetch orders:', e)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Staff Action: Mark Payment as Paid (Collect Cash at Counter Modal Settlement)
  const handleMarkOrderPaid = async (orderId, method = 'counter') => {
    try {
      await api.orders.updatePayment(orderId, {
        payment_status: 'paid',
        payment_method: method
      })
      setOrders(prev => prev.map(o => o.order_id === orderId ? {
        ...o,
        payment_status: 'paid',
        payment_method: method,
        paid_at: new Date().toISOString()
      } : o))
      showToast(`Payment for Order #${orderId} marked as PAID! Order is now PENDING ACCEPTANCE.`, 'success')
      setReceivePaymentOrder(null)
      setCashReceived('')
    } catch (e) {
      console.error('Update payment error:', e)
      showToast(e.message || 'Failed to update payment status.', 'error')
    }
  }

  // Staff Action: Accept Order & Dispatch to Kitchen KDS (Permits COD Delivery orders)
  const handleAcceptOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.order_id === orderId)
    const isCodDelivery = targetOrder?.order_type === 'Delivery' && (targetOrder?.payment_method === 'cod' || targetOrder?.payment_method === 'counter')

    if (targetOrder && targetOrder.payment_status !== 'paid' && !isCodDelivery) {
      showToast('Cannot accept order: Payment must be settled at counter first!', 'error')
      return
    }

    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'Accepted' } : o))
    showToast(`Order #${orderId} ACCEPTED and sent to Kitchen KDS!`, 'success')
    try {
      await api.orders.updateStatus(orderId, 'Accepted')
    } catch (e) {
      console.error('Accept order error:', e)
      showToast(e.message || 'Failed to accept order on server.', 'error')
      loadOrders(true)
    }
  }

  // Staff Action: Rider Assigned / Reassigned Callback
  const handleRiderAssigned = (updatedOrder) => {
    if (!updatedOrder) return
    setOrders(prev => prev.map(o => o.order_id === updatedOrder.order_id ? {
      ...o,
      ...updatedOrder,
      rider_id: updatedOrder.rider_id,
      rider_name: updatedOrder.rider_name,
      rider_phone: updatedOrder.rider_phone,
      vehicle_info: updatedOrder.vehicle_info,
      delivery_status: updatedOrder.delivery_status || 'Assigned'
    } : o))
    loadOrders(true)
  }

  // Staff Action: Mark Delivered
  const handleMarkDelivered = async (orderId) => {
    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      status: 'Delivered',
      payment_status: 'paid',
      delivered_at: new Date().toISOString()
    } : o))
    showToast(`Order #${orderId} successfully DELIVERED and settled!`, 'success')
    try {
      await api.orders.updateStatus(orderId, 'Delivered')
    } catch (e) {
      console.error('Mark delivered error:', e)
    }
  }

  // Staff Action: Reject Order (Handles Refund Workflow if already paid)
  const handleRejectOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.order_id === orderId)
    const wasPaid = targetOrder && targetOrder.payment_status === 'paid'

    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      status: 'Rejected',
      payment_status: wasPaid ? 'refund_required' : o.payment_status
    } : o))

    if (wasPaid) {
      showToast(`Order #${orderId} rejected. Payment marked as REFUND REQUIRED. Please return cash to customer at counter!`, 'warning')
      try {
        await api.orders.updatePayment(orderId, { payment_status: 'refund_required' })
      } catch (e) {
        console.error('Refund status update error:', e)
      }
    } else {
      showToast(`Order #${orderId} rejected.`, 'warning')
    }

    setRejectingOrderId(null)
    setRejectReason('')
    try {
      await api.orders.updateStatus(orderId, 'Rejected')
    } catch (e) {
      console.error('Reject order error:', e)
    }
  }

  // Staff Action: Hand Over / Complete Order
  const handleCompleteOrder = async (orderId) => {
    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'Completed' } : o))
    showToast(`Order #${orderId} marked COMPLETED & Handed Over!`, 'success')
    try {
      await api.orders.updateStatus(orderId, 'Completed')
    } catch (e) {
      console.error('Complete order error:', e)
    }
  }

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (o.order_code && o.order_code.toLowerCase().includes(q)) ||
      (String(o.order_id).includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.table_number && o.table_number.toLowerCase().includes(q))
    )
  })

  // 1. New Orders (Paid online orders OR Cash-on-Delivery delivery orders ready for kitchen dispatch)
  const isEligibleNewOrder = (o) => {
    const isNew = o.status === 'New' || o.status === 'Pending'
    if (!isNew) return false
    const isPaid = (o.payment_status || '').toLowerCase() === 'paid'
    const isCodDelivery = o.order_type === 'Delivery' && (o.payment_method === 'cod' || o.payment_method === 'counter')
    return isPaid || isCodDelivery
  }

  const newOrders = filteredOrders.filter(isEligibleNewOrder)

  const unpaidCounterOrders = filteredOrders.filter(o => 
    (o.status === 'New' || o.status === 'Pending') && !isEligibleNewOrder(o)
  )
  const unpaidCounterCount = unpaidCounterOrders.length

  // 2. Kitchen Queue (Accepted & In Preparation by Chefs)
  const kitchenQueue = filteredOrders.filter(o => o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'In Progress')

  // 3. Ready for Handover / Dispatch (Food ready at counter OR Out for Delivery)
  const readyOrders = filteredOrders.filter(o => o.status === 'Ready' || o.status === 'Ready for Pickup' || o.status === 'Out for Delivery')

  // 4. Completed / Archive
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Served' || o.status === 'Rejected' || o.status === 'Cancelled')

  return (
    <div className="space-y-4 pb-12 text-xs animate-in fade-in duration-150">
      
      {/* Top Console Stats Bar */}
      <div className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
        isDarkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold shrink-0">
            <span className="material-icons text-xl">assignment</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm uppercase tracking-wide">Staff Order Dispatch Console</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Synced</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Review paid customer orders, dispatch to kitchen, and manage food handovers.
            </p>
          </div>
        </div>

        {/* Quick Search & POS Shortcut */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <span className="material-icons absolute left-2.5 top-2 text-slate-400 text-base pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Search order code / guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8102E] ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/staff/pos')}
            className="px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 bg-[#C8102E] hover:bg-[#9B0B21] text-white"
            title="Open POS Terminal to settle cash payments"
          >
            <span className="material-icons text-sm">point_of_sale</span>
            <span>{unpaidCounterCount > 0 ? 'Settle POS' : '+ Counter POS'}</span>
            {unpaidCounterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[#C8102E] text-[10px] font-black">
                {unpaidCounterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4-Column High-Efficiency Dispatch Board (Equal Height, Independent Scroll) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
        
        {/* COLUMN 1: PENDING ACCEPTANCE (Only Paid Orders for Review & Kitchen Dispatch) */}
        <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col h-[640px] xl:h-[calc(100vh-220px)] min-h-[580px] overflow-hidden ${
          isDarkMode ? 'bg-[#1C2541]/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <h3 className="font-black text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                1. Pending Acceptance
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-3 pr-1.5 custom-kds-scrollbar">
            {isLoading ? (
              [1, 2].map(n => <OrderCardSkeleton key={n} isDarkMode={isDarkMode} />)
            ) : newOrders.map(order => (
              <div
                key={order.order_id}
                className={`p-3 rounded-xl border shadow-sm space-y-2.5 transition relative border-l-4 border-l-amber-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-[#C8102E] block">{order.order_code || `#${order.order_id}`}</span>
                      {order.order_type === 'Delivery' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                          🛵 DELIVERY
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs leading-tight mt-0.5">{order.customer_name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block">{order.order_type} • {order.phone}</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {order.elapsed_mins}m ago
                  </span>
                </div>

                {order.order_type === 'Delivery' && (
                  <div className="p-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 text-[10px] text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 space-y-0.5">
                    <span className="font-bold flex items-center gap-1 text-[#C8102E]">
                      <span className="material-icons text-xs">location_on</span>
                      <span>Deliver To:</span>
                    </span>
                    <p className="truncate pl-3 font-semibold">{order.delivery_address}</p>
                    {order.delivery_notes && (
                      <p className="italic text-slate-500 dark:text-slate-400 pl-3">Note: {order.delivery_notes}</p>
                    )}
                  </div>
                )}

                {/* Items preview */}
                <div className="border-t border-b border-dashed py-1.5 border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-medium">
                        <span className="font-bold">{it.quantity}x {it.name}</span>
                        <span className="font-mono text-slate-400">₱{(Number(it.price || 0) * it.quantity).toFixed(2)}</span>
                      </div>
                      {it.special_instructions && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold pl-1.5 flex items-center gap-1">
                          <span className="material-icons text-[11px]">edit_note</span>
                          <span>Note: {it.special_instructions}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    <span>{order.payment_status === 'paid' ? 'Total Paid:' : 'Total Cash Due:'}</span>
                    <span className="text-[#C8102E] font-mono font-bold">₱{Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Verified Payment & Pending Acceptance State */}
                <div className="flex items-center justify-between gap-1 pt-1 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Payment:</span>
                  {order.payment_status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                      <span className="material-icons text-[11px]">verified</span>
                      <span>PAID ({order.payment_method?.toUpperCase()})</span>
                    </span>
                  ) : order.order_type === 'Delivery' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                      <span className="material-icons text-[11px]">two_wheeler</span>
                      <span>CASH ON DELIVERY (COD)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30 uppercase">
                      <span className="material-icons text-[11px]">schedule</span>
                      <span>PENDING COUNTER</span>
                    </span>
                  )}
                </div>

                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                    <span className="material-icons text-xs">rule</span>
                    <span>PENDING ACCEPTANCE</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Ready to Dispatch
                  </span>
                </div>

                {/* Staff Actions: Accept vs Reject */}
                {rejectingOrderId === order.order_id ? (
                  <div className="space-y-1.5 pt-1 animate-in fade-in">
                    <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[10px] text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
                      ⚠️ Customer has paid. Rejecting will flag payment as REFUND REQUIRED.
                    </div>
                    <input
                      type="text"
                      placeholder="Reason for rejecting (e.g. Dish unavailable)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className={`w-full p-1.5 rounded text-[10px] border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRejectOrder(order.order_id)}
                        className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectingOrderId(null); setRejectReason(''); }}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-bold text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAcceptOrder(order.order_id)}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1"
                      title="Accept order and dispatch directly to Kitchen KDS"
                    >
                      <span className="material-icons text-sm">check_circle</span>
                      <span>Accept Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingOrderId(order.order_id)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-[10px] cursor-pointer"
                      title="Reject order"
                    >
                      <span className="material-icons text-sm block">close</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!isLoading && newOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4 space-y-2">
                {unpaidCounterCount > 0 ? (
                  <>
                    <span className="material-icons text-3xl text-amber-500 opacity-80 animate-bounce">point_of_sale</span>
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">No Orders Pending Acceptance</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      ⚡ {unpaidCounterCount} phone {unpaidCounterCount === 1 ? 'order is' : 'orders are'} awaiting payment at the POS counter.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/staff/pos')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer shadow-xs transition"
                    >
                      Go to POS Counter
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-3xl opacity-40 mb-1">done_all</span>
                    <p className="font-bold text-xs">No Orders Pending Acceptance</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Paid online orders requiring staff review will appear here.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: KITCHEN QUEUE (Accepted & Cooking in KDS) */}
        <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col h-[640px] xl:h-[calc(100vh-220px)] min-h-[580px] overflow-hidden ${
          isDarkMode ? 'bg-[#1C2541]/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-sky-500 text-base">soup_kitchen</span>
              <h3 className="font-black text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">
                2. Kitchen Queue
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              {kitchenQueue.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-3 pr-1.5 custom-kds-scrollbar">
            {isLoading ? (
              [1, 2].map(n => <OrderCardSkeleton key={n} isDarkMode={isDarkMode} />)
            ) : kitchenQueue.map(order => {
              const isCooking = order.status === 'Preparing' || order.status === 'In Progress'

              return (
                <div
                  key={order.order_id}
                  className={`p-3 rounded-xl border shadow-sm space-y-2 transition border-l-4 ${
                    isCooking ? 'border-l-sky-500' : 'border-l-indigo-400'
                  } ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-xs text-[#C8102E] block">{order.order_code || `#${order.order_id}`}</span>
                      <h4 className="font-bold text-xs leading-tight mt-0.5">{order.customer_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block">{order.order_type} • {order.table_number}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${
                      isCooking
                        ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                        : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {isCooking ? '🔥 Cooking' : '✓ Queued'}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="border-t pt-1.5 border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-medium">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{it.prep_status || (isCooking ? 'Cooking' : 'Queued')}</span>
                        </div>
                        {it.special_instructions && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold pl-1.5">
                            * Note: {it.special_instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="material-icons text-xs">timer</span>
                      <span>{order.elapsed_mins}m in kitchen</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderTicket(order)}
                      className="text-[#C8102E] hover:underline font-bold cursor-pointer"
                    >
                      Ticket
                    </button>
                  </div>
                </div>
              )
            })}

            {!isLoading && kitchenQueue.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                <span className="material-icons text-3xl opacity-40 mb-1">skillet</span>
                <p className="font-bold text-xs">Kitchen Queue Clear</p>
                <p className="text-[10px] opacity-70 mt-0.5">Accepted orders will appear here while chefs are cooking.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY FOR HANDOVER (Kitchen Marked Ready) */}
        <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col h-[640px] xl:h-[calc(100vh-220px)] min-h-[580px] overflow-hidden ${
          isDarkMode ? 'bg-[#1C2541]/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-emerald-500 text-base">notifications_active</span>
              <h3 className="font-black text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                3. Ready to Serve
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-3 pr-1.5 custom-kds-scrollbar">
            {isLoading ? (
              [1, 2].map(n => <OrderCardSkeleton key={n} isDarkMode={isDarkMode} />)
            ) : readyOrders.map(order => {
              const isOutForDelivery = order.status === 'Out for Delivery'
              const isDeliveryType = order.order_type === 'Delivery'

              return (
                <div
                  key={order.order_id}
                  className={`p-3 rounded-xl border shadow-sm space-y-2.5 transition border-l-4 ${
                    isOutForDelivery
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500'
                  } ${
                    isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-[#C8102E] block">{order.order_code || `#${order.order_id}`}</span>
                        {isDeliveryType && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                            🛵 DELIVERY
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs leading-tight mt-0.5">{order.customer_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {order.phone} • {order.table_number}
                      </span>
                    </div>

                    {isOutForDelivery ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-white font-mono flex items-center gap-0.5 animate-pulse">
                        <span className="material-icons text-xs">two_wheeler</span>
                        <span>{order.delivery_status || 'DISPATCHED'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-white font-mono flex items-center gap-0.5">
                        <span className="material-icons text-xs">done_all</span>
                        <span>READY</span>
                      </span>
                    )}
                  </div>

                  {/* Delivery destination card if delivery order */}
                  {isDeliveryType && (
                    <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 text-[10px] text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <span className="font-bold flex items-center gap-1 text-[#C8102E]">
                        <span className="material-icons text-xs">location_on</span>
                        <span>Deliver To:</span>
                      </span>
                      <p className="font-semibold pl-3 truncate">{order.delivery_address}</p>
                      {order.delivery_notes && (
                        <p className="italic text-slate-500 dark:text-slate-400 pl-3">Note: {order.delivery_notes}</p>
                      )}
                      
                      {/* Rider Assignment Info */}
                      <div className="pt-1 mt-1 border-t border-amber-200 dark:border-amber-900/60 text-[9px]">
                        {order.rider_name ? (
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-xs text-blue-600 dark:text-blue-400">sports_motorsports</span>
                              <span>Rider: {order.rider_name}</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono">
                              {order.delivery_status || 'Assigned'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold">
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-xs text-amber-600">warning</span>
                              <span>No Rider Assigned</span>
                            </span>
                            <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Unassigned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items summary */}
                  <div className="border-t border-b py-1.5 border-slate-200 dark:border-slate-800 space-y-0.5 text-[11px]">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="text-emerald-500 font-bold">✓</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {isDeliveryType ? (
                      <div className="flex-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setAssignRiderOrder(order)}
                          className={`flex-1 py-2 rounded-lg text-white font-black text-[11px] shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1 ${
                            order.rider_name
                              ? 'bg-slate-700 hover:bg-slate-800'
                              : 'bg-[#C8102E] hover:bg-[#9B0B21]'
                          }`}
                          title={order.rider_name ? 'Reassign delivery rider' : 'Assign available rider'}
                        >
                          <span className="material-icons text-sm">two_wheeler</span>
                          <span>{order.rider_name ? 'Reassign Rider' : 'Assign Rider'}</span>
                        </button>
                        {isOutForDelivery && (
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order.order_id)}
                            className="px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center"
                            title="Mark food as delivered and settle order"
                          >
                            <span className="material-icons text-sm">task_alt</span>
                          </button>
                        )}
                      </div>
                    ) : isOutForDelivery ? (
                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(order.order_id)}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1"
                        title="Mark food as delivered and settle order"
                      >
                        <span className="material-icons text-sm">task_alt</span>
                        <span>Mark as Delivered</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCompleteOrder(order.order_id)}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <span className="material-icons text-sm">task_alt</span>
                        <span>Hand Over & Complete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrderTicket(order)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-bold cursor-pointer"
                      title="Print ticket"
                    >
                      <span className="material-icons text-sm block">receipt</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {!isLoading && readyOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                <span className="material-icons text-3xl opacity-40 mb-1">dining</span>
                <p className="font-bold text-xs">No Orders Ready for Handover</p>
                <p className="text-[10px] opacity-70 mt-0.5">Dishes marked ready by the kitchen will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 4: COMPLETED / RECENT HISTORY */}
        <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col h-[640px] xl:h-[calc(100vh-220px)] min-h-[580px] overflow-hidden ${
          isDarkMode ? 'bg-[#1C2541]/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-300 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-slate-400 text-base">history</span>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. Completed Today
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {completedOrders.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pt-3 pr-1.5 custom-kds-scrollbar">
            {isLoading ? (
              [1, 2, 3].map(n => (
                <div
                  key={n}
                  className={`p-2.5 rounded-xl border shadow-2xs space-y-2 animate-pulse ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-20" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-14" />
                  </div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-2.5 bg-slate-300 dark:bg-slate-700 rounded w-12" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </div>
                </div>
              ))
            ) : completedOrders.slice(0, 15).map(order => {
              const isRejected = order.status === 'Rejected' || order.status === 'Cancelled'

              return (
                <div
                  key={order.order_id}
                  className={`p-2.5 rounded-xl border shadow-2xs space-y-1 opacity-80 hover:opacity-100 transition ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      {order.order_code || `#${order.order_id}`}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                      isRejected ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-semibold text-[11px] truncate text-slate-600 dark:text-slate-400">
                    {order.customer_name} ({order.table_number})
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>₱{Number(order.total_amount || 0).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderTicket(order)}
                      className="hover:text-[#C8102E] transition cursor-pointer"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              )
            })}

            {completedOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 p-4">
                <span className="material-icons text-3xl opacity-40 mb-1">archive</span>
                <p className="font-bold text-xs">No Completed Orders</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Rider Assignment & Delivery Dispatch Modal */}
      <AssignRiderModal
        order={assignRiderOrder}
        isOpen={Boolean(assignRiderOrder)}
        onClose={() => setAssignRiderOrder(null)}
        onAssigned={handleRiderAssigned}
      />

      {/* Thermal Ticket Modal */}
      {selectedOrderTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
            isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-2 border-slate-300 dark:border-slate-700">
              <div>
                <h3 className="font-extrabold text-sm text-[#C8102E]">Thermal Ticket Receipt</h3>
                <span className="text-[10px] text-slate-400 font-mono">Order #{selectedOrderTicket.order_code || selectedOrderTicket.order_id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderTicket(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white text-slate-900 font-mono text-xs space-y-2.5 border border-slate-300 shadow-inner">
              <div className="text-center border-b pb-2 border-slate-200">
                <h4 className="jos-diner-brand-title font-black text-sm !text-[#C8102E]">JO'S DINER</h4>
                <p className="text-[10px] text-slate-500">Function Hall & Catering Services</p>
                <p className="text-[10px] font-bold mt-1 uppercase text-slate-700">
                  {selectedOrderTicket.order_type} • {selectedOrderTicket.table_number}
                </p>
                <p className="text-[10px] text-slate-500">{selectedOrderTicket.customer_name}</p>
              </div>

              <div className="space-y-1.5">
                {(selectedOrderTicket.items || []).map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-xs">
                      <span>{it.quantity}x {it.name}</span>
                      <span>₱{(Number(it.price || 0) * it.quantity).toFixed(2)}</span>
                    </div>
                    {it.special_instructions && (
                      <div className="text-[10px] text-amber-700 italic pl-2">
                        * Note: {it.special_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-sm border-t pt-2 border-slate-200 text-slate-950">
                <span>TOTAL PAID:</span>
                <span className="text-[#C8102E]">₱{Number(selectedOrderTicket.total_amount || 0).toFixed(2)}</span>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-400 border-t border-dashed border-slate-300">
                <span>Status: {selectedOrderTicket.status}</span>
                <br />
                <span>Thank you for dining with Jo's Diner!</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast(`Printed Ticket #${selectedOrderTicket.order_id}`, 'success')
                  setSelectedOrderTicket(null)
                }}
                className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span className="material-icons text-sm">print</span>
                <span>Print Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderTicket(null)}
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
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
