import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import StaffLayout from '../staff/layouts/StaffLayout'
import LoadingFallback from '../components/LoadingFallback'

const DashboardOverview = lazy(() => import('../staff/pages/DashboardOverview'))
const POSPage = lazy(() => import('../staff/pages/POSPage'))
const OrdersPage = lazy(() => import('../staff/pages/OrdersPage'))
const ReservationsPage = lazy(() => import('../staff/pages/ReservationsPage'))
const BanquetEventOrderPage = lazy(() => import('../staff/pages/BanquetEventOrderPage'))
const EventStaffSchedulingPage = lazy(() => import('../staff/pages/EventStaffSchedulingPage'))
const MenuStockPage = lazy(() => import('../staff/pages/MenuStockPage'))
const CateringSchedulePage = lazy(() => import('../staff/pages/CateringSchedulePage'))
const FunctionHallsPage = lazy(() => import('../staff/pages/FunctionHallsPage'))
const MessagesPage = lazy(() => import('../staff/pages/MessagesPage'))
const AnalyticsPage = lazy(() => import('../staff/pages/AnalyticsPage'))
const InventoryPage = lazy(() => import('../components/inventory/DualTrackInventoryPage'))
const PaymentsPage = lazy(() => import('../staff/pages/PaymentsPage'))

function StaffRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<StaffLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="beo" element={<BanquetEventOrderPage isStaff={true} />} />
          <Route path="staff-schedule" element={<EventStaffSchedulingPage />} />
          <Route path="inventory" element={<InventoryPage isStaff={true} />} />
          <Route path="menu" element={<MenuStockPage />} />
          <Route path="packages" element={<CateringSchedulePage />} />
          <Route path="events" element={<CateringSchedulePage />} />
          <Route path="halls" element={<FunctionHallsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default StaffRoutes
