import pool from '../config/db.js';

// GET /api/advertisements/public — Public (Landing page active video ads, optionally filtered by municipalityId)
export const getPublicAdvertisements = async (req, res) => {
  const { municipalityId } = req.query;
  try {
    let query = `
      SELECT 
        va.id,
        va.title,
        va.subtitle,
        va.description,
        va.video_url,
        va.thumbnail_url,
        va.category,
        va.municipality_id,
        m.name AS municipality_name,
        va.cta_text,
        va.cta_link,
        va.badge_label,
        va.display_order,
        va.created_at
      FROM video_advertisements va
      LEFT JOIN municipalities m ON va.municipality_id = m.id
      WHERE va.is_active = true
    `;
    const params = [];

    if (municipalityId) {
      params.push(parseInt(municipalityId, 10));
      query += ` AND va.municipality_id = $${params.length}`;
    }

    query += ` ORDER BY va.display_order ASC, va.created_at DESC`;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getPublicAdvertisements error:', err);
    return res.status(500).json({ message: 'Server error fetching video advertisements.' });
  }
};

// GET /api/advertisements/all — PROVINCIAL_DOT or MUNICIPAL_DOT
export const getAllAdvertisements = async (req, res) => {
  try {
    let query = `
      SELECT 
        va.*,
        m.name AS municipality_name,
        u.full_name AS created_by_name
      FROM video_advertisements va
      LEFT JOIN municipalities m ON va.municipality_id = m.id
      LEFT JOIN user_accounts u ON va.created_by = u.id
    `;
    const params = [];

    // Municipal DOT officers can only view their own municipality's ads
    if (req.user.role === 'MUNICIPAL_DOT') {
      params.push(req.user.municipality_id);
      query += ` WHERE va.municipality_id = $${params.length}`;
    }

    query += ` ORDER BY va.display_order ASC, va.created_at DESC`;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getAllAdvertisements error:', err);
    return res.status(500).json({ message: 'Server error fetching all advertisements.' });
  }
};

// POST /api/advertisements — PROVINCIAL_DOT or MUNICIPAL_DOT
export const createAdvertisement = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      category = 'Eco-Tourism',
      municipalityId,
      ctaText = 'Explore Now',
      ctaLink = '/municipalities',
      badgeLabel = 'Featured Campaign',
      isActive = true,
      displayOrder = 0,
      videoUrl = null,
      thumbnailUrl = null,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Advertisement title is required.' });
    }

    let finalVideoUrl = videoUrl ? videoUrl.trim() : null;
    let finalThumbnailUrl = thumbnailUrl ? thumbnailUrl.trim() : null;

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        finalVideoUrl = req.files.video[0].path;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        finalThumbnailUrl = req.files.thumbnail[0].path;
      }
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ message: 'A video file or valid video URL is required.' });
    }

    // If MUNICIPAL_DOT, enforce assigned municipality
    const munId = req.user.role === 'MUNICIPAL_DOT'
      ? req.user.municipality_id
      : (municipalityId && municipalityId !== '' ? parseInt(municipalityId, 10) : null);

    const active = isActive === 'true' || isActive === true;
    const order = parseInt(displayOrder, 10) || 0;

    const insertQuery = `
      INSERT INTO video_advertisements (
        title, subtitle, description, video_url, thumbnail_url,
        category, municipality_id, cta_text, cta_link, badge_label,
        is_active, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      title.trim(),
      subtitle ? subtitle.trim() : null,
      description ? description.trim() : null,
      finalVideoUrl,
      finalThumbnailUrl,
      category,
      munId,
      ctaText ? ctaText.trim() : 'Explore Now',
      ctaLink ? ctaLink.trim() : '/municipalities',
      badgeLabel ? badgeLabel.trim() : 'Featured Campaign',
      active,
      order,
      req.user.id,
    ];

    const result = await pool.query(insertQuery, values);

    // Audit log
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        `Created Video Advertisement Campaign "${title.trim()}"`,
        'VIDEO_ADVERTISEMENT',
        result.rows[0].id,
        req.ip || null,
      ]
    );

    return res.status(201).json({
      message: 'Video advertisement campaign created successfully!',
      advertisement: result.rows[0],
    });
  } catch (err) {
    console.error('createAdvertisement error:', err);
    return res.status(500).json({ message: 'Server error creating video advertisement.' });
  }
};

// PUT /api/advertisements/:id — PROVINCIAL_DOT or MUNICIPAL_DOT
export const updateAdvertisement = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      title,
      subtitle,
      description,
      category,
      municipalityId,
      ctaText,
      ctaLink,
      badgeLabel,
      isActive,
      displayOrder,
      videoUrl,
      thumbnailUrl,
    } = req.body;

    const existingRes = await pool.query('SELECT * FROM video_advertisements WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Video advertisement not found.' });
    }
    const existing = existingRes.rows[0];

    // Authorization check for MUNICIPAL_DOT
    if (req.user.role === 'MUNICIPAL_DOT' && existing.municipality_id !== req.user.municipality_id) {
      return res.status(403).json({ message: 'Forbidden: You can only edit video advertisements for your assigned municipality.' });
    }

    let finalVideoUrl = videoUrl !== undefined && videoUrl !== '' ? videoUrl.trim() : existing.video_url;
    let finalThumbnailUrl = thumbnailUrl !== undefined && thumbnailUrl !== '' ? thumbnailUrl.trim() : existing.thumbnail_url;

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        finalVideoUrl = req.files.video[0].path;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        finalThumbnailUrl = req.files.thumbnail[0].path;
      }
    }

    let munId = existing.municipality_id;
    if (req.user.role === 'PROVINCIAL_DOT') {
      munId = municipalityId !== undefined ? (municipalityId ? parseInt(municipalityId, 10) : null) : existing.municipality_id;
    }

    const active = isActive !== undefined ? (isActive === 'true' || isActive === true) : existing.is_active;
    const order = displayOrder !== undefined ? parseInt(displayOrder, 10) || 0 : existing.display_order;

    const updateQuery = `
      UPDATE video_advertisements
      SET 
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        description = COALESCE($3, description),
        video_url = $4,
        thumbnail_url = $5,
        category = COALESCE($6, category),
        municipality_id = $7,
        cta_text = COALESCE($8, cta_text),
        cta_link = COALESCE($9, cta_link),
        badge_label = COALESCE($10, badge_label),
        is_active = $11,
        display_order = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      title ? title.trim() : null,
      subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : null,
      description !== undefined ? (description ? description.trim() : null) : null,
      finalVideoUrl,
      finalThumbnailUrl,
      category || null,
      munId,
      ctaText ? ctaText.trim() : null,
      ctaLink ? ctaLink.trim() : null,
      badgeLabel ? badgeLabel.trim() : null,
      active,
      order,
      id,
    ];

    const result = await pool.query(updateQuery, values);

    // Audit log
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        `Updated Video Advertisement Campaign "${result.rows[0].title}"`,
        'VIDEO_ADVERTISEMENT',
        id,
        req.ip || null,
      ]
    );

    return res.status(200).json({
      message: 'Video advertisement updated successfully!',
      advertisement: result.rows[0],
    });
  } catch (err) {
    console.error('updateAdvertisement error:', err);
    return res.status(500).json({ message: 'Server error updating video advertisement.' });
  }
};

