import pool from '../config/db.js';

// POST /api/complaints - Create a complaint (Tourist only)
export const createComplaint = async (req, res) => {
  const touristId = req.user.id;
  const { title, description, municipalityId } = req.body;

  if (!title || !description || !municipalityId) {
    return res.status(400).json({ message: 'Title, description, and municipality are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaints (tourist_id, municipality_id, title, description, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [touristId, parseInt(municipalityId), title, description]
    );

    const newComplaint = result.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [touristId, 'CREATE_COMPLAINT', 'COMPLAINT', newComplaint.id, req.ip || 'unknown']
    ).catch(err => console.error('Activity log error:', err));

    // Notify municipal officers of this municipality
    const officers = await pool.query(
      `SELECT id FROM user_accounts WHERE role = 'MUNICIPAL_DOT' AND municipality_id = $1`,
      [parseInt(municipalityId)]
    );

    for (const officer of officers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'COMPLAINT', '/municipal-dashboard?tab=complaints')`,
        [
          officer.id,
          'New Complaint Submitted',
          `A new complaint titled "${title}" has been submitted for your municipality.`
        ]
      ).catch(() => {});
    }

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint: newComplaint
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    return res.status(500).json({ message: 'Server error creating complaint.' });
  }
};

// GET /api/complaints - Get complaints (Tourist, Municipal, Provincial context)
export const getComplaints = async (req, res) => {
  const userId = req.user.id;
  const { role, municipality_id } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'TOURIST') {
      query = `
        SELECT c.*, m.name as municipality_name, u.full_name as tourist_name
        FROM complaints c
        JOIN municipalities m ON c.municipality_id = m.id
        LEFT JOIN user_accounts u ON c.tourist_id = u.id
        WHERE c.tourist_id = $1
        ORDER BY c.created_at DESC`;
      params = [userId];
    } else if (role === 'MUNICIPAL_DOT') {
      query = `
        SELECT c.*, m.name as municipality_name, u.full_name as tourist_name, u.email as tourist_email
        FROM complaints c
        JOIN municipalities m ON c.municipality_id = m.id
        LEFT JOIN user_accounts u ON c.tourist_id = u.id
        WHERE c.municipality_id = $1
        ORDER BY c.created_at DESC`;
      params = [municipality_id];
    } else if (role === 'PROVINCIAL_DOT') {
      query = `
        SELECT c.*, m.name as municipality_name, u.full_name as tourist_name, u.email as tourist_email
        FROM complaints c
        JOIN municipalities m ON c.municipality_id = m.id
        LEFT JOIN user_accounts u ON c.tourist_id = u.id
        ORDER BY c.created_at DESC`;
      params = [];
    } else {
      return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
    }

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error getting complaints:', err);
    return res.status(500).json({ message: 'Server error fetching complaints.' });
  }
};

// PUT /api/complaints/:id/resolve - Resolve complaint (Municipal/Provincial DOT only)
export const resolveComplaint = async (req, res) => {
  const officerId = req.user.id;
  const { id } = req.params;
  const { resolutionDetails, status } = req.body;

  if (!resolutionDetails) {
    return res.status(400).json({ message: 'Resolution details are required.' });
  }

  const updatedStatus = status || 'RESOLVED';

  try {
    // Check if complaint exists and if user has access to it
    const checkRes = await pool.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const complaint = checkRes.rows[0];

    // Municipal DOT can only resolve complaints for their own municipality
    if (req.user.role === 'MUNICIPAL_DOT' && complaint.municipality_id !== req.user.municipality_id) {
      return res.status(403).json({ message: 'Access denied. You can only resolve complaints for your own municipality.' });
    }

    const updateRes = await pool.query(
      `UPDATE complaints
       SET status = $1, resolution_details = $2, resolved_at = CURRENT_TIMESTAMP, resolved_by = $3
       WHERE id = $4
       RETURNING *`,
      [updatedStatus, resolutionDetails, officerId, id]
    );

    const updatedComplaint = updateRes.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [officerId, 'RESOLVE_COMPLAINT', 'COMPLAINT', id, req.ip || 'unknown']
    ).catch(err => console.error('Activity log error:', err));

    // Notify the tourist who submitted the complaint
    if (complaint.tourist_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'COMPLAINT', '/tourist-dashboard?tab=complaints')`,
        [
          complaint.tourist_id,
          'Complaint Status Updated',
          `Your complaint titled "${complaint.title}" has been updated to "${updatedStatus}" by the Tourism Office.`
        ]
      ).catch(() => {});
    }

    return res.status(200).json({
      message: 'Complaint resolved successfully.',
      complaint: updatedComplaint
    });
  } catch (err) {
    console.error('Error resolving complaint:', err);
    return res.status(500).json({ message: 'Server error resolving complaint.' });
  }
};
