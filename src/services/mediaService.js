import { Media } from '../models/mediaModel.js';
import { deleteMultipleFromB2 } from '../config/b2.js';

// Service để tạo media mới
// services/mediaService.js - createMediaService
export const createMediaService = async (mediaData) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags
    } = mediaData;

    // Xử lý tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => {
          if (typeof tag === 'string') {
            return tag.trim();
          }
          return String(tag).trim();
        }).filter(tag => tag);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Tạo media object
    const media = {
      title,
      content,
      excerpt: excerpt || '',
      category: category || 'lifestyle',
      status: status || 'draft',
      tags: processedTags,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Xử lý featured image từ B2
    if (featuredImage) {
      if (typeof featuredImage === 'object' && featuredImage.url) {
        // ✅ Đảm bảo có đủ các trường bắt buộc
        media.featuredImage = {
          url: featuredImage.url,
          key: featuredImage.key || `media-${Date.now()}`,
          filename: featuredImage.filename || 
                   featuredImage.url.split('/').pop() || 
                   `image-${Date.now()}`,
          size: featuredImage.size || 0,
          uploadedAt: featuredImage.uploaded_at || new Date(),
          storage: 'b2'
        };
      } else if (typeof featuredImage === 'string') {
        // URL string - lưu với thông tin cơ bản
        media.featuredImage = {
          url: featuredImage,
          key: `media-${Date.now()}`,
          filename: featuredImage.split('/').pop() || `image-${Date.now()}`,
          size: 0,
          uploadedAt: new Date(),
          storage: 'b2'
        };
      }
    }

    console.log('📝 Creating media with data:', media);
    
    // Lưu vào database
    const newMedia = await Media.create(media);
    return newMedia;
  } catch (error) {
    console.error('❌ Error in createMediaService:', error);
    
    // Log chi tiết lỗi validation
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })));
    }
    
    throw error;
  }
};

// Service để lấy danh sách media với pagination và filtering
export const getMediaService = async (filters = {}) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      search 
    } = filters;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Media.countDocuments(query);

    return {
      media,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };
  } catch (error) {
    console.error('Error in getMediaService:', error);
    throw error;
  }
};

// Service để lấy media theo ID
export const getMediaByIdService = async (id) => {
  try {
    const media = await Media.findById(id);
    if (!media) {
      throw new Error('Media not found');
    }
    return media;
  } catch (error) {
    console.error('Error in getMediaByIdService:', error);
    throw error;
  }
};

// Service để lấy nhiều media theo IDs
export const getMediaByIdsService = async (ids) => {
  try {
    const media = await Media.find({ _id: { $in: ids } });
    return media;
  } catch (error) {
    console.error('Error in getMediaByIdsService:', error);
    throw error;
  }
};

