
import express from 'express';
import {
  getAllRentals,
  getRentalById,
  createRental,
  updateRental,
  deleteRental,
  uploadRentalImages,
  deleteRentalImage,
  setFeaturedImage,
  updateRentalStatus,
  toggleFeatured
} from '../../controllers/rentController.js';
import{   // Import amenity controllers
  getAllAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity
} from '../../controllers/amenityController.js'; // Import amenity controllers
import { uploadRentArray, handleMulterError } from '../../config/b2.js'; // Sử dụng từ b2.js

const router = express.Router();

// === Amenity routes (đặt trước) ===
router.get('/amenities', getAllAmenities);
router.get('/amenities/:id', getAmenityById);
router.post('/amenities', createAmenity);
router.put('/amenities/:id', updateAmenity);
router.delete('/amenities/:id', deleteAmenity);

// === Rental routes ===
router.get('/', getAllRentals);
router.get('/:id', getRentalById);
router.post('/', createRental);
router.put('/:id', updateRental);
router.delete('/:id', deleteRental);
router.post('/:id/upload', uploadRentArray, handleMulterError, uploadRentalImages);
router.delete('/:id/images/:imageId', deleteRentalImage);
router.put('/:id/featured-image', setFeaturedImage);
router.patch('/:id/status', updateRentalStatus);
router.patch('/:id/featured', toggleFeatured);
export default router;