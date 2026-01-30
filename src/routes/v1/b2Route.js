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
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 50, // 50 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều request upload, vui lòng thử lại sau 15 phút'
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false
});

const uploadSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 10, // Sau 10 request thì bắt đầu làm chậm
  delayMs: 500, // Thêm 500ms delay mỗi request
  maxDelayMs: 5000 // Tối đa 5 giây delay
});
const Router = express.Router();

// Single file upload
Router.post('/upload', uploadLimiter, uploadSlowDown, uploadSingleImage, uploadFile);

// Multiple files upload
Router.post('/upload-multiple', uploadLimiter, uploadSlowDown, uploadMultipleImages, uploadMultipleFiles);

// Delete file
Router.delete('/files', deleteFile);

// List files
Router.get('/files', listFiles);

// Get file info
Router.get('/files/:key', getFileInfo);

export default Router;