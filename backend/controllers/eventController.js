import pool from '../config/db.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `event_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// GET /api/events — public, optionally filter by municipality_id or month
export const getEvents = async (req, res) => {
  const { municipalityId, month, year } = req.query;
  try {
    let query = `
      SELECT e.*, m.name AS municipality_name
      FROM events e
      LEFT JOIN municipalities m ON e.municipality_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (municipalityId) {
      params.push(municipalityId);
      query += ` AND e.municipality_id = $${params.length}`;
    }
    if (month && year) {
      params.push(parseInt(month), parseInt(year));
      query += ` AND EXTRACT(MONTH FROM e.start_date) = $${params.length - 1} AND EXTRACT(YEAR FROM e.start_date) = $${params.length}`;
    }
    query += ' ORDER BY e.start_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: 'Server error fetching events.' });
  }
};

// POST /api/events — MUNICIPAL_DOT only
export const createEvent = async (req, res) => {
  const { title, description, category, startDate, endDate, venue } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !startDate) {
    return res.status(400).json({ message: 'Title and start date are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (municipality_id, title, description, category, image_url, start_date, end_date, venue, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.municipality_id, title, description, category || 'Festival', imageUrl, startDate, endDate || null, venue || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ message: 'Server error creating event.' });
  }
};

// PUT /api/events/:id — MUNICIPAL_DOT only
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, startDate, endDate, venue } = req.body;

  try {
    // Verify ownership
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found.' });
    if (existing.rows[0].municipality_id !== req.user.municipality_id && req.user.role !== 'PROVINCIAL_DOT') {
      return res.status(403).json({ message: 'Not authorized to edit this event.' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.rows[0].image_url;

    const result = await pool.query(
      `UPDATE events SET title=$1, description=$2, category=$3, image_url=$4, start_date=$5, end_date=$6, venue=$7
       WHERE id=$8 RETURNING *`,
      [title, description, category, imageUrl, startDate, endDate || null, venue || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ message: 'Server error updating event.' });
  }
};

// DELETE /api/events/:id — MUNICIPAL_DOT or PROVINCIAL_DOT
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found.' });
    if (existing.rows[0].municipality_id !== req.user.municipality_id && req.user.role !== 'PROVINCIAL_DOT') {
      return res.status(403).json({ message: 'Not authorized to delete this event.' });
    }
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ message: 'Server error deleting event.' });
  }
};

export { upload };
