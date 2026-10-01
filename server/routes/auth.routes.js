import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { sendGmailCode, sendGmailPasswordResetCode } from '../utils/mailer.js'

const router = Router()

// 1. CUSTOMER REGISTRATION ROUTE
router.post('/register', async (req, res) => {
  const { full_name, email, phone, password } = req.body

  if (!full_name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Full Name, Email, and Password are required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [existing] = await pool.query('SELECT customer_id, is_verified FROM customers WHERE email = ?', [cleanEmail])

    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(409).json({ status: 'error', message: 'This email is already registered as a customer and verified. Please log in.' })
    }

    // Generate 6-digit OTP verification code
    const verification_code = Math.floor(100000 + Math.random() * 900000).toString()
    const password_hash = await bcrypt.hash(password, 10)

    if (existing.length > 0) {
      await pool.query(
        'UPDATE customers SET full_name = ?, phone = ?, password = ?, verification_code = ? WHERE email = ?',
        [full_name.trim(), phone, password_hash, verification_code, cleanEmail]
      )
    } else {
      await pool.query(
        'INSERT INTO customers (full_name, email, phone, password, verification_code) VALUES (?, ?, ?, ?, ?)',
        [full_name.trim(), cleanEmail, phone, password_hash, verification_code]
      )
    }

    // Send live Gmail verification code
    try {
      await sendGmailCode(cleanEmail, full_name.trim(), verification_code)
    } catch (mailErr) {
      console.error('Gmail sending error:', mailErr.message)
    }

    res.status(201).json({
      status: 'success',
      message: 'Customer registration successful! A 6-digit verification code has been sent to your Gmail.',
      email: cleanEmail,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 2. RESEND VERIFICATION CODE ROUTE
router.post('/resend_code', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email address is required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query('SELECT customer_id, full_name, is_verified FROM customers WHERE email = ?', [cleanEmail])

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Customer account not found.' })
    }

    if (rows[0].is_verified) {
      return res.json({ status: 'success', message: 'Account is already verified.' })
    }

    const new_code = Math.floor(100000 + Math.random() * 900000).toString()
    await pool.query('UPDATE customers SET verification_code = ? WHERE email = ?', [new_code, cleanEmail])

    await sendGmailCode(cleanEmail, rows[0].full_name || 'Customer', new_code)

    res.json({
      status: 'success',
      message: 'A new 6-digit verification code has been sent to your Gmail inbox!',
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// 3. VERIFY EMAIL OTP CODE ROUTE
router.post('/verify_email', async (req, res) => {
  const { email, verification_code } = req.body

  if (!email || !verification_code) {
    return res.status(400).json({ status: 'error', message: 'Email and verification code are required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query('SELECT customer_id, verification_code, is_verified FROM customers WHERE email = ?', [cleanEmail])

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Customer account not found.' })
    }

    if (rows[0].is_verified) {
      return res.json({ status: 'success', message: 'Customer account is already verified. You may log in.' })
    }

    if (rows[0].verification_code !== verification_code.trim()) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code. Please check your Gmail.' })
    }

    await pool.query('UPDATE customers SET is_verified = 1, verification_code = NULL WHERE email = ?', [cleanEmail])
    res.json({ status: 'success', message: 'Customer email verified successfully! Your account is now active.' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 4. CUSTOMER LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query(
      'SELECT customer_id, full_name, email, phone, is_verified, password FROM customers WHERE email = ? OR phone = ?',
      [cleanEmail, cleanEmail]
    )

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' })
    }

    const customer = rows[0]
    const validPassword = await bcrypt.compare(password, customer.password)

    if (!validPassword && password !== customer.password) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' })
    }

    if (!customer.is_verified) {
      return res.status(403).json({
        status: 'error',
        is_unverified: true,
        email: customer.email,
        message: 'Your customer email is not verified yet. Please enter the verification code sent to your Gmail.',
      })
    }

    delete customer.password
    res.json({
      status: 'success',
      message: 'Customer logged in successfully!',
      user: customer,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 5. FORGOT PASSWORD - REQUEST OTP CODE
router.post('/forgot_password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email address is required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query('SELECT customer_id, full_name, email FROM customers WHERE email = ?', [cleanEmail])

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No registered customer account found with this email address.' })
    }

    const customer = rows[0]
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await pool.query(
      'UPDATE customers SET verification_code = ?, token_expires_at = ? WHERE email = ?',
      [resetCode, expiresAt, cleanEmail]
    )

    try {
      await sendGmailPasswordResetCode(cleanEmail, customer.full_name || 'Valued Customer', resetCode)
    } catch (mailErr) {
      console.error('Password reset Gmail error:', mailErr.message)
    }

    res.json({
      status: 'success',
      message: 'Password reset code sent to your Gmail inbox!',
      email: cleanEmail,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 6. FORGOT PASSWORD - VERIFY OTP CODE
router.post('/verify_reset_code', async (req, res) => {
  const { email, reset_code } = req.body

  if (!email || !reset_code) {
    return res.status(400).json({ status: 'error', message: 'Email and 6-digit reset code are required.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query(
      'SELECT customer_id, verification_code, token_expires_at FROM customers WHERE email = ?',
      [cleanEmail]
    )

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Customer account not found.' })
    }

    const customer = rows[0]

    if (!customer.verification_code || customer.verification_code !== reset_code.trim()) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code. Please check your Gmail.' })
    }

    if (customer.token_expires_at && new Date(customer.token_expires_at) < new Date()) {
      return res.status(400).json({ status: 'error', message: 'Verification code has expired. Please request a new code.' })
    }

    res.json({
      status: 'success',
      message: 'Reset code verified successfully! Create your new password.',
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 7. FORGOT PASSWORD - RESET PASSWORD
router.post('/reset_password', async (req, res) => {
  const { email, reset_code, new_password } = req.body

  if (!email || !reset_code || !new_password) {
    return res.status(400).json({ status: 'error', message: 'Email, reset code, and new password are required.' })
  }

  if (new_password.length < 6) {
    return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters long.' })
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const [rows] = await pool.query(
      'SELECT customer_id, verification_code, token_expires_at FROM customers WHERE email = ?',
      [cleanEmail]
    )

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Customer account not found.' })
    }

    const customer = rows[0]

    if (!customer.verification_code || customer.verification_code !== reset_code.trim()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired reset code authorization.' })
    }

    const password_hash = await bcrypt.hash(new_password, 10)

    await pool.query(
      'UPDATE customers SET password = ?, verification_code = NULL, token_expires_at = NULL, is_verified = 1 WHERE email = ?',
      [password_hash, cleanEmail]
    )

    res.json({
      status: 'success',
      message: 'Password reset successfully! You can now log in with your new password.',
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 8. STAFF / KITCHEN / ADMIN LOGIN ROUTE
router.post('/staff_login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required.' })
  }

  const cleanUser = username.trim().toLowerCase()

  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, full_name, password, role, title, phone_number, vehicle_type, plate_number, rider_status, profile_photo, shift_name, shift_hours, shift_days, shift_status FROM users WHERE username = ? OR phone_number = ?',
      [cleanUser, cleanUser]
    )

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid staff username or password.' })
    }

    const staffUser = rows[0]
    const validPassword = await bcrypt.compare(password, staffUser.password)

    if (!validPassword && password !== staffUser.password) {
      return res.status(401).json({ status: 'error', message: 'Invalid staff username or password.' })
    }

    delete staffUser.password
    res.json({
      status: 'success',
      message: `${staffUser.role.toUpperCase()} logged in successfully!`,
      user: staffUser,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

// 9. CUSTOMER SOCIAL LOGIN ROUTE (GOOGLE & FACEBOOK)
router.post('/social_login', async (req, res) => {
  const { provider, email, full_name, profile_picture } = req.body

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required for social login.' })
  }

  const cleanEmail = email.trim().toLowerCase()
  const name = (full_name && full_name.trim()) || cleanEmail.split('@')[0]
  const avatar = profile_picture || null

  try {
    const [rows] = await pool.query(
      'SELECT customer_id, full_name, email, phone, is_verified, profile_picture FROM customers WHERE email = ?',
      [cleanEmail]
    )

    let customer
    if (rows.length > 0) {
      customer = rows[0]
      // Mark verified and update full name / profile picture if not yet set
      await pool.query(
        'UPDATE customers SET is_verified = 1, full_name = COALESCE(NULLIF(full_name, ""), ?), profile_picture = COALESCE(profile_picture, ?) WHERE customer_id = ?',
        [name, avatar, customer.customer_id]
      )
      customer.is_verified = 1
      if (!customer.full_name) customer.full_name = name
      if (!customer.profile_picture && avatar) customer.profile_picture = avatar
    } else {
      // Auto-register verified social customer
      const defaultPasswordHash = await bcrypt.hash(`social_${provider || 'oauth'}_${Date.now()}`, 10)
      const [result] = await pool.query(
        'INSERT INTO customers (full_name, email, password, is_verified, profile_picture) VALUES (?, ?, ?, 1, ?)',
        [name, cleanEmail, defaultPasswordHash, avatar]
      )
      customer = {
        customer_id: result.insertId,
        full_name: name,
        email: cleanEmail,
        phone: null,
        is_verified: 1,
        profile_picture: avatar,
      }
    }

    res.json({
      status: 'success',
      message: `Successfully logged in with ${provider === 'facebook' ? 'Facebook' : 'Google'}!`,
      user: customer,
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database error: ' + err.message })
  }
})

export default router
