import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🔄 Starting Database Initialization...');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    multipleStatements: true,
  };

  let connection;

  try {
    // 1. Create connection to MySQL server
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server.');

    // 2. Read schema.sql & seed.sql files
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // 3. Execute schema SQL
    console.log('⏳ Applying schema.sql...');
    await connection.query(schemaSql);
    console.log('✅ Database schema applied successfully.');

    // 4. Execute seed SQL
    console.log('⏳ Applying seed.sql...');
    await connection.query(seedSql);
    console.log('✅ Database seeded successfully.');

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
