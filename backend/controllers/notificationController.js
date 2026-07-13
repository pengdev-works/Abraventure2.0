import pool from '../config/db.js';

// GET /api/notifications — current user's notifications
export const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read — mark single as read
export const markRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/read-all — mark all as read
export const markAllRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
