// controllers/imageController.js
import { StatusCodes } from "http-status-codes";
import { PendingImage } from '../models/pendingImageModel.js';
import { deleteMultipleFromB2 } from '../config/b2.js';
import { b2UploadService } from "../config/b2.js";
// Tạo uploadSingleImage config
import multer from 'multer';

const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 
      'image/gif', 'image/webp', 'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  }
}).single('file');

export const tempUploadImage = async (req, res, next) => {
  try {
    const { field, tempId, projectId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload lên B2
    // const b2UploadService = req.app.get('b2UploadService');
    const fileName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.originalname}`;
    const folder = `temp/${field}`;
    
    const uploadResult = await b2UploadService.uploadToB2(
      file.buffer,
      fileName,
      folder,
      {
        contentType: file.mimetype,
        skipOptimization: file.mimetype === 'application/pdf'
      }
    );

    // Lưu vào pending images collection
    const pendingImage = await PendingImage.create({
      url: uploadResult.url,
      key: uploadResult.key,
      field,
      tempId,
      projectId: projectId || null,
      status: 'pending',
      uploaded_at: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image uploaded temporarily',
      data: pendingImage
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTempImages = async (req, res, next) => {
  try {
    const { tempIds } = req.body;
    
    if (!tempIds || !Array.isArray(tempIds)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'tempIds array is required'
      });
    }

    // Lấy thông tin pending images
    const pendingImages = await PendingImage.find({ 
      tempId: { $in: tempIds },
      status: 'pending'
    });

    if (pendingImages.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'No temporary images found to delete'
      });
    }

    // Xóa từ B2
    const keysToDelete = pendingImages.map(img => img.key).filter(key => key);
    if (keysToDelete.length > 0) {
      await deleteMultipleFromB2(keysToDelete);
    }

    // Xóa từ database
    await PendingImage.deleteMany({ 
      tempId: { $in: tempIds },
      status: 'pending'
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Deleted ${pendingImages.length} temporary images`,
      deletedCount: pendingImages.length
    });
  } catch (err) {
    next(err);
  }
};

export const cleanupPendingImages = async (req, res, next) => {
  try {
    // Lấy tất cả pending images đã expired
    const expiredImages = await PendingImage.find({
      status: 'pending',
      expiresAt: { $lt: new Date() }
    });

    let deletedCount = 0;
    
    if (expiredImages.length > 0) {
      // Xóa từ B2
      const keysToDelete = expiredImages.map(img => img.key).filter(key => key);
      if (keysToDelete.length > 0) {
        await deleteMultipleFromB2(keysToDelete);
      }
      
      // Xóa từ database
      const result = await PendingImage.deleteMany({
        _id: { $in: expiredImages.map(img => img._id) }
      });
      
      deletedCount = result.deletedCount;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Cleaned up ${deletedCount} expired pending images`,
      deletedCount
    });
  } catch (err) {
    next(err);
  }
};

// Hàm để cron job gọi
export const cleanupPendingImagesCron = async () => {
  try {
    const expiredImages = await PendingImage.find({
      status: 'pending',
      expiresAt: { $lt: new Date() }
    });

    if (expiredImages.length > 0) {
      const keysToDelete = expiredImages.map(img => img.key).filter(key => key);
      if (keysToDelete.length > 0) {
        await deleteMultipleFromB2(keysToDelete);
      }
      
      await PendingImage.deleteMany({
        _id: { $in: expiredImages.map(img => img._id) }
      });
      
      console.log(`[Cron] Cleaned up ${expiredImages.length} expired pending images`);
    }
  } catch (error) {
    console.error('[Cron] Error cleaning up pending images:', error);
  }
};