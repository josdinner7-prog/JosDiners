import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Default fallback data if tables are initially empty
const FALLBACK_DISHES = [
  { name: "Jo's Special Lechon Kawali", category: "Pork Specialties", price: 380.00, description: "Crispy deep-fried pork belly served with homemade spiced liver sauce.", availability: "Available" },
  { name: "Chicken Inasal Supreme", category: "Chicken & Poultry", price: 245.00, description: "Charcoal-grilled marinated quarter chicken basted with annatto garlic oil.", availability: "Available" },
  { name: "Beef Kare-Kare Fiesta Tray", category: "Beef & Oxtail", price: 580.00, description: "Tender beef shank and tripe in rich savory peanut sauce with native bagoong.", availability: "Available" },
  { name: "Crispy Pata Special", category: "Pork Specialties", price: 850.00, description: "Whole pork knuckle deep-fried to golden crackling perfection.", availability: "Available" },
  { name: "Classic Leche Flan Slice", category: "Desserts", price: 95.00, description: "Velvety smooth caramel custard baked with fresh farm eggs.", availability: "Available" },
  { name: "Lumpiang Shanghai (12 Pcs)", category: "Appetizers", price: 220.00, description: "Golden crispy pork egg rolls served with sweet chili dipping sauce.", availability: "Available" }
]

const FALLBACK_HALLS = [
  { hall_name: 'Grand Diamond Ballroom', capacity: 300, hourly_rate: 3500.00, location: '2nd Floor, Main Wing', description: 'Premier banquet venue with crystal chandeliers, stage, and full acoustic treatment.' },
  { hall_name: 'Emerald Garden Pavilion', capacity: 150, hourly_rate: 2500.00, location: 'Ground Floor, Garden Courtyard', description: 'Indoor-outdoor glass pavilion surrounded by lush landscape.' },
  { hall_name: 'Sapphire VIP Dining Hall', capacity: 80, hourly_rate: 1800.00, location: '1st Floor, East Wing', description: 'Sophisticated private venue for seminars, board meetings, and intimate banquets.' }
]

const FALLBACK_PACKAGES = [
  { package_name: 'Fiesta Family Tray Package', package_price: 32000.00, min_guests: 30, max_guests: 60, price_per_person: 533.00, description: 'Complete party tray buffet with Lechon Kawali, Chicken Inasal, and desserts.' },
  { package_name: 'Executive Lechon & Kare-Kare Tray Package', package_price: 88000.00, min_guests: 80, max_guests: 150, price_per_person: 733.00, description: 'Grand catering package with live carving station, tableware setup, and staff servers.' }
]

