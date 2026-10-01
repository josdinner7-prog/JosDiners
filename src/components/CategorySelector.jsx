import { useState, useRef, useEffect } from 'react'

const ACTION_CARDS = [
  {
    id: 'all',
    title: 'Order Food',
    desc: 'Order solo meals, group meals, party trays and more.',
    actionText: 'Order Now',
    icon: 'restaurant',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'reservations',
    title: 'Reserve a Table',
    desc: 'Book a table for dine-in and enjoy your favorite meals.',
    actionText: 'Reserve Now',
    icon: 'event_available',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'venue',
    title: 'Function Halls',
    desc: 'Browse our halls and check availability for your event.',
    actionText: 'View Halls',
    icon: 'corporate_fare',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'catering',
    title: 'Catering Packages',
    desc: 'Choose from our packages perfect for any occasion.',
    actionText: 'View Packages',
    icon: 'bento',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'party-trays',
    title: 'Party Trays & Bentos',
    desc: 'Perfect for parties, meetings, and special gatherings.',
    actionText: 'See Options',
    icon: 'takeout_dining',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'drinks-desserts',
    title: 'Desserts & Drinks',
    desc: 'Complete your meal with our desserts and refreshing drinks.',
    actionText: 'Browse Menu',
    icon: 'local_cafe',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  },
]

// Multi-set buffer for endless forward continuous carousel
const MULTI_CARDS = [...ACTION_CARDS, ...ACTION_CARDS, ...ACTION_CARDS, ...ACTION_CARDS, ...ACTION_CARDS]

function CategorySelector({ selectedCategory, setSelectedCategory, isDarkMode, setActiveMode }) {
  const scrollContainerRef = useRef(null)

  // Initialize scroll position at set 3 (middle)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current
      const firstCard = el.children[0]
      const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 240
      const singleSetWidth = cardWidth * ACTION_CARDS.length
      if (singleSetWidth > 0) {
        el.scrollLeft = singleSetWidth * 2
      }
    }
  }, [])

  // Continuous slow-motion auto-spin interval timer
  useEffect(() => {
    const timer = setInterval(() => {
      handleScroll('right')
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return
    const el = scrollContainerRef.current
    const firstCard = el.children[0]
    const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 240
    const singleSetWidth = cardWidth * ACTION_CARDS.length

    if (direction === 'right') {
      // If we are reaching set 4, instantly snap back 1 set silently without animation
      if (el.scrollLeft >= singleSetWidth * 3) {
        el.style.scrollBehavior = 'auto'
        el.scrollLeft = el.scrollLeft - singleSetWidth
        void el.offsetHeight
      }
      // Smoothly advance 1 card width forward
      el.style.scrollBehavior = 'smooth'
      el.scrollBy({ left: cardWidth, behavior: 'smooth' })
    } else {
      // If we are reaching set 1, instantly snap forward 1 set silently without animation
      if (el.scrollLeft <= singleSetWidth) {
        el.style.scrollBehavior = 'auto'
        el.scrollLeft = el.scrollLeft + singleSetWidth
        void el.offsetHeight
      }
      // Smoothly slide 1 card width backward
      el.style.scrollBehavior = 'smooth'
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }

  const handleCardClick = (cardId) => {
    if (cardId === 'reservations') {
      if (setActiveMode) setActiveMode('reservations')
      const el = document.getElementById('hall-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else if (cardId === 'venue') {
      if (setActiveMode) setActiveMode('hall')
      const el = document.getElementById('hall-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      setSelectedCategory(cardId)
      const el = document.getElementById('menu-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className={`py-10 border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#040D21] border-slate-800 text-white' 
        : 'bg-white border-gray-200 text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#071A3D]'
            }`}>
              What would you like to do?
            </h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-500'
            }`}>
              Explore our offerings and book with ease.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCategory('all')
              const el = document.getElementById('menu-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#C8102E] transition self-start sm:self-auto group cursor-pointer"
          >
            <span className="group-hover:underline">View All Categories</span>
            <span className="material-icons text-base transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>

        {/* Seamless Infinite Continuous Carousel Container */}
        <div className="relative group/carousel">
          {/* Side Left Previous Button */}
          <button
            onClick={() => handleScroll('left')}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#071A3D] text-[#071A3D] dark:text-white hover:bg-[#C8102E] hover:text-white border border-gray-300 dark:border-slate-700 shadow-xl flex items-center justify-center transition transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Previous Categories"
          >
            <span className="material-icons text-xl sm:text-2xl">chevron_left</span>
          </button>

          {/* Side Right Next Button */}
          <button
            onClick={() => handleScroll('right')}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#071A3D] text-[#071A3D] dark:text-white hover:bg-[#C8102E] hover:text-white border border-gray-300 dark:border-slate-700 shadow-xl flex items-center justify-center transition transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Next Categories"
          >
            <span className="material-icons text-xl sm:text-2xl">chevron_right</span>
          </button>

          {/* Continuous Track */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth px-1"
          >
            {MULTI_CARDS.map((card, index) => {
              const isSelected = selectedCategory === card.id
              return (
                <div
                  key={`${card.id}-${index}`}
                  onClick={() => handleCardClick(card.id)}
                  className={`group min-w-[190px] sm:min-w-[210px] md:min-w-[225px] max-w-[240px] shrink-0 rounded-xl overflow-hidden border transition duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 ${
                    isSelected
                      ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20 shadow-md'
                      : isDarkMode 
                        ? 'bg-[#0B1B36] border-slate-700 hover:border-slate-500 hover:shadow-lg' 
                        : 'bg-white border-gray-300 hover:border-gray-400 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Image Container with Floating Icon (Not Clipped) */}
                  <div className="relative">
                    <div className="h-32 sm:h-36 overflow-hidden bg-gray-100 border-b border-gray-200 dark:border-slate-700">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    {/* Floating Circle Icon - Centered on Border */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white dark:bg-[#071A3D] shadow-md border border-gray-300 dark:border-slate-600 flex items-center justify-center text-[#C8102E] z-10">
                      <span className="material-icons text-base">{card.icon}</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-3.5 pt-5 text-center flex flex-col flex-1 justify-between space-y-2">
                    <div>
                      <h3 className={`font-extrabold text-sm sm:text-base leading-tight ${
                        isDarkMode ? 'text-white' : 'text-[#071A3D]'
                      }`}>
                        {card.title}
                      </h3>
                      <p className={`text-xs leading-relaxed mt-1.5 line-clamp-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {card.desc}
                      </p>
                    </div>

                    {/* Action Link */}
                    <div className="pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#C8102E]">
                        <span className="group-hover:underline">{card.actionText}</span>
                        <span className="material-icons text-sm transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}

export default CategorySelector
