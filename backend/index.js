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
import packageRoutes from './routes/packageRoutes.js';
import advertisementRoutes from './routes/advertisementRoutes.js';
import { initOverdueCronJob, checkOverdueAssetsAndNotify } from './jobs/overdueAssetsCron.js';
import { setSecurityHeaders, sanitizeInput, globalApiRateLimiter } from './middleware/securityMiddleware.js';

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

  -- Tourist Attractions Video Column
  ALTER TABLE tourist_attractions ADD COLUMN IF NOT EXISTS video_url TEXT;

  -- Notifications Link Column (Deep Linking)
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255);

  -- Homepage Hero Banner & Video Settings (Provincial DOT Managed)
  CREATE TABLE IF NOT EXISTS homepage_hero (
    id SERIAL PRIMARY KEY,
    badge_text VARCHAR(255) DEFAULT 'Province of Abra · Cordillera Administrative Region',
    title VARCHAR(255) DEFAULT 'Explore the Heart of Cordillera Abra',
    subtitle TEXT DEFAULT 'From Kaparkan''s limestone terraces to Itneg heritage weaving villages — discover verified homestays, accredited local guides, and hidden gems across all 27 municipalities.',
    video_url TEXT,
    background_image_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES user_accounts(id)
  );

  -- Initial Hero Seed if table is empty
  INSERT INTO homepage_hero (badge_text, title, subtitle)
  SELECT 'Province of Abra · Cordillera Administrative Region', 'Explore the Heart of Cordillera Abra', 'From Kaparkan''s limestone terraces to Itneg heritage weaving villages — discover verified homestays, accredited local guides, and hidden gems across all 27 municipalities.'
  WHERE NOT EXISTS (SELECT 1 FROM homepage_hero);

  -- Municipal Tour Packages & Package Items
  CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INT DEFAULT 1,
    image_url TEXT,
    inclusions TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    time_slot TIME,
    activity_type activity_type NOT NULL,
    attraction_id UUID REFERENCES tourist_attractions(id) ON DELETE SET NULL,
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE SET NULL,
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE SET NULL,
    custom_activity_name VARCHAR(255),
    notes TEXT,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Provincial Video Advertisements (Promotional Campaigns)
  CREATE TABLE IF NOT EXISTS video_advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(100) DEFAULT 'Eco-Tourism',
    municipality_id INT REFERENCES municipalities(id) ON DELETE SET NULL,
    cta_text VARCHAR(100) DEFAULT 'Explore Now',
    cta_link VARCHAR(255) DEFAULT '/municipalities',
    badge_label VARCHAR(100) DEFAULT 'Featured Campaign',
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Initial Seed for Video Advertisements
  INSERT INTO video_advertisements (title, subtitle, description, video_url, thumbnail_url, category, cta_text, cta_link, badge_label, is_active, display_order)
  SELECT 
    'Discover Kaparkan: The Emerald Terraces of Tineg',
    'Travertine waterfalls deep in the Cordillera forest',
    'Experience the untouched natural majesty of Kaparkan Falls in Tineg, Abra. Journey through emerald cascades, natural spring pools, and pristine river gorges accompanied by accredited local mountain guides.',
    'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
    '/uploads/images (4).jpg',
    'Eco-Tourism & Waterfalls',
    'Explore Kaparkan Falls',
    '/municipalities',
    'Official Provincial DOT Spotlight',
    true,
    1
  WHERE NOT EXISTS (SELECT 1 FROM video_advertisements);

  INSERT INTO video_advertisements (title, subtitle, description, video_url, thumbnail_url, category, cta_text, cta_link, badge_label, is_active, display_order)
  SELECT 
    'Heritage & Hands: The Living Traditions of Tayum & Peñarrubia',
    'Ancestral Tingguian indigo weaving and Spanish Baroque architecture',
    'Witness centuries-old natural dyeing, intricate loom weaving, and timeless heritage churches across the heartland of Abra. Connect with authentic artisans keeping indigenous Cordilleran culture alive.',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-potter-working-with-clay-41718-large.mp4',
    '/uploads/images (5).jpg',
    'Cultural Heritage & Crafts',
    'Discover Heritage Towns',
    '/municipalities',
    'Provincial Cultural Campaign',
    true,
    2
  WHERE (SELECT COUNT(*) FROM video_advertisements) < 2;
`)
  .then(async () => {
    try {
      await pool.query(`ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'ENDORSED'`);
    } catch (err) {
      console.warn('[DATABASE] ALTER TYPE account_status warning (might already exist or transaction restriction):', err.message);
    }
    console.log('[DATABASE] All migrations verified successfully.');
  })
  .catch(err => console.error('[DATABASE] Migration error:', err.message || err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware & Security ───────────────────────────────────────────────────
app.use(setSecurityHeaders);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) or matched origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback with header control
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use('/api', globalApiRateLimiter({ maxRequests: 2000, windowMs: 15 * 60 * 1000 }));

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
app.use('/api/packages', packageRoutes);
app.use('/api/advertisements', advertisementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ABRAVENTURE API is running.' });
});

// Manual CRON Trigger Endpoint for Nightly Overdue Asset Notifications
app.post('/api/notifications/trigger-cron', async (req, res) => {
  const result = await checkOverdueAssetsAndNotify();
  res.status(result.success ? 200 : 500).json(result);
});

// Error fallback
app.use((err, req, res, next) => {
  console.error('Server error details:', err);
  res.status(500).json({ message: 'Internal server error encountered.' });
});

app.listen(PORT, () => {
  console.log(`[ABRAVENTURE BACKEND] Server is active on port ${PORT}`);
  initOverdueCronJob();
});
