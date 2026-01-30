import { StatusCodes } from "http-status-codes";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
// Configure S3 client for Backblaze B2
const s3Client = new S3Client({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID || '0055260a374b5ff0000000007',
    secretAccessKey: process.env.B2_APPLICATION_KEY || 'K005ACRMiQA1WzODoU0qlHBUslezqCA',
  },
  forcePathStyle: true,
});

const B2_BUCKET_NAME = 'latelia';
const B2_PUBLIC_URL = 'https://f005.backblazeb2.com/file/latelia';
const THUMBNAIL_WIDTH = 700;
const THUMBNAIL_HEIGHT = 500;
const THUMBNAIL_QUALITY = 100;

// @desc    Upload file via backend proxy với thumbnail
// @route   POST /api/b2/upload
export const uploadFile = async (req, res) => {
  try {
    console.log('🔄 Uploading file via backend proxy with thumbnail...');
    
    const { folder = 'general' } = req.body;
    
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file
    const validationError = validateUploadedFile(req.file);
    if (validationError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: validationError
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const originalName = req.file.originalname;
    
    const safeName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/\.+/g, '.');
    
    const uniqueFilename = `${timestamp}-${randomString}-${safeName}`;
    
    // Create folder path
    const folderPath = folder ? `${folder}/`.replace(/\/\//g, '/') : '';
    
    // Original file key
    const originalKey = `${folderPath}${uniqueFilename}`.replace(/\/\//g, '/');
    
    // Thumbnail file key (thêm suffix -thumb)
    const extension = safeName.split('.').pop();
    const thumbnailName = uniqueFilename.replace(`.${extension}`, `-thumb.${extension}`);
    const thumbnailKey = `${folderPath}thumbnails/${thumbnailName}`.replace(/\/\//g, '/');

    console.log('📁 File upload details:', {
      originalName,
      filename: uniqueFilename,
      originalKey,
      thumbnailKey,
      size: req.file.size,
      type: req.file.mimetype,
      folder
    });

    let originalBuffer = req.file.buffer;
    let thumbnailBuffer = null;
    let originalContentType = req.file.mimetype;
    
    // Process image for both original and thumbnail
    if (req.file.mimetype.startsWith('image/')) {
      try {
        console.log('🖼️ Processing image optimization...');
        
        // Process original image (optimize)
        originalBuffer = await processImage(originalBuffer, {
          maxWidth: 1920,
          maxHeight: 1080,
          format: 'webp',
          quality: 85
        });
        originalContentType = 'image/webp';
        
        // Create thumbnail
        try {
          thumbnailBuffer = await createThumbnail(req.file.buffer, {
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT,
            quality: THUMBNAIL_QUALITY
          });
          console.log('✅ Thumbnail created successfully');
        } catch (thumbError) {
          console.warn('⚠️ Thumbnail creation failed:', thumbError.message);
          // Continue without thumbnail
        }
        
      } catch (imageError) {
        console.warn('⚠️ Image processing failed, using original:', imageError.message);
        // Continue with original file
      }
    }

    // Upload original to B2
    const originalUploadParams = {
      Bucket: B2_BUCKET_NAME,
      Key: originalKey,
      Body: originalBuffer,
      ContentType: originalContentType,
      Metadata: {
        'original-filename': originalName,
        'upload-timestamp': timestamp.toString(),
        'uploaded-by': req.user?._id || 'anonymous',
        'upload-method': 'backend-proxy',
        'optimized': 'true',
        'type': 'original'
      }
    };

    console.log('🚀 Uploading original to B2...');
    const originalCommand = new PutObjectCommand(originalUploadParams);
    const originalResult = await s3Client.send(originalCommand);
    
    const originalUrl = `${B2_PUBLIC_URL}/${originalKey}`;
    
    let thumbnailUrl = null;
    
    // Upload thumbnail if created
    if (thumbnailBuffer) {
      try {
        const thumbnailUploadParams = {
          Bucket: B2_BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/webp',
          Metadata: {
            'original-filename': originalName,
            'upload-timestamp': timestamp.toString(),
            'upload-method': 'backend-proxy',
            'type': 'thumbnail',
            'dimensions': `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`
          }
        };
        
        console.log('🚀 Uploading thumbnail to B2...');
        const thumbnailCommand = new PutObjectCommand(thumbnailUploadParams);
        await s3Client.send(thumbnailCommand);
        
        thumbnailUrl = `${B2_PUBLIC_URL}/${thumbnailKey}`;
        console.log('✅ Thumbnail uploaded successfully');
        
      } catch (thumbUploadError) {
        console.warn('⚠️ Thumbnail upload failed:', thumbUploadError.message);
        // Continue without thumbnail URL
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        url: originalUrl, // Original URL
        thumbnailUrl: thumbnailUrl, // Thumbnail URL
        key: originalKey,
        thumbnailKey: thumbnailKey,
        filename: uniqueFilename,
        originalName,
        size: originalBuffer.length,
        originalSize: req.file.size,
        type: originalContentType,
        etag: originalResult.ETag,
        uploadedAt: new Date().toISOString(),
        optimized: true,
        hasThumbnail: !!thumbnailUrl,
        thumbnailDimensions: thumbnailUrl ? `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}` : null
      },
      message: 'File uploaded successfully with thumbnail'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Upload failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Upload multiple files với thumbnail
// @route   POST /api/b2/upload-multiple
export const uploadMultipleFiles = async (req, res) => {
  try {
    const { folder = 'general' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`📦 Processing ${req.files.length} files for upload with thumbnails...`);
    
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(4).toString('hex');
        const safeName = file.originalname
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, '-')
          .replace(/-+/g, '-');
        
        const uniqueFilename = `${timestamp}-${index}-${randomString}-${safeName}`;
        
        // Original file key
        const originalKey = `${folder}/${uniqueFilename}`.replace(/\/\//g, '/');
        
        // Thumbnail file key
        const extension = safeName.split('.').pop();
        const thumbnailName = uniqueFilename.replace(`.${extension}`, `-thumb.${extension}`);
        const thumbnailKey = `${folder}/thumbnails/${thumbnailName}`.replace(/\/\//g, '/');

        let originalBuffer = file.buffer;
        let thumbnailBuffer = null;
        let contentType = file.mimetype;

        // Process image and create thumbnail
        if (file.mimetype.startsWith('image/')) {
          try {
            // Optimize original
            originalBuffer = await processImage(file.buffer, {
              maxWidth: 1920,
              maxHeight: 1080,
              format: 'webp',
              quality: 85
            });
            contentType = 'image/webp';
            
            // Create thumbnail
            thumbnailBuffer = await createThumbnail(file.buffer, {
              width: THUMBNAIL_WIDTH,
              height: THUMBNAIL_HEIGHT,
              quality: THUMBNAIL_QUALITY
            });
          } catch (imgError) {
            console.warn(`⚠️ Image processing failed for ${file.originalname}:`, imgError.message);
            // Continue with original
          }
        }

        // Upload original
        const originalCommand = new PutObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: originalKey,
          Body: originalBuffer,
          ContentType: contentType,
          Metadata: {
            'original-filename': file.originalname,
            'upload-timestamp': timestamp.toString()
          }
        });

        await s3Client.send(originalCommand);
        
        const originalUrl = `${B2_PUBLIC_URL}/${originalKey}`;
        let thumbnailUrl = null;
        
        // Upload thumbnail if created
        if (thumbnailBuffer) {
          try {
            const thumbnailCommand = new PutObjectCommand({
              Bucket: B2_BUCKET_NAME,
              Key: thumbnailKey,
              Body: thumbnailBuffer,
              ContentType: 'image/webp',
              Metadata: {
                'original-filename': file.originalname,
                'upload-timestamp': timestamp.toString(),
                'type': 'thumbnail'
              }
            });
            
            await s3Client.send(thumbnailCommand);
            thumbnailUrl = `${B2_PUBLIC_URL}/${thumbnailKey}`;
            
          } catch (thumbUploadError) {
            console.warn(`⚠️ Thumbnail upload failed for ${file.originalname}:`, thumbUploadError.message);
          }
        }
        
        return {
          success: true,
          data: {
            url: originalUrl,
            thumbnailUrl: thumbnailUrl, // ✅ Có thumbnailUrl
            key: originalKey,
            thumbnailKey: thumbnailUrl ? thumbnailKey : null, // ✅ Có thumbnailKey (nếu có thumbnail)
            filename: uniqueFilename,
            originalName: file.originalname,
            size: originalBuffer.length,
            thumbnailSize: thumbnailBuffer ? thumbnailBuffer.length : 0, // ✅ Có thumbnailSize
            type: contentType,
            hasThumbnail: !!thumbnailUrl, // ✅ Có flag hasThumbnail
            dimensions: { width: 0, height: 0 }, // Placeholder, có thể tính từ sharp metadata
            thumbnailDimensions: thumbnailUrl ? { 
              width: THUMBNAIL_WIDTH, 
              height: THUMBNAIL_HEIGHT 
            } : null
          }
        };
        
      } catch (fileError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, fileError);
        return {
          success: false,
          filename: file.originalname,
          error: fileError.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        total: req.files.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
        files: successfulUploads.map(r => r.data),
        errors: failedUploads.map(r => ({
          filename: r.filename,
          error: r.error
        }))
      },
      message: `Uploaded ${successfulUploads.length}/${req.files.length} files with thumbnails`
    });

  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Multiple upload failed',
      error: error.message
    });
  }
};