// Service để cập nhật media
export const updateMediaService = async (id, mediaData) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags,
      _hasNewFeaturedImage
    } = mediaData;

    // Tìm media hiện tại
    const existingMedia = await Media.findById(id);
    if (!existingMedia) {
      throw new Error('Media not found');
    }

    // Xử lý tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => {
          if (typeof tag === 'string') {
            return tag.trim();
          }
          return String(tag).trim();
        }).filter(tag => tag);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Tạo update object
    const updateFields = {
      updatedAt: new Date()
    };

    // Cập nhật các field cơ bản nếu có
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (excerpt !== undefined) updateFields.excerpt = excerpt;
    if (category !== undefined) updateFields.category = category;
    if (status !== undefined) updateFields.status = status;
    if (processedTags.length > 0) updateFields.tags = processedTags;

    // Xử lý featured image mới
    if (_hasNewFeaturedImage && featuredImage) {
      // Xóa featured image cũ từ B2 nếu có
      if (existingMedia.featuredImage && existingMedia.featuredImage.key) {
        try {
          await deleteMultipleFromB2([existingMedia.featuredImage.key]);
          console.log(`🗑️ Deleted old featured image from B2: ${existingMedia.featuredImage.key}`);
        } catch (b2Error) {
          console.error('Error deleting old image from B2:', b2Error);
        }
      }

      // Thêm featured image mới từ B2
      if (typeof featuredImage === 'object' && featuredImage.url) {
        updateFields.featuredImage = {
          url: featuredImage.url,
          key: featuredImage.key,
          filename: featuredImage.filename,
          size: featuredImage.size || 0,
          uploadedAt: featuredImage.uploaded_at || new Date(),
          storage: 'b2'
        };
      }
    } else if (featuredImage !== undefined) {
      // Cập nhật featured image mà không xóa file cũ
      if (typeof featuredImage === 'object' && featuredImage.url) {
        updateFields.featuredImage = {
          url: featuredImage.url,
          key: featuredImage.key || existingMedia.featuredImage?.key,
          filename: featuredImage.filename || existingMedia.featuredImage?.filename,
          size: featuredImage.size || existingMedia.featuredImage?.size || 0,
          uploadedAt: featuredImage.uploaded_at || existingMedia.featuredImage?.uploadedAt || new Date(),
          storage: 'b2'
        };
      }
    }

    console.log('Updating media with data:', updateFields);
    
    const updatedMedia = await Media.findByIdAndUpdate(
      id, 
      updateFields,
      { new: true, runValidators: true }
    );
    
    return updatedMedia;
  } catch (error) {
    console.error('Error in updateMediaService:', error);
    throw error;
  }
};

// Service để xóa media
export const deleteMediaService = async (id) => {
  try {
    const media = await Media.findById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    // Xóa featured image từ B2 nếu có
    if (media.featuredImage && media.featuredImage.key) {
      try {
        await deleteMultipleFromB2([media.featuredImage.key]);
        console.log(`🗑️ Deleted featured image from B2: ${media.featuredImage.key}`);
      } catch (b2Error) {
        console.error('Error deleting image from B2:', b2Error);
      }
    }

    // Xóa media từ database
    await Media.findByIdAndDelete(id);
    
    return media;
  } catch (error) {
    console.error('Error in deleteMediaService:', error);
    throw error;
  }
};

// Service để xóa nhiều media
export const bulkDeleteMediaService = async (ids) => {
  try {
    // Lấy tất cả media để có thông tin files
    const mediaItems = await Media.find({ _id: { $in: ids } });
    
    // Xóa featured images từ B2
    const keysToDelete = mediaItems
      .filter(media => media.featuredImage && media.featuredImage.key)
      .map(media => media.featuredImage.key);
    
    if (keysToDelete.length > 0) {
      await deleteMultipleFromB2(keysToDelete);
      console.log(`🗑️ Deleted ${keysToDelete.length} featured images from B2`);
    }

    // Xóa media từ database
    const result = await Media.deleteMany({ _id: { $in: ids } });
    return result;
  } catch (error) {
    console.error('Error in bulkDeleteMediaService:', error);
    throw error;
  }
};

// Service để lấy media theo category
export const getMediaByCategoryService = async (category) => {
  try {
    const media = await Media.find({ category })
      .sort({ createdAt: -1 });
    return media;
  } catch (error) {
    console.error('Error in getMediaByCategoryService:', error);
    throw error;
  }
};

// Service để lấy media theo status
export const getMediaByStatusService = async (status) => {
  try {
    const media = await Media.find({ status })
      .sort({ createdAt: -1 });
    return media;
  } catch (error) {
    console.error('Error in getMediaByStatusService:', error);
    throw error;
  }
};

// Export tất cả services
const mediaService = {
  createMediaService,
  getMediaService,
  getMediaByIdService,
  getMediaByIdsService,
  updateMediaService,
  deleteMediaService,
  bulkDeleteMediaService,
  getMediaByCategoryService,
  getMediaByStatusService,
};

export default mediaService;