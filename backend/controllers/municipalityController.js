import pool from '../config/db.js';

// Get all municipalities
export const getMunicipalities = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, p.profile_picture_url as dot_profile_pic
       FROM municipalities m
       LEFT JOIN user_accounts u ON u.municipality_id = m.id AND u.role = 'MUNICIPAL_DOT' AND u.status = 'APPROVED'
       LEFT JOIN municipal_dot_profiles p ON u.id = p.user_id
       ORDER BY m.name ASC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching municipalities:', err);
    return res.status(500).json({ message: 'Internal server error fetching municipalities.' });
  }
};

// Get details for a specific municipality (Attractions, Approved Homestays, Approved Guides)
export const getMunicipalityDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get Municipality info
    const munResult = await pool.query('SELECT * FROM municipalities WHERE id = $1', [id]);
    if (munResult.rows.length === 0) {
      return res.status(404).json({ message: 'Municipality not found.' });
    }
    const municipality = munResult.rows[0];

    // Fetch municipality banner images
    const imagesResult = await pool.query(
      'SELECT * FROM municipality_images WHERE municipality_id = $1 ORDER BY id DESC',
      [id]
    );
    municipality.images = imagesResult.rows;

    // 2. Get Tourist Attractions
    const attractionsResult = await pool.query(
      'SELECT * FROM tourist_attractions WHERE municipality_id = $1 ORDER BY name ASC',
      [id]
    );

    // 3. Get Approved Homestays (Join user_accounts to check municipality and status)
    const homestaysResult = await pool.query(
      `SELECT h.*, u.full_name as owner_name, u.municipality_id
       FROM homestay_profiles h
       JOIN user_accounts u ON h.owner_id = u.id
       WHERE u.municipality_id = $1 AND h.status = 'APPROVED'`,
      [id]
    );
    
    // Add images for each homestay
    const homestays = homestaysResult.rows;
    for (const homestay of homestays) {
      const imgRes = await pool.query(
        'SELECT * FROM homestay_images WHERE homestay_id = $1 ORDER BY is_featured DESC',
        [homestay.id]
      );
      homestay.images = imgRes.rows;
    }

    // 4. Get Approved Tour Guides
    const guidesResult = await pool.query(
      `SELECT g.*, u.full_name as guide_name, u.phone_number
       FROM tour_guide_profiles g
       JOIN user_accounts u ON g.guide_id = u.id
       WHERE u.municipality_id = $1 AND g.status = 'APPROVED'`,
      [id]
    );

    // 5. Get Approved Local DOT details
    const dotResult = await pool.query(
      `SELECT u.full_name as officer_name, u.email as officer_email, u.phone_number as officer_phone, p.designation, p.office_address, p.profile_picture_url
       FROM user_accounts u
       LEFT JOIN municipal_dot_profiles p ON u.id = p.user_id
       WHERE u.municipality_id = $1 AND u.role = 'MUNICIPAL_DOT' AND u.status = 'APPROVED'
       LIMIT 1`,
      [id]
    );
    const localDOT = dotResult.rows[0] || null;

    return res.status(200).json({
      municipality,
      attractions: attractionsResult.rows,
      homestays,
      guides: guidesResult.rows,
      localDOT,
    });
  } catch (err) {
    console.error('Error fetching municipality details:', err);
    return res.status(500).json({ message: 'Internal server error fetching municipality details.' });
  }
};

