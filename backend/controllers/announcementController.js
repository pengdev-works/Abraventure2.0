import pool from '../config/db.js';

// GET /api/announcements — public (all published)
export const getAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, ua.full_name AS created_by_name
      FROM announcements a
      LEFT JOIN user_accounts ua ON a.created_by = ua.id
      WHERE a.is_published = true
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/announcements/all — PROVINCIAL_DOT only (includes unpublished)
export const getAllAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, ua.full_name AS created_by_name
      FROM announcements a
      LEFT JOIN user_accounts ua ON a.created_by = ua.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllAnnouncements error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/announcements — PROVINCIAL_DOT only
export const createAnnouncement = async (req, res) => {
  const { title, content, isPublished } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required.' });

  try {
    const result = await pool.query(
      `INSERT INTO announcements (created_by, title, content, is_published) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, content, isPublished !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/announcements/:id — PROVINCIAL_DOT only
export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content, isPublished } = req.body;
  try {
    const result = await pool.query(
      `UPDATE announcements SET title=$1, content=$2, is_published=$3 WHERE id=$4 RETURNING *`,
      [title, content, isPublished, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateAnnouncement error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/announcements/:id — PROVINCIAL_DOT only
export const deleteAnnouncement = async (req, res) => {
  try {
    await pool.query(`DELETE FROM announcements WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/announcements/activity-logs — PROVINCIAL_DOT only
export const getActivityLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, ua.full_name AS actor_name, ua.role AS actor_role
      FROM activity_logs al
      LEFT JOIN user_accounts ua ON al.user_id = ua.id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/announcements/guide-availability?guideId=...
export const getGuideAvailability = async (req, res) => {
  const { guideId } = req.query;
  if (!guideId) return res.status(400).json({ message: 'guideId required.' });
  try {
    const result = await pool.query(
      `SELECT * FROM guide_availability WHERE guide_id=$1 ORDER BY available_date ASC`,
      [guideId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getGuideAvailability error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/announcements/guide-availability — TOUR_GUIDE sets availability
export const setGuideAvailability = async (req, res) => {
  const { availableDate, isAvailable } = req.body;
  try {
    // Get the guide profile ID first
    const guideProfile = await pool.query(
      `SELECT id FROM tour_guide_profiles WHERE guide_id=$1`, [req.user.id]
    );
    if (guideProfile.rows.length === 0) return res.status(404).json({ message: 'Guide profile not found.' });

    const guideProfileId = guideProfile.rows[0].id;

    const result = await pool.query(
      `INSERT INTO guide_availability (guide_id, available_date, is_available)
       VALUES ($1, $2, $3)
       ON CONFLICT (guide_id, available_date)
       DO UPDATE SET is_available = EXCLUDED.is_available
       RETURNING *`,
      [guideProfileId, availableDate, isAvailable !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('setGuideAvailability error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
