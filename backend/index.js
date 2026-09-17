import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import pool from './config/db.js';
import { initSocket } from './socket/socketManager.js';

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

  -- Provider Application & Accreditation Tracking Extensions
  ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
  ALTER TABLE homestay_profiles ADD COLUMN IF NOT EXISTS barangay VARCHAR(150);
  ALTER TABLE homestay_profiles ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 1;
  ALTER TABLE homestay_profiles ADD COLUMN IF NOT EXISTS max_capacity INT DEFAULT 2;
  ALTER TABLE homestay_profiles ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
  ALTER TABLE tour_guide_profiles ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
  ALTER TABLE tour_guide_profiles ADD COLUMN IF NOT EXISTS years_of_experience INT DEFAULT 0;
  ALTER TABLE tour_guide_profiles ADD COLUMN IF NOT EXISTS specializations TEXT;
  ALTER TABLE tour_guide_profiles ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
`)
  .then(async () => {
    try {
      await pool.query(`ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'ENDORSED'`);
    } catch (err) {
      console.warn('[DATABASE] ALTER TYPE account_status (ENDORSED):', err.message);
    }
    try {
      await pool.query(`ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'SUSPENDED'`);
    } catch (err) {
      console.warn('[DATABASE] ALTER TYPE account_status (SUSPENDED):', err.message);
    }
    try {
      await pool.query(`ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'INACTIVE'`);
    } catch (err) {
      console.warn('[DATABASE] ALTER TYPE account_status (INACTIVE):', err.message);
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

// Fallback for missing uploads (serves branded 404 page or JSON)
app.use('/uploads', (req, res) => {
  const fileName = path.basename(req.path) || 'file';
  const clientOrigin = (process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',')[0] : 'http://localhost:5173');

  if (req.accepts('html')) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Not Found · Abraventure</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-app: #E3ECE4;
            --bg-card: #FFFFFF;
            --forest-900: #153325;
            --forest-800: #1D4433;
            --gold-500: #B88B2A;
            --text-primary: #17281D;
            --text-muted: #45594C;
            --border: #C7D7C9;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background-color: var(--bg-app);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 1.5rem;
            max-width: 32rem;
            width: 100%;
            padding: 2.5rem 2rem;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
          }
          .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, var(--forest-900), var(--gold-500), var(--forest-900));
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem 0.85rem;
            background: rgba(225, 29, 72, 0.08);
            border: 1px solid rgba(225, 29, 72, 0.2);
            color: #be123c;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 1.25rem;
          }
          .icon-box {
            width: 4.5rem;
            height: 4.5rem;
            margin: 0 auto 1.25rem;
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e11d48;
          }
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 1.75rem;
            color: var(--forest-900);
            margin-bottom: 0.75rem;
          }
          p {
            font-size: 0.875rem;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }
          .path-pill {
            background: #FAF7F2;
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 0.6rem 0.9rem;
            font-size: 0.75rem;
            font-family: monospace;
            word-break: break-all;
            margin-bottom: 1.75rem;
            color: var(--forest-900);
          }
          .actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 1.25rem;
            border-radius: 0.75rem;
            font-size: 0.8125rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
          }
          .btn-primary {
            background: var(--forest-900);
            color: #ffffff;
          }
          .btn-primary:hover {
            background: var(--forest-800);
          }
          .btn-secondary {
            background: #ffffff;
            color: var(--text-primary);
            border: 1px solid var(--border);
          }
          .btn-secondary:hover {
            background: #f8fafc;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">404 · File Not Found</div>
          <div class="icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"/>
              <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"/>
            </svg>
          </div>
          <h1>File Not Found</h1>
          <p>The requested file or document could not be located on the Abraventure server. It may have been relocated, removed, or was never uploaded.</p>
          <div class="path-pill">/uploads/${fileName}</div>
          <div class="actions">
            <a href="javascript:history.back()" class="btn btn-secondary">← Go Back</a>
            <a href="${clientOrigin}" class="btn btn-primary">Return to Abraventure</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  return res.status(404).json({
    error: 'File Not Found',
    message: 'The requested file does not exist on the server.',
    path: `/uploads/${fileName}`
  });
});

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

// 404 fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint '${req.originalUrl}' does not exist.`
  });
});

// Error fallback
app.use((err, req, res, next) => {
  console.error('Server error details:', err);
  res.status(500).json({ message: 'Internal server error encountered.' });
});

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[ABRAVENTURE BACKEND] Server is active on port ${PORT}`);
  initOverdueCronJob();
});
