import mediaService from '../services/mediaService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload featured image
// @route   POST /api/media/upload-featured-image
export const uploadFeaturedImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Tạo đường dẫn tương đối để lưu trong database
    const relativePath = `/uploads/media/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        path: relativePath,
        fullUrl: `${req.protocol}://${req.get('host')}${relativePath}`
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error in uploadFeaturedImage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete featured image
// @route   DELETE /api/media/delete-featured-image/:filename
export const deleteFeaturedImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = path.join(__dirname, '../uploads/media');
    const filePath = path.join(uploadsDir, filename);

    // Kiểm tra file có tồn tại không
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

  } catch (error) {
    console.error('Error in deleteFeaturedImage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new media
// @route   POST /api/media
export const createMedia = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Gọi service để tạo media
    const newMedia = await mediaService.createMediaService({
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage, // Đây sẽ là đường dẫn file
      tags
    });
    
    res.status(201).json({
      success: true,
      data: newMedia,
      message: 'Media created successfully'
    });

  } catch (error) {
    console.error('Error in createMedia:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all media with pagination and filtering
// @route   GET /api/media
export const getMedia = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search
    } = req.query;

    // Gọi service để lấy media
    const result = await mediaService.getMediaService({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      category,
      search
    });
    console.log(result)
    res.json({
      success: true,
      data: result.media,
      pagination: {
        current: result.currentPage,
        pages: result.totalPages,
        total: result.total
      }
    });

  } catch (error) {
    console.error('Error in getMedia:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single media by ID
// @route   GET /api/media/:id
export const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    // Gọi service để lấy media theo ID
    const media = await mediaService.getMediaByIdService(id);

    res.json({
      success: true,
      data: media
    });

  } catch (error) {
    console.error('Error in getMediaById:', error);
    
    if (error.message === 'Media not found') {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update media
// @route   PUT /api/media/:id
export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    } = req.body;

    // Gọi service để cập nhật media
    const updatedMedia = await mediaService.updateMediaService(id, {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    });
    
    res.json({
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully'
    });

  } catch (error) {
    console.error('Error in updateMedia:', error);
    
    if (error.message === 'Media not found') {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Gọi service để xóa media
    await mediaService.deleteMediaService(id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Error in remove media:', error);
    
    if (error.message === 'Media not found') {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk delete media
// @route   POST /api/media/bulk-delete
export const bulkDeleteMedia = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    // Gọi service để xóa nhiều media
    const result = await mediaService.bulkDeleteMediaService(ids);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} media items successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error in bulkDeleteMedia:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};