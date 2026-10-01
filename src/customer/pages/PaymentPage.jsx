import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, useOutletContext, Link } from 'react-router-dom'
import api from '../../services/api'
import logo from '../../assets/logo.png'
import counterPaymentIcon from '../../assets/CounterPayment_icon.png'
import paymongoLogo from '../../assets/paymongo_logo.png'
import gcashIcon from '../../assets/Gcash_icon.png'
import mayaIcon from '../../assets/Maya_icon.png'
import LoadingFallback from '../../components/LoadingFallback'

// PayMongo Official Brand Badge Component
const PayMongoBadge = ({ compact = false }) => (
  <div className="inline-flex items-center gap-2 bg-[#0E1714] border border-[#00C389]/40 rounded-xl px-3 py-1.5 shadow-md">
    <img src={paymongoLogo} alt="PayMongo" className="h-5 sm:h-6 object-contain" />
    {!compact && (
      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 pl-2 border-l border-emerald-800/60 hidden sm:inline-block">
        Official Partner
      </span>
    )}
  </div>
)

function PaymentPage() {
  const { orderCode: paramCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const isDarkMode = outletContext.isDarkMode ?? false

  const queryParams = new URLSearchParams(location.search)
  const orderCode = paramCode || queryParams.get('order_code') || location.state?.orderCode || ''
  const intentIdParam = queryParams.get('intent_id') || queryParams.get('payment_intent_id')

  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(location.state?.method === 'counter' ? 'counter' : 'card') // 'card' | 'ewallet' | 'counter'

  // Card form state
  const [cardholderName, setCardholderName] = useState(order?.customer_name || '')
  const [cardNumber, setCardNumber] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState('')

  // E-Wallet state
  const [eWalletType, setEWalletType] = useState('gcash') // 'gcash' | 'paymaya'
  const [isEWalletLoading, setIsEWalletLoading] = useState(false)
  const [eWalletNotice, setEWalletNotice] = useState('')

  // Receipt / Success state
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [successCountdown, setSuccessCountdown] = useState(5)
  const [autoRedirectActive, setAutoRedirectActive] = useState(true)

  // Auto-redirect countdown on successful payment
  useEffect(() => {
    const isOrderPaid = order?.payment_status === 'paid' || paymentSuccess
    if (!isOrderPaid || !autoRedirectActive) return

    if (successCountdown <= 0) {
      try {
        window.close()
      } catch (e) {}
      navigate('/my-orders', { replace: true })
      return
    }

    const timer = setTimeout(() => {
      setSuccessCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [order?.payment_status, paymentSuccess, autoRedirectActive, successCountdown, navigate])

  // Fetch order data
  const loadOrder = async () => {
    // 1. Check if a pending online order was passed (not yet in database)
    let pending = location.state?.pendingOrder
    if (!pending) {
      try {
        const stored = sessionStorage.getItem('josdiner_pending_checkout')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (!orderCode || parsed.order_code === orderCode) {
            pending = parsed
          }
        }
      } catch (e) {}
    }

    if (pending) {
      setOrder(pending)
      if (!cardholderName && pending.customer_name) {
        setCardholderName(pending.customer_name)
      }
      setLoading(false)
      return
    }

    if (!orderCode) {
      setLoading(false)
      return
    }

    // 2. Otherwise load existing order from backend database
    try {
      setLoading(true)
      const res = await api.orders.getOrderByCode(orderCode)
      if (res && res.status === 'success' && res.order) {
        setOrder(res.order)
        if (!cardholderName && res.order.customer_name) {
          setCardholderName(res.order.customer_name)
        }
        if (res.order.payment_status === 'paid') {
          setPaymentSuccess(true)
          setPaymentDetails({
            paymentId: res.order.payment_id,
            paidAt: res.order.paid_at,
            method: res.order.payment_method
          })
        }
      } else {
        setError('Order not found. Please check your order reference code.')
      }
    } catch (err) {
      console.warn('Load order error:', err)
      setError('Unable to load order details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderCode])

  // Handle return from e-wallet authorization
  useEffect(() => {
    if (intentIdParam && orderCode) {
      const verify = async () => {
        try {
          setIsProcessing(true)
          const method = queryParams.get('method') || 'online'
          const res = await api.payments.verifyIntent(intentIdParam, orderCode, method)
          if (res && res.isPaid) {
            setPaymentSuccess(true)
            setPaymentDetails({
              paymentId: res.paymentId || intentIdParam,
              paidAt: new Date().toISOString(),
              method: method
            })
            loadOrder()
          }
        } catch (err) {
          console.warn('Intent verification error:', err)
        } finally {
          setIsProcessing(false)
        }
      }
      verify()
    }
  }, [intentIdParam, orderCode])

  // Card input formatting helpers
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 2) {
      setExpMonth(raw.slice(0, 2))
      setExpYear(raw.slice(2, 4))
    } else {
      setExpMonth(raw)
      setExpYear('')
    }
  }

  const getCardBrand = (num) => {
    const clean = String(num || '').replace(/\s+/g, '')
    if (clean.startsWith('4')) return 'VISA'
    if (clean.startsWith('5')) return 'MASTERCARD'
    if (clean.startsWith('35')) return 'JCB'
    return 'CARD'
  }

  // Quick 1-click test card filler
  const handleFillTestCard = () => {
    setCardNumber('4343 4343 4343 4345')
    setExpMonth('12')
    setExpYear('28')
    setCvc('123')
    setCardholderName(order?.customer_name || 'Valued Guest')
    setCardError('')
  }

  // Submit In-App Card Payment
  const handleCardSubmit = async (e) => {
    e.preventDefault()
    setCardError('')

    const cleanCard = cardNumber.replace(/\s+/g, '')
    if (cleanCard.length < 15) {
      setCardError('Please enter a valid card number.')
      return
    }
    if (!expMonth || !expYear) {
      setCardError('Please enter card expiration month and year.')
      return
    }
    if (!cvc || cvc.length < 3) {
      setCardError('Please enter the 3 or 4-digit CVC code.')
      return
    }

    setIsProcessing(true)

    try {
      const res = await api.payments.payCard({
        orderCode: order?.order_code || orderCode,
        amount: order?.grand_total || order?.total_amount || 0,
        cardNumber: cleanCard,
        expMonth: parseInt(expMonth, 10),
        expYear: parseInt(expYear, 10),
        cvc: cvc.trim(),
        cardholderName: cardholderName || order?.customer_name || 'Guest',
        email: order?.customer_email || 'guest@example.com',
        phone: order?.customer_phone || '',
        orderPayload: order
      })

      if (res && res.success && res.status === 'paid') {
        // Clear pending checkout session and local cart
        try {
          sessionStorage.removeItem('josdiner_pending_checkout')
          localStorage.removeItem('josdiner_cart')
          window.dispatchEvent(new Event('cartUpdated'))
        } catch (e) {}

        setPaymentSuccess(true)
        setPaymentDetails({
          paymentId: res.paymentId,
          paidAt: new Date().toISOString(),
          method: 'Card'
        })
        if (order) {
          setOrder({ ...order, payment_status: 'paid', payment_method: 'card' })
        }
      } else if (res && res.redirectUrl) {
        window.location.href = res.redirectUrl
      } else {
        setCardError(res?.message || 'Card payment declined. Please try another card.')
      }
    } catch (err) {
      console.error('Card payment error:', err)
      setCardError(err.message || 'Payment processing failed. Please check your card info.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Initialize E-Wallet Payment
  const handleEWalletPay = async () => {
    setIsEWalletLoading(true)
    setEWalletNotice('')

    try {
      const res = await api.payments.payEWallet({
        orderCode: order?.order_code || orderCode,
        amount: order?.grand_total || order?.total_amount || 0,
        type: eWalletType,
        customerName: order?.customer_name || 'Customer',
        customerEmail: order?.customer_email || 'customer@example.com',
        customerPhone: order?.customer_phone || '',
        orderPayload: order
      })

      if (res && res.redirectUrl) {
        const authWindow = window.open(res.redirectUrl, '_blank', 'width=500,height=700')
        setEWalletNotice(`Please complete authorization in the ${eWalletType.toUpperCase()} window. We will verify automatically!`)

        const intentId = res.paymentIntentId
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          if (attempts > 35) {
            clearInterval(interval)
            return
          }
          try {
            const check = await api.payments.verifyIntent(intentId, order?.order_code || orderCode, eWalletType, order)
            if (check && check.isPaid) {
              clearInterval(interval)
              if (authWindow && !authWindow.closed) authWindow.close()

              try {
                sessionStorage.removeItem('josdiner_pending_checkout')
                localStorage.removeItem('josdiner_cart')
                window.dispatchEvent(new Event('cartUpdated'))
              } catch (e) {}

              setPaymentSuccess(true)
              setPaymentDetails({
                paymentId: check.paymentId || intentId,
                paidAt: new Date().toISOString(),
                method: eWalletType.toUpperCase()
              })
              if (order) {
                setOrder({ ...order, payment_status: 'paid', payment_method: eWalletType })
              }
            }
          } catch (e) {}
        }, 3000)
      } else {
        setEWalletNotice('Unable to initialize e-wallet session. Please try card or counter.')
      }
    } catch (err) {
      console.error('E-Wallet error:', err)
      setEWalletNotice(err.message || 'Error connecting to e-wallet gateway.')
    } finally {
      setIsEWalletLoading(false)
    }
  }

  if (loading) {
    return <LoadingFallback message="Entering Secure Payment Portal..." />
  }

  if (error || !order) {
    return (
      <div className={`min-h-screen py-24 flex items-center justify-center px-4 transition-colors ${
        isDarkMode ? 'bg-[#040D21] text-white' : 'bg-slate-50 text-[#071A3D]'
      }`}>
        <div className={`max-w-lg w-full p-8 rounded-2xl border text-center space-y-5 shadow-2xl ${
          isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <span className="material-icons text-3xl">receipt_long</span>
          </div>
          <div>
            <h2 className="text-xl font-black">Order Not Found</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {error || 'No active food order was found matching this reference code.'}
            </p>
          </div>
          <div className="pt-2 flex gap-3 justify-center">
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-xl text-xs font-bold transition shadow"
            >
              Browse Menu
            </Link>
            <Link
              to="/my-orders"
              className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const grandTotal = parseFloat(order.grand_total || order.total_amount || 0)
  const isOrderPaid = order.payment_status === 'paid' || paymentSuccess

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0B141B] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* PAYMONGO FULLSCREEN SPLIT CHECKOUT CONTAINER */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">

        {/* LEFT COLUMN: MERCHANT BRAND & ORDER SUMMARY (5 COLS) */}
        <div className={`lg:col-span-5 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r flex flex-col justify-between transition-colors ${
          isDarkMode ? 'bg-[#0E1726] border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
        }`}>
          <div className="space-y-8 max-w-md mx-auto w-full">
            {/* Return / Back Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1)
                  } else {
                    navigate('/')
                  }
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group cursor-pointer"
              >
                <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span>Back</span>
              </button>
            </div>

            {/* Merchant Identity Block */}
            <div className="flex items-center gap-3.5">
              <img
                src={logo}
                alt="Jo's Diner"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
              />
              <div>
                <span className="text-[10.5px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  Paying Merchant
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                  Jo's Diner
                </h1>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                  Ref: {order.order_code || orderCode}
                </span>
              </div>
            </div>

            {/* Grand Total Amount Display */}
            <div className="py-4 border-y border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                Total Amount Due
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Itemized Order Tray Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Order Summary
                </span>
                <span className="text-[11px] text-slate-400">
                  {(order.items || []).length} { (order.items || []).length === 1 ? 'item' : 'items' }
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-[#C8102E] font-black">{item.quantity}x</span>
                        <span className="truncate text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      {item.special_instructions && (
                        <p className="text-[10.5px] text-amber-600 dark:text-amber-400 italic mt-0.5 truncate pl-4">
                          Note: "{item.special_instructions}"
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 shrink-0">
                      ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown Details */}
              <div className="pt-2 space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₱{(order.items || []).reduce((acc, it) => acc + (it.price * it.quantity), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {order.order_type === 'Takeout' && (
                  <div className="flex justify-between">
                    <span>Take-out Box:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₱25.00</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-bold text-slate-800 dark:text-slate-200">
                  <span>Dining Mode:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-800">
                    {order.order_type || 'Dine-In'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Security Note */}
          <div className="pt-8 max-w-md mx-auto w-full flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-sm text-emerald-500">lock</span>
              <span>256-bit SSL Encrypted</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase">
              Live Checkout
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: PAYMONGO OFFICIAL PAYMENT FORM (7 COLS) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-[#0B141B]">
          
          <div className="max-w-lg mx-auto w-full space-y-6">

            {/* PayMongo Header Branding */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#0E1714] px-3 py-1.5 rounded-xl border border-emerald-500/40 inline-flex items-center shadow-xs">
                  <img src={paymongoLogo} alt="PayMongo" className="h-4 sm:h-5 object-contain" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Checkout
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                <span className="material-icons text-sm text-emerald-500">verified_user</span>
                <span>PCI-DSS Certified</span>
              </div>
            </div>

            {/* SUCCESS VIEW OR PAYMENT FORM */}
            {isOrderPaid ? (
              /* PAYMENT CONFIRMED / SUCCESS SCREEN */
              <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce duration-1000">
                  <span className="material-icons text-5xl">check_circle</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
                    Payment Successful
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Your payment of <strong>₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> was received via PayMongo. Your order has been registered and is being prepared in the kitchen.
                  </p>
                </div>

                {/* Auto Redirect Countdown Notification */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-800">
                      {successCountdown}
                    </div>
                    <div>
                      <p className="font-extrabold text-emerald-950 dark:text-emerald-100 text-xs">
                        {autoRedirectActive ? (
                          <>Closing & redirecting to My Orders in <span className="text-emerald-700 dark:text-emerald-400 font-black">{successCountdown}s</span>...</>
                        ) : (
                          'Auto-redirect paused. Review details below.'
                        )}
                      </p>
                      <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">Order successfully transmitted to kitchen</p>
                    </div>
                  </div>
                  <div>
                    {autoRedirectActive ? (
                      <button
                        type="button"
                        onClick={() => setAutoRedirectActive(false)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                      >
                        Stay Here
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          try { window.close() } catch (e) {}
                          navigate('/my-orders', { replace: true })
                        }}
                        className="px-3 py-1 text-[11px] font-black text-white bg-[#C8102E] hover:bg-[#9B0B21] rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span>Go Now</span>
                        <span className="material-icons text-xs">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Receipt Card */}
                <div className={`p-5 rounded-2xl border text-left text-xs space-y-2.5 font-mono ${
                  isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans font-bold">Order Reference:</span>
                    <span className="font-extrabold text-[#C8102E]">{order.order_code || orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans font-bold">Payment Method:</span>
                    <span className="font-extrabold uppercase text-emerald-500">
                      PayMongo ({paymentDetails?.method || order.payment_method || 'Online'})
                    </span>
                  </div>
                  {paymentDetails?.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-bold">Transaction ID:</span>
                      <span className="text-[11px] truncate max-w-[200px] text-slate-700 dark:text-slate-300">{paymentDetails.paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black">
                    <span className="font-sans">Amount Paid:</span>
                    <span className="text-emerald-500 font-mono font-black text-lg">
                      ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Link
                    to="/my-orders"
                    className="w-full py-3.5 px-6 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span className="material-icons text-base">receipt_long</span>
                    <span>View Order Status in My Orders</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* PAYMONGO PAYMENT FORM */
              <div className="space-y-6">

                {/* Method Selector Tabs: Card | GCash | Maya */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    Pay with
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Card Option */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('card')}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        activeTab === 'card'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="material-icons text-xl">credit_card</span>
                      <span className="text-[11px] font-extrabold block leading-tight">Card</span>
                    </button>

                    {/* GCash Option */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('gcash')}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        activeTab === 'gcash'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <img src={gcashIcon} alt="GCash" className="w-5 h-5 object-contain" />
                      <span className="text-[11px] font-extrabold block leading-tight">GCash</span>
                    </button>

                    {/* Maya Option */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('maya')}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        activeTab === 'maya'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <img src={mayaIcon} alt="Maya" className="w-5 h-5 object-contain" />
                      <span className="text-[11px] font-extrabold block leading-tight">Maya</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: CREDIT / DEBIT CARD */}
                {activeTab === 'card' && (
                  <div className="space-y-4 pt-1">
                    
                    {/* Auto-fill test card helper */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Card Information
                      </span>
                      <button
                        type="button"
                        onClick={handleFillTestCard}
                        className="text-[11px] font-extrabold bg-[#00C389]/10 hover:bg-[#00C389]/20 text-[#00875A] dark:text-[#00C389] border border-[#00C389]/30 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🧪 Fill Test Card (4343...)</span>
                      </button>
                    </div>

                    {cardError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                        <span className="material-icons text-base shrink-0">error_outline</span>
                        <span>{cardError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCardSubmit} className="space-y-3.5 text-xs">
                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={order?.customer_email || 'guest@example.com'}
                          onChange={() => {}}
                          placeholder="your.email@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4343 4343 4343 4345"
                            maxLength="19"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                          />
                          <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-slate-400">
                            <span className="text-[11px] font-bold uppercase text-[#00C389]">{getCardBrand(cardNumber)}</span>
                            <span className="material-icons text-base">credit_card</span>
                          </div>
                        </div>
                      </div>

                      {/* Expiry & CVC Split */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Expiration (MM / YY)
                          </label>
                          <input
                            type="text"
                            required
                            value={expMonth ? `${expMonth} / ${expYear}` : ''}
                            onChange={handleExpiryChange}
                            placeholder="12 / 28"
                            maxLength="7"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            CVC
                          </label>
                          <input
                            type="password"
                            required
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.slice(0, 4))}
                            placeholder="123"
                            maxLength="4"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          required
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="Juan Dela Cruz"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                      </div>

                      {/* Submit Pay Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full py-3.5 px-6 rounded-xl bg-[#00C389] hover:bg-[#00AB78] text-slate-950 font-black text-sm shadow-lg transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? (
                            <>
                              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                              <span>Authorizing with PayMongo...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-base">lock</span>
                              <span>Pay ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 2 & 3: GCASH / MAYA E-WALLETS */}
                {(activeTab === 'gcash' || activeTab === 'maya') && (
                  <div className="space-y-4 pt-1 text-xs">
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={activeTab === 'gcash' ? gcashIcon : mayaIcon}
                          alt={activeTab.toUpperCase()}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="font-extrabold text-sm">
                          Pay with {activeTab === 'gcash' ? 'GCash' : 'Maya'}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        You will be prompted to approve the transaction via {activeTab === 'gcash' ? 'GCash' : 'Maya'}. Once verified by PayMongo, your order is automatically placed and sent to the kitchen.
                      </p>
                    </div>

                    {eWalletNotice && (
                      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
                        <span className="material-icons text-base text-blue-600 animate-spin">refresh</span>
                        <span>{eWalletNotice}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEWalletType(activeTab === 'gcash' ? 'gcash' : 'paymaya')
                        handleEWalletPay()
                      }}
                      disabled={isEWalletLoading}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#00C389] hover:bg-[#00AB78] text-slate-950 font-black text-sm shadow-lg transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isEWalletLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                          <span>Connecting to PayMongo...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-base">phonelink_ring</span>
                          <span>Pay ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} with {activeTab === 'gcash' ? 'GCash' : 'Maya'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right Pane Footer */}
          <div className="pt-8 max-w-lg mx-auto w-full border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <img src={paymongoLogo} alt="PayMongo" className="h-3.5 object-contain bg-[#0E1714] px-1.5 py-0.5 rounded" />
              <span>Powered by <strong>PayMongo</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hover:underline cursor-pointer">Terms</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default PaymentPage
