// import express from 'express';
// import {
//   createMedia,
//   getMedia,
//   getMediaById,
//   updateMedia,
//   remove,
//   bulkDeleteMedia,
//   uploadFeaturedImage,
//   deleteFeaturedImage
// } from '../../controllers/mediaController.js';
// import { uploadMediaSingle, handleMulterError } from '../../config/multer.js';

// const router = express.Router();

// // Route upload ảnh đại diện
// router.post('/upload-featured-image', uploadMediaSingle, handleMulterError, uploadFeaturedImage);

// // SỬA: Xóa parameter :filename? vì controller chỉ nhận qua body
// router.delete('/delete-featured-image', deleteFeaturedImage);

// // Các route hiện có
// router.route('/')
//   .post(createMedia)
//   .get(getMedia);

// router.route('/bulk-delete')
//   .post(bulkDeleteMedia);

// router.route('/:id')
//   .get(getMediaById)
//   .put(updateMedia)
//   .delete(remove);

// export default router;
import express from 'express';
import {
  createMedia,
  getMedia,
  getMediaById,
  updateMedia,
  remove,
  bulkDeleteMedia,
  uploadFeaturedImage,
  deleteFeaturedImage
} from '../../controllers/mediaController.js';
import { uploadMediaSingle, handleMulterError } from '../../config/b2.js'; // Sử dụng từ b2.js

const router = express.Router();

// Route upload ảnh đại diện - sử dụng B2 storage
router.post('/upload-featured-image', uploadMediaSingle, handleMulterError, uploadFeaturedImage);

// Route xóa ảnh đại diện
router.delete('/delete-featured-image', deleteFeaturedImage);

// Các route hiện có
router.route('/')
  .post(uploadMediaSingle, handleMulterError, createMedia) // Thêm upload middleware cho create
  .get(getMedia);

router.route('/bulk-delete')
  .post(bulkDeleteMedia);

router.route('/:id')
  .get(getMediaById)
  .put(updateMedia) // Thêm upload middleware cho update
  .delete(remove);

export default router;