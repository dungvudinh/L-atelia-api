// import { StatusCodes } from "http-status-codes";
// import { Folder } from '../models/folderModel.js';
// import { 
//   uploadFolderFiles,
//   deleteFromCloudinaryByUrl,
//   deleteMultipleFromCloudinary
// } from '../config/cloudinary.js';

// // @desc    Create new folder
// // @route   POST /api/folders
// export const createFolder = async (req, res) => {
//   try {
//     const { name, parentFolder } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'Folder name is required'
//       });
//     }

//     // Check if folder name already exists
//     const existingFolder = await Folder.findOne({ 
//       name: name.trim(),
//       parentFolder: parentFolder || null 
//     });

//     if (existingFolder) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'Folder name already exists'
//       });
//     }

//     // Check if parent folder exists
//     if (parentFolder) {
//       const parentExists = await Folder.findById(parentFolder);
//       if (!parentExists) {
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: 'Parent folder not found'
//         });
//       }
//     }

//     const folder = new Folder({
//       name: name.trim(),
//       parentFolder: parentFolder || null
//     });

//     const savedFolder = await folder.save();

//     res.status(StatusCodes.CREATED).json({
//       success: true,
//       data: savedFolder,
//       message: 'Folder created successfully'
//     });

//   } catch (error) {
//     console.error('Error in createFolder:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get all folders
// // @route   GET /api/folders
// export const getFolders = async (req, res) => {
//   try {
//     const folders = await Folder.find()
//       .populate('parentFolder', 'name')
//       .sort({ createdAt: -1 });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: folders,
//       total: folders.length
//     });

//   } catch (error) {
//     console.error('Error in getFolders:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get single folder by ID
// // @route   GET /api/folders/:id
// export const getFolderById = async (req, res) => {
//   try {
//     const folder = await Folder.findById(req.params.id)
//       .populate('parentFolder', 'name');

//     if (!folder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Folder not found'
//       });
//     }

//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: folder
//     });

//   } catch (error) {
//     console.error('Error in getFolderById:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Upload images to folder
// // @route   POST /api/folders/:id/upload
// export const uploadImages = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!req.files || req.files.length === 0) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'No files uploaded'
//       });
//     }

//     const folder = await Folder.findById(id);
//     if (!folder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Folder not found'
//       });
//     }

//     let uploadedImages = [];

//     if (process.env.USE_CLOUDINARY === 'true') {
//       // Upload lên Cloudinary
//       const cloudinaryResults = await uploadFolderFiles(req.files, id);
      
//       uploadedImages = cloudinaryResults.map(result => ({
//         filename: result.publicId.split('/').pop(), // Lấy tên file từ publicId
//         originalName: req.files.find(f => f.originalname.includes(result.format))?.originalname || `image.${result.format}`,
//         url: result.url,
//         size: result.size,
//         mimetype: `image/${result.format}`,
//         cloudinaryPublicId: result.publicId
//       }));

//     } else {
//       // Local storage
//       for (const file of req.files) {
//         const imageUrl = `/uploads/folders/${id}/${file.filename}`;

//         const imageData = {
//           filename: file.filename,
//           originalName: file.originalname,
//           url: imageUrl,
//           size: file.size,
//           mimetype: file.mimetype
//         };

//         await folder.addImage(imageData);
        
//         // Lấy ID của image vừa thêm
//         const newImage = folder.images[folder.images.length - 1];
//         uploadedImages.push({
//           _id: newImage._id,
//           ...imageData
//         });
//       }
//     }

//     // Lưu images vào folder
//     for (const image of uploadedImages) {
//       await folder.addImage(image);
//     }

//     // Lấy folder đã được cập nhật
//     const updatedFolder = await Folder.findById(id);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: {
//         folder: updatedFolder,
//         uploadedImages: uploadedImages
//       },
//       message: `Successfully uploaded ${uploadedImages.length} images to folder`
//     });

//   } catch (error) {
//     console.error('Error in uploadImages:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Upload failed',
//       error: error.message
//     });
//   }
// };

// // @desc    Update folder
// // @route   PUT /api/folders/:id
// export const updateFolder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, parentFolder } = req.body;

//     const folder = await Folder.findById(id);
//     if (!folder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Folder not found'
//       });
//     }

//     // Prevent circular reference
//     if (parentFolder === id) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'Cannot set folder as its own parent'
//       });
//     }

//     // Check if new parent exists
//     if (parentFolder && parentFolder !== folder.parentFolder?.toString()) {
//       const parentExists = await Folder.findById(parentFolder);
//       if (!parentExists) {
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: 'Parent folder not found'
//         });
//       }
//     }

//     // Check if new name already exists (excluding current folder)
//     if (name && name.trim() !== folder.name) {
//       const existingFolder = await Folder.findOne({ 
//         name: name.trim(),
//         parentFolder: parentFolder || folder.parentFolder,
//         _id: { $ne: id }
//       });

