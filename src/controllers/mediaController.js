import { StatusCodes } from "http-status-codes";
import mediaService from '../services/mediaService.js';
import { 
  uploadMediaFile,
  deleteFromCloudinaryByUrl,
  deleteMultipleFromCloudinary
} from '../config/cloudinary.js';

// @desc    Upload featured image to Cloudinary
// @route   POST /api/media/upload-featured-image
export const uploadFeaturedImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload lên Cloudinary
    let uploadResult;
    if (process.env.USE_CLOUDINARY === 'true') {
      uploadResult = await uploadMediaFile(req.file);
      
    } else {
      // Local storage fallback
      const relativePath = `/uploads/media/${req.file.filename}`;
      uploadResult = {
        url: `${req.protocol}://${req.get('host')}${relativePath}`,
        filename: req.file.filename,
        path: relativePath
      };
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: uploadResult,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error in uploadFeaturedImage:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

// @desc    Delete featured image from Cloudinary
// @route   DELETE /api/media/delete-featured-image
// mediaController.js
export const deleteFeaturedImage = async (req, res) => {
  try {
    console.log('=== DELETE FEATURED IMAGE ===');
    const { imageUrl, filename } = req.body;

    console.log('ImageUrl from body:', imageUrl);
    console.log('Filename from body:', filename);

    if (!imageUrl && !filename) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Either imageUrl or filename is required'
      });
    }

    if (process.env.USE_CLOUDINARY === 'true') {
      // Cloudinary - sử dụng imageUrl
      if (!imageUrl) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'imageUrl is required for Cloudinary'
        });
      }
      
      await deleteFromCloudinaryByUrl(imageUrl);
      console.log('✅ Deleted from Cloudinary:', imageUrl);
      
    } else {
      // Local storage - sử dụng filename
      let fileToDelete = filename;
      
      // Nếu có imageUrl nhưng không có filename, extract từ imageUrl
      if (!fileToDelete && imageUrl) {
        fileToDelete = imageUrl.split('/').pop();
      }
      
      if (!fileToDelete) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Filename is required for local storage'
        });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      const __dirname = path.resolve();
      const uploadsDir = path.join(__dirname, 'uploads/media');
      const filePath = path.join(uploadsDir, fileToDelete);

      console.log('Deleting file from path:', filePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Local file deleted successfully');
      } else {
        console.log('⚠️ File not found:', filePath);
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Image file not found'
        });
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteFeaturedImage:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Delete failed',
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
      featuredImage, // URL từ Cloudinary hoặc local path
      tags
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(StatusCodes.BAD_REQUEST).json({
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
      featuredImage,
      tags
    });
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: newMedia,
      message: 'Media created successfully'
    });

  } catch (error) {
    console.error('Error in createMedia:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    res.status(StatusCodes.OK).json({
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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    res.status(StatusCodes.OK).json({
      success: true,
      data: media
    });

  } catch (error) {
    console.error('Error in getMediaById:', error);
    
    if (error.message === 'Media not found') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully'
    });

  } catch (error) {
    console.error('Error in updateMedia:', error);
    
    if (error.message === 'Media not found') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    // Lấy media trước khi xóa để có thông tin ảnh
    const media = await mediaService.getMediaByIdService(id);
    
    // Xóa media từ database
    await mediaService.deleteMediaService(id);

    // Xóa featured image từ Cloudinary nếu có
    if (process.env.USE_CLOUDINARY === 'true' && media.featuredImage) {
      try {
        await deleteFromCloudinaryByUrl(media.featuredImage);
        console.log(`🗑️ Deleted featured image from Cloudinary: ${media.featuredImage}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Error in remove media:', error);
    
    if (error.message === 'Media not found') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    // Lấy tất cả media để có URLs ảnh
    const mediaItems = await mediaService.getMediaByIdsService(ids);
    
    // Gọi service để xóa nhiều media
    const result = await mediaService.bulkDeleteMediaService(ids);

    // Xóa featured images từ Cloudinary nếu có
    if (process.env.USE_CLOUDINARY === 'true') {
      try {
        const imageUrls = mediaItems
          .filter(media => media.featuredImage)
          .map(media => media.featuredImage);
        
        if (imageUrls.length > 0) {
          await deleteMultipleFromCloudinary(imageUrls);
          console.log(`🗑️ Deleted ${imageUrls.length} featured images from Cloudinary`);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Deleted ${result.deletedCount} media items successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error in bulkDeleteMedia:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};