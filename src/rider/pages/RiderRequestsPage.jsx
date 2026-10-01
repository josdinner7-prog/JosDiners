import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function RiderRequestsPage() {
  const { riderData, fetchRiderData } = useOutletContext()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState(null)
  const [declineModalOrder, setDeclineModalOrder] = useState(null)
  const [declineReason, setDeclineReason] = useState('Too far from current location')

  const riderId = riderData?.user_id || riderData?.rider_id

  const loadRequests = async () => {
    if (!riderId) return
    setIsLoading(true)
    try {
      const res = await api.riders.getRequests(riderId)
      if (res.status === 'success') {
        setRequests(res.requests || [])
      }
    } catch (err) {
      showToast('Could not load delivery requests.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [riderId])

  const handleAccept = async (order) => {
    setProcessingOrderId(order.order_id)
    try {
      const res = await api.riders.acceptOrder(riderId, order.order_id)
      if (res.status === 'success') {
        showToast(`Delivery Accepted! Starting delivery for Order #${order.order_code}.`, 'success')
        await fetchRiderData()
        navigate('/rider/active')
      }
    } catch (err) {
      showToast(err.message || 'Could not accept order.', 'error')
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleConfirmDecline = async () => {
    if (!declineModalOrder) return
    const orderId = declineModalOrder.order_id
    setProcessingOrderId(orderId)

    try {
      const res = await api.riders.declineOrder(riderId, orderId, declineReason)
      if (res.status === 'success') {
        showToast(`Delivery for Order #${declineModalOrder.order_code} declined. Returned to unassigned pool.`, 'info')
        setDeclineModalOrder(null)
        setRequests(prev => prev.filter(r => r.order_id !== orderId))
        await fetchRiderData()
      }
    } catch (err) {
      showToast(err.message || 'Could not decline order.', 'error')
    } finally {
      setProcessingOrderId(null)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h2 className="text-lg font-black text-[#071A3D] flex items-center gap-2">
            <span className="material-icons text-[#C8102E]">assignment</span>
            <span>Delivery Requests</span>
          </h2>
          <p className="text-xs text-slate-400">
            Assigned customer deliveries awaiting your confirmation
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200 cursor-pointer active:scale-95"
          title="Refresh Requests"
        >
          <span className={`material-icons text-base ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <span className="material-icons text-3xl text-slate-300 animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-bold">Scanning for assigned deliveries...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
            <span className="material-icons text-3xl">inbox</span>
          </div>
          <h3 className="font-black text-sm text-[#071A3D]">No Delivery Requests Available</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You're all caught up! New orders dispatched by admin or counter staff will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {requests.map(order => {
            const isCOD = (order.payment_method || '').toLowerCase().includes('cash') || (order.payment_status || '').toLowerCase() !== 'paid'

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3 relative overflow-hidden"
              >
                {/* Header: Order Code & Guaranteed Delivery Fee */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-base text-[#071A3D]">
                        #{order.order_code}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20">
                        New Request
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold block mt-0.5">
                      Customer: <strong className="text-slate-600">{order.customer_name}</strong>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rider Fee</span>
                    <span className="font-mono font-black text-base text-emerald-600">
                      ₱{(order.delivery_fee || 49).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Logistics Route Details: Pickup & Delivery */}
                <div className="space-y-2 text-xs">
                  {/* Step A: Pickup */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-icons text-xs">storefront</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">1. Pickup Location</span>
                      <strong className="text-[#071A3D] block font-bold truncate">{order.restaurant_name}</strong>
                      <span className="text-[11px] text-slate-400 block">{order.restaurant_address}</span>
                    </div>
                  </div>

                  {/* Step B: Drop-off */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-icons text-xs">location_on</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">2. Delivery Destination</span>
                      <strong className="text-[#071A3D] block font-bold">{order.delivery_address}</strong>
                      {order.delivery_notes && (
                        <span className="text-[11px] text-amber-600 font-medium block mt-0.5 bg-amber-50 p-1.5 rounded border border-amber-100">
                          <strong>Note:</strong> {order.delivery_notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary & Payment Mode */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Order Total ({order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}):</span>
                    <span className="font-mono font-black text-[#071A3D] text-sm">₱{order.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Payment:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      isCOD ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {isCOD ? `Cash on Delivery (Collect ₱${order.grand_total.toFixed(2)})` : 'Paid Online (No Cash Needed)'}
                    </span>
                  </div>
                </div>

                {/* Big Action Buttons: Accept / Decline */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeclineModalOrder(order)}
                    disabled={processingOrderId === order.order_id}
                    className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-black text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAccept(order)}
                    disabled={processingOrderId === order.order_id}
                    className="py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-icons text-base">check_circle</span>
                    <span>{processingOrderId === order.order_id ? 'Accepting...' : 'Accept Order'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500">
              <span className="material-icons">warning</span>
              <h3 className="text-sm font-black text-[#071A3D]">Decline Delivery Request?</h3>
            </div>

            <p className="text-xs text-slate-500">
              Declining Order <strong className="text-[#071A3D]">#{declineModalOrder.order_code}</strong> will return it to the unassigned queue so Staff & Admin can assign another available rider.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Reason for declining:</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-[#071A3D] focus:outline-none focus:border-[#C8102E]"
              >
                <option value="Too far from current location">Too far from current location</option>
                <option value="Vehicle issue or low fuel">Vehicle issue or low fuel</option>
                <option value="Taking a meal or rest break">Taking a meal or rest break</option>
                <option value="Emergency situation">Emergency situation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalOrder(null)}
                className="py-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-sm"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
