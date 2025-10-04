const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Get all punches (optionally filter by date or mechanic)
router.get('/', async (req, res) => {
  try {
    const { date, mechanic_name, status } = req.query;

    let query = 'SELECT * FROM punches WHERE 1=1';
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND date = $${params.length}`;
    }

    if (mechanic_name) {
      params.push(mechanic_name);
      query += ` AND mechanic_name = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY punch_in DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching punches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active punch for a mechanic (currently clocked in)
router.get('/active/:mechanic_name', async (req, res) => {
  try {
    const { mechanic_name } = req.params;

    const result = await db.query(
      `SELECT * FROM punches
       WHERE mechanic_name = $1 AND status = 'active'
       ORDER BY punch_in DESC
       LIMIT 1`,
      [mechanic_name]
    );

    if (result.rows.length === 0) {
      return res.json({ active: false, punch: null });
    }

    res.json({ active: true, punch: result.rows[0] });
  } catch (error) {
    console.error('Error fetching active punch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Punch in (clock in)
router.post('/punch-in', async (req, res) => {
  try {
    const { mechanic_name } = req.body;

    if (!mechanic_name) {
      return res.status(400).json({ error: 'mechanic_name is required' });
    }

    // Check if mechanic already has an active punch
    const activePunch = await db.query(
      'SELECT * FROM punches WHERE mechanic_name = $1 AND status = $2',
      [mechanic_name, 'active']
    );

    if (activePunch.rows.length > 0) {
      return res.status(400).json({
        error: 'Mechanic already has an active punch. Please punch out first.'
      });
    }

    // Create new punch
    const result = await db.query(
      `INSERT INTO punches (mechanic_name, punch_in, date, status)
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_DATE, 'active')
       RETURNING *`,
      [mechanic_name]
    );

    // Emit socket event
    if (global.io) {
      global.io.emit('punch-added', result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error punching in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Punch out (clock out)
router.put('/punch-out/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Update punch with punch_out time (trigger will calculate hours)
    const result = await db.query(
      `UPDATE punches
       SET punch_out = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Punch not found' });
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('punch-updated', result.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error punching out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all car work sessions
router.get('/car-sessions', async (req, res) => {
  try {
    const { date, mechanic_name, car_id } = req.query;

    let query = `
      SELECT cws.*, c.brand, c.model, c.year
      FROM car_work_sessions cws
      LEFT JOIN cars c ON cws.car_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND DATE(cws.start_time) = $${params.length}`;
    }

    if (mechanic_name) {
      params.push(mechanic_name);
      query += ` AND cws.mechanic_name = $${params.length}`;
    }

    if (car_id) {
      params.push(car_id);
      query += ` AND cws.car_id = $${params.length}`;
    }

    query += ' ORDER BY cws.start_time DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching car work sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active car work session for a mechanic
router.get('/car-sessions/active/:mechanic_name', async (req, res) => {
  try {
    const { mechanic_name } = req.params;

    const result = await db.query(
      `SELECT cws.*, c.brand, c.model, c.year
       FROM car_work_sessions cws
       LEFT JOIN cars c ON cws.car_id = c.id
       WHERE cws.mechanic_name = $1 AND cws.end_time IS NULL
       ORDER BY cws.start_time DESC
       LIMIT 1`,
      [mechanic_name]
    );

    if (result.rows.length === 0) {
      return res.json({ active: false, session: null });
    }

    res.json({ active: true, session: result.rows[0] });
  } catch (error) {
    console.error('Error fetching active car session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start work on a car
router.post('/car-sessions/start', async (req, res) => {
  try {
    const { punch_id, car_id, mechanic_name, notes } = req.body;

    if (!punch_id || !car_id || !mechanic_name) {
      return res.status(400).json({
        error: 'punch_id, car_id, and mechanic_name are required'
      });
    }

    // Verify punch exists (can be active or completed)
    const punchCheck = await db.query(
      'SELECT * FROM punches WHERE id = $1',
      [punch_id]
    );

    if (punchCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Punch not found.'
      });
    }

    // Only check for active sessions if the punch is still active
    if (punchCheck.rows[0].status === 'active') {
      const activeSession = await db.query(
        'SELECT * FROM car_work_sessions WHERE mechanic_name = $1 AND end_time IS NULL',
        [mechanic_name]
      );

      if (activeSession.rows.length > 0) {
        return res.status(400).json({
          error: 'Mechanic already working on another car. Please end current session first.'
        });
      }
    }

    // Create new car work session
    const result = await db.query(
      `INSERT INTO car_work_sessions (punch_id, car_id, mechanic_name, notes, start_time)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [punch_id, car_id, mechanic_name, notes || null]
    );

    // Emit socket event
    if (global.io) {
      global.io.emit('car-session-started', result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error starting car work session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End work on a car
router.put('/car-sessions/end/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Update session with end_time (trigger will calculate hours)
    const updateData = { end_time: 'CURRENT_TIMESTAMP' };
    if (notes) {
      updateData.notes = notes;
    }

    const result = await db.query(
      `UPDATE car_work_sessions
       SET end_time = CURRENT_TIMESTAMP, notes = COALESCE($2, notes)
       WHERE id = $1
       RETURNING *`,
      [id, notes || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car work session not found' });
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('car-session-ended', result.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error ending car work session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get summary for payroll (total hours by mechanic)
router.get('/summary/payroll', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        mechanic_name,
        COUNT(*) as total_days,
        SUM(total_hours) as total_hours,
        AVG(total_hours) as avg_hours_per_day,
        MIN(date) as first_day,
        MAX(date) as last_day
      FROM punches
      WHERE status = 'completed'
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND date <= $${params.length}`;
    }

    query += ' GROUP BY mechanic_name ORDER BY total_hours DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get summary for car costs (total hours by car)
router.get('/summary/car-costs', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        cws.car_id,
        c.brand,
        c.model,
        c.year,
        COUNT(DISTINCT cws.mechanic_name) as mechanics_count,
        SUM(cws.total_hours) as total_hours,
        COUNT(*) as sessions_count
      FROM car_work_sessions cws
      LEFT JOIN cars c ON cws.car_id = c.id
      WHERE cws.end_time IS NOT NULL
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND DATE(cws.start_time) >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND DATE(cws.start_time) <= $${params.length}`;
    }

    query += ' GROUP BY cws.car_id, c.brand, c.model, c.year ORDER BY total_hours DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching car costs summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete punch (admin function)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM punches WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Punch not found' });
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('punch-deleted', { id });
    }

    res.json({ message: 'Punch deleted successfully', punch: result.rows[0] });
  } catch (error) {
    console.error('Error deleting punch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
