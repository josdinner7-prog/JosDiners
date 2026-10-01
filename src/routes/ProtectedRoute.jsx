import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function ProtectedRoute({ allowedRoles = [], children }) {
  const { staffUser: contextStaffUser } = useAuth()

  const getStaffUser = () => {
    if (contextStaffUser) return contextStaffUser
    try {
      const saved = localStorage.getItem('josdiner_staff_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  }

  const staffUser = getStaffUser()

  if (!staffUser) {
    return <Navigate to="/Rolelogin" replace />
  }

  const userRole = String(staffUser.role || '').toLowerCase().trim()
  const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase().trim())

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
    return <Navigate to="/Rolelogin" replace />
  }

  return children
}

export default ProtectedRoute
