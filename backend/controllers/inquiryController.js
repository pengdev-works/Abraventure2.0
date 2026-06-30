import pool from '../config/db.js';

// Send booking inquiry (Tourist only)
export const createInquiry = async (req, res) => {
  const touristId = req.user.id;
  const { homestayId, guideId, startDate, endDate, numberOfGuests, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings_inquiries (tourist_id, homestay_id, guide_id, start_date, end_date, number_of_guests, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING *`,
      [
        touristId,
        homestayId || null,
        guideId || null,
        startDate || null,
        endDate || null,
        numberOfGuests ? parseInt(numberOfGuests) : null,
        message
      ]
    );

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
