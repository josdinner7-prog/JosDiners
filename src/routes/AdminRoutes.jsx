import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminLayout from '../admin/layouts/AdminLayout'
import LoadingFallback from '../components/LoadingFallback'

const Dashboard = lazy(() => import('../admin/pages/Dashboard'))
const MenuManagement = lazy(() => import('../admin/pages/MenuManagement'))
const Packages = lazy(() => import('../admin/pages/Packages'))
const FunctionHalls = lazy(() => import('../admin/pages/FunctionHalls'))
const FunctionHallDetail = lazy(() => import('../admin/pages/FunctionHallDetail'))
const Orders = lazy(() => import('../admin/pages/Orders'))
const Reservations = lazy(() => import('../admin/pages/Reservations'))
const BanquetEventOrderPage = lazy(() => import('../admin/pages/BanquetEventOrderPage'))
const StaffManagement = lazy(() => import('../admin/pages/StaffManagement'))
const EventStaffSchedulingPage = lazy(() => import('../admin/pages/EventStaffSchedulingPage'))
const Customers = lazy(() => import('../admin/pages/Customers'))
const NotificationsPage = lazy(() => import('../admin/pages/NotificationsPage'))
const InventoryPage = lazy(() => import('../components/inventory/DualTrackInventoryPage'))
const SmsSettingsPage = lazy(() => import('../admin/pages/SmsSettingsPage'))
const PaymentsPage = lazy(() => import('../admin/pages/PaymentsPage'))

function AdminRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="packages" element={<Packages />} />
          <Route path="halls" element={<FunctionHalls />} />
          <Route path="halls/:id" element={<FunctionHallDetail />} />
          <Route path="addons" element={<Packages />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="beo" element={<BanquetEventOrderPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sms" element={<SmsSettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="orders" element={<Orders />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="customers" element={<Customers />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff-schedule" element={<EventStaffSchedulingPage />} />
          <Route path="messages" element={<Dashboard />} />
          <Route path="analytics" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AdminRoutes
