/**
 * Shared notification helper — eliminates 8+ identical INSERT statements
 * scattered across inquiryController, reviewController, authController, etc.
 *
 * Silently swallows errors so a notification failure never breaks the main flow.
 *
 * @param {object} db   - pg pool or transaction client
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {string} [type='INFO']  - e.g. 'INFO', 'BOOKING', 'REVIEW', 'ACCREDITATION'
 * @param {string} [link]         - optional deep-link for the frontend
 */
export const sendNotification = async (db, userId, title, message, type = 'INFO', link = null) => {
  if (!userId) return;
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, link]
    );
  } catch {
    // Notification failure must never break the primary request flow
  }
};
