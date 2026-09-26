import pool from '../config/db.js';
import { emitToUser, emitToRole, emitToMunicipality } from '../socket/socketManager.js';

// ─── Helper: generate booking reference ────────────────────────────────────
const generateBookingReference = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `ABR-${year}-${mm}${dd}-`;
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM tour_package_bookings WHERE booking_reference LIKE $1`,
    [`${prefix}%`]
  );
  const seq = parseInt(countRes.rows[0].count) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// ─── Helper: send in-app notification ──────────────────────────────────────
const sendNotification = async (userId, title, message, type = 'INFO', link = null) => {
  try {
    const res = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, message, type, link]
    );
    emitToUser(userId, 'notification:new', res.rows[0]);
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send notification:', err.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tour-packages — list published packages (public + optional filters)
export const getTourPackages = async (req, res) => {
  const { municipalityId, packageType, status, includeAll } = req.query;

  try {
    let q = `
      SELECT p.*,
             m.name AS municipality_name,
             u.full_name AS creator_name,
             (SELECT COUNT(*) FROM package_items pi WHERE pi.package_id = p.id) AS item_count,
             (SELECT COUNT(*) FROM package_schedules ps WHERE ps.package_id = p.id) AS schedule_count,
             (SELECT MIN(ps.travel_date) FROM package_schedules ps WHERE ps.package_id = p.id AND ps.travel_date >= CURRENT_DATE AND ps.is_available = true) AS next_available_date
      FROM packages p
      JOIN municipalities m ON p.municipality_id = m.id
      LEFT JOIN user_accounts u ON p.created_by = u.id
      WHERE 1=1`;
    const params = [];

    // Default: only show published packages unless explicitly requested
    if (includeAll !== 'true') {
      q += ` AND p.status = 'PUBLISHED'`;
    }

    if (municipalityId) {
      params.push(parseInt(municipalityId));
      q += ` AND p.municipality_id = $${params.length}`;
    }

    if (packageType) {
      params.push(packageType.toUpperCase());
      q += ` AND p.package_type = $${params.length}`;
    }

    if (status && includeAll === 'true') {
      params.push(status.toUpperCase());
      q += ` AND p.status = $${params.length}`;
    }

    q += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(q, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getTourPackages error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch tour packages.' });
  }
};

// GET /api/tour-packages/:id — full package detail
export const getTourPackageDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const pkgRes = await pool.query(
      `SELECT p.*, m.name AS municipality_name, m.id AS municipality_id,
              u.full_name AS creator_name,
              rv.full_name AS reviewer_name
       FROM packages p
       JOIN municipalities m ON p.municipality_id = m.id
       LEFT JOIN user_accounts u ON p.created_by = u.id
       LEFT JOIN user_accounts rv ON p.reviewed_by = rv.id
       WHERE p.id = $1`,
      [id]
    );
    if (pkgRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });
    const pkg = pkgRes.rows[0];

    // Items
    const itemsRes = await pool.query(
      `SELECT pi.*,
              ta.name AS attraction_name, ta.category AS attraction_category, ta.image_url AS attraction_image,
              ta.municipality_id AS attraction_municipality_id, am.name AS attraction_municipality_name,
              hp.name AS homestay_name, hp.address AS homestay_address,
              tg_u.full_name AS guide_name, tg.profile_picture_url AS guide_image
       FROM package_items pi
       LEFT JOIN tourist_attractions ta ON pi.attraction_id = ta.id
       LEFT JOIN municipalities am ON ta.municipality_id = am.id
       LEFT JOIN homestay_profiles hp ON pi.homestay_id = hp.id
       LEFT JOIN tour_guide_profiles tg ON pi.guide_id = tg.id
       LEFT JOIN user_accounts tg_u ON tg.guide_id = tg_u.id
       WHERE pi.package_id = $1
       ORDER BY pi.day_number ASC, pi.sequence_order ASC`,
      [id]
    );

    // Participating municipalities
    const muniRes = await pool.query(
      `SELECT pm.*, m.name AS municipality_name, u.full_name AS confirmed_by_name
       FROM package_municipalities pm
       JOIN municipalities m ON pm.municipality_id = m.id
       LEFT JOIN user_accounts u ON pm.confirmed_by = u.id
       WHERE pm.package_id = $1
       ORDER BY m.name ASC`,
      [id]
    );

    // Schedules
    const schedRes = await pool.query(
      `SELECT * FROM package_schedules WHERE package_id = $1 ORDER BY travel_date ASC`,
      [id]
    );

    // Transport schedules
    const transRes = await pool.query(
      `SELECT * FROM package_transport_schedules WHERE package_id = $1 ORDER BY travel_date ASC, departure_time ASC`,
      [id]
    );

    return res.status(200).json({
      package: pkg,
      items: itemsRes.rows,
      municipalities: muniRes.rows,
      schedules: schedRes.rows,
      transport: transRes.rows,
    });
  } catch (err) {
    console.error('[TOUR PKG] getTourPackageDetails error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch package details.' });
  }
};

// GET /api/tour-packages/:id/calendar — availability calendar
export const getPackageCalendar = async (req, res) => {
  const { id } = req.params;
  try {
    const schedRes = await pool.query(
      `SELECT ps.*,
              (ps.max_capacity - ps.reserved_count) AS remaining_slots
       FROM package_schedules ps
       WHERE ps.package_id = $1
       ORDER BY ps.travel_date ASC`,
      [id]
    );
    return res.status(200).json(schedRes.rows);
  } catch (err) {
    console.error('[TOUR PKG] getPackageCalendar error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch package calendar.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  DOT PACKAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/tour-packages — create package (Municipal or Provincial DOT)
export const createTourPackage = async (req, res) => {
  const creatorId = req.user.id;
  const { role, municipality_id } = req.user;

  const {
    title, description, price, durationDays, inclusions, imageUrl,
    municipalityId, packageType, maxCapacityPerDate, transportOption,
    homestayIncluded, participatingMunicipalities
  } = req.body;

  const items = req.body.items
    ? (typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items)
    : [];
  const partMunis = req.body.participatingMunicipalities
    ? (typeof req.body.participatingMunicipalities === 'string'
        ? JSON.parse(req.body.participatingMunicipalities)
        : req.body.participatingMunicipalities)
    : [];

  let coverImageUrl = imageUrl || null;
  if (req.file) coverImageUrl = req.file.secure_url || req.file.path || null;

  const targetMunicipalityId = role === 'MUNICIPAL_DOT'
    ? municipality_id
    : (municipalityId ? parseInt(municipalityId) : municipality_id);

  const resolvedPackageType = role === 'PROVINCIAL_DOT' ? 'PROVINCIAL' : 'MUNICIPAL';

  if (!title || !targetMunicipalityId) {
    return res.status(400).json({ message: 'Title and municipality are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pkgRes = await client.query(
      `INSERT INTO packages
         (municipality_id, created_by, title, description, price, duration_days, image_url, inclusions,
          status, package_type, max_capacity, transport_option, homestay_included, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT',$9,$10,$11,$12,false)
       RETURNING *`,
      [
        targetMunicipalityId,
        creatorId,
        title,
        description || '',
        price ? parseFloat(price) : 0.00,
        durationDays ? parseInt(durationDays) : 1,
        coverImageUrl,
        inclusions || '',
        resolvedPackageType,
        maxCapacityPerDate ? parseInt(maxCapacityPerDate) : 30,
        transportOption || 'BOTH',
        homestayIncluded === 'true' || homestayIncluded === true,
      ]
    );

    const createdPackage = pkgRes.rows[0];

    // Insert itinerary items
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO package_items
             (package_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            createdPackage.id,
            parseInt(item.dayNumber || 1),
            item.timeSlot || null,
            item.activityType || 'CUSTOM',
            (item.attractionId && String(item.attractionId).trim()) || null,
            (item.homestayId && String(item.homestayId).trim()) || null,
            (item.guideId && String(item.guideId).trim()) || null,
            item.customActivityName || null,
            item.notes || '',
            i + 1,
          ]
        );
      }
    }

    // For multi-municipality provincial packages: create coordination requests
    if (resolvedPackageType === 'PROVINCIAL' && partMunis.length > 0) {
      for (const munId of partMunis) {
        await client.query(
          `INSERT INTO package_municipalities (package_id, municipality_id, status)
           VALUES ($1, $2, 'PENDING')`,
          [createdPackage.id, parseInt(munId)]
        );
      }
      // Notify each municipal DOT
      for (const munId of partMunis) {
        const dotUsersRes = await client.query(
          `SELECT id FROM user_accounts WHERE role = 'MUNICIPAL_DOT' AND municipality_id = $1 AND status = 'APPROVED'`,
          [parseInt(munId)]
        );
        for (const row of dotUsersRes.rows) {
          await sendNotification(
            row.id,
            '📦 Package Coordination Request',
            `The Provincial Tourism Office has invited your municipality to participate in the tour package: "${title}". Please confirm your availability.`,
            'PACKAGE',
            '/municipal-dashboard?tab=tour-packages'
          );
        }
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Tour package created successfully.', package: createdPackage });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[TOUR PKG] createTourPackage error:', err.message);
    return res.status(500).json({ message: 'Failed to create tour package.' });
  } finally {
    client.release();
  }
};

// PUT /api/tour-packages/:id — update package
export const updateTourPackage = async (req, res) => {
  const { id } = req.params;
  const { role, municipality_id } = req.user;

  const {
    title, description, price, durationDays, inclusions, imageUrl,
    maxCapacityPerDate, transportOption, homestayIncluded
  } = req.body;

  const items = req.body.items !== undefined
    ? (typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items)
    : undefined;

  let coverImageUrl = imageUrl !== undefined ? imageUrl : undefined;
  if (req.file) coverImageUrl = req.file.secure_url || req.file.path || null;

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });

    const pkg = checkRes.rows[0];
    if (role === 'MUNICIPAL_DOT' && pkg.municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized: not your municipality\'s package.' });
    }
    // Prevent editing approved/published packages unless provincial
    if (role === 'MUNICIPAL_DOT' && !['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(pkg.status)) {
      return res.status(409).json({ message: 'Package cannot be edited in its current status. Please contact Provincial DOT.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updRes = await client.query(
        `UPDATE packages
         SET title = $1, description = $2, price = $3, duration_days = $4, inclusions = $5,
             image_url = $6, max_capacity = $7, transport_option = $8, homestay_included = $9,
             status = CASE WHEN status = 'REVISION_REQUESTED' THEN 'DRAFT' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10 RETURNING *`,
        [
          title !== undefined ? title : pkg.title,
          description !== undefined ? description : pkg.description,
          price !== undefined ? parseFloat(price) : pkg.price,
          durationDays !== undefined ? parseInt(durationDays) : pkg.duration_days,
          inclusions !== undefined ? inclusions : pkg.inclusions,
          coverImageUrl !== undefined ? coverImageUrl : pkg.image_url,
          maxCapacityPerDate !== undefined ? parseInt(maxCapacityPerDate) : pkg.max_capacity,
          transportOption !== undefined ? transportOption : pkg.transport_option,
          homestayIncluded !== undefined ? (homestayIncluded === 'true' || homestayIncluded === true) : pkg.homestay_included,
          id,
        ]
      );

      if (Array.isArray(items)) {
        await client.query('DELETE FROM package_items WHERE package_id = $1', [id]);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await client.query(
            `INSERT INTO package_items
               (package_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              id,
              parseInt(item.dayNumber || 1),
              item.timeSlot || null,
              item.activityType || 'CUSTOM',
              (item.attractionId && String(item.attractionId).trim()) || null,
              (item.homestayId && String(item.homestayId).trim()) || null,
              (item.guideId && String(item.guideId).trim()) || null,
              item.customActivityName || null,
              item.notes || '',
              i + 1,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Package updated successfully.', package: updRes.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[TOUR PKG] updateTourPackage error:', err.message);
    return res.status(500).json({ message: 'Failed to update package.' });
  }
};

