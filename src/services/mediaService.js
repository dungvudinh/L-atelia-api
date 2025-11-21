// services/mediaService.js
import { Media } from '../models/mediaModel.js';

// Service để tạo media mới
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
      featuredImage: featuredImage || '',
      tags: processedTags
    };

    console.log('Creating media with data:', media);
    
    // Lưu vào database
    const newMedia = await Media.create(media);
    return newMedia;
  } catch (error) {
    console.error('Error in createMediaService:', error);
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
    console.log('MEDIA', media)
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
      tags
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
      title: title || existingMedia.title,
      content: content || existingMedia.content,
      excerpt: excerpt || existingMedia.excerpt,
      category: category || existingMedia.category,
      status: status || existingMedia.status,
      featuredImage: featuredImage || existingMedia.featuredImage,
      tags: processedTags.length > 0 ? processedTags : existingMedia.tags,
      updatedAt: new Date()
    };

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
    const media = await Media.findByIdAndDelete(id);
    if (!media) {
      throw new Error('Media not found');
    }
    return media;
  } catch (error) {
    console.error('Error in deleteMediaService:', error);
    throw error;
  }
};

// Service để xóa nhiều media
export const bulkDeleteMediaService = async (ids) => {
  try {
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
export const deleteFeaturedImage = async (imageUrl, filename = null) => {
  try {
    console.log('Deleting featured image:', { imageUrl, filename });

    let url = '/v1/media/delete-featured-image';
    let data = {};

    // Nếu có imageUrl (Cloudinary), gửi qua body
    if (imageUrl) {
      data = { imageUrl };
    } 
    // Nếu có filename (local storage), thêm vào URL
    else if (filename) {
      url += `/${filename}`;
    } else {
      throw new Error('Either imageUrl or filename is required');
    }

    const response = await apiClient.delete(url, { data });
    return response.data;
  } catch (error) {
    console.error('❌ Error in deleteFeaturedImage service:', error.message);
    throw error;
  }
};
// Export tất cả services
const mediaService = {
  createMediaService,
  getMediaService,
  getMediaByIdService,
  updateMediaService,
  deleteMediaService,
  bulkDeleteMediaService,
  getMediaByCategoryService,
  getMediaByStatusService,
};

export default mediaService;