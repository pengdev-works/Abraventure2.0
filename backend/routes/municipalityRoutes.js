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
  getMapData,
  getMunicipalityFoods,
  addMunicipalityFood,
  updateMunicipalityFood,
  deleteMunicipalityFood
} from '../controllers/municipalityController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getMunicipalities);
router.get('/map/data', getMapData);
router.get('/foods', getMunicipalityFoods);
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

// Local Food & Delicacies Management
router.post('/foods', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('image'), addMunicipalityFood);
router.put('/foods/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('image'), updateMunicipalityFood);
router.delete('/foods/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), deleteMunicipalityFood);

export default router;
