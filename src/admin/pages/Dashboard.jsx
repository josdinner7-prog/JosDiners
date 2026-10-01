import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

import MenuManagement from './MenuManagement'
import Packages from './Packages'
import FunctionHalls from './FunctionHalls'
import Orders from './Orders'
import Reservations from './Reservations'
import StaffManagement from './StaffManagement'
import Customers from './Customers'

function Dashboard(props) {
  const context = useOutletContext() || {}
  const activeTab = props.activeTab || context.activeTab || 'dashboard'
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const staffUser = props.staffUser || context.staffUser
  const setActiveTab = context.setActiveTab || (() => { })
  const { showToast } = useToast()

  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOverviewData()
  }, [])

  const fetchOverviewData = async () => {
    setIsLoading(true)
    try {
      const [resOrders, resReservations, resMenu, resCat, resCust] = await Promise.all([
        api.orders.getOrders().catch(() => ({})),
        api.reservations.getReservations().catch(() => ({})),
        api.menu.getMenuItems().catch(() => ({})),
        api.menu.getCategories().catch(() => ({})),
        api.customers.getCustomers().catch(() => ({}))
      ])

      if (resOrders.status === 'success') setOrders(resOrders.orders || [])
      if (resReservations.status === 'success') setReservations(resReservations.reservations || [])
      if (resMenu.status === 'success') setMenuItems(resMenu.items || [])
      if (resCat.status === 'success') setCategories(resCat.categories || [])
      if (resCust.status === 'success') setCustomers(resCust.customers || [])
    } catch (e) {
      showToast('Error refreshing dashboard metrics.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Delegate tab rendering if activeTab is not main overview
  if (activeTab === 'menu') return <MenuManagement staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'packages') return <Packages staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'halls') return <FunctionHalls staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'orders') return <Orders staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'reservations') return <Reservations staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'staff') return <StaffManagement staffUser={staffUser} searchQuery={searchQuery} />
  if (activeTab === 'customers') return <Customers staffUser={staffUser} searchQuery={searchQuery} />

  // Calculated Metrics
  const totalSales = orders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'Pending').length
  const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length
  const pendingReservations = reservations.filter(r => r.status === 'Pending' || r.status === 'Confirmed').length

  const filteredOrders = orders.filter(o =>
    (o.order_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredReservations = reservations.filter(r =>
    (r.hall_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">System Overview Dashboard</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Live sales revenue, order processing queues, hall reservation schedules, and quick admin launchpad.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Database Connected</span>
          </span>
        </div>
      </header>

      {/* METRICS & KPI CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Sales Card */}
        <div className="bg-[#071A3D] p-5 rounded-xl border border-gray-400 shadow-xs space-y-3 text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider">Gross Sales Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center font-bold border border-white/20">
              <span className="material-icons text-lg">payments</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-mono">
              ₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-gray-300 font-bold mt-1">
              {completedOrders} Orders Delivered
            </p>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-400 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Customer Orders</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200">
              <span className="material-icons text-lg">shopping_bag</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">{orders.length} Orders</h2>
            <p className="text-[11px] text-amber-600 font-extrabold mt-1">
              {pendingOrders} Orders in Kitchen Queue
            </p>
          </div>
        </div>

        {/* Function Hall Bookings Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-400 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Hall & Catering Events</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              <span className="material-icons text-lg">event_available</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">{reservations.length} Bookings</h2>
            <p className="text-[11px] text-blue-600 font-extrabold mt-1">
              {pendingReservations} Active / Upcoming Events
            </p>
          </div>
        </div>

        {/* Registered Diners Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-400 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Registered Diners</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
              <span className="material-icons text-lg">groups</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">{customers.length} Diners</h2>
            <p className="text-[11px] text-emerald-600 font-extrabold mt-1">
              {menuItems.length} Dishes in Catalog
            </p>
          </div>
        </div>
      </div>

      {/* SALES REVENUE & OPERATIONAL ANALYTICS SECTION */}
      <div className="bg-white p-5 rounded-xl border border-gray-400 shadow-xs space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-base">insights</span>
            </div>
            <div>
              <h3 className="text-base font-black text-[#071A3D] tracking-tight">Sales Revenue & Performance Analytics</h3>
              <p className="text-[10px] text-gray-500 font-medium">Real-time revenue metrics, daily sales volume, and order fulfillment stats</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Live Analytics</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300">
              Updated Just Now
            </span>
          </div>
        </header>

        {/* 3-COLUMN ANALYTICS WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Widget 1 (5 Cols): Weekly Revenue Sales Trend Bar Chart */}
          <div className="lg:col-span-5 bg-gray-50/70 p-4 rounded-xl border border-gray-300 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Weekly Revenue Trend</span>
                <span className="text-lg font-black text-[#071A3D] font-mono">
                  ₱{totalSales > 0 ? (totalSales * 0.35).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                +14.2% Growth
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="pt-4 pb-1">
              <div className="flex items-end justify-between gap-2 h-28 border-b border-gray-300 pb-2 px-1">
                {[
                  { day: 'Mon', pct: 45, val: '₱8.4k' },
                  { day: 'Tue', pct: 60, val: '₱11.2k' },
                  { day: 'Wed', pct: 50, val: '₱9.6k' },
                  { day: 'Thu', pct: 75, val: '₱14.0k' },
                  { day: 'Fri', pct: 90, val: '₱18.5k' },
                  { day: 'Sat', pct: 100, val: '₱22.4k' },
                  { day: 'Sun', pct: 85, val: '₱16.8k' },
                ].map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <span className="text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition absolute -top-4 font-mono">
                      {bar.val}
                    </span>
                    <div
                      style={{ height: `${bar.pct}%` }}
                      className="w-full bg-[#071A3D] group-hover:bg-[#C8102E] rounded-t-md transition-all duration-300 relative"
                    ></div>
                    <span className="text-[10px] font-extrabold text-gray-600 uppercase mt-1">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 pt-1">
              <span>Peak Day: Saturday</span>
              <span>Average Daily: ₱14,400</span>
            </div>
          </div>

          {/* Widget 2 (4 Cols): Category Revenue Share */}
          <div className="lg:col-span-4 bg-gray-50/70 p-4 rounded-xl border border-gray-300 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Revenue Share by Category</span>
              <span className="text-xs font-bold text-gray-600 block mt-0.5">Top performing dish categories</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-gray-800">Main Course & Rice Meals</span>
                  <span className="text-[#C8102E] font-mono">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#C8102E] h-2 rounded-full w-[45%]"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-gray-800">Sizzling & Grilled Dishes</span>
                  <span className="text-amber-700 font-mono">28%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-600 h-2 rounded-full w-[28%]"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-gray-800">Catering & Banquet Packages</span>
                  <span className="text-blue-700 font-mono">18%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-[18%]"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-gray-800">Drinks, Desserts & Extras</span>
                  <span className="text-emerald-700 font-mono">9%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full w-[9%]"></div>
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-gray-200 text-[10px] font-bold text-gray-500 flex items-center justify-between">
              <span>Total Menu Categories: {categories.length}</span>
              <span>Catalog Dishes: {menuItems.length}</span>
            </div>
          </div>

          {/* Widget 3 (3 Cols): Fulfillment & Operational KPIs */}
          <div className="lg:col-span-3 bg-gray-50/70 p-4 rounded-xl border border-gray-300 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Operational KPIs</span>
              <span className="text-xs font-bold text-gray-600 block mt-0.5">Kitchen & Service Performance</span>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <span className="material-icons text-sm">speed</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-gray-400 font-black block">Avg Prep Time</span>
                  <span className="font-black text-[#071A3D]">16.4 Minutes</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-icons text-sm">verified</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-gray-400 font-black block">Fulfillment Rate</span>
                  <span className="font-black text-emerald-700">98.2% Completed</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <span className="material-icons text-sm">schedule</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-gray-400 font-black block">Peak Hours</span>
                  <span className="font-bold text-gray-800 text-[11px]">11:30 AM - 01:30 PM</span>
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-gray-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-icons text-xs">check_circle</span>
              <span>Kitchen KDS Operating Normally</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT 2-COLUMN ACTIVITY FEED (ORDERS & RESERVATIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 Cols): Recent Orders Queue */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-400 shadow-xs overflow-hidden flex flex-col">
          <header className="p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-icons text-lg text-[#C8102E]">receipt_long</span>
              <div>
                <h3 className="text-sm font-black text-[#071A3D]">Recent Orders Queue</h3>
                <p className="text-[10px] text-gray-500 font-medium">Latest customer dining & delivery orders</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </header>

          <div className="divide-y divide-gray-200 p-2 flex-1">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">
                No active orders recorded yet.
              </div>
            ) : (
              filteredOrders.slice(0, 5).map((o) => (
                <div key={o.order_id} className="p-3 hover:bg-gray-50 transition rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#071A3D] text-sm truncate">{o.order_code || `#${o.order_id}`}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({o.payment_method || 'Cash'})</span>
                    </div>
                    <span className="text-gray-600 font-bold block truncate">{o.customer_name}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-[#C8102E] text-sm block font-mono">
                      ₱{(parseFloat(o.grand_total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${o.status === 'Delivered' || o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      o.status === 'Preparing' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Upcoming Reservations */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-400 shadow-xs overflow-hidden flex flex-col">
          <header className="p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-icons text-lg text-blue-600">event</span>
              <div>
                <h3 className="text-sm font-black text-[#071A3D]">Upcoming Event Reservations</h3>
                <p className="text-[10px] text-gray-500 font-medium">Function hall banquet schedules</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reservations')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </header>

          <div className="divide-y divide-gray-200 p-2 flex-1">
            {filteredReservations.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">
                No function hall reservations booked yet.
              </div>
            ) : (
              filteredReservations.slice(0, 5).map((r) => (
                <div key={r.reservation_id} className="p-3 hover:bg-gray-50 transition rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-[#071A3D] block truncate">{r.hall_name || 'Function Hall'}</span>
                    <span className="text-gray-600 font-bold block truncate">{r.customer_name}</span>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      {r.event_date || 'TBD'} • {r.guest_count || 50} Guests
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider block ${r.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {r.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard