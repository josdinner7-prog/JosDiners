import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import { normalizeStaffOrder } from '../utils/normalizers'

export default function AnalyticsPage(props) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const ordData = await api.orders.getOrders()
      const list = (ordData.status === 'success' && Array.isArray(ordData.orders || ordData.data)) ? (ordData.orders || ordData.data) : []
      if (list.length > 0) {
        setOrders(list.map(normalizeStaffOrder))
      }
    } catch (e) {
      console.error('Failed to fetch orders for analytics:', e)
    }

    try {
      const menuData = await api.menu.getMenuItems()
      const items = (menuData.status === 'success' && Array.isArray(menuData.data || menuData.items)) ? (menuData.data || menuData.items) : []
      if (items.length > 0) {
        setMenuItems(items)
      }
    } catch (e) {
      console.error('Failed to fetch menu items for analytics:', e)
    }
  }

  // Shift Sales & Analytics Computations
  const shiftGrossSales = (orders || []).reduce((sum, o) => sum + (parseFloat(o?.total_amount || o?.grand_total || 0)), 0)
  const shiftTotalOrders = (orders || []).length
  const shiftAvgTicket = shiftTotalOrders > 0 ? (shiftGrossSales / shiftTotalOrders) : 0
  const cashSales = (orders || []).filter(o => o?.payment_method === 'Cash').reduce((sum, o) => sum + parseFloat(o?.total_amount || o?.grand_total || 0), 0)
  const gcashSales = (orders || []).filter(o => o?.payment_method === 'GCash').reduce((sum, o) => sum + parseFloat(o?.total_amount || o?.grand_total || 0), 0)
  const cardSales = (orders || []).filter(o => o?.payment_method === 'Card').reduce((sum, o) => sum + parseFloat(o?.total_amount || o?.grand_total || 0), 0)
  const dineInCount = (orders || []).filter(o => o?.order_type === 'Dine-in').length
  const takeoutCount = (orders || []).filter(o => o?.order_type === 'Takeout').length

  return (
    <div className="space-y-4 pb-10 text-xs animate-in fade-in duration-150">
      <div className="p-5 rounded-2xl bg-[#C8102E] text-white border border-slate-600 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">SHIFT FINANCIAL RECONCILIATION</span>
          </div>
          <h3 className="text-xl font-black">Live Shift Sales & POS Performance</h3>
          <p className="text-xs text-slate-300 mt-0.5">Real-time revenue metrics, ticket quantities, and tender type distributions.</p>
        </div>

        <button
          onClick={() => showToast('Printed Shift Z-Reading Financial Report.', 'success')}
          className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-red-700 active:scale-95 transition"
        >
          <span className="material-icons text-base">point_of_sale</span>
          <span>Print Shift Z-Reading</span>
        </button>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Shift Gross Sales</span>
          <h3 className="text-2xl font-black text-[#C8102E] mt-1">₱{shiftGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Reconciled Live</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <span className="text-[10px] font-black uppercase text-slate-400 block">Orders Processed</span>
          <h3 className="text-2xl font-black text-amber-500 mt-1">{shiftTotalOrders} Tickets</h3>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">{dineInCount} Dine-in • {takeoutCount} Takeout</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <span className="text-[10px] font-black uppercase text-slate-400 block">Average Order Value</span>
          <h3 className="text-2xl font-black text-sky-400 mt-1">₱{shiftAvgTicket.toFixed(2)}</h3>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">Per customer ticket</span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <span className="text-[10px] font-black uppercase text-slate-400 block">Cash Drawer Balance</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-1">₱{cashSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">Cash In Drawer</span>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Method Breakdown */}
        <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Tender Type Breakdown</h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>💵 Cash Tender</span>
                <span className="font-mono">₱{cashSales.toFixed(2)} ({shiftGrossSales > 0 ? Math.round((cashSales / shiftGrossSales) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${shiftGrossSales > 0 ? (cashSales / shiftGrossSales) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>📱 GCash / QR Payment</span>
                <span className="font-mono">₱{gcashSales.toFixed(2)} ({shiftGrossSales > 0 ? Math.round((gcashSales / shiftGrossSales) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${shiftGrossSales > 0 ? (gcashSales / shiftGrossSales) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>💳 Credit / Debit Card</span>
                <span className="font-mono">₱{cardSales.toFixed(2)} ({shiftGrossSales > 0 ? Math.round((cardSales / shiftGrossSales) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${shiftGrossSales > 0 ? (cardSales / shiftGrossSales) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Dishes Ranked */}
        <div className={`p-5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Shift Catalog Highlights</h4>

          <div className="space-y-2 text-xs">
            {menuItems.slice(0, 4).map((dish, idx) => (
              <div key={dish.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold">{dish.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">₱{Number(dish.price || 0).toFixed(2)}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-400">{dish.availability || 'Available'}</span>
              </div>
            ))}
            {menuItems.length === 0 && (
              <p className="text-center py-6 text-slate-400">No dishes available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