// -----------------------------------------------------------------------------
// 1. GET /api/ai/system-context (or /api/ai/knowledge)
// Exports the live database state as clean Markdown + JSON for Claudine AI / Tuqlas Knowledge Base
// -----------------------------------------------------------------------------
router.get('/system-context', async (req, res) => {
  try {
    let dishes = FALLBACK_DISHES
    let halls = FALLBACK_HALLS
    let packages = FALLBACK_PACKAGES

    try {
      const [menuRows] = await pool.query('SELECT name, price, description, availability FROM menu_items WHERE status = "Active"')
      if (menuRows && menuRows.length > 0) dishes = menuRows
    } catch (e) {
      console.warn('AI Context: Using fallback dishes')
    }

    try {
      const [hallRows] = await pool.query('SELECT hall_name, capacity, hourly_rate, location, description FROM function_halls')
      if (hallRows && hallRows.length > 0) halls = hallRows
    } catch (e) {
      console.warn('AI Context: Using fallback halls')
    }

    try {
      const [pkgRows] = await pool.query('SELECT package_name, package_price, price_per_person, min_guests, max_guests, description FROM catering_packages')
      if (pkgRows && pkgRows.length > 0) packages = pkgRows
    } catch (e) {
      console.warn('AI Context: Using fallback packages')
    }

    // Generate formatted Markdown document
    const markdownKnowledge = [
      `# Jo's Diner - Official System Knowledge Base for Claudine AI`,
      ``,
      `## 1. Restaurant Overview & Policies`,
      `- **Name**: Jo's Diner - Function Hall & Catering Services`,
      `- **Persona**: You are "Claudine AI", the friendly, polite, and knowledgeable virtual concierge of Jo's Diner.`,
      `- **Operating Hours**: Monday to Sunday, 08:00 AM – 10:00 PM`,
      `- **Phone / Hotlines**: 0917-888-1234 / 0918-777-6655 / (02) 8921-5500`,
      `- **Location**: Main Commercial Strip, Ground & 2nd Floor, Jo's Diner Building, Quezon City`,
      `- **Accepted Payment Methods**: Cash, GCash, Bank Transfer, and Credit/Debit Card`,
      `- **Dining Types**: Dine-in, Takeout / Pickup Counter, Function Hall Private Events, Off-site Catering`,
      `- **Reservation Policy**: A 20% down payment is required to confirm Function Hall and Catering bookings. Walk-in table reservations are free of charge.`,
      ``,
      `## 2. Live Menu Dishes & Pricing (PHP / ₱)`,
      ...dishes.map(d => `- **${d.name}** (₱${parseFloat(d.price || 0).toFixed(2)}) — ${d.description || 'Traditional Filipino specialty'}. Status: ${d.availability || 'Available'}.`),
      ``,
      `## 3. Function Halls & Banquet Venues`,
      ...halls.map(h => `- **${h.hall_name}**: Capacity of up to ${h.capacity} guests. Rental Rate: ₱${parseFloat(h.hourly_rate || 0).toFixed(2)}/hour. Located at ${h.location || 'Main Wing'}. ${h.description || ''}`),
      ``,
      `## 4. Catering Packages`,
      ...packages.map(p => `- **${p.package_name}**: ₱${parseFloat(p.package_price || 0).toFixed(2)} (approx. ₱${parseFloat(p.price_per_person || 500).toFixed(2)}/head, for ${p.min_guests || 20}–${p.max_guests || 100} guests). ${p.description || ''}`),
      ``,
      `## 5. Live Order & Reservation Tracking Instructions`,
      `- Customers can ask you to track their order by giving their Order Number (e.g. \`JOS-849201\` or \`ORD-9823\`).`,
      `- Customers can ask you to check their Reservation by giving their Reservation Code (e.g. \`RES-10492\`).`,
      `- If asked to book or view the full menu, recommend visiting the Menu page (/menu), Function Halls page (/function-halls), or Reservations page (/reservation).`
    ].join('\n')

    res.json({
      status: 'success',
      bot_name: 'Claudine AI',
      knowledge_text: markdownKnowledge,
      stats: {
        dishes_count: dishes.length,
        halls_count: halls.length,
        packages_count: packages.length
      },
      data: {
        dishes,
        halls,
        packages
      }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// Alias
router.get('/knowledge', (req, res) => {
  res.redirect('/api/ai/system-context')
})

// -----------------------------------------------------------------------------
// 2. POST /api/ai/lookup
// Real-time lookup for order status, reservation status, or dish details
// -----------------------------------------------------------------------------
router.post('/lookup', async (req, res) => {
  const { query, type } = req.body
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Lookup query is required' })
  }

  const cleanQuery = query.trim().toUpperCase()

  // Case A: Order Lookup (e.g., JOS-849201, ORD-9823, or numeric ID)
  if (type === 'order' || cleanQuery.startsWith('JOS-') || cleanQuery.startsWith('ORD-') || /^\d{2,6}$/.test(cleanQuery)) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM orders WHERE order_code = ? OR order_id = ? LIMIT 1',
        [cleanQuery, cleanQuery]
      )

      if (rows && rows.length > 0) {
        const order = rows[0]
        let itemsList = []
        try {
          itemsList = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || [])
        } catch (e) { }

        const itemNames = itemsList.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || 'Assorted Jo\'s Diner items'

        return res.json({
          status: 'success',
          found_type: 'order',
          data: {
            order_id: order.order_id,
            order_code: order.order_code || `JOS-${order.order_id}`,
            customer_name: order.customer_name || 'Valued Guest',
            status: order.status || 'Preparing',
            total_amount: parseFloat(order.grand_total || order.total_amount || 0),
            order_type: order.delivery_address?.toLowerCase().includes('takeout') ? 'Takeout' : 'Dine-in',
            destination: order.delivery_address || 'Main Dining Room',
            items_summary: itemNames
          },
          reply: `Order #${order.order_code || order.order_id} for ${order.customer_name || 'Guest'} is currently **${order.status || 'In Progress'}** in our kitchen. Items: ${itemNames}. Total: ₱${parseFloat(order.grand_total || 0).toFixed(2)}.`
        })
      }
    } catch (e) {
      console.warn('AI Lookup Order error:', e.message)
    }
  }

  // Case B: Reservation Lookup (e.g., RES-10492 or numeric ID)
  if (type === 'reservation' || cleanQuery.startsWith('RES-') || /^\d{2,5}$/.test(cleanQuery)) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reservations WHERE reservation_code = ? OR reservation_id = ? LIMIT 1',
        [cleanQuery, cleanQuery]
      )

      if (rows && rows.length > 0) {
        const r = rows[0]
        const dateFormatted = r.event_date ? new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled Date'
        return res.json({
          status: 'success',
          found_type: 'reservation',
          data: {
            reservation_id: r.reservation_id,
            reservation_code: r.reservation_code || `RES-${r.reservation_id}`,
            guest_name: r.contact_name || 'Valued Guest',
            event_type: r.event_type || 'Table Dining',
            hall_name: r.hall_name || 'Main Dining Hall',
            event_date: dateFormatted,
            event_time: r.event_time || '12:00 PM',
            guests: r.guest_count || 2,
            status: r.status || 'Confirmed'
          },
          reply: `Reservation #${r.reservation_code || r.reservation_id} under **${r.contact_name || 'Guest'}** is **${r.status || 'Confirmed'}** for **${r.event_type || 'Dining'}** at **${r.hall_name || 'Jo\'s Diner'}** on ${dateFormatted} at ${r.event_time || '12:00 PM'} (${r.guest_count || 2} Pax).`
        })
      }
    } catch (e) {
      console.warn('AI Lookup Reservation error:', e.message)
    }
  }

  // Case C: Dish Lookup by Name
  try {
    const [dishes] = await pool.query(
      'SELECT name, price, description, serving_size, prep_time, availability FROM menu_items WHERE name LIKE ? LIMIT 1',
      [`%${query.trim()}%`]
    )

    if (dishes && dishes.length > 0) {
      const d = dishes[0]
      return res.json({
        status: 'success',
        found_type: 'dish',
        data: d,
        reply: `**${d.name}** is ₱${parseFloat(d.price || 0).toFixed(2)} (${d.serving_size || '1 Serving'}). ${d.description || ''} Prep time is about ${d.prep_time || '20-25 mins'}. Current Status: ${d.availability || 'Available'}.`
      })
    }
  } catch (e) { }

  res.json({
    status: 'not_found',
    reply: `I could not find an active record matching "${query}". You can provide an Order Number (e.g., JOS-849201), Reservation Code (e.g., RES-10492), or ask for dish recommendations!`
  })
})

