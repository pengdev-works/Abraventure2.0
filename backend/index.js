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

dotenv.config();

// Run startup database migrations
pool.query(`
  ALTER TABLE municipal_dot_profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  CREATE TABLE IF NOT EXISTS municipality_images (
      id SERIAL PRIMARY KEY,
      municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_featured BOOLEAN DEFAULT false,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`)
  .then(() => console.log('[DATABASE] Verified profile_picture_url on municipal_dot_profiles.'))
  .catch(err => console.error('[DATABASE] Error running startup migration:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded credentials / homestay pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/municipalities', municipalityRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/itineraries', itineraryRoutes);

// General health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ABRAVENTURE API is running.' });
});

// Error fallback handler
app.use((err, req, res, next) => {
  console.error('Server error details:', err);
  res.status(500).json({ message: 'Internal server error encountered.' });
});

app.listen(PORT, () => {
  console.log(`[ABRAVENTURE BACKEND] Server is active on port ${PORT}`);
});
