import { useState } from 'react'
import VenueBookingModal from './VenueBookingModal'

function FunctionHallShowcase({ isDarkMode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const amenities = [
    { icon: 'ac_unit', title: 'Fully Air-Conditioned', desc: 'Climate-controlled seating for up to 180 guests' },
    { icon: 'volume_up', title: 'Pro Sound & Stage', desc: 'Wireless mics, stage lighting, & backdrop setup' },
    { icon: 'bento', title: 'Integrated Catering', desc: 'In-hall buffet setup with full server staff' },
    { icon: 'local_parking', title: 'Ample Parking', desc: 'Secure parking space for all your guests' },
  ]

  return (
    <section id="hall-section" className={`py-12 md:py-16 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] border-t border-slate-800' : 'bg-[#F8FAFC] border-t border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Showcase Card */}
        <div className="bg-[#071A3D] rounded-xl p-6 sm:p-8 lg:p-10 text-white border border-slate-700 shadow-xl overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
            
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30 text-xs font-black uppercase tracking-wider">
                <span className="material-icons text-sm">corporate_fare</span>
                <span>Jo's Diner Event Venue</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  Host Your Celebrations at <br />
                  <span className="text-[#F59E0B]">Jo's Diner Function Hall</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl font-medium">
                  Looking for the perfect venue for your wedding, debut, birthday party, or corporate banquet? Our modern, fully-equipped Function Hall combined with famous catering menus guarantees an unforgettable event in Polomolok!
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {amenities.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white/5 hover:bg-white/10 p-3.5 rounded-xl border border-white/10 shadow-xs transition duration-300"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30 flex items-center justify-center shrink-0">
                      <span className="material-icons text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                      <p className="text-[11px] text-gray-300 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar & Direct Phone Inquiry */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3 border-t border-slate-700/80">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-6 py-3 rounded-lg font-extrabold text-xs sm:text-sm shadow-md transition transform active:scale-95 text-center flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Book Function Hall Now</span>
                  <span className="material-icons text-base group-hover:translate-x-1 transition">arrow_forward</span>
                </button>

                <div className="text-xs text-gray-300 flex items-center gap-2 justify-center sm:justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#F59E0B] shrink-0">
                    <span className="material-icons text-sm">phone</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Direct Inquiry Hotline</span>
                    <a href="tel:09103793664" className="font-extrabold text-white hover:text-[#F59E0B] transition">
                      0910 379 3664
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Photo Gallery Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="group relative rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80"
                    alt="Function Hall Setup"
                    className="w-full h-40 sm:h-44 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-3 flex items-end">
                    <span className="text-[11px] font-bold text-white">Grand Dining Layout</span>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80"
                    alt="Dining Table Decor"
                    className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-3 flex items-end">
                    <span className="text-[11px] font-bold text-white">Table Setting & Floral Decor</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3">
                <div className="group relative rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80"
                    alt="Event Stage"
                    className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-3 flex items-end">
                    <span className="text-[11px] font-bold text-white">Stage & AV Setup</span>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80"
                    alt="Buffet Line"
                    className="w-full h-40 sm:h-44 object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-3 flex items-end">
                    <span className="text-[11px] font-bold text-white">In-Hall Buffet Spread</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <VenueBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}

export default FunctionHallShowcase
