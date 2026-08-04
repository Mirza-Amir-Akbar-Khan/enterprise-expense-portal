import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'app_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export default pool;
