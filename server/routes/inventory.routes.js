import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

/**
 * ============================================================================
 * SUMMARY & DASHBOARD METRICS
 * ============================================================================
 */
router.get('/summary', async (req, res) => {
  try {
    // 1. Perishable statistics
    const [perishables] = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity_on_hand <= min_threshold AND quantity_on_hand > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN quantity_on_hand <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) as expiring_soon_count,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired_count,
        SUM(quantity_on_hand * cost_per_unit) as total_inventory_value
      FROM inventory_perishables
    `)

    // 2. Reusable assets statistics
    const [assets] = await pool.query(`
      SELECT 
        COUNT(*) as total_asset_types,
        SUM(total_quantity) as total_units_owned,
        SUM(in_repair_quantity) as total_units_repair,
        SUM(damaged_lost_quantity) as total_units_lost,
        SUM(total_quantity * replacement_cost) as total_replacement_value
      FROM inventory_reusable_assets
    `)

    // 3. Active allocations statistics
    const [allocations] = await pool.query(`
      SELECT 
        COUNT(*) as total_active_allocations,
        SUM(CASE WHEN status = 'Dispatched' THEN 1 ELSE 0 END) as active_dispatched_count,
        SUM(allocated_quantity) as total_units_allocated
      FROM inventory_asset_allocations
      WHERE status IN ('Reserved', 'Dispatched')
    `)

    // 4. Recent logs
    const [recentLogs] = await pool.query(`
      SELECT l.*, p.item_name, p.unit, p.item_code
      FROM inventory_perishable_logs l
      JOIN inventory_perishables p ON l.item_id = p.item_id
      ORDER BY l.created_at DESC
      LIMIT 8
    `)

    res.json({
      status: 'success',
      data: {
        perishables: perishables[0] || {},
        assets: assets[0] || {},
        allocations: allocations[0] || {},
        recent_logs: recentLogs || []
      }
    })
  } catch (err) {
    console.error('[Inventory API] Summary error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * ============================================================================
 * TRACK 1: PERISHABLE FOOD INGREDIENTS
 * ============================================================================
 */

// GET /api/inventory/perishables - List & filter perishables
router.get('/perishables', async (req, res) => {
  try {
    const { category, status, search, low_stock, expiring } = req.query
    let sql = 'SELECT * FROM inventory_perishables WHERE 1=1'
    const params = []

    if (category && category !== 'all') {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (low_stock === 'true') {
      sql += ' AND quantity_on_hand <= min_threshold'
    }

    if (expiring === 'true') {
      sql += ' AND expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)'
    }

    if (search && search.trim()) {
      sql += ' AND (item_name LIKE ? OR item_code LIKE ? OR supplier LIKE ? OR storage_location LIKE ?)'
      const term = `%${search.trim()}%`
      params.push(term, term, term, term)
    }

    sql += ' ORDER BY CASE WHEN quantity_on_hand <= min_threshold THEN 0 ELSE 1 END, expiry_date ASC, item_name ASC'

    const [items] = await pool.query(sql, params)

    // Calculate dynamic freshness / status badge
    const today = new Date().toISOString().split('T')[0]
    const enriched = items.map(item => {
      let calcStatus = item.status || 'In Stock'
      const qty = parseFloat(item.quantity_on_hand) || 0
      const min = parseFloat(item.min_threshold) || 0

      if (qty <= 0) {
        calcStatus = 'Out of Stock'
      } else if (item.expiry_date && item.expiry_date < today) {
        calcStatus = 'Expired'
      } else if (qty <= min) {
        calcStatus = 'Low Stock'
      } else {
        calcStatus = 'In Stock'
      }

      let daysUntilExpiry = null
      if (item.expiry_date) {
        const diffMs = new Date(item.expiry_date).getTime() - new Date().getTime()
        daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        ...item,
        status: calcStatus,
        days_until_expiry: daysUntilExpiry
      }
    })

    res.json({ status: 'success', data: enriched })
  } catch (err) {
    console.error('[Inventory API] Get perishables error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// POST /api/inventory/perishables - Create new perishable ingredient
router.post('/perishables', async (req, res) => {
  try {
    const {
      item_code,
      item_name,
      category,
      quantity_on_hand,
      unit,
      min_threshold,
      cost_per_unit,
      supplier,
      storage_location,
      expiry_date,
      notes
    } = req.body

    if (!item_name || !unit) {
      return res.status(400).json({ status: 'error', message: 'Ingredient name and unit are required.' })
    }

    const code = item_code && item_code.trim()
      ? item_code.trim().toUpperCase()
      : `ING-${Date.now().toString().slice(-6)}`

    const qty = parseFloat(quantity_on_hand) || 0
    const min = parseFloat(min_threshold) || 5
    let initialStatus = 'In Stock'
    if (qty <= 0) initialStatus = 'Out of Stock'
    else if (qty <= min) initialStatus = 'Low Stock'

    const [result] = await pool.query(`
      INSERT INTO inventory_perishables 
      (item_code, item_name, category, quantity_on_hand, unit, min_threshold, cost_per_unit, supplier, storage_location, expiry_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      item_name.trim(),
      category || 'Pantry Supplies',
      qty,
      unit.trim(),
      min,
      parseFloat(cost_per_unit) || 0,
      supplier || null,
      storage_location || 'Main Kitchen Chiller',
      expiry_date || null,
      initialStatus,
      notes || null
    ])

    // Log initial intake if qty > 0
    if (qty > 0) {
      await pool.query(`
        INSERT INTO inventory_perishable_logs 
        (item_id, change_type, quantity_changed, balance_after, logged_by, remarks)
        VALUES (?, 'restock', ?, ?, ?, 'Initial inventory stock intake')
      `, [result.insertId, qty, qty, req.body.logged_by || 'Admin'])
    }

    res.json({
      status: 'success',
      message: 'Perishable ingredient created successfully.',
      item_id: result.insertId,
      item_code: code
    })
  } catch (err) {
    console.error('[Inventory API] Create perishable error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// PUT /api/inventory/perishables/:id - Update perishable item details
router.put('/perishables/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      item_name,
      category,
      unit,
      min_threshold,
      cost_per_unit,
      supplier,
      storage_location,
      expiry_date,
      notes
    } = req.body

    await pool.query(`
      UPDATE inventory_perishables
      SET item_name = COALESCE(?, item_name),
          category = COALESCE(?, category),
          unit = COALESCE(?, unit),
          min_threshold = COALESCE(?, min_threshold),
          cost_per_unit = COALESCE(?, cost_per_unit),
          supplier = COALESCE(?, supplier),
          storage_location = COALESCE(?, storage_location),
          expiry_date = COALESCE(?, expiry_date),
          notes = COALESCE(?, notes)
      WHERE item_id = ?
    `, [
      item_name,
      category,
      unit,
      min_threshold !== undefined ? parseFloat(min_threshold) : null,
      cost_per_unit !== undefined ? parseFloat(cost_per_unit) : null,
      supplier,
      storage_location,
      expiry_date,
      notes,
      id
    ])

    res.json({ status: 'success', message: 'Perishable ingredient updated successfully.' })
  } catch (err) {
    console.error('[Inventory API] Update perishable error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// DELETE /api/inventory/perishables/:id - Delete perishable ingredient
router.delete('/perishables/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM inventory_perishable_logs WHERE item_id = ?', [id])
    await pool.query('DELETE FROM inventory_perishables WHERE item_id = ?', [id])
    res.json({ status: 'success', message: 'Perishable ingredient deleted successfully.' })
  } catch (err) {
    console.error('[Inventory API] Delete perishable error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// POST /api/inventory/perishables/:id/log - Log stock usage, restock intake, or waste
router.post('/perishables/:id/log', async (req, res) => {
  try {
    const { id } = req.params
    const {
      change_type, // 'usage', 'restock', 'spoilage_waste', 'adjustment'
      quantity,
      reservation_id,
      event_title,
      logged_by,
      remarks,
      new_expiry_date
    } = req.body

    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) {
      return res.status(400).json({ status: 'error', message: 'A valid positive quantity is required.' })
    }

    const [rows] = await pool.query('SELECT * FROM inventory_perishables WHERE item_id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Ingredient not found.' })
    }

    const currentItem = rows[0]
    let currentQty = parseFloat(currentItem.quantity_on_hand) || 0
    let balanceAfter = currentQty

    if (change_type === 'usage' || change_type === 'spoilage_waste') {
      balanceAfter = Math.max(0, currentQty - qty)
    } else if (change_type === 'restock') {
      balanceAfter = currentQty + qty
    } else if (change_type === 'adjustment') {
      balanceAfter = qty
    }

    // Determine status
    let nextStatus = 'In Stock'
    const minThreshold = parseFloat(currentItem.min_threshold) || 5
    if (balanceAfter <= 0) {
      nextStatus = 'Out of Stock'
    } else if (balanceAfter <= minThreshold) {
      nextStatus = 'Low Stock'
    }

    // Update item quantity, status, and optional new expiry
    let updateSql = 'UPDATE inventory_perishables SET quantity_on_hand = ?, status = ?'
    const updateParams = [balanceAfter, nextStatus]

    if (new_expiry_date) {
      updateSql += ', expiry_date = ?'
      updateParams.push(new_expiry_date)
    }

    updateSql += ' WHERE item_id = ?'
    updateParams.push(id)

    await pool.query(updateSql, updateParams)

    // Insert log record
    await pool.query(`
      INSERT INTO inventory_perishable_logs
      (item_id, change_type, quantity_changed, balance_after, reservation_id, event_title, logged_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      change_type || 'usage',
      qty,
      balanceAfter,
      reservation_id || null,
      event_title || null,
      logged_by || 'Staff Member',
      remarks || null
    ])

    res.json({
      status: 'success',
      message: `Stock updated successfully (${change_type}: ${qty} ${currentItem.unit}). New balance: ${balanceAfter} ${currentItem.unit}`,
      data: {
        item_id: id,
        previous_balance: currentQty,
        quantity_changed: qty,
        balance_after: balanceAfter,
        unit: currentItem.unit,
        status: nextStatus
      }
    })
  } catch (err) {
    console.error('[Inventory API] Log perishable error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// GET /api/inventory/perishables/logs - Audit trail
router.get('/perishables/logs', async (req, res) => {
  try {
    const { item_id, change_type, limit = 50 } = req.query
    let sql = `
      SELECT l.*, p.item_name, p.unit, p.item_code, p.category
      FROM inventory_perishable_logs l
      JOIN inventory_perishables p ON l.item_id = p.item_id
      WHERE 1=1
    `
    const params = []

    if (item_id) {
      sql += ' AND l.item_id = ?'
      params.push(item_id)
    }

    if (change_type && change_type !== 'all') {
      sql += ' AND l.change_type = ?'
      params.push(change_type)
    }

    sql += ' ORDER BY l.created_at DESC LIMIT ?'
    params.push(parseInt(limit, 10) || 50)

    const [logs] = await pool.query(sql, params)
    res.json({ status: 'success', data: logs })
  } catch (err) {
    console.error('[Inventory API] Get logs error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * ============================================================================
 * TRACK 2: REUSABLE EVENT ASSETS (FURNITURE, CHAFERS, AV, HARDWARE)
 * ============================================================================
 */

// GET /api/inventory/assets - List reusable assets with live availability counts
router.get('/assets', async (req, res) => {
  try {
    const { category, search } = req.query
    let sql = `
      SELECT 
        a.*,
        COALESCE(SUM(CASE WHEN al.status IN ('Reserved', 'Dispatched') AND al.event_date = CURDATE() THEN al.allocated_quantity ELSE 0 END), 0) as currently_allocated_today
      FROM inventory_reusable_assets a
      LEFT JOIN inventory_asset_allocations al ON a.asset_id = al.asset_id
      WHERE 1=1
    `
    const params = []

    if (category && category !== 'all') {
      sql += ' AND a.category = ?'
      params.push(category)
    }

    if (search && search.trim()) {
      sql += ' AND (a.asset_name LIKE ? OR a.asset_code LIKE ? OR a.storage_location LIKE ?)'
      const term = `%${search.trim()}%`
      params.push(term, term, term)
    }

    sql += ' GROUP BY a.asset_id ORDER BY a.category ASC, a.asset_name ASC'

    const [rows] = await pool.query(sql, params)

    // Compute operational counts
    const enriched = rows.map(asset => {
      const total = parseInt(asset.total_quantity, 10) || 0
      const inRepair = parseInt(asset.in_repair_quantity, 10) || 0
      const lost = parseInt(asset.damaged_lost_quantity, 10) || 0
      const allocatedToday = parseInt(asset.currently_allocated_today, 10) || 0
      const effectiveStock = Math.max(0, total - inRepair - lost)
      const availableToday = Math.max(0, effectiveStock - allocatedToday)

      return {
        ...asset,
        effective_stock: effectiveStock,
        available_today: availableToday,
        allocated_today: allocatedToday
      }
    })

    res.json({ status: 'success', data: enriched })
  } catch (err) {
    console.error('[Inventory API] Get assets error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// POST /api/inventory/assets - Create new reusable asset
router.post('/assets', async (req, res) => {
  try {
    const {
      asset_code,
      asset_name,
      category,
      total_quantity,
      unit,
      replacement_cost,
      condition_status,
      storage_location,
      notes
    } = req.body

    if (!asset_name) {
      return res.status(400).json({ status: 'error', message: 'Asset name is required.' })
    }

    const code = asset_code && asset_code.trim()
      ? asset_code.trim().toUpperCase()
      : `AST-${Date.now().toString().slice(-6)}`

    const [result] = await pool.query(`
      INSERT INTO inventory_reusable_assets
      (asset_code, asset_name, category, total_quantity, unit, replacement_cost, condition_status, storage_location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      asset_name.trim(),
      category || 'Furniture & Seating',
      parseInt(total_quantity, 10) || 0,
      unit || 'pcs',
      parseFloat(replacement_cost) || 0,
      condition_status || 'Good',
      storage_location || 'Warehouse Bay 1',
      notes || null
    ])

    res.json({
      status: 'success',
      message: 'Reusable asset created successfully.',
      asset_id: result.insertId,
      asset_code: code
    })
  } catch (err) {
    console.error('[Inventory API] Create asset error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// PUT /api/inventory/assets/:id - Update reusable asset details, condition, repair counts
router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      asset_name,
      category,
      total_quantity,
      in_repair_quantity,
      damaged_lost_quantity,
      unit,
      replacement_cost,
      condition_status,
      storage_location,
      notes
    } = req.body

    await pool.query(`
      UPDATE inventory_reusable_assets
      SET asset_name = COALESCE(?, asset_name),
          category = COALESCE(?, category),
          total_quantity = COALESCE(?, total_quantity),
          in_repair_quantity = COALESCE(?, in_repair_quantity),
          damaged_lost_quantity = COALESCE(?, damaged_lost_quantity),
          unit = COALESCE(?, unit),
          replacement_cost = COALESCE(?, replacement_cost),
          condition_status = COALESCE(?, condition_status),
          storage_location = COALESCE(?, storage_location),
          notes = COALESCE(?, notes)
      WHERE asset_id = ?
    `, [
      asset_name,
      category,
      total_quantity !== undefined ? parseInt(total_quantity, 10) : null,
      in_repair_quantity !== undefined ? parseInt(in_repair_quantity, 10) : null,
      damaged_lost_quantity !== undefined ? parseInt(damaged_lost_quantity, 10) : null,
      unit,
      replacement_cost !== undefined ? parseFloat(replacement_cost) : null,
      condition_status,
      storage_location,
      notes,
      id
    ])

    res.json({ status: 'success', message: 'Reusable asset updated successfully.' })
  } catch (err) {
    console.error('[Inventory API] Update asset error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// DELETE /api/inventory/assets/:id - Delete reusable asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM inventory_asset_allocations WHERE asset_id = ?', [id])
    await pool.query('DELETE FROM inventory_reusable_assets WHERE asset_id = ?', [id])
    res.json({ status: 'success', message: 'Reusable asset deleted successfully.' })
  } catch (err) {
    console.error('[Inventory API] Delete asset error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

/**
 * ============================================================================
 * DATE-SPECIFIC AVAILABILITY & EVENT ASSET ALLOCATIONS
 * ============================================================================
 */

// GET /api/inventory/assets/availability?date=YYYY-MM-DD
// Calculates available capacity of all reusable assets for a specific event date
router.get('/assets/availability', async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0]

    const [rows] = await pool.query(`
      SELECT 
        a.asset_id,
        a.asset_code,
        a.asset_name,
        a.category,
        a.total_quantity,
        a.in_repair_quantity,
        a.damaged_lost_quantity,
        a.unit,
        a.condition_status,
        a.storage_location,
        COALESCE(SUM(CASE WHEN al.status IN ('Reserved', 'Dispatched') AND al.event_date = ? THEN al.allocated_quantity ELSE 0 END), 0) as allocated_on_date
      FROM inventory_reusable_assets a
      LEFT JOIN inventory_asset_allocations al ON a.asset_id = al.asset_id
      GROUP BY a.asset_id
      ORDER BY a.category ASC, a.asset_name ASC
    `, [targetDate])

    const availability = rows.map(item => {
      const total = parseInt(item.total_quantity, 10) || 0
      const inRepair = parseInt(item.in_repair_quantity, 10) || 0
      const lost = parseInt(item.damaged_lost_quantity, 10) || 0
      const allocated = parseInt(item.allocated_on_date, 10) || 0
      const effectiveStock = Math.max(0, total - inRepair - lost)
      const available = Math.max(0, effectiveStock - allocated)

      return {
        ...item,
        target_date: targetDate,
        effective_stock: effectiveStock,
        allocated_on_date: allocated,
        available_on_date: available,
        is_fully_booked: available <= 0
      }
    })

    res.json({
      status: 'success',
      date: targetDate,
      data: availability
    })
  } catch (err) {
    console.error('[Inventory API] Availability error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// GET /api/inventory/allocations - List all event equipment allocations
router.get('/allocations', async (req, res) => {
  try {
    const { date, reservation_id, status } = req.query
    let sql = `
      SELECT 
        al.*,
        a.asset_name,
        a.asset_code,
        a.category as asset_category,
        a.unit,
        a.total_quantity as asset_total_qty,
        a.storage_location
      FROM inventory_asset_allocations al
      JOIN inventory_reusable_assets a ON al.asset_id = a.asset_id
      WHERE 1=1
    `
    const params = []

    if (date) {
      sql += ' AND al.event_date = ?'
      params.push(date)
    }

    if (reservation_id) {
      sql += ' AND al.reservation_id = ?'
      params.push(reservation_id)
    }

    if (status && status !== 'all') {
      sql += ' AND al.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY al.event_date ASC, al.status ASC, al.allocation_id DESC'

    const [allocations] = await pool.query(sql, params)
    res.json({ status: 'success', data: allocations })
  } catch (err) {
    console.error('[Inventory API] Get allocations error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// POST /api/inventory/allocations - Allocate / reserve reusable assets for an event
router.post('/allocations', async (req, res) => {
  try {
    const {
      asset_id,
      reservation_id,
      event_title,
      event_date,
      allocated_quantity,
      remarks
    } = req.body

    if (!asset_id || !event_title || !event_date) {
      return res.status(400).json({ status: 'error', message: 'Asset, event title, and event date are required.' })
    }

    const qty = parseInt(allocated_quantity, 10)
    if (!qty || qty <= 0) {
      return res.status(400).json({ status: 'error', message: 'Allocated quantity must be at least 1.' })
    }

    // Check available capacity on that date
    const [assetRows] = await pool.query('SELECT * FROM inventory_reusable_assets WHERE asset_id = ?', [asset_id])
    if (assetRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Asset not found.' })
    }

    const asset = assetRows[0]
    const effectiveStock = Math.max(0, asset.total_quantity - asset.in_repair_quantity - asset.damaged_lost_quantity)

    const [existingAllocs] = await pool.query(`
      SELECT COALESCE(SUM(allocated_quantity), 0) as already_booked
      FROM inventory_asset_allocations
      WHERE asset_id = ? AND event_date = ? AND status IN ('Reserved', 'Dispatched')
    `, [asset_id, event_date])

    const alreadyBooked = parseInt(existingAllocs[0].already_booked, 10) || 0
    const available = effectiveStock - alreadyBooked

    if (qty > available) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient availability for "${asset.asset_name}" on ${event_date}. Requested: ${qty}, Available: ${available} (Total owned: ${asset.total_quantity}, Already booked: ${alreadyBooked}).`
      })
    }

    const [insertResult] = await pool.query(`
      INSERT INTO inventory_asset_allocations
      (asset_id, reservation_id, event_title, event_date, allocated_quantity, status, remarks)
      VALUES (?, ?, ?, ?, ?, 'Reserved', ?)
    `, [
      asset_id,
      reservation_id || null,
      event_title.trim(),
      event_date,
      qty,
      remarks || null
    ])

    res.json({
      status: 'success',
      message: `Successfully allocated ${qty} ${asset.unit} of "${asset.asset_name}" for ${event_title}.`,
      allocation_id: insertResult.insertId
    })
  } catch (err) {
    console.error('[Inventory API] Create allocation error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// PUT /api/inventory/allocations/:id/dispatch - Mark items dispatched to venue
router.put('/allocations/:id/dispatch', async (req, res) => {
  try {
    const { id } = req.params
    const { dispatched_by, remarks } = req.body

    await pool.query(`
      UPDATE inventory_asset_allocations
      SET status = 'Dispatched',
          dispatched_at = NOW(),
          dispatched_by = ?,
          remarks = COALESCE(?, remarks)
      WHERE allocation_id = ?
    `, [dispatched_by || 'Staff', remarks || null, id])

    res.json({ status: 'success', message: 'Asset allocation marked as Dispatched to event venue.' })
  } catch (err) {
    console.error('[Inventory API] Dispatch allocation error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// PUT /api/inventory/allocations/:id/return - Mark items returned with condition inspection
router.put('/allocations/:id/return', async (req, res) => {
  try {
    const { id } = req.params
    const { returned_by, damaged_qty = 0, missing_qty = 0, remarks } = req.body

    const [allocRows] = await pool.query('SELECT * FROM inventory_asset_allocations WHERE allocation_id = ?', [id])
    if (allocRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Allocation record not found.' })
    }

    const alloc = allocRows[0]
    const dmg = parseInt(damaged_qty, 10) || 0
    const mis = parseInt(missing_qty, 10) || 0

    await pool.query(`
      UPDATE inventory_asset_allocations
      SET status = 'Returned',
          returned_at = NOW(),
          returned_by = ?,
          damaged_qty = ?,
          missing_qty = ?,
          remarks = COALESCE(?, remarks)
      WHERE allocation_id = ?
    `, [returned_by || 'Staff', dmg, mis, remarks || null, id])

    // If items were damaged or lost, adjust the asset record
    if (dmg > 0 || mis > 0) {
      await pool.query(`
        UPDATE inventory_reusable_assets
        SET in_repair_quantity = in_repair_quantity + ?,
            damaged_lost_quantity = damaged_lost_quantity + ?
        WHERE asset_id = ?
      `, [dmg, mis, alloc.asset_id])
    }

    res.json({
      status: 'success',
      message: `Asset return processed. ${dmg > 0 ? `${dmg} damaged sent to repair. ` : ''}${mis > 0 ? `${mis} missing noted.` : 'All items accounted for in good order.'}`
    })
  } catch (err) {
    console.error('[Inventory API] Return allocation error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// DELETE /api/inventory/allocations/:id - Cancel an allocation
router.delete('/allocations/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM inventory_asset_allocations WHERE allocation_id = ?', [id])
    res.json({ status: 'success', message: 'Allocation cancelled successfully.' })
  } catch (err) {
    console.error('[Inventory API] Delete allocation error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
