import pool from '../config/db.js';

// Create a new empty itinerary
export const createItinerary = async (req, res) => {
  const touristId = req.user.id;
  const { title, description, startDate, endDate } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Itinerary title is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO itineraries (tourist_id, title, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [touristId, title, description, startDate || null, endDate || null]
    );

    return res.status(201).json({
      message: 'Itinerary created successfully.',
      itinerary: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating itinerary:', err);
    return res.status(500).json({ message: 'Internal server error creating itinerary.' });
  }
};

// Get tourist's itineraries list
export const getMyItineraries = async (req, res) => {
  const touristId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM itineraries WHERE tourist_id = $1 ORDER BY start_date ASC, created_at DESC`,
      [touristId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching itineraries:', err);
    return res.status(500).json({ message: 'Internal server error fetching itineraries.' });
  }
};

// Get single itinerary details with its items
export const getItineraryDetails = async (req, res) => {
  const { id } = req.params;
  const touristId = req.user.id;

  try {
    // Check ownership
    const itinRes = await pool.query('SELECT * FROM itineraries WHERE id = $1 AND tourist_id = $2', [id, touristId]);
    if (itinRes.rows.length === 0) {
      return res.status(404).json({ message: 'Itinerary not found or access denied.' });
    }

    const itinerary = itinRes.rows[0];

    // Fetch items with target details (Attraction, Homestay, Guide)
    const itemsRes = await pool.query(
      `SELECT ii.*,
              ta.name as attraction_name, ta.category as attraction_category, ta.image_url as attraction_image,
              ta.location_details as attraction_location,
              hp.name as homestay_name, hp.address as homestay_address,
              tg_u.full_name as guide_name, tg.profile_picture_url as guide_image
       FROM itinerary_items ii
       LEFT JOIN tourist_attractions ta ON ii.attraction_id = ta.id
       LEFT JOIN homestay_profiles hp ON ii.homestay_id = hp.id
       LEFT JOIN tour_guide_profiles tg ON ii.guide_id = tg.id
       LEFT JOIN user_accounts tg_u ON tg.guide_id = tg_u.id
       WHERE ii.itinerary_id = $1
       ORDER BY ii.day_number ASC, ii.time_slot ASC, ii.sequence_order ASC`,
      [id]
    );

    return res.status(200).json({
      itinerary,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching itinerary details:', err);
    return res.status(500).json({ message: 'Internal server error fetching itinerary details.' });
  }
};

// Add item to itinerary
export const addItineraryItem = async (req, res) => {
  const { itineraryId, dayNumber, timeSlot, activityType, attractionId, homestayId, guideId, customActivityName, notes, sequenceOrder } = req.body;
  const touristId = req.user.id;

  if (!itineraryId || !dayNumber || !activityType) {
    return res.status(400).json({ message: 'Itinerary ID, day number, and activity type are required.' });
  }

  try {
    // Verify ownership
    const itinCheck = await pool.query('SELECT * FROM itineraries WHERE id = $1 AND tourist_id = $2', [itineraryId, touristId]);
    if (itinCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden. You do not own this itinerary.' });
    }

    // Determine sequence order if not provided
    let seq = sequenceOrder;
    if (seq === undefined || seq === null) {
      const maxSeq = await pool.query(
        'SELECT COALESCE(MAX(sequence_order), 0) as max_seq FROM itinerary_items WHERE itinerary_id = $1 AND day_number = $2',
        [itineraryId, parseInt(dayNumber)]
      );
      seq = maxSeq.rows[0].max_seq + 1;
    }

    const result = await pool.query(
      `INSERT INTO itinerary_items 
        (itinerary_id, day_number, time_slot, activity_type, attraction_id, homestay_id, guide_id, custom_activity_name, notes, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        itineraryId,
        parseInt(dayNumber),
        timeSlot || null,
        activityType, // 'ATTRACTION', 'HOMESTAY', 'GUIDE', 'CUSTOM'
        attractionId || null,
        homestayId || null,
        guideId || null,
        customActivityName || null,
        notes || '',
        seq
      ]
    );

    return res.status(201).json({
      message: 'Itinerary item added successfully.',
      item: result.rows[0],
    });
  } catch (err) {
    console.error('Error adding itinerary item:', err);
    return res.status(500).json({ message: 'Internal server error adding itinerary item.' });
  }
};

// Edit itinerary item details
export const updateItineraryItem = async (req, res) => {
  const { id } = req.params;
  const touristId = req.user.id;
  const { dayNumber, timeSlot, notes, sequenceOrder, customActivityName } = req.body;

  try {
    // Verify ownership of the itinerary this item belongs to
    const checkRes = await pool.query(
      `SELECT ii.* FROM itinerary_items ii
       JOIN itineraries i ON ii.itinerary_id = i.id
       WHERE ii.id = $1 AND i.tourist_id = $2`,
      [id, touristId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden or item not found.' });
    }

    const currentItem = checkRes.rows[0];

    const result = await pool.query(
      `UPDATE itinerary_items
       SET day_number = $1, time_slot = $2, notes = $3, sequence_order = $4, custom_activity_name = $5
       WHERE id = $6 RETURNING *`,
      [
        dayNumber !== undefined ? parseInt(dayNumber) : currentItem.day_number,
        timeSlot !== undefined ? timeSlot : currentItem.time_slot,
        notes !== undefined ? notes : currentItem.notes,
        sequenceOrder !== undefined ? parseInt(sequenceOrder) : currentItem.sequence_order,
        customActivityName !== undefined ? customActivityName : currentItem.custom_activity_name,
        id
      ]
    );

    return res.status(200).json({
      message: 'Itinerary item updated successfully.',
      item: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating itinerary item:', err);
    return res.status(500).json({ message: 'Internal server error updating itinerary item.' });
  }
};

// Delete itinerary item
export const deleteItineraryItem = async (req, res) => {
  const { id } = req.params;
  const touristId = req.user.id;

  try {
    const checkRes = await pool.query(
      `SELECT ii.* FROM itinerary_items ii
       JOIN itineraries i ON ii.itinerary_id = i.id
       WHERE ii.id = $1 AND i.tourist_id = $2`,
      [id, touristId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden or item not found.' });
    }

    await pool.query('DELETE FROM itinerary_items WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Itinerary item deleted successfully.' });
  } catch (err) {
    console.error('Error deleting itinerary item:', err);
    return res.status(500).json({ message: 'Internal server error deleting itinerary item.' });
  }
};

// Delete entire itinerary
export const deleteItinerary = async (req, res) => {
  const { id } = req.params;
  const touristId = req.user.id;

  try {
    const checkRes = await pool.query('SELECT * FROM itineraries WHERE id = $1 AND tourist_id = $2', [id, touristId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Itinerary not found or access denied.' });
    }

    await pool.query('DELETE FROM itineraries WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Itinerary deleted successfully.' });
  } catch (err) {
    console.error('Error deleting itinerary:', err);
    return res.status(500).json({ message: 'Internal server error deleting itinerary.' });
  }
};