// @desc    Delete file from B2 (cả original và thumbnail)
// @route   DELETE /api/b2/files
export const deleteFile = async (req, res) => {
  try {
    const { fileKey, thumbnailKey } = req.body;

    if (!fileKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'File key is required'
      });
    }

    console.log('🗑️ Deleting file:', fileKey);
    
    const deletePromises = [];

    // Delete original
    deletePromises.push(
      s3Client.send(new DeleteObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: fileKey
      }))
    );

    // Delete thumbnail if key provided
    if (thumbnailKey) {
      deletePromises.push(
        s3Client.send(new DeleteObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: thumbnailKey
        }))
      );
    }

    // Also try to guess thumbnail key if not provided
    else {
      const extension = fileKey.split('.').pop();
      const baseName = fileKey.replace(`.${extension}`, '');
      const possibleThumbnailKey = `${baseName}-thumb.${extension}`;
      
      deletePromises.push(
        s3Client.send(new DeleteObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: possibleThumbnailKey
        })).catch(err => {
          console.log('ℹ️ No thumbnail found to delete:', possibleThumbnailKey);
        })
      );
    }

    await Promise.all(deletePromises);
    
    console.log('✅ Files deleted successfully');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'File(s) deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
};

// Helper function: Create thumbnail
const createThumbnail = async (buffer, options = {}) => {
  const {
    width = THUMBNAIL_WIDTH,
    height = THUMBNAIL_HEIGHT,
    quality = THUMBNAIL_QUALITY
  } = options;

  try {
    const thumbnailBuffer = await sharp(buffer)
      .resize({
        width,
        height,
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality,
        effort: 3 // Balanced compression
      })
      .toBuffer();
    
    const originalSize = (buffer.length / 1024).toFixed(1);
    const thumbSize = (thumbnailBuffer.length / 1024).toFixed(1);
    
    console.log(`📸 Thumbnail created: ${originalSize}KB → ${thumbSize}KB (${width}x${height})`);
    
    return thumbnailBuffer;
    
  } catch (error) {
    console.warn('⚠️ Thumbnail creation failed:', error.message);
    throw error;
  }
};

