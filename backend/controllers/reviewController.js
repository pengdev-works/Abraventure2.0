import pool from '../config/db.js';

// GET /api/reviews?homestayId=...&guideId=...
export const getReviews = async (req, res) => {
  const { homestayId, guideId } = req.query;
  try {
    let query = `
      SELECT r.*, ua.full_name AS reviewer_name
      FROM reviews r
      LEFT JOIN user_accounts ua ON r.tourist_id = ua.id
      WHERE 1=1
    `;
    const params = [];
    if (homestayId) { params.push(homestayId); query += ` AND r.homestay_id = $${params.length}`; }
    if (guideId) { params.push(guideId); query += ` AND r.guide_id = $${params.length}`; }
    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getReviews error:', err);
    res.status(500).json({ message: 'Server error fetching reviews.' });
  }
};

// POST /api/reviews — TOURIST only
export const createReview = async (req, res) => {
  const { homestayId, guideId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }
  if (!homestayId && !guideId) {
    return res.status(400).json({ message: 'Must specify homestayId or guideId.' });
  }

  try {
    // Check if tourist already reviewed this item
    const dupeCheck = await pool.query(
      `SELECT id FROM reviews WHERE tourist_id=$1 AND (homestay_id=$2 OR guide_id=$3)`,
      [req.user.id, homestayId || null, guideId || null]
    );
    if (dupeCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this listing.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (tourist_id, homestay_id, guide_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, homestayId || null, guideId || null, rating, comment || null]
    );

    // Notify homestay owner or guide
    if (homestayId) {
      const ownerRes = await pool.query('SELECT owner_id FROM homestay_profiles WHERE id=$1', [homestayId]);
      if (ownerRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, 'REVIEW', '/owner-dashboard?tab=reviews')`,
          [ownerRes.rows[0].owner_id, 'New Review Received', `A tourist left a ${rating}-star review on your homestay.`]
        ).catch(() => {});
      }
    }
    if (guideId) {
      const guideRes = await pool.query('SELECT guide_id FROM tour_guide_profiles WHERE id=$1', [guideId]);
      if (guideRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, 'REVIEW', '/guide-dashboard?tab=reviews')`,
          [guideRes.rows[0].guide_id, 'New Review Received', `A tourist left a ${rating}-star review on your guide profile.`]
        ).catch(() => {});
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Server error creating review.' });
  }
};

// DELETE /api/reviews/:id — PROVINCIAL_DOT or the review author
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT * FROM reviews WHERE id=$1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Review not found.' });

    const review = existing.rows[0];
    if (review.tourist_id !== req.user.id && req.user.role !== 'PROVINCIAL_DOT' && req.user.role !== 'MUNICIPAL_DOT') {
      return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    await pool.query('DELETE FROM reviews WHERE id=$1', [id]);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    console.error('deleteReview error:', err);
    res.status(500).json({ message: 'Server error deleting review.' });
  }
};

// GET /api/reviews/my — tourist's own reviews
export const getMyReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, hp.name AS homestay_name, CONCAT(ua.full_name) AS guide_name
       FROM reviews r
       LEFT JOIN homestay_profiles hp ON r.homestay_id = hp.id
       LEFT JOIN tour_guide_profiles tgp ON r.guide_id = tgp.id
       LEFT JOIN user_accounts ua ON tgp.guide_id = ua.id
       WHERE r.tourist_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getMyReviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/reviews/received — owner/guide gets reviews for their listing
export const getReceivedReviews = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'HOMESTAY_OWNER') {
      result = await pool.query(
        `SELECT r.*, ua.full_name AS reviewer_name
         FROM reviews r
         LEFT JOIN user_accounts ua ON r.tourist_id = ua.id
         JOIN homestay_profiles hp ON r.homestay_id = hp.id
         WHERE hp.owner_id = $1
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
    } else if (req.user.role === 'TOUR_GUIDE') {
      result = await pool.query(
        `SELECT r.*, ua.full_name AS reviewer_name
         FROM reviews r
         LEFT JOIN user_accounts ua ON r.tourist_id = ua.id
         JOIN tour_guide_profiles tgp ON r.guide_id = tgp.id
         WHERE tgp.guide_id = $1
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
    } else {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error('getReceivedReviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
