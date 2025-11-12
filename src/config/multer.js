import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const uploadDirs = [
    'uploads/rent', 
    'uploads/folders',
    'uploads/media',
    'uploads/projects/hero',
    'uploads/projects/gallery',
    'uploads/projects/progress', // ĐÃ LOẠI BỎ floorplans
    'uploads/projects/design',
    'uploads/projects/brochures'
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Gọi hàm này ngay khi khởi động
ensureUploadDirs();

// ==================== MEDIA STORAGE (FEATURED IMAGE) ====================
const mediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    const mediaPath = 'uploads/media';
    console.log(`📁 Saving media image to: ${mediaPath}`);
    cb(null, mediaPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = path.parse(file.originalname).name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const filename = `featured-${safeName}-${uniqueSuffix}${ext}`;
    
    console.log(`💾 Media image saved as: ${filename}`);
    cb(null, filename);
  }
});

// ==================== RENT STORAGE ====================
const rentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    const rentPath = 'uploads/rent';
    
    if (!fs.existsSync(rentPath)) {
      fs.mkdirSync(rentPath, { recursive: true });
      console.log(`📁 Created rent directory: ${rentPath}`);
    }
    
    console.log(`📁 Saving rent image to: ${rentPath}`);
    cb(null, rentPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = path.parse(file.originalname).name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const filename = `rent-${safeName}-${uniqueSuffix}${ext}`;
    
    console.log(`💾 Rent image saved as: ${filename}`);
    cb(null, filename);
  }
});

// ==================== FOLDER STORAGE ====================
const folderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    
    const folderId = req.params.id;
    const folderPath = `uploads/folders/${folderId}`;
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Created folder directory: ${folderPath}`);
    }
    
    console.log(`📁 Saving folder image to: ${folderPath}`);
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = path.parse(file.originalname).name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const filename = `${safeName}-${uniqueSuffix}${ext}`;
    
    console.log(`💾 Folder image saved as: ${filename}`);
    cb(null, filename);
  }
});

// ==================== PROJECTS STORAGE ====================
const projectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    
    let uploadPath = 'uploads/projects/';
    
    switch (file.fieldname) {
      case 'heroImage':
        uploadPath += 'hero';
        break;
      case 'gallery':
        uploadPath += 'gallery';
        break;
      case 'constructionProgress':
        uploadPath += 'progress';
        break;
      case 'designImages':
        uploadPath += 'design';
        break;
      case 'brochure':
        uploadPath += 'brochures';
        break;
      default:
        uploadPath += 'other';
    }
    
    console.log(`📁 Saving project file to: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    
    console.log(`💾 Project file saved as: ${filename}`);
    cb(null, filename);
  }
});

// File filter cho images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Only image files are allowed.`), false);
  }
};

// File filter cho projects
const projectFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Only images and PDF files are allowed.`), false);
  }
};

// ==================== MULTER INSTANCES ====================

// Media upload instances
const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  }
});

const uploadRentImages = multer({
  storage: rentStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

// Folder upload instances
const uploadFolderImages = multer({
  storage: folderStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

// Project upload instances - ĐÃ LOẠI BỎ floorPlans
const uploadProject = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 50
  }
});

const uploadRentArray = uploadRentImages.array('images', 20);

// ==================== UPLOAD CONFIGURATIONS ====================

// Media upload configurations
const uploadMediaSingle = uploadMedia.single('featuredImage');

// Folder upload configurations
const uploadFolderSingle = uploadFolderImages.single('image');
const uploadFolderArray = uploadFolderImages.array('images', 20);

// Project upload configurations - ĐÃ LOẠI BỎ floorPlans
const uploadProjectSingle = uploadProject.single('heroImage');
const uploadProjectFields = uploadProject.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
  { name: 'constructionProgress', maxCount: 20 },
  { name: 'designImages', maxCount: 20 },
  { name: 'brochure', maxCount: 10 }
]);

// ==================== ERROR HANDLING MIDDLEWARE ====================

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum file size is 10MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name or too many files.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    return res.status(400).json({
      success: false,
      message: message
    });
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// ==================== FILE MANAGEMENT UTILITIES ====================

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting file ${filePath}:`, error.message);
      return false;
    }
  }
  return false;
};

const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  
  filePaths.forEach(filePath => {
    deleteFile(filePath);
  });
};

const getFileInfo = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return null;
  
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    console.error(`Error getting file info for ${filePath}:`, error.message);
    return null;
  }
};

const deleteFolder = (folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted folder: ${folderPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting folder ${folderPath}:`, error.message);
      return false;
    }
  }
  return false;
};

// ==================== EXPORTS ====================

export {
  // Media uploads
  uploadMedia,
  uploadMediaSingle,
  
  // Folder uploads
  uploadFolderImages,
  uploadFolderSingle,
  uploadFolderArray,
  
  // Project uploads - ĐÃ LOẠI BỎ floorPlans
  uploadProject,
  uploadProjectSingle,
  uploadProjectFields,
  
  // Rent upload 
  uploadRentArray, 
  uploadRentImages, 
  
  // Error handling
  handleMulterError,
  
  // File utilities
  deleteFolder,
  deleteFile,
  deleteFiles,
  getFileInfo,
  ensureUploadDirs
};