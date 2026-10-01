import React, { useState, useRef } from 'react'
import logo from '../assets/logo.png'
import { useToast } from './ToastNotification'

function BanquetEventOrderModal({
  isOpen,
  onClose,
  booking,
  isDarkMode = false,
  onUpdateBEO
}) {
  const { showToast } = useToast()
  const printRef = useRef(null)

  // Normalize BEO data from booking/reservation object
  const initialBEO = {
    beoNumber: booking?.beo_number || `BEO-2026-${booking?.booking_code || booking?.id || Math.floor(1000 + Math.random() * 9000)}`,
    eventTitle: booking?.event_title || booking?.package_name || booking?.event_name || 'Executive Banquet & Catering Event',
    eventType: booking?.event_type || 'Catering & Banquet',
    clientName: booking?.customer_name || booking?.contact_name || 'Guest Client',
    clientPhone: booking?.phone || booking?.customer_phone || booking?.contact_phone || 'N/A',
    clientEmail: booking?.email || booking?.customer_email || 'N/A',
    eventDate: booking?.event_date || new Date().toISOString().split('T')[0],
    dispatchTime: booking?.dispatch_time || '09:00 AM',
    setupTime: booking?.setup_time || '10:00 AM',
    serviceTime: booking?.service_time || booking?.event_time || '11:30 AM - 02:30 PM',
    breakdownTime: booking?.breakdown_time || '03:30 PM',
    venueName: booking?.event_venue || booking?.hall_name || 'Main Function Hall / Client Venue',
    venueAddress: booking?.venue_address || 'Jo\'s Diner Grand Ballroom & Event Grounds',
    guestCount: parseInt(booking?.guests || booking?.guest_count || 50, 10),
    guaranteedPax: parseInt(booking?.guests || booking?.guest_count || 50, 10),
    packageName: booking?.package_name || 'Signature Banquet Package',
    serviceStyle: booking?.service_style || 'Buffet with Chafing Stations & Service Crew',
    headChef: booking?.assigned_chef || 'Chef Eduardo (Executive Head Chef)',
    banquetCaptain: booking?.banquet_captain || 'Captain Marco Santos (Lead Coordinator)',
    serviceStaff: booking?.assigned_crew || '4x Waiters, 2x Buffet Attendants, 1x Driver Logistics',
    equipment: booking?.equipment || '4x Roll-Top Chafing Trays, 2x Beverage Dispensers, 60x Dinnerware Sets, Warmers',
    totalAmount: parseFloat(booking?.total_amount || booking?.total_quote || 35000),
    depositPaid: parseFloat(booking?.deposit_paid || booking?.deposit || 10000),
    balanceDue: parseFloat((booking?.total_amount || booking?.total_quote || 35000) - (booking?.deposit_paid || booking?.deposit || 10000)),
    status: booking?.status || 'Confirmed',
    menuCourses: booking?.selected_dishes ? (
      typeof booking.selected_dishes === 'string' ? JSON.parse(booking.selected_dishes || '[]') : booking.selected_dishes
    ) : [
      { category: 'Appetizer', dish: 'Crispy Lumpiang Shanghai with Sweet Chili Dip', qty: '60 pcs' },
      { category: 'Main Protein 1', dish: 'Slow-Roasted Beef with Mushroom Gravy Carvery', qty: '55 Servings' },
      { category: 'Main Protein 2', dish: 'Crispy Lechon Belly with Liver Sauce', qty: '55 Servings' },
      { category: 'Pasta / Noodles', dish: 'Creamy Seafood Carbonara Platter', qty: '3 Large Bilao' },
      { category: 'Vegetable / Side', dish: 'Buttered Garden Vegetables with Almonds', qty: '55 Servings' },
      { category: 'Dessert', dish: 'Creamy Buko Pandan Salad & Fresh Fruits', qty: '55 Cups' },
      { category: 'Beverage Station', dish: 'Signature Red Iced Tea & Brewed Highland Coffee', qty: 'Bottomless (30L)' }
    ],
    dietaryNotes: booking?.special_requests || 'No peanuts on table 02. Ensure 5 vegetarian boxed portions.',
    tableArrangement: '5x Round Tables (10-seater), 1x Head VIP Table, 1x 12ft Double-Sided Buffet Line',
    linenColorTheme: 'Burgundy Crimson & Champagne Gold Napkins'
  }

  const [beoData, setBeoData] = useState(initialBEO)
  const [isEditing, setIsEditing] = useState(false)

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleCopySummary = () => {
    const summaryText = `
📋 BANQUET EVENT ORDER (BEO): #${beoData.beoNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event: ${beoData.eventTitle} (${beoData.eventType})
Client: ${beoData.clientName} | 📞 ${beoData.clientPhone}
Date: ${beoData.eventDate} | Service: ${beoData.serviceTime}
Venue: ${beoData.venueName} - ${beoData.venueAddress}
Guaranteed Pax: ${beoData.guaranteedPax} Guests
Service Style: ${beoData.serviceStyle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍🍳 Head Chef: ${beoData.headChef}
👔 Banquet Captain: ${beoData.banquetCaptain}
🚚 Staff & Logistics: ${beoData.serviceStaff}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ Menu Highlights:
${Array.isArray(beoData.menuCourses) ? beoData.menuCourses.map(c => `• [${c.category || 'Dish'}] ${c.dish || c.name || c} (${c.qty || 'Standard'})`).join('\n') : 'Chef Curated Menu'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Dietary / Special Instructions:
${beoData.dietaryNotes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total: ₱${beoData.totalAmount.toLocaleString()} | Balance Due: ₱${beoData.balanceDue.toLocaleString()}
Status: ${beoData.status.toUpperCase()}
    `.trim()

    navigator.clipboard.writeText(summaryText)
    showToast('📋 BEO Shift Summary copied to clipboard!', 'success')
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    setIsEditing(false)
    if (onUpdateBEO) onUpdateBEO(beoData)
    showToast('BEO details updated successfully!', 'success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-xl shadow-2xl border overflow-hidden max-h-[94vh] flex flex-col my-auto transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B132B] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        
        {/* TOP MODAL ACTION BAR (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black shadow-xs">
              <span className="material-icons text-lg">fact_check</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight">Banquet Event Order (BEO)</h3>
                <span className="font-mono text-xs text-amber-300 font-bold">#{beoData.beoNumber}</span>
              </div>
              <p className="text-[11px] text-slate-400">Official Catering Operations &amp; Kitchen Production Sheet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <span className="material-icons text-sm">{isEditing ? 'visibility' : 'edit'}</span>
              <span>{isEditing ? 'View Sheet' : 'Edit Specs'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Copy Summary to Clipboard"
            >
              <span className="material-icons text-sm">content_copy</span>
              <span className="hidden sm:inline">Copy Text</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-red-700"
            >
              <span className="material-icons text-sm">print</span>
              <span>Print BEO</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <span className="material-icons text-base">close</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (Printable Document Area) */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50 dark:bg-[#071A3D]/40">

          {isEditing ? (
            /* EDITABLE FORM MODE */
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 space-y-3">
                <span className="font-extrabold text-[#C8102E] uppercase text-[11px] block">1. Event Logistics &amp; Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Event Title</label>
                    <input
                      type="text"
                      value={beoData.eventTitle}
                      onChange={(e) => setBeoData({ ...beoData, eventTitle: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Dispatch Time</label>
                    <input
                      type="text"
                      value={beoData.dispatchTime}
                      onChange={(e) => setBeoData({ ...beoData, dispatchTime: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Service Serving Window</label>
                    <input
                      type="text"
                      value={beoData.serviceTime}
                      onChange={(e) => setBeoData({ ...beoData, serviceTime: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Venue &amp; Exact Address</label>
                    <input
                      type="text"
                      value={beoData.venueAddress}
                      onChange={(e) => setBeoData({ ...beoData, venueAddress: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Guaranteed Guest Count (Pax)</label>
                    <input
                      type="number"
                      value={beoData.guaranteedPax}
                      onChange={(e) => setBeoData({ ...beoData, guaranteedPax: parseInt(e.target.value, 10) || 0 })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 space-y-3">
                <span className="font-extrabold text-[#C8102E] uppercase text-[11px] block">2. Crew &amp; Staff Assignments</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Head Chef in Charge</label>
                    <input
                      type="text"
                      value={beoData.headChef}
                      onChange={(e) => setBeoData({ ...beoData, headChef: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Banquet Captain (Lead)</label>
                    <input
                      type="text"
                      value={beoData.banquetCaptain}
                      onChange={(e) => setBeoData({ ...beoData, banquetCaptain: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase">Assigned Service Staff</label>
                    <input
                      type="text"
                      value={beoData.serviceStaff}
                      onChange={(e) => setBeoData({ ...beoData, serviceStaff: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase">Dietary Notes &amp; Kitchen Alerts</label>
                  <textarea
                    rows={2}
                    value={beoData.dietaryNotes}
                    onChange={(e) => setBeoData({ ...beoData, dietaryNotes: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] text-white font-extrabold text-xs shadow-xs"
                >
                  Save BEO Specs
                </button>
              </div>
            </form>
          ) : (
            /* OFFICIAL BEO DOCUMENT VIEW */
            <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-lg border border-slate-300 shadow-sm space-y-6 font-sans">
              
              {/* BEO HEADER */}
              <div className="border-b-2 border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={logo} alt="Jo's Diner" className="h-12 w-12 object-contain" />
                    <div>
                      <h1 className="jos-diner-brand-title text-xl font-black !text-[#071A3D] tracking-tight uppercase leading-none">
                        JO'S DINER CATERING SERVICES
                      </h1>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        BANQUET EVENT ORDER &bull; PRODUCTION SPECIFICATION SHEET
                      </p>
                      <p className="text-[9px] text-slate-400">Jo's Diner Complex, Tel: (02) 8555-0199 | catering@josdiner.com.ph</p>
                    </div>
                  </div>

                  <div className="text-right border-l-2 border-slate-200 pl-4">
                    <div className="bg-[#C8102E] text-white text-[11px] font-black px-3 py-1 rounded font-mono uppercase inline-block">
                      {beoData.beoNumber}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">Date Issued: {new Date().toISOString().split('T')[0]}</p>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block mt-0.5">
                      Status: {beoData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: EVENT OVERVIEW & CLIENT CONTACT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/70">
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block border-b pb-1 border-slate-200">
                    Client &amp; Booking Contact
                  </span>
                  <div className="space-y-1">
                    <p><strong>Client / Host:</strong> {beoData.clientName}</p>
                    <p><strong>Telephone / Mobile:</strong> {beoData.clientPhone}</p>
                    <p><strong>Email Address:</strong> {beoData.clientEmail}</p>
                    <p><strong>Billing Settlement:</strong> Deposit ₱{beoData.depositPaid.toLocaleString()} | Balance ₱{beoData.balanceDue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/70">
                  <span className="text-[10px] font-black uppercase text-[#C8102E] tracking-wider block border-b pb-1 border-slate-200">
                    Event Schedule &amp; Venue
                  </span>
                  <div className="space-y-1">
                    <p><strong>Event Title:</strong> {beoData.eventTitle} ({beoData.eventType})</p>
                    <p><strong>Event Date:</strong> <span className="font-bold text-[#C8102E]">{beoData.eventDate}</span></p>
                    <p><strong>Service Serving Window:</strong> <span className="font-bold text-slate-900">{beoData.serviceTime}</span></p>
                    <p><strong>Venue Location:</strong> {beoData.venueName} - {beoData.venueAddress}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCTION TIMELINE */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-800 text-white font-extrabold text-[11px] px-3.5 py-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-icons text-sm">schedule</span>
                  <span>Logistics &amp; Service Timeline</span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-slate-200 text-center p-2.5 bg-white font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Kitchen Dispatch</span>
                    <span className="font-extrabold text-slate-800">{beoData.dispatchTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Venue Setup</span>
                    <span className="font-extrabold text-slate-800">{beoData.setupTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Buffet Open / Serving</span>
                    <span className="font-black text-[#C8102E]">{beoData.serviceTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Breakdown &amp; Return</span>
                    <span className="font-extrabold text-slate-800">{beoData.breakdownTime}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MENU REQUIREMENTS & KITCHEN SPECIFICATIONS */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-800 text-white font-extrabold text-[11px] px-3.5 py-1.5 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-sm">restaurant</span>
                    <span>Menu Requirements &amp; Food Production Breakdown</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300">Guaranteed: {beoData.guaranteedPax} Pax</span>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-slate-600">
                      <th className="py-2 px-3">Course / Station</th>
                      <th className="py-2 px-3">Selected Dish Item</th>
                      <th className="py-2 px-3 text-right">Production Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Array.isArray(beoData.menuCourses) && beoData.menuCourses.length > 0 ? (
                      beoData.menuCourses.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-extrabold text-slate-600 uppercase text-[10px]">
                            {c.category || `Course ${i + 1}`}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {c.dish || c.name || c}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-600 text-[11px]">
                            {c.qty || `${beoData.guaranteedPax} Servings`}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-center text-slate-500 italic">
                          Standard Chef Curated Catering Menu Set
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SECTION 4: DIETARY ALERTS & SPECIAL INSTRUCTIONS */}
              <div className="border border-amber-300 bg-amber-50/60 rounded-lg p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold uppercase text-[10px]">
                  <span className="material-icons text-sm text-amber-700">warning</span>
                  <span>Kitchen Allergen Alerts &amp; Setup Notes:</span>
                </div>
                <p className="text-amber-950 font-semibold">{beoData.dietaryNotes || 'No special dietary restrictions specified. Standard hygiene & thermal storage guidelines apply.'}</p>
              </div>

              {/* SECTION 5: ROSTER & EQUIPMENT CHECKLIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/70">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block border-b pb-1 border-slate-200">
                    Assigned Personnel Roster
                  </span>
                  <div className="space-y-1">
                    <p>👨‍🍳 <strong>Executive Chef:</strong> {beoData.headChef}</p>
                    <p>👔 <strong>Banquet Captain:</strong> {beoData.banquetCaptain}</p>
                    <p>🚚 <strong>Service &amp; Transport Crew:</strong> {beoData.serviceStaff}</p>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/70">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block border-b pb-1 border-slate-200">
                    Equipment &amp; Room Setup
                  </span>
                  <div className="space-y-1">
                    <p>📦 <strong>Equipment:</strong> {beoData.equipment}</p>
                    <p>🪑 <strong>Room Layout:</strong> {beoData.tableArrangement}</p>
                    <p>🎨 <strong>Linen Color Theme:</strong> {beoData.linenColorTheme}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 6: SIGN-OFF & APPROVAL BLOCKS */}
              <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-[10px] text-center">
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <p className="font-bold text-slate-800">Banquet Coordinator / Captain</p>
                  <p className="text-slate-400">Date &amp; Signature</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <p className="font-bold text-slate-800">Executive Head Chef</p>
                  <p className="text-slate-400">Kitchen Sign-off</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <p className="font-bold text-slate-800">Client / Event Host</p>
                  <p className="text-slate-400">Acknowledgment &amp; Receipt</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER BAR (Hidden in Print) */}
        <div className="px-6 py-3 border-t flex items-center justify-between bg-slate-100 dark:bg-slate-900 text-xs print:hidden">
          <span className="text-slate-500 font-medium">
            Authorized Catering Personnel Access Only &bull; Jo's Diner Operations
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

export default BanquetEventOrderModal
