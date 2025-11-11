// controllers/folderController.js
import { Folder } from '../models/folderModel.js';
import { deleteFile } from '../config/multer.js';
import path from 'path';
import { deleteFolder } from '../config/multer.js';
import fs from 'fs'; // Thêm import fs

// @desc    Create new folder
// @route   POST /api/folders
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Check if folder name already exists
    const existingFolder = await Folder.findOne({ 
      name: name.trim(),
      parentFolder: parentFolder || null 
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'Folder name already exists'
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
      name: name.trim(),
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

// @desc    Get all folders
// @route   GET /api/folders
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find()
      .populate('parentFolder', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: folders,
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
      // Tạo URL truy cập ảnh
      const imageUrl = `/uploads/folders/${id}/${file.filename}`;

      const imageData = {
        filename: file.filename,
        originalName: file.originalname,
        url: imageUrl,
        size: file.size,
        mimetype: file.mimetype
      };

      await folder.addImage(imageData);
      
      // Lấy ID của image vừa thêm
      const newImage = folder.images[folder.images.length - 1];
      uploadedImages.push({
        _id: newImage._id,
        ...imageData
      });
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

    // Check if new name already exists (excluding current folder)
    if (name && name.trim() !== folder.name) {
      const existingFolder = await Folder.findOne({ 
        name: name.trim(),
        parentFolder: parentFolder || folder.parentFolder,
        _id: { $ne: id }
      });

      if (existingFolder) {
        return res.status(400).json({
          success: false,
          message: 'Folder name already exists in this location'
        });
      }
    }

    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { 
        name: name ? name.trim() : folder.name, 
        parentFolder: parentFolder || folder.parentFolder 
      },
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

    // Xóa thư mục vật lý nếu tồn tại - SỬA LẠI DÙNG fs thay vì require
    const folderPath = `uploads/folders/${req.params.id}`;
    deleteFolder(folderPath);
    // if (fs.existsSync(folderPath)) {
    //   fs.rmSync(folderPath, { recursive: true, force: true });
    //   console.log(`🗑️ Deleted folder directory: ${folderPath}`);
    // }

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

    // Xóa file vật lý
    const filePath = path.join('uploads', 'folders', folderId, imageToDelete.filename);
    deleteFile(filePath);

    // Xóa ảnh khỏi folder trong database
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