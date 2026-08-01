import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      let folder = 'abraventure/general';
      let resource_type = 'image';
      const isVideo = file.mimetype && file.mimetype.startsWith('video/');

      if (file.fieldname === 'profilePicture') folder = 'abraventure/profiles';
      else if (file.fieldname === 'image')     folder = 'abraventure/images';
      else if (file.fieldname === 'video' || isVideo) {
        folder = 'abraventure/videos';
        resource_type = 'video';
      }
      else if (file.fieldname === 'document')  folder = 'abraventure/documents';
      else if (file.fieldname === 'payment')   folder = 'abraventure/payments';

      return {
        folder,
        resource_type,
        allowed_formats: isVideo ? ['mp4', 'webm', 'mov', 'quicktime', 'mkv'] : ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'],
        transformation: isVideo ? [] : [{ quality: 'auto', fetch_format: 'auto' }],
      };
    },
  });
} else {
  // Fallback to local disk storage if Cloudinary credentials are not set
  console.log('[UPLOAD MIDDLEWARE] Cloudinary env vars not found. Falling back to local disk storage in /uploads');
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const baseUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB to allow video clips
});

// Helper wrapper to ensure req.file.path is a web-accessible URL in both Cloudinary and Local Disk mode
const normalizeFilePath = (req) => {
  if (req.file && !isCloudinaryConfigured) {
    // When using local disk storage, req.file.path is the absolute OS filepath.
    // Convert it to relative web path '/uploads/filename.ext'
    req.file.path = `/uploads/${req.file.filename}`;
  }
};

const upload = {
  single: (fieldname) => (req, res, next) => {
    baseUpload.single(fieldname)(req, res, (err) => {
      if (err) {
        console.error(`[UPLOAD ERROR] Field '${fieldname}':`, err);
        return res.status(400).json({ message: err.message || 'File upload failed.' });
      }
      normalizeFilePath(req);
      next();
    });
  },
  array: (fieldname, maxCount) => (req, res, next) => {
    baseUpload.array(fieldname, maxCount)(req, res, (err) => {
      if (err) {
        console.error(`[UPLOAD ERROR] Field '${fieldname}':`, err);
        return res.status(400).json({ message: err.message || 'File upload failed.' });
      }
      if (req.files && !isCloudinaryConfigured) {
        req.files.forEach(f => f.path = `/uploads/${f.filename}`);
      }
      next();
    });
  }
};

export default upload;
