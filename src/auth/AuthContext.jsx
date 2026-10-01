import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem('josdiner_staff_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('josdiner_customer_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const loginStaff = (userData) => {
    setStaffUser(userData)
    localStorage.setItem('josdiner_staff_user', JSON.stringify(userData))
  }

  const logoutStaff = () => {
    setStaffUser(null)
    localStorage.removeItem('josdiner_staff_user')
  }

  const loginCustomer = (userData) => {
    setCustomerUser(userData)
    localStorage.setItem('josdiner_customer_user', JSON.stringify(userData))
  }

  const logoutCustomer = () => {
    setCustomerUser(null)
    localStorage.removeItem('josdiner_customer_user')
  }

  return (
    <AuthContext.Provider
      value={{
        staffUser,
        customerUser,
        loginStaff,
        logoutStaff,
        loginCustomer,
        logoutCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
