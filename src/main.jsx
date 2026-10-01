import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent third-party browser extensions (e.g. web-vitals reportAllChanges) from interrupting the app
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('startTime') ||
    (event.filename && event.filename.includes('anonymous')) ||
    !event.filename
  ) {
    // Suppress third-party extension error
    event.preventDefault?.()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

