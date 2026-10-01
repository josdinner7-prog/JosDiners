import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import { initDatabaseSchema } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import menuRoutes from './routes/menu.routes.js'
import staffRoutes from './routes/staff.routes.js'
import customersRoutes from './routes/customers.routes.js'
import reservationsRoutes, { handleGetSettings, handlePutSettings } from './routes/reservations.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import packagesRoutes from './routes/packages.routes.js'
import aiRoutes from './routes/ai.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import smsRoutes from './routes/sms.routes.js';
import webhookRoutes from './routes/webhook.routes.js'
import inventoryRoutes from './routes/inventory.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import ridersRoutes from './routes/riders.routes.js'

dotenv.config()

const app = express()

// Trust proxy for Cloudflare tunnels, localtunnel, ngrok & reverse proxies
app.set('trust proxy', 1)

// 1. Security HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible cross-origin images/resources during local dev
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// 2. Global Middleware & CORS
app.use(cors())
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 3. Auth Rate Limiter (Prevent brute-force while allowing active development)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    status: 'error',
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  }
})

// Initialize MariaDB Schema & Packet limits
initDatabaseSchema()

// Mount Modular Express API Routes with Rate Limiting on Auth
app.use('/api/auth', authRateLimiter, authRoutes)
app.use('/api', menuRoutes)
app.use('/api/users', staffRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/reservations', reservationsRoutes)
app.get('/api/reservation_settings', handleGetSettings)
app.put('/api/reservation_settings', handlePutSettings)
app.use('/api/orders', ordersRoutes)
app.use('/api', packagesRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/sms', smsRoutes);
app.use('/api/webhooks', webhookRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/riders', ridersRoutes)

// Serve SMS gateway static web client & public assets
app.use('/sms', express.static('sms'))
app.use(express.static('public'))

// Root & Test routes for testing backend domain / tunnel
app.get('/', (req, res) => {
  res.send('Backend is working')
})

app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  })
})

// Server Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: "KadJo healthy kaayu ang server!",
    security: { helmet: true, rateLimiter: true }
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Jo's Diner Express Backend running on http://localhost:${PORT}`)
})
