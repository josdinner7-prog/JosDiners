import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'

const router = Router()

// CUSTOMERS REST API ENDPOINTS
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT 
        c.customer_id,
        c.full_name AS name,
        c.email,
        c.phone,
        c.profile_picture,
        c.is_verified,
        c.verification_code,
        c.created_at,
        c.updated_at,
        COALESCE(COUNT(o.order_id), 0) AS total_orders,
        COALESCE(SUM(o.grand_total), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON LOWER(c.full_name) = LOWER(o.customer_name) OR (c.phone IS NOT NULL AND c.phone != '' AND c.phone = o.customer_phone)
      GROUP BY c.customer_id, c.full_name, c.email, c.phone, c.profile_picture, c.is_verified, c.verification_code, c.created_at, c.updated_at
      ORDER BY c.customer_id DESC
    `)

    const mapped = customers.map(cust => ({
      ...cust,
      total_spent: parseFloat(cust.total_spent || 0),
      status: cust.total_spent >= 15000 ? 'VIP Client' : cust.is_verified ? 'Active Customer' : 'Unverified Account',
      last_order: cust.created_at
    }))

    res.json({ status: 'success', customers: mapped })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.post('/', async (req, res) => {
  const { full_name, email, phone, password, profile_picture } = req.body
  if (!full_name || !email) {
    return res.status(400).json({ status: 'error', message: 'Full Name and Email are required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const passHash = await bcrypt.hash(password || 'password123', 10)
    const [result] = await pool.query(
      `INSERT INTO customers (full_name, email, phone, password, profile_picture, is_verified) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [full_name.trim(), cleanEmail, phone || null, passHash, profile_picture || null]
    )

    res.json({
      status: 'success',
      message: `Customer "${full_name}" registered successfully!`,
      customer_id: result.insertId
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { full_name, email, phone, profile_picture, is_verified } = req.body

  try {
    await pool.query(
      `UPDATE customers SET 
        full_name = COALESCE(?, full_name), 
        email = COALESCE(?, email), 
        phone = COALESCE(?, phone), 
        profile_picture = COALESCE(?, profile_picture),
        is_verified = COALESCE(?, is_verified)
       WHERE customer_id = ?`,
      [full_name, email, phone, profile_picture, is_verified, id]
    )
    res.json({ status: 'success', message: 'Customer profile updated successfully!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM customers WHERE customer_id = ?', [id])
    res.json({ status: 'success', message: 'Customer record deleted from database.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
