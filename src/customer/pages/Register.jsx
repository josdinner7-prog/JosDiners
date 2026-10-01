import React from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import AuthModal from '../../components/AuthModal'

function Register(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const onLoginSuccess = (userData) => {
    if (props.onLoginSuccess) props.onLoginSuccess(userData)
    else if (context.handleLoginSuccess) context.handleLoginSuccess(userData)
    navigate('/')
  }
  const handleClose = props.onClose || (() => navigate('/'))

  return (
    <AuthModal
      isOpen={props.isOpen ?? true}
      onClose={handleClose}
      initialTab="register"
      onLoginSuccess={onLoginSuccess}
      isDarkMode={isDarkMode}
    />
  )
}

export default Register
