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
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
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
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer active:scale-95"
          title="Refresh Requests"
        >
          <span className={`material-icons text-base ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <span className="material-icons text-3xl text-slate-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-bold">Scanning for assigned deliveries...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <span className="material-icons text-3xl">inbox</span>
          </div>
          <h3 className="font-black text-sm text-white">No Delivery Requests Available</h3>
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
                className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3 relative overflow-hidden"
              >
                {/* Header: Order Code & Guaranteed Delivery Fee */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-base text-white">
                        #{order.order_code}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/40">
                        New Request
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold block mt-0.5">
                      Customer: <strong className="text-slate-200">{order.customer_name}</strong>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rider Fee</span>
                    <span className="font-mono font-black text-base text-emerald-400">
                      ₱{(order.delivery_fee || 49).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Logistics Route Details: Pickup & Delivery */}
                <div className="space-y-2 text-xs">
                  {/* Step A: Pickup */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-icons text-xs">storefront</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">1. Pickup Location</span>
                      <strong className="text-white block font-bold truncate">{order.restaurant_name}</strong>
                      <span className="text-[11px] text-slate-400 block">{order.restaurant_address}</span>
                    </div>
                  </div>

                  {/* Step B: Drop-off */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-icons text-xs">location_on</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">2. Delivery Destination</span>
                      <strong className="text-white block font-bold">{order.delivery_address}</strong>
                      {order.delivery_notes && (
                        <span className="text-[11px] text-amber-300 font-medium block mt-0.5 bg-amber-950/40 p-1.5 rounded-lg border border-amber-900/60">
                          <strong>Note:</strong> {order.delivery_notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary & Payment Mode */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-400 font-bold">
                    <span>Order Total ({order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}):</span>
                    <span className="font-mono font-black text-white text-sm">₱{order.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Payment:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      isCOD ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
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
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-black text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAccept(order)}
                    disabled={processingOrderId === order.order_id}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="material-icons">warning</span>
              <h3 className="text-sm font-black text-white">Decline Delivery Request?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Declining Order <strong className="text-white">#{declineModalOrder.order_code}</strong> will return it to the unassigned queue so Staff & Admin can assign another available rider.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Reason for declining:</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-[#C8102E]"
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
                className="py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md"
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