// DELETE /api/tour-packages/:id
export const deleteTourPackage = async (req, res) => {
  const { id } = req.params;
  const { role, municipality_id } = req.user;

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });

    const pkg = checkRes.rows[0];
    if (role === 'MUNICIPAL_DOT' && pkg.municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    if (!['DRAFT', 'REJECTED', 'REVISION_REQUESTED'].includes(pkg.status) && role !== 'PROVINCIAL_DOT') {
      return res.status(409).json({ message: 'Only draft, rejected, or revision-requested packages can be deleted by Municipal DOT.' });
    }

    await pool.query('DELETE FROM packages WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Package deleted successfully.' });
  } catch (err) {
    console.error('[TOUR PKG] deleteTourPackage error:', err.message);
    return res.status(500).json({ message: 'Failed to delete package.' });
  }
};

// POST /api/tour-packages/:id/submit — Municipal DOT submits for approval
export const submitForApproval = async (req, res) => {
  const { id } = req.params;
  const { municipality_id } = req.user;

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });
    const pkg = checkRes.rows[0];

    if (pkg.municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    if (!['DRAFT', 'REVISION_REQUESTED'].includes(pkg.status)) {
      return res.status(409).json({ message: 'Only draft or revision-requested packages can be submitted.' });
    }

    await pool.query(
      `UPDATE packages SET status = 'PENDING_APPROVAL', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    // Notify Provincial DOT
    const provRes = await pool.query(
      `SELECT id FROM user_accounts WHERE role = 'PROVINCIAL_DOT' AND status = 'APPROVED' LIMIT 5`
    );
    for (const row of provRes.rows) {
      await sendNotification(
        row.id,
        '📋 Package Pending Your Review',
        `A new tour package "${pkg.title}" has been submitted for approval by a Municipal Tourism Office.`,
        'PACKAGE',
        '/provincial-dashboard?tab=tour-packages'
      );
    }

    return res.status(200).json({ message: 'Package submitted for approval successfully.' });
  } catch (err) {
    console.error('[TOUR PKG] submitForApproval error:', err.message);
    return res.status(500).json({ message: 'Failed to submit package.' });
  }
};

// PUT /api/tour-packages/:id/review — Provincial DOT reviews package
export const reviewPackage = async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.user.id;
  const { action, remarks } = req.body; // action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'

  const statusMap = {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REQUEST_REVISION: 'REVISION_REQUESTED',
  };

  if (!statusMap[action]) {
    return res.status(400).json({ message: 'Invalid action. Use APPROVE, REJECT, or REQUEST_REVISION.' });
  }

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });
    const pkg = checkRes.rows[0];

    if (pkg.status !== 'PENDING_APPROVAL') {
      return res.status(409).json({ message: 'Only packages pending approval can be reviewed.' });
    }

    await pool.query(
      `UPDATE packages SET status = $1, review_remarks = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [statusMap[action], remarks || null, reviewerId, id]
    );

    // Notify the creator (Municipal DOT)
    if (pkg.created_by) {
      const notifMessages = {
        APPROVE: `✅ Your tour package "${pkg.title}" has been approved by the Provincial Tourism Office! You can now publish it.`,
        REJECT: `❌ Your tour package "${pkg.title}" was rejected by the Provincial Tourism Office. Remarks: ${remarks || 'No remarks provided.'}`,
        REQUEST_REVISION: `🔄 The Provincial Tourism Office has requested revisions for "${pkg.title}". Please review remarks: ${remarks || 'No remarks provided.'}`,
      };
      await sendNotification(
        pkg.created_by,
        action === 'APPROVE' ? '✅ Package Approved' : action === 'REJECT' ? '❌ Package Rejected' : '🔄 Revision Requested',
        notifMessages[action],
        'PACKAGE',
        '/municipal-dashboard?tab=tour-packages'
      );
    }

    return res.status(200).json({ message: `Package ${statusMap[action].toLowerCase()} successfully.` });
  } catch (err) {
    console.error('[TOUR PKG] reviewPackage error:', err.message);
    return res.status(500).json({ message: 'Failed to review package.' });
  }
};

