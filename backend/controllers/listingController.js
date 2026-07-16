import pool from '../config/db.js';

// --- HOMESTAY PROFILE MANAGEMENT ---

export const updateHomestayProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, description, address, latitude, longitude, contactEmail, contactPhone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE homestay_profiles
       SET name = $1, description = $2, address = $3, latitude = $4, longitude = $5, contact_email = $6, contact_phone = $7, updated_at = CURRENT_TIMESTAMP
       WHERE owner_id = $8 RETURNING *`,
      [
        name,
        description,
        address,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        contactEmail,
        contactPhone,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Homestay profile not found.' });
    }

    return res.status(200).json({
      message: 'Homestay profile updated successfully.',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating homestay:', err);
    return res.status(500).json({ message: 'Internal server error updating homestay profile.' });
  }
};

export const addHomestayImage = async (req, res) => {
  const userId = req.user.id;
  const { isFeatured } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    // Get homestay id
    const hsRes = await pool.query('SELECT id FROM homestay_profiles WHERE owner_id = $1', [userId]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ message: 'Homestay profile not found.' });
    }
    const homestayId = hsRes.rows[0].id;

    // If setting as featured, remove featured status from other images
    if (isFeatured === 'true' || isFeatured === true) {
      await pool.query('UPDATE homestay_images SET is_featured = false WHERE homestay_id = $1', [homestayId]);
    }

    const result = await pool.query(
      `INSERT INTO homestay_images (homestay_id, image_url, is_featured)
       VALUES ($1, $2, $3) RETURNING *`,
      [homestayId, imageUrl, isFeatured === 'true' || isFeatured === true]
    );

    return res.status(201).json({
      message: 'Image added successfully.',
      image: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding image:', err);
    return res.status(500).json({ message: 'Internal server error adding image.' });
  }
};

export const deleteHomestayImage = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verify ownership
    const imgCheck = await pool.query(
      `SELECT i.* FROM homestay_images i
       JOIN homestay_profiles h ON i.homestay_id = h.id
       WHERE i.id = $1 AND h.owner_id = $2`,
      [id, userId]
    );

    if (imgCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden or image not found.' });
    }

    await pool.query('DELETE FROM homestay_images WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (err) {
    console.error('Error deleting image:', err);
    return res.status(500).json({ message: 'Internal server error deleting image.' });
  }
};

export const addRoom = async (req, res) => {
  const userId = req.user.id;
  const { roomType, pricePerNight, capacity, description } = req.body;

  try {
    const hsRes = await pool.query('SELECT id FROM homestay_profiles WHERE owner_id = $1', [userId]);
    if (hsRes.rows.length === 0) {
      return res.status(404).json({ message: 'Homestay profile not found.' });
    }
    const homestayId = hsRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO homestay_rooms (homestay_id, room_type, price_per_night, capacity, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [homestayId, roomType, parseFloat(pricePerNight), parseInt(capacity), description]
    );

    return res.status(201).json({
      message: 'Room added successfully.',
      room: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding room:', err);
    return res.status(500).json({ message: 'Internal server error adding room.' });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { roomType, pricePerNight, capacity, description, isAvailable } = req.body;

  try {
    // Verify ownership
    const roomCheck = await pool.query(
      `SELECT r.* FROM homestay_rooms r
       JOIN homestay_profiles h ON r.homestay_id = h.id
       WHERE r.id = $1 AND h.owner_id = $2`,
      [id, userId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden or room not found.' });
    }

    const result = await pool.query(
      `UPDATE homestay_rooms
       SET room_type = $1, price_per_night = $2, capacity = $3, description = $4, is_available = $5
       WHERE id = $6 RETURNING *`,
      [roomType, parseFloat(pricePerNight), parseInt(capacity), description, isAvailable !== false, id]
    );

    return res.status(200).json({
      message: 'Room updated successfully.',
      room: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating room:', err);
    return res.status(500).json({ message: 'Internal server error updating room.' });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const roomCheck = await pool.query(
      `SELECT r.* FROM homestay_rooms r
       JOIN homestay_profiles h ON r.homestay_id = h.id
       WHERE r.id = $1 AND h.owner_id = $2`,
      [id, userId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden or room not found.' });
    }

    await pool.query('DELETE FROM homestay_rooms WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Room deleted successfully.' });
  } catch (err) {
    console.error('Error deleting room:', err);
    return res.status(500).json({ message: 'Internal server error deleting room.' });
  }
};

// --- TOUR GUIDE PROFILE MANAGEMENT ---

export const updateTourGuideProfile = async (req, res) => {
  const userId = req.user.id;
  const { bio, languagesSpoken, servicesOffered, areasCovered, priceRate } = req.body;
  
  let profilePictureUrl = req.body.profilePictureUrl;
  if (req.file) {
    profilePictureUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const result = await pool.query(
      `UPDATE tour_guide_profiles
       SET profile_picture_url = COALESCE($1, profile_picture_url), bio = $2, languages_spoken = $3, services_offered = $4, areas_covered = $5, price_rate = $6, updated_at = CURRENT_TIMESTAMP
       WHERE guide_id = $7 RETURNING *`,
      [profilePictureUrl, bio, languagesSpoken, servicesOffered, areasCovered, priceRate ? parseFloat(priceRate) : 0.00, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tour guide profile not found.' });
    }

    return res.status(200).json({
      message: 'Tour guide profile updated successfully.',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating guide profile:', err);
    return res.status(500).json({ message: 'Internal server error updating tour guide profile.' });
  }
};

export const updateMunicipalDotProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, phoneNumber, designation, officeAddress } = req.body;
  
  let profilePictureUrl = req.body.profilePictureUrl;
  if (req.file) {
    profilePictureUrl = `/uploads/${req.file.filename}`;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update user_accounts table
    await client.query(
      `UPDATE user_accounts
       SET full_name = COALESCE($1, full_name), phone_number = COALESCE($2, phone_number), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [fullName, phoneNumber, userId]
    );

    // 2. Update municipal_dot_profiles table
    const profileRes = await client.query(
      `UPDATE municipal_dot_profiles
       SET designation = COALESCE($1, designation), office_address = COALESCE($2, office_address), profile_picture_url = COALESCE($3, profile_picture_url)
       WHERE user_id = $4 RETURNING *`,
      [designation, officeAddress, profilePictureUrl, userId]
    );

    if (profileRes.rows.length === 0) {
      // If profile record doesn't exist for some reason, create it
      const insertRes = await client.query(
        `INSERT INTO municipal_dot_profiles (user_id, designation, office_address, profile_picture_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, designation || 'Tourism Officer', officeAddress || 'Municipal Hall', profilePictureUrl]
      );
      profileRes.rows.push(insertRes.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Municipal DOT profile updated successfully.',
      profile: profileRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating municipal DOT profile:', err);
    return res.status(500).json({ message: 'Internal server error updating municipal DOT profile.' });
  } finally {
    client.release();
  }
};


// --- ADMIN LISTINGS WORKFLOW & REVIEW ---

// Fetch pending registrations (for dashboard listings)
export const getApplications = async (req, res) => {
  const { role, municipality_id } = req.user;

  try {
    let homestaysQuery = '';
    let guidesQuery = '';
    let params = [];

    if (role === 'MUNICIPAL_DOT') {
      // Municipal Admin sees only accounts in their municipality that are PENDING
      homestaysQuery = `
        SELECT h.*, u.full_name as owner_name, u.email
        FROM homestay_profiles h
        JOIN user_accounts u ON h.owner_id = u.id
        WHERE u.municipality_id = $1
        ORDER BY h.created_at DESC`;
      
      guidesQuery = `
        SELECT g.*, u.full_name as guide_name, u.email
        FROM tour_guide_profiles g
        JOIN user_accounts u ON g.guide_id = u.id
        WHERE u.municipality_id = $1
        ORDER BY g.created_at DESC`;
      params.push(municipality_id);
    } else if (role === 'PROVINCIAL_DOT') {
      // Provincial Admin sees all accounts, especially those endorsed or pending
      homestaysQuery = `
        SELECT h.*, u.full_name as owner_name, u.email, m.name as municipality_name
        FROM homestay_profiles h
        JOIN user_accounts u ON h.owner_id = u.id
        JOIN municipalities m ON u.municipality_id = m.id
        ORDER BY h.created_at DESC`;
      
      guidesQuery = `
        SELECT g.*, u.full_name as guide_name, u.email, m.name as municipality_name
        FROM tour_guide_profiles g
        JOIN user_accounts u ON g.guide_id = u.id
        JOIN municipalities m ON u.municipality_id = m.id
        ORDER BY g.created_at DESC`;
    } else {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    const homestaysRes = await pool.query(homestaysQuery, params);
    const guidesRes = await pool.query(guidesQuery, params);

    // Fetch submitted documents status for each application to show completeness
    const homestays = homestaysRes.rows;
    for (const h of homestays) {
      const docRes = await pool.query(
        `SELECT sd.*, mr.requirement_name, mr.is_required
         FROM submitted_documents sd
         JOIN municipal_requirements mr ON sd.requirement_id = mr.id
         WHERE sd.user_id = $1`,
        [h.owner_id]
      );
      h.documents = docRes.rows;
    }

    const guides = guidesRes.rows;
    for (const g of guides) {
      const docRes = await pool.query(
        `SELECT sd.*, mr.requirement_name, mr.is_required
         FROM submitted_documents sd
         JOIN municipal_requirements mr ON sd.requirement_id = mr.id
         WHERE sd.user_id = $1`,
        [g.guide_id]
      );
      g.documents = docRes.rows;
    }

    // Get Municipal DOT Accounts needing approval (Provincial DOT only)
    let municipalAdmins = [];
    if (role === 'PROVINCIAL_DOT') {
      const adminRes = await pool.query(
        `SELECT u.id, u.email, u.full_name, u.phone_number, u.status, m.name as municipality_name
         FROM user_accounts u
         JOIN municipalities m ON u.municipality_id = m.id
         WHERE u.role = 'MUNICIPAL_DOT'
         ORDER BY u.created_at DESC`
      );
      municipalAdmins = adminRes.rows;
    }

    return res.status(200).json({
      homestays,
      guides,
      municipalAdmins
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    return res.status(500).json({ message: 'Internal server error fetching applications.' });
  }
};

// Endorse Stakeholder (Municipal DOT Admin review)
export const endorseStakeholder = async (req, res) => {
  const { id } = req.params; // Profile ID
  const { type, remarks } = req.body; // type: 'HOMESTAY' or 'GUIDE', remarks
  const reviewerId = req.user.id;
  const reviewerMun = req.user.municipality_id;

  try {
    let applicantId;
    let table = type === 'HOMESTAY' ? 'homestay_profiles' : 'tour_guide_profiles';
    let idColumn = type === 'HOMESTAY' ? 'owner_id' : 'guide_id';

    // Verify ownership/municipality
    const profileRes = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    applicantId = profileRes.rows[0][idColumn];

    const applicantRes = await pool.query('SELECT municipality_id FROM user_accounts WHERE id = $1', [applicantId]);
    if (applicantRes.rows[0].municipality_id !== reviewerMun) {
      return res.status(403).json({ message: 'Forbidden. Stakeholder is registered under another municipality.' });
    }

    // Log endorsement
    await pool.query(
      `INSERT INTO approval_logs (target_user_id, action_by, previous_status, new_status, remarks)
       VALUES ($1, $2, 'PENDING', 'ENDORSED', $3)`,
      [applicantId, reviewerId, `ENDORSED BY MUNICIPAL: ${remarks}`]
    );

    // Update profile status to ENDORSED (awaiting Provincial DOT approval)
    await pool.query(`UPDATE ${table} SET status = 'ENDORSED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

    return res.status(200).json({ message: 'Stakeholder endorsed successfully to Provincial DOT.' });
  } catch (err) {
    console.error('Error endorsing stakeholder:', err);
    return res.status(500).json({ message: 'Internal server error endorsing stakeholder.' });
  }
};

