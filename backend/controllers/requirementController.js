import pool from '../config/db.js';

// Create a new accreditation requirement (Municipal Admin only)
export const createRequirement = async (req, res) => {
  const { requirementName, description, targetType, isRequired } = req.body;
  const { municipality_id } = req.user; // from JWT token

  if (!requirementName || !targetType) {
    return res.status(400).json({ message: 'Requirement name and target type are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO municipal_requirements (municipality_id, target_type, requirement_name, description, is_required)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [municipality_id, targetType, requirementName, description, isRequired !== false]
    );

    return res.status(201).json({
      message: 'Accreditation requirement created successfully.',
      requirement: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating requirement:', err);
    return res.status(500).json({ message: 'Internal server error creating requirement.' });
  }
};

// Get requirements for a municipality (Public/Stakeholder view)
export const getRequirements = async (req, res) => {
  const { municipalityId } = req.params;
  const { targetType } = req.query; // 'HOMESTAY' or 'TOUR_GUIDE'

  if (!municipalityId || municipalityId === 'undefined') {
    return res.status(200).json([]);
  }

  const parsedId = parseInt(municipalityId);
  if (isNaN(parsedId)) {
    return res.status(200).json([]);
  }

  try {
    let query = 'SELECT * FROM municipal_requirements WHERE municipality_id = $1';
    const params = [parsedId];

    if (targetType) {
      query += ' AND target_type = $2';
      params.push(targetType);
    }

    query += ' ORDER BY id ASC';
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching requirements:', err);
    return res.status(500).json({ message: 'Internal server error fetching requirements.' });
  }
};

// Update requirement (Municipal Admin only)
export const updateRequirement = async (req, res) => {
  const { id } = req.params;
  const { requirementName, description, targetType, isRequired } = req.body;
  const { municipality_id } = req.user;

  try {
    const checkRes = await pool.query('SELECT * FROM municipal_requirements WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Requirement not found.' });
    }

    if (checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Forbidden. You do not manage requirements for this municipality.' });
    }

    const result = await pool.query(
      `UPDATE municipal_requirements 
       SET requirement_name = COALESCE($1, requirement_name),
           description = COALESCE($2, description),
           target_type = COALESCE($3, target_type),
           is_required = COALESCE($4, is_required)
       WHERE id = $5
       RETURNING *`,
      [requirementName, description, targetType, isRequired, id]
    );

    return res.status(200).json({
      message: 'Requirement updated successfully.',
      requirement: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating requirement:', err);
    return res.status(500).json({ message: 'Internal server error updating requirement.' });
  }
};

// Delete requirement (Municipal Admin only)
export const deleteRequirement = async (req, res) => {
  const { id } = req.params;
  const { municipality_id } = req.user;

  try {
    const checkRes = await pool.query('SELECT * FROM municipal_requirements WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Requirement not found.' });
    }

    if (checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Forbidden. You do not manage requirements for this municipality.' });
    }

    await pool.query('DELETE FROM municipal_requirements WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Requirement deleted successfully.' });
  } catch (err) {
    console.error('Error deleting requirement:', err);
    return res.status(500).json({ message: 'Internal server error deleting requirement.' });
  }
};
