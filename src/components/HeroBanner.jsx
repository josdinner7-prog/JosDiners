import logo from '../assets/logo.png'

function HeroBanner({ activeMode, setActiveMode, onBookHall, onExploreMenu, isDarkMode }) {
  return (
    <section className={`py-8 sm:py-12 md:py-16 border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#040D21] border-slate-800 text-white' 
        : 'bg-[#F8FAFC] border-gray-200 text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Responsive Headline & Search Bar */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-6 text-center lg:text-left">
            
            <h1 className={`text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight px-1 sm:px-0 ${
              isDarkMode ? 'text-white' : 'text-[#071A3D]'
            }`}>
              Delicious Food & Catering <br className="hidden xs:inline" />
              <span className="text-[#C8102E]">Prepared Fresh For You</span>
            </h1>

            <p className={`text-xs sm:text-sm max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed px-2 sm:px-0 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Order fresh party trays, solo bentos for counter pickup, or book our Function Hall for your next event.
            </p>

            {/* Address / Search Bar (Responsive rounded container) */}
            <div className={`p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-md border flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto lg:mx-0 transition-colors ${
              isDarkMode 
                ? 'bg-[#071A3D] border-slate-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="relative flex-1 w-full pl-2 sm:pl-3 flex items-center gap-2">
                <span className="material-icons text-[#C8102E] text-lg sm:text-xl shrink-0">search</span>
                <input
                  type="text"
                  placeholder="Search dishes, party trays, or venue inquiry..."
                  className={`w-full py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-gray-400 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                />
              </div>
              <button
                onClick={activeMode === 'hall' ? onBookHall : onExploreMenu}
                className="w-full sm:w-auto px-5 sm:px-7 py-2.5 sm:py-3 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-xl sm:rounded-full font-extrabold text-xs sm:text-sm shadow transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <span>Find Food</span>
                <span className="material-icons text-base">arrow_forward</span>
              </button>
            </div>

          </div>

          {/* Right Column: Responsive Hero Logo */}
          <div className="lg:col-span-5 flex justify-center items-center pt-1 lg:pt-0">
            <div className="relative w-44 h-44 xs:w-52 xs:h-52 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
              <img 
                src={logo} 
                alt="Jo's Diner Logo" 
                className="w-full h-full object-contain filter drop-shadow-md transform hover:scale-105 transition duration-300"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default HeroBanner
