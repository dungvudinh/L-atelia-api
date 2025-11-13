import { v2 as cloudinary } from 'cloudinary';
import { env } from './environment.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (fileBuffer, folder = 'latelia', options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return matches ? matches[1] : null;
};

/**
 * Upload single file to Cloudinary
 */
const uploadSingleToCloudinary = async (file, folder = 'latelia') => {
  if (!file) return null;
  
  const result = await uploadToCloudinary(file.buffer, folder, {
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw'
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
    width: result.width,
    height: result.height
  };
};

/**
 * Upload multiple files to Cloudinary
 */
const uploadMultipleToCloudinary = async (files, folder = 'latelia') => {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = files.map(file => 
    uploadSingleToCloudinary(file, folder)
  );
  
  return await Promise.all(uploadPromises);
};

/**
 * Upload project files to Cloudinary với folder structure
 */
const uploadProjectFiles = async (files) => {
  const uploadResults = {};
  
  try {
    // Upload hero image
    if (files.heroImage && files.heroImage[0]) {
      uploadResults.heroImage = await uploadSingleToCloudinary(
        files.heroImage[0], 
        'latelia/projects/hero'
      );
    }
    
    // Upload gallery images
    if (files.gallery && files.gallery.length > 0) {
      uploadResults.gallery = await uploadMultipleToCloudinary(
        files.gallery, 
        'latelia/projects/gallery'
      );
    }
    
    // Upload construction progress images
    if (files.constructionProgress && files.constructionProgress.length > 0) {
      uploadResults.constructionProgress = await uploadMultipleToCloudinary(
        files.constructionProgress,
        'latelia/projects/progress'
      );
    }
    
    // Upload design images
    if (files.designImages && files.designImages.length > 0) {
      uploadResults.designImages = await uploadMultipleToCloudinary(
        files.designImages,
        'latelia/projects/design'
      );
    }
    
    // Upload brochures
    if (files.brochure && files.brochure.length > 0) {
      uploadResults.brochure = await uploadMultipleToCloudinary(
        files.brochure,
        'latelia/projects/brochures'
      );
    }
    
    return uploadResults;
  } catch (error) {
    // Rollback uploaded files if any error occurs
    await rollbackUploads(uploadResults);
    throw error;
  }
};

/**
 * Upload media files to Cloudinary
 */
const uploadMediaFile = async (file) => {
  return await uploadSingleToCloudinary(file, 'latelia/media');
};

/**
 * Upload rent files to Cloudinary
 */
const uploadRentFiles = async (files) => {
  return await uploadMultipleToCloudinary(files, 'latelia/rent');
};

/**
 * Upload folder files to Cloudinary
 */
const uploadFolderFiles = async (files, folderId) => {
  return await uploadMultipleToCloudinary(files, `latelia/folders/${folderId}`);
};
const deleteFromCloudinaryByUrl = async (url) => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    const result = await deleteFromCloudinary(publicId);
    console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error.message);
    throw error;
  }
};
/**
 * Delete multiple files from Cloudinary by URLs
 */
const deleteMultipleFromCloudinary = async (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) return;
  
  const deletePromises = urls.map(url => {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
      return deleteFromCloudinary(publicId);
    }
    return Promise.resolve();
  });
  
  return await Promise.allSettled(deletePromises);
};

/**
 * Rollback uploaded files if error occurs
 */
const rollbackUploads = async (uploadResults) => {
  try {
    const deletePromises = [];
    
    if (uploadResults.heroImage) {
      deletePromises.push(deleteFromCloudinary(uploadResults.heroImage.publicId));
    }
    
    if (uploadResults.gallery) {
      deletePromises.push(...uploadResults.gallery.map(img => 
        deleteFromCloudinary(img.publicId)
      ));
    }
    
    if (uploadResults.constructionProgress) {
      deletePromises.push(...uploadResults.constructionProgress.map(img => 
        deleteFromCloudinary(img.publicId)
      ));
    }
    
    if (uploadResults.designImages) {
      deletePromises.push(...uploadResults.designImages.map(img => 
        deleteFromCloudinary(img.publicId)
      ));
    }
    
    if (uploadResults.brochure) {
      deletePromises.push(...uploadResults.brochure.map(doc => 
        deleteFromCloudinary(doc.publicId)
      ));
    }
    
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.error('Error during rollback:', error);
  }
};

export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
  uploadProjectFiles,
  uploadMediaFile,
  uploadRentFiles,
  uploadFolderFiles,
  uploadSingleToCloudinary,
  uploadMultipleToCloudinary,
  deleteMultipleFromCloudinary,
  deleteFromCloudinaryByUrl
};