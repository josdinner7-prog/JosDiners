import { Capacitor } from '@capacitor/core'

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const customServer = localStorage.getItem('josdiner_api_server')
    if (customServer && customServer.trim()) {
      return customServer.trim().replace(/\/+$/, '')
    }

    // When running inside native Android / iOS Capacitor APK
    if (Capacitor.isNativePlatform()) {
      return 'https://api.josdiner.dpdns.org'
    }


    const { hostname, protocol, port } = window.location

    if (hostname.includes('josdiner.dpdns.org')) {
      return `${protocol}//api.josdiner.dpdns.org`
    }

    // If loaded over HTTPS (such as cloudflare tunnels, ngrok, dpdns),
    // NEVER fetch http:// directly because modern browsers block Mixed Content (Failed to fetch).
    // An empty string routes through Vite / proxy securely!
    if (protocol === 'https:') {
      if (hostname.includes('dpdns.org')) {
        return 'https://api.josdiner.dpdns.org'
      }
      return ''
    }

    // If accessing via Vite dev server or preview (port 5173/4173),
    // Vite automatically proxies /api to port 5000 on localhost, eliminating CORS and firewall drops.
    if (port === '5173' || port === '4173' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `${protocol}//${hostname}:5000`
    }
  }

  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
}


export const API_BASE_URL = getApiBaseUrl()

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const config = {
    ...options,
    headers
  }

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body)
  }

  let response
  try {
    response = await fetch(url, config)
  } catch (netErr) {
    const errorMsg = 'Could not connect to backend server. Make sure the Node server is running on port 5000.'
    const error = new Error(errorMsg)
    error.originalError = netErr
    throw error
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    let msg = data.message
    if (response.status === 431) {
      msg = 'Image payload size is too large (HTTP 431). Please reduce file sizes or select smaller photos.'
    } else if (response.status === 413) {
      msg = 'Image file size exceeds server limits (HTTP 413). Please select smaller photos.'
    }
    const error = new Error(msg || `API error (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}


export const api = {
  // BASE URL EXPORT
  get baseUrl() {
    return getApiBaseUrl()
  },

  // 1. AUTH & SESSION API
  auth: {
    register: (credentials) => request('/api/auth/register', { method: 'POST', body: credentials }),
    resendCode: (email) => request('/api/auth/resend_code', { method: 'POST', body: { email } }),
    verifyEmail: (payload) => request('/api/auth/verify_email', { method: 'POST', body: payload }),
    login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
    forgotPassword: (email) => request('/api/auth/forgot_password', { method: 'POST', body: { email } }),
    verifyResetCode: (payload) => request('/api/auth/verify_reset_code', { method: 'POST', body: payload }),
    resetPassword: (payload) => request('/api/auth/reset_password', { method: 'POST', body: payload }),
    staffLogin: (credentials) => request('/api/auth/staff_login', { method: 'POST', body: credentials }),
    socialLogin: (payload) => request('/api/auth/social_login', { method: 'POST', body: payload }),
  },

  // 2. MENU ITEMS & CATEGORIES API
  menu: {
    getMenuItems: () => request('/api/menu_items'),
    getCategories: () => request('/api/categories'),
    addMenuItem: (itemData) => request('/api/menu_items', { method: 'POST', body: itemData }),
    updateMenuItem: (id, itemData) => request(`/api/menu_items/${id}`, { method: 'PUT', body: itemData }),
    updateAvailability: (id, availability) => request(`/api/menu_items/${id}/availability`, { method: 'PUT', body: { availability } }),
    toggleFeatured: (id, is_featured) => request(`/api/menu_items/${id}`, { method: 'PUT', body: { is_featured } }),
    deleteMenuItem: (id) => request(`/api/menu_items/${id}`, { method: 'DELETE' }),
    addCategory: (catData) => request('/api/categories', { method: 'POST', body: catData }),
    updateCategory: (id, catData) => request(`/api/categories/${id}`, { method: 'PUT', body: catData }),
    deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),
    getMenuCatalog: () => request('/api/menu'),
  },

  // 3. ORDERS REST API
  orders: {
    getOrders: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/orders${q ? '?' + q : ''}`)
    },
    getOrderByCode: (orderCode) => request(`/api/orders/code/${orderCode}`),
    getOrderById: (id) => request(`/api/orders/${id}`),
    createOrder: (orderData) => request('/api/orders', { method: 'POST', body: orderData }),
    updateStatus: (id, status, items) => request(`/api/orders/${id}`, { method: 'PUT', body: { status, items } }),
    updatePayment: (id, paymentData) => request(`/api/orders/${id}/payment`, { method: 'PUT', body: paymentData }),
    recordOnlinePayment: (id, paymentData) => request(`/api/orders/${id}/record-online-payment`, { method: 'POST', body: paymentData }),
    updatePaymentDetails: (id, details) => request(`/api/orders/${id}/payment-details`, { method: 'PUT', body: details }),
    dispatchDelivery: (id, dispatchData) => request(`/api/orders/${id}/dispatch-delivery`, { method: 'PUT', body: dispatchData }),
    assignRider: (id, assignData) => request(`/api/orders/${id}/assign-rider`, { method: 'POST', body: assignData }),
    reassignRider: (id, reassignData) => request(`/api/orders/${id}/reassign-rider`, { method: 'POST', body: reassignData }),
    refundOrder: (id, refundData = {}) => request(`/api/orders/${id}/refund`, { method: 'POST', body: refundData }),
    deleteOrder: (id) => request(`/api/orders/${id}`, { method: 'DELETE' }),
  },

  // 4. TABLE RESERVATIONS API
  reservations: {
    getReservations: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/reservations${q ? '?' + q : ''}`)
    },
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/reservations${q ? '?' + q : ''}`)
    },
    createReservation: (resData) => request('/api/reservations', { method: 'POST', body: resData }),
    updateReservation: (id, resData) => request(`/api/reservations/${id}`, { method: 'PUT', body: resData }),
    deleteReservation: (id) => request(`/api/reservations/${id}`, { method: 'DELETE' }),
    getSettings: () => request('/api/reservations/settings'),
    updateSettings: (settingsData) => request('/api/reservations/settings', { method: 'PUT', body: settingsData }),
    verifyReservation: (code) => request('/api/reservations/verify', { method: 'POST', body: { code } }),
    verify: (code) => request('/api/reservations/verify', { method: 'POST', body: { code } }),
    checkInReservation: (payload) => request('/api/reservations/check-in', { method: 'POST', body: payload }),
    checkIn: (payload) => request('/api/reservations/check-in', { method: 'POST', body: payload }),
    sendReservationQREmail: (payload) => request('/api/reservations/send-qr-email', { method: 'POST', body: payload }),
    confirmReservation: (id) => request(`/api/reservations/${id}/confirm`, { method: 'POST' }),
    resetCheckIn: (id) => request(`/api/reservations/${id}/reset-checkin`, { method: 'POST' }),
    assignTable: async (id, table_number) => {
      try {
        const res = await request(`/api/reservations/${id}/assign-table`, { method: 'PUT', body: { table_number } })
        if (res && res.status === 'success') return res
      } catch (err) {
        // Fallback to updating reservation directly if sub-route is not loaded
      }
      return request(`/api/reservations/${id}`, { method: 'PUT', body: { table_number } })
    },
  },

  // 5. CATERING PACKAGES & BOOKINGS API
  catering: {
    getPackages: () => request('/api/catering_packages'),
    createPackage: (pkgData) => request('/api/catering_packages', { method: 'POST', body: pkgData }),
    updatePackage: (id, pkgData) => request(`/api/catering_packages/${id}`, { method: 'PUT', body: pkgData }),
    deletePackage: (id) => request(`/api/catering_packages/${id}`, { method: 'DELETE' }),
    getBookings: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/catering_bookings${q ? '?' + q : ''}`)
    },
    createBooking: (bookingData) => request('/api/catering_bookings', { method: 'POST', body: bookingData }),
    updateBookingStatus: (id, status) => request(`/api/catering_bookings/${id}`, { method: 'PUT', body: { status } }),
    deleteBooking: (id) => request(`/api/catering_bookings/${id}`, { method: 'DELETE' }),
    getAddons: () => request('/api/catering_addons'),
    createAddon: (addonData) => request('/api/catering_addons', { method: 'POST', body: addonData }),
    updateAddon: (id, addonData) => request(`/api/catering_addons/${id}`, { method: 'PUT', body: addonData }),
    deleteAddon: (id) => request(`/api/catering_addons/${id}`, { method: 'DELETE' }),
  },

  // 6. FUNCTION HALLS VENUES API
  functionHalls: {
    getHalls: () => request('/api/function_halls'),
    createHall: (hallData) => request('/api/function_halls', { method: 'POST', body: hallData }),
    updateHall: (id, hallData) => request(`/api/function_halls/${id}`, { method: 'PUT', body: hallData }),
    deleteHall: (id) => request(`/api/function_halls/${id}`, { method: 'DELETE' }),
  },

  // 6b. FUNCTION HALL ADD-ONS & CATEGORIES API
  hallAddons: {
    getAddons: () => request('/api/hall_addons'),
    createAddon: (data) => request('/api/hall_addons', { method: 'POST', body: data }),
    updateAddon: (id, data) => request(`/api/hall_addons/${id}`, { method: 'PUT', body: data }),
    deleteAddon: (id) => request(`/api/hall_addons/${id}`, { method: 'DELETE' }),
    getCategories: () => request('/api/hall_addon_categories'),
    createCategory: (data) => request('/api/hall_addon_categories', { method: 'POST', body: data }),
    updateCategory: (id, data) => request(`/api/hall_addon_categories/${id}`, { method: 'PUT', body: data }),
    deleteCategory: (id) => request(`/api/hall_addon_categories/${id}`, { method: 'DELETE' }),
  },

  // 7. STAFF USERS ROSTER & EVENT SCHEDULING API
  staff: {
    getUsers: () => request('/api/users'),
    createUser: (userData) => request('/api/users', { method: 'POST', body: userData }),
    updateUser: (id, userData) => request(`/api/users/${id}`, { method: 'PUT', body: userData }),
    deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
    getEventRoster: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/users/event_roster${q ? `?${q}` : ''}`)
    },
    createEventRosterAssignment: (data) => request('/api/users/event_roster', { method: 'POST', body: data }),
    updateEventRosterAssignment: (id, data) => request(`/api/users/event_roster/${id}`, { method: 'PUT', body: data }),
    deleteEventRosterAssignment: (id) => request(`/api/users/event_roster/${id}`, { method: 'DELETE' }),
    sendDutySMS: (rosterId, payload = {}) => request(`/api/users/event_roster/${rosterId}/send-sms`, { method: 'POST', body: payload }),
    sendEventBulkDutySMS: (payload = {}) => request('/api/users/event_roster/event-bulk-sms', { method: 'POST', body: payload }),
  },

  // 8. CUSTOMERS API
  customers: {
    getCustomers: () => request('/api/customers'),
    createCustomer: (customerData) => request('/api/customers', { method: 'POST', body: customerData }),
    updateCustomer: (id, customerData) => request(`/api/customers/${id}`, { method: 'PUT', body: customerData }),
    deleteCustomer: (id) => request(`/api/customers/${id}`, { method: 'DELETE' }),
  },

  // 9. AI CONCIERGE API (Claudine AI Live System Bridge)
  ai: {
    getSystemContext: () => request('/api/ai/system-context'),
    lookup: (query, type) => request('/api/ai/lookup', { method: 'POST', body: { query, type } }),
    chat: (message) => request('/api/ai/chat', { method: 'POST', body: { message } }),
    getBudgetRecommendations: (payload) => request('/api/ai/budget-recommendations', { method: 'POST', body: payload })
  },

  // 10. RESERVATION NOTIFICATIONS API
  notifications: {
    getNotifications: (params = {}) => {
      const cleanParams = {}
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          cleanParams[k] = params[k]
        }
      })
      const q = new URLSearchParams(cleanParams).toString()
      return request(`/api/notifications${q ? '?' + q : ''}`)
    },
    createNotification: (data) => request('/api/notifications', { method: 'POST', body: data }),
    markAsRead: (id, isRead = true) => request(`/api/notifications/${id}/read`, { method: 'PUT', body: { is_read: isRead } }),
    markAllAsRead: (payload = {}) => request('/api/notifications/mark-all-read', { method: 'PUT', body: payload }),
    deleteNotification: (id) => request(`/api/notifications/${id}`, { method: 'DELETE' }),
    sendNotificationEmail: (id, email = null) => request(`/api/notifications/${id}/send-email`, { method: 'POST', body: { email } })
  },

  // 11. SMS GATEWAY & WEBHOOK API (HttpSMS)
  sms: {
    send: (message, number) => request('/api/sms/send', { method: 'POST', body: { message, number } }),
    sendBulk: (message, numbers) => request('/api/sms/send-bulk', { method: 'POST', body: { message, numbers } }),
    getSettings: () => request('/api/sms/settings'),
    updateSettings: (settingsData) => request('/api/sms/settings', { method: 'PUT', body: settingsData }),
    getWebhookLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/sms/webhook-logs${q ? '?' + q : ''}`)
    },
    clearWebhookLogs: () => request('/api/sms/webhook-logs', { method: 'DELETE' }),
    sendTest: (number, message) => request('/api/sms/test', { method: 'POST', body: { number, message } }),
  },

  // 12. DUAL TRACK INVENTORY SYSTEM API
  inventory: {
    getSummary: () => request('/api/inventory/summary'),
    // Track 1: Perishables
    getPerishables: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/inventory/perishables${q ? '?' + q : ''}`)
    },
    createPerishable: (data) => request('/api/inventory/perishables', { method: 'POST', body: data }),
    updatePerishable: (id, data) => request(`/api/inventory/perishables/${id}`, { method: 'PUT', body: data }),
    deletePerishable: (id) => request(`/api/inventory/perishables/${id}`, { method: 'DELETE' }),
    logPerishableChange: (id, logData) => request(`/api/inventory/perishables/${id}/log`, { method: 'POST', body: logData }),
    getPerishableLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/inventory/perishables/logs${q ? '?' + q : ''}`)
    },
    // Track 2: Reusable Assets
    getAssets: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/inventory/assets${q ? '?' + q : ''}`)
    },
    createAsset: (data) => request('/api/inventory/assets', { method: 'POST', body: data }),
    updateAsset: (id, data) => request(`/api/inventory/assets/${id}`, { method: 'PUT', body: data }),
    deleteAsset: (id) => request(`/api/inventory/assets/${id}`, { method: 'DELETE' }),
    // Event Availability & Allocations
    getAssetAvailability: (date) => request(`/api/inventory/assets/availability?date=${encodeURIComponent(date)}`),
    getAllocations: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/inventory/allocations${q ? '?' + q : ''}`)
    },
    createAllocation: (data) => request('/api/inventory/allocations', { method: 'POST', body: data }),
    dispatchAllocation: (id, data = {}) => request(`/api/inventory/allocations/${id}/dispatch`, { method: 'PUT', body: data }),
    returnAllocation: (id, data = {}) => request(`/api/inventory/allocations/${id}/return`, { method: 'PUT', body: data }),
    deleteAllocation: (id) => request(`/api/inventory/allocations/${id}`, { method: 'DELETE' }),
  },

  // 13. PAYMONGO PAYMENT GATEWAY API
  payments: {
    getConfig: () => request('/api/payments/config'),
    createCheckoutSession: (payload) => request('/api/payments/create-checkout-session', { method: 'POST', body: payload }),
    getSession: (sessionId) => request(`/api/payments/session/${sessionId}`),
    getOrderSession: (orderCode) => request(`/api/payments/order-session/${orderCode}`),
    verifyCheckoutSession: (sessionId, orderCode, orderPayload) => {
      return request(`/api/payments/verify-checkout-session/${sessionId}`, {
        method: 'POST',
        body: { orderCode: orderCode || '', orderPayload }
      })
    },
    payCard: (payload) => request('/api/payments/pay-card', { method: 'POST', body: payload }),
    payEWallet: (payload) => request('/api/payments/pay-ewallet', { method: 'POST', body: payload }),
    verifyIntent: (intentId, orderCode, method, orderPayload) => {
      return request(`/api/payments/verify-intent/${intentId}`, {
        method: 'POST',
        body: { orderCode: orderCode || '', method: method || 'online', orderPayload }
      })
    }
  },

  // 14. WEBHOOKS AUDIT API
  webhooks: {
    getPaymongoLogs: () => request('/api/webhooks/paymongo/logs')
  },

  // 15. RIDERS LOGISTICS & DISPATCH API
  riders: {
    getRiders: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/riders${q ? '?' + q : ''}`)
    },
    getRider: (id) => request(`/api/riders/${id}`),
    updateStatus: (id, rider_status) => request(`/api/riders/${id}/status`, { method: 'PUT', body: { rider_status } }),
    updateProfile: (id, profileData) => request(`/api/riders/${id}/profile`, { method: 'PUT', body: profileData }),
    changePassword: (id, passData) => request(`/api/riders/${id}/password`, { method: 'PUT', body: passData }),
    getRequests: (id) => request(`/api/riders/${id}/requests`),
    getActiveDelivery: (id) => request(`/api/riders/${id}/active`),
    acceptOrder: (id, orderId) => request(`/api/riders/${id}/orders/${orderId}/accept`, { method: 'POST' }),
    declineOrder: (id, orderId, reason) => request(`/api/riders/${id}/orders/${orderId}/decline`, { method: 'POST', body: { reason } }),
    updateDeliveryStatus: (id, orderId, delivery_status) => request(`/api/riders/${id}/orders/${orderId}/status`, { method: 'PUT', body: { delivery_status } }),
    getHistory: (id, params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/api/riders/${id}/history${q ? '?' + q : ''}`)
    },
    getEarnings: (id) => request(`/api/riders/${id}/earnings`),
    getNotifications: (id) => request(`/api/riders/${id}/notifications`),
  }
}

export default api
