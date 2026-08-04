import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Express API Service',
  });
});

// DB check endpoint
router.get('/db-check', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES;');
    res.json({
      status: 'connected',
      database: process.env.DB_NAME,
      tables: rows,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to MySQL database',
      error: error.message,
    });
  }
});

export default router;