// PATCH /api/advertisements/:id/toggle — PROVINCIAL_DOT or MUNICIPAL_DOT
export const toggleAdvertisementStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const existingRes = await pool.query('SELECT * FROM video_advertisements WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }
    const existing = existingRes.rows[0];

    // Authorization check for MUNICIPAL_DOT
    if (req.user.role === 'MUNICIPAL_DOT' && existing.municipality_id !== req.user.municipality_id) {
      return res.status(403).json({ message: 'Forbidden: You can only toggle video advertisements for your assigned municipality.' });
    }

    const result = await pool.query(
      `UPDATE video_advertisements
       SET is_active = NOT is_active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    const updated = result.rows[0];

    // Audit log
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        `Toggled Advertisement "${updated.title}" status to ${updated.is_active ? 'ACTIVE' : 'INACTIVE'}`,
        'VIDEO_ADVERTISEMENT',
        id,
        req.ip || null,
      ]
    );

    return res.status(200).json({
      message: `Advertisement is now ${updated.is_active ? 'Active on tourism portal' : 'Hidden / Draft'}.`,
      advertisement: updated,
    });
  } catch (err) {
    console.error('toggleAdvertisementStatus error:', err);
    return res.status(500).json({ message: 'Server error toggling advertisement status.' });
  }
};

// DELETE /api/advertisements/:id — PROVINCIAL_DOT or MUNICIPAL_DOT
export const deleteAdvertisement = async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await pool.query('SELECT * FROM video_advertisements WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }
    const existing = checkRes.rows[0];

    // Authorization check for MUNICIPAL_DOT
    if (req.user.role === 'MUNICIPAL_DOT' && existing.municipality_id !== req.user.municipality_id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete video advertisements for your assigned municipality.' });
    }

    await pool.query('DELETE FROM video_advertisements WHERE id = $1', [id]);

    // Audit log
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        `Deleted Video Advertisement Campaign "${existing.title}"`,
        'VIDEO_ADVERTISEMENT',
        id,
        req.ip || null,
      ]
    );

    return res.status(200).json({ message: 'Video advertisement deleted successfully.' });
  } catch (err) {
    console.error('deleteAdvertisement error:', err);
    return res.status(500).json({ message: 'Server error deleting video advertisement.' });
  }
};
