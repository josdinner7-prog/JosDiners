import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function RiderHistoryPage() {
  const { riderData } = useOutletContext()
  const { showToast } = useToast()

  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const riderId = riderData?.user_id || riderData?.rider_id

  const loadHistory = async () => {
    if (!riderId) return
    setIsLoading(true)
    try {
      const res = await api.riders.getHistory(riderId, { filter })
      if (res.status === 'success') {
        setHistory(res.history || [])
      }
    } catch (err) {
      showToast('Could not load delivery history.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [riderId, filter])

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-2">
        <h2 className="text-lg font-black text-[#071A3D] flex items-center gap-2">
          <span className="material-icons text-purple-500">history</span>
          <span>Delivery History</span>
        </h2>
        <p className="text-xs text-slate-400">
          Record of your past customer delivery assignments
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
        {[
          { id: 'all', label: 'All' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'failed', label: 'Failed' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              filter === t.id
                ? 'bg-[#C8102E] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <span className="material-icons text-3xl text-slate-300 animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-bold">Loading past delivery runs...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
            <span className="material-icons text-2xl">history_toggle_off</span>
          </div>
          <h4 className="font-bold text-sm text-slate-600">No Delivery Records</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {filter === 'all'
              ? 'You have not completed any deliveries yet. Deliveries will log here once completed.'
              : `No deliveries found for filter: "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(order => {
            const isCompleted = order.status === 'Delivered' || order.delivery_status === 'Delivered'
            const isCancelled = order.status === 'Cancelled'
            const isFailed = order.delivery_status === 'Failed'

            return (
              <div
                key={order.order_id}
                className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#071A3D]">
                      #{order.order_code}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : isCancelled
                        ? 'bg-rose-50 text-rose-500 border-rose-200'
                        : 'bg-amber-50 text-amber-500 border-amber-200'
                    }`}>
                      {order.delivery_status || order.status}
                    </span>
                  </div>

                  <span className="font-mono font-black text-sm text-emerald-600">
                    +₱{(order.delivery_fee || 49).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Customer:</span>
                    <strong className="text-slate-600">{order.customer_name}</strong>
                  </div>

                  <div className="flex justify-between items-start gap-2 text-slate-400">
                    <span className="shrink-0">Destination:</span>
                    <span className="text-right text-slate-500 font-medium truncate max-w-[220px]">
                      📍 {order.delivery_address}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {order.delivered_at
                        ? new Date(order.delivered_at).toLocaleString()
                        : order.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : 'Recent'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Total Order: <span className="font-mono text-[#071A3D]">₱{order.grand_total.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
