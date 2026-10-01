import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function RiderEarningsPage() {
  const { riderData } = useOutletContext()
  const { showToast } = useToast()

  const [earningsData, setEarningsData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const riderId = riderData?.user_id || riderData?.rider_id

  const loadEarnings = async () => {
    if (!riderId) return
    setIsLoading(true)
    try {
      const res = await api.riders.getEarnings(riderId)
      if (res.status === 'success') {
        setEarningsData(res)
      }
    } catch (err) {
      showToast('Could not load earnings report.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEarnings()
  }, [riderId])

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#071A3D] flex items-center gap-2">
            <span className="material-icons text-emerald-500">payments</span>
            <span>Rider Earnings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time delivery compensation and payout summaries
          </p>
        </div>
        <button
          onClick={loadEarnings}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200 cursor-pointer active:scale-95"
        >
          <span className={`material-icons text-base ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {/* Main Total Highlight Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-lg shadow-md relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[11px] font-black uppercase text-emerald-100 tracking-wider">
            Total Accumulated Rider Earnings
          </span>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            ₱{(earningsData?.total_earnings || 0).toFixed(2)}
          </div>
          <p className="text-xs text-emerald-100 pt-1">
            Flat ₱49.00 fee per completed customer delivery drop-off
          </p>
        </div>

        <div className="absolute right-3 top-3 opacity-10 text-white pointer-events-none">
          <span className="material-icons text-8xl">account_balance_wallet</span>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Today's Earnings
          </span>
          <div className="text-xl font-black text-emerald-600 font-mono">
            ₱{(earningsData?.today_earnings || 0).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {earningsData?.today_completed || 0} completed drops
          </span>
        </div>

        {/* This Week */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Last 7 Days (Weekly)
          </span>
          <div className="text-xl font-black text-blue-500 font-mono">
            ₱{(earningsData?.weekly_earnings || 0).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {earningsData?.weekly_completed || 0} completed drops
          </span>
        </div>
      </div>

      {/* Itemized Deliveries for Today */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
          <span>Today's Completed Drops</span>
          <span className="font-mono text-emerald-500">{earningsData?.today_deliveries?.length || 0}</span>
        </h3>

        {isLoading ? (
          <div className="py-8 text-center space-y-2">
            <span className="material-icons text-2xl text-slate-300 animate-spin">refresh</span>
            <p className="text-xs text-slate-400 font-bold">Calculating drop fees...</p>
          </div>
        ) : !earningsData?.today_deliveries || earningsData.today_deliveries.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 space-y-1">
            <span className="material-icons text-3xl text-slate-300">moped</span>
            <p>No deliveries completed yet today.</p>
            <p className="text-[11px] text-slate-300">Accept assignments and deliver orders to build your daily earnings.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {earningsData.today_deliveries.map(d => (
              <div key={d.order_id} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[#071A3D]">#{d.order_code}</span>
                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[130px]">{d.customer_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.delivered_at ? new Date(d.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Delivered'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    +₱{(parseFloat(d.delivery_fee) || 49).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold">Fee Earned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
