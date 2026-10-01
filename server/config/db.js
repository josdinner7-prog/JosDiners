import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'jos_diners_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function ensureDatabaseExists() {
  try {
    const host = process.env.DB_HOST || 'localhost'
    const user = process.env.DB_USER || 'root'
    const password = process.env.DB_PASS || ''
    const database = process.env.DB_NAME || 'jos_diners_db'
    const conn = await mysql.createConnection({ host, user, password })
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.end()
  } catch (err) {
    console.error("Database existence check error:", err.message)
  }
}

export async function initDatabaseSchema() {
  try {
    await ensureDatabaseExists()
    await pool.query("SET GLOBAL max_allowed_packet = 67108864").catch(() => { })

    // 0. Ensure Core Base Tables Exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        full_name VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        title VARCHAR(100) NULL DEFAULT 'Staff Member',
        shift_name VARCHAR(100) NULL DEFAULT 'Day Shift',
        shift_hours VARCHAR(100) NULL DEFAULT '08:00 AM - 05:00 PM',
        shift_days VARCHAR(100) NULL DEFAULT 'Mon - Fri',
        shift_status VARCHAR(50) NULL DEFAULT 'On Shift',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture LONGTEXT NULL,
        is_verified TINYINT(1) NOT NULL DEFAULT 0,
        verification_code VARCHAR(20) NULL,
        token_expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_slug VARCHAR(100) NOT NULL UNIQUE,
        category_name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        serving_size VARCHAR(100) NULL DEFAULT '1 Serving',
        prep_time VARCHAR(100) NULL DEFAULT '25 minutes',
        availability VARCHAR(50) NOT NULL DEFAULT 'Available',
        image LONGTEXT NULL,
        ingredients TEXT NULL,
        allergens VARCHAR(255) NULL DEFAULT 'None',
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        date_added DATE DEFAULT (CURRENT_DATE),
        last_updated DATE DEFAULT (CURRENT_DATE)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS function_halls (
        hall_id INT AUTO_INCREMENT PRIMARY KEY,
        hall_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        capacity INT NOT NULL DEFAULT 50,
        location VARCHAR(255) NULL,
        hall_image LONGTEXT NULL,
        gallery_json LONGTEXT NULL,
        hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        facilities_json LONGTEXT NULL,
        schedule_json LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_packages (
        package_id INT AUTO_INCREMENT PRIMARY KEY,
        package_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        package_image LONGTEXT NULL,
        package_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        price_per_person DECIMAL(10,2) NULL,
        min_guests INT NOT NULL DEFAULT 20,
        max_guests INT NOT NULL DEFAULT 100,
        extra_guest_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        prep_time VARCHAR(100) NULL DEFAULT '2 - 3 Hours',
        category_allowances_json LONGTEXT NULL,
        recommended_for TEXT NULL,
        features_json LONGTEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_addons (
        addon_id INT AUTO_INCREMENT PRIMARY KEY,
        addon_code VARCHAR(50) NULL,
        addon_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(100) NOT NULL DEFAULT 'per event',
        category VARCHAR(100) NOT NULL DEFAULT 'Venue & Equipment',
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_bookings (
        booking_id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NULL,
        customer_phone VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        package_id INT NULL,
        package_name VARCHAR(255) NOT NULL,
        package_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        selected_dishes_json LONGTEXT NULL,
        package_price_per_person DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        package_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        event_date DATE NOT NULL,
        event_time VARCHAR(100) NULL,
        guest_count INT NOT NULL DEFAULT 20,
        hall_id INT NULL,
        hall_name VARCHAR(255) NULL,
        hall_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        event_venue TEXT NULL,
        addons_json LONGTEXT NULL,
        addons_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        special_requests TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NULL,
        delivery_address TEXT NULL,
        grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        items_json LONGTEXT NULL,
        payment_method VARCHAR(50) DEFAULT 'counter',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_id VARCHAR(100) NULL,
        paid_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Ensure payment & delivery tracking columns exist on orders table
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'counter',
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS delivery_notes VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS rider_name VARCHAR(150) NULL,
      ADD COLUMN IF NOT EXISTS rider_phone VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS vehicle_info VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS estimated_delivery_time VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS dispatched_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS rider_id INT NULL,
      ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) NULL DEFAULT 'Unassigned',
      ADD COLUMN IF NOT EXISTS declined_rider_ids TEXT NULL
    `).catch(() => { })

    // Ensure rider specific columns exist on users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100) NULL DEFAULT 'Motorcycle',
      ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS rider_status VARCHAR(50) NOT NULL DEFAULT 'Offline',
      ADD COLUMN IF NOT EXISTS profile_photo LONGTEXT NULL
    `).catch(() => { })

    // Seed initial rider accounts if none exist
    try {
      const [riderRows] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'rider'")
      if (riderRows[0].count === 0) {
        const hashedPass = await bcrypt.hash('password123', 10)
        await pool.query(`
          INSERT INTO users (username, full_name, phone_number, password, role, title, vehicle_type, plate_number, rider_status, shift_status)
          VALUES 
            ('rider_juan', 'Juan "Speedy" Dela Cruz', '+63 917 555 1234', ?, 'rider', 'Lead Delivery Courier', 'Honda Beat 125cc (Red)', 'MC-7892-VR', 'Available', 'On Shift'),
            ('rider_mark', 'Mark Kevin Alvarez', '+63 928 444 5678', ?, 'rider', 'Express Delivery Rider', 'Yamaha NMAX 155 (Black)', 'AB-4509-X', 'Available', 'On Shift'),
            ('rider_carlo', 'Carlo Mendoza', '+63 908 123 9988', ?, 'rider', 'Part-time Courier', 'Suzuki Burgman Street', 'CD-1120-Z', 'Offline', 'Off Shift')
        `, [hashedPass, hashedPass, hashedPass])
        console.log("✓ Seeded default delivery riders (rider_juan, rider_mark, rider_carlo)")
      }
    } catch (e) {
      console.warn('[DB] Rider seeding notice:', e.message)
    }

    // 1. Users table update
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'full_name'")
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER username")
      console.log("✓ Added 'full_name' column to 'users' table in MariaDB")

      await pool.query("UPDATE users SET full_name = 'System Administrator' WHERE username = 'admin'")
      await pool.query("UPDATE users SET full_name = 'Kitchen KDS Station' WHERE username = 'kitchen'")
      await pool.query("UPDATE users SET full_name = 'Chef Mario Rossi' WHERE username = 'chef_mario'")
      await pool.query("UPDATE users SET full_name = 'Maria Santos' WHERE username = 'staff'")
      await pool.query("UPDATE users SET full_name = 'Maria Cashier' WHERE username = 'cashier_maria'")
    }

    // 2. Customers token expiration
    const [custCols] = await pool.query("SHOW COLUMNS FROM customers LIKE 'token_expires_at'")
    if (custCols.length === 0) {
      await pool.query("ALTER TABLE customers ADD COLUMN token_expires_at DATETIME NULL AFTER verification_token")
      console.log("✓ Added 'token_expires_at' column to 'customers' table in MariaDB")
    }

    // 3. Menu items featured flag
    const [featCols] = await pool.query("SHOW COLUMNS FROM menu_items LIKE 'is_featured'")
    if (featCols.length === 0) {
      await pool.query("ALTER TABLE menu_items ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER status")
      console.log("✓ Added 'is_featured' column to 'menu_items' table in MariaDB")
    }

    // 4. Function halls columns
    const [hallCols] = await pool.query("SHOW COLUMNS FROM function_halls LIKE 'gallery_json'")
    if (hallCols.length === 0) {
      await pool.query("ALTER TABLE function_halls ADD COLUMN gallery_json LONGTEXT NULL AFTER facilities_json")
      console.log("✓ Added 'gallery_json' column to 'function_halls' table in MariaDB")
    }
    await pool.query("ALTER TABLE function_halls MODIFY COLUMN hall_image LONGTEXT NULL").catch(() => { })
    await pool.query("ALTER TABLE function_halls MODIFY COLUMN gallery_json LONGTEXT NULL").catch(() => { })
    await pool.query("ALTER TABLE function_halls MODIFY COLUMN facilities_json LONGTEXT NULL").catch(() => { })

    // 5. Clean Catering Packages Schema
    const [priceCols] = await pool.query("SHOW COLUMNS FROM catering_packages LIKE 'price_per_person'")
    if (priceCols.length === 0) {
      await pool.query("ALTER TABLE catering_packages ADD COLUMN price_per_person DECIMAL(10,2) NULL AFTER package_price").catch(() => { })
    }

    const [catAllowCols] = await pool.query("SHOW COLUMNS FROM catering_packages LIKE 'category_allowances_json'")
    if (catAllowCols.length === 0) {
      await pool.query("ALTER TABLE catering_packages ADD COLUMN category_allowances_json LONGTEXT NULL AFTER created_at").catch(() => { })
    }

    const [featuresCols] = await pool.query("SHOW COLUMNS FROM catering_packages LIKE 'features_json'")
    if (featuresCols.length === 0) {
      await pool.query("ALTER TABLE catering_packages ADD COLUMN features_json LONGTEXT NULL AFTER recommended_for").catch(() => { })
    }

    const [dishesCols] = await pool.query("SHOW COLUMNS FROM catering_packages LIKE 'package_dishes_json'")
    if (dishesCols.length === 0) {
      await pool.query("ALTER TABLE catering_packages ADD COLUMN package_dishes_json LONGTEXT NULL AFTER category_allowances_json").catch(() => { })
    }

    // 6. Ensure default standard flexible catering packages exist if empty
    const [existingPkgs] = await pool.query("SELECT COUNT(*) as count FROM catering_packages")
    if (existingPkgs[0].count === 0) {
      await pool.query(`
        INSERT INTO catering_packages 
        (package_name, description, package_price, price_per_person, min_guests, max_guests, prep_time, recommended_for, category_allowances_json, features_json, status)
        VALUES 
        ('Basic Package', 'Essential catering package for intimate gatherings and small meetings.', 13500.00, 450.00, 30, 80, '2 - 3 Hours', 'Small parties, meetings, family gatherings', '{"pork": 1, "chicken": 1, "dessert": 1, "beverage": 1}', '["Steamed Rice Included", "Buffet Table Setup"]', 'Available'),
        ('Classic Package', 'Our most popular banquet package with full staffing and table setup.', 19500.00, 650.00, 30, 150, '3 Hours', 'Birthdays, anniversaries, celebrations', '{"pork": 1, "chicken": 1, "beef": 1, "dessert": 1, "beverage": 2}', '["Steamed Rice Included", "Buffet Table Setup", "Complete Guest Table & Chair Setup", "Catering Staff & Waiters"]', 'Available'),
        ('Premium Package', 'Grand luxury catering feast with deluxe table setup, decorations and full service.', 25500.00, 850.00, 30, 300, '3 - 4 Hours', 'Weddings, corporate events, large celebrations', '{"pork": 2, "chicken": 1, "beef": 1, "seafood": 1, "dessert": 2, "beverage": 2}', '["Steamed Rice Included", "Buffet Table Setup", "Complete Guest Table & Chair Setup", "Catering Staff & Waiters", "Stage & Venue Decorations"]', 'Available')
      `).catch(err => console.log("Seed packages note:", err.message))
      console.log("✓ Initialized standard dynamic catering packages (Basic ₱450, Classic ₱650, Premium ₱850)")
    }

    // 7. Seed categorized Add-ons if empty or check schema
    const [existingAddons] = await pool.query("SELECT COUNT(*) as count FROM catering_addons").catch(() => [{ count: 0 }])
    if (existingAddons[0]?.count === 0 || existingAddons[0]?.count < 5) {
      await pool.query("DELETE FROM catering_addons WHERE addon_id > 0").catch(() => { })
      await pool.query(`
        INSERT INTO catering_addons (addon_code, addon_name, price, unit, category, status)
        VALUES
        ('ADD-SND', 'Sound System', 5000.00, 'per event', 'Venue & Equipment', 'Available'),
        ('ADD-PRJ', 'Projector & Screen', 2000.00, 'per event', 'Venue & Equipment', 'Available'),
        ('ADD-LED', 'LED Wall Screen', 8000.00, 'per event', 'Venue & Equipment', 'Available'),
        ('ADD-HST', 'Professional Event Host', 5000.00, 'per event', 'Event Services', 'Available'),
        ('ADD-WTR', 'Additional Waiters (2 Staff)', 3000.00, 'per event', 'Event Services', 'Available'),
        ('ADD-BLN', 'Balloon Decoration Arch & Pillars', 3000.00, 'per event', 'Decorations', 'Available'),
        ('ADD-STG', 'Basic Stage & Backdrop Decoration', 5000.00, 'per event', 'Decorations', 'Available'),
        ('ADD-PRM', 'Premium Floral & Lighting Decoration', 10000.00, 'per event', 'Decorations', 'Available')
      `).catch(err => console.log("Seed addons error:", err.message))
      console.log("✓ Seeded categorized catering add-ons (Equipment, Services, Decorations)")
    }

    // 8. Catering Bookings columns for selected dishes and quotation breakdown
    const [bookCols] = await pool.query("SHOW COLUMNS FROM catering_bookings LIKE 'selected_dishes_json'")
    if (bookCols.length === 0) {
      await pool.query(`
        ALTER TABLE catering_bookings 
        ADD COLUMN selected_dishes_json LONGTEXT NULL AFTER package_price,
        ADD COLUMN package_price_per_person DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER selected_dishes_json,
        ADD COLUMN package_total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER package_price_per_person,
        ADD COLUMN hall_id INT NULL AFTER guest_count,
        ADD COLUMN hall_name VARCHAR(255) NULL AFTER hall_id,
        ADD COLUMN hall_cost DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER hall_name,
        ADD COLUMN addons_total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER addons_json
      `).catch(err => console.log("catering_bookings alter note:", err.message))
      console.log("✓ Added selected_dishes_json and quotation breakdown columns to 'catering_bookings'")
    }

    // 9. Real Reservations Table Schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id INT AUTO_INCREMENT PRIMARY KEY,
        reservation_code VARCHAR(50) NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NULL,
        event_type VARCHAR(255) NOT NULL DEFAULT 'Table Reservation',
        category VARCHAR(50) NOT NULL DEFAULT 'table',
        hall_name VARCHAR(255) NULL,
        package_name VARCHAR(255) NULL,
        event_date DATE NOT NULL,
        event_time VARCHAR(50) NULL,
        guest_count INT NOT NULL DEFAULT 2,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
        special_requests TEXT NULL,
        venue_address TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => { })

    const [resCols] = await pool.query("SHOW COLUMNS FROM reservations").catch(() => [[]])
    const resColNames = (resCols || []).map(c => c.Field)
    if (!resColNames.includes('reservation_code')) await pool.query("ALTER TABLE reservations ADD COLUMN reservation_code VARCHAR(50) NULL AFTER reservation_id").catch(() => { })
    if (!resColNames.includes('email')) await pool.query("ALTER TABLE reservations ADD COLUMN email VARCHAR(255) NULL AFTER contact_phone").catch(() => { })
    if (!resColNames.includes('category')) await pool.query("ALTER TABLE reservations ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'table' AFTER event_type").catch(() => { })
    if (!resColNames.includes('hall_name')) await pool.query("ALTER TABLE reservations ADD COLUMN hall_name VARCHAR(255) NULL AFTER category").catch(() => { })
    if (!resColNames.includes('package_name')) await pool.query("ALTER TABLE reservations ADD COLUMN package_name VARCHAR(255) NULL AFTER hall_name").catch(() => { })
    if (!resColNames.includes('event_time')) await pool.query("ALTER TABLE reservations ADD COLUMN event_time VARCHAR(50) NULL AFTER event_date").catch(() => { })
    if (!resColNames.includes('total_amount')) await pool.query("ALTER TABLE reservations ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER guest_count").catch(() => { })
    if (!resColNames.includes('special_requests')) await pool.query("ALTER TABLE reservations ADD COLUMN special_requests TEXT NULL AFTER status").catch(() => { })
    if (!resColNames.includes('venue_address')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_address TEXT NULL AFTER special_requests").catch(() => { })
    if (!resColNames.includes('venue_type')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_type VARCHAR(50) NULL DEFAULT 'diner_function_hall' AFTER venue_address").catch(() => { })
    if (!resColNames.includes('venue_name')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_name VARCHAR(255) NULL AFTER venue_type").catch(() => { })
    if (!resColNames.includes('venue_city')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_city VARCHAR(100) NULL AFTER venue_name").catch(() => { })
    if (!resColNames.includes('venue_contact_person')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_contact_person VARCHAR(150) NULL AFTER venue_city").catch(() => { })
    if (!resColNames.includes('venue_contact_phone')) await pool.query("ALTER TABLE reservations ADD COLUMN venue_contact_phone VARCHAR(50) NULL AFTER venue_contact_person").catch(() => { })
    if (!resColNames.includes('addons_json')) await pool.query("ALTER TABLE reservations ADD COLUMN addons_json LONGTEXT NULL AFTER venue_contact_phone").catch(() => { })
    if (!resColNames.includes('addons_total')) await pool.query("ALTER TABLE reservations ADD COLUMN addons_total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER addons_json").catch(() => { })
    if (!resColNames.includes('event_name')) await pool.query("ALTER TABLE reservations ADD COLUMN event_name VARCHAR(255) NULL AFTER event_type").catch(() => { })
    if (!resColNames.includes('qr_token')) await pool.query("ALTER TABLE reservations ADD COLUMN qr_token VARCHAR(255) NULL AFTER reservation_code").catch(() => { })
    if (!resColNames.includes('checked_in_at')) await pool.query("ALTER TABLE reservations ADD COLUMN checked_in_at DATETIME NULL AFTER status").catch(() => { })
    if (!resColNames.includes('checked_in_by')) await pool.query("ALTER TABLE reservations ADD COLUMN checked_in_by VARCHAR(100) NULL AFTER checked_in_at").catch(() => { })
    if (!resColNames.includes('table_number')) await pool.query("ALTER TABLE reservations ADD COLUMN table_number VARCHAR(50) NULL AFTER checked_in_by").catch(() => { })

    // 9b. Orders Customer Ownership Columns
    const [orderCols] = await pool.query("SHOW COLUMNS FROM orders").catch(() => [[]])
    const orderColNames = (orderCols || []).map(c => c.Field)
    if (!orderColNames.includes('customer_email')) await pool.query("ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_phone").catch(() => { })
    if (!orderColNames.includes('user_id')) await pool.query("ALTER TABLE orders ADD COLUMN user_id INT NULL AFTER customer_email").catch(() => { })

    // 10. Real Reservation Settings Schema (No static defaults)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservation_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        max_guests_per_slot INT NOT NULL DEFAULT 50,
        max_tables INT NOT NULL DEFAULT 15,
        lunch_slot_open TINYINT(1) NOT NULL DEFAULT 1,
        dinner_slot_open TINYINT(1) NOT NULL DEFAULT 1,
        late_slot_open TINYINT(1) NOT NULL DEFAULT 1,
        time_slots_json LONGTEXT NULL,
        blocked_dates_json LONGTEXT NULL,
        date_overrides_json LONGTEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).catch(() => { })

    const [setCols] = await pool.query("SHOW COLUMNS FROM reservation_settings").catch(() => [[]])
    const setColNames = (setCols || []).map(c => c.Field)
    if (!setColNames.includes('date_overrides_json')) {
      await pool.query("ALTER TABLE reservation_settings ADD COLUMN date_overrides_json LONGTEXT NULL AFTER blocked_dates_json").catch(() => { })
    }

    // 11. Function Hall Add-ons Table (separate from catering_addons)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hall_addons (
        addon_id INT AUTO_INCREMENT PRIMARY KEY,
        addon_code VARCHAR(50) NULL,
        addon_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(100) NOT NULL DEFAULT 'per event',
        category VARCHAR(100) NOT NULL DEFAULT 'Equipment & Services',
        status ENUM('Available','Unavailable') NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => { })

    // 12. Function Hall Add-on Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hall_addon_categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0
      )
    `).catch(() => { })

    // Seed default hall addon categories if empty
    const [existingHallCats] = await pool.query('SELECT COUNT(*) as count FROM hall_addon_categories').catch(() => [[{ count: 0 }]])
    if ((existingHallCats[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO hall_addon_categories (category_name, sort_order) VALUES
        ('Equipment & Services', 1),
        ('Audio & Visual', 2),
        ('Decorations', 3),
        ('Lighting & Stage', 4),
        ('Furniture & Seating', 5),
        ('Other', 6)
      `).catch(err => console.log('hall_addon_categories seed note:', err.message))
      console.log('✓ Seeded default function hall add-on categories')
    }

    // Seed default hall add-ons if empty
    const [existingHallAddons] = await pool.query('SELECT COUNT(*) as count FROM hall_addons').catch(() => [[{ count: 0 }]])
    if ((existingHallAddons[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO hall_addons (addon_code, addon_name, price, unit, category, status) VALUES
        ('HA-SND', 'Sound System & Microphone Setup', 5000.00, 'per event', 'Audio & Visual', 'Available'),
        ('HA-PRJ', 'Projector & Screen', 2000.00, 'per event', 'Audio & Visual', 'Available'),
        ('HA-LED', 'LED Wall Screen', 8000.00, 'per event', 'Audio & Visual', 'Available'),
        ('HA-DEC', 'Themed Floral & Balloon Decoration', 3000.00, 'per event', 'Decorations', 'Available'),
        ('HA-STG', 'Stage & Backdrop Decoration', 5000.00, 'per event', 'Lighting & Stage', 'Available'),
        ('HA-TBL', 'Extra Tiffany Tables & Chairs Set (10 Pax)', 1500.00, 'per set', 'Furniture & Seating', 'Available'),
        ('HA-WTR', 'Uniformed Waiter / Service Staff', 1000.00, 'per person', 'Equipment & Services', 'Available')
      `).catch(err => console.log('hall_addons seed note:', err.message))
      console.log('✓ Seeded default function hall add-ons')
    }

    // 13. Event Staff Scheduling & Roster Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_staff_roster (
        roster_id INT AUTO_INCREMENT PRIMARY KEY,
        reservation_id INT NULL,
        event_title VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        event_time VARCHAR(100) NOT NULL,
        event_venue VARCHAR(255) NULL,
        user_id INT NULL,
        staff_name VARCHAR(255) NOT NULL,
        staff_role VARCHAR(100) NOT NULL DEFAULT 'Catering Crew',
        assigned_role VARCHAR(100) NOT NULL,
        call_time VARCHAR(100) NULL,
        end_time VARCHAR(100) NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Seed sample event staff roster entries if empty
    const [existingRoster] = await pool.query('SELECT COUNT(*) as count FROM event_staff_roster').catch(() => [[{ count: 0 }]])
    if ((existingRoster[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO event_staff_roster (event_title, event_date, event_time, event_venue, staff_name, staff_role, assigned_role, call_time, end_time, notes, status) VALUES
        ('Santos Grand Wedding Banquet', CURDATE(), '11:30 AM - 02:30 PM', 'Grand Ballroom Hall A', 'Chef Eduardo', 'kitchen', 'Executive Head Chef', '08:30 AM', '03:30 PM', 'Lead hot carving station & kitchen crew', 'Confirmed'),
        ('Santos Grand Wedding Banquet', CURDATE(), '11:30 AM - 02:30 PM', 'Grand Ballroom Hall A', 'Marco Santos', 'staff', 'Banquet Captain / Lead', '09:00 AM', '04:00 PM', 'Oversee table service & client coordination', 'Confirmed'),
        ('Santos Grand Wedding Banquet', CURDATE(), '11:30 AM - 02:30 PM', 'Grand Ballroom Hall A', 'Reynaldo Cruz', 'staff', 'Senior Waiter & Buffet Attendant', '09:30 AM', '04:00 PM', 'Buffet line refilling & VIP table', 'Confirmed'),
        ('TechCorp Annual Seminar', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '01:00 PM - 05:00 PM', 'Executive Hall B', 'Chef Antonio', 'kitchen', 'Lead Banquet Chef', '10:00 AM', '06:00 PM', 'Finger food & snack station production', 'Confirmed'),
        ('TechCorp Annual Seminar', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '01:00 PM - 05:00 PM', 'Executive Hall B', 'Ana Mendoza', 'staff', 'Floor Supervisor', '11:00 AM', '06:00 PM', 'Continuous brewed coffee bar & service', 'Confirmed')
      `).catch(err => console.log('event_staff_roster seed note:', err.message))
      console.log('✓ Seeded default event staff schedules & roster')
    }

    // 14. Orders table — order_type and table_number columns
    const [orderTypeCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'order_type'")
    if (orderTypeCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN order_type VARCHAR(50) NOT NULL DEFAULT 'Dine-in' AFTER status")
      console.log("✓ Added 'order_type' column to 'orders' table")
    }
    const [tableNumCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'table_number'")
    if (tableNumCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN table_number VARCHAR(100) NULL AFTER order_type")
      console.log("✓ Added 'table_number' column to 'orders' table")
    }
    const [custEmailOrdCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'customer_email'")
    if (custEmailOrdCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_phone")
      console.log("✓ Added 'customer_email' column to 'orders' table")
    }

    // 15. DUAL-TRACK INVENTORY SYSTEM SCHEMA
    // Track 1: Perishable Food Ingredients (Consumables)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_perishables (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        item_code VARCHAR(50) NOT NULL UNIQUE,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Pantry Supplies',
        quantity_on_hand DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(50) NOT NULL DEFAULT 'kg',
        min_threshold DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        supplier VARCHAR(255) NULL,
        storage_location VARCHAR(100) NULL DEFAULT 'Main Kitchen Chiller',
        expiry_date DATE NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Track 1 Logs: Usage & Restock Audit Log
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_perishable_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        change_type VARCHAR(50) NOT NULL DEFAULT 'usage',
        quantity_changed DECIMAL(10,2) NOT NULL,
        balance_after DECIMAL(10,2) NOT NULL,
        reservation_id INT NULL,
        event_title VARCHAR(255) NULL,
        logged_by VARCHAR(100) NOT NULL DEFAULT 'Staff',
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Track 2: Reusable Event Assets (Hardware, Furniture, Equipment)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_reusable_assets (
        asset_id INT AUTO_INCREMENT PRIMARY KEY,
        asset_code VARCHAR(50) NOT NULL UNIQUE,
        asset_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Furniture & Seating',
        total_quantity INT NOT NULL DEFAULT 0,
        in_repair_quantity INT NOT NULL DEFAULT 0,
        damaged_lost_quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
        replacement_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        condition_status VARCHAR(50) NOT NULL DEFAULT 'Good',
        storage_location VARCHAR(100) NULL DEFAULT 'Warehouse Bay 1',
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        image LONGTEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Track 2 Allocations: Event Asset Reservations & Dispatch Tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_asset_allocations (
        allocation_id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        reservation_id INT NULL,
        event_title VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        allocated_quantity INT NOT NULL DEFAULT 1,
        status VARCHAR(50) NOT NULL DEFAULT 'Reserved',
        dispatched_at DATETIME NULL,
        dispatched_by VARCHAR(100) NULL,
        returned_at DATETIME NULL,
        returned_by VARCHAR(100) NULL,
        damaged_qty INT NOT NULL DEFAULT 0,
        missing_qty INT NOT NULL DEFAULT 0,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Seed Track 1: Standard Perishable Ingredients if empty
    const [existingPerishables] = await pool.query("SELECT COUNT(*) as count FROM inventory_perishables").catch(() => [{ count: 0 }])
    if ((existingPerishables[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO inventory_perishables 
        (item_code, item_name, category, quantity_on_hand, unit, min_threshold, cost_per_unit, supplier, storage_location, expiry_date, status, notes)
        VALUES
        ('ING-PRK-01', 'Pork Tenderloin & Liempo Cut', 'Meat & Poultry', 45.50, 'kg', 15.00, 360.00, 'Metro Fresh Meats Corp', 'Walk-in Meat Freezer', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'In Stock', 'Premium local pork for Lechon Kawali & Sweet Pork Ribs'),
        ('ING-CHK-01', 'Boneless Chicken Breast & Thighs', 'Meat & Poultry', 60.00, 'kg', 20.00, 240.00, 'San Miguel Poultry', 'Meat Freezer Unit B', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'In Stock', 'Fresh poultry for Chicken Cordon Bleu & Buttered Chicken'),
        ('ING-BEEF-01', 'Beef Sirloin & Brisket', 'Meat & Poultry', 28.00, 'kg', 10.00, 480.00, 'Bukidnon Highlands Beef', 'Walk-in Meat Freezer', DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'In Stock', 'Choice cut for Beef Kare-Kare and Tenderloin Tips'),
        ('ING-SEA-01', 'Fresh Boneless Bangus Fillets', 'Seafood', 18.00, 'kg', 8.00, 280.00, 'Dagupan Fisheries', 'Fish & Seafood Chiller', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'In Stock', 'Marinated Daing na Bangus portions'),
        ('ING-RIC-01', 'Sinandomeng Premium Rice', 'Grains & Pasta', 180.00, 'kg', 50.00, 52.00, 'Isabela Mega Millers', 'Dry Storage Room A', DATE_ADD(CURDATE(), INTERVAL 90 DAY), 'In Stock', 'Grade A white fragrant rice (Sacks of 25kg)'),
        ('ING-OIL-01', 'Pure Palm Cooking Oil (18L Can)', 'Pantry Supplies', 8.00, 'cans', 3.00, 1450.00, 'Golden Fiesta Depot', 'Pantry Shelves Tier 1', DATE_ADD(CURDATE(), INTERVAL 120 DAY), 'In Stock', 'Deep frying and daily banquet cooking oil'),
        ('ING-DAI-01', 'All-Purpose Cream & Heavy Cream', 'Dairy & Eggs', 35.00, 'packs', 10.00, 78.00, 'Nestle Foodservice', 'Dairy Chiller A', DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'In Stock', 'Creamy sauce bases, carbonara and fruit salad'),
        ('ING-EGG-01', 'Farm Fresh Large Table Eggs', 'Dairy & Eggs', 24.00, 'trays', 6.00, 260.00, 'Bantayan Egg Farms', 'Cool Prep Room', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'In Stock', '30 eggs per tray for baking and breakfast catering'),
        ('ING-VEG-01', 'Carrots, Potatoes & Bell Peppers', 'Fresh Produce', 12.50, 'kg', 15.00, 120.00, 'Baguio Highland Farmers', 'Vegetable Chiller Bin', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Low Stock', 'Daily fresh deliveries needed for side dishes'),
        ('ING-GAR-01', 'Peeled Native Garlic & Red Onions', 'Fresh Produce', 9.00, 'kg', 10.00, 160.00, 'Ilocos Garlic Wholesalers', 'Dry Herb Rack', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Low Stock', 'Essential aromatics for all banquet recipes'),
        ('ING-BEV-01', 'Four Seasons Juice Concentrate (5L)', 'Beverages', 14.00, 'bottles', 4.00, 420.00, 'Del Monte Foodservice', 'Beverage Rack C', DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'In Stock', 'Welcome drinks for catering packages')
      `).catch(err => console.log('Seed perishables error:', err.message))
      console.log("✓ Seeded default catering perishable ingredients (Track 1)")
    }

    // Seed Track 2: Standard Reusable Catering Assets if empty
    const [existingAssets] = await pool.query("SELECT COUNT(*) as count FROM inventory_reusable_assets").catch(() => [{ count: 0 }])
    if ((existingAssets[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO inventory_reusable_assets 
        (asset_code, asset_name, category, total_quantity, in_repair_quantity, damaged_lost_quantity, unit, replacement_cost, condition_status, storage_location, status, notes)
        VALUES
        ('AST-TIF-01', 'White Resin Tiffany Chairs', 'Furniture & Seating', 200, 4, 2, 'pcs', 1450.00, 'Excellent', 'Warehouse Bay 1 (Chairs)', 'Available', 'Premium wedding and banquet chairs with cushion pads'),
        ('AST-TBL-60', 'Round Banquet Tables 60-inch (8-10 Seater)', 'Furniture & Seating', 24, 1, 0, 'pcs', 3800.00, 'Good', 'Warehouse Bay 2 (Tables)', 'Available', 'Foldable heavy-duty banquet tables'),
        ('AST-COK-01', 'Cocktail High-Boy Standing Tables', 'Furniture & Seating', 12, 0, 0, 'pcs', 2200.00, 'Excellent', 'Warehouse Bay 2 (Tables)', 'Available', 'Standing tables with spandex covers for reception'),
        ('AST-CHF-01', 'Stainless Steel Roll-Top Chafing Dishes (9L)', 'Buffet & Chafers', 18, 1, 0, 'sets', 4500.00, 'Excellent', 'Buffet Equipment Room', 'Available', 'Deluxe roll-top warmers with food pans & fuel holders'),
        ('AST-SOUP-01', 'Electric Soup Kettle Warmer (10L)', 'Buffet & Chafers', 4, 0, 0, 'units', 3200.00, 'Good', 'Buffet Equipment Room', 'Available', 'Commercial soup stations with ladle sets'),
        ('AST-PLT-01', 'Porcelain Dinner Plates (10.5 inch)', 'Chinaware & Cutlery', 250, 0, 6, 'pcs', 180.00, 'Good', 'Chinaware Crate Stack A', 'Available', 'Fine white coupe dinner plates'),
        ('AST-CUT-01', '3-Piece Stainless Cutlery Sets (Spoon, Fork, Knife)', 'Chinaware & Cutlery', 250, 0, 10, 'sets', 120.00, 'Good', 'Cutlery Boxes B1-B5', 'Available', 'High-polish heavy stainless steel cutlery'),
        ('AST-GLS-01', 'Crystal Water Goblets & Highball Glasses', 'Chinaware & Cutlery', 220, 0, 8, 'pcs', 95.00, 'Good', 'Glassware Crates C1-C6', 'Available', 'Table setting water goblets'),
        ('AST-FLT-01', 'Champagne Toasting Flutes', 'Chinaware & Cutlery', 120, 0, 4, 'pcs', 110.00, 'Excellent', 'Glassware Crates F1-F3', 'Available', 'For weddings, anniversaries, and VIP toasts'),
        ('AST-LIN-01', 'Floor-Length Burgundy Tablecloths (120-inch)', 'Linens & Drapery', 30, 2, 1, 'pcs', 850.00, 'Good', 'Linens Clean Storage Room', 'Available', 'Heavy polyester tablecloths ironed & bagged'),
        ('AST-SND-01', 'Pro Audio Portable PA Sound System & Subwoofers', 'Audio & Visual', 3, 0, 0, 'sets', 35000.00, 'Excellent', 'AV Tech Closet', 'Available', 'Dual 15-inch active speakers, mixer, stands, and wiring'),
        ('AST-MIC-01', 'UHF Wireless Handheld Microphones (Dual Set)', 'Audio & Visual', 4, 1, 0, 'sets', 8500.00, 'Good', 'AV Tech Closet Safe', 'Available', 'Rechargeable wireless mic transmitters and receiver'),
        ('AST-PRJ-01', '5000-Lumens HD Projector & 120-inch Fast-Fold Screen', 'Audio & Visual', 2, 0, 0, 'sets', 42000.00, 'Excellent', 'AV Tech Storage B', 'Available', 'Screen frame with front/rear projection cloth'),
        ('AST-ARC-01', 'Gold Metal Floral Backdrop Arch (Semi-Circular)', 'Lighting & Stage', 2, 0, 0, 'units', 7500.00, 'Excellent', 'Decor Loft A', 'Available', 'Modular photo-booth arch for weddings & debuts')
      `).catch(err => console.log('Seed reusable assets error:', err.message))
      console.log("✓ Seeded default catering reusable assets (Track 2)")
    }

    // Seed Sample Allocations linked to upcoming reservations if empty
    const [existingAllocations] = await pool.query("SELECT COUNT(*) as count FROM inventory_asset_allocations").catch(() => [{ count: 0 }])
    if ((existingAllocations[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO inventory_asset_allocations
        (asset_id, reservation_id, event_title, event_date, allocated_quantity, status, remarks)
        VALUES
        (1, 3, 'Reyes-Santos Nuptials', '2026-10-17', 120, 'Reserved', '120 Tiffany chairs reserved for main guest seating'),
        (2, 3, 'Reyes-Santos Nuptials', '2026-10-17', 14, 'Reserved', '14 Round banquet tables for 120 pax'),
        (4, 3, 'Reyes-Santos Nuptials', '2026-10-17', 8, 'Reserved', '8 Chafing warmers for 6-dish hot buffet line'),
        (11, 3, 'Reyes-Santos Nuptials', '2026-10-17', 1, 'Reserved', 'Main hall audio PA sound system'),
        (1, 7, 'Special Event Reception', CURDATE(), 50, 'Dispatched', '50 Chairs dispatched for dinner session'),
        (4, 7, 'Special Event Reception', CURDATE(), 4, 'Dispatched', '4 Chafing dishes set up on buffet table')
      `).catch(err => console.log('Seed allocations error:', err.message))
      console.log("✓ Seeded default event asset allocations")
    }

    // 16. SMS SETTINGS & WEBHOOK LOGS SCHEMA
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        gateway_provider VARCHAR(50) NOT NULL DEFAULT 'httpsms',
        httpsms_api_key TEXT NULL,
        httpsms_from_number VARCHAR(50) NULL DEFAULT '+639067236264',
        httpsms_webhook_secret VARCHAR(255) NULL,
        webhook_url VARCHAR(255) NULL DEFAULT 'https://api.josdiner.dpdns.org/api/webhooks/httpsms',
        notify_on_inbound TINYINT(1) NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_webhook_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        message_id VARCHAR(100) NULL,
        event_type VARCHAR(100) NOT NULL,
        phone_number VARCHAR(50) NULL,
        content TEXT NULL,
        status VARCHAR(50) NULL,
        failure_reason VARCHAR(255) NULL,
        raw_payload LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).catch(() => { })

    // Seed default SMS settings if empty
    const [existingSmsSettings] = await pool.query("SELECT COUNT(*) as count FROM sms_settings").catch(() => [{ count: 0 }])
    if ((existingSmsSettings[0]?.count || 0) === 0) {
      const defaultKey = process.env.HTTPSMS_API_KEY || 'uk_--IhjRY4ziVFBGivlG_s5qxgvJbxR9eWgWcRjxVF1LSV5v2gwwdK5up2049effJo'
      const defaultFrom = process.env.HTTPSMS_FROM_NUMBER || '+639067236264'
      const defaultSecret = process.env.HTTPSMS_WEBHOOK_SECRET || ''
      await pool.query(`
        INSERT INTO sms_settings (gateway_provider, httpsms_api_key, httpsms_from_number, httpsms_webhook_secret, webhook_url, notify_on_inbound)
        VALUES ('httpsms', ?, ?, ?, 'https://api.josdiner.dpdns.org/api/webhooks/httpsms', 1)
      `, [defaultKey, defaultFrom, defaultSecret]).catch(err => console.log('Seed sms_settings note:', err.message))
      console.log("✓ Initialized default SMS Gateway & Webhook settings")
    }

  } catch (err) {
    console.error("Schema init error:", err.message)
  }
}
