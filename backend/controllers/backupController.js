import pool from '../config/db.js';

// Order of tables to dump and restore (topological order to satisfy foreign keys)
const TABLES_IN_ORDER = [
  'municipalities',
  'municipality_images',
  'user_accounts',
  'municipal_dot_profiles',
  'homestay_profiles',
  'homestay_images',
  'homestay_rooms',
  'tour_guide_profiles',
  'tourist_attractions',
  'municipal_requirements',
  'submitted_documents',
  'bookings_inquiries',
  'itineraries',
  'itinerary_items',
  'approval_logs',
  'events',
  'reviews',
  'notifications',
  'activity_logs',
  'announcements',
  'guide_availability',
  'complaints'
];

// GET /api/backup/export - Export database as JSON
export const exportBackup = async (req, res) => {
  try {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {}
    };

    // Export each table's contents
    for (const table of TABLES_IN_ORDER) {
      const result = await pool.query(`SELECT * FROM ${table}`);
      backupData.data[table] = result.rows;
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="abraventure_backup_${Date.now()}.json"`);
    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('Backup export error:', err);
    return res.status(500).json({ message: 'Server error exporting database backup.' });
  }
};

// POST /api/backup/import - Restore database from JSON
export const importBackup = async (req, res) => {
  const { version, data } = req.body;

  if (!version || !data) {
    return res.status(400).json({ message: 'Invalid backup file format. "version" and "data" are required.' });
  }

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // 1. Truncate all tables cascade to empty the database
    console.log('[BACKUP RESTORE] Truncating tables...');
    // We reverse the order for truncation to be clean, though CASCADE handles it
    const reversedTables = [...TABLES_IN_ORDER].reverse();
    await client.query(`TRUNCATE TABLE ${reversedTables.join(', ')} CASCADE`);

    // 2. Insert records sequentially in topological order
    for (const table of TABLES_IN_ORDER) {
      const rows = data[table];
      if (!rows || rows.length === 0) {
        console.log(`[BACKUP RESTORE] Skipping empty table: ${table}`);
        continue;
      }

      console.log(`[BACKUP RESTORE] Restoring table: ${table} (${rows.length} rows)`);
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const columnNames = columns.join(', ');
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        const insertQuery = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`;
        await client.query(insertQuery, values);
      }
    }

    // Log this backup restore action in the activity logs (since they were cleared, this will be the first action log)
    await client.query(
      `INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'DATABASE_RESTORE', 'SYSTEM', 'BACKUP_FILE', req.ip || 'unknown']
    );

    // Commit transaction
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Database backup restored successfully.' });
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Backup restore error:', err);
    return res.status(500).json({ message: 'Server error restoring database backup. Transaction rolled back.', error: err.message });
  } finally {
    // Release client back to pool
    client.release();
  }
};
