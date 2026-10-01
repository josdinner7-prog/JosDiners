-- =======================================================================
-- Jo's Diner Function Hall & Catering Services - Complete Database Schema
-- Database: jos_diners_db
-- =======================================================================

CREATE DATABASE IF NOT EXISTS `jos_diners_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jos_diners_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------
-- 1. Table: users (Internal Staff, Chef, Kitchen KDS, and Admin Accounts)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'staff',
  `title` VARCHAR(100) NULL DEFAULT 'Staff Member',
  `shift_name` VARCHAR(100) NULL DEFAULT 'Day Shift',
  `shift_hours` VARCHAR(100) NULL DEFAULT '08:00 AM - 05:00 PM',
  `shift_days` VARCHAR(100) NULL DEFAULT 'Mon - Fri',
  `shift_status` VARCHAR(50) NULL DEFAULT 'On Shift',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 2. Table: customers (Customer Accounts & Authentication)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_picture` LONGTEXT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_code` VARCHAR(20) NULL,
  `token_expires_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 3. Table: categories (Food Menu & Dish Categories)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_slug` VARCHAR(100) NOT NULL UNIQUE,
  `category_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 4. Table: menu_items (Food Dishes Catalog)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `serving_size` VARCHAR(100) NULL DEFAULT '1 Serving',
  `prep_time` VARCHAR(100) NULL DEFAULT '25 minutes',
  `availability` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `image` LONGTEXT NULL,
  `ingredients` TEXT NULL,
  `allergens` VARCHAR(255) NULL DEFAULT 'None',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `date_added` DATE DEFAULT (CURRENT_DATE),
  `last_updated` DATE DEFAULT (CURRENT_DATE),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 5. Table: function_halls (Venue & Function Hall Details)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `function_halls`;
