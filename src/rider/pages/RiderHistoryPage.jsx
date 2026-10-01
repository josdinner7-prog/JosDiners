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
      <div className="border-b border-slate-800 pb-2">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <span className="material-icons text-purple-400">history</span>
          <span>Delivery History</span>
        </h2>
        <p className="text-xs text-slate-400">
          Record of your past customer delivery assignments
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
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
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === t.id
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <span className="material-icons text-3xl text-slate-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-bold">Loading past delivery runs...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <span className="material-icons text-2xl">history_toggle_off</span>
          </div>
          <h4 className="font-bold text-sm text-slate-300">No Delivery Records</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-white">
                      #{order.order_code}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : isCancelled
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      {order.delivery_status || order.status}
                    </span>
                  </div>

                  <span className="font-mono font-black text-sm text-emerald-400">
                    +₱{(order.delivery_fee || 49).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Customer:</span>
                    <strong className="text-slate-200">{order.customer_name}</strong>
                  </div>

                  <div className="flex justify-between items-start gap-2 text-slate-400">
                    <span className="shrink-0">Destination:</span>
                    <span className="text-right text-slate-300 font-medium truncate max-w-[220px]">
                      📍 {order.delivery_address}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {order.delivered_at
                        ? new Date(order.delivered_at).toLocaleString()
                        : order.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : 'Recent'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Total Order: <span className="font-mono text-white">₱{order.grand_total.toFixed(2)}</span>
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
