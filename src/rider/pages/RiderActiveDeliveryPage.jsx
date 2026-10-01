import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

const DELIVERY_STEPS = [
  { id: 'Assigned', label: 'Assigned', icon: 'assignment', desc: 'Staff dispatched this order to your app' },
  { id: 'Accepted', label: 'Accepted', icon: 'thumb_up', desc: 'You accepted this delivery dispatch' },
  { id: 'Going to Restaurant', label: 'Going to Resto', icon: 'two_wheeler', desc: 'Traveling to Jo\'s Diner to pick up the food' },
  { id: 'Arrived at Restaurant', label: 'At Resto', icon: 'storefront', desc: 'Waiting at the counter for packed meal packages' },
  { id: 'Order Picked Up', label: 'Picked Up', icon: 'inventory_2', desc: 'Order placed inside insulated delivery bag' },
  { id: 'On the Way', label: 'On the Way', icon: 'moped', desc: 'En route to customer delivery destination' },
  { id: 'Arrived', label: 'Arrived', icon: 'location_on', desc: 'Arrived outside customer doorstep / address' },
  { id: 'Delivered', label: 'Delivered', icon: 'task_alt', desc: 'Order handed over, payment received, completed' }
]

export default function RiderActiveDeliveryPage() {
  const { riderData, fetchRiderData } = useOutletContext()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [activeDelivery, setActiveDelivery] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const riderId = riderData?.user_id || riderData?.rider_id

  const loadActiveDelivery = async () => {
    if (!riderId) return
    setIsLoading(true)
    try {
      const res = await api.riders.getActiveDelivery(riderId)
      if (res.status === 'success') {
        setActiveDelivery(res.active_delivery)
      }
    } catch (err) {
      showToast('Could not load active delivery.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActiveDelivery()
  }, [riderId])

  const currentStep = activeDelivery?.delivery_status || 'Accepted'
  const currentStepIndex = DELIVERY_STEPS.findIndex(s => s.id === currentStep)
  const isCOD = (activeDelivery?.payment_method || '').toLowerCase().includes('cash') || (activeDelivery?.payment_status || '').toLowerCase() !== 'paid'

  // Determine next milestone
  const getNextStage = () => {
    switch (currentStep) {
      case 'Assigned':
      case 'Accepted':
        return {
          target: 'Going to Restaurant',
          buttonLabel: '🛵 Start: Going to Jo\'s Diner',
          color: 'bg-blue-500 hover:bg-blue-400'
        }
      case 'Going to Restaurant':
        return {
          target: 'Arrived at Restaurant',
          buttonLabel: '🏬 Mark: Arrived at Jo\'s Diner',
          color: 'bg-amber-500 hover:bg-amber-400'
        }
      case 'Arrived at Restaurant':
        return {
          target: 'Order Picked Up',
          buttonLabel: '📦 Mark: Order Picked Up & Packed',
          color: 'bg-indigo-500 hover:bg-indigo-400'
        }
      case 'Order Picked Up':
        return {
          target: 'On the Way',
          buttonLabel: '🚀 Mark: On the Way to Customer',
          color: 'bg-sky-500 hover:bg-sky-400'
        }
      case 'On the Way':
        return {
          target: 'Arrived',
          buttonLabel: '📍 Mark: Arrived at Customer Location',
          color: 'bg-emerald-500 hover:bg-emerald-400'
        }
      case 'Arrived':
        return {
          target: 'Delivered',
          buttonLabel: '✅ Complete Delivery (Handed to Customer)',
          color: 'bg-[#C8102E] hover:bg-[#b00d27]'
        }
      default:
        return null
    }
  }

  const nextStage = getNextStage()

  const handleAdvanceStatus = async () => {
    if (!nextStage || !activeDelivery) return
    setIsUpdating(true)

    try {
      const res = await api.riders.updateDeliveryStatus(riderId, activeDelivery.order_id, nextStage.target)
      if (res.status === 'success') {
        showToast(`Milestone updated to: ${nextStage.target}!`, 'success')
        if (nextStage.target === 'Delivered') {
          await fetchRiderData()
          navigate('/rider/history')
        } else {
          setActiveDelivery(prev => prev ? { ...prev, delivery_status: nextStage.target } : null)
          await fetchRiderData()
        }
      }
    } catch (err) {
      showToast(err.message || 'Could not update delivery status.', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const openGoogleMaps = () => {
    if (!activeDelivery?.delivery_address) return
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDelivery.delivery_address)}`
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-2 animate-in fade-in">
        <span className="material-icons text-3xl text-slate-300 animate-spin">refresh</span>
        <p className="text-xs text-slate-400 font-bold">Checking active dispatch...</p>
      </div>
    )
  }

  if (!activeDelivery) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
          <span className="material-icons text-3xl">two_wheeler</span>
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-base text-[#071A3D]">No Active Delivery in Progress</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You do not have any ongoing deliveries. When you accept an order from the Requests tab, your delivery workflow will activate here.
          </p>
        </div>
        <Link
          to="/rider/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#C8102E] text-white font-black text-xs shadow-sm shadow-[#C8102E]/20"
        >
          <span className="material-icons text-base">assignment</span>
          <span>View Delivery Requests</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header with Order Code and Delivery Fee */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">Active Delivery</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-[#071A3D] font-mono">#{activeDelivery.order_code}</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                {currentStep}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Rider Fee</span>
            <span className="font-mono font-black text-lg text-emerald-600">
              ₱{(activeDelivery.delivery_fee || 49).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Action Bar: Call Customer, Call Restaurant, Open GPS Map */}
        <div className="grid grid-cols-3 gap-2">
          {activeDelivery.customer_phone && activeDelivery.customer_phone !== 'N/A' ? (
            <a
              href={`tel:${activeDelivery.customer_phone}`}
              className="py-2 px-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-blue-500 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span className="material-icons text-base">call</span>
              <span className="truncate">Call Client</span>
            </a>
          ) : (
            <button
              disabled
              className="py-2 px-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-300 font-bold text-xs flex items-center justify-center gap-1"
            >
              <span className="material-icons text-base">call</span>
              <span>No Phone</span>
            </button>
          )}

          <a
            href={`tel:${activeDelivery.restaurant_phone}`}
            className="py-2 px-1 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 text-amber-500 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
          >
            <span className="material-icons text-base">storefront</span>
            <span className="truncate">Call Resto</span>
          </a>

          <button
            type="button"
            onClick={openGoogleMaps}
            className="py-2 px-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <span className="material-icons text-base">directions</span>
            <span className="truncate">Map GPS</span>
          </button>
        </div>
      </div>

      {/* 2. CASH ON DELIVERY COLLECTION CALLOUT (If applicable) */}
      {isCOD && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
            <span className="material-icons text-xl">payments</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">Cash on Delivery Notice</span>
            <div className="text-sm font-black text-[#071A3D]">
              Collect <span className="font-mono text-amber-600">₱{activeDelivery.grand_total.toFixed(2)}</span> from Customer
            </div>
            <span className="text-[11px] text-slate-500">Ensure full amount is collected before marking delivered.</span>
          </div>
        </div>
      )}

      {/* 3. BIG PRIMARY STATUS ADVANCE ACTION BUTTON */}
      {nextStage && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleAdvanceStatus}
            disabled={isUpdating}
            className={`w-full py-3.5 rounded-lg font-black text-sm text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 disabled:opacity-50 ${nextStage.color}`}
          >
            <span className="material-icons text-xl">
              {isUpdating ? 'sync' : 'arrow_forward'}
            </span>
            <span>{isUpdating ? 'Updating Milestone...' : nextStage.buttonLabel}</span>
          </button>
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Tap button above to advance to the next delivery milestone
          </p>
        </div>
      )}

      {/* 4. Complete 8-Step Delivery Progress Timeline */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <span className="material-icons text-sm text-amber-500">timeline</span>
          <span>Delivery Status Timeline</span>
        </h4>

        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {DELIVERY_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            const isUpcoming = idx > currentStepIndex

            return (
              <div key={step.id} className="flex items-start gap-3 relative z-10">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 border transition ${
                  isCurrent
                    ? 'bg-amber-500 text-white border-amber-400 shadow-sm shadow-amber-500/30 animate-pulse'
                    : isCompleted
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <span className="material-icons text-xs">
                    {isCompleted ? 'check' : step.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black leading-tight ${
                      isCurrent ? 'text-amber-600' : isCompleted ? 'text-[#071A3D]' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                        Current Step
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Destination & Logistics Details Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
          Delivery Logistics
        </h4>

        <div className="space-y-2 text-xs divide-y divide-slate-100">
          <div className="pt-1.5 first:pt-0">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Customer Name</span>
            <span className="font-bold text-[#071A3D] text-sm">{activeDelivery.customer_name}</span>
          </div>

          <div className="pt-1.5">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Destination Address</span>
            <span className="font-bold text-emerald-600 text-xs block mt-0.5">{activeDelivery.delivery_address}</span>
            {activeDelivery.delivery_notes && (
              <span className="text-[11px] text-amber-600 font-medium block mt-1 bg-amber-50 p-2 rounded border border-amber-100">
                <strong>Delivery Note:</strong> {activeDelivery.delivery_notes}
              </span>
            )}
          </div>

          <div className="pt-1.5">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Pickup Restaurant</span>
            <span className="font-bold text-[#071A3D] block">{activeDelivery.restaurant_name}</span>
            <span className="text-[11px] text-slate-400 block">{activeDelivery.restaurant_address}</span>
          </div>
        </div>
      </div>

      {/* 6. Order Items Summary */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2.5">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
          Items to Deliver ({activeDelivery.items?.length || 0})
        </h4>

        <div className="divide-y divide-slate-100">
          {(activeDelivery.items || []).map((it, idx) => (
            <div key={it.id || idx} className="py-1.5 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-500 font-mono">{it.quantity}x</span>
                <span className="font-bold text-slate-700">{it.name}</span>
              </div>
              <span className="font-mono text-slate-400">₱{(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-2 flex justify-between items-baseline font-black">
          <span className="text-xs uppercase text-slate-400">Grand Total:</span>
          <span className="font-mono text-base text-[#C8102E]">₱{activeDelivery.grand_total.toFixed(2)}</span>
        </div>
      </div>

    </div>
  )
}
