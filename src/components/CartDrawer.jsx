import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cartIcon from '../assets/Cart_icon.png'
import emptyTrayIcon from '../assets/EmptyTray_icon.png'
import logo from '../assets/logo.png'
import api from '../services/api'
import { useToast } from './ToastNotification'

function CartDrawer({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, onClearCart, isDarkMode }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [diningOption, setDiningOption] = useState('dine_in') // 'dine_in' | 'take_out' | 'delivery'
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod') // 'cod' | 'online'
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderRef, setOrderRef] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [counterReceiptOrder, setCounterReceiptOrder] = useState(null)

  const handleBrowseMenu = () => {
    if (onClose) onClose()
    navigate('/menu')
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      try {
        const savedUser = localStorage.getItem('josdiner_customer_user')
        if (savedUser) {
          const u = JSON.parse(savedUser)
          if (u?.phone && !contactPhone) setContactPhone(u.phone)
          if (u?.address && !deliveryAddress) setDeliveryAddress(u.address)
        }
      } catch (e) {}
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = cartItems.reduce((acc, item) => acc + item.finalPrice, 0)
  const packagingFee = diningOption === 'take_out' ? 25 : 0
  const deliveryFee = diningOption === 'delivery' ? 49 : 0
  const grandTotal = subtotal + packagingFee + deliveryFee

  const handleOpenReview = () => {
    if (diningOption === 'delivery') {
      if (!deliveryAddress.trim()) {
        if (showToast) showToast('Please enter your complete delivery address to proceed.', 'warning')
        else alert('Please enter your complete delivery address to proceed.')
        return
      }
      if (!contactPhone.trim()) {
        if (showToast) showToast('Please provide a contact phone number for the delivery rider.', 'warning')
        else alert('Please provide a contact phone number for the delivery rider.')
        return
      }
    }
    setShowConfirmModal(true)
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    const generatedRef = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    setOrderRef(generatedRef)

    try {
      const savedUser = localStorage.getItem('josdiner_customer_user')
      const user = savedUser ? JSON.parse(savedUser) : null

      const finalPhone = contactPhone || user?.phone || ''
      const isOnline = paymentMethod === 'online'
      const isDelivery = diningOption === 'delivery'

      const orderPayload = {
        order_code: generatedRef,
        customer_name: user?.full_name || 'Customer',
        customer_email: user?.email || null,
        customer_phone: finalPhone,
        user_id: user?.user_id || null,
        delivery_address: isDelivery ? deliveryAddress.trim() : (diningOption === 'take_out' ? 'Takeout Counter' : 'Dine-in Table'),
        order_type: isDelivery ? 'Delivery' : (diningOption === 'take_out' ? 'Takeout' : 'Dine-in'),
        table_number: isDelivery ? 'Delivery (Rider Dispatch)' : 'Pickup Counter',
        delivery_fee: deliveryFee,
        delivery_notes: isDelivery ? deliveryNotes.trim() : null,
        grand_total: grandTotal,
        total_amount: grandTotal,
        status: 'New',
        payment_method: isOnline ? 'online' : (isDelivery ? 'cod' : 'counter'),
        payment_status: 'unpaid',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.finalPrice / item.quantity,
          special_instructions: item.specialInstructions || ''
        }))
      }

      if (isOnline) {
        // ONLINE PAYMENT: DO NOT SAVE IN DATABASE YET!
        // Save pending order in localStorage & sessionStorage so it is accessible on checkout page
        localStorage.setItem(`josdiner_pending_checkout_${generatedRef}`, JSON.stringify(orderPayload))
        localStorage.setItem('josdiner_pending_order_code', generatedRef)
        sessionStorage.setItem('josdiner_pending_checkout', JSON.stringify(orderPayload))

        setShowConfirmModal(false)
        if (onClose) onClose()

        // Navigate directly to our standalone PayMongo-styled Checkout page (outside the diner layout)
        navigate(`/payment/${generatedRef}`, {
          state: {
            order: orderPayload,
            pendingOrder: orderPayload,
            orderCode: generatedRef,
            isPendingOnline: true,
            method: 'card'
          }
        })
      } else {
        // OVER THE COUNTER: CREATE ORDER IN DATABASE, DO NOT REDIRECT TO CHECKOUT!
        const orderRes = await api.orders.createOrder(orderPayload)
        const createdOrder = orderRes?.order || { ...orderPayload, order_code: generatedRef }

        // Clear cart and show receipt modal right in place
        if (onClearCart) onClearCart()
        setShowConfirmModal(false)
        setCounterReceiptOrder(createdOrder)

        if (showToast) {
          showToast('Order confirmed! Please proceed to the cashier counter to settle payment.', 'success', 5000)
        }
      }
    } catch (e) {
      console.warn('Checkout error:', e)
      if (showToast) {
        showToast(e.message || 'Failed to place order. Please try again.', 'error')
      } else {
        alert(e.message || 'Failed to place order. Please try again.')
      }
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 transition-opacity animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className={`w-screen max-w-md shadow-2xl flex flex-col justify-between border-l transition-colors duration-300 animate-in slide-in-from-right duration-300 ${
          isDarkMode 
            ? 'bg-[#071A3D] border-slate-700 text-white' 
            : 'bg-white border-gray-300 text-[#071A3D]'
        }`}>
          
          {/* Drawer Header with Navigation Brand Font Style */}
          <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
          }`}>
            <div className="flex items-center gap-3">
              <img 
                src={cartIcon} 
                alt="Cart" 
                className={`w-8 h-8 object-contain shrink-0 ${isDarkMode ? 'brightness-120' : ''}`} 
              />
              <div className="flex flex-col justify-center leading-none">
                <div className="flex items-center gap-2">
                  <h2 className="jos-diner-brand-title text-sm sm:text-base font-black leading-none tracking-wide text-left">
                    YOUR ORDER TRAY
                  </h2>
                  {itemCount > 0 && (
                    <span className="bg-[#F59E0B] text-[#071A3D] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                      {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                    </span>
                  )}
                </div>
                <span className="text-[6.5px] sm:text-[7.5px] font-bold text-gray-500 dark:text-gray-400 tracking-widest flex items-center gap-1 mt-1 leading-none uppercase">
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                  <span className="whitespace-nowrap">Food & Beverage Tray</span>
                  <span className="h-[1px] w-1.5 bg-[#C8102E] rounded-full inline-block shrink-0"></span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {cartItems.length > 0 && !orderPlaced && (
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-gray-400 hover:text-red-500 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  title="Clear Tray"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>
          </div>

          {orderPlaced ? (
            /* Order Success Screen */
            <div className="p-6 text-center my-auto space-y-4 flex-1 flex flex-col justify-center overflow-y-auto">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <span className="material-icons text-3xl">check_circle</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Order Confirmed
                </span>
                <h3 className={`text-xl font-black mt-1.5 ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                  Order Received!
                </h3>
                <p className={`text-xs leading-relaxed mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Thank you for ordering! Your reference code is:
                </p>
              </div>

              <div className="bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-lg p-2.5 inline-block mx-auto">
                <span className="text-lg font-black font-mono tracking-widest text-[#C8102E]">{orderRef}</span>
              </div>

              <div className={`p-3.5 rounded-lg text-xs text-left space-y-1.5 border ${
                isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex justify-between items-center pb-1.5 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-400">Dining Option:</span>
                  <span className="font-bold text-[#C8102E] uppercase">{diningOption === 'dine_in' ? 'Dine-In' : 'Take-Out'}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="font-bold uppercase">{paymentMethod === 'cod' ? 'Cash / Counter' : 'Online Payment'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Estimated Prep Time:</span>
                  <span className="font-extrabold text-emerald-500">15 - 25 Minutes</span>
                </div>
              </div>

              {/* Payment Notice */}
              {paymentMethod === 'cod' ? (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-medium text-left">
                  <span className="material-icons text-amber-600 dark:text-amber-400 text-lg shrink-0">payments</span>
                  <span><strong>Payment at Counter Required:</strong> Please proceed to the cashier counter to pay <strong>₱{grandTotal.toLocaleString()}</strong>. The kitchen will begin cooking once the staff accepts your order.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium text-left">
                  <span className="material-icons text-emerald-600 dark:text-emerald-400 text-lg shrink-0">verified</span>
                  <span><strong>Online Payment Authorized:</strong> Your payment was processed via PayMongo. Our kitchen will start preparation shortly!</span>
                </div>
              )}

              {/* Real-time notification notice */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-medium text-left">
                <span className="material-icons text-slate-500 text-base shrink-0">notifications_active</span>
                <span>You will receive live status updates via <strong>SMS & Notification Center</strong> when your food is cooking and ready!</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderPlaced(false)
                  if (onClose) onClose()
                  navigate('/menu')
                }}
                className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-2.5 rounded-lg font-extrabold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Back to Food Menu</span>
                <span className="material-icons text-sm">restaurant_menu</span>
              </button>
            </div>
          ) : (
            <>
              {/* Dine-In / Take-Out / Delivery Option Selector Bar */}
              {cartItems.length > 0 && (
                <div className={`px-4 py-2.5 border-b shrink-0 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">Order Option:</span>
                    <div className="flex-1 flex gap-1 bg-gray-200 dark:bg-slate-950 p-1 rounded-lg border border-gray-300 dark:border-slate-800">
                      <button
                        onClick={() => setDiningOption('dine_in')}
                        className={`flex-1 py-1.5 px-2 rounded text-xs font-extrabold transition flex items-center justify-center ${
                          diningOption === 'dine_in'
                            ? 'bg-[#C8102E] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Dine-In
                      </button>

                      <button
                        onClick={() => setDiningOption('take_out')}
                        className={`flex-1 py-1.5 px-2 rounded text-xs font-extrabold transition flex items-center justify-center ${
                          diningOption === 'take_out'
                            ? 'bg-[#C8102E] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Take-Out
                      </button>

                      <button
                        onClick={() => setDiningOption('delivery')}
                        className={`flex-1 py-1.5 px-2 rounded text-xs font-extrabold transition flex items-center justify-center gap-1 ${
                          diningOption === 'delivery'
                            ? 'bg-[#C8102E] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Delivery</span>
                        <span className="text-[11px]">🛵</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Text-Only Compact Item List */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 divide-y ${
                isDarkMode ? 'divide-slate-700/60' : 'divide-gray-200/80'
              }`}>
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3 my-auto flex flex-col items-center justify-center">
                    <div className="w-36 h-36 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
                      <img src={emptyTrayIcon} alt="Empty Order Tray Icon" className="w-full h-full object-contain block" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                        Your Order Tray is Empty
                      </h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                        Explore our menu of savory dishes, party trays, and bentos to build your tray!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBrowseMenu}
                      className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:shadow-md transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-icons text-sm">restaurant_menu</span>
                      <span>Browse Menu Items</span>
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} className="pt-3 first:pt-0 space-y-1.5 group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-bold text-xs leading-snug ${
                            isDarkMode ? 'text-white' : 'text-[#071A3D]'
                          }`}>{item.name}</h4>
                          
                          {item.selectedOption && (
                            <span className="inline-block text-[10px] text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 mt-0.5">
                              {item.selectedOption.name}
                            </span>
                          )}

                          {item.customDishes && item.customDishes.length > 0 && (
                            <div className="mt-1 space-y-1">
                              <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                                Selected Dishes ({item.customDishes.length}):
                              </span>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {item.customDishes.map((dish, dIdx) => {
                                  const isExtra = dIdx >= (item.totalAllowedDishes || 5)
                                  return (
                                    <span
                                      key={dIdx}
                                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                                        isExtra
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                          : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                      }`}
                                    >
                                      {dish.name || dish.dish_name}
                                      {isExtra && ` (+₱${parseFloat(dish.price || 0).toLocaleString()})`}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {item.specialInstructions && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded italic border border-amber-200 dark:border-amber-800/60 mt-0.5 truncate">
                              "{item.specialInstructions}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveItem(index)}
                          className="text-gray-400 hover:text-red-500 transition p-0.5"
                          title="Remove item"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        {/* Stepper Quantity Button */}
                        <div className={`flex items-center border rounded-lg overflow-hidden ${
                          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-slate-800 transition font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-extrabold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:bg-gray-200 dark:hover:bg-slate-800 transition font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-extrabold text-xs text-[#C8102E] font-mono">
                          ₱{item.finalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Compact Cart Footer Summary & Checkout */}
              {cartItems.length > 0 && (
                <div className={`p-4 border-t space-y-3 shrink-0 ${
                  isDarkMode ? 'bg-[#040D21] border-slate-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  {/* Dining Details / Delivery Address / SMS Alerts */}
                  <div className="space-y-2 pb-2.5 border-b border-gray-200 dark:border-slate-700/80">
                    {diningOption === 'delivery' ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between pb-0.5">
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-xs text-[#C8102E]">location_on</span>
                              <span>Delivery Address:</span>
                            </span>
                            <span className="text-[10px] text-[#C8102E] font-extrabold">*Required</span>
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="House #, Street, Barangay, City..."
                            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 pb-0.5">
                            <span className="material-icons text-xs text-amber-500">pin_drop</span>
                            <span>Landmark / Rider Notes (Optional):</span>
                          </label>
                          <input
                            type="text"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="e.g. Near Barangay Hall, Green Gate..."
                            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-xs text-amber-500">phone</span>
                            <span>Recipient Mobile #:</span>
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="09XXXXXXXXX"
                            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right w-36 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                          />
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="material-icons text-[11px] text-emerald-500">two_wheeler</span>
                          <span>Flat ₱49 express rider dispatch fee to your doorstep.</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="material-icons text-xs text-amber-500">sms</span>
                            <span>SMS Pickup Alerts:</span>
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="09XXXXXXXXX"
                            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right w-36 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="material-icons text-[11px] text-gray-400">countertops</span>
                          <span>Self-pickup at counter for both Dine-In and Take-Out.</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Payment:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                          paymentMethod === 'cod'
                            ? 'bg-[#071A3D] text-white border-[#071A3D] dark:bg-white dark:text-[#071A3D]'
                            : 'text-gray-500 border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        {diningOption === 'delivery' ? 'Cash on Delivery' : 'Cash / Counter'}
                      </button>
                      <button
                        onClick={() => setPaymentMethod('online')}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition ${
                          paymentMethod === 'online'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-500 border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        Online Payment
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className={`space-y-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className={`font-semibold font-mono ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₱{subtotal.toLocaleString()}</span>
                    </div>
                    {diningOption === 'take_out' && (
                      <div className="flex justify-between">
                        <span>Take-Out Packaging Box</span>
                        <span className="font-mono">₱25</span>
                      </div>
                    )}
                    {diningOption === 'delivery' && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-[12px]">two_wheeler</span>
                          <span>Delivery Fee (Rider Dispatch)</span>
                        </span>
                        <span className="font-mono font-bold">₱49</span>
                      </div>
                    )}
                    
                    <div className={`flex justify-between pt-1.5 border-t text-sm font-extrabold ${
                      isDarkMode ? 'border-slate-700 text-white' : 'border-gray-300 text-[#071A3D]'
                    }`}>
                      <span>Grand Total</span>
                      <span className="text-[#C8102E] text-base font-black font-mono">₱{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Compact Checkout CTA */}
                  <button
                    onClick={handleOpenReview}
                    disabled={isCheckingOut || cartItems.length === 0}
                    className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-[#C8102E] hover:bg-[#9B0B21] text-white'
                    }`}
                  >
                    <span className="material-icons text-sm">
                      {paymentMethod === 'online' ? 'credit_card' : (diningOption === 'delivery' ? 'two_wheeler' : 'payments')}
                    </span>
                    <span>
                      {paymentMethod === 'online'
                        ? `Review & Pay Online (₱${grandTotal.toLocaleString()})`
                        : diningOption === 'delivery'
                        ? `Review Delivery Order (₱${grandTotal.toLocaleString()})`
                        : `Review & Place Order (₱${grandTotal.toLocaleString()})`}
                    </span>
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>

                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div 
            className="fixed inset-0" 
            onClick={() => !isCheckingOut && setShowConfirmModal(false)}
          />

          <div className={`relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-md border border-gray-300 dark:border-slate-700 shadow-2xl transition-colors animate-in zoom-in-95 duration-150 ${
            isDarkMode 
              ? 'bg-[#071A3D] text-white' 
              : 'bg-white text-[#071A3D]'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 p-5 sm:p-6 border-gray-300 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#C8102E]">help_outline</span>
                <h3 className="font-extrabold text-base">Confirm Your Order</h3>
              </div>

              <button
                type="button"
                onClick={() => !isCheckingOut && setShowConfirmModal(false)}
                disabled={isCheckingOut}
                className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-700"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            {/* Modal Body: Order Summary */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-4 space-y-4 text-xs">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">
                Please review your order summary below before proceeding to payment.
              </p>
              
              {/* Order Meta Badges */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-2.5 rounded-md border flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <span className="material-icons text-base text-[#C8102E]">
                    {diningOption === 'dine_in' ? 'restaurant' : (diningOption === 'delivery' ? 'two_wheeler' : 'takeout_dining')}
                  </span>
                  <div>
                    <span className="text-[9px] uppercase font-extrabold text-gray-400 block tracking-wider">Dining Option</span>
                    <span className="font-extrabold text-xs">
                      {diningOption === 'dine_in' ? 'Dine-In' : (diningOption === 'delivery' ? 'Delivery 🛵' : 'Take-Out')}
                    </span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-md border flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <span className={`material-icons text-base ${paymentMethod === 'online' ? 'text-blue-500' : 'text-amber-500'}`}>
                    {paymentMethod === 'online' ? 'credit_card' : 'payments'}
                  </span>
                  <div>
                    <span className="text-[9px] uppercase font-extrabold text-gray-400 block tracking-wider">Payment Method</span>
                    <span className="font-extrabold text-xs">
                      {paymentMethod === 'online'
                        ? 'Online Payment'
                        : (diningOption === 'delivery' ? 'Cash on Delivery (COD)' : 'Over the Counter')}
                    </span>
                  </div>
                </div>
              </div>

              {diningOption === 'delivery' && (
                <div className={`p-2.5 rounded-md border text-xs space-y-1 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-700 text-gray-300' : 'bg-amber-50/60 border-amber-200 text-gray-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-[#C8102E]">
                    <span className="material-icons text-xs">location_on</span>
                    <span>Delivery Destination:</span>
                  </div>
                  <p className="font-semibold pl-4 text-xs">{deliveryAddress}</p>
                  {deliveryNotes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-4 italic">
                      Landmark/Note: {deliveryNotes}
                    </p>
                  )}
                </div>
              )}

              {contactPhone && (
                <div className={`px-3 py-2 rounded-md border text-xs flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="material-icons text-sm text-amber-500">
                      {diningOption === 'delivery' ? 'phone' : 'sms'}
                    </span>
                    <span>{diningOption === 'delivery' ? 'Rider Contact Phone:' : 'SMS Pickup Notification:'}</span>
                  </span>
                  <span className="font-mono font-bold">{contactPhone}</span>
                </div>
              )}

              {/* Order Items Review */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Review items</span>
                </div>

                <div className={`rounded-md border divide-y max-h-44 sm:max-h-48 overflow-y-auto ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-slate-700 divide-slate-800' 
                    : 'bg-gray-50/70 border-gray-300 divide-gray-200'
                }`}>
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#C8102E] text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-md leading-none">
                            {item.quantity}x
                          </span>
                          <span className={`font-bold text-xs truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                        </div>

                        {item.selectedOption && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 pl-5">
                            Option: {item.selectedOption.name}
                          </div>
                        )}

                        {item.customDishes && item.customDishes.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5 pl-5 truncate">
                            Includes: {item.customDishes.map(d => d.name || d.dish_name).join(', ')}
                          </p>
                        )}

                        {item.specialInstructions && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5 pl-5 truncate">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}
                      </div>

                      <span className="font-mono font-extrabold text-xs shrink-0 text-[#C8102E]">
                        ₱{item.finalPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Flow Explanation */}
              {paymentMethod === 'online' ? (
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5">
                  <span className="material-icons text-blue-600 dark:text-blue-400 text-base shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div className="text-[11px] leading-relaxed text-blue-950 dark:text-blue-200">
                    <strong className="font-extrabold block text-blue-800 dark:text-blue-300">Next Step: In-App Payment Portal</strong>
                    Confirm to proceed to our secure payment checkout to pay with <strong>Credit/Debit Card or GCash / Maya</strong>.
                  </div>
                </div>
              ) : diningOption === 'delivery' ? (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
                  <span className="material-icons text-emerald-600 dark:text-emerald-400 text-base shrink-0 mt-0.5">
                    two_wheeler
                  </span>
                  <div className="text-[11px] leading-relaxed text-emerald-950 dark:text-emerald-200">
                    <strong className="font-extrabold block text-emerald-800 dark:text-emerald-300">Next Step: Cash on Delivery (COD)</strong>
                    Confirm to place order directly to the kitchen. Please prepare <strong>₱{grandTotal.toLocaleString()}</strong> in cash to hand to the rider upon arrival!
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
                  <span className="material-icons text-amber-600 dark:text-amber-400 text-base shrink-0 mt-0.5">
                    payments
                  </span>
                  <div className="text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
                    <strong className="font-extrabold block text-amber-800 dark:text-amber-300">Next Step: Cashier Counter Settlement Pass</strong>
                    Confirm to generate your digital cashier counter pass. Settle payment with the cashier counter to start kitchen preparation.
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className={`p-3 rounded-md border space-y-1.5 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">₱{subtotal.toLocaleString()}</span>
                </div>
                {diningOption === 'take_out' && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>Take-Out Packaging:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">₱25</span>
                  </div>
                )}
                {diningOption === 'delivery' && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-xs">two_wheeler</span>
                      <span>Delivery Fee:</span>
                    </span>
                    <span className="font-mono font-bold">₱49</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-300 dark:border-slate-700">
                  <span className="font-extrabold text-xs sm:text-sm">Total Amount to Pay:</span>
                  <span className="text-[#C8102E] font-mono font-black text-base sm:text-lg">
                    ₱{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-2.5 shrink-0 ${
              isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-gray-300 bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isCheckingOut}
                className="py-2.5 px-4 rounded-md border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`py-2.5 px-5 rounded-md font-bold text-xs text-white shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer ${
                  paymentMethod === 'online'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-[#C8102E] hover:bg-[#9B0B21]'
                }`}
              >
                {isCheckingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{paymentMethod === 'online' ? 'Opening Checkout...' : 'Creating Order...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-sm">
                      {paymentMethod === 'online' ? 'lock' : (diningOption === 'delivery' ? 'two_wheeler' : 'receipt_long')}
                    </span>
                    <span>
                      {paymentMethod === 'online'
                        ? 'Proceed to Checkout'
                        : diningOption === 'delivery'
                        ? 'Confirm Delivery Order'
                        : 'Confirm & Place Order'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* OVER-THE-COUNTER / COD RECEIPT SLIP MODAL (IN-PLACE, NO REDIRECT) */}
      {counterReceiptOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => { setCounterReceiptOrder(null); if (onClose) onClose(); }}></div>
          <div className="relative z-10 w-full max-w-md my-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-sm shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top Perforated Header Accent */}
            <div className="h-2.5 bg-gradient-to-r from-[#C8102E] via-red-500 to-[#C8102E]"></div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Header & Logo with Close Button */}
              <div className="relative text-center pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <button
                  onClick={() => { setCounterReceiptOrder(null); if (onClose) onClose(); }}
                  className="absolute right-0 top-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-icons text-base">close</span>
                </button>

                <div className="flex items-center justify-center gap-2 mb-1">
                  <img src={logo} alt="Jo's Diner" className="h-7 object-contain" />
                  <span className="font-black text-sm tracking-tight font-sans text-gray-900 dark:text-white">JO'S DINER</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-sans font-bold">
                  {counterReceiptOrder.order_type === 'Delivery' ? 'Express Delivery Dispatch Slip' : 'Cashier Order Settlement Slip'}
                </p>
                <p className="text-[9px] text-gray-400 font-sans">
                  {counterReceiptOrder.order_type === 'Delivery' ? 'Express Courier Hub • Jo\'s Diner Dispatch' : 'Main Diner Counter • Terminal 01'}
                </p>

                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-sans flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    <span>
                      {counterReceiptOrder.order_type === 'Delivery' ? 'Pending Cash on Delivery (COD)' : 'Pending Cash Payment'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Big Scannable Order Code Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-gray-200 dark:border-slate-700 text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block font-sans">
                  Order Reference Code
                </span>
                <span className="text-2xl font-black tracking-widest text-[#C8102E] block select-all">
                  {counterReceiptOrder.order_code}
                </span>
                {/* Simulated Barcode Graphic */}
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
                    *{counterReceiptOrder.order_code}*
                  </span>
                </div>
              </div>

              {/* PROMINENT NOTE CALLOUT */}
              <div className="p-3.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <span className="material-icons text-base text-amber-600 shrink-0 mt-0.5">
                  {counterReceiptOrder.order_type === 'Delivery' ? 'two_wheeler' : 'storefront'}
                </span>
                <div className="space-y-0.5">
                  <span className="font-bold text-xs block font-sans">
                    {counterReceiptOrder.order_type === 'Delivery' ? 'Delivery Order Placed Successfully!' : 'Please Show This Slip to the Counter Cashier'}
                  </span>
                  <p className="text-[11px] leading-relaxed font-sans text-amber-800/90 dark:text-amber-300/90">
                    {counterReceiptOrder.order_type === 'Delivery' ? (
                      <>
                        Our kitchen is preparing your dishes. Your order will be assigned to a dispatch rider and delivered to <strong>{counterReceiptOrder.delivery_address}</strong>. Please have <strong>₱{Number(counterReceiptOrder.grand_total || 0).toLocaleString()}</strong> cash ready upon rider arrival.
                      </>
                    ) : (
                      <>
                        Your order is recorded as <strong>Pending Payment</strong>. Present this pass at the cashier counter to pay in cash. Staff will confirm and prepare your food.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Order Meta Info */}
              <div className="text-[11px] space-y-1 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Customer:</span>
                  <span className="font-bold text-gray-900 dark:text-white font-sans">{counterReceiptOrder.customer_name}</span>
                </div>
                {counterReceiptOrder.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-sans">Phone / SMS:</span>
                    <span className="font-bold">{counterReceiptOrder.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Dining Option:</span>
                  <span className="font-black uppercase px-2 py-0.5 rounded text-[10px] bg-red-100 text-[#C8102E] dark:bg-red-950/60 dark:text-red-400 font-sans">
                    {counterReceiptOrder.order_type || 'Dine-In'}
                  </span>
                </div>
                {counterReceiptOrder.delivery_address && counterReceiptOrder.order_type === 'Delivery' && (
                  <div className="flex justify-between items-start pt-1">
                    <span className="text-gray-400 font-sans">Deliver To:</span>
                    <span className="font-bold text-right max-w-[220px] font-sans">{counterReceiptOrder.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Itemized Docket Lines */}
              <div className="space-y-2 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex justify-between text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans">
                  <span>Qty & Description</span>
                  <span>Amount</span>
                </div>

                <div className="space-y-1.5 pt-0.5 max-h-36 overflow-y-auto">
                  {(counterReceiptOrder.items || []).map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] items-start gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          <span className="text-[#C8102E] font-black mr-1">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="font-extrabold shrink-0">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {item.special_instructions && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic pl-4 font-sans">
                          * Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Totals */}
              <div className="space-y-1.5 pb-3 border-b-2 border-dashed border-gray-300 dark:border-slate-700 text-xs">
                <div className="flex justify-between items-baseline pt-1 text-sm font-black font-sans">
                  <span className="uppercase tracking-wider text-gray-900 dark:text-white">Total Cash Due:</span>
                  <span className="text-xl font-black text-[#C8102E] font-mono">
                    ₱{counterReceiptOrder.grand_total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1 font-sans">
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
                  onClick={() => {
                    setCounterReceiptOrder(null)
                    if (onClose) onClose()
                    navigate('/my-orders')
                  }}
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
        </div>
      )}
    </div>
  )
}

export default CartDrawer
