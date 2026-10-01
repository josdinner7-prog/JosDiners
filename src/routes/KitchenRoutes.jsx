import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import LoadingFallback from '../components/LoadingFallback'
import KitchenLayout from '../kitchen/layouts/KitchenLayout'
import ErrorBoundary from '../components/ErrorBoundary'

function KitchenRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<KitchenLayout />}>
            <Route index element={null} />
            <Route path="queue" element={null} />
            <Route path="beo" element={null} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default KitchenRoutes
