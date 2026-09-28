import pool from '../config/db.js';

// Create the homestay_room_images table
await pool.query(`
  CREATE TABLE IF NOT EXISTS homestay_room_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES homestay_rooms(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    sort_order INT DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('homestay_room_images table created/verified.');
process.exit(0);
