import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define 11 Organizational Seed Users (1 Admin + 10 Users)
const USERS_TO_SEED = [
  // 1. System Admin
  {
    email: 'admin@company.com',
    name: 'System Admin',
    role: 'ADMIN',
    role_id: 3,
    password: 'AdminPassword123!',
    managerEmail: null
  },

  // 2. Senior Managers (Manage the 3 Line Managers)
  {
    email: 'senior.manager1@company.com',
    name: 'Sarah Connor',
    role: 'MANAGER',
    role_id: 2,
    password: 'ManagerPassword123!',
    managerEmail: null
  },
  {
    email: 'senior.manager2@company.com',
    name: 'Robert Vance',
    role: 'MANAGER',
    role_id: 2,
    password: 'ManagerPassword123!',
    managerEmail: null
  },

  // 3. Line Managers (Managed by Senior Managers, manage Employees)
  {
    email: 'manager1@company.com',
    name: 'Michael Scott',
    role: 'MANAGER',
    role_id: 2,
    password: 'ManagerPassword123!',
    managerEmail: 'senior.manager1@company.com'
  },
  {
    email: 'manager2@company.com',
    name: 'Jim Halpert',
    role: 'MANAGER',
    role_id: 2,
    password: 'ManagerPassword123!',
    managerEmail: 'senior.manager1@company.com'
  },
  {
    email: 'manager3@company.com',
    name: 'Pam Beesly',
    role: 'MANAGER',
    role_id: 2,
    password: 'ManagerPassword123!',
    managerEmail: 'senior.manager2@company.com'
  },

  // 4. Employees (Managed by Line Managers)
  {
    email: 'employee1@company.com',
    name: 'Dwight Schrute',
    role: 'EMPLOYEE',
    role_id: 1,
    password: 'EmployeePassword123!',
    managerEmail: 'manager1@company.com'
  },
  {
    email: 'employee2@company.com',
    name: 'Ryan Howard',
    role: 'EMPLOYEE',
    role_id: 1,
    password: 'EmployeePassword123!',
    managerEmail: 'manager1@company.com'
  },
  {
    email: 'employee3@company.com',
    name: 'Stanley Hudson',
    role: 'EMPLOYEE',
    role_id: 1,
    password: 'EmployeePassword123!',
    managerEmail: 'manager2@company.com'
  },
  {
    email: 'employee4@company.com',
    name: 'Phyllis Vance',
    role: 'EMPLOYEE',
    role_id: 1,
    password: 'EmployeePassword123!',
    managerEmail: 'manager2@company.com'
  },
  {
    email: 'employee5@company.com',
    name: 'Kevin Malone',
    role: 'EMPLOYEE',
    role_id: 1,
    password: 'EmployeePassword123!',
    managerEmail: 'manager3@company.com'
  }
];

// Sample Expense Claims for the 5 Employees
const SAMPLE_CLAIMS = [
  {
    employeeEmail: 'employee1@company.com',
    title: 'AWS Re:Invent Conference Flight & Hotel',
    description: 'Travel expenses for AWS tech conference in Las Vegas',
    category_id: 1, // Travel
    claim_date: '2026-08-01',
    status_id: 1,   // PENDING
    items: [
      { item_name: 'Roundtrip Flight', category_id: 1, amount: 450.00, notes: 'Economy Class' },
      { item_name: 'Hotel Accommodation (3 Nights)', category_id: 1, amount: 800.00, notes: 'Venetian Hotel' }
    ]
  },
  {
    employeeEmail: 'employee2@company.com',
    title: 'Client Dinner & Taxi Ride',
    description: 'Entertaining prospective clients from Acme Corp',
    category_id: 2, // Meals
    claim_date: '2026-08-03',
    status_id: 2,   // APPROVED
    items: [
      { item_name: 'Dinner at Steakhouse', category_id: 2, amount: 120.00, notes: '4 attendees' },
      { item_name: 'Uber Taxi Fare', category_id: 1, amount: 25.50, notes: 'Return trip to office' }
    ]
  },
  {
    employeeEmail: 'employee3@company.com',
    title: 'Dual 4K Monitors & Ergonomic Chair',
    description: 'Home office equipment upgrade for remote work',
    category_id: 3, // Office Supplies
    claim_date: '2026-08-05',
    status_id: 4,   // PAID
    items: [
      { item_name: 'Dell 27-inch 4K Monitor', category_id: 3, amount: 330.00, notes: 'Primary Display' },
      { item_name: 'Ergonomic Desk Chair', category_id: 3, amount: 150.00, notes: 'Lumbar support' }
    ]
  },
  {
    employeeEmail: 'employee4@company.com',
    title: 'JetBrains IDE & Figma Software Subscriptions',
    description: 'Annual developer & design tool software licenses',
    category_id: 4, // Software
    claim_date: '2026-08-06',
    status_id: 1,   // PENDING
    items: [
      { item_name: 'JetBrains All Products Pack', category_id: 4, amount: 249.00, notes: 'Annual license' },
      { item_name: 'Figma Professional Plan', category_id: 4, amount: 50.00, notes: 'Monthly license' }
    ]
  },
  {
    employeeEmail: 'employee5@company.com',
    title: 'Department Team Lunch Catering',
    description: 'Monthly team bonding lunch for operations unit',
    category_id: 2, // Meals
    claim_date: '2026-08-07',
    status_id: 3,   // REJECTED
    items: [
      { item_name: 'Catering Buffet', category_id: 2, amount: 85.00, notes: 'Missing receipt copy' }
    ]
  }
];

