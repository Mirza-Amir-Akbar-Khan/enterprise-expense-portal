import pool from '../config/db.js';

// Get all lookup tables (roles, categories, statuses)
export async function getLookups(req, res) {
  try {
    const [roles] = await pool.query('SELECT id, name FROM roles ORDER BY id ASC');
    const [categories] = await pool.query('SELECT id, name FROM categories ORDER BY id ASC');
    const [statuses] = await pool.query('SELECT id, name FROM statuses ORDER BY id ASC');

    res.json({
      success: true,
      roles,
      categories,
      statuses,
    });
  } catch (error) {
    console.error('Error fetching lookups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
