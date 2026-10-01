import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import AssignRiderModal from '../../components/AssignRiderModal'

const STATUS_FLOW = ['New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Rejected']
const FILTER_TABS = ['All', 'New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Rejected']

function getStatusStyle(status) {
  switch (status) {
    case 'New':
    case 'Pending': return 'bg-amber-50 text-amber-800 border-amber-300'
    case 'Accepted': return 'bg-indigo-50 text-indigo-800 border-indigo-300'
    case 'Preparing':
    case 'In Progress': return 'bg-blue-50 text-blue-800 border-blue-300'
    case 'Ready':
    case 'Ready for Pickup': return 'bg-emerald-50 text-emerald-800 border-emerald-300'
    case 'Out for Delivery': return 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
    case 'Completed':
    case 'Delivered':
    case 'Served': return 'bg-emerald-50 text-emerald-800 border-emerald-300'
    case 'Rejected':
    case 'Cancelled': return 'bg-red-50 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-500 border-gray-300'
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'New':
    case 'Pending': return 'schedule'
    case 'Accepted': return 'verified'
    case 'Preparing':
    case 'In Progress': return 'soup_kitchen'
    case 'Ready':
    case 'Ready for Pickup': return 'check_circle'
    case 'Out for Delivery': return 'two_wheeler'
    case 'Completed':
    case 'Delivered':
    case 'Served': return 'task_alt'
    case 'Rejected':
    case 'Cancelled': return 'cancel'
    default: return 'radio_button_unchecked'
  }
}

function OrderTypeTag({ type }) {
  if (type === 'Delivery') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
        <span className="material-icons text-[11px]">two_wheeler</span>
        Delivery
      </span>
    )
  }
  if (type === 'Takeout') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-black uppercase">
        <span className="material-icons text-[11px]">shopping_bag</span>
        Takeout
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black uppercase">
      <span className="material-icons text-[11px]">restaurant</span>
      Dine-in
    </span>
  )
}

