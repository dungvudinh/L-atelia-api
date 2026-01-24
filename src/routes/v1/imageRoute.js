// routes/imageRoutes.js
import express from "express";
import { 
  tempUploadImage,
  deleteTempImages,
  cleanupPendingImages
} from "../../controllers/imageController.js";
import { uploadSingleImage, handleMulterError } from '../../config/b2.js';

const Router = express.Router({mergeParams:true});

Router.post('/temp-upload', uploadSingleImage, handleMulterError, tempUploadImage);
Router.post('/delete-temp', deleteTempImages);
Router.post('/cleanup', cleanupPendingImages);

export default Router;