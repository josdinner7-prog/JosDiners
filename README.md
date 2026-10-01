# 🍽️ Jo's Diner — Full-Stack Management System & Customer Portal

> **Developed by:** **Kurt Allan Tesaluna**

A modern, high-performance, full-stack web application for **Jo's Diner Function Hall & Catering Services**, featuring an Executive Admin Portal, Staff POS Terminal, Kitchen Display System (KDS), Customer Web Portal, and a secure Express.js + MariaDB REST backend.


## 🌟 Key Architecture & Features

- **⚡ High Performance Code-Splitting:** Implements React `lazy()` dynamic imports & `<Suspense>` routing, reducing initial bundle size by **70%** (`781 kB ➔ 234 kB`).
- **🛡️ Secure Backend Server:** Built with Express.js, MariaDB connection pool, **Helmet** HTTP security headers, and **Express Rate Limiting** against brute-force attacks.
- **🌐 Centralized API Service Layer:** Unified REST client (`src/services/api.js`) for clean domain-driven API calls across all frontend modules.
- **🎨 Premium UI/UX & Design Tokens:** Built with Vanilla CSS, HSL tailored color palettes, dark mode support, tactile buttons, and branded loading fallback spinners.
- **📧 Live Gmail OTP Authentication:** Automated 6-digit email verification codes and password recovery via Nodemailer.

---

## 📁 Project Directory Structure