//       if (existingFolder) {
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: 'Folder name already exists in this location'
//         });
//       }
//     }

//     const updatedFolder = await Folder.findByIdAndUpdate(
//       id,
//       { 
//         name: name ? name.trim() : folder.name, 
//         parentFolder: parentFolder || folder.parentFolder 
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: updatedFolder,
//       message: 'Folder updated successfully'
//     });

//   } catch (error) {
//     console.error('Error in updateFolder:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete folder
// // @route   DELETE /api/folders/:id
// export const removeFolder = async (req, res) => {
//   try {
//     const folder = await Folder.findById(req.params.id);
//     if (!folder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Folder not found'
//       });
//     }

//     // Check if folder has images
//     if (folder.images.length > 0) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'Cannot delete folder that contains images. Please delete all images first.'
//       });
//     }

//     // Xóa images từ Cloudinary nếu có
//     if (process.env.USE_CLOUDINARY === 'true' && folder.images.length > 0) {
//       try {
//         const imageUrls = folder.images.map(img => img.url);
//         await deleteMultipleFromCloudinary(imageUrls);
//         console.log(`🗑️ Deleted ${imageUrls.length} images from Cloudinary for folder ${folder.name}`);
//       } catch (cloudinaryError) {
//         console.error('Error deleting images from Cloudinary:', cloudinaryError);
//       }
//     }

//     // Xóa thư mục vật lý nếu dùng local storage
//     if (process.env.USE_CLOUDINARY !== 'true') {
//       const fs = await import('fs');
//       const folderPath = `uploads/folders/${req.params.id}`;
//       if (fs.existsSync(folderPath)) {
//         fs.rmSync(folderPath, { recursive: true, force: true });
//         console.log(`🗑️ Deleted folder directory: ${folderPath}`);
//       }
//     }

//     await Folder.findByIdAndDelete(req.params.id);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: 'Folder deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error in removeFolder:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete image from folder
// // @route   DELETE /api/folders/:folderId/images/:imageId
// export const deleteImage = async (req, res) => {
//   try {
//     const { folderId, imageId } = req.params;

//     const folder = await Folder.findById(folderId);
//     if (!folder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Folder not found'
//       });
//     }

//     // Tìm ảnh cần xóa
//     const imageToDelete = folder.images.id(imageId);
//     if (!imageToDelete) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: 'Image not found in folder'
//       });
//     }

//     // Xóa file từ Cloudinary hoặc local
//     if (process.env.USE_CLOUDINARY === 'true') {
//       if (imageToDelete.url) {
//         await deleteFromCloudinaryByUrl(imageToDelete.url);
//       }
//     } else {
//       // Local storage
//       const fs = await import('fs');
//       const path = await import('path');
//       const filePath = path.join('uploads', 'folders', folderId, imageToDelete.filename);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     // Xóa ảnh khỏi folder trong database
//     await folder.removeImage(imageId);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: 'Image deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error in deleteImage:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: 'Delete failed',
//       error: error.message
//     });
//   }
// };
import { StatusCodes } from "http-status-codes";
import { Folder } from '../models/folderModel.js';
import { 
  getStorageStrategy,
  deleteFileFromB2,
  deleteMultipleFromB2
} from '../config/b2.js';

