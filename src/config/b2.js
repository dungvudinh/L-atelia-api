import multer from 'multer';
import path from 'path';
import AWS from 'aws-sdk';
import sharp from 'sharp';

// ==================== BACKBLAZE B2 CONFIGURATION ====================
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-001.backblazeb2.com',
  accessKeyId: process.env.B2_ACCESS_KEY_ID,
  secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
  region: process.env.B2_REGION || 'us-west-001',
  s3ForcePathStyle: true
});

const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'latelia';

// ==================== B2 UPLOAD SERVICE ====================
class B2UploadService {
  constructor() {
    this.bucketName = B2_BUCKET_NAME;
  }

  async uploadToB2(fileBuffer, fileName, folder = 'general', options = {}) {
    try {
      const {
        resizeWidth = 1200,
        quality = 80,
        contentType = 'image/jpeg'
      } = options;

      // Optimize image với Sharp
      const optimizedImage = await sharp(fileBuffer)
        .resize(resizeWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ 
          quality: quality,
          progressive: true 
        })
        .toBuffer();

      const fullPath = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: fullPath,
        Body: optimizedImage,
        ContentType: contentType,
      };

      const result = await s3.upload(params).promise();
      
      return {
        url: result.Location,
        key: result.Key,
        path: fullPath,
        size: optimizedImage.length,
        bucket: this.bucketName
      };

    } catch (error) {
      console.error('B2 Upload error:', error);
      throw new Error(`B2 Upload failed: ${error.message}`);
    }
  }

  async deleteFromB2(fileKey) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey
      };

      await s3.deleteObject(params).promise();
      return { success: true, message: 'File deleted from B2' };
    } catch (error) {
      console.error('B2 Delete error:', error);
      throw new Error(`B2 Delete failed: ${error.message}`);
    }
  }

  async deleteMultipleFromB2(fileKeys) {
    try {
      const objects = fileKeys.map(key => ({ Key: key }));
      
      const params = {
        Bucket: this.bucketName,
        Delete: { Objects: objects }
      };

      await s3.deleteObjects(params).promise();
      return { success: true, message: 'Files deleted from B2' };
    } catch (error) {
      console.error('B2 Delete multiple error:', error);
      throw new Error(`B2 Delete multiple failed: ${error.message}`);
    }
  }
}

const b2UploadService = new B2UploadService();

// ==================== B2 STORAGE ENGINE ====================
const b2Storage = {
  _handleFile: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = path.parse(file.originalname).name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    
    const fileName = `${safeName}-${uniqueSuffix}${ext}`;
    
    // Xác định folder dựa trên route hoặc fieldname
    let folder = 'general';
    
    if (req.baseUrl?.includes('projects')) {
      folder = `projects/${file.fieldname}`;
    } else if (req.baseUrl?.includes('rent')) {
      folder = 'rent';
    } else if (req.baseUrl?.includes('folders')) {
      const folderId = req.params.id;
      folder = `folders/${folderId}`;
    } else if (req.baseUrl?.includes('media')) {
      folder = 'media';
    }
    
    // Đọc file buffer và upload lên B2
    const chunks = [];
    file.stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    file.stream.on('end', async () => {
      try {
        const fileBuffer = Buffer.concat(chunks);
        const result = await b2UploadService.uploadToB2(
          fileBuffer, 
          fileName, 
          folder,
          {
            contentType: file.mimetype
          }
        );
        
        // Lưu thông tin file vào req để sử dụng sau này
        if (!req.b2Files) req.b2Files = [];
        req.b2Files.push({
          ...result,
          filename: fileName,
          originalname: file.originalname,
          mimetype: file.mimetype
        });
        
        cb(null, {
          b2Key: result.key,
          b2Url: result.url,
          b2Path: result.path,
          size: result.size,
          filename: fileName,
          originalname: file.originalname,
          mimetype: file.mimetype
        });
      } catch (error) {
        cb(error);
      }
    });
    
    file.stream.on('error', cb);
  },

  _removeFile: function (req, file, cb) {
    if (file.b2Key) {
      b2UploadService.deleteFromB2(file.b2Key)
        .then(() => cb(null))
        .catch(cb);
    } else {
      cb(null);
    }
  }
};

// ==================== FILE FILTERS ====================
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

// Project upload instances - CHỈ SỬ DỤNG B2
const uploadProject = multer({
  storage: b2Storage,
  fileFilter: projectFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 50
  }
});

const uploadMedia = multer({
  storage: b2Storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  }
});

const uploadMediaSingle = uploadMedia.single('featuredImage');

// Project upload configurations
const uploadProjectFields = uploadProject.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
  { name: 'constructionProgress', maxCount: 20 },
  { name: 'designImages', maxCount: 20 },
  { name: 'brochure', maxCount: 10 }
]);

const uploadFolderImages = multer({
  storage: b2Storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

const uploadFolderArray = uploadFolderImages.array('images', 20);

const uploadRentImages = multer({
  storage: b2Storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

const uploadRentArray = uploadRentImages.array('images', 20);

// ==================== B2 UTILITY FUNCTIONS ====================
const deleteFileFromB2 = async (fileKey) => {
  try {
    await b2UploadService.deleteFromB2(fileKey);
    return true;
  } catch (error) {
    console.error('Error deleting from B2:', error);
    return false;
  }
};

const deleteMultipleFromB2 = async (fileKeys) => {
  try {
    await b2UploadService.deleteMultipleFromB2(fileKeys);
    return true;
  } catch (error) {
    console.error('Error deleting multiple from B2:', error);
    return false;
  }
};

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

// ==================== EXPORTS ====================
export {
  // Multer instances - TẤT CẢ ĐỀU SỬ DỤNG B2
  uploadProject,
  uploadProjectFields,
  uploadMedia, 
  uploadMediaSingle,
  uploadFolderImages,
  uploadFolderArray,
  uploadRentImages,
  uploadRentArray,
  
  // Error handling
  handleMulterError,
  
  // B2 Utilities
  deleteFileFromB2,
  deleteMultipleFromB2,
  b2UploadService
};