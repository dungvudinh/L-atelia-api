// controllers/mediaController.js
import { Media } from '../models/mediaModel.js';
import { deleteFile } from '../config/multer.js';

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

    // Tạo media object
    const mediaData = {
      title,
      content, // HTML content từ TinyMCE
      excerpt: excerpt || '',
      category: category || 'lifestyle',
      status: status || 'draft',
      featuredImage: featuredImage || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    console.log('Creating media with data:', mediaData);
    
    // Lưu vào database
    const newMedia = await Media.create(mediaData);
    
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

    const query = {};

    // Add filters
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    // Add search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Media.countDocuments(query);

    res.json({
      success: true,
      data: media,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
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
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.json({
      success: true,
      data: media
    });

  } catch (error) {
    console.error('Error in getMediaById:', error);
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

    // Tìm media hiện tại
    const existingMedia = await Media.findById(id);
    if (!existingMedia) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Tạo update object
    const updateFields = {
      title,
      content,
      excerpt,
      category,
      status,
      featuredImage,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : existingMedia.tags,
      updatedAt: new Date()
    };

    console.log('Updating media with data:', updateFields);
    
    const updatedMedia = await Media.findByIdAndUpdate(
      id, 
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully'
    });

  } catch (error) {
    console.error('Error in updateMedia:', error);
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
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    await Media.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Error in remove media:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};