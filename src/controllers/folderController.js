// controllers/folderController.js
import { Folder } from '../models/folderModel.js';
import { deleteFile } from '../config/multer.js';
import fs from 'fs';
import path from 'path';

// @desc    Create new folder
// @route   POST /api/folders
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Check if parent folder exists
    if (parentFolder) {
      const parentExists = await Folder.findById(parentFolder);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const folder = new Folder({
      name,
      parentFolder: parentFolder || null
    });

    const savedFolder = await folder.save();

    res.status(201).json({
      success: true,
      data: savedFolder,
      message: 'Folder created successfully'
    });

  } catch (error) {
    console.error('Error in createFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all folders with hierarchy
// @route   GET /api/folders
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find()
      .populate('parentFolder', 'name')
      .sort({ createdAt: -1 });

    // Build folder hierarchy
    const buildHierarchy = (parentId = null) => {
      return folders
        .filter(folder => 
          (parentId === null && !folder.parentFolder) || 
          (folder.parentFolder && folder.parentFolder._id.toString() === parentId)
        )
        .map(folder => ({
          ...folder.toObject(),
          subfolders: buildHierarchy(folder._id.toString())
        }));
    };

    const hierarchicalFolders = buildHierarchy();

    res.json({
      success: true,
      data: hierarchicalFolders,
      flat: folders,
      total: folders.length
    });

  } catch (error) {
    console.error('Error in getFolders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single folder by ID
// @route   GET /api/folders/:id
export const getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('parentFolder', 'name');

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: folder
    });

  } catch (error) {
    console.error('Error in getFolderById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload images to folder
// @route   POST /api/folders/:id/upload
export const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageData = {
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/folders/${folder.name}/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };

      await folder.addImage(imageData);
      uploadedImages.push(imageData);
    }

    res.json({
      success: true,
      data: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} images to folder`
    });

  } catch (error) {
    console.error('Error in uploadImages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update folder
// @route   PUT /api/folders/:id
export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentFolder } = req.body;

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Prevent circular reference
    if (parentFolder === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set folder as its own parent'
      });
    }

    // Check if new parent exists
    if (parentFolder && parentFolder !== folder.parentFolder?.toString()) {
      const parentExists = await Folder.findById(parentFolder);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { name, parentFolder: parentFolder || null },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedFolder,
      message: 'Folder updated successfully'
    });

  } catch (error) {
    console.error('Error in updateFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete folder
// @route   DELETE /api/folders/:id
export const removeFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Check if folder has images
    if (folder.images.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete folder that contains images. Please delete all images first.'
      });
    }

    await Folder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    console.error('Error in removeFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete image from folder
// @route   DELETE /api/folders/:folderId/images/:imageId
export const deleteImage = async (req, res) => {
  try {
    const { folderId, imageId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Tìm ảnh cần xóa
    const imageToDelete = folder.images.id(imageId);
    if (!imageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in folder'
      });
    }

    // Xóa file vật lý (nếu có)
    const filePath = path.join('uploads', 'folders', folder.name, imageToDelete.filename);
    deleteFile(filePath);

    // Xóa ảnh khỏi folder
    await folder.removeImage(imageId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteImage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};