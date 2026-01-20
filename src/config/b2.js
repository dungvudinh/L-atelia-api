// config/b2.js - FIXED VERSION
import multer from 'multer';
import path from 'path';
import AWS from 'aws-sdk';
import sharp from 'sharp';

// ==================== BACKBLAZE B2 CONFIGURATION ====================
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-001.backblazeb2.com',
  accessKeyId: '0055260a374b5ff0000000007',
  secretAccessKey: 'K005ACRMiQA1WzODoU0qlHBUslezqCA',
  region: process.env.B2_REGION || 'us-west-001',
  s3ForcePathStyle: true,
  maxRetries: 2
});

const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'latelia';

// ==================== B2 UPLOAD SERVICE (FIXED) ====================
class B2UploadService {
  constructor() {
    this.bucketName = B2_BUCKET_NAME;
  }

  async uploadToB2(fileBuffer, fileName, folder = 'general', options = {}) {
    try {
      const {
        resizeWidth = 1200,
        quality = 80,
        contentType = 'image/jpeg',
        skipOptimization = false
      } = options;

      let finalBuffer = fileBuffer;
      let finalContentType = contentType;

      // Kiểm tra file có hợp lệ không trước khi xử lý
      if (fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      // Chỉ optimize nếu là image và không skip
      if (!skipOptimization && contentType.startsWith('image/')) {
        try {
          // Kiểm tra metadata trước
          const metadata = await sharp(fileBuffer).metadata().catch(() => null);
          
          if (!metadata || !metadata.format) {
            console.warn('⚠️ Invalid image, skipping optimization');
            // Upload nguyên bản nếu không optimize được
            finalBuffer = fileBuffer;
          } else {
            // Tạo một buffer tạm thời để kiểm tra
            const testBuffer = await sharp(fileBuffer)
              .resize(Math.min(resizeWidth, 1920), null, {
                withoutEnlargement: true,
                fit: 'inside'
              })
              .jpeg({ 
                quality: Math.min(quality, 100),
                progressive: true,
                force: false // Không force nếu không phải JPEG
              })
              .toBuffer()
              .catch(() => null);

            if (testBuffer) {
              finalBuffer = testBuffer;
              // Giữ nguyên format gốc nếu không phải JPEG
              if (metadata.format !== 'jpeg') {
                finalBuffer = await sharp(fileBuffer)
                  .resize(Math.min(resizeWidth, 1920), null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                  })
                  .toFormat(metadata.format, { 
                    quality: Math.min(quality, 100)
                  })
                  .toBuffer();
              }
            } else {
              console.warn('⚠️ Image optimization failed, using original');
              finalBuffer = fileBuffer;
            }
          }
        } catch (sharpError) {
          console.warn('⚠️ Sharp processing failed:', sharpError.message);
          // Fallback: upload nguyên bản
          finalBuffer = fileBuffer;
        }
      }

      const fullPath = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: fullPath,
        Body: finalBuffer,
        ContentType: finalContentType,
      };

      const result = await s3.upload(params).promise();
      
      return {
        url: result.Location,
        key: result.Key,
        path: fullPath,
        size: finalBuffer.length,
        bucket: this.bucketName,
        optimized: finalBuffer !== fileBuffer
      };

    } catch (error) {
      console.error('❌ B2 Upload error:', error);
      throw new Error(`B2 Upload failed: ${error.message}`);
    }
  }

  // Simple upload không optimize (cho các file bị lỗi)
  async simpleUploadToB2(fileBuffer, fileName, folder = 'general', contentType = 'image/jpeg') {
    try {
      const fullPath = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: fullPath,
        Body: fileBuffer,
        ContentType: contentType,
      };

      const result = await s3.upload(params).promise();
      
      return {
        url: result.Location,
        key: result.Key,
        path: fullPath,
        size: fileBuffer.length,
        bucket: this.bucketName,
        optimized: false
      };
    } catch (error) {
      console.error('❌ Simple B2 Upload error:', error);
      throw error;
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
      console.error('❌ B2 Delete error:', error);
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
      console.error('❌ B2 Delete multiple error:', error);
      throw new Error(`B2 Delete multiple failed: ${error.message}`);
    }
  }
}

const b2UploadService = new B2UploadService();

// ==================== B2 STORAGE ENGINE (FIXED) ====================
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
    
    // Đọc file buffer
    const chunks = [];
    file.stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    file.stream.on('end', async () => {
      try {
        const fileBuffer = Buffer.concat(chunks);
        
        // Kiểm tra file có hợp lệ không
        if (fileBuffer.length === 0) {
          return cb(new Error('File is empty'));
        }
        
        let result;
        
        // Thử optimize trước, nếu lỗi thì upload nguyên bản
        try {
          result = await b2UploadService.uploadToB2(
            fileBuffer, 
            fileName, 
            folder,
            {
              contentType: file.mimetype,
              skipOptimization: false // Thử optimize
            }
          );
        } catch (optimizeError) {
          console.warn('⚠️ Optimization failed, trying simple upload:', optimizeError.message);
          
          // Fallback: upload nguyên bản
          result = await b2UploadService.simpleUploadToB2(
            fileBuffer,
            fileName,
            folder,
            file.mimetype
          );
        }
        
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
          mimetype: file.mimetype,
          optimized: result.optimized || false
        });
      } catch (error) {
        console.error('❌ File processing error:', error);
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

// ==================== ENHANCED FILE FILTERS ====================
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml'
  ];
  
  // Kiểm tra extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
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
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Only images and PDF files are allowed.`), false);
  }
};

// ==================== VALIDATE IMAGE MIDDLEWARE ====================
const validateImage = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    const files = req.file ? [req.file] : req.files ? Object.values(req.files).flat() : [];
    
    for (const file of files) {
      // Kiểm tra size
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} is too large. Maximum size is 10MB.`
        });
      }
      
      // Kiểm tra image với sharp (nếu là image)
      if (file.mimetype.startsWith('image/') && file.buffer) {
        try {
          await sharp(file.buffer).metadata();
        } catch (sharpError) {
          console.warn(`⚠️ Invalid image detected: ${file.originalname}`, sharpError.message);
          return res.status(400).json({
            success: false,
            message: `Invalid image file: ${file.originalname}. Please upload a valid image.`,
            details: sharpError.message
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Image validation error:', error);
    next(error);
  }
};

// ==================== MULTER INSTANCES ====================
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

// ==================== ENHANCED ERROR HANDLING ====================
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
  
  // Handle sharp errors
  if (error.message.includes('VipsJpeg') || error.message.includes('premature end')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image file. The image may be corrupted or incomplete.',
      details: error.message
    });
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('❌ Upload error:', error);
  next(error);
};

// ==================== EXPORTS ====================
export {
  // Multer instances
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
  validateImage,
  
  // B2 Utilities
  deleteFileFromB2,
  deleteMultipleFromB2,
  b2UploadService
};