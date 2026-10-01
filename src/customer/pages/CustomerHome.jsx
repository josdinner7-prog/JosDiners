import { useState } from 'react'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import HeroBanner from '../../components/HeroBanner'
import CategorySelector from '../../components/CategorySelector'
import FeaturedDishes from '../../components/FeaturedDishes'
import FunctionHallShowcase from '../../components/FunctionHallShowcase'

function CustomerHome(props) {
  const context = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const onAddToCart = props.onAddToCart ?? context.handleAddToCart
  const handleExploreMenu = props.onExploreMenu ?? context.handleExploreMenu
  const handleBookHall = props.onBookHall ?? context.handleBookHall

  const activeMode = location.pathname
  const setActiveMode = (mode) => {
    if (mode === 'menu') handleExploreMenu?.()
    else if (mode === 'hall') handleBookHall?.()
    else if (mode === 'catering') navigate('/catering')
    else if (mode === 'reservations') navigate('/reservation')
    else navigate(mode.startsWith('/') ? mode : `/${mode}`)
  }

  const [selectedCategory, setSelectedCategory] = useState('all')

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToHall = () => {
    const el = document.getElementById('hall-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
      }`}>

      {/* Hero Banner */}
      <HeroBanner
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onBookHall={scrollToHall}
        onExploreMenu={scrollToMenu}
        isDarkMode={isDarkMode}
      />

      {/* Category Pills Selector */}
      <CategorySelector
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isDarkMode={isDarkMode}
        setActiveMode={setActiveMode}
      />

      {/* Featured Dishes Showcase Section */}
      <FeaturedDishes
        selectedCategory={selectedCategory}
        isDarkMode={isDarkMode}
        onViewMore={() => {
          if (setActiveMode) setActiveMode('menu')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {/* Function Hall & Venue Showcase */}
      <FunctionHallShowcase isDarkMode={isDarkMode} />

      {/* How It Works Section */}
      <section className={`py-12 border-t transition-colors duration-300 ${isDarkMode ? 'bg-[#071A3D] border-slate-700' : 'bg-white border-gray-300'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#C8102E] uppercase tracking-wider bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full">
              Easy Ordering Process
            </span>
            <h2 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${isDarkMode ? 'text-white' : 'text-[#071A3D]'
              }`}>
              How Ordering & Booking Works
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
              Simple 3-step process to enjoy delicious meals or host your dream event
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className={`p-6 rounded-xl text-center space-y-3 border relative group hover:shadow-md transition duration-300 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="w-14 h-14 bg-[#C8102E] text-white rounded-xl flex items-center justify-center text-2xl mx-auto font-bold shadow-xs group-hover:scale-105 transition">
                1
              </div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                Select Menu or Venue
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Choose from our party trays, solo bentos, buffet packages, or function hall reservation options.
              </p>
            </div>

            <div className={`p-6 rounded-xl text-center space-y-3 border relative group hover:shadow-md transition duration-300 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="w-14 h-14 bg-[#071A3D] border border-slate-600 text-white rounded-xl flex items-center justify-center text-2xl mx-auto font-bold shadow-xs group-hover:scale-105 transition">
                2
              </div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                Customize & Checkout
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Add special requests, choose serving sizes, and specify pickup time or venue event details.
              </p>
            </div>

            <div className={`p-6 rounded-xl text-center space-y-3 border relative group hover:shadow-md transition duration-300 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="w-14 h-14 bg-[#F59E0B] text-[#071A3D] rounded-xl flex items-center justify-center text-2xl mx-auto font-bold shadow-xs group-hover:scale-105 transition">
                3
              </div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                Counter Pickup & Event Setup
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Our kitchen team prepares your food hot and fresh, ready for counter pickup or set up in our function hall!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className={`py-12 border-t transition-colors duration-300 ${isDarkMode ? 'bg-[#040D21] border-slate-700' : 'bg-gray-50 border-gray-300'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>
                Loved by Hungry Diners & Event Hosts
              </h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Read real ratings & reviews from our customers in Metro Manila
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-xs text-xs font-bold ${isDarkMode ? 'bg-[#0B1B36] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
              }`}>
              <span className="flex text-[#F59E0B]">
                <span className="material-icons text-sm">star</span>
                <span className="material-icons text-sm">star</span>
                <span className="material-icons text-sm">star</span>
                <span className="material-icons text-sm">star</span>
                <span className="material-icons text-sm">star</span>
              </span>
              <span>4.9 / 5.0 Average Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl shadow-xs border space-y-3 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="flex items-center justify-between">
                <span className="flex text-[#F59E0B]">
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                </span>
                <span className="text-[10px] text-gray-400">2 days ago</span>
              </div>
              <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                "We ordered the Grand Fiesta Catering Buffet for my daughter's 18th debut at Jo's Diner Function Hall. The Lechon Kawali was super crispy and the staff were so accommodating!"
              </p>
              <div className={`flex items-center gap-3 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white font-bold flex items-center justify-center text-xs">
                  C
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>Corazon Dela Cruz</h4>
                  <p className="text-[10px] text-gray-400">Quezon City</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-xs border space-y-3 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="flex items-center justify-between">
                <span className="flex text-[#F59E0B]">
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                </span>
                <span className="text-[10px] text-gray-400">1 week ago</span>
              </div>
              <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                "Super fast pickup for our office lunch party! The Pork Sisig tray and Pancit Canton were prepared piping hot at the counter. Highly recommended dining in Polomolok!"
              </p>
              <div className={`flex items-center gap-3 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="w-8 h-8 rounded-full bg-[#071A3D] text-white font-bold flex items-center justify-center text-xs border border-white/20">
                  M
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>Mark Anthony Reyes</h4>
                  <p className="text-[10px] text-gray-400">Polomolok, South Cotabato</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-xs border space-y-3 ${isDarkMode ? 'bg-[#0B1B36] border-slate-700' : 'bg-white border-gray-300'
              }`}>
              <div className="flex items-center justify-between">
                <span className="flex text-[#F59E0B]">
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                  <span className="material-icons text-sm">star</span>
                </span>
                <span className="text-[10px] text-gray-400">2 weeks ago</span>
              </div>
              <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                "The function hall sound system and stage lighting made our company year-end party a huge success. Food was generous and delicious!"
              </p>
              <div className={`flex items-center gap-3 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#071A3D] font-bold flex items-center justify-center text-xs">
                  J
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#071A3D]'}`}>Jennifer Lim</h4>
                  <p className="text-[10px] text-gray-400">Mandaluyong City</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

export default CustomerHome
