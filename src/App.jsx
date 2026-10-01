import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/ToastNotification'
import { AuthProvider } from './auth/AuthContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App