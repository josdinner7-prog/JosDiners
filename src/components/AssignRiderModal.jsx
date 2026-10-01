import { useState, useEffect } from 'react'
import { useToast } from './ToastNotification'
import api from '../services/api'

export default function AssignRiderModal({ order, isOpen, onClose, onAssigned }) {
  const { showToast } = useToast()

  const [riders, setRiders] = useState([])
  const [selectedRiderId, setSelectedRiderId] = useState(null)
  const [estimatedArrival, setEstimatedArrival] = useState('30 - 45 mins')
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isReassign = Boolean(order?.rider_id || order?.rider_name)

  useEffect(() => {
    if (!isOpen || !order) return
    loadRiders()
    setDispatchNotes(order.delivery_notes || '')
    setEstimatedArrival(order.estimated_delivery_time || '30 - 45 mins')
  }, [isOpen, order])

  const loadRiders = async () => {
    setIsLoading(true)
    try {
      const res = await api.riders.getRiders()
      if (res.status === 'success') {
        const list = res.riders || []
        setRiders(list)

        // Pre-select current rider if reassigning, or auto-select first available
        if (order?.rider_id) {
          setSelectedRiderId(order.rider_id)
        } else {
          const firstAvailable = list.find(r => r.effective_status === 'Available')
          if (firstAvailable) {
            setSelectedRiderId(firstAvailable.user_id)
          }
        }
      }
    } catch (err) {
      showToast('Could not load riders list from server.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !order) return null

  const handleConfirmAssignment = async () => {
    if (!selectedRiderId) {
      showToast('Please select an available delivery rider.', 'warning')
      return
    }

    const selectedRider = riders.find(r => r.user_id === selectedRiderId)
    if (!selectedRider) {
      showToast('Selected rider was not found.', 'error')
      return
    }

    if (selectedRider.effective_status !== 'Available' && selectedRider.user_id !== order.rider_id) {
      showToast(`Rider ${selectedRider.full_name} is currently ${selectedRider.effective_status} and cannot be assigned.`, 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        rider_id: selectedRider.user_id,
        estimated_delivery_time: estimatedArrival,
        delivery_notes: dispatchNotes
      }

      let res
      if (isReassign && order.rider_id && order.rider_id !== selectedRider.user_id) {
        res = await api.orders.reassignRider(order.order_id, payload)
      } else {
        res = await api.orders.assignRider(order.order_id, payload)
      }

      if (res.status === 'success') {
        showToast(
          isReassign
            ? `Order #${order.order_code || order.order_id} reassigned to ${selectedRider.full_name}!`
            : `Assigned ${selectedRider.full_name} to Order #${order.order_code || order.order_id}! Delivery request sent to rider.`,
          'success'
        )
        if (onAssigned) onAssigned(res.order)
        onClose()
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign rider.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl text-slate-800 dark:text-slate-100 space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-black border border-[#C8102E]/20">
              <span className="material-icons text-xl">two_wheeler</span>
            </div>
            <div>
              <h3 className="font-black text-sm text-[#071A3D] dark:text-white flex items-center gap-1.5">
                <span>{isReassign ? 'Reassign Delivery Rider' : 'Assign Available Rider'}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  #{order.order_code || order.order_id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Only riders marked as <strong className="text-emerald-600 dark:text-emerald-400">Available</strong> can receive new delivery dispatches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>

        {/* Order Destination Snapshot */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Customer:</span>
            <span className="font-bold">{order.customer_name} ({order.customer_phone || order.phone || 'N/A'})</span>
          </div>
          <div className="flex justify-between items-start gap-2 pt-0.5">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Deliver To:</span>
            <span className="font-bold text-right text-emerald-600 dark:text-emerald-400 max-w-[280px]">
              📍 {order.delivery_address || 'Customer Address'}
            </span>
          </div>
          {order.delivery_notes && (
            <div className="flex justify-between items-start gap-2 pt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
              <span className="shrink-0 font-bold">Landmark:</span>
              <span className="text-right italic">{order.delivery_notes}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span className="text-slate-500 dark:text-slate-400">Payment:</span>
            <span className="font-mono text-[#C8102E]">
              ₱{Number(order.total_amount || order.grand_total || 0).toFixed(2)}
              {(order.payment_status || '').toLowerCase() === 'paid' ? ' (PAID ONLINE)' : ' (CASH ON DELIVERY)'}
            </span>
          </div>
        </div>

        {/* Available Riders List Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
              Select Fleet Courier *
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {riders.filter(r => r.effective_status === 'Available').length} of {riders.length} Available
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center space-y-2">
              <span className="material-icons text-2xl text-slate-400 animate-spin">refresh</span>
              <p className="text-xs text-slate-500 font-bold">Checking rider live availability...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center space-y-1 text-xs">
              <span className="material-icons text-amber-600 text-xl">warning</span>
              <p className="font-bold text-amber-800 dark:text-amber-300">No registered delivery riders found.</p>
              <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                Create a Rider account in Admin Staff Management first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {riders.map(rider => {
                const isSelected = selectedRiderId === rider.user_id
                const isAvailable = rider.effective_status === 'Available'
                const isDelivering = rider.effective_status === 'Delivering'
                const isOffline = rider.effective_status === 'Offline'
                const isCurrentAssigned = order?.rider_id === rider.user_id

                return (
                  <div
                    key={rider.user_id}
                    onClick={() => {
                      if (isAvailable || isCurrentAssigned) {
                        setSelectedRiderId(rider.user_id)
                      } else {
                        showToast(`Rider ${rider.full_name} is ${rider.effective_status} and cannot be selected.`, 'warning')
                      }
                    }}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 select-none ${
                      isSelected
                        ? 'border-[#C8102E] bg-[#C8102E]/5 dark:bg-[#C8102E]/10 ring-1 ring-[#C8102E]'
                        : isAvailable
                        ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 cursor-pointer'
                        : 'border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#C8102E] bg-[#C8102E] text-white'
                          : 'border-slate-400 dark:border-slate-600'
                      }`}>
                        {isSelected && <span className="material-icons text-xs">check</span>}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-black truncate">{rider.full_name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">({rider.employee_code})</span>
                          {isCurrentAssigned && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              Currently Assigned
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span>{rider.vehicle_type || 'Motorcycle'}</span>
                          <span>•</span>
                          <span className="font-mono">{rider.plate_number || 'No Plate'}</span>
                          <span>•</span>
                          <span>{rider.phone_number || 'No Phone'}</span>
                        </div>

                        {/* Active order note if delivering */}
                        {isDelivering && rider.active_delivery && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium mt-0.5 truncate">
                            ⚠️ Active on Order #{rider.active_delivery.order_code || rider.active_delivery.order_id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ml-auto ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                          : isDelivering
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : isDelivering ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <span>{rider.effective_status}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Estimated Arrival & Special Delivery Instructions */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="font-bold block mb-1 text-slate-600 dark:text-slate-300 text-[11px]">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              placeholder="e.g. 30 - 45 mins"
              value={estimatedArrival}
              onChange={(e) => setEstimatedArrival(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
            />
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-600 dark:text-slate-300 text-[11px]">
              Rider Dispatch Briefing
            </label>
            <input
              type="text"
              placeholder="e.g. Handle with care, hot soup"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmAssignment}
            disabled={isSubmitting || !selectedRiderId}
            className="flex-1 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#a50d26] text-white font-black text-xs shadow-lg shadow-[#C8102E]/25 transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Assigning Rider...</span>
              </>
            ) : (
              <>
                <span className="material-icons text-base">send</span>
                <span>{isReassign ? 'Confirm Reassign Rider' : 'Assign Rider & Dispatch Request'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
