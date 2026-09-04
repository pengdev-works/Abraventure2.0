import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Strict extension & MIME whitelist
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.pdf', '.mp4', '.webm', '.mov', '.mkv']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'
]);

const DANGEROUS_EXTENSIONS = /\.(exe|bat|cmd|sh|php|pl|cgi|js|vbs|html|htm|asp|aspx|jsp|svg|jar|py)$/i;

const secureFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Reject double extension tricks or path traversal attempts
  if (DANGEROUS_EXTENSIONS.test(file.originalname) || file.originalname.includes('..')) {
    return cb(new Error('Security error: Executable or prohibited file types are strictly rejected.'), false);
  }

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`Invalid file type (${ext}). Only images, PDFs, and standard videos are permitted.`), false);
  }

  cb(null, true);
};

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
        allowed_formats: isVideo ? ['mp4', 'webm', 'mov', 'quicktime', 'mkv'] : ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'pdf'],
        transformation: isVideo ? [] : [{ quality: 'auto', fetch_format: 'auto' }],
      };
    },
  });
} else {
  // Fallback to secure local disk storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const randomName = crypto.randomBytes(16).toString('hex');
      cb(null, `${file.fieldname}-${randomName}${ext}`);
    }
  });
}

const baseUpload = multer({
  storage,
  fileFilter: secureFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max limit for videos
});

const normalizeFilePath = (req) => {
  if (req.file && !isCloudinaryConfigured) {
    req.file.path = `/uploads/${req.file.filename}`;
  }
};

const upload = {
  single: (fieldname) => (req, res, next) => {
    baseUpload.single(fieldname)(req, res, (err) => {
      if (err) {
        console.error(`[SECURE UPLOAD ERROR] Field '${fieldname}':`, err.message);
        return res.status(400).json({ message: err.message || 'File upload failed validation.' });
      }
      normalizeFilePath(req);
      next();
    });
  },
  array: (fieldname, maxCount) => (req, res, next) => {
    baseUpload.array(fieldname, maxCount)(req, res, (err) => {
      if (err) {
        console.error(`[SECURE UPLOAD ERROR] Field '${fieldname}':`, err.message);
        return res.status(400).json({ message: err.message || 'File upload failed validation.' });
      }
      if (req.files && !isCloudinaryConfigured) {
        req.files.forEach(f => f.path = `/uploads/${f.filename}`);
      }
      next();
    });
  }
};

export default upload;
