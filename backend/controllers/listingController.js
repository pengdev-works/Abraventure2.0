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

  const imageUrl = req.file.path;

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
    profilePictureUrl = req.file.path;
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
    profilePictureUrl = req.file.path;
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

// ─── DOT USER ACCOUNT CRUD (Provincial DOT only) ──────────────────────────────

/**
 * GET /api/listings/users
 * Returns all MUNICIPAL_DOT and PROVINCIAL_DOT accounts with municipality name.
 */
export const getAllDotUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone_number, u.role, u.status, u.created_at,
              m.id AS municipality_id, m.name AS municipality_name,
              p.designation, p.office_address, p.profile_picture_url
       FROM user_accounts u
       LEFT JOIN municipalities m ON u.municipality_id = m.id
       LEFT JOIN municipal_dot_profiles p ON u.id = p.user_id
       WHERE u.role IN ('MUNICIPAL_DOT', 'PROVINCIAL_DOT')
       ORDER BY u.role ASC, u.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching DOT users:', err);
    return res.status(500).json({ message: 'Internal server error fetching DOT users.' });
  }
};

/**
 * POST /api/listings/users
 * Creates a new MUNICIPAL_DOT or PROVINCIAL_DOT account.
 * Prevents duplicate Municipal DOT per municipality.
 */
export const createDotUser = async (req, res) => {
  const { email, password, fullName, phoneNumber, role, municipalityId, designation, officeAddress, forceCreate } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ message: 'Email, password, full name, and role are required.' });
  }

  if (!['MUNICIPAL_DOT', 'PROVINCIAL_DOT'].includes(role)) {
    return res.status(400).json({ message: 'Role must be MUNICIPAL_DOT or PROVINCIAL_DOT.' });
  }

  if (role === 'MUNICIPAL_DOT' && !municipalityId) {
    return res.status(400).json({ message: 'Municipality is required for Municipal DOT accounts.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query('SELECT id FROM user_accounts WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email is already registered to another account.' });
    }

    // Duplicate municipality guard for Municipal DOT
    if (role === 'MUNICIPAL_DOT' && !forceCreate) {
      const dupCheck = await client.query(
        `SELECT u.id, u.full_name, u.status FROM user_accounts u
         WHERE u.municipality_id = $1 AND u.role = 'MUNICIPAL_DOT' AND u.status = 'APPROVED'
         LIMIT 1`,
        [municipalityId]
      );
      if (dupCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          message: `This municipality already has an approved Municipal DOT officer (${dupCheck.rows[0].full_name}). Delete or edit the existing account first, or confirm to create anyway.`,
          existingUser: dupCheck.rows[0],
          requiresForce: true,
        });
      }
    }

    // Hash password
    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const munId = municipalityId ? parseInt(municipalityId) : null;

    // Insert user account (status APPROVED since created by Provincial DOT directly)
    const userResult = await client.query(
      `INSERT INTO user_accounts (email, password_hash, role, full_name, phone_number, municipality_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')
       RETURNING id, email, role, full_name, phone_number, municipality_id, status`,
      [email, passwordHash, role, fullName, phoneNumber || null, munId]
    );

    const user = userResult.rows[0];

    // Create DOT profile record
    if (role === 'MUNICIPAL_DOT') {
      await client.query(
        `INSERT INTO municipal_dot_profiles (user_id, designation, office_address)
         VALUES ($1, $2, $3)`,
        [user.id, designation || 'Tourism Officer', officeAddress || 'Municipal Hall']
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: 'DOT account created successfully.', user });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating DOT user:', err);
    return res.status(500).json({ message: 'Internal server error creating DOT user.' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/listings/users/:id
 * Updates full_name, phone_number, email, municipality_id, status, designation, officeAddress
 * for any MUNICIPAL_DOT or PROVINCIAL_DOT account.
 */
export const updateDotUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, phoneNumber, email, municipalityId, status, designation, officeAddress } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify target is a DOT account
    const targetRes = await client.query(
      `SELECT id, role FROM user_accounts WHERE id = $1 AND role IN ('MUNICIPAL_DOT','PROVINCIAL_DOT')`,
      [id]
    );
    if (targetRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'DOT account not found.' });
    }

    // Check email uniqueness if changing email
    if (email) {
      const emailCheck = await client.query(
        'SELECT id FROM user_accounts WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Email is already in use by another account.' });
      }
    }

    const munId = municipalityId ? parseInt(municipalityId) : null;

    await client.query(
      `UPDATE user_accounts
       SET full_name    = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           email        = COALESCE($3, email),
           municipality_id = CASE WHEN $4::int IS NOT NULL THEN $4::int ELSE municipality_id END,
           status       = COALESCE($5, status),
           updated_at   = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [fullName, phoneNumber, email, munId, status, id]
    );

    // Update municipal_dot_profiles if applicable
    if (targetRes.rows[0].role === 'MUNICIPAL_DOT') {
      await client.query(
        `UPDATE municipal_dot_profiles
         SET designation    = COALESCE($1, designation),
             office_address = COALESCE($2, office_address)
         WHERE user_id = $3`,
        [designation, officeAddress, id]
      );
    }

    await client.query('COMMIT');

    const updated = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone_number, u.role, u.status,
              m.id AS municipality_id, m.name AS municipality_name,
              p.designation, p.office_address
       FROM user_accounts u
       LEFT JOIN municipalities m ON u.municipality_id = m.id
       LEFT JOIN municipal_dot_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [id]
    );

    return res.status(200).json({ message: 'DOT account updated successfully.', user: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating DOT user:', err);
    return res.status(500).json({ message: 'Internal server error updating DOT user.' });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/listings/users/:id
 * Hard-deletes a DOT account. Cascades child records via FK constraints.
 */
export const deleteDotUser = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      `SELECT id, full_name, role FROM user_accounts WHERE id = $1 AND role IN ('MUNICIPAL_DOT','PROVINCIAL_DOT')`,
      [id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'DOT account not found or deletion not permitted.' });
    }

    await pool.query('DELETE FROM user_accounts WHERE id = $1', [id]);
    return res.status(200).json({ message: `Account for "${check.rows[0].full_name}" deleted successfully.` });
  } catch (err) {
    console.error('Error deleting DOT user:', err);
    return res.status(500).json({ message: 'Internal server error deleting DOT user.' });
  }
};

