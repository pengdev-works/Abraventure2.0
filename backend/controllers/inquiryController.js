import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `payment_${Date.now()}${path.extname(file.originalname)}`),
});
export const upload = multer({ storage });

// Send booking inquiry (Tourist only)
export const createInquiry = async (req, res) => {
  const touristId = req.user.id;
  const { homestayId, guideId, startDate, endDate, numberOfGuests, message } = req.body;
  const paymentProofUrl = req.file ? req.file.path : null;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    // ── Date overlap check: block if selected dates conflict with a CONFIRMED booking ──
    if (startDate) {
      const effectiveEnd = endDate || startDate; // single-day if no end date
      let overlapQuery = null;
      let overlapParams = null;

      if (homestayId) {
        overlapQuery = `
          SELECT id FROM bookings_inquiries
          WHERE homestay_id = $1
            AND status = 'CONFIRMED'
            AND start_date IS NOT NULL
            AND (
              -- new range overlaps existing: NOT (new_end < existing_start OR new_start > existing_end)
              NOT ($2::date > COALESCE(end_date, start_date) OR $3::date < start_date)
            )
          LIMIT 1`;
        overlapParams = [homestayId, effectiveEnd, startDate];
      } else if (guideId) {
        overlapQuery = `
          SELECT id FROM bookings_inquiries
          WHERE guide_id = $1
            AND status = 'CONFIRMED'
            AND start_date IS NOT NULL
            AND (
              NOT ($2::date > COALESCE(end_date, start_date) OR $3::date < start_date)
            )
          LIMIT 1`;
        overlapParams = [guideId, effectiveEnd, startDate];
      }

      if (overlapQuery) {
        const overlapCheck = await pool.query(overlapQuery, overlapParams);
        if (overlapCheck.rows.length > 0) {
          return res.status(409).json({
            message: 'Those dates are already booked and confirmed. Please choose different dates.',
          });
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO bookings_inquiries (tourist_id, homestay_id, guide_id, start_date, end_date, number_of_guests, message, status, payment_proof_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
       RETURNING *`,
      [
        touristId,
        homestayId || null,
        guideId || null,
        startDate || null,
        endDate || null,
        numberOfGuests ? parseInt(numberOfGuests) : null,
        message,
        paymentProofUrl
      ]
    );

    // Notify the stakeholder of new booking inquiry
    if (homestayId) {
      const ownerRes = await pool.query('SELECT owner_id FROM homestay_profiles WHERE id=$1', [homestayId]);
      if (ownerRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'BOOKING')`,
          [ownerRes.rows[0].owner_id, 'New Booking Inquiry', `A tourist sent a booking inquiry for your homestay${paymentProofUrl ? ' with payment proof attached' : ''}.`]
        );
      }
    }
    if (guideId) {
      const guideRes = await pool.query('SELECT guide_id FROM tour_guide_profiles WHERE id=$1', [guideId]);
      if (guideRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'BOOKING')`,
          [guideRes.rows[0].guide_id, 'New Booking Inquiry', 'A tourist sent a booking inquiry for your guide services.']
        );
      }
    }

    return res.status(201).json({
      message: 'Inquiry sent successfully.',
      inquiry: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating inquiry:', err);
    return res.status(500).json({ message: 'Internal server error sending inquiry.' });
  }
};

// Retrieve inquiries (Tourist or Stakeholder context)
export const getInquiries = async (req, res) => {
  const userId = req.user.id;
  const { role } = req.user;

  try {
    let query = '';
    let params = [userId];

    if (role === 'TOURIST') {
      // Tourist sees inquiries they sent
      query = `
        SELECT i.*, 
               h.name as homestay_name, h.contact_phone as homestay_phone,
               u.full_name as guide_name, tg.profile_picture_url as guide_pic
        FROM bookings_inquiries i
        LEFT JOIN homestay_profiles h ON i.homestay_id = h.id
        LEFT JOIN tour_guide_profiles tg ON i.guide_id = tg.id
        LEFT JOIN user_accounts u ON tg.guide_id = u.id
        WHERE i.tourist_id = $1
        ORDER BY i.created_at DESC`;
    } else if (role === 'HOMESTAY_OWNER') {
      // Homestay owner sees inquiries for their homestay
      query = `
        SELECT i.*, u.full_name as tourist_name, u.email as tourist_email, u.phone_number as tourist_phone
        FROM bookings_inquiries i
        JOIN homestay_profiles h ON i.homestay_id = h.id
        JOIN user_accounts u ON i.tourist_id = u.id
        WHERE h.owner_id = $1
        ORDER BY i.created_at DESC`;
    } else if (role === 'TOUR_GUIDE') {
      // Tour guide sees inquiries for themselves
      query = `
        SELECT i.*, u.full_name as tourist_name, u.email as tourist_email, u.phone_number as tourist_phone
        FROM bookings_inquiries i
        JOIN tour_guide_profiles tg ON i.guide_id = tg.id
        JOIN user_accounts u ON i.tourist_id = u.id
        WHERE tg.guide_id = $1
        ORDER BY i.created_at DESC`;
    } else if (role === 'PROVINCIAL_DOT' || role === 'MUNICIPAL_DOT') {
      // Admin overview (All inquiries in system/municipality)
      if (role === 'PROVINCIAL_DOT') {
        query = `
          SELECT i.*, u.full_name as tourist_name, 
                 h.name as homestay_name, 
                 g_u.full_name as guide_name
          FROM bookings_inquiries i
          LEFT JOIN user_accounts u ON i.tourist_id = u.id
          LEFT JOIN homestay_profiles h ON i.homestay_id = h.id
          LEFT JOIN tour_guide_profiles tg ON i.guide_id = tg.id
          LEFT JOIN user_accounts g_u ON tg.guide_id = g_u.id
          ORDER BY i.created_at DESC`;
        params = [];
      } else {
        query = `
          SELECT i.*, u.full_name as tourist_name, 
                 h.name as homestay_name, 
                 g_u.full_name as guide_name
          FROM bookings_inquiries i
          LEFT JOIN user_accounts u ON i.tourist_id = u.id
          LEFT JOIN homestay_profiles h ON i.homestay_id = h.id
          LEFT JOIN tour_guide_profiles tg ON i.guide_id = tg.id
          LEFT JOIN user_accounts g_u ON tg.guide_id = g_u.id
          WHERE u.municipality_id = $1 OR g_u.municipality_id = $1
          ORDER BY i.created_at DESC`;
        params = [req.user.municipality_id];
      }
    } else {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    return res.status(500).json({ message: 'Internal server error fetching inquiries.' });
  }
};

// Reply to inquiry (Stakeholder only)
export const replyInquiry = async (req, res) => {
  const { id } = req.params;
  const { replyMessage, status } = req.body; // status: 'RESPONDED', 'CONFIRMED', 'CANCELLED'
  const userId = req.user.id;
  const { role } = req.user;

  if (!replyMessage) {
    return res.status(400).json({ message: 'Reply message is required.' });
  }

  try {
    // Check inquiry ownership
    let ownershipCheckQuery = '';
    if (role === 'HOMESTAY_OWNER') {
      ownershipCheckQuery = `
        SELECT i.* FROM bookings_inquiries i
        JOIN homestay_profiles h ON i.homestay_id = h.id
        WHERE i.id = $1 AND h.owner_id = $2`;
    } else if (role === 'TOUR_GUIDE') {
      ownershipCheckQuery = `
        SELECT i.* FROM bookings_inquiries i
        JOIN tour_guide_profiles tg ON i.guide_id = tg.id
        WHERE i.id = $1 AND tg.guide_id = $2`;
    } else {
      return res.status(403).json({ message: 'Forbidden. Stakeholders only.' });
    }

    const checkRes = await pool.query(ownershipCheckQuery, [id, userId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found or unauthorized.' });
    }

    const newStatus = status || 'RESPONDED';

    const result = await pool.query(
      `UPDATE bookings_inquiries
       SET reply_message = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [replyMessage, newStatus, id]
    );

    return res.status(200).json({
      message: 'Reply sent successfully.',
      inquiry: result.rows[0],
    });
  } catch (err) {
    console.error('Error replying to inquiry:', err);
    return res.status(500).json({ message: 'Internal server error replying to inquiry.' });
  }
};

