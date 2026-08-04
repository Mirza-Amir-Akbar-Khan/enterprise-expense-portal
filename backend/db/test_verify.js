import mysql from 'mysql2/promise';

async function testDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'app_db',
  });

  console.log('--- ROLES ---');
  const [roles] = await connection.query('SELECT * FROM roles');
  console.log(roles);

  console.log('--- CATEGORIES ---');
  const [categories] = await connection.query('SELECT * FROM categories');
  console.log(categories);

  console.log('--- STATUSES ---');
  const [statuses] = await connection.query('SELECT * FROM statuses');
  console.log(statuses);

  console.log('--- USERS (With Manager Name) ---');
  const [users] = await connection.query(`
    SELECT u.id, u.name, u.email, r.name AS role, u.manager_id, m.name AS manager_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    LEFT JOIN users m ON u.manager_id = m.id
  `);
  console.log(users);

  console.log('--- CLAIMS FOR MANAGER (Bob Manager, email: bob@company.com) ---');
  const [subordinates] = await connection.query(`
    WITH RECURSIVE subordinates AS (
      SELECT id FROM users WHERE email = 'bob@company.com'
      UNION ALL
      SELECT u.id FROM users u
      INNER JOIN subordinates s ON u.manager_id = s.id
    )
    SELECT id FROM subordinates WHERE id != (SELECT id FROM users WHERE email = 'bob@company.com')
  `);
  const subUserIds = subordinates.map(s => s.id);
  console.log('Subordinate User IDs for Bob:', subUserIds);

  const [claims] = await connection.query(
    `SELECT c.id, c.title, c.total_amount, cat.name AS category, st.name AS status, u.name AS employee_name
     FROM claims c
     LEFT JOIN users u ON c.user_id = u.id
     INNER JOIN categories cat ON c.category_id = cat.id
     INNER JOIN statuses st ON c.status_id = st.id
     WHERE c.user_id IN (?)`,
    [subUserIds]
  );
  console.log('Claims visible to Bob Manager:', claims);

  console.log('--- CLAIM ITEMS WITH S3 KEYS ---');
  const [items] = await connection.query(`
    SELECT id, claim_id, item_name, amount, s3_object_key FROM claim_items
  `);
  console.log(items);

  await connection.end();
}

testDatabase().catch(err => console.error('Verification Error:', err));