// Final Approve Stakeholder/Municipal Admin (Provincial DOT Admin only)
export const approveAccount = async (req, res) => {
  const { id } = req.params; // User ID (for Municipal DOT) or Profile ID (for Homestays / Guides)
  const { type, status, remarks } = req.body; // type: 'MUNICIPAL_DOT', 'HOMESTAY', 'GUIDE' | status: 'APPROVED' or 'REJECTED'
  const adminId = req.user.id;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be APPROVED or REJECTED.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let targetUserId = id;

    if (type === 'MUNICIPAL_DOT') {
      // Approve user account directly
      const prevResult = await client.query('SELECT status FROM user_accounts WHERE id = $1', [id]);
      if (prevResult.rows.length === 0) {
        return res.status(404).json({ message: 'Municipal DOT account not found.' });
      }

      await client.query(
        `UPDATE user_accounts
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status, id]
      );

      await client.query(
        `INSERT INTO approval_logs (target_user_id, action_by, previous_status, new_status, remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, adminId, prevResult.rows[0].status, status, remarks]
      );
    } else {
      // Approve Homestay or Guide Profile
      const table = type === 'HOMESTAY' ? 'homestay_profiles' : 'tour_guide_profiles';
      const idColumn = type === 'HOMESTAY' ? 'owner_id' : 'guide_id';

      const prevResult = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      if (prevResult.rows.length === 0) {
        return res.status(404).json({ message: 'Profile not found.' });
      }

      targetUserId = prevResult.rows[0][idColumn];

      await client.query(
        `UPDATE ${table}
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status, id]
      );

      // Also update the main user account status
      await client.query(
        `UPDATE user_accounts
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status, targetUserId]
      );

      await client.query(
        `INSERT INTO approval_logs (target_user_id, action_by, previous_status, new_status, remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [targetUserId, adminId, prevResult.rows[0].status, status, remarks]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: `Account / Listing ${status.toLowerCase()} successfully.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error approving account:', err);
    return res.status(500).json({ message: 'Internal server error processing approval.' });
  } finally {
    client.release();
  }
};