// Helper function: Process and optimize image (updated)
const processImage = async (buffer, options = {}) => {
  try {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp',
      quality = 85
    } = options;
    
    const metadata = await sharp(buffer).metadata();
    
    let resizeOptions = {};
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      resizeOptions = {
        width: metadata.width > maxWidth ? maxWidth : undefined,
        height: metadata.height > maxHeight ? maxHeight : undefined,
        fit: 'inside',
        withoutEnlargement: true
      };
    }
    
    // Convert to WebP
    const processedBuffer = await sharp(buffer)
      .resize(resizeOptions)
      .webp({ 
        quality,
        effort: 4
      })
      .toBuffer();
    
    const originalSize = (buffer.length / 1024).toFixed(1);
    const processedSize = (processedBuffer.length / 1024).toFixed(1);
    
    console.log(`🖼️ Image optimized: ${originalSize}KB → ${processedSize}KB`);
    
    return processedBuffer;
    
  } catch (error) {
    console.warn('⚠️ Image processing failed:', error.message);
    throw error;
  }
};

// @desc    List files in folder
// @route   GET /api/b2/files
export const listFiles = async (req, res) => {
  try {
    const { folder = '', prefix = '', limit = 100 } = req.query;

    const keyPrefix = folder ? `${folder}/` : '';
    const fullPrefix = prefix ? `${keyPrefix}${prefix}` : keyPrefix;

    console.log('📋 Listing files:', { folder, prefix, fullPrefix });

    const command = new ListObjectsV2Command({
      Bucket: B2_BUCKET_NAME,
      Prefix: fullPrefix.replace(/\/\//g, '/'),
      MaxKeys: parseInt(limit)
    });

    const data = await s3Client.send(command);

    const files = data.Contents?.map(item => ({
      key: item.Key,
      url: `${B2_PUBLIC_URL}/${item.Key}`,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag
    })) || [];

    console.log(`✅ Found ${files.length} files`);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        files,
        folder,
        total: files.length,
        isTruncated: data.IsTruncated,
        nextContinuationToken: data.NextContinuationToken
      }
    });

  } catch (error) {
    console.error('❌ List files error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
};

// @desc    Get file info
// @route   GET /api/b2/files/:key
export const getFileInfo = async (req, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'File key is required'
      });
    }

    // List files with exact key
    const command = new ListObjectsV2Command({
      Bucket: B2_BUCKET_NAME,
      Prefix: key,
      MaxKeys: 1
    });

    const data = await s3Client.send(command);
    const file = data.Contents?.find(item => item.Key === key);

    if (!file) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'File not found'
      });
    }

    const publicUrl = `${B2_PUBLIC_URL}/${key}`;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        key: file.Key,
        url: publicUrl,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag
      }
    });

  } catch (error) {
    console.error('❌ Get file info error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get file info',
      error: error.message
    });
  }
};

