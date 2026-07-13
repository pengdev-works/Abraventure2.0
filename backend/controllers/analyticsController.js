import pool from '../config/db.js';

// GET /api/analytics/overview — PROVINCIAL_DOT
export const getOverview = async (req, res) => {
  try {
    // Monthly bookings for current year
    const monthlyBookings = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        EXTRACT(MONTH FROM created_at) AS month_num,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled
      FROM bookings_inquiries
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      GROUP BY DATE_TRUNC('month', created_at), EXTRACT(MONTH FROM created_at)
      ORDER BY month_num
    `);

    // Top municipalities by bookings
    const topMunicipalities = await pool.query(`
      SELECT 
        m.name AS municipality,
        COUNT(bi.id) AS bookings
      FROM bookings_inquiries bi
      JOIN homestay_profiles hp ON bi.homestay_id = hp.id
      JOIN user_accounts ua ON hp.owner_id = ua.id
      JOIN municipalities m ON ua.municipality_id = m.id
      WHERE bi.homestay_id IS NOT NULL
      GROUP BY m.name
      ORDER BY bookings DESC
      LIMIT 10
    `);

    // Homestay counts
    const homestayStats = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending
      FROM homestay_profiles
    `);

    // Guide counts
    const guideStats = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending
      FROM tour_guide_profiles
    `);

    // Attraction counts per municipality
    const attractionsByMun = await pool.query(`
      SELECT m.name AS municipality, COUNT(ta.id) AS attractions
      FROM tourist_attractions ta
      JOIN municipalities m ON ta.municipality_id = m.id
      GROUP BY m.name
      ORDER BY attractions DESC
      LIMIT 10
    `);

    // Booking status distribution
    const statusDist = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM bookings_inquiries
      GROUP BY status
    `);

    // Total tourist accounts
    const touristCount = await pool.query(`
      SELECT COUNT(*) FROM user_accounts WHERE role='TOURIST' AND status='APPROVED'
    `);

    // Recent activity logs
    const recentLogs = await pool.query(`
      SELECT al.*, ua.full_name AS actor_name, ua.role AS actor_role
      FROM activity_logs al
      LEFT JOIN user_accounts ua ON al.user_id = ua.id
      ORDER BY al.created_at DESC
      LIMIT 50
    `);

    res.json({
      monthlyBookings: monthlyBookings.rows,
      topMunicipalities: topMunicipalities.rows,
      homestayStats: homestayStats.rows[0],
      guideStats: guideStats.rows[0],
      attractionsByMun: attractionsByMun.rows,
      statusDist: statusDist.rows,
      touristCount: parseInt(touristCount.rows[0].count),
      recentLogs: recentLogs.rows,
    });
  } catch (err) {
    console.error('getOverview error:', err);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

// GET /api/analytics/municipal — MUNICIPAL_DOT scoped
export const getMunicipalAnalytics = async (req, res) => {
  const municipalityId = req.user.municipality_id;
  try {
    // Monthly bookings for this municipality's homestays
    const monthlyBookings = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', bi.created_at), 'Mon') AS month,
        EXTRACT(MONTH FROM bi.created_at) AS month_num,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE bi.status = 'CONFIRMED') AS confirmed
      FROM bookings_inquiries bi
      JOIN homestay_profiles hp ON bi.homestay_id = hp.id
      JOIN user_accounts ua ON hp.owner_id = ua.id
      WHERE ua.municipality_id = $1
        AND EXTRACT(YEAR FROM bi.created_at) = EXTRACT(YEAR FROM NOW())
      GROUP BY DATE_TRUNC('month', bi.created_at), EXTRACT(MONTH FROM bi.created_at)
      ORDER BY month_num
    `, [municipalityId]);

    // Attractions count
    const attractionCount = await pool.query(
      `SELECT COUNT(*) FROM tourist_attractions WHERE municipality_id = $1`, [municipalityId]
    );

    // Homestay occupancy: rooms booked vs total
    const homestayOccupancy = await pool.query(`
      SELECT 
        hp.name AS homestay,
        COUNT(DISTINCT bi.id) AS bookings
      FROM homestay_profiles hp
      JOIN user_accounts ua ON hp.owner_id = ua.id
      LEFT JOIN bookings_inquiries bi ON bi.homestay_id = hp.id AND bi.status = 'CONFIRMED'
      WHERE ua.municipality_id = $1
      GROUP BY hp.name
    `, [municipalityId]);

    res.json({
      monthlyBookings: monthlyBookings.rows,
      attractionCount: parseInt(attractionCount.rows[0].count),
      homestayOccupancy: homestayOccupancy.rows,
    });
  } catch (err) {
    console.error('getMunicipalAnalytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/analytics/export — export all bookings as JSON (frontend converts to CSV/PDF)
export const exportData = async (req, res) => {
  try {
    const bookings = await pool.query(`
      SELECT 
        bi.id, bi.status, bi.start_date, bi.end_date, bi.number_of_guests,
        bi.created_at, bi.total_amount,
        ua.full_name AS tourist_name, ua.email AS tourist_email,
        hp.name AS homestay_name,
        m.name AS municipality
      FROM bookings_inquiries bi
      LEFT JOIN user_accounts ua ON bi.tourist_id = ua.id
      LEFT JOIN homestay_profiles hp ON bi.homestay_id = hp.id
      LEFT JOIN user_accounts owner ON hp.owner_id = owner.id
      LEFT JOIN municipalities m ON owner.municipality_id = m.id
      ORDER BY bi.created_at DESC
    `);
    res.json(bookings.rows);
  } catch (err) {
    console.error('exportData error:', err);
    res.status(500).json({ message: 'Server error exporting data.' });
  }
};
