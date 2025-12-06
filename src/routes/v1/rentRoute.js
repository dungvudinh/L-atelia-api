// import express from 'express';
// import {
//   getAllRentals,
//   getRentalById,
//   createRental,
//   updateRental,
//   deleteRental,
//   uploadRentalImages,
//   deleteRentalImage,
//   setFeaturedImage,
//   updateRentalStatus,
//   toggleFeatured
// } from '../../controllers/rentController.js';
// import { uploadRentArray, handleMulterError } from '../../config/multer.js';

// const router = express.Router();

// // GET ALL RENTALS
// router.get('/', getAllRentals);

// // GET RENTAL BY ID
// router.get('/:id', getRentalById);

// // CREATE NEW RENTAL
// router.post('/', createRental);

// // UPDATE RENTAL
// router.put('/:id', updateRental);

// // DELETE RENTAL
// router.delete('/:id', deleteRental);

// // UPLOAD RENTAL IMAGES
// router.post('/:id/upload', uploadRentArray, handleMulterError, uploadRentalImages);

// // DELETE RENTAL IMAGE
// router.delete('/:id/images/:imageId', deleteRentalImage);

// // SET FEATURED IMAGE
// router.put('/:id/featured-image', setFeaturedImage);

// // UPDATE RENTAL STATUS
// router.patch('/:id/status', updateRentalStatus);

// // TOGGLE FEATURED
// router.patch('/:id/featured', toggleFeatured);


// export default router;
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
import { uploadRentArray, handleMulterError } from '../../config/b2.js'; // Sử dụng từ b2.js

const router = express.Router();

// GET ALL RENTALS
router.get('/', getAllRentals);

// GET RENTAL BY ID
router.get('/:id', getRentalById);

// CREATE NEW RENTAL - thêm upload middleware
router.post('/', uploadRentArray, handleMulterError, createRental);

// UPDATE RENTAL - thêm upload middleware
router.put('/:id', uploadRentArray, handleMulterError, updateRental);

// DELETE RENTAL
router.delete('/:id', deleteRental);

// UPLOAD RENTAL IMAGES
router.post('/:id/upload', uploadRentArray, handleMulterError, uploadRentalImages);

// DELETE RENTAL IMAGE
router.delete('/:id/images/:imageId', deleteRentalImage);

// SET FEATURED IMAGE
router.put('/:id/featured-image', setFeaturedImage);

// UPDATE RENTAL STATUS
router.patch('/:id/status', updateRentalStatus);

// TOGGLE FEATURED
router.patch('/:id/featured', toggleFeatured);

export default router;