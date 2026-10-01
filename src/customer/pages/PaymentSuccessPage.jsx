import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import logo from '../../assets/logo.png'
import paymongoLogo from '../../assets/paymongo_logo.png'
import LoadingFallback from '../../components/LoadingFallback'

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const orderCodeFromParam = searchParams.get('order_code') || searchParams.get('orderCode') || ''
  const sessionIdFromParam = searchParams.get('session_id') || searchParams.get('sessionId') || ''

  const [loading, setLoading] = useState(true)
  const [isVerifiedPaid, setIsVerifiedPaid] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')

  const [countdown, setCountdown] = useState(5)
  const [autoRedirectActive, setAutoRedirectActive] = useState(true)

  const handleRedirect = () => {
    try {
      window.close()
    } catch (e) {
      console.warn('Window close blocked by browser:', e)
    }
    const isReservation = (orderCodeFromParam || '').startsWith('TAB-') || (orderCodeFromParam || '').startsWith('RES-') || searchParams.get('type') === 'table'
    navigate(isReservation ? '/my-reservations' : '/my-orders', { replace: true })
  }

  // Auto-redirect countdown effect
  useEffect(() => {
    if (!isVerifiedPaid || !autoRedirectActive) return

    if (countdown <= 0) {
      handleRedirect()
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isVerifiedPaid, autoRedirectActive, countdown])

  useEffect(() => {
    let isMounted = true

    async function verifyPayment() {
      try {
        setLoading(true)
        setError(null)

        const effectiveOrderCode = orderCodeFromParam || localStorage.getItem('josdiner_pending_order_code') || ''
        let effectiveSessionId = sessionIdFromParam || localStorage.getItem('josdiner_pending_session_id') || ''

        // 1. If we don't have sessionId, ask backend for the session associated with this orderCode
        if (!effectiveSessionId && effectiveOrderCode) {
          try {
            const sessionLookup = await api.payments.getOrderSession(effectiveOrderCode)
            if (sessionLookup?.sessionId) {
              effectiveSessionId = sessionLookup.sessionId
            }
          } catch (e) {
            console.warn('Could not query order-session lookup:', e)
          }
        }

        // 2. Retrieve pending order payload from localStorage if not yet in database
        let pendingPayload = null
        try {
          const raw = localStorage.getItem(`josdiner_pending_checkout_${effectiveOrderCode}`) || sessionStorage.getItem('josdiner_pending_checkout')
          if (raw) pendingPayload = JSON.parse(raw)
        } catch (e) {
          console.warn('Could not parse pending order payload:', e)
        }

        // 3. Verify session with backend PayMongo API
        if (effectiveSessionId) {
          const res = await api.payments.verifyCheckoutSession(effectiveSessionId, effectiveOrderCode, pendingPayload)

          if (res?.isPaid) {
            if (!isMounted) return
            setIsVerifiedPaid(true)
            setOrder(res.order || pendingPayload || { order_code: effectiveOrderCode, grand_total: res.session?.amount || 0 })
            
            // Clear customer cart since payment succeeded
            localStorage.removeItem('josdiner_cart')
            localStorage.removeItem('cart')
            window.dispatchEvent(new Event('josdiner_cart_updated'))
            window.dispatchEvent(new Event('storage'))

            // Clean up pending storage keys
            if (effectiveOrderCode) {
              localStorage.removeItem(`josdiner_pending_checkout_${effectiveOrderCode}`)
            }
            localStorage.removeItem('josdiner_pending_order_code')
            localStorage.removeItem('josdiner_pending_session_id')
            sessionStorage.removeItem('josdiner_pending_checkout')
            return
          } else {
            // Not paid yet
            if (res?.session?.checkoutUrl) {
              setCheckoutUrl(res.session.checkoutUrl)
            }
            setIsVerifiedPaid(false)
            setOrder(pendingPayload || { order_code: effectiveOrderCode })
            return
          }
        }

        // 4. Fallback: check if order already exists in DB
        if (effectiveOrderCode) {
          const orderRes = await api.orders.getOrderByCode(effectiveOrderCode)
          const fetched = orderRes?.order || orderRes
          if (fetched && (fetched.payment_status === 'paid' || fetched.order_code)) {
            if (!isMounted) return
            setIsVerifiedPaid(fetched.payment_status === 'paid')
            setOrder(fetched)
            return
          }
        }

        if (pendingPayload) {
          setOrder(pendingPayload)
        }
      } catch (err) {
        console.error('[Payment Verification Error]', err)
        if (isMounted) setError(err.message || 'Unable to confirm payment status')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verifyPayment()

    return () => {
      isMounted = false
    }
  }, [orderCodeFromParam, sessionIdFromParam])

  const orderItems = order?.items || (typeof order?.items_json === 'string' ? JSON.parse(order.items_json || '[]') : order?.items_json) || []
  const orderTotal = parseFloat(order?.grand_total || order?.total_amount || 0)

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#071A3D] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans">
      {/* Top Navbar Brand Line */}
      <div className="w-full max-w-lg flex items-center justify-between pb-4">
        <Link to="/menu" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#C8102E] transition">
          <span className="material-icons text-sm">arrow_back</span>
          <span>Back to Menu</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 bg-[#0E1714] border border-[#00C389]/40 rounded-lg px-2.5 py-1">
          <img src={paymongoLogo} alt="PayMongo" className="h-4 object-contain" />
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 pl-1 border-l border-emerald-800">
            Official Checkout
          </span>
        </div>
      </div>

      {loading ? (
        <div className="w-full max-w-lg">
          <LoadingFallback message="Verifying PayMongo Payment..." />
        </div>
      ) : isVerifiedPaid ? (
        /* OFFICIAL VERIFIED PAYMENT RECEIPT SLIP */
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-sm shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Success Banner */}
          <div className="bg-emerald-600 text-white p-3 text-center flex items-center justify-center gap-2 font-sans font-black text-xs uppercase tracking-wider shadow-inner">
            <span className="material-icons text-base">verified</span>
            <span>Payment Succeeded via PayMongo</span>
          </div>

          {/* Live Countdown & Auto-Redirect Bar */}
          <div className="bg-emerald-50/90 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-800">
                {countdown}
              </div>
              <div className="text-left">
                <p className="font-bold text-[11.5px] sm:text-xs leading-tight text-emerald-950 dark:text-emerald-100">
                  {autoRedirectActive ? (
                    <>
                      Closing & redirecting in <span className="text-emerald-700 dark:text-emerald-400 font-black">{countdown}s</span> to My Orders...
                    </>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">Auto-redirect paused. You can review or print your slip below.</span>
                  )}
                </p>
                <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">Order verified & transmitted to kitchen</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {autoRedirectActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAutoRedirectActive(false)}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition border border-gray-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                  >
                    Stay on Slip
                  </button>
                  <button
                    type="button"
                    onClick={handleRedirect}
                    className="px-3 py-1 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Go Now</span>
                    <span className="material-icons text-xs">arrow_forward</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleRedirect}
                  className="px-3 py-1 text-[10px] font-black text-white bg-[#C8102E] hover:bg-[#9B0B21] rounded transition shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>Go to My Orders</span>
                  <span className="material-icons text-xs">arrow_forward</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-4">
            
            {/* Header / Brand Logo */}
            <div className="text-center pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src={logo} alt="Jo's Diner" className="h-12 object-contain" />
                <span className="font-black text-lg tracking-tight font-sans text-gray-900 dark:text-white">JO'S DINER</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-sans font-bold">
                Online Payment Settlement Slip
              </p>
              <p className="text-[9px] text-gray-400 font-sans">Kitchen Express Order • Dine-In / Takeout Counter</p>

              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>PAID & TRANSMITTED TO KITCHEN</span>
                </span>
              </div>
            </div>

            {/* Scannable Order Code */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-sm border border-gray-200 dark:border-slate-700 text-center space-y-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block font-sans">
                Official Order Reference Code
              </span>
              <span className="text-2xl font-black tracking-widest text-[#C8102E] block select-all">
                {order?.order_code || orderCodeFromParam}
              </span>

              {/* Barcode Graphic */}
              <div className="pt-1.5 flex flex-col items-center justify-center gap-1 opacity-80">
                <div className="flex items-center gap-[2px] h-7">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 4, 1, 3, 2].map((w, i) => (
                    <span
                      key={i}
                      className="bg-gray-800 dark:bg-gray-200 h-full rounded-xs inline-block"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="text-[8.5px] tracking-widest text-gray-400 font-sans">
                  *{order?.order_code || orderCodeFromParam}*
                </span>
              </div>
            </div>

            {/* Important Customer Notice Alert */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/70 rounded-sm font-sans flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200">
              <span className="material-icons text-emerald-600 dark:text-emerald-400 text-lg shrink-0 mt-0.5">restaurant</span>
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">Your dishes are being prepared now!</span>
                <span>Please present this receipt slip or order code to the diner counter when collecting your food.</span>
              </div>
            </div>

            {/* Customer & Dining Details */}
            <div className="space-y-1.5 py-1 text-[11px] border-b-2 border-dashed border-gray-300 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-gray-400 font-sans">Customer Name:</span>
                <span className="font-bold">{order?.customer_name || 'Guest'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-sans">Dining Option:</span>
                <span className="font-black uppercase px-2 py-0.5 rounded text-[10px] bg-red-100 text-[#C8102E] dark:bg-red-950/60 dark:text-red-400 font-sans">
                  {order?.order_type || 'Dine-In'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-sans">Payment Method:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">PayMongo Online (Paid)</span>
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="space-y-2 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
              <div className="flex justify-between text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans">
                <span>Qty & Description</span>
                <span>Amount</span>
              </div>

              <div className="space-y-1.5 pt-0.5 max-h-44 overflow-y-auto">
                {orderItems.length > 0 ? (
                  orderItems.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] items-start gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          <span className="text-[#C8102E] font-black mr-1">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="font-extrabold shrink-0">
                          ₱{((parseFloat(item.price || 0)) * (parseInt(item.quantity || 1, 10))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {item.special_instructions && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic pl-4 font-sans">
                          * Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold">Online Order Items</span>
                    <span className="font-extrabold">₱{orderTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Paid */}
            <div className="space-y-1.5 pb-2 border-b-2 border-dashed border-gray-300 dark:border-slate-700 text-xs">
              <div className="flex justify-between items-baseline pt-1 text-sm font-black font-sans">
                <span className="uppercase tracking-wider text-gray-900 dark:text-white">Total Amount Paid:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₱{orderTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 font-extrabold text-xs text-gray-800 dark:text-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-icons text-sm">print</span>
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-orders')}
                className="flex-1 py-2.5 px-3 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-sm text-xs font-black text-center transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-icons text-sm">receipt</span>
                <span>View in My Orders</span>
              </button>
            </div>

          </div>

          {/* Bottom Perforated Edge */}
          <div className="h-1.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent border-t border-dashed border-gray-300 dark:border-slate-700"></div>
        </div>
      ) : (
        /* PAYMENT PENDING OR CANCELLED */
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-xl p-6 sm:p-8 text-center space-y-4 font-sans">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-400 text-amber-600 mx-auto flex items-center justify-center">
            <span className="material-icons text-2xl">pending</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
              Payment Incomplete or Awaiting Confirmation
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your payment has not yet been completed on PayMongo. Your items are safe in your order tray.
            </p>
          </div>

          {checkoutUrl && (
            <a
              href={checkoutUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-sm shadow-md transition"
            >
              <span>Resume PayMongo Checkout</span>
              <span className="material-icons text-sm">open_in_new</span>
            </a>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/menu')}
              className="flex-1 py-2 px-3 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold rounded-sm transition"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentSuccessPage
