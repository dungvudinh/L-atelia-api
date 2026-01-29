// controllers/mediaController.js
import { StatusCodes } from "http-status-codes";
import mediaService from '../services/mediaService.js';
import { 
  deleteFileFromB2,
  deleteMultipleFromB2
} from '../config/b2.js';

// @desc    Upload featured image to B2
// @route   POST /api/media/upload-featured-image
export const uploadFeaturedImage = async (req, res) => {
  try {
    if (!req.b2Files || !req.b2Files[0]) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded to B2'
      });
    }

    const b2File = req.b2Files[0];
    
    const uploadResult = {
      url: b2File.url,
      thumbnailUrl: b2File.thumbnailUrl || null,  // ✅ Thêm thumbnailUrl
      key: b2File.key,
      thumbnailKey: b2File.thumbnailKey || null,  // ✅ Thêm thumbnailKey
      filename: b2File.filename,
      originalName: b2File.originalName || b2File.filename,  // ✅ Thêm originalName
      size: b2File.size,
      thumbnailSize: b2File.thumbnailSize || 0,  // ✅ Thêm thumbnailSize
      hasThumbnail: b2File.hasThumbnail || false,  // ✅ Thêm hasThumbnail
      uploaded_at: new Date(),
      storage: 'b2'
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: uploadResult,
      message: 'Image uploaded successfully',
      storage: 'b2'
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

// @desc    Delete featured image from B2
// @route   DELETE /api/media/delete-featured-image
export const deleteFeaturedImage = async (req, res) => {
  try {
    const { key, thumbnailKey } = req.body;

    if (!key && !thumbnailKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'key or thumbnailKey is required'
      });
    }
    
    // Xóa cả original và thumbnail nếu có
    const deletePromises = [];
    if (key) {
      deletePromises.push(deleteFileFromB2(key));
    }
    if (thumbnailKey) {
      deletePromises.push(deleteFileFromB2(thumbnailKey));
    }
    
    await Promise.all(deletePromises);
    console.log('✅ Deleted from B2:', { key, thumbnailKey });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image deleted successfully',
      storage: 'b2'
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
    console.log('BODY', req.body);
    
    let {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    } = req.body;

    // Parse JSON data nếu có
    if (req.body.data) {
      try {
        const parsedData = JSON.parse(req.body.data);
        title = parsedData.title || title;
        content = parsedData.content || content;
        excerpt = parsedData.excerpt || excerpt;
        category = parsedData.category || category;
        status = parsedData.status || status;
        featuredImage = parsedData.featuredImage || featuredImage;
        tags = parsedData.tags || tags;
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
      }
    }

    // Validate required fields
    if (!title || !content) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Xử lý featured image từ B2 nếu có (upload trực tiếp)
    if (req.b2Files && req.b2Files.length > 0) {
      const b2File = req.b2Files[0];
      featuredImage = {
        url: b2File.url,
        thumbnailUrl: b2File.thumbnailUrl || null,  // ✅ Thêm thumbnail
        key: b2File.key,
        thumbnailKey: b2File.thumbnailKey || null,  // ✅ Thêm thumbnailKey
        filename: b2File.filename,
        originalName: b2File.originalName || b2File.filename,
        size: b2File.size,
        thumbnailSize: b2File.thumbnailSize || 0,  // ✅ Thêm thumbnailSize
        hasThumbnail: b2File.hasThumbnail || false,  // ✅ Thêm hasThumbnail
        uploaded_at: new Date(),
        storage: 'b2'
      };
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
      message: 'Media created successfully',
      storage: 'b2'
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
    console.log('QUERY PARAMS', req.query);
    // Gọi service để lấy media
    const result = await mediaService.getMediaService({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      category,
      search
    });
    console.log('MEDIA RESULT', result);
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
    
    let {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    } = req.body;
    // Parse JSON data nếu có
    if (req.body.data) {
      try {
        const parsedData = JSON.parse(req.body.data);
        title = parsedData.title || title;
        content = parsedData.content || content;
        excerpt = parsedData.excerpt || excerpt;
        category = parsedData.category || category;
        status = parsedData.status || status;
        featuredImage = parsedData.featuredImage || featuredImage;
        tags = parsedData.tags || tags;
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
      }
    }

    // Xử lý featured image mới từ B2 nếu có (upload trực tiếp)
    // if (req.b2Files && req.b2Files.length > 0) {
    //   const b2File = req.b2Files[0];
    //   console.log(b2File)
    //   featuredImage = {
    //     url: b2File.url,
    //     thumbnailUrl: b2File.thumbnailUrl || null,  // ✅ Thêm thumbnail
    //     key: b2File.key,
    //     thumbnailKey: b2File.thumbnailKey || null,  // ✅ Thêm thumbnailKey
    //     filename: b2File.filename,
    //     originalName: b2File.originalName || b2File.filename,
    //     size: b2File.size,
    //     thumbnailSize: b2File.thumbnailSize || 0,  // ✅ Thêm thumbnailSize
    //     hasThumbnail: b2File.hasThumbnail || false,  // ✅ Thêm hasThumbnail
    //     uploaded_at: new Date(),
    //     storage: 'b2'
    //   };
    //   hasNewFeaturedImage = true;
    // }

    // Gọi service để cập nhật media
    const updatedMedia = await mediaService.updateMediaService(id, {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags,
      _hasNewFeaturedImage: false
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully',
      storage: 'b2'
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

    // Xóa featured image và thumbnail từ B2 nếu có
    const keysToDelete = [];
    if (media.featuredImage && media.featuredImage.key) {
      keysToDelete.push(media.featuredImage.key);
    }
    if (media.featuredImage && media.featuredImage.thumbnailKey) {
      keysToDelete.push(media.featuredImage.thumbnailKey);
    }
    
    if (keysToDelete.length > 0) {
      try {
        await deleteMultipleFromB2(keysToDelete);
        console.log(`🗑️ Deleted ${keysToDelete.length} files from B2 for media: ${id}`);
      } catch (b2Error) {
        console.error('Error deleting files from B2:', b2Error);
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Media deleted successfully',
      storage: 'b2'
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

    // Xóa featured images và thumbnails từ B2 nếu có
    const keysToDelete = [];
    mediaItems.forEach(media => {
      if (media.featuredImage && media.featuredImage.key) {
        keysToDelete.push(media.featuredImage.key);
      }
      if (media.featuredImage && media.featuredImage.thumbnailKey) {
        keysToDelete.push(media.featuredImage.thumbnailKey);
      }
    });
    
    if (keysToDelete.length > 0) {
      await deleteMultipleFromB2(keysToDelete);
      console.log(`🗑️ Deleted ${keysToDelete.length} files from B2`);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Deleted ${result.deletedCount} media items successfully`,
      deletedCount: result.deletedCount,
      storage: 'b2'
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