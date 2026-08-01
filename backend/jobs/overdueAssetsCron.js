import pool from '../config/db.js';

export const checkOverdueAssetsAndNotify = async () => {
  try {
    // Check for pending inquiries or overdue bookings and log/notify
    const result = await pool.query(
      `SELECT id, tourist_id, message, created_at FROM bookings_inquiries WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '3 days'`
    );
    return { success: true, count: result.rows.length, items: result.rows };
  } catch (err) {
    console.error('Overdue check error:', err);
    return { success: false, error: err.message };
  }
};

export const initOverdueCronJob = () => {
  console.log('[JOBS] Overdue assets cron job initialized.');
  // Run initial check on startup
  checkOverdueAssetsAndNotify().catch(() => {});
};