// Helper function: Validate uploaded file
const validateUploadedFile = (file) => {
  // Check file exists
  if (!file) {
    return 'No file provided';
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum ${maxSize / (1024 * 1024)}MB`;
  }

  // Check file type
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return `File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`;
  }

  // Check for empty file
  if (file.size === 0) {
    return 'File is empty';
  }

  return null; // No errors
};

// // Helper function: Process and optimize image
// const processImage = async (buffer) => {
//   try {
//     const metadata = await sharp(buffer).metadata();
    
//     // Resize if too large
//     const maxWidth = 1920;
//     const maxHeight = 1080;
    
//     let resizeOptions = {};
//     if (metadata.width > maxWidth || metadata.height > maxHeight) {
//       resizeOptions = {
//         width: metadata.width > maxWidth ? maxWidth : undefined,
//         height: metadata.height > maxHeight ? maxHeight : undefined,
//         fit: 'inside',
//         withoutEnlargement: true
//       };
//     }
    
//     // Convert to WebP with quality 85
//     const processedBuffer = await sharp(buffer)
//       .resize(resizeOptions)
//       .webp({ 
//         quality: 85,
//         effort: 4 // Better compression
//       })
//       .toBuffer();
    
//     console.log(`🖼️ Image optimized: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
    
//     return processedBuffer;
    
//   } catch (error) {
//     console.warn('⚠️ Image processing failed:', error.message);
//     throw error;
//   }
// };