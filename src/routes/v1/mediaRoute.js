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
import { uploadMediaSingle, handleMulterError } from '../../config/multer.js';

const router = express.Router();

// Route upload ảnh đại diện
router.post('/upload-featured-image', uploadMediaSingle, handleMulterError, uploadFeaturedImage);
router.delete('/delete-featured-image/:filename', deleteFeaturedImage);

// Các route hiện có
router.route('/')
  .post(createMedia)
  .get(getMedia);

router.route('/bulk-delete')
  .post(bulkDeleteMedia);

router.route('/:id')
  .get(getMediaById)
  .put(updateMedia)
  .delete(remove);

export default router;