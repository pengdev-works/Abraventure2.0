import express from 'express';
import { 
  getMunicipalities, 
  getMunicipalityDetails, 
  addAttraction, 
  updateAttraction, 
  deleteAttraction,
  updateMunicipalityProfile,
  addMunicipalityImage,
  deleteMunicipalityImage,
  getMapData
} from '../controllers/municipalityController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getMunicipalities);
router.get('/map/data', getMapData);
router.get('/:id', getMunicipalityDetails);

router.post(
  '/attractions',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  addAttraction
);
router.put(
  '/attractions/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  updateAttraction
);
router.delete('/attractions/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), deleteAttraction);

// Municipality Profile & Cover Images Customization
router.put('/profile', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), updateMunicipalityProfile);
router.post('/images', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('image'), addMunicipalityImage);
router.delete('/images/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), deleteMunicipalityImage);

export default router;