// Add Attraction (Municipal DOT Admin only)
export const addAttraction = async (req, res) => {
  const { name, description, category, locationDetails, latitude, longitude } = req.body;
  const { municipality_id } = req.user; // from JWT token

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required.' });
  }

  let imageUrl = req.body.imageUrl || null;
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const result = await pool.query(
      `INSERT INTO tourist_attractions (municipality_id, name, description, category, image_url, location_details, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [municipality_id, name, description, category, imageUrl, locationDetails, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null]
    );

    return res.status(201).json({
      message: 'Attraction added successfully.',
      attraction: result.rows[0],
    });
  } catch (err) {
    console.error('Error adding attraction:', err);
    return res.status(500).json({ message: 'Internal server error adding attraction.' });
  }
};

// Edit Attraction (Municipal DOT Admin only)
export const updateAttraction = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, imageUrl, locationDetails, latitude, longitude } = req.body;
  const { municipality_id } = req.user;

  try {
    // Check if attraction belongs to admin's municipality
    const checkRes = await pool.query('SELECT * FROM tourist_attractions WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Attraction not found.' });
    }

    if (checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Forbidden. You do not manage this attraction.' });
    }

    let finalImageUrl = checkRes.rows[0].image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      finalImageUrl = imageUrl;
    }

    const result = await pool.query(
      `UPDATE tourist_attractions 
       SET name = $1, description = $2, category = $3, image_url = $4, location_details = $5, latitude = $6, longitude = $7
       WHERE id = $8 RETURNING *`,
      [name, description, category, finalImageUrl, locationDetails, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, id]
    );

    return res.status(200).json({
      message: 'Attraction updated successfully.',
      attraction: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating attraction:', err);
    return res.status(500).json({ message: 'Internal server error updating attraction.' });
  }
};

// Delete Attraction (Municipal DOT Admin only)
export const deleteAttraction = async (req, res) => {
  const { id } = req.params;
  const { municipality_id } = req.user;

  try {
    const checkRes = await pool.query('SELECT * FROM tourist_attractions WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Attraction not found.' });
    }

    if (checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Forbidden. You do not manage this attraction.' });
    }

    await pool.query('DELETE FROM tourist_attractions WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Attraction deleted successfully.' });
  } catch (err) {
    console.error('Error deleting attraction:', err);
    return res.status(500).json({ message: 'Internal server error deleting attraction.' });
  }
};

// Update Municipality Profile Description (Municipal DOT only)
export const updateMunicipalityProfile = async (req, res) => {
  const { description } = req.body;
  const { municipality_id } = req.user;

  if (!municipality_id) {
    return res.status(400).json({ message: 'User is not assigned to a municipality.' });
  }

  try {
    const result = await pool.query(
      `UPDATE municipalities
       SET description = COALESCE($1, description)
       WHERE id = $2 RETURNING *`,
      [description, municipality_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Municipality not found.' });
    }

    return res.status(200).json({
      message: 'Municipality profile updated successfully.',
      municipality: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating municipality profile:', err);
    return res.status(500).json({ message: 'Internal server error updating municipality profile.' });
  }
};

// Add Municipality Image (Municipal DOT only)
export const addMunicipalityImage = async (req, res) => {
  const { municipality_id } = req.user;
  const { isFeatured } = req.body;

  if (!municipality_id) {
    return res.status(400).json({ message: 'User is not assigned to a municipality.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    // If setting as featured, remove featured status from other images of this municipality
    if (isFeatured === 'true' || isFeatured === true) {
      await pool.query('UPDATE municipality_images SET is_featured = false WHERE municipality_id = $1', [municipality_id]);
      // Also update featured_image_url in municipalities table
      await pool.query('UPDATE municipalities SET featured_image_url = $1 WHERE id = $2', [imageUrl, municipality_id]);
    }

    const result = await pool.query(
      `INSERT INTO municipality_images (municipality_id, image_url, is_featured)
       VALUES ($1, $2, $3) RETURNING *`,
      [municipality_id, imageUrl, isFeatured === 'true' || isFeatured === true]
    );

    return res.status(201).json({
      message: 'Municipality image added successfully.',
      image: result.rows[0],
    });
  } catch (err) {
    console.error('Error adding municipality image:', err);
    return res.status(500).json({ message: 'Internal server error adding municipality image.' });
  }
};

// Delete Municipality Image (Municipal DOT only)
export const deleteMunicipalityImage = async (req, res) => {
  const { id } = req.params;
  const { municipality_id } = req.user;

  if (!municipality_id) {
    return res.status(400).json({ message: 'User is not assigned to a municipality.' });
  }

  try {
    // Verify ownership
    const checkRes = await pool.query('SELECT * FROM municipality_images WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Municipality image not found.' });
    }

    if (checkRes.rows[0].municipality_id !== municipality_id) {
      return res.status(403).json({ message: 'Forbidden. You do not manage this municipality\'s images.' });
    }

    await pool.query('DELETE FROM municipality_images WHERE id = $1', [id]);

    // If the deleted image was featured, set another image (if any) as featured or reset featured_image_url
    if (checkRes.rows[0].is_featured) {
      const remainingRes = await pool.query('SELECT * FROM municipality_images WHERE municipality_id = $1 ORDER BY id DESC LIMIT 1', [municipality_id]);
      if (remainingRes.rows.length > 0) {
        const newFeatured = remainingRes.rows[0];
        await pool.query('UPDATE municipality_images SET is_featured = true WHERE id = $1', [newFeatured.id]);
        await pool.query('UPDATE municipalities SET featured_image_url = $1 WHERE id = $2', [newFeatured.image_url, municipality_id]);
      } else {
        await pool.query('UPDATE municipalities SET featured_image_url = NULL WHERE id = $2', [municipality_id]);
      }
    }

    return res.status(200).json({ message: 'Municipality image deleted successfully.' });
  } catch (err) {
    console.error('Error deleting municipality image:', err);
    return res.status(500).json({ message: 'Internal server error deleting municipality image.' });
  }
};
