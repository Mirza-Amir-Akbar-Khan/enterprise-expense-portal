import pool from '../config/db.js';

// Get all claims with line items (supports filtering by userEmail, cognitoSub, or managerEmail/managerId)
export async function getAllClaims(req, res) {
  const { userEmail, cognitoSub, managerEmail, managerId } = req.query;

  try {
    let querySql = `
      SELECT c.id, c.user_id, c.title, c.description, c.category_id, cat.name AS category,
             c.total_amount AS amount, c.claim_date AS date, c.status_id, st.name AS status,
             c.created_at, c.updated_at, u.name AS user_name, u.email AS user_email, u.manager_id
      FROM claims c
      LEFT JOIN users u ON c.user_id = u.id
      INNER JOIN categories cat ON c.category_id = cat.id
      INNER JOIN statuses st ON c.status_id = st.id
    `;
    const queryParams = [];

    if (managerEmail || managerId) {
      // Fetch all sub-ordinate user IDs reporting under this manager (recursively)
      const [subordinates] = await pool.query(
        `WITH RECURSIVE subordinates AS (
           SELECT id FROM users WHERE email = ? OR id = ?
           UNION ALL
           SELECT u.id FROM users u
           INNER JOIN subordinates s ON u.manager_id = s.id
         )
         SELECT id FROM subordinates`,
        [managerEmail || '', managerId || 0]
      );

      const managerUserId = subordinates.length > 0 ? subordinates[0].id : null;
      const subUserIds = subordinates
        .map(s => s.id)
        .filter(id => id !== managerUserId);

      if (subUserIds.length === 0) {
        return res.json({ success: true, count: 0, claims: [] });
      }

      querySql += ` WHERE c.user_id IN (?)`;
      queryParams.push(subUserIds);
    } else if (userEmail || cognitoSub) {
      querySql += ` WHERE u.email = ? OR u.cognito_sub = ?`;
      queryParams.push(userEmail || '', cognitoSub || '');
    }

    querySql += ` ORDER BY c.created_at DESC`;

    // 1. Fetch claims
    const [claims] = await pool.query(querySql, queryParams);

    if (claims.length === 0) {
      return res.json({ success: true, count: 0, claims: [] });
    }

    // 2. Fetch claim items with category names and s3_object_key
    const claimIds = claims.map(c => c.id);
    const [items] = await pool.query(
      `SELECT ci.id, ci.claim_id, ci.item_name AS itemName, ci.category_id,
              COALESCE(cat.name, 'Other') AS category, ci.amount, ci.notes, 
              ci.item_date AS itemDate, ci.s3_object_key AS s3ObjectKey
       FROM claim_items ci
       LEFT JOIN categories cat ON ci.category_id = cat.id
       WHERE ci.claim_id IN (?)
       ORDER BY ci.id ASC`,
      [claimIds]
    );

    // 3. Map items to their parent claim
    const itemsByClaimId = {};
    for (const item of items) {
      if (!itemsByClaimId[item.claim_id]) {
        itemsByClaimId[item.claim_id] = [];
      }
      itemsByClaimId[item.claim_id].push({
        id: item.id,
        itemName: item.itemName,
        categoryId: item.category_id,
        category: item.category,
        amount: parseFloat(item.amount),
        notes: item.notes,
        itemDate: item.itemDate,
        s3ObjectKey: item.s3ObjectKey || null,
      });
    }

    const formattedClaims = claims.map(claim => ({
      id: claim.id,
      userId: claim.user_id,
      userName: claim.user_name,
      userEmail: claim.user_email,
      title: claim.title,
      description: claim.description,
      categoryId: claim.category_id,
      category: claim.category,
      amount: parseFloat(claim.amount),
      date: claim.date,
      statusId: claim.status_id,
      status: claim.status,
      items: itemsByClaimId[claim.id] || [],
    }));

    res.json({ success: true, count: formattedClaims.length, claims: formattedClaims });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get single claim by ID
export async function getClaimById(req, res) {
  const { id } = req.params;
  try {
    const [claims] = await pool.query(
      `SELECT c.id, c.user_id, c.title, c.description, c.category_id, cat.name AS category,
              c.total_amount AS amount, c.claim_date AS date, c.status_id, st.name AS status,
              u.name AS user_name, u.email AS user_email
       FROM claims c
       LEFT JOIN users u ON c.user_id = u.id
       INNER JOIN categories cat ON c.category_id = cat.id
       INNER JOIN statuses st ON c.status_id = st.id
       WHERE c.id = ?`,
      [id]
    );

    if (claims.length === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const claim = claims[0];
    const [items] = await pool.query(
      `SELECT ci.id, ci.item_name AS itemName, ci.category_id, COALESCE(cat.name, 'Other') AS category,
              ci.amount, ci.notes, ci.item_date AS itemDate, ci.s3_object_key AS s3ObjectKey
       FROM claim_items ci
       LEFT JOIN categories cat ON ci.category_id = cat.id
       WHERE ci.claim_id = ?`,
      [id]
    );

    claim.amount = parseFloat(claim.amount);
    claim.items = items.map(item => ({
      ...item,
      amount: parseFloat(item.amount),
      s3ObjectKey: item.s3ObjectKey || null,
    }));

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new claim with sub-items and S3 object keys (Transactional)
export async function createClaim(req, res) {
  const { title, description, category, categoryId, date, items, userId, cognitoSub, userEmail } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'Title and claim date are required' });
  }

  const lineItems = Array.isArray(items) ? items : [];
  const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Look up DB user_id by cognitoSub or userEmail if available
    let finalUserId = userId || 1;
    if (cognitoSub || userEmail) {
      const [foundUser] = await connection.query(
        'SELECT id FROM users WHERE cognito_sub = ? OR email = ? LIMIT 1',
        [cognitoSub || '', userEmail || '']
      );
      if (foundUser.length > 0) {
        finalUserId = foundUser[0].id;
      }
    }

    // Resolve category_id
    let finalCategoryId = categoryId ? Number(categoryId) : null;
    if (!finalCategoryId && category) {
      const [cats] = await connection.query('SELECT id FROM categories WHERE name = ? LIMIT 1', [category]);
      if (cats.length > 0) finalCategoryId = cats[0].id;
    }
    if (!finalCategoryId) {
      const [defaultCat] = await connection.query('SELECT id FROM categories WHERE name = "Other" LIMIT 1');
      finalCategoryId = defaultCat.length > 0 ? defaultCat[0].id : 5;
    }

    // Resolve default status_id ('Pending')
    const [statuses] = await connection.query('SELECT id FROM statuses WHERE name = "Pending" LIMIT 1');
    const pendingStatusId = statuses.length > 0 ? statuses[0].id : 1;

    // 1. Insert header claim
    const [claimResult] = await connection.query(
      `INSERT INTO claims (user_id, title, description, category_id, total_amount, claim_date, status_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [finalUserId, title, description || '', finalCategoryId, totalAmount, date, pendingStatusId]
    );

    const newClaimId = claimResult.insertId;

    // Pre-fetch category lookup table for items mapping
    const [catList] = await connection.query('SELECT id, name FROM categories');
    const catMap = {};
    for (const c of catList) {
      catMap[c.name.toLowerCase()] = c.id;
    }

    // 2. Insert line items with s3_object_key if present
    if (lineItems.length > 0) {
      const itemValues = lineItems.map(item => {
        const itemCatName = (item.category || 'Other').toLowerCase();
        const itemCatId = item.categoryId ? Number(item.categoryId) : (catMap[itemCatName] || catMap['other'] || 5);
        const s3Key = item.s3ObjectKey || item.s3_object_key || null;

        return [
          newClaimId,
          item.itemName || item.title || 'Expense Item',
          itemCatId,
          parseFloat(item.amount) || 0,
          item.notes || null,
          item.itemDate || item.date || date,
          s3Key,
        ];
      });

      await connection.query(
        `INSERT INTO claim_items (claim_id, item_name, category_id, amount, notes, item_date, s3_object_key)
         VALUES ?`,
        [itemValues]
      );
    }

    await connection.commit();

    // Fetch created category name
    const [catInfo] = await pool.query('SELECT name FROM categories WHERE id = ?', [finalCategoryId]);
    const catName = catInfo.length > 0 ? catInfo[0].name : 'Other';

    res.status(201).json({
      success: true,
      message: 'Expense claim created successfully',
      claim: {
        id: newClaimId,
        title,
        description,
        categoryId: finalCategoryId,
        category: catName,
        amount: totalAmount,
        date,
        statusId: pendingStatusId,
        status: 'Pending',
        items: lineItems,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating claim:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
}

// Update claim status (Approve / Reject)
export async function updateClaimStatus(req, res) {
  const { id } = req.params;
  const { status, statusId, reviewedBy } = req.body;

  try {
    let finalStatusId = statusId ? Number(statusId) : null;
    if (!finalStatusId && status) {
      const [statuses] = await pool.query('SELECT id FROM statuses WHERE UPPER(name) = UPPER(?) LIMIT 1', [status]);
      if (statuses.length > 0) finalStatusId = statuses[0].id;
    }

    if (!finalStatusId) {
      return res.status(400).json({ success: false, message: 'Invalid status value specified' });
    }

    const [result] = await pool.query(
      `UPDATE claims 
       SET status_id = ?, reviewed_by = ?, updated_at = NOW() 
       WHERE id = ?`,
      [finalStatusId, reviewedBy || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const [stInfo] = await pool.query('SELECT name FROM statuses WHERE id = ?', [finalStatusId]);
    const statusName = stInfo.length > 0 ? stInfo[0].name : status;

    res.json({ success: true, message: `Claim status updated to ${statusName}` });
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get statistics summary for Manager Portal
export async function getClaimStats(req, res) {
  const { managerEmail, managerId } = req.query;

  try {
    let querySql = `
      SELECT 
        SUM(CASE WHEN UPPER(st.name) = 'PENDING' THEN 1 ELSE 0 END) AS totalPending,
        SUM(CASE WHEN UPPER(st.name) = 'APPROVED' THEN 1 ELSE 0 END) AS totalApproved,
        COALESCE(SUM(CASE WHEN UPPER(st.name) = 'APPROVED' THEN c.total_amount ELSE 0 END), 0) AS totalAmount
      FROM claims c
      INNER JOIN statuses st ON c.status_id = st.id
    `;

    const queryParams = [];

    if (managerEmail || managerId) {
      const [subordinates] = await pool.query(
        `WITH RECURSIVE subordinates AS (
           SELECT id FROM users WHERE email = ? OR id = ?
           UNION ALL
           SELECT u.id FROM users u
           INNER JOIN subordinates s ON u.manager_id = s.id
         )
         SELECT id FROM subordinates`,
        [managerEmail || '', managerId || 0]
      );

      const managerUserId = subordinates.length > 0 ? subordinates[0].id : null;
      const subUserIds = subordinates
        .map(s => s.id)
        .filter(id => id !== managerUserId);

      if (subUserIds.length === 0) {
        return res.json({
          success: true,
          stats: { totalPending: 0, totalApproved: 0, totalAmount: 0 },
        });
      }

      querySql += ` WHERE c.user_id IN (?)`;
      queryParams.push(subUserIds);
    }

    const [stats] = await pool.query(querySql, queryParams);

    const data = stats[0];
    res.json({
      success: true,
      stats: {
        totalPending: Number(data.totalPending || 0),
        totalApproved: Number(data.totalApproved || 0),
        totalAmount: parseFloat(data.totalAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching claim stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Delete claim
export async function deleteClaim(req, res) {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM claims WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    res.json({ success: true, message: 'Claim deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
