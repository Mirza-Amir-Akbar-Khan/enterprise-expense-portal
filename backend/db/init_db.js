import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🔄 Starting Database Schema Initialization...');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'enterprise_expense_db',
    multipleStatements: true,
  };

  let connection;

  try {
    // 1. Create connection to Aurora MySQL database
    connection = await mysql.createConnection(config);
    console.log(`✅ Connected to MySQL database "${config.database}" at ${config.host}.`);

    // 2. Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 3. Execute schema SQL
    console.log('⏳ Applying database schema & structural lookup data...');
    await connection.query(schemaSql);
    console.log('✅ Database schema applied successfully.');

    // 4. Optionally apply seed data if --seed flag is passed
    if (process.argv.includes('--seed')) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        console.log('⏳ Applying seed.sql data...');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('✅ Seed data applied successfully.');
      }
    }

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
