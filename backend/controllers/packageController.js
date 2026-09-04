import pool from '../config/db.js';

// Get all published packages (optional filter by municipalityId)
export const getPackages = async (req, res) => {
  const { municipalityId } = req.query;

  try {
    let queryStr = `
      SELECT p.*, 
             m.name as municipality_name,
             u.full_name as creator_name,
             (SELECT COUNT(*) FROM package_items pi WHERE pi.package_id = p.id) as item_count
      FROM packages p
      JOIN municipalities m ON p.municipality_id = m.id
      LEFT JOIN user_accounts u ON p.created_by = u.id
      WHERE p.is_published = true`;
    let params = [];

    if (municipalityId) {
      queryStr += ` AND p.municipality_id = $1`;
      params.push(parseInt(municipalityId));
    }

    queryStr += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(queryStr, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching packages:', err.message || err);
    return res.status(500).json({ message: 'Internal server error fetching packages.' });
  }
};

// Get single package details with its day-by-day items
export const getPackageDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const pkgRes = await pool.query(
      `SELECT p.*, m.name as municipality_name 
       FROM packages p 
       JOIN municipalities m ON p.municipality_id = m.id 
       WHERE p.id = $1`,
      [id]
    );

    if (pkgRes.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    const packageData = pkgRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT pi.*,
              ta.name as attraction_name, ta.category as attraction_category, ta.image_url as attraction_image,
              hp.name as homestay_name, hp.address as homestay_address,
              tg_u.full_name as guide_name, tg.profile_picture_url as guide_image
       FROM package_items pi
       LEFT JOIN tourist_attractions ta ON pi.attraction_id = ta.id
       LEFT JOIN homestay_profiles hp ON pi.homestay_id = hp.id
       LEFT JOIN tour_guide_profiles tg ON pi.guide_id = tg.id
       LEFT JOIN user_accounts tg_u ON tg.guide_id = tg_u.id
       WHERE pi.package_id = $1
       ORDER BY pi.day_number ASC, pi.time_slot ASC, pi.sequence_order ASC`,
      [id]
    );

    return res.status(200).json({
      package: packageData,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching package details:', err.message || err);
    return res.status(500).json({ message: 'Internal server error fetching package details.' });
  }
};

// Create new Municipal Tour Package (Municipal or Provincial DOT)
export const createPackage = async (req, res) => {
  const creatorId = req.user.id;
  const { role, municipality_id } = req.user;

  if (role !== 'MUNICIPAL_DOT' && role !== 'PROVINCIAL_DOT') {
    return res.status(403).json({ message: 'Forbidden. Only Municipal or Provincial DOT officers can create packages.' });
  }

  const { title, description, price, durationDays, inclusions, imageUrl, municipalityId } = req.body;
  // items arrives as a JSON string when using FormData
  const items = req.body.items ? (typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items) : [];

  // Determine uploaded image URL — supports Cloudinary or local disk
  let coverImageUrl = imageUrl || null;
  if (req.file) {
    coverImageUrl = req.file.secure_url || req.file.path || null;
  }

  const targetMunicipalityId = role === 'MUNICIPAL_DOT' ? municipality_id : (municipalityId || municipality_id);

  if (!title || !targetMunicipalityId) {
    return res.status(400).json({ message: 'Title and Municipality are required.' });
  }

  try {
    const pkgRes = await pool.query(
      `INSERT INTO packages (municipality_id, created_by, title, description, price, duration_days, image_url, inclusions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        targetMunicipalityId,
        creatorId,
        title,
        description || '',
        price ? parseFloat(price) : 0.00,
        durationDays ? parseInt(durationDays) : 1,
        coverImageUrl,
        inclusions || ''
      ]
    );

    const createdPackage = pkgRes.rows[0];

    // Insert items if provided
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await pool.query(
          `INSERT INTO package_items 
           (package_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            createdPackage.id,
            parseInt(item.dayNumber || 1),
            item.timeSlot || null,
            item.activityType,
            item.attractionId || null,
            item.homestayId || null,
            item.guideId || null,
            item.customActivityName || null,
            item.notes || '',
            i + 1
          ]
        );
      }
    }

    return res.status(201).json({
      message: 'Package created successfully.',
      package: createdPackage,
    });
  } catch (err) {
    console.error('Error creating package:', err.message || err);
    return res.status(500).json({ message: 'Internal server error creating package.' });
  }
};

// Update package
export const updatePackage = async (req, res) => {
  const { id } = req.params;
  const { role, municipality_id } = req.user;
  const { title, description, price, durationDays, inclusions, imageUrl, isPublished } = req.body;
  // items arrives as a JSON string when using FormData
  const items = req.body.items !== undefined ? (typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items) : undefined;

  // Determine uploaded image URL — supports Cloudinary or local disk
  let coverImageUrl = imageUrl !== undefined ? imageUrl : undefined;
  if (req.file) {
    coverImageUrl = req.file.secure_url || req.file.path || null;
  }

  if (role !== 'MUNICIPAL_DOT' && role !== 'PROVINCIAL_DOT') {
    return res.status(403).json({ message: 'Forbidden.' });
  }

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    const currentPkg = checkRes.rows[0];
    if (role === 'MUNICIPAL_DOT' && currentPkg.municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized for this municipality.' });
    }

    const updatedRes = await pool.query(
      `UPDATE packages 
       SET title = $1, description = $2, price = $3, duration_days = $4, inclusions = $5, image_url = $6, is_published = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        title !== undefined ? title : currentPkg.title,
        description !== undefined ? description : currentPkg.description,
        price !== undefined ? parseFloat(price) : currentPkg.price,
        durationDays !== undefined ? parseInt(durationDays) : currentPkg.duration_days,
        inclusions !== undefined ? inclusions : currentPkg.inclusions,
        coverImageUrl !== undefined ? coverImageUrl : currentPkg.image_url,
        isPublished !== undefined ? isPublished : currentPkg.is_published,
        id
      ]
    );

    // Replace items if provided
    if (Array.isArray(items)) {
      await pool.query('DELETE FROM package_items WHERE package_id = $1', [id]);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await pool.query(
          `INSERT INTO package_items 
           (package_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            parseInt(item.dayNumber || 1),
            item.timeSlot || null,
            item.activityType,
            item.attractionId || null,
            item.homestayId || null,
            item.guideId || null,
            item.customActivityName || null,
            item.notes || '',
            i + 1
          ]
        );
      }
    }

    return res.status(200).json({
      message: 'Package updated successfully.',
      package: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('Error updating package:', err.message || err);
    return res.status(500).json({ message: 'Internal server error updating package.' });
  }
};

// Delete package
export const deletePackage = async (req, res) => {
  const { id } = req.params;
  const { role, municipality_id } = req.user;

  if (role !== 'MUNICIPAL_DOT' && role !== 'PROVINCIAL_DOT') {
    return res.status(403).json({ message: 'Forbidden.' });
  }

  try {
    const checkRes = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    if (role === 'MUNICIPAL_DOT' && checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Unauthorized for this municipality.' });
    }

    await pool.query('DELETE FROM packages WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Package deleted successfully.' });
  } catch (err) {
    console.error('Error deleting package:', err.message || err);
    return res.status(500).json({ message: 'Internal server error deleting package.' });
  }
};

// ── Option 2 Core Feature: Import Municipal Package to Tourist Itinerary ──
export const importPackageToItinerary = async (req, res) => {
  const touristId = req.user.id;
  const { id: packageId } = req.params;
  const { startDate } = req.body;

  try {
    // 1. Fetch package metadata
    const pkgRes = await pool.query(
      `SELECT p.*, m.name as municipality_name FROM packages p JOIN municipalities m ON p.municipality_id = m.id WHERE p.id = $1`,
      [packageId]
    );

    if (pkgRes.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    const pkg = pkgRes.rows[0];

    // Calculate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(0, (pkg.duration_days || 1) - 1));

    const itineraryTitle = `${pkg.title} (${pkg.municipality_name})`;
    const itineraryDesc = `Imported from official Municipal Tour Package: ${pkg.title}. Inclusions: ${pkg.inclusions || 'Standard municipal experience'}`;

    // 2. Create Itinerary
    const itinRes = await pool.query(
      `INSERT INTO itineraries (tourist_id, title, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        touristId,
        itineraryTitle,
        itineraryDesc,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      ]
    );

    const newItinerary = itinRes.rows[0];

    // 3. Fetch package items and copy them into itinerary_items
    const itemsRes = await pool.query(
      `SELECT * FROM package_items WHERE package_id = $1 ORDER BY day_number ASC, sequence_order ASC`,
      [packageId]
    );

    for (const pItem of itemsRes.rows) {
      await pool.query(
        `INSERT INTO itinerary_items
         (itinerary_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newItinerary.id,
          pItem.day_number,
          pItem.time_slot,
          pItem.activity_type,
          pItem.attraction_id,
          pItem.homestay_id,
          pItem.guide_id,
          pItem.custom_activity_name,
          pItem.notes,
          pItem.sequence_order
        ]
      );
    }

    return res.status(201).json({
      message: 'Package imported successfully into your itinerary!',
      itinerary: newItinerary,
    });
  } catch (err) {
    console.error('Error importing package to itinerary:', err.message || err);
    return res.status(500).json({ message: 'Internal server error importing package.' });
  }
};
