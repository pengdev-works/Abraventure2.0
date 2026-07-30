import pool from '../config/db.js';

// Submit a document (Stakeholder only)
export const submitDocument = async (req, res) => {
  const { requirementId } = req.body;
  const userId = req.user.id;

  if (!requirementId) {
    return res.status(400).json({ message: 'Requirement ID is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const documentUrl = req.file.path;

  try {
    // Check if requirement exists
    const reqCheck = await pool.query('SELECT * FROM municipal_requirements WHERE id = $1', [requirementId]);
    if (reqCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Requirement not found.' });
    }

    // Check if document already submitted for this requirement
    const existingDoc = await pool.query(
      'SELECT * FROM submitted_documents WHERE user_id = $1 AND requirement_id = $2',
      [userId, requirementId]
    );

    let result;
    if (existingDoc.rows.length > 0) {
      // Update existing submission (resubmit)
      result = await pool.query(
        `UPDATE submitted_documents
         SET document_url = $1, status = 'PENDING', review_comments = NULL, submitted_at = CURRENT_TIMESTAMP, reviewed_at = NULL, reviewed_by = NULL
         WHERE id = $2 RETURNING *`,
        [documentUrl, existingDoc.rows[0].id]
      );
    } else {
      // Insert new submission
      result = await pool.query(
        `INSERT INTO submitted_documents (user_id, requirement_id, document_url, status)
         VALUES ($1, $2, $3, 'PENDING')
         RETURNING *`,
        [userId, requirementId, documentUrl]
      );
    }

    return res.status(200).json({
      message: 'Document submitted successfully.',
      document: result.rows[0],
    });
  } catch (err) {
    console.error('Error submitting document:', err);
    return res.status(500).json({ message: 'Internal server error submitting document.' });
  }
};

// Get all document submissions for a stakeholder (Stakeholder view of their own docs)
export const getMySubmissions = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT sd.*, mr.requirement_name, mr.is_required, mr.target_type
       FROM submitted_documents sd
       JOIN municipal_requirements mr ON sd.requirement_id = mr.id
       WHERE sd.user_id = $1`,
      [userId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    return res.status(500).json({ message: 'Internal server error fetching submissions.' });
  }
};

// Get document submissions for review (Municipal DOT Admin view)
export const getMunicipalSubmissions = async (req, res) => {
  const { municipality_id } = req.user;

  try {
    const result = await pool.query(
      `SELECT sd.*, mr.requirement_name, u.full_name as applicant_name, u.role as applicant_role
       FROM submitted_documents sd
       JOIN municipal_requirements mr ON sd.requirement_id = mr.id
       JOIN user_accounts u ON sd.user_id = u.id
       WHERE u.municipality_id = $1 AND mr.municipality_id = $1
       ORDER BY sd.submitted_at DESC`,
      [municipality_id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching municipal submissions:', err);
    return res.status(500).json({ message: 'Internal server error fetching submissions.' });
  }
};

// Review document (Municipal DOT Admin only)
export const reviewDocument = async (req, res) => {
  const { id } = req.params;
  const { status, reviewComments } = req.body; // status: 'ENDORSED' or 'REJECTED'
  const reviewerId = req.user.id;

  if (!status || !['ENDORSED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid review status. Must be ENDORSED or REJECTED.' });
  }

  try {
    // Check submission and verify municipality matching
    const subCheck = await pool.query(
      `SELECT sd.*, u.municipality_id 
       FROM submitted_documents sd
       JOIN user_accounts u ON sd.user_id = u.id
       WHERE sd.id = $1`,
      [id]
    );

    if (subCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (subCheck.rows[0].municipality_id !== req.user.municipality_id) {
      return res.status(403).json({ message: 'Forbidden. This applicant is from another municipality.' });
    }

    const result = await pool.query(
      `UPDATE submitted_documents
       SET status = $1, review_comments = $2, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $3
       WHERE id = $4 RETURNING *`,
      [status, reviewComments, reviewerId, id]
    );

    return res.status(200).json({
      message: 'Document reviewed successfully.',
      submission: result.rows[0],
    });
  } catch (err) {
    console.error('Error reviewing document:', err);
    return res.status(500).json({ message: 'Internal server error reviewing document.' });
  }
};