// Helper function to generate 3 unique comparative budget packages
async function generateBudgetPackages({ budget, guest_count, event_type = 'dining', preferences = '', dietary_flags = [] }) {
  const budgetNum = parseFloat(budget) || 0
  const guestsNum = Math.max(1, parseInt(guest_count) || 1)
  const perHeadBudget = guestsNum > 0 ? budgetNum / guestsNum : budgetNum

  // Fetch active menu items with category information
  let menuItems = []
  try {
    const [rows] = await pool.query(`
      SELECT m.item_id, m.name, m.description, m.price, m.serving_size, m.prep_time, 
             m.availability, m.image, m.status, m.is_featured,
             c.category_id, c.category_name, c.category_slug
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.category_id
      WHERE m.status = 'Active' AND m.availability = 'Available'
      ORDER BY m.price ASC
    `)
    menuItems = rows || []
  } catch (e) {
    console.warn('[AI Budget] Database query failed, using fallback dishes:', e.message)
  }

  if (!menuItems || menuItems.length === 0) {
    menuItems = FALLBACK_DISHES.map((d, idx) => ({
      item_id: idx + 1,
      name: d.name,
      price: d.price,
      description: d.description,
      category_name: d.category,
      category_slug: d.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      serving_size: '1 Serving',
      availability: 'Available',
      status: 'Active',
      is_featured: idx < 2 ? 1 : 0
    }))
  }

  // Find lowest price in active menu
  const minPriceDish = menuItems.reduce((min, item) => parseFloat(item.price) < parseFloat(min.price) ? item : min, menuItems[0])
  const minDishPrice = parseFloat(minPriceDish?.price || 35)
  const minRequiredBudget = minDishPrice * guestsNum

  // If the total budget or per-head budget cannot afford even 1 single cheapest item on the menu
  if (budgetNum < minRequiredBudget) {
    return {
      status: 'insufficient_budget',
      budget: budgetNum,
      guests: guestsNum,
      min_dish_price: minDishPrice,
      min_dish_name: minPriceDish?.name || 'Steamed Jasmine Rice',
      packages: [],
      reply: guestsNum > 1
        ? `Your budget of **₱${budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** for **${guestsNum} guests** (₱${perHeadBudget.toFixed(2)}/head) is below our minimum menu price. Our most affordable item is **${minPriceDish?.name}** at **₱${minDishPrice.toFixed(2)}** each (₱${minRequiredBudget.toFixed(2)} total for ${guestsNum} pax). Solo meals typically start around ₱150/head.`
        : `Your budget of **₱${budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** is below our minimum menu price. Our most affordable item is **${minPriceDish?.name}** at **₱${minDishPrice.toFixed(2)}**, and our solo meal combos start around **₱150.00**. Feel free to explore our menu for dishes starting at ₱150!`
    }
  }

  // Apply dietary preferences if any
  const prefLower = (preferences || '').toLowerCase()
  const isNoPork = prefLower.includes('no pork') || dietary_flags.includes('no-pork')
  const isNoBeef = prefLower.includes('no beef') || dietary_flags.includes('no-beef')
  const isSeafoodOnly = prefLower.includes('seafood') && prefLower.includes('only')

  const filteredItems = menuItems.filter(item => {
    const name = (item.name || '').toLowerCase()
    const cat = (item.category_name || '').toLowerCase()
    if (isNoPork && (cat.includes('pork') || name.includes('pork') || name.includes('lechon') || name.includes('pata') || name.includes('liempo'))) {
      return false
    }
    if (isNoBeef && (cat.includes('beef') || name.includes('beef') || name.includes('bulalo') || name.includes('kare-kare'))) {
      return false
    }
    if (isSeafoodOnly && !cat.includes('seafood') && !cat.includes('fish') && !cat.includes('vegetable') && !cat.includes('rice') && !cat.includes('dessert') && !cat.includes('beverage')) {
      return false
    }
    return true
  })

  // Helper: calculate total cost for an item list for the given guest count, strictly <= budgetNum
  const calculatePackageMetrics = (items, targetName, badge, tierType, description) => {
    let validItems = []
    let total = 0

    for (const item of items) {
      const itemPrice = parseFloat(item.price || 0)
      const itemTotal = itemPrice * guestsNum
      if (total + itemTotal <= budgetNum) {
        validItems.push(item)
        total += itemTotal
      }
    }

    if (validItems.length === 0) {
      return null
    }

    const detailedItems = validItems.map(item => {
      const itemPrice = parseFloat(item.price || 0)
      const itemTotal = itemPrice * guestsNum
      return {
        ...item,
        price: itemPrice,
        unit_price: itemPrice,
        quantity_for_event: guestsNum,
        item_total_cost: itemTotal,
        cost_per_head: itemPrice
      }
    })

    const costPerHead = guestsNum > 0 ? total / guestsNum : 0
    const remaining = Math.max(0, budgetNum - total)
    const savingsPercent = budgetNum > 0 ? Math.max(0, Math.round((remaining / budgetNum) * 100)) : 0
    const budgetUtilization = budgetNum > 0 ? Math.min(100, Math.round((total / budgetNum) * 100)) : 100

    return {
      id: tierType,
      tier: tierType,
      title: targetName,
      badge,
      description,
      is_recommended: tierType === 'balanced',
      budget_utilization_percent: budgetUtilization,
      total_estimated_cost: total,
      cost_per_head: costPerHead,
      remaining_budget: remaining,
      savings_percent: savingsPercent,
      items: detailedItems,
      item_count: detailedItems.length,
      category_coverage: Array.from(new Set(detailedItems.map(i => i.category_name || i.category_slug || 'General')))
    }
  }

  // Categorize dishes strictly into distinct functional meal roles
  const isSavoryMain = (d) => {
    const cat = (d.category_name || d.category_slug || '').toLowerCase()
    const name = (d.name || '').toLowerCase()
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('dessert') || name.includes('rice') || name.includes('juice') || name.includes('cooler') || name.includes('tea') || name.includes('shake') || name.includes('flan') || name.includes('halo') || name.includes('halaya')) {
      return false
    }
    return true
  }

  const isRiceOrSide = (d) => {
    const cat = (d.category_name || d.category_slug || '').toLowerCase()
    const name = (d.name || '').toLowerCase()
    return name.includes('rice') || cat.includes('appetizer') || name.includes('lumpia') || name.includes('tokwa') || name.includes('chopsuey')
  }

  const isDrinkOrDessert = (d) => {
    const cat = (d.category_name || d.category_slug || '').toLowerCase()
    const name = (d.name || '').toLowerCase()
    return cat.includes('beverage') || cat.includes('drink') || cat.includes('dessert') || name.includes('tea') || name.includes('juice') || name.includes('cooler') || name.includes('shake') || name.includes('flan') || name.includes('halo') || name.includes('halaya')
  }

  // Gather all affordable active dishes
  const affordableDishes = filteredItems
    .filter(item => (parseFloat(item.price) * guestsNum) <= budgetNum)
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

  if (affordableDishes.length === 0) {
    return {
      status: 'insufficient_budget',
      budget: budgetNum,
      guests: guestsNum,
      min_dish_price: minDishPrice,
      min_dish_name: minPriceDish?.name || 'Steamed Jasmine Rice',
      packages: [],
      reply: `Your budget of **₱${budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** is not enough for any item matching your dietary preference. Our menu items start at **₱${minDishPrice.toFixed(2)}**.`
    }
  }

  const fallbackList = affordableDishes
  const usedNamesGlobal = new Set()

  // Build a true Complete Meal Combo Box (Main + Rice/Side + Drink/Dessert)
  const buildUniqueCombo = (targetFraction, title, badge, tierId, desc, mainPreferences = []) => {
    const targetBudget = budgetNum * targetFraction
    let comboItems = []
    let comboTotal = 0

    // Step 1: Pick Savory Main Dish (Strictly non-dessert, non-drink, not already used)
    const allSavoryMains = fallbackList.filter(isSavoryMain)
    const unusedMains = allSavoryMains.filter(d => !usedNamesGlobal.has(d.name))
    const mainCandidates = (unusedMains.length > 0 ? unusedMains : allSavoryMains).filter(d => (parseFloat(d.price) * guestsNum) <= budgetNum)

    let mainItem = null
    if (mainPreferences.length > 0) {
      mainItem = mainCandidates.find(d => {
        const cat = (d.category_name || d.category_slug || '').toLowerCase()
        const name = (d.name || '').toLowerCase()
        return mainPreferences.some(pref => cat.includes(pref) || name.includes(pref)) && (parseFloat(d.price) * guestsNum) <= targetBudget * 0.85
      })
    }

    if (!mainItem) {
      mainItem = mainCandidates.find(d => (parseFloat(d.price) * guestsNum) <= targetBudget * 0.85) || mainCandidates[0] || fallbackList.find(d => (parseFloat(d.price) * guestsNum) <= budgetNum)
    }

    if (mainItem) {
      comboItems.push(mainItem)
      comboTotal += parseFloat(mainItem.price) * guestsNum
      usedNamesGlobal.add(mainItem.name)
    }

    // Step 2: Pick Rice or Savory Side
    const remainingForSide = budgetNum - comboTotal
    if (remainingForSide >= 35 * guestsNum) {
      const allSides = fallbackList.filter(d => isRiceOrSide(d) && !comboItems.some(c => c.name === d.name) && (parseFloat(d.price) * guestsNum) <= remainingForSide)
      const unusedSides = allSides.filter(d => !usedNamesGlobal.has(d.name))
      const sideCandidates = unusedSides.length > 0 ? unusedSides : allSides

      if (sideCandidates.length > 0) {
        // Prioritize rice if no rice in combo yet
        const riceItem = sideCandidates.find(d => d.name.toLowerCase().includes('rice'))
        const bestSide = riceItem || sideCandidates.find(d => (parseFloat(d.price) * guestsNum) <= remainingForSide * 0.85) || sideCandidates[0]
        if (bestSide) {
          comboItems.push(bestSide)
          comboTotal += parseFloat(bestSide.price) * guestsNum
          usedNamesGlobal.add(bestSide.name)
        }
      }
    }

    // Step 3: Pick Beverage or Dessert if budget permits
    const remainingForDrink = budgetNum - comboTotal
    if (remainingForDrink >= 35 * guestsNum) {
      const allDrinks = fallbackList.filter(d => isDrinkOrDessert(d) && !comboItems.some(c => c.name === d.name) && (parseFloat(d.price) * guestsNum) <= remainingForDrink)
      const unusedDrinks = allDrinks.filter(d => !usedNamesGlobal.has(d.name))
      const drinkCandidates = unusedDrinks.length > 0 ? unusedDrinks : allDrinks

      if (drinkCandidates.length > 0) {
        const bestDrink = drinkCandidates[0]
        if (bestDrink) {
          comboItems.push(bestDrink)
          comboTotal += parseFloat(bestDrink.price) * guestsNum
          usedNamesGlobal.add(bestDrink.name)
        }
      }
    }

    return calculatePackageMetrics(comboItems, title, badge, tierId, desc)
  }

  // Build 3 completely independent and uniquely themed bento combos
  const tier1 = buildUniqueCombo(
    0.75,
    'Sulit Value Pairing',
    '💚 Maximum Savings',
    'value',
    'A budget-smart pairing featuring crispy Filipino favorites, fragrant rice, and a chilled cooler.',
    ['tokwa', 'bbq', 'canton', 'appetizer']
  )

  const tier2 = buildUniqueCombo(
    0.88,
    'Jo\'s Bestseller Favorite',
    '⭐ Most Popular Choice',
    'balanced',
    'Our diner-favorite pairing of charcoal grilled chicken or sizzling specialties, garlic rice, and house beverages.',
    ['inasal', 'chicken', 'sisig', 'pork']
  )

  const tier3 = buildUniqueCombo(
    0.98,
    "Chef's Signature Gourmet Feast",
    '👑 Premium Gourmet Feast',
    'gourmet',
    'An indulgent feast featuring Jo\'s signature crispy specialties, savory sides, and dessert refreshment.',
    ['lechon', 'sinigang', 'lumpia', 'beef', 'seafood']
  )

  const rawPackages = [tier1, tier2, tier3].filter(Boolean)
  // Ensure we have at least 1 valid package
  if (rawPackages.length === 0) {
    return {
      status: 'insufficient_budget',
      budget: budgetNum,
      guests: guestsNum,
      min_dish_price: minDishPrice,
      min_dish_name: minPriceDish?.name || 'Steamed Jasmine Rice',
      packages: [],
      reply: `Your budget of **₱${budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** is below our meal pricing. Single items start at **₱${minDishPrice.toFixed(2)}** and solo meals start around **₱150.00**.`
    }
  }

  // Generate personalized AI advice narrative
  const eventLabels = {
    birthday: 'Birthday Celebration',
    wedding: 'Wedding Reception',
    debut: 'Debut / 18th Milestone',
    corporate: 'Corporate Banquet',
    reunion: 'Family Reunion',
    graduation: 'Graduation Party',
    anniversary: 'Anniversary Banquet',
    christening: 'Christening & Dedication',
    casual: 'Casual Gathering',
    dining: 'Solo / Group Dining'
  }
  const eventDisplayName = eventLabels[event_type] || 'Special Event'

  const aiAdvice = `For your food budget of **₱${budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** (${guestsNum} pax, ₱${perHeadBudget.toFixed(2)}/head), here are ${rawPackages.length} unique recommended meal combinations from our menu:`

  return {
    status: 'success',
    query: {
      budget: budgetNum,
      guests: guestsNum,
      per_head: perHeadBudget,
      event_type,
      event_label: eventDisplayName,
      preferences
    },
    ai_concierge: {
      name: 'Claudine AI',
      advice: aiAdvice,
      per_head_formatted: `₱${perHeadBudget.toFixed(2)} / head`
    },
    packages: rawPackages,
    affordable_dishes: affordableDishes
  }
}

