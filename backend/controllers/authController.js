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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email exists
    const userCheck = await client.query('SELECT * FROM user_accounts WHERE email = $1', [email]);
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
      [email, passwordHash, role, fullName, phoneNumber, munId, status]
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

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.*, m.name as municipality_name, m.featured_image_url as municipality_featured_image
       FROM user_accounts u
       LEFT JOIN municipalities m ON u.municipality_id = m.id
       WHERE u.email = $1`,
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
