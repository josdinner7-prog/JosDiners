function PromotionsCarousel({ onSelectPromo, isDarkMode }) {
  const deals = [
    {
      id: 1,
      tag: 'POPULAR DEAL',
      title: '20% OFF Catering Buffets',
      subtitle: 'For bookings with 50+ guests. Includes free setup & waiter service!',
      code: 'CATER20',
      bgColor: 'bg-[#C8102E] border border-[#C8102E]',
      textColor: 'text-white',
      badgeBg: 'bg-[#F59E0B] text-[#071A3D]',
      icon: 'celebration',
    },
    {
      id: 2,
      tag: 'SPECIAL OFFER',
      title: 'Free Beverage Tower',
      subtitle: 'Order 2 or more Party Trays and get a 10L Iced Tea Tower free!',
      code: 'FREEFESTIVE',
      bgColor: isDarkMode ? 'bg-[#0B1B36] border border-slate-700' : 'bg-[#071A3D] border border-[#071A3D]',
      textColor: 'text-white',
      badgeBg: 'bg-[#C8102E] text-white',
      icon: 'local_bar',
    },
    {
      id: 3,
      tag: 'VENUE BONUS',
      title: 'Free Stage & Light Setup',
      subtitle: 'Book Jo\'s Diner Function Hall for 4+ hours and enjoy free lights & AV setup.',
      code: 'HALLSPECIAL',
      bgColor: isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-300',
      textColor: isDarkMode ? 'text-white' : 'text-[#071A3D]',
      badgeBg: 'bg-[#071A3D] text-white',
      icon: 'workspace_premium',
    },
  ]

  return (
    <section className={`py-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21]' : 'bg-gray-50 border-y border-gray-300'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-icons text-xl text-[#C8102E]">local_offer</span>
            <div>
              <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-[#071A3D]'
              }`}>
                Exclusive Deals & Promo Vouchers
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Apply these codes at checkout to enjoy discounts on your order!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className={`relative ${deal.bgColor} rounded-xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${deal.badgeBg}`}>
                    {deal.tag}
                  </span>
                  <span className={`material-icons text-2xl ${deal.id === 3 && !isDarkMode ? 'text-[#C8102E]' : 'text-white'}`}>
                    {deal.icon}
                  </span>
                </div>

                <h3 className={`text-lg font-bold mb-1.5 leading-snug ${deal.textColor}`}>
                  {deal.title}
                </h3>
                <p className={`text-xs leading-relaxed mb-4 ${deal.id === 3 && !isDarkMode ? 'text-gray-600' : 'text-gray-200'}`}>
                  {deal.subtitle}
                </p>
              </div>

              <div className={`flex items-center justify-between pt-3 border-t ${
                deal.id === 3 ? isDarkMode ? 'border-slate-700' : 'border-gray-300' : 'border-white/20'
              }`}>
                <div className={`${
                  deal.id === 3 
                    ? isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300' 
                    : 'bg-black/30 border-white/20'
                } px-3 py-1.5 rounded-lg border`}>
                  <span className={`text-[10px] block ${deal.id === 3 && !isDarkMode ? 'text-gray-500' : 'text-gray-300'}`}>CODE:</span>
                  <span className={`text-xs font-mono font-bold tracking-wider ${deal.id === 3 ? 'text-[#C8102E]' : 'text-[#F59E0B]'}`}>
                    {deal.code}
                  </span>
                </div>
                <button
                  onClick={() => onSelectPromo(deal.code)}
                  className={`${
                    deal.id === 3
                      ? 'bg-[#C8102E] text-white hover:bg-[#9B0B21]'
                      : 'bg-white text-[#071A3D] hover:bg-gray-100'
                  } px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition active:scale-95`}
                >
                  Use Voucher
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default PromotionsCarousel