function OrderRow({ order, onStatusChange, onPaymentChange, onDelete, onExpand, expanded, onAssignRider }) {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
  const isDone = order.status === 'Completed' || order.status === 'Cancelled'

  return (
    <>
      <tr className="hover:bg-gray-50/70 transition border-b border-gray-100">
        {/* Order Code */}
        <td className="p-3 font-black text-[#071A3D] font-mono text-xs">
          <button
            onClick={() => onExpand(order.order_id)}
            className="flex items-center gap-1.5 group cursor-pointer"
          >
            <span className={`material-icons text-sm transition ${expanded ? 'text-[#C8102E] rotate-90' : 'text-gray-400 group-hover:text-[#C8102E]'}`}>
              chevron_right
            </span>
            {order.order_code}
          </button>
        </td>

        {/* Customer */}
        <td className="p-3">
          <div className="font-bold text-xs text-gray-800">{order.customer_name}</div>
          <div className="text-[10px] text-gray-400 font-mono">{order.customer_phone}</div>
          {order.customer_email && (
            <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{order.customer_email}</div>
          )}
        </td>

        {/* Type & Collection */}
        <td className="p-3">
          <div className="space-y-1">
            <OrderTypeTag type={order.order_type} />
            {order.order_type === 'Delivery' ? (
              <div className="space-y-1 max-w-[200px]">
                <div className="text-[10px] font-bold text-gray-700 flex items-start gap-1">
                  <span className="material-icons text-[12px] text-[#C8102E] shrink-0 mt-0.5">location_on</span>
                  <span className="truncate" title={order.delivery_address}>{order.delivery_address || 'Home Delivery'}</span>
                </div>
                {order.rider_name ? (
                  <div className="text-[9px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 flex items-center justify-between gap-1">
                    <span className="truncate">🛵 {order.rider_name}</span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-200 text-amber-900 shrink-0">
                      {order.delivery_status || 'Assigned'}
                    </span>
                  </div>
                ) : (
                  <div className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                    <span className="material-icons text-[11px] text-amber-500">warning</span>
                    <span>Rider: Unassigned</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                <span className="material-icons text-[11px]">countertops</span>
                <span>Pickup Counter</span>
              </div>
            )}
          </div>
        </td>

        {/* Items count */}
        <td className="p-3 text-center">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 border border-gray-300 text-xs font-black text-gray-700">
            {order.items?.length || 0}
          </span>
        </td>

        {/* Total */}
        <td className="p-3 font-black text-[#C8102E] font-mono text-xs">
          ₱{parseFloat(order.grand_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </td>

        {/* Payment Column */}
        <td className="p-3">
          {order.payment_status === 'paid' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">
              <span className="material-icons text-[11px]">verified</span>
              PAID ({order.payment_method?.toUpperCase()})
            </span>
          ) : order.order_type === 'Delivery' ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black uppercase">
                <span className="material-icons text-[11px]">two_wheeler</span>
                COD (UNPAID)
              </span>
              <button
                type="button"
                onClick={() => onPaymentChange(order.order_id, 'paid')}
                className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded cursor-pointer transition shadow-2xs"
                title="Mark order as paid"
              >
                Mark Paid
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black uppercase">
                <span className="material-icons text-[11px]">schedule</span>
                UNPAID
              </span>
              <button
                type="button"
                onClick={() => onPaymentChange(order.order_id, 'paid')}
                className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded cursor-pointer transition shadow-2xs"
                title="Mark order as paid"
              >
                Mark Paid
              </button>
            </div>
          )}
        </td>

        {/* Status */}
        <td className="p-3">
          <span className={`px-2.5 py-1 rounded-md font-black uppercase text-[10px] border flex items-center gap-1 w-fit ${getStatusStyle(order.status)}`}>
            <span className="material-icons text-[11px]">{getStatusIcon(order.status)}</span>
            {order.status}
          </span>
        </td>

        {/* Actions */}
        <td className="p-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {/* Delivery Rider Assignment Action */}
            {order.order_type === 'Delivery' && !isDone && (
              <button
                type="button"
                onClick={() => onAssignRider(order)}
                className="px-2.5 py-1 rounded-md bg-[#C8102E] hover:bg-[#a50d26] text-white text-[11px] font-bold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1"
                title={order.rider_name ? 'Reassign Rider' : 'Assign Rider'}
              >
                <span className="material-icons text-[11px]">two_wheeler</span>
                <span>{order.rider_name ? 'Reassign Rider' : 'Assign Rider'}</span>
              </button>
            )}

            {!isDone && nextStatus && (() => {
              const isCodDelivery = order.order_type === 'Delivery' && (order.payment_method === 'cod' || order.payment_method === 'counter')
              const canAdvance = order.payment_status === 'paid' || isCodDelivery

              return canAdvance ? (
                <button
                  onClick={() => onStatusChange(order.order_id, nextStatus)}
                  className={`px-2.5 py-1 rounded-md text-white text-[11px] font-bold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1 ${
                    nextStatus === 'Preparing' ? 'bg-blue-600 hover:bg-blue-700' :
                    nextStatus === 'Ready' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    nextStatus === 'Out for Delivery' ? 'bg-amber-600 hover:bg-amber-700' :
                    nextStatus === 'Delivered' || nextStatus === 'Completed' ? 'bg-gray-700 hover:bg-gray-800' :
                    'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  <span className="material-icons text-[11px]">{getStatusIcon(nextStatus)}</span>
                  {nextStatus === 'Preparing' ? 'Start Prep' :
                   nextStatus === 'Ready' ? 'Mark Ready' :
                   nextStatus === 'Out for Delivery' ? 'Dispatch Rider' :
                   nextStatus === 'Delivered' ? 'Mark Delivered' :
                   nextStatus === 'Completed' ? 'Complete' : nextStatus}
                </button>
              ) : (
                <span
                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-300 flex items-center gap-1"
                  title="Payment is required before this order can be processed"
                >
                  <span className="material-icons text-xs">lock</span>
                  <span>Payment Required</span>
                </span>
              )
            })()}
            {!isDone && (
              <button
                onClick={() => onStatusChange(order.order_id, 'Cancelled')}
                className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-[11px] font-bold cursor-pointer transition active:scale-95"
                title="Cancel Order"
              >
                <span className="material-icons text-[11px]">close</span>
              </button>
            )}
            <button
              onClick={() => onDelete(order.order_id, order.order_code)}
              className="px-2.5 py-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-500 text-[11px] font-bold cursor-pointer transition active:scale-95"
              title="Delete Order"
            >
              <span className="material-icons text-[11px]">delete_outline</span>
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Items Row */}
      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-200">
          <td colSpan="7" className="px-8 py-3">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Order Items</div>
            <div className="space-y-1.5">
              {(order.items || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No items recorded.</p>
              ) : (
                (order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-md border border-gray-200 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C8102E]/10 text-[#C8102E] font-black text-[10px] flex items-center justify-center shrink-0">
                        {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-800">{item.name}</span>
                      {item.special_instructions && (
                        <span className="text-[10px] text-gray-400 italic">— {item.special_instructions}</span>
                      )}
                    </div>
                    <span className="font-black text-gray-700 font-mono">
                      ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
            {order.notes && (
              <div className="mt-2 text-[11px] text-gray-500 italic flex items-start gap-1">
                <span className="material-icons text-xs">notes</span>
                {order.notes}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function Orders(props) {
  const context = useOutletContext() || {}
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [assignOrder, setAssignOrder] = useState(null)
  const intervalRef = useRef(null)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const data = await api.orders.getOrders()
      if (data.status === 'success') {
        setOrders(data.orders || [])
      }
    } catch {
      showToast('Could not connect to server.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const data = await api.orders.updateStatus(orderId, newStatus)
      if (data.status === 'success') {
        showToast(`Order updated to "${newStatus}"`, 'success')
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o))
      } else {
        showToast(data.message || 'Failed to update.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Server error.', 'error')
    }
  }

  const handlePaymentChange = async (orderId, paymentStatus = 'paid') => {
    try {
      const data = await api.orders.updatePayment(orderId, { payment_status: paymentStatus })
      if (data.status === 'success') {
        showToast(`Order #${orderId} payment marked as PAID`, 'success')
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, payment_status: paymentStatus } : o))
      }
    } catch (e) {
      showToast(e.message || 'Payment update failed.', 'error')
    }
  }

  const handleDelete = async (orderId, orderCode) => {
    try {
      const data = await api.orders.deleteOrder(orderId)
      if (data.status === 'success') {
        showToast(`Order ${orderCode} deleted.`, 'success')
        setOrders(prev => prev.filter(o => o.order_id !== orderId))
      }
    } catch {
      showToast('Could not delete order.', 'error')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      (o.order_code || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.table_number || '').toLowerCase().includes(q) ||
      (o.delivery_address || '').toLowerCase().includes(q) ||
      (o.rider_name || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || o.status === statusFilter
    const matchType = typeFilter === 'All' || o.order_type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const counts = FILTER_TABS.reduce((acc, f) => {
    acc[f] = f === 'All' ? orders.length : orders.filter(o => o.status === f).length
    return acc
  }, {})

  const dineInCount = orders.filter(o => o.order_type === 'Dine-in').length
  const takeoutCount = orders.filter(o => o.order_type === 'Takeout').length
  const deliveryCount = orders.filter(o => o.order_type === 'Delivery').length
  const activeCount = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            Customer Order Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage customer dine-in, takeout counter, and delivery orders. Auto-refreshes every 30s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-400 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <span className={`material-icons text-base text-gray-600 ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Active Orders', value: activeCount, icon: 'pending_actions', color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Dine-in', value: dineInCount, icon: 'restaurant', color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Takeout', value: takeoutCount, icon: 'shopping_bag', color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: 'Delivery', value: deliveryCount, icon: 'two_wheeler', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Total Orders', value: orders.length, icon: 'receipt_long', color: 'text-gray-700 bg-gray-50 border-gray-300' },
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

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-gray-300 shadow-xs space-y-2">
        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer border font-extrabold flex items-center gap-1 ${
                statusFilter === f
                  ? 'bg-[#071A3D] text-white border-[#071A3D] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f !== 'All' && <span className="material-icons text-[11px]">{getStatusIcon(f)}</span>}
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Type:</span>
          {['All', 'Dine-in', 'Takeout', 'Delivery'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                typeFilter === t
                  ? t === 'Dine-in' ? 'bg-blue-600 text-white border-blue-600'
                  : t === 'Takeout' ? 'bg-purple-600 text-white border-purple-600'
                  : t === 'Delivery' ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-[#071A3D] text-white border-[#071A3D]'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-3">Order Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Order Type</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-400 font-bold">
                    <span className="material-icons text-3xl animate-spin block mx-auto mb-2">refresh</span>
                    Loading orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-400 font-bold">
                    <span className="material-icons text-4xl block mb-2 opacity-40">receipt_long</span>
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map(o => (
                  <OrderRow
                    key={o.order_id}
                    order={o}
                    onPaymentChange={handlePaymentChange}
                    expanded={expandedRows.has(o.order_id)}
                    onExpand={toggleExpand}
                    onStatusChange={handleStatusChange}
                    onDelete={(id, code) => setDeleteConfirm({ id, code })}
                    onAssignRider={(ord) => setAssignOrder(ord)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
            Showing {filtered.length} of {orders.length} orders
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-gray-300 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-icons text-3xl">warning</span>
              <div>
                <h3 className="font-black text-sm text-[#071A3D]">Delete Order?</h3>
                <p className="text-xs text-gray-500">This will permanently remove <strong>{deleteConfirm.code}</strong>.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.code)}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rider Modal */}
      <AssignRiderModal
        order={assignOrder}
        isOpen={Boolean(assignOrder)}
        onClose={() => setAssignOrder(null)}
        onAssigned={(updated) => {
          setOrders(prev => prev.map(o => o.order_id === updated.order_id ? { ...o, ...updated } : o))
          fetchOrders()
        }}
      />
    </div>
  )
}

export default Orders