CREATE TABLE `function_halls` (
  `hall_id` INT AUTO_INCREMENT PRIMARY KEY,
  `hall_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `capacity` INT NOT NULL DEFAULT 50,
  `location` VARCHAR(255) NULL,
  `hall_image` LONGTEXT NULL,
  `gallery_json` LONGTEXT NULL,
  `hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `facilities_json` LONGTEXT NULL,
  `schedule_json` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 6. Table: hall_addon_categories (Categories for Function Hall Add-ons)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `hall_addon_categories`;
CREATE TABLE `hall_addon_categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL UNIQUE,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 7. Table: hall_addons (Add-ons for Venue Reservations)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `hall_addons`;
CREATE TABLE `hall_addons` (
  `addon_id` INT AUTO_INCREMENT PRIMARY KEY,
  `addon_code` VARCHAR(50) NULL,
  `addon_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(100) NOT NULL DEFAULT 'per event',
  `category` VARCHAR(100) NOT NULL DEFAULT 'Equipment & Services',
  `status` ENUM('Available','Unavailable') NOT NULL DEFAULT 'Available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 8. Table: catering_packages (Banquet & Event Catering Packages)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `catering_packages`;
CREATE TABLE `catering_packages` (
  `package_id` INT AUTO_INCREMENT PRIMARY KEY,
  `package_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `package_image` LONGTEXT NULL,
  `package_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_per_person` DECIMAL(10,2) NULL,
  `min_guests` INT NOT NULL DEFAULT 20,
  `max_guests` INT NOT NULL DEFAULT 100,
  `extra_guest_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `prep_time` VARCHAR(100) NULL DEFAULT '2 - 3 Hours',
  `category_allowances_json` LONGTEXT NULL,
  `recommended_for` TEXT NULL,
  `features_json` LONGTEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 9. Table: catering_addons (Add-ons for Catering Banquets)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `catering_addons`;
CREATE TABLE `catering_addons` (
  `addon_id` INT AUTO_INCREMENT PRIMARY KEY,
  `addon_code` VARCHAR(50) NULL,
  `addon_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(100) NOT NULL DEFAULT 'per event',
  `category` VARCHAR(100) NOT NULL DEFAULT 'Venue & Equipment',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 10. Table: catering_bookings (Customer Catering Quotations & Bookings)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `catering_bookings`;
CREATE TABLE `catering_bookings` (
  `booking_id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_code` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `package_id` INT NULL,
  `package_name` VARCHAR(255) NOT NULL,
  `package_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `selected_dishes_json` LONGTEXT NULL,
  `package_price_per_person` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `package_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `event_date` DATE NOT NULL,
  `event_time` VARCHAR(100) NULL,
  `guest_count` INT NOT NULL DEFAULT 20,
  `hall_id` INT NULL,
  `hall_name` VARCHAR(255) NULL,
  `hall_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `event_venue` TEXT NULL,
  `addons_json` LONGTEXT NULL,
  `addons_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `special_requests` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 11. Table: reservations (Table Reservations & Venue Bookings)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `reservation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `reservation_code` VARCHAR(50) NULL,
  `contact_name` VARCHAR(255) NOT NULL,
  `contact_phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NULL,
  `event_type` VARCHAR(255) NOT NULL DEFAULT 'Table Reservation',
  `event_name` VARCHAR(255) NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'table',
  `hall_name` VARCHAR(255) NULL,
  `package_name` VARCHAR(255) NULL,
  `event_date` DATE NOT NULL,
  `event_time` VARCHAR(50) NULL,
  `guest_count` INT NOT NULL DEFAULT 2,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
  `special_requests` TEXT NULL,
  `venue_address` TEXT NULL,
  `addons_json` LONGTEXT NULL,
  `addons_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 12. Table: reservation_settings (Slot Capacity & Reservation Rules)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `reservation_settings`;
CREATE TABLE `reservation_settings` (
  `setting_id` INT AUTO_INCREMENT PRIMARY KEY,
  `max_guests_per_slot` INT NOT NULL DEFAULT 50,
  `max_tables` INT NOT NULL DEFAULT 15,
  `lunch_slot_open` TINYINT(1) NOT NULL DEFAULT 1,
  `dinner_slot_open` TINYINT(1) NOT NULL DEFAULT 1,
  `late_slot_open` TINYINT(1) NOT NULL DEFAULT 1,
  `time_slots_json` LONGTEXT NULL,
  `blocked_dates_json` LONGTEXT NULL,
  `date_overrides_json` LONGTEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 13. Table: orders (Customer Orders & POS Terminal Slips)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_code` VARCHAR(50) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) NULL,
  `delivery_address` TEXT NULL,
  `grand_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `items_json` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================================
-- INITIAL SEED DATA (Authentic, Production-Ready System Data)
-- Default Password for all accounts: password123
-- Hash: $2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2
-- =======================================================================

-- 1. Insert Staff & Executive Users
INSERT INTO `users` (`username`, `full_name`, `password`, `role`, `title`, `shift_name`, `shift_hours`, `shift_days`, `shift_status`) VALUES
('admin', 'System Administrator', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 'admin', 'Managing Director', 'Executive Shift', '08:00 AM - 06:00 PM', 'Mon - Sat', 'On Shift'),
('kitchen', 'Kitchen KDS Station', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 'kitchen', 'Head Chef / Kitchen Lead', 'Kitchen Morning Shift', '06:00 AM - 02:00 PM', 'Mon - Sun', 'On Shift'),
('chef_mario', 'Chef Mario Rossi', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 'kitchen', 'Executive Sous Chef', 'Afternoon Shift', '01:00 PM - 09:00 PM', 'Tue - Sun', 'On Shift'),
('staff', 'Maria Santos', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 'staff', 'Front Desk Staff & POS', 'Day Shift', '08:00 AM - 05:00 PM', 'Mon - Fri', 'On Shift'),
('cashier_maria', 'Maria Cashier', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 'cashier', 'Lead Cashier', 'Closing Shift', '02:00 PM - 10:00 PM', 'Wed - Sun', 'On Shift');

-- 2. Insert Customers
INSERT INTO `customers` (`full_name`, `email`, `phone`, `password`, `is_verified`, `created_at`) VALUES
('Ana Reyes', 'ana.reyes@gmail.com', '09221112233', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 1, '2026-01-15 10:30:00'),
('Carlos Mendoza', 'carlos.m@gmail.com', '09175554433', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 1, '2026-02-01 14:20:00'),
('Valued Customer', 'customer@example.com', '09187654321', '$2b$10$o9Pg4HW/OOSIXD3p7stdseVhVQgLOVsSi3KBi6vzG./l/w9uvMfu2', 1, '2026-02-10 09:00:00');

-- 3. Insert Menu Categories
INSERT INTO `categories` (`category_id`, `category_slug`, `category_name`, `description`, `status`) VALUES
(1, 'main_course', 'Main Course', 'Hearty traditional signature favorites prepared fresh daily.', 'Active'),
(2, 'sizzlers', 'Sizzlers', 'Sizzling hot plate specialties seasoned with aromatic spices.', 'Active'),
(3, 'catering', 'Catering Trays', 'Party platters and catering trays ideal for group gatherings.', 'Active'),
(4, 'pork', 'Pork Specialties', 'Tender, savory pork delicacies crisped to golden perfection.', 'Active'),
(5, 'chicken', 'Chicken Dishes', 'Flavored, grilled, and fried chicken infused with regional herbs.', 'Active'),
(6, 'beef', 'Beef Delicacies', 'Slow-cooked, rich beef recipes featuring melt-in-your-mouth tenderness.', 'Active'),
(7, 'seafood', 'Seafood Catch', 'Fresh ocean catch sauteed, grilled, or cooked in rich sauces.', 'Active'),
(8, 'dessert', 'Desserts & Pastries', 'Classic Filipino desserts, sweet delicacies, and cakes.', 'Active'),
(9, 'beverage', 'Beverages & Drinks', 'Refreshing house-blended cold drinks, shakes, and mocktails.', 'Active'),
(10, 'appetizer', 'Appetizers & Soups', 'Hot broths, savory starters, and crunchy finger foods.', 'Active');

-- 4. Insert Menu Items
INSERT INTO `menu_items` 
(`category_id`, `name`, `description`, `price`, `serving_size`, `prep_time`, `availability`, `image`, `ingredients`, `allergens`, `status`, `is_featured`) 
VALUES
(4, "Jo's Special Lechon Kawali", "Crispy deep-fried pork belly with blistered crackling skin, served with homemade liver sauce and spiced palm vinegar.", 380.00, "2-3 Persons", "20 minutes", "Available", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Pork Belly, Peppercorns, Bay Leaves, Sea Salt, Garlic, Vegetable Oil", "None", "Active", 1),
(2, "Sizzling Pork Sisig Platter", "Sizzling minced pork jowl and ears with grilled onions, calamansi, bird's eye chili, topped with fresh egg and crispy chicharon.", 320.00, "2 Persons", "15 minutes", "Available", "https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?auto=format&fit=crop&w=800&q=80", "Pork Mask & Jowl, Red Onions, Fresh Egg, Calamansi, Chilis, Liver Spread", "Egg", "Active", 1),
(5, "Chicken Inasal Supreme (Quarter)", "Authentic Bacolod-style grilled marinated chicken with lemongrass, ginger, sinamak, basted with rich annatto chicken oil.", 245.00, "1 Person", "20 minutes", "Available", "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80", "Chicken Leg Quarter, Lemongrass, Calamansi, Ginger, Annatto Oil, Coconut Vinegar", "None", "Active", 1),
(6, "Beef Kare-Kare Fiesta Tray", "Melt-in-your-mouth tender beef shank and tripe simmered in roasted artisanal peanut sauce with eggplant, bok choy, and sauteed shrimp paste.", 580.00, "3-4 Persons", "25 minutes", "Available", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", "Beef Shank, Honeycomb Tripe, Peanuts, Toasted Rice Flour, Annatto, Eggplant, Pechay, Bagoong Alamang", "Peanuts, Crustaceans", "Active", 1),
(7, "Garlic Butter Jumbo Prawns", "Succulent king prawns sauteed in golden garlic, butter, and lemon glaze, topped with toasted garlic flakes and parsley.", 495.00, "2-3 Persons", "18 minutes", "Available", "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80", "Jumbo Prawns, Pure Creamery Butter, Minced Garlic, Lemon Juice, Flat Parsley", "Crustaceans, Dairy", "Active", 1),
(4, "Crispy Pata Special", "Deep-fried whole pork knuckle cooked to tender perfection inside with blistered, ultra-crunchy crackling skin outside.", 850.00, "4-5 Persons", "30 minutes", "Available", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Whole Pork Knuckle, Garlic, Bay Leaves, Black Peppercorns, Spiced Soy Vinegar Dip", "None", "Active", 1),
(1, "Sinigang na Baboy sa Sampalok", "Slow-simmered tender pork ribs in tangy natural tamarind broth with kangkong, radish, string beans, and siling haba.", 360.00, "2-3 Persons", "20 minutes", "Available", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", "Pork Spareribs, Real Tamarind Pulp, Water Spinach, White Radish, Tomatoes, Green Chilis", "None", "Active", 0),
(6, "Bistek Tagalog Tenderloin", "Tender beef tenderloin slices flash-seared in citrus calamansi, premium soy sauce, and smothered in sweet caramelized white onions.", 420.00, "2-3 Persons", "15 minutes", "Available", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Beef Tenderloin, Calamansi Juice, Soy Sauce, Sweet White Onions, Freshly Cracked Black Pepper", "Soy", "Active", 0),
(10, "Lumpiang Shanghai (12 Pcs)", "Golden crispy pork egg rolls seasoned with water chestnuts, carrots, and sweet chili dipping sauce.", 220.00, "2-3 Persons", "12 minutes", "Available", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80", "Ground Pork, Minced Carrots, Spring Onions, Spring Roll Wrappers, Sweet Chili Sauce", "Wheat, Egg", "Active", 0),
(1, "Pancit Canton Special", "Stir-fried egg noodles tossed with fresh garden vegetables, sliced chicken, pork, shrimp, and rich savory sauce.", 290.00, "2-3 Persons", "15 minutes", "Available", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80", "Egg Noodles, Cabbage, Carrots, Green Beans, Pork Slices, Chicken Breast, Shrimps, Calamansi", "Wheat, Crustaceans, Soy", "Active", 0),
(8, "Creamy Leche Flan Royale", "Velvety smooth caramel custard made with rich egg yolks and condensed milk, coated in golden amber caramel.", 160.00, "1-2 Persons", "10 minutes", "Available", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", "Egg Yolks, Condensed Milk, Evaporated Milk, Vanilla Extract, Caramelized Sugar", "Egg, Dairy", "Active", 1),
(8, "Ube Halaya Supreme Tub", "Decadent slow-cooked pure purple yam pudding enriched with coconut cream, milk, and topped with golden latik coconut curd.", 190.00, "2 Persons", "10 minutes", "Available", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", "Purple Yam (Ube), Coconut Cream, Condensed Milk, Butter, Latik Curd", "Dairy", "Active", 0),
(9, "Jo's House Blend Iced Tea (Carafe)", "Freshly brewed Ceylon black tea with calamansi citrus, wild honey infusion, and fresh mint leaves.", 130.00, "1 Liter Carafe", "5 minutes", "Available", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80", "Black Tea, Calamansi Juice, Pure Wild Honey, Fresh Spearmint, Filtered Water", "None", "Active", 0),
(9, "Ripe Mango Shake Delight", "Chilled smoothie prepared with sweet Philippine Carabao mangoes and creamy milk swirl.", 145.00, "16 oz Tall Glass", "5 minutes", "Available", "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80", "Guimaras Carabao Mangoes, Crushed Ice, Fresh Milk, Cane Syrup", "Dairy", "Active", 1),
(3, "Fiesta Pork BBQ Platter (10 Skewers)", "Charcoal-grilled skewered pork marinated in savory sweet glaze with garlic basting.", 480.00, "4-5 Persons", "25 minutes", "Available", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "Pork Shoulder, Sweet BBQ Marinade, Banana Ketchup, Calamansi, Brown Sugar", "Soy", "Active", 1);

-- 5. Insert Function Halls
INSERT INTO `function_halls` 
(`hall_name`, `description`, `capacity`, `location`, `hall_image`, `hourly_rate`, `status`, `facilities_json`, `gallery_json`, `schedule_json`) 
VALUES
('Grand Diamond Ballroom', 'Our premier banquet venue with crystal chandeliers, high ceiling, stage, and full acoustic treatment. Ideal for grand weddings, debutante celebrations, and corporate galas.', 300, '2nd Floor, Main Wing', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80', 3500.00, 'Available', '["State-of-the-art Audio & Visual System", "Elevated Presentation Stage", "Centralized High-Capacity Air Conditioning", "VIP Holding Lounge & Dressing Suite", "Custom Ambient RGB Lighting", "Dedicated Restrooms & Catering Pantry"]', '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"]', '{"monday": "08:00 AM - 11:00 PM", "tuesday": "08:00 AM - 11:00 PM", "wednesday": "08:00 AM - 11:00 PM", "thursday": "08:00 AM - 11:00 PM", "friday": "08:00 AM - 12:00 AM", "saturday": "08:00 AM - 12:00 AM", "sunday": "08:00 AM - 11:00 PM"}'),

('Emerald Garden Pavilion', 'Enchanting indoor-outdoor glass-walled pavilion with scenic lush greenery, gentle breeze, and natural daylight illumination. Perfect for anniversaries, birthdays, and garden weddings.', 150, 'Ground Floor, Garden Courtyard', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', 2500.00, 'Available', '["Panoramic Glass Walls with Garden View", "Integrated Surround Sound System", "Fully Air Conditioned with Outdoor Veranda", "Photo-Op Floral Backdrop Wall", "Direct Access to Parking Area"]', '["https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"]', '{"monday": "08:00 AM - 10:00 PM", "tuesday": "08:00 AM - 10:00 PM", "wednesday": "08:00 AM - 10:00 PM", "thursday": "08:00 AM - 10:00 PM", "friday": "08:00 AM - 11:00 PM", "saturday": "08:00 AM - 11:00 PM", "sunday": "08:00 AM - 10:00 PM"}'),

('Sapphire VIP Dining Hall', 'Sophisticated private venue tailored for executive corporate seminars, board dinners, intimate reunions, and christening banquets.', 80, '1st Floor, East Wing', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', 1800.00, 'Available', '["High-definition 85-inch Presentation Display", "Conference Sound System with Wireless Mics", "Custom Table Configuration (Round / Boardroom)", "Dedicated Service Butler", "Private High-Speed Wi-Fi"]', '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"]', '{"monday": "08:00 AM - 10:00 PM", "tuesday": "08:00 AM - 10:00 PM", "wednesday": "08:00 AM - 10:00 PM", "thursday": "08:00 AM - 10:00 PM", "friday": "08:00 AM - 10:00 PM", "saturday": "08:00 AM - 10:00 PM", "sunday": "08:00 AM - 10:00 PM"}');

-- 6. Insert Function Hall Add-on Categories
INSERT INTO `hall_addon_categories` (`category_name`, `sort_order`) VALUES
('Equipment & Services', 1),
('Audio & Visual', 2),
('Decorations', 3),
('Lighting & Stage', 4),
('Furniture & Seating', 5),
('Other', 6);

-- 7. Insert Function Hall Add-ons
INSERT INTO `hall_addons` (`addon_code`, `addon_name`, `price`, `unit`, `category`, `status`) VALUES
('HA-SND', 'Sound System & Wireless Microphones', 5000.00, 'per event', 'Audio & Visual', 'Available'),
('HA-PRJ', 'High-Lumen Projector & Motorized Screen', 2000.00, 'per event', 'Audio & Visual', 'Available'),
('HA-LED', 'P3 High-Definition LED Wall Display', 8000.00, 'per event', 'Audio & Visual', 'Available'),
('HA-DEC', 'Themed Floral & Balloon Arch Decoration', 3500.00, 'per event', 'Decorations', 'Available'),
('HA-STG', 'Stage & Customized Backdrop Styling', 5000.00, 'per event', 'Lighting & Stage', 'Available'),
('HA-TBL', 'Extra Tiffany Tables & Chairs Set (10 Pax)', 1500.00, 'per set', 'Furniture & Seating', 'Available'),
('HA-WTR', 'Uniformed Waiter / Service Staff (2 Staff)', 1500.00, 'per event', 'Equipment & Services', 'Available');

-- 8. Insert Catering Packages
INSERT INTO `catering_packages` 
(`package_name`, `description`, `package_price`, `price_per_person`, `min_guests`, `max_guests`, `prep_time`, `recommended_for`, `category_allowances_json`, `features_json`, `status`) 
VALUES
('Basic Package', 'Essential catering package for intimate gatherings and small meetings.', 13500.00, 450.00, 30, 80, '2 - 3 Hours', 'Small parties, meetings, family gatherings', '{"pork": 1, "chicken": 1, "dessert": 1, "beverage": 1}', '["Steamed Rice Included", "Buffet Table Setup with Warmers", "Utensils & Chinaware Included"]', 'Available'),

('Classic Package', 'Our most popular banquet package with full staffing, table setup, and expanded menu choices.', 19500.00, 650.00, 30, 150, '3 Hours', 'Birthdays, anniversaries, corporate banquets', '{"pork": 1, "chicken": 1, "beef": 1, "dessert": 1, "beverage": 2}', '["Steamed Rice Included", "Buffet Table Setup with Warmers", "Complete Guest Table & Chair Setup", "Uniformed Catering Staff & Waiters", "Bottomless Iced Tea"]', 'Available'),

('Premium Package', 'Grand luxury catering feast with deluxe table setup, floral decor, and full multi-course dining service.', 25500.00, 850.00, 30, 300, '3 - 4 Hours', 'Weddings, debuts, milestone anniversaries, corporate galas', '{"pork": 2, "chicken": 1, "beef": 1, "seafood": 1, "dessert": 2, "beverage": 2}', '["Steamed Rice Included", "Buffet Table Setup with Warmers", "Complete Guest Table & Chair Setup", "Full Team of Uniformed Catering Staff", "Stage & Venue Themed Centerpieces", "Bottomless Refreshments"]', 'Available'),

('Grand Banquet Package', 'Grandest signature banquet setup with VIP treatment, full carving station, and unlimited specialty beverage bar.', 42500.00, 850.00, 50, 500, '4 Hours', 'Grand weddings, international corporate events', '{"pork": 2, "chicken": 2, "beef": 1, "seafood": 2, "dessert": 2, "beverage": 3}', '["Steamed Rice Included", "Deluxe Dual Buffet Counters", "VIP Table Service for Presidential Table", "Complete Dining Linens & Centerpieces", "Dedicated Event Captain & Servers"]', 'Available');

-- 9. Insert Catering Add-ons
INSERT INTO `catering_addons` (`addon_code`, `addon_name`, `price`, `unit`, `category`, `status`) VALUES
('ADD-SND', 'Sound System', 5000.00, 'per event', 'Venue & Equipment', 'Available'),
('ADD-PRJ', 'Projector & Screen', 2000.00, 'per event', 'Venue & Equipment', 'Available'),
('ADD-LED', 'LED Wall Screen', 8000.00, 'per event', 'Venue & Equipment', 'Available'),
('ADD-HST', 'Professional Event Host', 5000.00, 'per event', 'Event Services', 'Available'),
('ADD-WTR', 'Additional Waiters (2 Staff)', 3000.00, 'per event', 'Event Services', 'Available'),
('ADD-BLN', 'Balloon Decoration Arch & Pillars', 3000.00, 'per event', 'Decorations', 'Available'),
('ADD-STG', 'Basic Stage & Backdrop Decoration', 5000.00, 'per event', 'Decorations', 'Available'),
('ADD-PRM', 'Premium Floral & Lighting Decoration', 10000.00, 'per event', 'Decorations', 'Available');

-- 10. Insert Catering Bookings
INSERT INTO `catering_bookings` 
(`booking_code`, `customer_name`, `customer_email`, `customer_phone`, `event_type`, `package_id`, `package_name`, `package_price`, `selected_dishes_json`, `package_price_per_person`, `package_total`, `event_date`, `event_time`, `guest_count`, `hall_id`, `hall_name`, `hall_cost`, `event_venue`, `addons_json`, `addons_total`, `total_amount`, `special_requests`, `status`) 
VALUES
('CAT-891024', 'Ana Reyes', 'ana.reyes@gmail.com', '09221112233', 'Wedding Reception', 3, 'Premium Package', 25500.00, '{"pork": ["Jo\'s Special Lechon Kawali", "Crispy Pata Special"], "chicken": ["Chicken Inasal Supreme (Quarter)"], "beef": ["Beef Kare-Kare Fiesta Tray"], "seafood": ["Garlic Butter Jumbo Prawns"], "dessert": ["Creamy Leche Flan Royale", "Ube Halaya Supreme Tub"], "beverage": ["Jo\'s House Blend Iced Tea (Carafe)", "Ripe Mango Shake Delight"]}', 850.00, 42500.00, '2026-10-18', '04:00 PM to 09:00 PM', 50, 1, 'Grand Diamond Ballroom', 17500.00, 'Jo\'s Diner Grand Diamond Ballroom', '[{"addon_code": "HA-LED", "addon_name": "LED Wall Screen", "price": 8000}]', 8000.00, 68000.00, 'Gentle wedding march audio setup required. Color motif is Champagne Gold and Dusty Rose.', 'Confirmed'),

('CAT-782190', 'Carlos Mendoza', 'carlos.m@gmail.com', '09175554433', '50th Birthday Party', 2, 'Classic Package', 19500.00, '{"pork": ["Jo\'s Special Lechon Kawali"], "chicken": ["Chicken Inasal Supreme (Quarter)"], "beef": ["Bistek Tagalog Tenderloin"], "dessert": ["Creamy Leche Flan Royale"], "beverage": ["Jo\'s House Blend Iced Tea (Carafe)", "Ripe Mango Shake Delight"]}', 650.00, 26000.00, '2026-11-05', '11:00 AM to 03:00 PM', 40, 2, 'Emerald Garden Pavilion', 10000.00, 'Jo\'s Diner Emerald Garden Pavilion', '[{"addon_code": "HA-SND", "addon_name": "Sound System & Wireless Microphones", "price": 5000}]', 5000.00, 41000.00, 'Provide high chair for toddler guests. Birthday cake table placed next to the garden backdrop.', 'Pending Review');

-- 11. Insert Reservations
INSERT INTO `reservations` 
(`reservation_code`, `contact_name`, `contact_phone`, `email`, `event_type`, `event_name`, `category`, `hall_name`, `package_name`, `event_date`, `event_time`, `guest_count`, `total_amount`, `status`, `special_requests`, `venue_address`) 
VALUES
('RES-58192', 'Engr. Robert Gomez', '09198887766', 'robert.gomez@gmail.com', 'Table Reservation', 'Family Dinner', 'table', 'Main Dining Area', 'Casual Dining', '2026-09-15', '07:00 PM', 6, 2400.00, 'Confirmed', 'Request booth seat near the window. Please prepare birthday candle for dessert.', 'Jo\'s Diner Main Dining Room'),
('RES-91823', 'Dra. Patricia Cruz', '09183332211', 'patricia.cruz@medph.com', 'Table Reservation', 'Business Lunch', 'table', 'Main Dining Area', 'Casual Dining', '2026-09-16', '12:30 PM', 4, 1800.00, 'Confirmed', 'Quiet table corner preferred for private contract discussion.', 'Jo\'s Diner Main Dining Room'),
('RES-10492', 'Ana Reyes', '09221112233', 'ana.reyes@gmail.com', 'Wedding Reception', 'Reyes-Santos Nuptials', 'hall', 'Grand Diamond Ballroom', 'Premium Package', '2026-10-18', '04:00 PM', 50, 68000.00, 'Confirmed', 'Full ballroom reservation linked with Catering Booking CAT-891024.', 'Jo\'s Diner Grand Diamond Ballroom');

-- 12. Insert Reservation Settings
INSERT INTO `reservation_settings` 
(`setting_id`, `max_guests_per_slot`, `max_tables`, `lunch_slot_open`, `dinner_slot_open`, `late_slot_open`, `time_slots_json`, `blocked_dates_json`, `date_overrides_json`) 
VALUES
(1, 50, 15, 1, 1, 1, '[{"time":"11:00 AM","period":"Lunch","enabled":true},{"time":"12:30 PM","period":"Lunch","enabled":true},{"time":"02:00 PM","period":"Lunch","enabled":true},{"time":"05:30 PM","period":"Dinner","enabled":true},{"time":"07:00 PM","period":"Dinner","enabled":true},{"time":"08:30 PM","period":"Dinner","enabled":true}]', '[]', '{}');

-- 13. Insert Orders
INSERT INTO `orders` 
(`order_id`, `order_code`, `customer_name`, `customer_phone`, `delivery_address`, `grand_total`, `status`, `items_json`, `created_at`) 
VALUES
(101, 'ORD-9821', 'Ana Reyes', '09221112233', '123 Main St, Quezon City', 1450.00, 'Preparing', '[{"item_id": 1, "name": "Jo\'s Special Lechon Kawali", "price": 380.00, "quantity": 2}, {"item_id": 2, "name": "Sizzling Pork Sisig Platter", "price": 320.00, "quantity": 1}, {"item_id": 13, "name": "Jo\'s House Blend Iced Tea", "price": 130.00, "quantity": 1}, {"item_id": 11, "name": "Creamy Leche Flan Royale", "price": 160.00, "quantity": 1}]', '2026-09-09 11:20:00'),
(102, 'ORD-9822', 'Carlos Mendoza', '09175554433', '456 Pasig Ave, Pasig City', 2890.00, 'Delivered', '[{"item_id": 6, "name": "Crispy Pata Special", "price": 850.00, "quantity": 2}, {"item_id": 4, "name": "Beef Kare-Kare Fiesta Tray", "price": 580.00, "quantity": 1}, {"item_id": 10, "name": "Pancit Canton Special", "price": 290.00, "quantity": 1}, {"item_id": 14, "name": "Ripe Mango Shake Delight", "price": 145.00, "quantity": 2}]', '2026-09-09 12:45:00'),
(103, 'ORD-9823', 'Juan Dela Cruz', '09187776655', 'Dine-in Table 5', 845.00, 'Pending', '[{"item_id": 3, "name": "Chicken Inasal Supreme (Quarter)", "price": 245.00, "quantity": 2}, {"item_id": 9, "name": "Lumpiang Shanghai (12 Pcs)", "price": 220.00, "quantity": 1}, {"item_id": 13, "name": "Jo\'s House Blend Iced Tea", "price": 130.00, "quantity": 1}]', '2026-09-09 16:30:00');
