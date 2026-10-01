import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import CustomerHeader from '../../components/CustomerHeader'
import CartDrawer from '../../components/CartDrawer'
import CustomerFooter from '../../components/CustomerFooter'
import AIBudgetConciergeDrawer from '../../components/AIBudgetConciergeDrawer'
import { useToast } from '../../components/ToastNotification'
import { useAuth } from '../../auth/AuthContext'

function CustomerLayout() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { customerUser: currentUser, loginCustomer, logoutCustomer } = useAuth()

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('josdiner_theme') === 'dark'
  })

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('josdiner_customer_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false)
  const [selectedHallForBooking, setSelectedHallForBooking] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem('josdiner_customer_cart', JSON.stringify(cartItems))
    } catch (e) {
      console.error('Error saving cart to localStorage:', e)
    }
  }, [cartItems])

  useEffect(() => {
    localStorage.setItem(
      'josdiner_theme',
      isDarkMode ? 'dark' : 'light'
    )

    document.documentElement.classList.toggle(
      'dark',
      isDarkMode
    )
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  const handleLoginSuccess = (userData) => {
    loginCustomer(userData)
  }

  const handleLogout = () => {
    logoutCustomer()
    showToast("Logged out of Jo's Diner.", 'info')
    navigate('/')
  }

  const handleAddToCart = (newItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item =>
        String(item.id) === String(newItem.id) &&
        (item.selectedOption?.name || '') === (newItem.selectedOption?.name || '')
      )

      if (existingIdx > -1) {
        const updated = [...prev]
        const existing = updated[existingIdx]
        const mergedQty = existing.quantity + newItem.quantity
        const unitPrice = newItem.finalPrice / newItem.quantity
        updated[existingIdx] = {
          ...existing,
          quantity: mergedQty,
          finalPrice: unitPrice * mergedQty,
          specialInstructions: newItem.specialInstructions || existing.specialInstructions
        }
        return updated
      }

      return [...prev, newItem]
    })

    showToast(
      `Added "${newItem.name}" to Order Tray!`,
      'success'
    )
  }

  const handleUpdateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(index)
      return
    }

    setCartItems(prev => {
      const updated = [...prev]
      const item = updated[index]

      const unitPrice =
        item.finalPrice / item.quantity

      updated[index] = {
        ...item,
        quantity: newQty,
        finalPrice: unitPrice * newQty,
      }

      return updated
    })
  }

  const handleRemoveItem = (index) => {
    const item = cartItems[index]

    setCartItems(prev =>
      prev.filter((_, i) => i !== index)
    )

    if (item) {
      showToast(
        `Removed "${item.name}" from tray.`,
        'info'
      )
    }
  }

  const handleExploreMenu = () => {
    navigate('/menu')
  }

  const handleBookHall = () => {
    navigate('/function-halls')
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode
        ? 'bg-[#040D21] text-gray-100 dark'
        : 'bg-[#F8FAFC] text-[#071A3D]'
        }`}
    >

      <CustomerHeader
        cartCount={cartItems.reduce(
          (total, item) => total + item.quantity,
          0
        )}
        onOpenCart={() => setIsCartOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onAddToCart={handleAddToCart}
      />

      <main className="flex-1">
        <Outlet
          context={{
            isDarkMode,
            toggleDarkMode,
            currentUser,
            handleLoginSuccess,
            handleLogout,
            cartItems,
            handleAddToCart,
            handleUpdateQuantity,
            handleRemoveItem,
            openCart: () => setIsCartOpen(true),
            setIsCartOpen,
            selectedHallForBooking,
            setSelectedHallForBooking,
            handleExploreMenu,
            handleBookHall,
            isAiConciergeOpen,
            setIsAiConciergeOpen,
            openAiConcierge: () => setIsAiConciergeOpen(true)
          }}
        />
      </main>

      {/* Minimized Floating AI Smart Food Concierge Button with Tooltip */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center group">
        {/* Tooltip on Hover */}
        <div className="pointer-events-none absolute right-full mr-2.5 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-200 ease-out flex items-center drop-shadow-lg">
          <div className="bg-[#071A3D] dark:bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700/80 whitespace-nowrap flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
            <span>AI Budget Concierge</span>
          </div>
          {/* Tooltip Arrow */}
          <div className="w-2 h-2 bg-[#071A3D] dark:bg-slate-900 border-t border-r border-slate-700/80 transform rotate-45 -ml-1 shrink-0"></div>
        </div>

        <button
          onClick={() => setIsAiConciergeOpen(true)}
          className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-[#C8102E] to-[#9B0B21] hover:from-[#9B0B21] hover:to-[#730717] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-white/40 cursor-pointer"
          aria-label="Open AI Budget Concierge"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-icons text-xl sm:text-2xl text-white group-hover:rotate-12 transition-transform">smart_toy</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#C8102E]" />
          </div>
        </button>
      </div>

      {/* AI Budget Concierge Drawer */}
      <AIBudgetConciergeDrawer
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
        isDarkMode={isDarkMode}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        isDarkMode={isDarkMode}
      />

      <CustomerFooter
        isDarkMode={isDarkMode}
        onExploreMenu={handleExploreMenu}
        onBookHall={handleBookHall}
      />
    </div>
  )
}

export default CustomerLayout

