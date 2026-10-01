import React from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import AuthModal from '../../components/AuthModal'

function Login(props) {
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
      initialTab="login"
      onLoginSuccess={onLoginSuccess}
      isDarkMode={isDarkMode}
    />
  )
}

export default Login