async function initializeDatabase() {
  console.log('🔄 Starting Database Schema & User Seeding...');

  const awsRegion = process.env.AWS_REGION || 'us-west-2';
  const cognitoPoolId = process.env.COGNITO_USER_POOL_ID;

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'enterprise_expense_db',
    multipleStatements: true,
  };

  let connection;
  let cognitoClient = null;

  if (cognitoPoolId) {
    cognitoClient = new CognitoIdentityProviderClient({ region: awsRegion });
  }

  try {
    // 1. Connect to Aurora MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log(`✅ Connected to MySQL database "${dbConfig.database}" at ${dbConfig.host}.`);

    // 2. Read and apply schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Applying database schema & structural lookup data...');
    await connection.query(schemaSql);
    console.log('✅ Database schema applied successfully.');

    // 3. Provision 11 Users in AWS Cognito (Pre-Confirmed, no email verification needed)
    const userSubMap = {};

    if (cognitoClient && cognitoPoolId) {
      console.log(`⏳ Synchronizing 11 Seed Users in AWS Cognito Pool (${cognitoPoolId})...`);

      for (const u of USERS_TO_SEED) {
        let cognitoSub = null;

        try {
          // Check if user exists in Cognito
          const getUserRes = await cognitoClient.send(
            new AdminGetUserCommand({ UserPoolId: cognitoPoolId, Username: u.email })
          );
          const subAttr = getUserRes.UserAttributes?.find((a) => a.Name === 'sub');
          cognitoSub = subAttr?.Value;
          console.log(`  ℹ️ Cognito user "${u.email}" already exists.`);
        } catch (err) {
          if (err.name === 'UserNotFoundException') {
            console.log(`  ➕ Creating pre-verified Cognito user "${u.email}" (${u.role})...`);
            
            const createRes = await cognitoClient.send(
              new AdminCreateUserCommand({
                UserPoolId: cognitoPoolId,
                Username: u.email,
                UserAttributes: [
                  { Name: 'email', Value: u.email },
                  { Name: 'email_verified', Value: 'true' },
                  { Name: 'name', Value: u.name },
                  { Name: 'custom:role', Value: u.role }
                ],
                MessageAction: 'SUPPRESS'
              })
            );

            const subAttr = createRes.User?.Attributes?.find((a) => a.Name === 'sub');
            cognitoSub = subAttr?.Value;

            // Set permanent confirmed password
            await cognitoClient.send(
              new AdminSetUserPasswordCommand({
                UserPoolId: cognitoPoolId,
                Username: u.email,
                Password: u.password,
                Permanent: true
              })
            );
            console.log(`  ✅ User "${u.email}" created and password pre-confirmed!`);
          } else {
            console.warn(`  ⚠️ Cognito lookup error for "${u.email}":`, err.message);
          }
        }

        userSubMap[u.email] = cognitoSub;
      }
    }

    // 4. Synchronize Users in MySQL Database
    console.log('⏳ Inserting 11 Seed Users into MySQL Database...');
    const userDbIdMap = {};

    // First Pass: Insert Users without manager_id
    for (const u of USERS_TO_SEED) {
      const sub = userSubMap[u.email] || null;

      const [res] = await connection.query(
        `INSERT INTO users (cognito_sub, name, email, role_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cognito_sub = VALUES(cognito_sub), name = VALUES(name), role_id = VALUES(role_id)`,
        [sub, u.name, u.email, u.role_id]
      );

      const [rows] = await connection.query(`SELECT id FROM users WHERE email = ?`, [u.email]);
      if (rows.length > 0) {
        userDbIdMap[u.email] = rows[0].id;
      }
    }

    // Second Pass: Link manager_id Hierarchy
    console.log('⏳ Linking Manager Hierarchy in MySQL Database...');
    for (const u of USERS_TO_SEED) {
      if (u.managerEmail && userDbIdMap[u.managerEmail]) {
        const mgrDbId = userDbIdMap[u.managerEmail];
        const userDbId = userDbIdMap[u.email];

        await connection.query(`UPDATE users SET manager_id = ? WHERE id = ?`, [mgrDbId, userDbId]);
      }
    }
    console.log('✅ 11 Seed Users and Manager Hierarchy synchronized in Database.');

    // 5. Seed Sample Expense Claims (If claims table is empty)
    const [existingClaims] = await connection.query(`SELECT COUNT(*) as count FROM claims`);
    if (existingClaims[0].count === 0) {
      console.log('⏳ Seeding Sample Expense Claims & Claim Items...');

      for (const c of SAMPLE_CLAIMS) {
        const empDbId = userDbIdMap[c.employeeEmail];
        if (!empDbId) continue;

        // Calculate total amount
        const totalAmount = c.items.reduce((sum, item) => sum + item.amount, 0);

        // Find review manager ID if applicable
        const userObj = USERS_TO_SEED.find((u) => u.email === c.employeeEmail);
        const mgrEmail = userObj?.managerEmail;
        const mgrDbId = mgrEmail ? userDbIdMap[mgrEmail] : null;

        // Insert Claim Header
        const [claimRes] = await connection.query(
          `INSERT INTO claims (user_id, title, description, category_id, total_amount, claim_date, status_id, reviewed_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [empDbId, c.title, c.description, c.category_id, totalAmount, c.claim_date, c.status_id, mgrDbId]
        );

        const claimId = claimRes.insertId;

        // Insert Claim Sub-Items
        for (const item of c.items) {
          await connection.query(
            `INSERT INTO claim_items (claim_id, item_name, category_id, amount, item_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [claimId, item.item_name, item.category_id, item.amount, c.claim_date, item.notes]
          );
        }
      }

      console.log('✅ Sample Expense Claims & Claim Items seeded successfully.');
    } else {
      console.log('ℹ️ Claims table already contains records, skipping claims seeding.');
    }

    console.log('🎉 Database Schema, User Hierarchy, & Sample Claims Initialization Complete!');
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
