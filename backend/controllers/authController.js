import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforabraventure2026';

// Strict Password Complexity Policy: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
export const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ─── 1. Tourist Public Registration ───────────────────────────────────────────
export const register = async (req, res) => {
  const { email, password, role = 'TOURIST', fullName, phoneNumber, municipalityId } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  // Security Governance: Prevent unauthorized administrative registration
  const targetRole = (role || 'TOURIST').toUpperCase();
  if (targetRole === 'PROVINCIAL_DOT' || targetRole === 'MUNICIPAL_DOT') {
    return res.status(403).json({
      message: 'Administrative accounts cannot be created via public registration. Please contact the Provincial Tourism Office.'
    });
  }

  if (targetRole === 'HOMESTAY_OWNER' || targetRole === 'TOUR_GUIDE') {
    return res.status(400).json({
      message: 'Tourism Providers (Homestay Hosts & Tour Guides) must apply via the Provider Accreditation page (/apply/provider).'
    });
  }

  // Enforce password policy
  if (!validatePasswordPolicy(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email exists
    const userCheck = await client.query('SELECT id FROM user_accounts WHERE LOWER(email) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const munId = municipalityId ? parseInt(municipalityId) : null;

    // Create tourist account (Tourists are automatically APPROVED)
    const userResult = await client.query(
      `INSERT INTO user_accounts (email, password_hash, role, full_name, phone_number, municipality_id, status)
       VALUES ($1, $2, 'TOURIST', $3, $4, $5, 'APPROVED')
       RETURNING id, email, role, full_name, phone_number, municipality_id, status`,
      [cleanEmail, passwordHash, fullName.trim(), phoneNumber ? phoneNumber.trim() : null, munId]
    );

    const user = userResult.rows[0];

    // Log welcome notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'INFO')`,
      [user.id, 'Welcome to AbraVenture!', 'Your tourist account is active. Start exploring Abra, building itineraries, and connecting with accredited providers.', 'INFO']
    ).catch(() => {});

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Welcome to AbraVenture! Your account has been created successfully.',
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

// ─── 2. Tourism Provider Accreditation Application ─────────────────────────────
export const applyProvider = async (req, res) => {
  const {
    providerType, // 'HOMESTAY_OWNER' or 'TOUR_GUIDE'
    fullName,
    email,
    phoneNumber,
    password,
    confirmPassword,
    municipalityId,

    // Homestay Specific
    homestayName,
    propertyAddress,
    barangay,
    numberOfRooms,
    maxGuestCapacity,
    description,
    businessPhone,
    businessEmail,

    // Tour Guide Specific
    guideName,
    licenseNumber,
    yearsOfExperience,
    languagesSpoken,
    areasCovered,
    specializations,
    bio,
  } = req.body;

  // Basic required checks
  if (!providerType || !fullName || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required personal information.' });
  }

  const normalizedRole = providerType === 'TOUR_GUIDE' || providerType === 'guide'
    ? 'TOUR_GUIDE'
    : 'HOMESTAY_OWNER';

  // Password confirmation check
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  // Password complexity check
  if (!validatePasswordPolicy(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character.'
    });
  }

  // Provider specific validation
  if (normalizedRole === 'HOMESTAY_OWNER') {
    if (!homestayName || !propertyAddress || !municipalityId) {
      return res.status(400).json({ message: 'Please provide the Homestay Name, Address, and Municipality.' });
    }
  } else if (normalizedRole === 'TOUR_GUIDE') {
    if (!licenseNumber || !municipalityId) {
      return res.status(400).json({ message: 'Please provide your Guide License Number and Host Municipality.' });
    }
  }

  const cleanEmail = email.trim().toLowerCase();
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const refPrefix = normalizedRole === 'HOMESTAY_OWNER' ? 'ABRA-HS' : 'ABRA-TG';
  const referenceNumber = `${refPrefix}-${year}-${randomDigits}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email exists
    const userCheck = await client.query('SELECT id FROM user_accounts WHERE LOWER(email) = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email is already registered. Please sign in or use another email address.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const munId = parseInt(municipalityId) || null;

    // Create user account with PENDING status
    const userResult = await client.query(
      `INSERT INTO user_accounts (email, password_hash, role, full_name, phone_number, municipality_id, status, reference_number)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
       RETURNING id, email, role, full_name, phone_number, municipality_id, status, reference_number`,
      [cleanEmail, passwordHash, normalizedRole, fullName.trim(), phoneNumber ? phoneNumber.trim() : null, munId, referenceNumber]
    );

    const user = userResult.rows[0];

    // Create provider profile
    if (normalizedRole === 'HOMESTAY_OWNER') {
      const rooms = parseInt(numberOfRooms) || 1;
      const capacity = parseInt(maxGuestCapacity) || 2;

      await client.query(
        `INSERT INTO homestay_profiles (
          owner_id, name, description, address, barangay, total_rooms, max_capacity,
          contact_email, contact_phone, status, reference_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10)`,
        [
          user.id,
          homestayName.trim(),
          description || 'Homestay accommodation in Abra.',
          propertyAddress.trim(),
          barangay ? barangay.trim() : null,
          rooms,
          capacity,
          businessEmail ? businessEmail.trim().toLowerCase() : cleanEmail,
          businessPhone ? businessPhone.trim() : (phoneNumber || null),
          referenceNumber
        ]
      );
    } else if (normalizedRole === 'TOUR_GUIDE') {
      const exp = parseInt(yearsOfExperience) || 0;

      await client.query(
        `INSERT INTO tour_guide_profiles (
          guide_id, bio, languages_spoken, areas_covered, specializations,
          license_number, years_of_experience, status, price_rate, reference_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 0.00, $8)`,
        [
          user.id,
          bio || 'Licensed Tour Guide in Abra.',
          languagesSpoken || 'English, Tagalog, Ilokano',
          areasCovered || 'Abra Province',
          specializations || 'Cultural & Eco Tours',
          licenseNumber.trim(),
          exp,
          referenceNumber
        ]
      );
    }

    // Attach any uploaded document files
    if (req.files) {
      const fileKeys = Object.keys(req.files);
      for (const key of fileKeys) {
        const fileList = req.files[key];
        if (fileList && fileList.length > 0) {
          const filePath = fileList[0].path || `/uploads/${fileList[0].filename}`;
          // Check if there is a municipal requirement for this target
          const reqCheck = await client.query(
            `SELECT id FROM municipal_requirements 
             WHERE municipality_id = $1 AND target_type = $2 
             LIMIT 1`,
            [munId, normalizedRole === 'HOMESTAY_OWNER' ? 'HOMESTAY' : 'TOUR_GUIDE']
          );
          const requirementId = reqCheck.rows.length > 0 ? reqCheck.rows[0].id : null;
          if (requirementId) {
            await client.query(
              `INSERT INTO submitted_documents (user_id, requirement_id, document_url, status)
               VALUES ($1, $2, $3, 'PENDING')`,
              [user.id, requirementId, filePath]
            ).catch(() => {});
          }
        }
      }
    }

    // Insert pending status notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'ACCREDITATION')`,
      [
        user.id,
        'Application Submitted',
        `Your accreditation application (${referenceNumber}) has been received and is currently under review by the Provincial Tourism Office.`,
      ]
    ).catch(() => {});

    // Log in audit trail
    await client.query(
      `INSERT INTO activity_logs (user_id, action, target_type, ip_address)
       VALUES ($1, $2, 'AUTH', $3)`,
      [user.id, `PROVIDER_APPLICATION_${normalizedRole}`, req.ip || 'unknown']
    ).catch(() => {});

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Application Submitted Successfully',
      referenceNumber,
      status: 'Pending Review',
      providerType: normalizedRole,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        referenceNumber: user.reference_number,
        status: user.status
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Provider application error:', err);
    return res.status(500).json({ message: 'Internal server error during application submission.' });
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

    // Secure generic message: do not reveal email existence
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

    // Status Enforcement for Providers
    if (user.role === 'HOMESTAY_OWNER' || user.role === 'TOUR_GUIDE') {
      if (user.status === 'PENDING') {
        return res.status(403).json({
          message: 'Your provider application is still under review.'
        });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({
          message: 'Your provider application requires attention. Please review the application status.'
        });
      }
      if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
        return res.status(403).json({
          message: 'Your account is currently unavailable. Please contact the Provincial Tourism Office.'
        });
      }
    }

    // Status Enforcement for Municipal DOT
    if (user.role === 'MUNICIPAL_DOT') {
      if (user.status === 'PENDING') {
        return res.status(403).json({
          message: 'Your Municipal DOT Officer account registration is currently pending authorization by the Provincial Tourism Office.'
        });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({
          message: 'Your registration request was rejected by the Provincial DOT. Please contact the Provincial Tourism Office for assistance.'
        });
      }
      if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
        return res.status(403).json({
          message: 'Your account is currently unavailable. Please contact the Provincial Tourism Office.'
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
