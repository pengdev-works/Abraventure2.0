import pool from '../config/db.js';
const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'homestay_room_images'");
console.log(r.rows.length > 0 ? 'TABLE_EXISTS' : 'TABLE_NOT_FOUND');
process.exit(0);
