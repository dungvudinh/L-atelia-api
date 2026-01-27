// routes/b2Routes.js - COMPLETE ROUTES
import express from "express";
import { 
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  listFiles,
  getFileInfo
} from "../../controllers/b2Controller.js";
import { 
  uploadSingleImage,
  uploadMultipleImages 
} from "../../config/b2.js";

const Router = express.Router();

// Single file upload
Router.post('/upload', uploadSingleImage, uploadFile);

// Multiple files upload
Router.post('/upload-multiple', uploadMultipleImages, uploadMultipleFiles);

// Delete file
Router.delete('/files', deleteFile);

// List files
Router.get('/files', listFiles);

// Get file info
Router.get('/files/:key', getFileInfo);

export default Router;