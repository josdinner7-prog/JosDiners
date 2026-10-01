import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Helper to resolve category slug to category_id
async function getCategoryIdBySlug(categorySlugOrId) {
  if (typeof categorySlugOrId === 'number') return categorySlugOrId
  if (!isNaN(categorySlugOrId)) return parseInt(categorySlugOrId)

  const [rows] = await pool.query(
    'SELECT category_id FROM categories WHERE category_slug = ?',
    [categorySlugOrId]
  )
  if (rows.length > 0) return rows[0].category_id

  const [def] = await pool.query('SELECT category_id FROM categories LIMIT 1')
  return def.length > 0 ? def[0].category_id : 1
}

// 1. CATEGORIES REST API ENDPOINTS
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        category_id,
        category_slug AS id,
        category_name AS label,
        description,
        status,
        created_at,
        updated_at
      FROM categories 
      ORDER BY category_id ASC
    `)
    res.json({ status: 'success', categories })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/categories', async (req, res) => {
  const { label, description, status } = req.body
  if (!label || !label.trim()) {
    return res.status(400).json({ status: 'error', message: 'Category title label is required.' })
  }

  const cleanName = label.trim()
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const catStatus = status === 'Inactive' ? 'Inactive' : 'Active'

  try {
    const [result] = await pool.query(
      `INSERT INTO categories (category_slug, category_name, description, status) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), description = VALUES(description), status = VALUES(status)`,
      [slug, cleanName, description || null, catStatus]
    )

    res.json({
      status: 'success',
      message: `Category "${cleanName}" created successfully!`,
      category: { category_id: result.insertId, id: slug, label: cleanName, description: description || '', status: catStatus }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

router.put('/categories/:id', async (req, res) => {
  const { id } = req.params
  const { label, description, status } = req.body
  if (!label || !label.trim()) {
    return res.status(400).json({ status: 'error', message: 'Updated category label is required.' })
  }

  const catStatus = status === 'Inactive' ? 'Inactive' : 'Active'

  try {
    await pool.query(
      'UPDATE categories SET category_name = ?, description = ?, status = ? WHERE category_id = ? OR category_slug = ?',
      [label.trim(), description || null, catStatus, id, id]
    )
    res.json({ status: 'success', message: `Category updated to "${label.trim()}"` })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM categories WHERE category_id = ? OR category_slug = ?', [id, id])
    res.json({ status: 'success', message: 'Category deleted successfully.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 2. MENU ITEMS REST API ENDPOINTS
router.get('/menu_items', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT 
        m.item_id AS id,
        m.category_id,
        c.category_slug AS category,
        c.category_name AS category_name,
        m.name,
        m.description,
        m.price,
        m.serving_size,
        m.prep_time,
        m.availability,
        m.image,
        m.ingredients,
        m.allergens,
        m.status,
        m.is_featured,
        m.date_added,
        m.last_updated
      FROM menu_items m
      INNER JOIN categories c ON m.category_id = c.category_id
      ORDER BY m.item_id DESC
    `)
    res.json({ status: 'success', items })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/menu_items', async (req, res) => {
  const {
    name,
    category,
    category_id,
    description,
    price,
    serving_size,
    prep_time,
    availability,
    image,
    ingredients,
    allergens,
    status,
    is_featured
  } = req.body

  if (!name || !price || (!category && !category_id)) {
    return res.status(400).json({ status: 'error', message: 'Dish name, category, and price are required.' })
  }

  try {
    const resolvedCatId = category_id || await getCategoryIdBySlug(category)

    const [result] = await pool.query(
      `INSERT INTO menu_items 
       (category_id, name, description, price, serving_size, prep_time, availability, image, ingredients, allergens, status, is_featured, date_added, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_DATE)`,
      [
        resolvedCatId,
        name.trim(),
        description || 'Signature dish.',
        parseFloat(price),
        serving_size || '1 Serving',
        prep_time || '25 minutes',
        availability || 'Available',
        image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        ingredients || 'Fresh local ingredients',
        allergens || 'None',
        status || 'Active',
        is_featured ? 1 : 0
      ]
    )

    res.json({
      status: 'success',
      message: `Dish item "${name}" created successfully!`,
      item_id: result.insertId
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

router.put('/menu_items/:id', async (req, res) => {
  const { id } = req.params
  const {
    name,
    category,
    category_id,
    description,
    price,
    serving_size,
    prep_time,
    availability,
    image,
    ingredients,
    allergens,
    status,
    is_featured
  } = req.body

  try {
    if (is_featured !== undefined && name === undefined) {
      await pool.query(
        'UPDATE menu_items SET is_featured = ?, last_updated = CURRENT_DATE WHERE item_id = ?',
        [is_featured ? 1 : 0, id]
      )
      return res.json({ status: 'success', message: 'Featured status updated in MariaDB!' })
    }

    const resolvedCatId = category_id || await getCategoryIdBySlug(category)

    await pool.query(
      `UPDATE menu_items 
       SET category_id = ?, name = ?, description = ?, price = ?, serving_size = ?, prep_time = ?, availability = ?, image = ?, ingredients = ?, allergens = ?, status = ?, is_featured = ?, last_updated = CURRENT_DATE
       WHERE item_id = ?`,
      [
        resolvedCatId,
        name,
        description,
        parseFloat(price),
        serving_size,
        prep_time,
        availability,
        image,
        ingredients,
        allergens,
        status,
        is_featured ? 1 : 0,
        id
      ]
    )

    res.json({ status: 'success', message: `Updated "${name}" specifications successfully!` })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.put('/menu_items/:id/availability', async (req, res) => {
  const { id } = req.params
  const { availability } = req.body

  try {
    await pool.query('UPDATE menu_items SET availability = ?, last_updated = CURRENT_DATE WHERE item_id = ?', [availability, id])
    res.json({ status: 'success', message: `Stock status updated to ${availability}` })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/menu_items/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM menu_items WHERE item_id = ?', [id])
    res.json({ status: 'success', message: 'Dish item removed from database.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.get('/menu', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT category_id, category_slug AS id, category_name AS label FROM categories ORDER BY category_id ASC')
    const [items] = await pool.query(`
      SELECT 
        m.item_id AS id,
        c.category_slug AS category,
        m.name,
        m.description,
        m.price,
        m.serving_size,
        m.prep_time,
        m.availability,
        m.image,
        m.ingredients,
        m.allergens,
        m.is_featured
      FROM menu_items m
      INNER JOIN categories c ON m.category_id = c.category_id
      ORDER BY m.item_id DESC
    `)

    res.json({
      status: 'success',
      categories: [{ id: 'all', label: 'All Dishes' }, ...categories],
      items
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
