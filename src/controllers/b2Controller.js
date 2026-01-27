// controllers/b2Controller.js - COMPLETE PROXY SOLUTION
import { StatusCodes } from "http-status-codes";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';

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

// @desc    Upload file via backend proxy (no CORS issues)
// @route   POST /api/b2/upload
export const uploadFile = async (req, res) => {
  try {
    console.log('🔄 Uploading file via backend proxy...');
    
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
    const fileKey = `${folderPath}${uniqueFilename}`.replace(/\/\//g, '/');

    console.log('📁 File upload details:', {
      originalName,
      filename: uniqueFilename,
      key: fileKey,
      size: req.file.size,
      type: req.file.mimetype,
      folder
    });

    // Process image if it's an image
    let fileBuffer = req.file.buffer;
    let contentType = req.file.mimetype;
    
    if (req.file.mimetype.startsWith('image/')) {
      try {
        console.log('🖼️ Processing image optimization...');
        fileBuffer = await processImage(fileBuffer);
        contentType = 'image/webp'; // Convert to WebP for better compression
      } catch (imageError) {
        console.warn('⚠️ Image processing failed, using original:', imageError.message);
        // Continue with original file
      }
    }

    // Upload to B2
    const uploadParams = {
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        'original-filename': originalName,
        'upload-timestamp': timestamp.toString(),
        'uploaded-by': req.user?._id || 'anonymous',
        'upload-method': 'backend-proxy',
        'optimized': fileBuffer !== req.file.buffer ? 'true' : 'false'
      }
    };

    console.log('🚀 Uploading to B2...');
    const command = new PutObjectCommand(uploadParams);
    
    const startTime = Date.now();
    const result = await s3Client.send(command);
    const uploadTime = Date.now() - startTime;
    
    console.log('✅ Upload successful:', {
      key: fileKey,
      etag: result.ETag,
      size: fileBuffer.length,
      uploadTime: `${uploadTime}ms`
    });

    const publicUrl = `${B2_PUBLIC_URL}/${fileKey}`;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        url: publicUrl,
        key: fileKey,
        filename: uniqueFilename,
        originalName,
        size: fileBuffer.length,
        originalSize: req.file.size,
        type: contentType,
        etag: result.ETag,
        uploadedAt: new Date().toISOString(),
        optimized: fileBuffer !== req.file.buffer,
        uploadTime
      },
      message: 'File uploaded successfully'
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

// @desc    Upload multiple files
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

    console.log(`📦 Processing ${req.files.length} files for upload...`);
    
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
        const fileKey = `${folder}/${uniqueFilename}`.replace(/\/\//g, '/');

        // Upload each file
        const command = new PutObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            'original-filename': file.originalname,
            'upload-timestamp': timestamp.toString()
          }
        });

        await s3Client.send(command);
        
        const publicUrl = `${B2_PUBLIC_URL}/${fileKey}`;
        
        return {
          success: true,
          data: {
            url: publicUrl,
            key: fileKey,
            filename: uniqueFilename,
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype
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
      message: `Uploaded ${successfulUploads.length}/${req.files.length} files successfully`
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

// @desc    Delete file from B2
// @route   DELETE /api/b2/files
export const deleteFile = async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'File key is required'
      });
    }

    console.log('🗑️ Deleting file:', fileKey);

    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey
    });

    await s3Client.send(command);

    console.log('✅ File deleted successfully');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'File deleted successfully'
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

// Helper function: Process and optimize image
const processImage = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Resize if too large
    const maxWidth = 1920;
    const maxHeight = 1080;
    
    let resizeOptions = {};
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      resizeOptions = {
        width: metadata.width > maxWidth ? maxWidth : undefined,
        height: metadata.height > maxHeight ? maxHeight : undefined,
        fit: 'inside',
        withoutEnlargement: true
      };
    }
    
    // Convert to WebP with quality 85
    const processedBuffer = await sharp(buffer)
      .resize(resizeOptions)
      .webp({ 
        quality: 85,
        effort: 4 // Better compression
      })
      .toBuffer();
    
    console.log(`🖼️ Image optimized: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
    
    return processedBuffer;
    
  } catch (error) {
    console.warn('⚠️ Image processing failed:', error.message);
    throw error;
  }
};