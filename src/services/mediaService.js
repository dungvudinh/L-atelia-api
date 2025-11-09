// services/mediaService.js
import { Media } from '../models/mediaModel.js';
import fs from 'fs';
import path from 'path';

// Helper function to determine file type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
};

// Helper function to extract image dimensions (for images only)
const getImageDimensions = (filePath) => {
  return new Promise((resolve) => {
    // You can use sharp or other image processing libraries here
    // For now, return null or implement basic dimension extraction
    resolve({ width: null, height: null });
  });
};

// Safe file deletion function
const safeDeleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    } catch (deleteError) {
      console.error(`⚠️ Could not delete file ${filePath}:`, deleteError.message);
    }
  }
};

export const createMediaService = async (mediaData) => {
  try {
    const {
      title,
      description,
      type,
      category,
      tags,
      status,
      files
    } = mediaData;

    console.log('Creating media with data:', mediaData);

    // Xử lý multiple files
    const mediaItems = await Promise.all(
      files.mediaFiles.map(async (file) => {
        let dimensions = null;
        
        // Extract dimensions for images
        if (file.mimetype.startsWith('image/')) {
          dimensions = await getImageDimensions(file.path);
        }

        return {
          title: title || file.originalname,
          description: description || '',
          type: type || getFileType(file.mimetype),
          category: category || 'Properties',
          filePath: file.path,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          dimensions: dimensions,
          tags: tags || [],
          status: status || 'active'
        };
      })
    );

    const createdMedia = await Media.insertMany(mediaItems);
    console.log(`✅ Created ${createdMedia.length} media items`);
    
    return createdMedia;
  } catch (error) {
    console.error('Error in createMediaService:', error);
    
    // Xóa files nếu create failed
    if (mediaData.files && mediaData.files.mediaFiles) {
      mediaData.files.mediaFiles.forEach(file => {
        safeDeleteFile(file.path);
      });
    }
    
    throw error;
  }
};

export const getMediaService = async (filters = {}) => {
  try {
    const { 
      search, 
      type, 
      category, 
      status, 
      page = 1, 
      limit = 12 
    } = filters;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
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

export const updateMediaService = async (id, mediaData) => {
  try {
    const {
      title,
      description,
      type,
      category,
      tags,
      status,
      files
    } = mediaData;

    // Tìm media hiện tại
    const existingMedia = await Media.findById(id);
    if (!existingMedia) {
      throw new Error('Media not found');
    }

    // Tạo update object
    const updateFields = {
      title,
      description,
      type,
      category,
      tags,
      status,
      updatedAt: new Date()
    };

    // Xử lý file mới nếu có
    if (files.mediaFiles && files.mediaFiles.length > 0) {
      const newFile = files.mediaFiles[0];
      
      // Xóa file cũ
      safeDeleteFile(existingMedia.filePath);
      
      // Cập nhật thông tin file mới
      updateFields.filePath = newFile.path;
      updateFields.fileName = newFile.originalname;
      updateFields.fileSize = newFile.size;
      updateFields.mimeType = newFile.mimetype;
      
      // Extract dimensions for images
      if (newFile.mimetype.startsWith('image/')) {
        const dimensions = await getImageDimensions(newFile.path);
        updateFields.dimensions = dimensions;
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
    
    // Xóa file mới nếu update failed
    if (mediaData.files && mediaData.files.mediaFiles) {
      mediaData.files.mediaFiles.forEach(file => {
        safeDeleteFile(file.path);
      });
    }
    
    throw error;
  }
};

export const deleteMediaService = async (id) => {
  try {
    const media = await Media.findById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    // Xóa file từ disk
    safeDeleteFile(media.filePath);

    // Xóa record từ database
    await Media.findByIdAndDelete(id);
    
    console.log(`✅ Media ${id} deleted successfully`);
    return { message: 'Media deleted successfully' };
  } catch (error) {
    console.error('Error in deleteMediaService:', error);
    throw error;
  }
};

export const bulkDeleteMediaService = async (ids) => {
  try {
    const mediaItems = await Media.find({ _id: { $in: ids } });
    
    // Xóa tất cả files từ disk
    mediaItems.forEach(media => {
      safeDeleteFile(media.filePath);
    });

    // Xóa tất cả records từ database
    const result = await Media.deleteMany({ _id: { $in: ids } });
    
    console.log(`✅ Bulk deleted ${result.deletedCount} media items`);
    return { 
      message: `Deleted ${result.deletedCount} media items successfully`,
      deletedCount: result.deletedCount 
    };
  } catch (error) {
    console.error('Error in bulkDeleteMediaService:', error);
    throw error;
  }
};

export const getMediaByCategoryService = async (category) => {
  try {
    const media = await Media.find({ 
      category: category,
      status: 'active'
    }).sort({ createdAt: -1 });
    
    return media;
  } catch (error) {
    console.error('Error in getMediaByCategoryService:', error);
    throw error;
  }
};

// Export service object
const mediaService = {
  createMediaService,
  getMediaService,
  getMediaByIdService,
  updateMediaService,
  deleteMediaService,
  bulkDeleteMediaService,
  getMediaByCategoryService
};

export default mediaService;