// PUT /api/tour-packages/:id/publish — Provincial DOT publishes approved package
export const publishPackage = async (req, res) => {
  const { id } = req.params;
  const { unpublish } = req.body;

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });
    const pkg = checkRes.rows[0];

    if (unpublish) {
      await pool.query(
        `UPDATE packages SET status = 'APPROVED', is_published = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
      return res.status(200).json({ message: 'Package unpublished.' });
    }

    if (pkg.status !== 'APPROVED') {
      return res.status(409).json({ message: 'Only approved packages can be published.' });
    }

    await pool.query(
      `UPDATE packages SET status = 'PUBLISHED', is_published = true, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
    return res.status(200).json({ message: 'Package published and now visible to tourists.' });
  } catch (err) {
    console.error('[TOUR PKG] publishPackage error:', err.message);
    return res.status(500).json({ message: 'Failed to publish package.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  MULTI-MUNICIPALITY COORDINATION
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tour-packages/participation/requests — Municipal DOT sees invites
export const getParticipationRequests = async (req, res) => {
  const { municipality_id } = req.user;

  try {
    const result = await pool.query(
      `SELECT pm.*, p.title AS package_title, p.description AS package_description,
              p.status AS package_status, p.duration_days, p.price,
              m.name AS package_home_municipality,
              u.full_name AS created_by_name
       FROM package_municipalities pm
       JOIN packages p ON pm.package_id = p.id
       JOIN municipalities m ON p.municipality_id = m.id
       LEFT JOIN user_accounts u ON p.created_by = u.id
       WHERE pm.municipality_id = $1
       ORDER BY pm.created_at DESC`,
      [municipality_id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getParticipationRequests error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch participation requests.' });
  }
};

// PUT /api/tour-packages/participation/:id/respond — Municipal DOT confirms/declines
export const respondToParticipation = async (req, res) => {
  const { id } = req.params; // package_municipalities.id
  const { action, notes } = req.body; // 'CONFIRM' | 'DECLINE'
  const userId = req.user.id;

  if (!['CONFIRM', 'DECLINE'].includes(action)) {
    return res.status(400).json({ message: 'Action must be CONFIRM or DECLINE.' });
  }

  try {
    const checkRes = await pool.query(
      `SELECT pm.*, p.title, p.created_by FROM package_municipalities pm JOIN packages p ON pm.package_id = p.id WHERE pm.id = $1`,
      [id]
    );
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Participation request not found.' });

    const pm = checkRes.rows[0];
    const newStatus = action === 'CONFIRM' ? 'CONFIRMED' : 'DECLINED';

    await pool.query(
      `UPDATE package_municipalities SET status = $1, confirmed_by = $2, confirmed_at = CURRENT_TIMESTAMP, notes = $3 WHERE id = $4`,
      [newStatus, userId, notes || null, id]
    );

    // Notify the Provincial DOT (package creator)
    if (pm.created_by) {
      await sendNotification(
        pm.created_by,
        action === 'CONFIRM' ? '✅ Municipality Confirmed Participation' : '❌ Municipality Declined Participation',
        `A municipal tourism office has ${action === 'CONFIRM' ? 'confirmed' : 'declined'} participation in your package "${pm.title}".`,
        'PACKAGE',
        '/provincial-dashboard?tab=tour-packages'
      );
    }

    return res.status(200).json({ message: `Participation ${newStatus.toLowerCase()} successfully.` });
  } catch (err) {
    console.error('[TOUR PKG] respondToParticipation error:', err.message);
    return res.status(500).json({ message: 'Failed to respond to participation request.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  SCHEDULE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tour-packages/:id/schedules
export const getPackageSchedules = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT *, (max_capacity - reserved_count) AS remaining_slots FROM package_schedules WHERE package_id = $1 ORDER BY travel_date ASC`,
      [id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getPackageSchedules error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch schedules.' });
  }
};

// POST /api/tour-packages/:id/schedules
export const upsertPackageSchedule = async (req, res) => {
  const { id } = req.params;
  const { travelDate, maxCapacity, isAvailable } = req.body;

  if (!travelDate) return res.status(400).json({ message: 'Travel date is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO package_schedules (package_id, travel_date, max_capacity, is_available)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (package_id, travel_date)
       DO UPDATE SET max_capacity = EXCLUDED.max_capacity, is_available = EXCLUDED.is_available
       RETURNING *, (max_capacity - reserved_count) AS remaining_slots`,
      [id, travelDate, maxCapacity ? parseInt(maxCapacity) : 30, isAvailable !== false]
    );
    return res.status(200).json({ message: 'Schedule saved.', schedule: result.rows[0] });
  } catch (err) {
    console.error('[TOUR PKG] upsertPackageSchedule error:', err.message);
    return res.status(500).json({ message: 'Failed to save schedule.' });
  }
};

// DELETE /api/tour-packages/:id/schedules/:sid
export const deletePackageSchedule = async (req, res) => {
  const { id, sid } = req.params;
  try {
    await pool.query('DELETE FROM package_schedules WHERE id = $1 AND package_id = $2', [sid, id]);
    return res.status(200).json({ message: 'Schedule deleted.' });
  } catch (err) {
    console.error('[TOUR PKG] deletePackageSchedule error:', err.message);
    return res.status(500).json({ message: 'Failed to delete schedule.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  TRANSPORTATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/tour-packages/:id/transport
export const getTransportSchedules = async (req, res) => {
  const { id } = req.params;
  const { travelDate } = req.query;
  try {
    let q = `SELECT *, (total_seats - reserved_seats) AS available_seats FROM package_transport_schedules WHERE package_id = $1`;
    const params = [id];
    if (travelDate) { params.push(travelDate); q += ` AND travel_date = $${params.length}`; }
    q += ` ORDER BY travel_date ASC, departure_time ASC`;
    const result = await pool.query(q, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getTransportSchedules error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch transport schedules.' });
  }
};

// POST /api/tour-packages/:id/transport
export const upsertTransportSchedule = async (req, res) => {
  const { id } = req.params;
  const { travelDate, vehicleLabel, departureTime, totalSeats, driverName, routeNotes, transportId } = req.body;

  if (!travelDate || !vehicleLabel) {
    return res.status(400).json({ message: 'Travel date and vehicle label are required.' });
  }

  try {
    let result;
    if (transportId) {
      result = await pool.query(
        `UPDATE package_transport_schedules
         SET vehicle_label = $1, departure_time = $2, total_seats = $3, driver_name = $4, route_notes = $5
         WHERE id = $6 AND package_id = $7 RETURNING *`,
        [vehicleLabel, departureTime || null, totalSeats ? parseInt(totalSeats) : 10, driverName || null, routeNotes || null, transportId, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO package_transport_schedules (package_id, travel_date, vehicle_label, departure_time, total_seats, driver_name, route_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, travelDate, vehicleLabel, departureTime || null, totalSeats ? parseInt(totalSeats) : 10, driverName || null, routeNotes || null]
      );
    }
    const row = result.rows[0];
    row.available_seats = row.total_seats - row.reserved_seats;
    return res.status(200).json({ message: 'Transport schedule saved.', transport: row });
  } catch (err) {
    console.error('[TOUR PKG] upsertTransportSchedule error:', err.message);
    return res.status(500).json({ message: 'Failed to save transport schedule.' });
  }
};

// DELETE /api/tour-packages/:id/transport/:tid
export const deleteTransportSchedule = async (req, res) => {
  const { id, tid } = req.params;
  try {
    await pool.query('DELETE FROM package_transport_schedules WHERE id = $1 AND package_id = $2', [tid, id]);
    return res.status(200).json({ message: 'Transport schedule deleted.' });
  } catch (err) {
    console.error('[TOUR PKG] deleteTransportSchedule error:', err.message);
    return res.status(500).json({ message: 'Failed to delete transport schedule.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  TOURIST BOOKING FLOW
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/tour-packages/:id/book
export const createPackageBooking = async (req, res) => {
  const touristId = req.user.id;
  const { id: packageId } = req.params;
  const {
    travelDate, numberOfTourists, transportChoice, transportScheduleId,
    homestayId, homestayCheckin, homestayCheckout, homestayRooms,
    specialRequests
  } = req.body;

  if (!travelDate || !numberOfTourists || !transportChoice) {
    return res.status(400).json({ message: 'Travel date, number of tourists, and transport choice are required.' });
  }
  const numTourists = parseInt(numberOfTourists);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify package exists and is published
    const pkgRes = await client.query('SELECT * FROM packages WHERE id = $1', [packageId]);
    if (pkgRes.rows.length === 0) return res.status(404).json({ message: 'Package not found.' });
    const pkg = pkgRes.rows[0];
    if (pkg.status !== 'PUBLISHED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This package is not currently available for booking.' });
    }

    // 2. Check package schedule capacity
    const schedRes = await client.query(
      `SELECT * FROM package_schedules WHERE package_id = $1 AND travel_date = $2 FOR UPDATE`,
      [packageId, travelDate]
    );
    if (schedRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'No schedule slot available for the selected date.' });
    }
    const sched = schedRes.rows[0];
    if (!sched.is_available) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'The selected date is not available for booking.' });
    }
    const remaining = sched.max_capacity - sched.reserved_count;
    if (numTourists > remaining) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: `Insufficient package capacity. Only ${remaining} slot(s) remaining for ${travelDate}.`,
        remaining,
      });
    }

    // 3. Check transportation capacity (if provided transport selected)
    let transportScheduleRow = null;
    if (transportChoice === 'PROVIDED') {
      if (!transportScheduleId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'A transport schedule must be selected for provided transportation.' });
      }
      const transRes = await client.query(
        `SELECT * FROM package_transport_schedules WHERE id = $1 AND package_id = $2 AND travel_date = $3 FOR UPDATE`,
        [transportScheduleId, packageId, travelDate]
      );
      if (transRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Transport schedule not found.' });
      }
      transportScheduleRow = transRes.rows[0];
      const availSeats = transportScheduleRow.total_seats - transportScheduleRow.reserved_seats;
      if (numTourists > availSeats) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          message: `Insufficient transport capacity. Only ${availSeats} seat(s) remaining on ${transportScheduleRow.vehicle_label}.`,
          availableSeats: availSeats,
        });
      }
    }

    // 4. Check homestay availability
    if (homestayId && homestayCheckin && homestayCheckout) {
      const homestayCheck = await client.query(
        `SELECT id FROM tour_package_bookings
         WHERE homestay_id = $1 AND status IN ('PENDING','CONFIRMED')
           AND NOT ($2::date > homestay_checkout OR $3::date < homestay_checkin)`,
        [homestayId, homestayCheckin, homestayCheckout]
      );
      if (homestayCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Selected homestay is not available for the requested dates.' });
      }
    }

    // 5. Generate booking reference
    const bookingRef = await generateBookingReference();

    // 6. Calculate end date
    const startDateObj = new Date(travelDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + Math.max(0, (pkg.duration_days || 1) - 1));
    const endDate = endDateObj.toISOString().split('T')[0];

    // 7. Create booking record
    const bookingRes = await client.query(
      `INSERT INTO tour_package_bookings
         (booking_reference, tourist_id, package_id, schedule_id, transport_schedule_id,
          travel_date, end_date, number_of_tourists, transport_choice,
          homestay_id, homestay_checkin, homestay_checkout, homestay_rooms,
          total_amount, special_requests, status, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'PENDING','UNPAID')
       RETURNING *`,
      [
        bookingRef, touristId, packageId, sched.id,
        transportScheduleRow ? transportScheduleRow.id : null,
        travelDate, endDate, numTourists,
        transportChoice,
        homestayId || null, homestayCheckin || null, homestayCheckout || null,
        homestayRooms ? parseInt(homestayRooms) : 0,
        pkg.price * numTourists,
        specialRequests || null,
      ]
    );

    // 8. Decrement capacity
    await client.query(
      `UPDATE package_schedules SET reserved_count = reserved_count + $1 WHERE id = $2`,
      [numTourists, sched.id]
    );

    // Mark fully booked if capacity reached
    await client.query(
      `UPDATE package_schedules SET is_available = false WHERE id = $1 AND reserved_count >= max_capacity`,
      [sched.id]
    );

    // 9. Reserve transport seats
    if (transportScheduleRow) {
      await client.query(
        `UPDATE package_transport_schedules SET reserved_seats = reserved_seats + $1 WHERE id = $2`,
        [numTourists, transportScheduleRow.id]
      );
    }

    // 10. Check if entire package is fully booked (all schedule dates full)
    const anyOpenRes = await client.query(
      `SELECT id FROM package_schedules WHERE package_id = $1 AND is_available = true AND travel_date >= CURRENT_DATE LIMIT 1`,
      [packageId]
    );
    if (anyOpenRes.rows.length === 0) {
      await client.query(
        `UPDATE packages SET status = 'FULLY_BOOKED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [packageId]
      );
    }

    await client.query('COMMIT');

    const booking = bookingRes.rows[0];

    // 11. Notify relevant parties
    // Notify Municipal DOT
    const dotRes = await pool.query(
      `SELECT id FROM user_accounts WHERE role = 'MUNICIPAL_DOT' AND municipality_id = $1 AND status = 'APPROVED'`,
      [pkg.municipality_id]
    );
    for (const row of dotRes.rows) {
      await sendNotification(
        row.id,
        '🎒 New Tour Package Booking',
        `A tourist has booked "${pkg.title}" for ${travelDate}. Booking Ref: ${bookingRef}`,
        'BOOKING',
        '/municipal-dashboard?tab=tour-packages'
      );
    }

    // Notify tourist
    await sendNotification(
      touristId,
      '✅ Booking Submitted',
      `Your booking for "${pkg.title}" on ${travelDate} has been submitted! Ref: ${bookingRef}. Please upload your payment proof to confirm your slot.`,
      'BOOKING',
      '/tourist-dashboard?tab=tour-bookings'
    );

    return res.status(201).json({
      message: 'Booking submitted successfully!',
      booking,
      bookingReference: bookingRef,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[TOUR PKG] createPackageBooking error:', err.message);
    return res.status(500).json({ message: 'Failed to create booking.' });
  } finally {
    client.release();
  }
};

// GET /api/tour-packages/bookings/mine — tourist's own bookings
export const getMyPackageBookings = async (req, res) => {
  const touristId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT tpb.*, p.title AS package_title, p.image_url AS package_image, p.duration_days,
              m.name AS municipality_name, hp.name AS homestay_name,
              u.full_name AS tourist_name, u.email AS tourist_email, u.phone_number AS tourist_phone
       FROM tour_package_bookings tpb
       JOIN packages p ON tpb.package_id = p.id
       JOIN municipalities m ON p.municipality_id = m.id
       LEFT JOIN homestay_profiles hp ON tpb.homestay_id = hp.id
       LEFT JOIN user_accounts u ON tpb.tourist_id = u.id
       WHERE tpb.tourist_id = $1
       ORDER BY tpb.created_at DESC`,
      [touristId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getMyPackageBookings error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch your bookings.' });
  }
};

// GET /api/tour-packages/bookings/all — DOT views bookings (scoped)
export const getAllPackageBookings = async (req, res) => {
  const { role, municipality_id } = req.user;
  const { packageId, status, travelDate } = req.query;

  try {
    let q = `
      SELECT tpb.*, p.title AS package_title, p.image_url AS package_image, p.municipality_id,
             m.name AS municipality_name,
             u.full_name AS tourist_name, u.email AS tourist_email, u.phone_number AS tourist_phone,
             hp.name AS homestay_name,
             pts.vehicle_label, pts.departure_time AS transport_departure
      FROM tour_package_bookings tpb
      JOIN packages p ON tpb.package_id = p.id
      JOIN municipalities m ON p.municipality_id = m.id
      LEFT JOIN user_accounts u ON tpb.tourist_id = u.id
      LEFT JOIN homestay_profiles hp ON tpb.homestay_id = hp.id
      LEFT JOIN package_transport_schedules pts ON tpb.transport_schedule_id = pts.id
      WHERE 1=1`;
    const params = [];

    if (role === 'MUNICIPAL_DOT') {
      params.push(municipality_id);
      q += ` AND p.municipality_id = $${params.length}`;
    }
    if (packageId) { params.push(packageId); q += ` AND tpb.package_id = $${params.length}`; }
    if (status) { params.push(status.toUpperCase()); q += ` AND tpb.status = $${params.length}`; }
    if (travelDate) { params.push(travelDate); q += ` AND tpb.travel_date = $${params.length}`; }

    q += ` ORDER BY tpb.travel_date ASC, tpb.created_at DESC`;

    const result = await pool.query(q, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getAllPackageBookings error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// PUT /api/tour-packages/bookings/:bid/status — DOT confirms or cancels
export const updateBookingStatus = async (req, res) => {
  const { bid } = req.params;
  const { status, remarks } = req.body;
  const { role, municipality_id } = req.user;

  const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookRes = await client.query(
      `SELECT tpb.*, p.municipality_id, p.title AS package_title FROM tour_package_bookings tpb JOIN packages p ON tpb.package_id = p.id WHERE tpb.id = $1 FOR UPDATE`,
      [bid]
    );
    if (bookRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Booking not found.' }); }
    const booking = bookRes.rows[0];

    if (role === 'MUNICIPAL_DOT' && booking.municipality_id !== municipality_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const prevStatus = booking.status;
    await client.query(
      `UPDATE tour_package_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, bid]
    );

    // If cancelling an active booking — release capacity
    if (status === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(prevStatus)) {
      await client.query(
        `UPDATE package_schedules SET reserved_count = GREATEST(0, reserved_count - $1), is_available = true WHERE id = $2`,
        [booking.number_of_tourists, booking.schedule_id]
      );
      if (booking.transport_schedule_id) {
        await client.query(
          `UPDATE package_transport_schedules SET reserved_seats = GREATEST(0, reserved_seats - $1) WHERE id = $2`,
          [booking.number_of_tourists, booking.transport_schedule_id]
        );
      }
      // Re-open package if it was fully booked
      await client.query(
        `UPDATE packages SET status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'FULLY_BOOKED'`,
        [booking.package_id]
      );
    }

    await client.query('COMMIT');

    // Notify tourist
    if (booking.tourist_id) {
      const notifText = {
        CONFIRMED: `🎉 Your tour package booking "${booking.package_title}" (Ref: ${booking.booking_reference}) has been confirmed! Check your dashboard for details.`,
        CANCELLED: `❌ Your booking "${booking.package_title}" (Ref: ${booking.booking_reference}) has been cancelled.${remarks ? ' Reason: ' + remarks : ''}`,
        COMPLETED: `✅ Your tour package "${booking.package_title}" is now marked as completed. Thank you for visiting Abra!`,
      };
      await sendNotification(
        booking.tourist_id,
        status === 'CONFIRMED' ? '🎉 Booking Confirmed!' : status === 'CANCELLED' ? '❌ Booking Cancelled' : '✅ Trip Completed',
        notifText[status],
        'BOOKING',
        '/tourist-dashboard?tab=tour-bookings'
      );
    }

    return res.status(200).json({ message: `Booking ${status.toLowerCase()} successfully.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[TOUR PKG] updateBookingStatus error:', err.message);
    return res.status(500).json({ message: 'Failed to update booking status.' });
  } finally {
    client.release();
  }
};

// POST /api/tour-packages/bookings/:bid/payment — tourist uploads payment proof
export const uploadBookingPaymentProof = async (req, res) => {
  const { bid } = req.params;
  const touristId = req.user.id;

  try {
    const checkRes = await pool.query(
      'SELECT * FROM tour_package_bookings WHERE id = $1 AND tourist_id = $2',
      [bid, touristId]
    );
    if (checkRes.rows.length === 0) return res.status(404).json({ message: 'Booking not found.' });

    let proofUrl = null;
    if (req.file) proofUrl = req.file.secure_url || req.file.path;
    if (!proofUrl) return res.status(400).json({ message: 'Payment proof file is required.' });

    await pool.query(
      `UPDATE tour_package_bookings SET payment_proof_url = $1, payment_status = 'PROOF_SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [proofUrl, bid]
    );

    // Notify Municipal DOT
    const booking = checkRes.rows[0];
    const pkgRes = await pool.query('SELECT municipality_id, title FROM packages WHERE id = $1', [booking.package_id]);
    if (pkgRes.rows.length > 0) {
      const dotRes = await pool.query(
        `SELECT id FROM user_accounts WHERE role = 'MUNICIPAL_DOT' AND municipality_id = $1 AND status = 'APPROVED'`,
        [pkgRes.rows[0].municipality_id]
      );
      for (const row of dotRes.rows) {
        await sendNotification(
          row.id,
          '💳 Payment Proof Received',
          `A tourist has uploaded payment proof for booking "${pkgRes.rows[0].title}" (Ref: ${booking.booking_reference}). Please verify and confirm.`,
          'PAYMENT',
          '/municipal-dashboard?tab=tour-packages'
        );
      }
    }

    return res.status(200).json({ message: 'Payment proof uploaded. Awaiting verification.' });
  } catch (err) {
    console.error('[TOUR PKG] uploadBookingPaymentProof error:', err.message);
    return res.status(500).json({ message: 'Failed to upload payment proof.' });
  }
};

// PUT /api/tour-packages/bookings/:bid/verify-payment — DOT verifies payment
export const verifyBookingPayment = async (req, res) => {
  const { bid } = req.params;
  const { role, municipality_id } = req.user;

  try {
    const bookRes = await pool.query(
      `SELECT tpb.*, p.municipality_id FROM tour_package_bookings tpb JOIN packages p ON tpb.package_id = p.id WHERE tpb.id = $1`,
      [bid]
    );
    if (bookRes.rows.length === 0) return res.status(404).json({ message: 'Booking not found.' });
    const booking = bookRes.rows[0];

    if (role === 'MUNICIPAL_DOT' && booking.municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await pool.query(
      `UPDATE tour_package_bookings SET payment_status = 'VERIFIED', status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [bid]
    );

    if (booking.tourist_id) {
      await sendNotification(
        booking.tourist_id,
        '💳 Payment Verified — Booking Confirmed!',
        `Your payment for booking ref ${booking.booking_reference} has been verified. Your tour package booking is now fully confirmed!`,
        'PAYMENT',
        '/tourist-dashboard?tab=tour-bookings'
      );
    }

    return res.status(200).json({ message: 'Payment verified and booking confirmed.' });
  } catch (err) {
    console.error('[TOUR PKG] verifyBookingPayment error:', err.message);
    return res.status(500).json({ message: 'Failed to verify payment.' });
  }
};

// GET /api/tour-packages/stats — dashboard stats for Provincial DOT
export const getProvincePackageStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE p.package_type IS NOT NULL) AS total_packages,
        COUNT(*) FILTER (WHERE p.status = 'PENDING_APPROVAL') AS pending_approval,
        COUNT(*) FILTER (WHERE p.status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE p.status = 'PUBLISHED') AS published,
        COUNT(*) FILTER (WHERE p.status = 'FULLY_BOOKED') AS fully_booked,
        COUNT(*) FILTER (WHERE p.status = 'DRAFT') AS draft,
        COUNT(DISTINCT p.municipality_id) AS municipalities_involved
      FROM packages p
    `);
    const bookingStats = await pool.query(`
      SELECT
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_bookings,
        SUM(number_of_tourists) FILTER (WHERE status IN ('PENDING','CONFIRMED')) AS total_tourists
      FROM tour_package_bookings
    `);
    return res.status(200).json({ packages: stats.rows[0], bookings: bookingStats.rows[0] });
  } catch (err) {
    console.error('[TOUR PKG] getProvincePackageStats error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch stats.' });
  }
};

// GET /api/tour-packages/my-packages — DOT sees only their own municipality's packages
export const getMyMunicipalPackages = async (req, res) => {
  const { role, municipality_id } = req.user;
  try {
    let q = `
      SELECT p.*, m.name AS municipality_name,
             (SELECT COUNT(*) FROM package_items pi WHERE pi.package_id = p.id) AS item_count,
             (SELECT COUNT(*) FROM package_schedules ps WHERE ps.package_id = p.id) AS schedule_count,
             (SELECT SUM(tpb.number_of_tourists) FROM tour_package_bookings tpb WHERE tpb.package_id = p.id AND tpb.status IN ('PENDING','CONFIRMED')) AS total_tourist_reservations
      FROM packages p
      JOIN municipalities m ON p.municipality_id = m.id
      WHERE 1=1`;
    const params = [];

    if (role === 'MUNICIPAL_DOT') {
      params.push(municipality_id);
      q += ` AND p.municipality_id = $${params.length}`;
    }

    q += ` ORDER BY p.created_at DESC`;
    const result = await pool.query(q, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[TOUR PKG] getMyMunicipalPackages error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch packages.' });
  }
};
