import React, { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import RiderLayout from '../rider/layouts/RiderLayout'

const RiderDashboard = lazy(() => import('../rider/pages/RiderDashboard'))
const RiderRequestsPage = lazy(() => import('../rider/pages/RiderRequestsPage'))
const RiderActiveDeliveryPage = lazy(() => import('../rider/pages/RiderActiveDeliveryPage'))
const RiderHistoryPage = lazy(() => import('../rider/pages/RiderHistoryPage'))
const RiderEarningsPage = lazy(() => import('../rider/pages/RiderEarningsPage'))
const RiderNotificationsPage = lazy(() => import('../rider/pages/RiderNotificationsPage'))
const RiderProfilePage = lazy(() => import('../rider/pages/RiderProfilePage'))

export default function RiderRoutes() {
  return (
    <Routes>
      <Route element={<RiderLayout />}>
        <Route index element={<RiderDashboard />} />
        <Route path="requests" element={<RiderRequestsPage />} />
        <Route path="active" element={<RiderActiveDeliveryPage />} />
        <Route path="history" element={<RiderHistoryPage />} />
        <Route path="earnings" element={<RiderEarningsPage />} />
        <Route path="notifications" element={<RiderNotificationsPage />} />
        <Route path="profile" element={<RiderProfilePage />} />
      </Route>
    </Routes>
  )
}
