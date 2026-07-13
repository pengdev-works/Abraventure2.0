import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import municipalityRoutes from './routes/municipalityRoutes.js';
import requirementRoutes from './routes/requirementRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import backupRoutes from './routes/backupRoutes.js';

dotenv.config();

// ─── Startup Database Migrations ──────────────────────────────────────────────
pool.query(`
  -- Legacy: profile picture on municipal DOT
  ALTER TABLE municipal_dot_profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

  -- Legacy: municipality images
  CREATE TABLE IF NOT EXISTS municipality_images (
    id SERIAL PRIMARY KEY,
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Events & Festivals
  CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Festival',
    image_url TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    venue TEXT,
    created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Reviews & Ratings
  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE CASCADE,
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- In-App Notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Activity / Audit Logs
  CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Announcements (Provincial)
  CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Guide Availability
  CREATE TABLE IF NOT EXISTS guide_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    UNIQUE(guide_id, available_date)
  );

  -- Booking: payment proof + total amount
  ALTER TABLE bookings_inquiries ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
  ALTER TABLE bookings_inquiries ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

  -- Tourist Complaints & Feedback
  CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    resolution_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES user_accounts(id)
  );
`)
  .then(() => console.log('[DATABASE] All migrations verified successfully.'))
  .catch(err => console.error('[DATABASE] Migration error:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/municipalities', municipalityRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/backup', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ABRAVENTURE API is running.' });
});

// Error fallback
app.use((err, req, res, next) => {
  console.error('Server error details:', err);
  res.status(500).json({ message: 'Internal server error encountered.' });
});

app.listen(PORT, () => {
  console.log(`[ABRAVENTURE BACKEND] Server is active on port ${PORT}`);
});
