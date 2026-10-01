import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import ProtectedRoute from './ProtectedRoute'
import LoadingFallback from '../components/LoadingFallback'

const RoleLogin = lazy(() => import('../auth/RoleLogin'))
const RiderLoginPage = lazy(() => import('../rider/pages/RiderLoginPage'))
const RiderRoutes = lazy(() => import('./RiderRoutes'))
const AdminRoutes = lazy(() => import('./AdminRoutes'))
const StaffRoutes = lazy(() => import('./StaffRoutes'))
const KitchenRoutes = lazy(() => import('./KitchenRoutes'))
const CustomerRoutes = lazy(() => import('./CustomerRoutes'))

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Management Role Login */}
        <Route path="/Rolelogin" element={<RoleLogin />} />

        {/* Dedicated Mobile Rider Login */}
        <Route path="/rider/login" element={<RiderLoginPage />} />

        {/* Delivery Rider Mobile Application */}
        <Route
          path="/rider/*"
          element={
            <ProtectedRoute allowedRoles={['rider', 'admin', 'staff']}>
              <RiderRoutes />
            </ProtectedRoute>
          }
        />

        {/* Admin Executive Portal */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        {/* Staff POS Portal */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['staff', 'cashier', 'waiter']}>
              <StaffRoutes />
            </ProtectedRoute>
          }
        />

        {/* Kitchen KDS Terminal */}
        <Route
          path="/kitchen/*"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'chef', 'admin', 'staff']}>
              <KitchenRoutes />
            </ProtectedRoute>
          }
        />

        {/* Customer Main Web Portal or Native Rider Boot */}
        <Route
          path="/*"
          element={
            Capacitor.isNativePlatform() ? (
              <Navigate to="/rider" replace />
            ) : (
              <CustomerRoutes />
            )
          }
        />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
