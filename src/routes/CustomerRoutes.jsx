import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import CustomerLayout from '../customer/layouts/CustomerLayout'
import LoadingFallback from '../components/LoadingFallback'

const CustomerHome = lazy(() => import('../customer/pages/CustomerHome'))
const Menu = lazy(() => import('../customer/pages/Menu'))
const DishDetailPage = lazy(() => import('../customer/pages/DishDetailPage'))
const CateringPage = lazy(() => import('../customer/pages/CateringPage'))
const FunctionHallPage = lazy(() => import('../customer/pages/FunctionHallPage'))
const FunctionHallDetailPage = lazy(() => import('../customer/pages/FunctionHallDetailPage'))
const FunctionHallAvailabilityPage = lazy(() => import('../customer/pages/FunctionHallAvailabilityPage'))
const Reservation = lazy(() => import('../customer/pages/Reservation'))
const MyEventsPage = lazy(() => import('../customer/pages/MyEventsPage'))
const MyReservationsPage = lazy(() => import('../customer/pages/MyReservationsPage'))
const MyOrdersPage = lazy(() => import('../customer/pages/MyOrdersPage'))
const NotificationsPage = lazy(() => import('../customer/pages/NotificationsPage'))
const ProfilePage = lazy(() => import('../customer/pages/ProfilePage'))
const BudgetMenuPage = lazy(() => import('../customer/pages/BudgetMenuPage'))
const Login = lazy(() => import('../customer/pages/Login'))
const Register = lazy(() => import('../customer/pages/Register'))
const PaymentPage = lazy(() => import('../customer/pages/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('../customer/pages/PaymentSuccessPage'))
const DownloadAppPage = lazy(() => import('../customer/pages/DownloadAppPage'))

function CustomerRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* STANDALONE PAYMONGO RETURN / SUCCESS PAGES (OUTSIDE DINER SYSTEM LAYOUT) */}
        <Route path="checkout/success" element={<PaymentSuccessPage />} />
        <Route path="payment/success" element={<PaymentSuccessPage />} />

        {/* STANDALONE PAYMENT / CHECKOUT PAGES */}
        <Route path="payment/:orderCode" element={<PaymentPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="checkout/:orderCode" element={<PaymentPage />} />
        <Route path="checkout" element={<PaymentPage />} />

        {/* CUSTOMER PORTAL PAGES (WITH DINER SYSTEM HEADER & FOOTER) */}
        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerHome />} />
          <Route path="menu" element={<Menu />} />
          <Route path="dish/:id" element={<DishDetailPage />} />
          <Route path="budget-menu" element={<BudgetMenuPage />} />
          <Route path="budget-planner" element={<BudgetMenuPage />} />
          <Route path="catering" element={<CateringPage />} />
          <Route path="function-halls" element={<FunctionHallPage />} />
          <Route path="function-hall/:id" element={<FunctionHallDetailPage />} />
          <Route path="function-hall/:id/availability" element={<FunctionHallAvailabilityPage />} />
          <Route path="reservation" element={<Reservation />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="my-reservations" element={<MyReservationsPage />} />
          <Route path="my-orders" element={<MyOrdersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="download" element={<DownloadAppPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default CustomerRoutes