// -----------------------------------------------------------------------------
// 3. POST /api/ai/chat
// Intelligent chat engine backed directly by live MariaDB restaurant records
// -----------------------------------------------------------------------------
router.post('/chat', async (req, res) => {
  const { message } = req.body
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ status: 'error', reply: 'Please provide a message.' })
  }

  const msg = message.toLowerCase().trim()

  // 1. Order status query
  const orderMatch = message.match(/(?:JOS|ORD)[-\s]?\d{3,6}|\b\d{4,6}\b/i)
  if (orderMatch && (msg.includes('order') || msg.includes('track') || msg.includes('status') || msg.includes('where'))) {
    try {
      const code = orderMatch[0].replace(/\s+/g, '')
      const [rows] = await pool.query(
        'SELECT * FROM orders WHERE order_code LIKE ? OR order_id = ? LIMIT 1',
        [`%${code}%`, code]
      )
      if (rows && rows.length > 0) {
        const order = rows[0]
        let items = []
        try { items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []) } catch (e) { }
        const itemsStr = items.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Diner items'
        return res.json({
          status: 'success',
          reply: `Order #${order.order_code || order.order_id} is currently **${order.status || 'In Progress'}**! Items: ${itemsStr}. Delivery/Table: ${order.delivery_address || 'Dine-in'}. Total: ₱${parseFloat(order.grand_total || 0).toFixed(2)}.`
        })
      }
    } catch (e) { }
  }

  // 2. Reservation inquiry
  const resMatch = message.match(/RES[-\s]?\d{3,6}/i)
  if (resMatch && (msg.includes('reservation') || msg.includes('booking') || msg.includes('status') || msg.includes('check'))) {
    try {
      const code = resMatch[0].replace(/\s+/g, '')
      const [rows] = await pool.query(
        'SELECT * FROM reservations WHERE reservation_code LIKE ? OR reservation_id = ? LIMIT 1',
        [`%${code}%`, code]
      )
      if (rows && rows.length > 0) {
        const r = rows[0]
        return res.json({
          status: 'success',
          reply: `Reservation #${r.reservation_code || r.reservation_id} under **${r.contact_name}** is **${r.status || 'Confirmed'}** for **${r.guest_count} guests** on **${r.event_date ? new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}** (${r.event_time || 'Regular Slot'}).`
        })
      }
    } catch (e) { }
  }

  // 2.7. Smart Budget Query Detection & Menu Recommendation
  // Supports: "200 budjet", "200 budget", "200", "₱200", "350 pesos", "may 150 ako", "badget 500", "ulam sa 250", etc.
  const budgetKeywords = [
    'budget', 'budjet', 'badget', 'baget', 'pera', 'pesos', 'peso', 'php', 'spend', 'gastos',
    'kain', 'ulam', 'meal', 'combo', 'worth', 'amount', 'total', 'meryenda', 'merienda',
    'almusal', 'tanghalian', 'hapunan', 'kasya', 'sukli', 'afford', 'cheap',
    'sulit', 'tipid', 'set', 'bento', 'box', 'pede', 'pwede'
  ]
  const hasBudgetKeyword = budgetKeywords.some(kw => msg.includes(kw))

  const numberPatterns = [
    /(?:budget|budjet|badget|worth|amount|total|spend|for|around|may|meron|pera|price|presyo|sukli|ulam|kain|meal|set)\s*(?:of|is|:|=|na)?\s*(?:₱|p|php)?\s*(\d[\d,\.]*)/i,
    /(?:₱|p|php)\s*(\d[\d,\.]*)/i,
    /(\d[\d,\.]*)\s*(?:pesos|peso|php|budjet|budget|badget|kain|ulam|pax|heads|guests|lang|lng)/i,
    /^\s*(?:₱|p|php)?\s*(\d[\d,\.]*)\s*$/i,
    /\b(\d{1,6})\b/
  ]

  let extractedBudget = null
  for (const pattern of numberPatterns) {
    const match = msg.match(pattern)
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(num) && num >= 1 && num <= 100000) {
        extractedBudget = num
        break
      }
    }
  }

  // If explicit budget number is given
  if (extractedBudget !== null) {
    const parsedBudget = extractedBudget
    const guestMatch = msg.match(/(\d+)\s*(?:pax|people|guests|persons|heads|tao)/i)
    const parsedGuests = guestMatch ? parseInt(guestMatch[1], 10) : (parsedBudget >= 10000 ? 25 : (parsedBudget >= 3000 ? 10 : 1))

    try {
      const budgetData = await generateBudgetPackages({
        budget: parsedBudget,
        guest_count: parsedGuests,
        event_type: 'dining',
        preferences: message
      })

      // If budget is too low (below menu items price) or no packages can be formed
      if (budgetData.status === 'insufficient_budget' || !budgetData.packages || budgetData.packages.length === 0) {
        return res.json({
          status: 'success',
          is_budget_recommendation: false,
          budget: parsedBudget,
          guests: parsedGuests,
          packages: null,
          reply: budgetData.reply || `Your budget of **₱${parsedBudget.toFixed(2)}** is below our minimum menu price. Our most affordable item starts at **₱35.00** and solo meal sets start around **₱150.00**.`
        })
      }

      return res.json({
        status: 'success',
        is_budget_recommendation: true,
        budget: parsedBudget,
        guests: parsedGuests,
        packages: budgetData.packages,
        reply: `For your food budget of **₱${parsedBudget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}** (${parsedGuests} pax, ₱${(parsedBudget / parsedGuests).toFixed(2)}/head), here are ${budgetData.packages.length} unique recommended meal combinations from our menu:`
      })
    } catch (e) {
      console.warn('AI Chat Budget Error:', e.message)
    }
  }

  // 3. Search for specific dishes in MariaDB menu_items (e.g., "magkano sisig", "inasal", "lechon")
  try {
    // Clean search term from words like 'magkano', 'meron ba', 'price of', 'ano ang', etc.
    const cleanDishQuery = msg
      .replace(/magkano|meron ba|ano ang|ano|may|ba kayo|kayo|price of|presyo ng|presyo|orders|order/gi, '')
      .trim()

    if (cleanDishQuery.length >= 2) {
      const [dishes] = await pool.query(
        `SELECT m.item_id, m.name, m.price, m.description, m.serving_size, m.prep_time, m.availability, m.image,
                c.category_name
         FROM menu_items m
         LEFT JOIN categories c ON m.category_id = c.category_id
         WHERE m.status = 'Active' AND (
           m.name LIKE ? OR 
           m.description LIKE ? OR 
           c.category_name LIKE ?
         )
         ORDER BY m.price ASC LIMIT 4`,
        [`%${cleanDishQuery}%`, `%${cleanDishQuery}%`, `%${cleanDishQuery}%`]
      )

      if (dishes && dishes.length > 0) {
        if (dishes.length === 1) {
          const d = dishes[0]
          return res.json({
            status: 'success',
            reply: `🍲 **${d.name}**\n- 💰 **Price**: ₱${parseFloat(d.price || 0).toFixed(2)} (${d.serving_size || '1 Serving'})\n- 📝 **Details**: ${d.description || 'Jo\'s Diner house specialty'}\n- ⏱️ **Prep Time**: ${d.prep_time || '15-20 mins'}\n- 📌 **Status**: ${d.availability || 'Available'}\n\nType your budget (e.g. **"₱200"** or **"₱350"**) to see complete meal sets with rice and drinks!`
          })
        } else {
          const dishList = dishes.map(d => `- **${d.name}** (₱${parseFloat(d.price).toFixed(2)}) — ${d.description || d.category_name || 'House dish'}`).join('\n')
          return res.json({
            status: 'success',
            reply: `Here are matching dishes from our menu:\n\n${dishList}\n\nWould you like me to create a meal package for a specific budget? (e.g., type **"₱250 budjet"**)!`
          })
        }
      }
    }
  } catch (e) {
    console.warn('AI Dish search error:', e.message)
  }

  // 3.5. If user typed general budget keywords without number (e.g. "budget meal", "sulit combo", "tipid meal")
  if (hasBudgetKeyword) {
    try {
      const budgetData = await generateBudgetPackages({
        budget: 200,
        guest_count: 1,
        event_type: 'dining',
        preferences: message
      })
      if (budgetData && budgetData.packages) {
        return res.json({
          status: 'success',
          is_budget_recommendation: true,
          budget: 200,
          guests: 1,
          packages: budgetData.packages,
          reply: `Here are our top **Sulit & Budget-Friendly** meal sets starting around **₱200.00** from our menu:\n(You can also specify your exact budget like **"₱150"** or **"₱350"**!)`
        })
      }
    } catch (e) { }
  }

  // 4. Best sellers / Popular Diner Specialties
  if (msg.includes('best seller') || msg.includes('popular') || msg.includes('specialty') || msg.includes('masarap') || msg.includes('recommend') || msg.includes('ulam') || msg.includes('food')) {
    return res.json({
      status: 'success',
      reply: `Our most popular dishes at Jo's Diner are:\n- 🏆 **Jo's Special Lechon Kawali** (₱380.00) — Ultra-crispy pork belly with liver sauce\n- 🍗 **Chicken Inasal Supreme** (₱245.00) — Charcoal grilled marinated quarter chicken\n- 🍲 **Beef Kare-Kare Fiesta Tray** (₱580.00) — Rich peanut sauce with savory bagoong\n- 🔥 **Sizzling Pork Sisig** (₱260.00) — Crispy seasoned pork on hot sizzling plate\n- 🍖 **Crispy Pata Special** (₱850.00) — Perfect for sharing with friends and family!\n\nTell me your budget (e.g., **"200 budjet"** or **"₱350"**) and I'll generate the perfect meal combo for you!`
    })
  }

  // 5. Strictly Menu-Only Polite Concierge Fallback
  return res.json({
    status: 'success',
    reply: `Hello! I'm **Claudine AI**, your Jo's Diner food & menu concierge. 🍽️\n\nMy recommendations are **strictly based on our restaurant food menu, dish prices, and budget meal sets**.\n\n✨ **Here is what I can do for you:**\n- 🍱 Suggest complete meal combos for your budget (type e.g. **"200 budjet"** or **"₱350"**)\n- 🍗 Look up dishes and prices (e.g. *"Chicken Inasal"*, *"Sisig"*, *"Lechon Kawali"*)\n- 🏆 Recommend our diner best sellers and chef specialties\n\nWhat dish or food budget would you like to check today?`
  })
})

// -----------------------------------------------------------------------------
// 4. POST /api/ai/budget-recommendations
// Generates 3 intelligent comparative menu packages staying strictly within budget
// -----------------------------------------------------------------------------
router.post('/budget-recommendations', async (req, res) => {
  try {
    const { budget, guest_count, event_type = 'birthday', preferences = '', dietary_flags = [] } = req.body
    const result = await generateBudgetPackages({
      budget,
      guest_count,
      event_type,
      preferences,
      dietary_flags
    })
    res.json(result)
  } catch (err) {
    console.error('[AI Budget Recommendations Error]:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