```
JosDiners/
├── .env                       # Centralized Environment Secrets (DB, JWT, Gmail OTP)
├── .env.example               # Environment Variables Example Template
├── package.json               # Dependencies (Vite, React, Express, MariaDB, Helmet, Nodemailer)
├── vite.config.js             # Vite Build & Dev Server Config
├── index.html                 # HTML5 App Entry Point
│
├── server/                    # 🛡️ Modular Express.js Backend Server
│   ├── index.js               # Express Server Entry Point (Secured with Helmet & Auth Rate Limiter)
│   ├── config/
│   │   └── db.js              # MariaDB Connection Pool & Auto-Migration (initDatabaseSchema)
│   ├── utils/
│   │   └── mailer.js          # Nodemailer Gmail OTP Transporter & Email Templates
│   └── routes/                # ES Route Controllers
│       ├── auth.routes.js     # Auth, Registration, OTP Verification, Password Reset, Staff Login
│       ├── menu.routes.js     # Categories CRUD, Menu Items CRUD, Availability & Featured Toggles
│       ├── staff.routes.js    # Staff User Roster & Shift Status Toggles
│       ├── customers.routes.js # Customer Roster & Spend Analytics
│       ├── reservations.routes.js # Table Reservations & Slot Capacity Settings
│       ├── orders.routes.js   # Customer & Executive POS Orders Tracking
│       └── packages.routes.js # Catering Packages, Function Halls, Add-ons, and Event Bookings
│
└── src/                       # ⚛️ Frontend React Application
    ├── main.jsx               # React DOM Root Entry Point
    ├── App.jsx                # App Shell Provider & Routing Wrapper
    ├── index.css              # Global Vanilla CSS Design System & Theme Tokens
    │
    ├── services/              # 🌐 Centralized API Service Layer
    │   └── api.js             # Unified API Client (auth, menu, orders, reservations, catering, staff)
    │
    ├── routes/                # ⚡ Code-Split Lazy Routing Modules
    │   ├── AppRoutes.jsx      # Top Router (RoleLogin, Admin, Staff, Kitchen, Customer)
    │   ├── CustomerRoutes.jsx # Customer Web Portal Lazy Routes
    │   ├── AdminRoutes.jsx    # Executive Admin Portal Lazy Routes
    │   ├── StaffRoutes.jsx    # POS Staff Portal Lazy Routes
    │   ├── KitchenRoutes.jsx  # Kitchen KDS Terminal Lazy Routes
    │   └── ProtectedRoute.jsx # Role-Based Auth Guard Middleware
    │
    ├── auth/                  # 🔐 Auth Context & Management Login
    │   ├── AuthContext.jsx    # Global Customer & Staff Auth State Provider
    │   └── RoleLogin.jsx      # Role Login Page (Admin / Staff / Kitchen)
    │
    ├── components/            # 🧩 Core Reusable UI Components
    │   ├── LoadingFallback.jsx # Viewport-Centered Branded Logo Spinner for React Suspense
    │   ├── AuthModal.jsx      # Login, Register, OTP Email Verification, Forgot Password Modal
    │   ├── FoodCategoryBar.jsx # Food Categories Filter Bar
    │   ├── MenuGrid.jsx       # Customer Food Menu Catalog Grid
    │   ├── HeroBanner.jsx     # Homepage Hero Carousel Banner
    │   ├── FoodDetailModal.jsx# Dish Specification Detail Modal
    │   ├── PaginationControls.jsx # Custom Tactile Pagination Bar
    │   ├── ToastNotification.jsx # Toast Alerts Notification System
    │   └── ConfirmModal.jsx   # Deletion Confirmation Modal
    │
    ├── admin/                 # 👑 Admin Executive Portal
    │   ├── layouts/
    │   │   └── AdminLayout.jsx # Executive Sidebar & Top Navigation Header
    │   ├── pages/
    │   │   ├── Dashboard.jsx  # Revenue & Orders Overview Analytics
    │   │   ├── MenuManagement.jsx # Food Menu Catalog Management
    │   │   ├── StaffManagement.jsx # Staff User Roster Management
    │   │   ├── Customers.jsx   # Customer Directory & Analytics
    │   │   ├── Orders.jsx      # Executive Orders Tracking
    │   │   ├── Reservations.jsx# Table Bookings & Availability Settings
    │   │   ├── Packages.jsx    # Catering Packages & Add-ons
    │   │   └── FunctionHalls.jsx # Function Hall Venues Management
    │   └── components/        # Extracted Modular Admin Sub-Components
    │       ├── MenuFilterBar.jsx # 2-Tier Search Bar & Category Chips Filter
    │       ├── AddDishModal.jsx  # New Dish Creation Form with Canvas Image Compression
    │       ├── EditDishModal.jsx # Dish Specifications Update Modal Form
    │       ├── CategoryManagementModal.jsx # Category Creator & Inline List Editor
    │       └── ViewDishModal.jsx # Dish Inspection Modal
    │
    ├── staff/                 # 💼 Staff POS Terminal Portal
    │   ├── layouts/
    │   │   └── StaffLayout.jsx # POS Navigation & Active Order Badges
    │   └── pages/
    │       └── Dashboard.jsx  # Executive POS Order Placement & Status Terminal
    │
    ├── kitchen/               # 🍳 Kitchen KDS Terminal Portal
    │   └── layouts/
    │       └── KitchenLayout.jsx # Kitchen Display System Ticket Grid & Station Filters
    │
    └── customer/              # 🛒 Customer Web Portal
        ├── layouts/
        │   └── CustomerLayout.jsx # Customer Header Navigation & Footer Layout
        └── pages/
            ├── CustomerHome.jsx # Main Diner Landing Page
            ├── Menu.jsx         # Full Diner Catalog Page
            ├── CateringPage.jsx # Catering Packages & Function Hall Booking
            ├── FunctionHallPage.jsx # Function Hall Venues Gallery & Specifications
            ├── Reservation.jsx  # Table Availability Booking Calendar
            ├── MyEventsPage.jsx # Customer Booked Catering Events
            ├── MyOrdersPage.jsx # Customer Order History & Tracking
            ├── ProfilePage.jsx  # Customer Account Profile Settings
            ├── Login.jsx        # Login Route Wrapper
            └── Register.jsx     # Registration Route Wrapper
```

---

## 🛠️ Quick Start & Developer Guide

### 1. Environment Setup
Create a `.env` file in the root project folder (or copy `.env.example`):
```env
PORT=5000
VITE_API_BASE_URL=http://localhost:5000

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=jos_diners_db

JWT_SECRET=jos_diners_super_secret_jwt_key_2026_x89f
GMAIL_USER=josdinner7@gmail.com
GMAIL_PASS=jnbrwdswynqjmuls
```

### 2. Start the Backend Express Server
```bash
node server/index.js
```

### 3. Start the Frontend Vite Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🌐 Centralized API Client (`src/services/api.js`)

All network requests flow through the centralized API client layer:

```javascript
import api from './services/api'

// Authentication
await api.auth.login({ email, password })
await api.auth.register({ full_name, email, phone, password })

// Menu Catalog
await api.menu.getMenuItems()
await api.menu.updateAvailability(dishId, 'Available')

// Orders & POS
await api.orders.getOrders()
await api.orders.createOrder(orderData)

// Catering & Function Halls
await api.catering.getPackages()
await api.functionHalls.getHalls()
```

---

## 📜 License & Credits
- **Developer:** **Kurt Allan Tesaluna**
- **Copyright:** © 2026 **Jo's Diner Function Hall & Catering Services**. All rights reserved.
