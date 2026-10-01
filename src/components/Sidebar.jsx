import { useState } from 'react'
import logo from '../assets/logo.png'

function Sidebar({
  activeTab,
  setActiveTab,
  staffUser,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false)
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed
  const setIsCollapsed = propSetIsCollapsed || setLocalIsCollapsed

  const isMiniMode = isCollapsed && !isMobileOpen

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: 'dashboard' },
    { id: 'menu', label: 'MENU CATALOG', icon: 'restaurant_menu' },
    { id: 'packages', label: 'PACKAGE OFFERS', icon: 'inventory_2' },
    { id: 'halls', label: 'FUNCTION HALLS', icon: 'apartment' },
    { id: 'reservations', label: 'RESERVATIONS', icon: 'event' },
    { id: 'beo', label: 'BANQUET ORDERS (BEO)', icon: 'fact_check', pillBadge: 'CATERING', pillBg: 'bg-amber-50 text-amber-800 border border-amber-300' },
    { id: 'inventory', label: 'CATERING INVENTORY', icon: 'warehouse', pillBadge: 'DUAL-TRACK', pillBg: 'bg-rose-50 text-rose-800 border border-rose-300' },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: 'notifications' },
    { id: 'orders', label: 'LIVE ORDERS', icon: 'receipt_long' },
    { id: 'payments', label: 'PAYMENTS', icon: 'payments', pillBadge: 'LEDGER', pillBg: 'bg-red-50 text-[#C8102E] border border-red-300' },
    { id: 'customers', label: 'CUSTOMERS', icon: 'groups' },
    { id: 'staff', label: 'STAFF ROSTER', icon: 'badge', pillBadge: '● ONLINE', pillBg: 'bg-emerald-50 text-emerald-800 border border-emerald-300' },
    { id: 'staff-schedule', label: 'EVENT STAFF ROSTER', icon: 'schedule_send', pillBadge: 'SCHEDULE', pillBg: 'bg-blue-50 text-blue-800 border border-blue-300' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white text-[#071A3D] flex flex-col justify-between shadow-lg z-40 font-sans border-r border-gray-300 transition-all duration-300 ${isMobileOpen
        ? 'translate-x-0 w-64'
        : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
    >
      {/* Floating Toggle Button — sits on the right border edge of the sidebar */}
      {!isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-20 z-50 w-7 h-7 rounded-full bg-white border border-gray-300 shadow-md items-center justify-center text-gray-500 hover:text-[#C8102E] hover:border-[#C8102E] transition-all duration-200 active:scale-90 cursor-pointer"
          title={isCollapsed ? 'Expand Navigation Menu' : 'Collapse Navigation Menu'}
        >
          <span className={`material-icons text-sm transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            chevron_left
          </span>
        </button>
      )}

      {/* Upper Navigation Container */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-5 px-3">
        {/* Brand Header */}
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200 px-1">
          <div className={`flex items-center gap-2.5 min-w-0 ${isMiniMode ? 'justify-center w-full' : ''}`}>
            <img
              src={logo}
              alt="Jo's Diner Logo"
              className={`object-contain shrink-0 transition-all duration-300 hover:scale-105 ${isMiniMode ? 'h-9 w-9' : 'h-11 w-11'}`}
            />

            {!isMiniMode && (
              <div className="min-w-0">
                <span className="jos-diner-brand-title text-xl tracking-wide block truncate leading-tight">
                  JO'S DINER
                </span>
                <span className="flex text-[7px] font-bold text-gray-500 tracking-widest items-center gap-1 mt-0.5 leading-none uppercase">
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                  <span className="whitespace-nowrap">Function Hall &amp; Catering</span>
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                </span>
                {/* Admin Portal pill */}
                <div className="inline-flex items-center gap-1 bg-red-50 text-[#C8102E] border border-red-200 px-2 py-0.5 rounded-full text-[8px] font-black uppercase mt-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-pulse"></span>
                  <span>ADMIN PORTAL</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id || (activeTab === 'dashboard' && item.id === 'dashboard')

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id)
                  if (isMobileOpen && setIsMobileOpen) setIsMobileOpen(false)
                }}
                title={isMiniMode ? item.label : undefined}
                className={`w-full flex items-center ${isMiniMode ? 'md:justify-center md:p-2.5 justify-between px-3.5 py-2.5' : 'justify-between px-3.5 py-2.5'
                  } rounded-xl font-black text-xs tracking-wider transition-all duration-200 active:scale-95 cursor-pointer ${isActive
                    ? 'bg-[#C8102E] text-white shadow-md translate-x-1'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#071A3D] hover:translate-x-1'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`material-icons text-lg ${isActive ? 'text-white' : 'text-[#C8102E]'}`}>
                    {item.icon}
                  </span>
                  {!isMiniMode && (
                    <span className="truncate font-black uppercase tracking-wider text-[11px]">{item.label}</span>
                  )}
                </div>

                {/* Right Badges & Indicators */}
                {!isMiniMode && item.pillBadge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${item.pillBg}`}>
                    {item.pillBadge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

    </aside>
  )
}

export default Sidebar