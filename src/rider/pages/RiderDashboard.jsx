import { useOutletContext, useNavigate, Link } from 'react-router-dom'

export default function RiderDashboard() {
  const {
    riderData,
    activeDelivery,
    pendingRequestsCount,
    isOnline,
    isDelivering,
    handleToggleOnline
  } = useOutletContext()

  const navigate = useNavigate()

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Status Banner Card */}
      <div className={`p-4 rounded-2xl border transition shadow-lg relative overflow-hidden ${
        isDelivering
          ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/40 text-amber-200'
          : isOnline
          ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/40 text-emerald-200'
          : 'bg-slate-950 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${isDelivering ? 'bg-amber-400 animate-ping' : isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-xs font-black uppercase tracking-wider">
                {isDelivering ? 'On Active Delivery' : isOnline ? 'Ready for Orders' : 'Currently Offline'}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              {isDelivering ? 'Delivery in Progress' : isOnline ? "You're Online!" : 'Ready to Start Working?'}
            </h2>
            <p className="text-xs text-slate-300">
              {isDelivering
                ? `Handling Order #${activeDelivery?.order_code || activeDelivery?.order_id}`
                : isOnline
                ? 'Waiting for new dispatch assignments from Staff & Admin...'
                : 'Switch Online to begin receiving delivery requests.'}
            </p>
          </div>

          {!isDelivering && (
            <button
              type="button"
              onClick={handleToggleOnline}
              className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0 ${
                isOnline
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-[#C8102E] hover:bg-[#b00d27] text-white shadow-[#C8102E]/30'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Today's Key Metrics Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="material-icons text-xl">payments</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Earnings</div>
            <div className="text-xl font-black text-white font-mono">
              ₱{(riderData?.today_earnings || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <span className="material-icons text-xl">task_alt</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Today</div>
            <div className="text-xl font-black text-white font-mono">
              {riderData?.today_completed || 0} <span className="text-xs text-slate-400 font-sans font-bold">drops</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. New Requests Alert Banner (if pending) */}
      {pendingRequestsCount > 0 && (
        <div className="bg-gradient-to-r from-[#C8102E]/20 to-slate-950 border border-[#C8102E]/50 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8102E] text-white flex items-center justify-center font-black shrink-0">
              <span className="material-icons text-xl">assignment</span>
            </div>
            <div>
              <div className="text-xs font-black text-[#C8102E] uppercase tracking-wider">New Delivery Assigned!</div>
              <div className="text-sm font-black text-white">{pendingRequestsCount} Pending Request(s)</div>
              <div className="text-[11px] text-slate-300">Staff has assigned a new customer order for dispatch.</div>
            </div>
          </div>
          <Link
            to="/rider/requests"
            className="px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a50d26] text-white font-black text-xs shrink-0 shadow-md transition active:scale-95"
          >
            Review
          </Link>
        </div>
      )}

      {/* 4. Active Delivery Card (if delivering) */}
      {activeDelivery ? (
        <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-icons text-amber-400 text-lg">two_wheeler</span>
              <span className="font-black text-sm text-white">Active Delivery</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {activeDelivery.delivery_status}
              </span>
            </div>
            <span className="font-mono font-bold text-xs text-[#C8102E]">
              #{activeDelivery.order_code}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 font-bold">Recipient:</span>
              <span className="font-bold text-white text-right">{activeDelivery.customer_name}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 font-bold">Destination:</span>
              <span className="font-medium text-emerald-400 text-right truncate max-w-[200px]" title={activeDelivery.delivery_address}>
                📍 {activeDelivery.delivery_address}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 font-bold">
              <span>Delivery Fee Earned:</span>
              <span className="font-mono font-black text-white text-sm">₱{activeDelivery.delivery_fee.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/rider/active')}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-98 cursor-pointer"
          >
            <span>Open Delivery Tracker & Controls</span>
            <span className="material-icons text-base">arrow_forward</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-500 border border-slate-800">
            <span className="material-icons text-2xl">moped</span>
          </div>
          <h3 className="font-black text-sm text-slate-300">No Active Delivery Right Now</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Keep your status <strong className="text-emerald-400">Online</strong>. When kitchen and staff mark an order ready, it will be assigned to you.
          </p>
        </div>
      )}

      {/* 5. Quick Shortcuts Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <Link
          to="/rider/requests"
          className="bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center text-center transition group cursor-pointer"
        >
          <span className="material-icons text-2xl text-blue-400 mb-1 group-hover:scale-110 transition">receipt_long</span>
          <span className="text-[11px] font-bold text-slate-200">Requests</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">{pendingRequestsCount} pending</span>
        </Link>

        <Link
          to="/rider/history"
          className="bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center text-center transition group cursor-pointer"
        >
          <span className="material-icons text-2xl text-purple-400 mb-1 group-hover:scale-110 transition">history</span>
          <span className="text-[11px] font-bold text-slate-200">History</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">{riderData?.total_completed || 0} drops</span>
        </Link>

        <Link
          to="/rider/earnings"
          className="bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center text-center transition group cursor-pointer"
        >
          <span className="material-icons text-2xl text-emerald-400 mb-1 group-hover:scale-110 transition">payments</span>
          <span className="text-[11px] font-bold text-slate-200">Earnings</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">₱{(riderData?.total_earnings || 0).toFixed(0)}</span>
        </Link>
      </div>

    </div>
  )
}
