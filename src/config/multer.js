// configs/multer.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const uploadDirs = [
    'uploads/projects/hero',
    'uploads/projects/gallery',
    'uploads/projects/floorplans',
    'uploads/projects/progress',
    'uploads/projects/design',
    'uploads/projects/brochures',
    'uploads/media/images',
    'uploads/media/videos',
    'uploads/media/documents',
    'uploads/media/audio'
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
      case 'floorPlans':
        uploadPath += 'floorplans';
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

// Project file filter
const projectFileFilter = (req, file, cb) => {
  // Cho phép image và PDF
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

// ==================== MEDIA STORAGE ====================
const mediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    
    let uploadPath = 'uploads/media/';
    
    // Phân loại theo file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio';
    } else {
      uploadPath += 'documents';
    }
    
    console.log(`📁 Saving media file to: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Giữ nguyên tên file gốc + timestamp để tránh trùng lặp
    const filename = path.parse(file.originalname).name + '-' + uniqueSuffix + ext;
    
    console.log(`💾 Media file saved as: ${filename}`);
    cb(null, filename);
  }
});

// Media file filter
const mediaFileFilter = (req, file, cb) => {
  // Cho phép nhiều loại file hơn
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a',
    // Documents
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Please upload supported file types.`), false);
  }
};
// ==================== FOLDER STORAGE ====================
const folderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();
    
    // Lấy folder name từ request params
    const folderId = req.params.id;
    const folderPath = `uploads/folders/folder-${folderId}`;
    
    // Tạo directory nếu chưa tồn tại
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    console.log(`📁 Saving folder image to: ${folderPath}`);
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = path.parse(file.originalname).name + '-' + uniqueSuffix + ext;
    
    console.log(`💾 Folder image saved as: ${filename}`);
    cb(null, filename);
  }
});
// ==================== MULTER INSTANCES ====================

// Project upload instances
const uploadProject = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 50 // Maximum 50 files total
  }
});

// Media upload instances
const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 20 // Maximum 20 files total
  }
});
const uploadFolderImages = multer({
  storage: folderStorage,
  fileFilter: mediaFileFilter, // Dùng chung filter với media
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20 // Maximum 20 files
  }
});
// ==================== UPLOAD CONFIGURATIONS ====================

// Project upload configurations
const uploadProjectSingle = uploadProject.single('heroImage');

const uploadProjectFields = uploadProject.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
  { name: 'floorPlans', maxCount: 10 },
  { name: 'constructionProgress', maxCount: 20 },
  { name: 'designImages', maxCount: 20 },
  { name: 'brochure', maxCount: 10 }
]);

// Media upload configurations
const uploadMediaSingle = uploadMedia.single('mediaFile');

const uploadMediaFields = uploadMedia.fields([
  { name: 'mediaFiles', maxCount: 10 }
]);

const uploadMediaArray = uploadMedia.array('mediaFiles', 10);

// ==================== ERROR HANDLING MIDDLEWARE ====================

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Please check file size limits.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded. Please check file count limits.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name or too many files.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the form.';
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
  
  // Pass other errors to the main error handler
  next(error);
};

// ==================== FILE MANAGEMENT UTILITIES ====================

// Utility to delete files
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

// Utility to delete multiple files
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  
  filePaths.forEach(filePath => {
    deleteFile(filePath);
  });
};

// Utility to get file info
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

// ==================== EXPORTS ====================

export {
  // Project uploads
  uploadProject,
  uploadProjectSingle,
  uploadProjectFields,
  
  // Media uploads
  uploadMedia,
  uploadMediaSingle,
  uploadMediaFields,
  uploadMediaArray,
  
  uploadFolderImages, 
  // Error handling
  handleMulterError,
  
  // File utilities
  deleteFile,
  deleteFiles,
  getFileInfo,
  ensureUploadDirs
};

// Export default (project fields as default for backward compatibility)
// export default uploadProjectFields;