// Upload payment proof for existing booking (Tourist only)
export const uploadPaymentProof = async (req, res) => {
  const { id } = req.params;
  const touristId = req.user.id;
  const paymentProofUrl = req.file ? req.file.path : null;

  if (!paymentProofUrl) {
    return res.status(400).json({ message: 'Payment proof file is required.' });
  }

  try {
    // Verify booking belongs to this tourist
    const checkRes = await pool.query(
      'SELECT * FROM bookings_inquiries WHERE id = $1 AND tourist_id = $2',
      [id, touristId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or unauthorized.' });
    }

    const booking = checkRes.rows[0];

    const result = await pool.query(
      `UPDATE bookings_inquiries 
       SET payment_proof_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [paymentProofUrl, id]
    );

    // Notify homestay owner or tour guide
    if (booking.homestay_id) {
      const ownerRes = await pool.query('SELECT owner_id FROM homestay_profiles WHERE id = $1', [booking.homestay_id]);
      if (ownerRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'BOOKING')`,
          [ownerRes.rows[0].owner_id, 'Payment Proof Uploaded', `A guest has uploaded proof of payment for your homestay.`]
        );
      }
    }
    if (booking.guide_id) {
      const guideRes = await pool.query('SELECT guide_id FROM tour_guide_profiles WHERE id = $1', [booking.guide_id]);
      if (guideRes.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'BOOKING')`,
          [guideRes.rows[0].guide_id, 'Payment Proof Uploaded', `A tourist has uploaded proof of payment for your services.`]
        );
      }
    }

    return res.status(200).json({
      message: 'Payment proof uploaded successfully.',
      inquiry: result.rows[0]
    });
  } catch (err) {
    console.error('Error uploading payment proof:', err);
    return res.status(500).json({ message: 'Server error uploading payment proof.' });
  }
};

// Get confirmed booked date ranges for a homestay or guide (public)
export const getBookedDates = async (req, res) => {
  const { homestayId, guideId } = req.query;

  if (!homestayId && !guideId) {
    return res.status(400).json({ message: 'Provide homestayId or guideId.' });
  }

  try {
    let queryStr, params;
    if (homestayId) {
      queryStr = `SELECT start_date, end_date FROM bookings_inquiries
                  WHERE homestay_id = $1 AND status = 'CONFIRMED' AND start_date IS NOT NULL
                  ORDER BY start_date ASC`;
      params = [homestayId];
    } else {
      queryStr = `SELECT start_date, end_date FROM bookings_inquiries
                  WHERE guide_id = $1 AND status = 'CONFIRMED' AND start_date IS NOT NULL
                  ORDER BY start_date ASC`;
      params = [guideId];
    }

    const result = await pool.query(queryStr, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching booked dates:', err);
    return res.status(500).json({ message: 'Server error fetching booked dates.' });
  }
};
