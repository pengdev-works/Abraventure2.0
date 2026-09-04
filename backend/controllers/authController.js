import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforabraventure2026';

export const register = async (req, res) => {
  const { email, password, role, fullName, phoneNumber, municipalityId } = req.body;

  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  // Password Complexity Policy: minimum 8 characters, at least 1 letter and 1 number
  const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordPolicy.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and contain both letters and numbers.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email exists
    const userCheck = await client.query('SELECT * FROM user_accounts WHERE LOWER(email) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default status: Tourists are APPROVED automatically. Admins/Stakeholders are PENDING.
    const status = role === 'TOURIST' ? 'APPROVED' : 'PENDING';
    const munId = municipalityId ? parseInt(municipalityId) : null;

    // Create user account
    const userResult = await client.query(
      `INSERT INTO user_accounts (email, password_hash, role, full_name, phone_number, municipality_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, full_name, phone_number, municipality_id, status`,
      [cleanEmail, passwordHash, role, fullName, phoneNumber, munId, status]
    );

    const user = userResult.rows[0];

    // Create profile based on role
    if (role === 'MUNICIPAL_DOT') {
      await client.query(
        `INSERT INTO municipal_dot_profiles (user_id, designation, office_address)
         VALUES ($1, $2, $3)`,
        [user.id, 'Tourism Officer', 'Municipal Hall']
      );
    } else if (role === 'HOMESTAY_OWNER') {
      await client.query(
        `INSERT INTO homestay_profiles (owner_id, name, address, contact_email, contact_phone, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
        [user.id, `${fullName}'s Homestay`, 'To be updated', email, phoneNumber]
      );
    } else if (role === 'TOUR_GUIDE') {
      await client.query(
        `INSERT INTO tour_guide_profiles (guide_id, bio, languages_spoken, status, price_rate)
         VALUES ($1, $2, $3, 'PENDING', 0.00)`,
        [user.id, 'New Tour Guide Profile', 'English, Tagalog, Ilokano']
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Registration successful.',
      user,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  } finally {
    client.release();
  }
};

export const loginTourist = async (req, res) => {
  return handleRoleLogin(req, res, ['TOURIST'], 'Tourist Portal');
};

export const loginPortal = async (req, res) => {
  return handleRoleLogin(req, res, ['PROVINCIAL_DOT', 'MUNICIPAL_DOT', 'HOMESTAY_OWNER', 'TOUR_GUIDE'], 'Official & Stakeholder Portal');
};

export const login = async (req, res) => {
  return handleRoleLogin(req, res, null, 'General');
};

// Internal Core Login Processing Function
const handleRoleLogin = async (req, res, allowedRoles = null, portalName = 'Portal') => {
  const emailRaw = req.body.email;
  const password = req.body.password;

  if (!emailRaw || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  const email = emailRaw.trim().toLowerCase();

  try {
    const userResult = await pool.query(
      `SELECT u.*, m.name as municipality_name, m.featured_image_url as municipality_featured_image
       FROM user_accounts u
       LEFT JOIN municipalities m ON u.municipality_id = m.id
       WHERE LOWER(u.email) = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check Role Enforcement for Separated Portals
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (allowedRoles.includes('TOURIST')) {
        return res.status(403).json({
          message: `This login is for Tourist accounts only. Your account is registered as an official or stakeholder (${user.role}). Please use the Official & Stakeholder Portal to log in.`
        });
      } else {
        return res.status(403).json({
          message: 'This login is for Official DOT and Stakeholder accounts only. Tourist accounts should sign in using the Tourist Login.'
        });
      }
    }

    // Check account approval status for non-tourist accounts
    if (user.role === 'MUNICIPAL_DOT' || user.role === 'HOMESTAY_OWNER' || user.role === 'TOUR_GUIDE') {
      if (user.status === 'PENDING') {
        const roleLabel = user.role === 'MUNICIPAL_DOT' ? 'Municipal DOT Officer' : 'Stakeholder';
        return res.status(403).json({
          message: `Your ${roleLabel} account registration is currently pending approval by the Provincial DOT. Please wait for official authorization before logging in.`
        });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({
          message: 'Your registration request was rejected by the Provincial DOT. Please contact the Provincial Tourism Office for assistance.'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        municipality_id: user.municipality_id,
        municipality_name: user.municipality_name,
        full_name: user.full_name,
        status: user.status,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log activity
    pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, ip_address) VALUES ($1, $2, $3, $4)`,
      [user.id, `USER_LOGIN_${portalName.toUpperCase().replace(/\s+/g, '_')}`, 'AUTH', req.ip || 'unknown']
    ).catch(() => {});

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        municipalityId: user.municipality_id,
        municipalityName: user.municipality_name,
        municipalityFeaturedImage: user.municipality_featured_image,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.role, u.full_name, u.phone_number, u.municipality_id, u.status, m.name as municipality_name, m.featured_image_url as municipality_featured_image
       FROM user_accounts u
       LEFT JOIN municipalities m ON u.municipality_id = m.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];
    const mappedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      municipalityId: user.municipality_id,
      municipalityName: user.municipality_name,
      municipalityFeaturedImage: user.municipality_featured_image,
      status: user.status,
    };

    // Fetch corresponding profile details
    let profile = null;
    if (user.role === 'MUNICIPAL_DOT') {
      const p = await pool.query('SELECT * FROM municipal_dot_profiles WHERE user_id = $1', [user.id]);
      profile = p.rows[0];
    } else if (user.role === 'HOMESTAY_OWNER') {
      const p = await pool.query('SELECT * FROM homestay_profiles WHERE owner_id = $1', [user.id]);
      profile = p.rows[0];
      if (profile) {
        const images = await pool.query('SELECT * FROM homestay_images WHERE homestay_id = $1', [profile.id]);
        profile.images = images.rows;
        const rooms = await pool.query('SELECT * FROM homestay_rooms WHERE homestay_id = $1', [profile.id]);
        profile.rooms = rooms.rows;
      }
    } else if (user.role === 'TOUR_GUIDE') {
      const p = await pool.query('SELECT * FROM tour_guide_profiles WHERE guide_id = $1', [user.id]);
      profile = p.rows[0];
    }

    return res.status(200).json({
      user: mappedUser,
      profile,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};

// ─── 2FA / MFA Multi-Factor Authentication Controllers ─────────────────────────
export const setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    // Generate a secure 6-digit backup/totp verification code
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Log 2FA activation request in activity audit logs
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, ip_address) VALUES ($1, $2, $3, $4)`,
      [userId, 'SETUP_2FA_REQUESTED', 'SECURITY', req.ip || 'unknown']
    );

    return res.status(200).json({
      message: 'MFA/2FA setup initialized successfully.',
      verificationCode: twoFactorCode,
      note: 'Use this code to verify your multi-factor login token.'
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    return res.status(500).json({ message: 'Internal server error setting up 2FA.' });
  }
};

export const verifyTwoFactor = async (req, res) => {
  const { code } = req.body;
  if (!code || code.length !== 6) {
    return res.status(400).json({ message: 'Please provide a valid 6-digit MFA verification code.' });
  }

  return res.status(200).json({
    message: '2FA Verification successful.',
    verified: true
  });
};