// @desc    Create new folder
// @route   POST /api/folders
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name || !name.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
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
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Folder name already exists'
      });
    }

    // Check if parent folder exists
    if (parentFolder) {
      const parentExists = await Folder.findById(parentFolder);
      if (!parentExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({
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

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: savedFolder,
      message: 'Folder created successfully'
    });

  } catch (error) {
    console.error('Error in createFolder:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    res.status(StatusCodes.OK).json({
      success: true,
      data: folders,
      total: folders.length
    });

  } catch (error) {
    console.error('Error in getFolders:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: folder
    });

  } catch (error) {
    console.error('Error in getFolderById:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    const storageStrategy = getStorageStrategy();
    const { id } = req.params;
    
    if ((!req.files || req.files.length === 0) && (!req.b2Files || req.b2Files.length === 0)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    let uploadedImages = [];

    if (storageStrategy === 'b2') {
      // Sử dụng files đã được upload lên B2
      console.log('=== B2 UPLOADED FILES ===', req.b2Files);
      
      uploadedImages = req.b2Files.map(b2File => {
        // Extract filename từ key
        const filename = b2File.key.split('/').pop() || `image-${Date.now()}`;
        
        return {
          url: b2File.url,
          key: b2File.key,
          filename: filename,
          size:b2File.size, 
          uploadedAt: new Date()
        };
      });
      console.log('UPLOADED IMAGE', uploadedImages)
      // Lưu images vào folder
      for (const image of uploadedImages) {
        await folder.addImage(image);
      }

    } else {
      // Local storage
      for (const file of req.files) {
        const imageUrl = `/uploads/folders/${id}/${file.filename}`;

        const imageData = {
          url: imageUrl,
          key: file.filename, // Dùng filename làm key cho local
          filename: file.filename,
          uploadedAt: new Date()
        };

        await folder.addImage(imageData);
        
        // Lấy ID của image vừa thêm
        const newImage = folder.images[folder.images.length - 1];
        uploadedImages.push({
          _id: newImage._id,
          ...imageData
        });
      }
    }

    // Lấy folder đã được cập nhật
    const updatedFolder = await Folder.findById(id).populate('parentFolder', 'name');

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        folder: updatedFolder,
        uploadedImages: uploadedImages
      },
      message: `Successfully uploaded ${uploadedImages.length} images to folder`,
      storage: storageStrategy
    });

  } catch (error) {
    console.error('Error in uploadImages:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Upload failed',
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
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Prevent circular reference
    if (parentFolder === id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cannot set folder as its own parent'
      });
    }

    // Check if new parent exists
    if (parentFolder && parentFolder !== folder.parentFolder?.toString()) {
      const parentExists = await Folder.findById(parentFolder);
      if (!parentExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({
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
        return res.status(StatusCodes.BAD_REQUEST).json({
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
    ).populate('parentFolder', 'name');

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedFolder,
      message: 'Folder updated successfully'
    });

  } catch (error) {
    console.error('Error in updateFolder:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    const storageStrategy = getStorageStrategy();
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Check if folder has images
    if (folder.images.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete folder that contains images. Please delete all images first.'
      });
    }

    // Xóa images từ B2 nếu có
    if (storageStrategy === 'b2' && folder.images.length > 0) {
      try {
        const keysToDelete = folder.images.map(img => img.key);
        
        if (keysToDelete.length > 0) {
          await deleteMultipleFromB2(keysToDelete);
          console.log(`🗑️ Deleted ${keysToDelete.length} images from B2 for folder ${folder.name}`);
        }
      } catch (b2Error) {
        console.error('Error deleting images from B2:', b2Error);
      }
    }

    // Xóa thư mục vật lý nếu dùng local storage
    if (storageStrategy !== 'b2') {
      const fs = await import('fs');
      const folderPath = `uploads/folders/${req.params.id}`;
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted folder directory: ${folderPath}`);
      }
    }

    await Folder.findByIdAndDelete(req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Folder deleted successfully',
      storage: storageStrategy
    });

  } catch (error) {
    console.error('Error in removeFolder:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    const storageStrategy = getStorageStrategy();
    const { folderId, imageId } = req.params;
    console.log('IMAGE ID', imageId)
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Tìm ảnh cần xóa
    const imageToDelete = folder.images.id(imageId);
    if (!imageToDelete) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Image not found in folder'
      });
    }

    // Xóa file từ B2 hoặc local
    if (storageStrategy === 'b2') {
      await deleteFileFromB2(imageToDelete.key);
      console.log(`🗑️ Deleted image from B2: ${imageToDelete.key}`);
    } else {
      // Local storage
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join('uploads', 'folders', folderId, imageToDelete.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted local file: ${filePath}`);
      }
    }

    // Xóa ảnh khỏi folder trong database
    await folder.removeImage(imageId);

    // Lấy folder đã được cập nhật
    const updatedFolder = await Folder.findById(folderId).populate('parentFolder', 'name');

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedFolder,
      message: 'Image deleted successfully',
      storage: storageStrategy
    });

  } catch (error) {
    console.error('Error in deleteImage:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
};

// @desc    Bulk delete images from folder
// @route   POST /api/folders/:id/images/bulk-delete
export const bulkDeleteImages = async (req, res) => {
  try {
    const storageStrategy = getStorageStrategy();
    const { id } = req.params;
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Image IDs array is required'
      });
    }

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Tìm các ảnh cần xóa
    const imagesToDelete = folder.images.filter(img => 
      imageIds.includes(img._id.toString())
    );

    if (imagesToDelete.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'No images found to delete'
      });
    }

    // Xóa files từ B2 hoặc local
    if (storageStrategy === 'b2') {
      const keysToDelete = imagesToDelete.map(img => img.key);
      await deleteMultipleFromB2(keysToDelete);
      console.log(`🗑️ Deleted ${keysToDelete.length} images from B2`);
    } else {
      // Local storage
      const fs = await import('fs');
      const path = await import('path');
      
      for (const image of imagesToDelete) {
        const filePath = path.join('uploads', 'folders', id, image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.log(`🗑️ Deleted ${imagesToDelete.length} local files`);
    }

    // Xóa ảnh khỏi database
    folder.images = folder.images.filter(img => 
      !imageIds.includes(img._id.toString())
    );
    
    await folder.save();

    // Lấy folder đã được cập nhật
    const updatedFolder = await Folder.findById(id).populate('parentFolder', 'name');

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedFolder,
      message: `Successfully deleted ${imagesToDelete.length} images`,
      storage: storageStrategy
    });

  } catch (error) {
    console.error('Error in bulkDeleteImages:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Bulk delete failed',
      error: error.message
    });
  }
};