import express from 'express';
import { 
  getMunicipalities, 
  getMunicipalityDetails, 
  addAttraction, 
  updateAttraction, 
  deleteAttraction,
  updateMunicipalityProfile,
  addMunicipalityImage,
  deleteMunicipalityImage
} from '../controllers/municipalityController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getMunicipalities);
router.get('/:id', getMunicipalityDetails);

router.post('/attractions', verifyToken, requireRoles(['MUNICIPAL_DOT']), addAttraction);
router.put('/attractions/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), updateAttraction);
router.delete('/attractions/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), deleteAttraction);

// Municipality Profile & Cover Images Customization
router.put('/profile', verifyToken, requireRoles(['MUNICIPAL_DOT']), updateMunicipalityProfile);
router.post('/images', verifyToken, requireRoles(['MUNICIPAL_DOT']), upload.single('image'), addMunicipalityImage);
router.delete('/images/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), deleteMunicipalityImage);

export default router;
