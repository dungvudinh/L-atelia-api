// controllers/projectController.js
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';
import { Project } from '../models/projectModel.js';

// controllers/projectController.js - Sửa hàm createProject
export const createProject = async (req, res, next) => {
  try {
    let projectData = {};
    if (req.body.data) {
      try {
        projectData = JSON.parse(req.body.data);
        
        console.log('=== CREATE PROJECT: PROCESSING DATA ===');
        console.log('Gallery from client:', projectData.gallery?.length);
        console.log('ConstructionProgress from client:', projectData.constructionProgress?.length);
        console.log('DesignImages from client:', projectData.designImages?.length);
        console.log('Brochure from client:', projectData.brochure?.length);
        console.log('HeroImage from client:', projectData.heroImage ? 'Yes' : 'No');
        
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON data format'
        });
      }
    }

    // ========== KẾT HỢP ẢNH TỪ 2 NGUỒN ==========
    // 1. Ảnh đã upload qua real-time (trong projectData)
    // 2. Ảnh mới upload qua multer (trong req.b2Files)
    
    let combinedImages = {
      heroImage: null,
      gallery: [],
      constructionProgress: [],
      designImages: [],
      brochure: []
    };
    
    const currentDate = new Date();
    
    // Hàm chuẩn hóa image object
    const normalizeImage = (imgData) => {
      if (!imgData) return null;
      
      if (typeof imgData === 'object') {
        return {
          url: imgData.url || imgData,
          key: imgData.key || extractKeyFromUrl(imgData.url || imgData),
          path: imgData.path || '',
          uploaded_at: imgData.uploaded_at || currentDate,
          name: imgData.name || (imgData.url ? imgData.url.split('/').pop() : ''),
          type: imgData.type || 'image/*'
        };
      }
      
      // Nếu là string URL
      return {
        url: imgData,
        key: extractKeyFromUrl(imgData),
        path: '',
        uploaded_at: currentDate,
        name: imgData.split('/').pop() || '',
        type: imgData.includes('.pdf') ? 'application/pdf' : 'image/*'
      };
    };
    
    // Xử lý ảnh từ projectData (đã upload qua real-time)
    if (projectData.heroImage) {
      combinedImages.heroImage = normalizeImage(projectData.heroImage);
    }
    
    if (projectData.gallery && Array.isArray(projectData.gallery)) {
      combinedImages.gallery = projectData.gallery
        .map(normalizeImage)
        .filter(img => img && img.url);
    }
    
    if (projectData.constructionProgress && Array.isArray(projectData.constructionProgress)) {
      combinedImages.constructionProgress = projectData.constructionProgress
        .map(normalizeImage)
        .filter(img => img && img.url);
    }
    
    if (projectData.designImages && Array.isArray(projectData.designImages)) {
      combinedImages.designImages = projectData.designImages
        .map(normalizeImage)
        .filter(img => img && img.url);
    }
    
    if (projectData.brochure && Array.isArray(projectData.brochure)) {
      combinedImages.brochure = projectData.brochure
        .map(normalizeImage)
        .filter(img => img && img.url);
    }
    
    // Xử lý ảnh từ req.b2Files (upload mới qua multer)
    if (req.b2Files && req.b2Files.length > 0) {
      console.log(`📁 ${req.b2Files.length} files uploaded via multer`);
      
      req.b2Files.forEach(b2File => {
        const imageData = {
          url: b2File.url,
          key: b2File.key,
          path: b2File.path,
          uploaded_at: currentDate,
          name: b2File.originalname,
          type: b2File.mimetype
        };
        
        // Xác định loại ảnh dựa trên key hoặc fieldname
        if (b2File.key.includes('heroImage') || b2File.fieldname === 'heroImage') {
          combinedImages.heroImage = imageData;
        } 
        else if (b2File.key.includes('gallery') || b2File.fieldname === 'gallery') {
          combinedImages.gallery.push(imageData);
        }
        else if (b2File.key.includes('constructionProgress') || b2File.fieldname === 'constructionProgress') {
          combinedImages.constructionProgress.push(imageData);
        }
        else if (b2File.key.includes('designImages') || b2File.fieldname === 'designImages') {
          combinedImages.designImages.push(imageData);
        }
        else if (b2File.key.includes('brochure') || b2File.fieldname === 'brochure') {
          combinedImages.brochure.push(imageData);
        }
      });
    }
    
    console.log('=== COMBINED IMAGES SUMMARY ===');
    console.log('- HeroImage:', combinedImages.heroImage ? 'Yes' : 'No');
    console.log('- Gallery:', combinedImages.gallery.length);
    console.log('- ConstructionProgress:', combinedImages.constructionProgress.length);
    console.log('- DesignImages:', combinedImages.designImages.length);
    console.log('- Brochure:', combinedImages.brochure.length);
    
    // Tạo project với ảnh đã được kết hợp
    const projectToCreate = {
      title: projectData.title || '',
      description: projectData.description || '',
      status: projectData.status || 'draft',
      location: projectData.location || '',
      propertyFeatures: projectData.propertyFeatures || [],
      specifications: projectData.specifications || [],
      propertyHighlights: projectData.propertyHighlights || [],
      specialSections: projectData.specialSections || [],
      
      // Sử dụng ảnh đã kết hợp
      heroImage: combinedImages.heroImage,
      gallery: combinedImages.gallery,
      constructionProgress: combinedImages.constructionProgress,
      designImages: combinedImages.designImages,
      brochure: combinedImages.brochure,
      
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    // Kiểm tra xem có ảnh nào không
    const hasAnyImages = 
      combinedImages.heroImage || 
      combinedImages.gallery.length > 0 || 
      combinedImages.constructionProgress.length > 0 || 
      combinedImages.designImages.length > 0 || 
      combinedImages.brochure.length > 0;
    
    if (!hasAnyImages) {
      console.log('⚠️ Warning: Project created with no images');
    }

    const project = await projectService.createProjectService(projectToCreate);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Create project successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await projectService.getProjectsService(filters);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectByIdService(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectBySlug = async (req, res, next) => {
  try {
    const project = await projectService.getProjectBySlugService(req.params.slug);
    res.status(StatusCodes.OK).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    console.log('=== SERVER: UPDATE REQUEST ===');
    const { id } = req.params;
    
    let updateData = {};
    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
        console.log('✅ Successfully parsed update data');
        
        console.log('Gallery count from client:', updateData.gallery?.length);
        console.log('ConstructionProgress count:', updateData.constructionProgress?.length);
        console.log('DesignImages count:', updateData.designImages?.length);
        console.log('Brochure count:', updateData.brochure?.length);
        
        if (updateData.deletedImages) {
          console.log('=== PROCESSING DELETED IMAGES ===');
          
          const itemsToDelete = [];
          const imageTypes = [
            'gallery', 
            'constructionProgress', 
            'designImages', 
            'brochure',
            'heroImage'
          ];
          
          imageTypes.forEach(type => {
            const urls = updateData.deletedImages[type];
            if (!urls) return;
            
            if (Array.isArray(urls)) {
              urls.forEach(url => {
                if (url) {
                  const key = extractKeyFromUrl(url);
                  if (key) {
                    itemsToDelete.push({ url, key, type });
                    console.log(`Will delete ${type}: ${key.substring(0, 50)}`);
                  }
                }
              });
            } else if (urls) {
              const key = extractKeyFromUrl(urls);
              if (key) {
                itemsToDelete.push({ url: urls, key, type });
                console.log(`Will delete ${type}: ${key.substring(0, 50)}`);
              }
            }
          });
          
          if (itemsToDelete.length > 0) {
            const keysToDelete = itemsToDelete.map(item => item.key).filter(key => key);
            
            if (keysToDelete.length > 0) {
              try {
                await deleteMultipleFromB2(keysToDelete);
                console.log(`🗑️ Successfully deleted ${keysToDelete.length} files from B2`);
                console.log('Deleted types:', [...new Set(itemsToDelete.map(item => item.type))]);
              } catch (b2Error) {
                console.error('❌ Error deleting from B2:', b2Error.message);
              }
            }
          }
          
          delete updateData.deletedImages;
        }
        
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON data format'
        });
      }
    }

    let uploadedFiles = {};
    if (req.b2Files && req.b2Files.length > 0) {
      console.log(`📁 ${req.b2Files.length} new files uploaded to B2`);
      
      uploadedFiles = {
        heroImage: req.b2Files.find(file => file.key.includes('heroImage')) || null,
        gallery: req.b2Files.filter(file => file.key.includes('gallery')) || [],
        constructionProgress: req.b2Files.filter(file => file.key.includes('constructionProgress')) || [],
        designImages: req.b2Files.filter(file => file.key.includes('designImages')) || [],
        brochure: req.b2Files.filter(file => file.key.includes('brochure')) || []
      };
      
      console.log('New files by type:');
      console.log('- Gallery:', uploadedFiles.gallery.length);
      console.log('- ConstructionProgress:', uploadedFiles.constructionProgress.length);
      console.log('- DesignImages:', uploadedFiles.designImages.length);
      console.log('- Brochure:', uploadedFiles.brochure.length);
      console.log('- HeroImage:', uploadedFiles.heroImage ? 'Yes' : 'No');
      
      updateData._hasNewFiles = true;
    }

    const currentDate = new Date();
    
    const processImageArray = (clientArray, uploadedArray, typeName) => {
      if (!clientArray || !Array.isArray(clientArray)) {
        return uploadedArray || [];
      }
      
      console.log(`Processing ${typeName}...`);
      
      const existingItems = clientArray.filter(item => {
        if (!item) return false;
        
        let url;
        if (typeof item === 'object') {
          url = item.url || '';
        } else {
          url = item || '';
        }
        
        const isValid = url && !url.startsWith('blob:') && !url.startsWith('data:');
        if (!isValid && url) {
          console.log(`  Filtering out blob URL from ${typeName}: ${url.substring(0, 50)}`);
        }
        return isValid;
      });
      
      console.log(`  Existing ${typeName} after filtering: ${existingItems.length} items`);
      
      if (uploadedArray && uploadedArray.length > 0) {
        console.log(`  Adding ${uploadedArray.length} new items to ${typeName}`);
        
        uploadedArray.forEach(file => {
          existingItems.push({
            url: file.url,
            key: file.key,
            path: file.path,
            uploaded_at: currentDate,
            name: file.originalname,
            type: file.mimetype
          });
        });
      }
      
      console.log(`  Final ${typeName} count: ${existingItems.length}`);
      return existingItems;
    };
    
    updateData.gallery = processImageArray(updateData.gallery, uploadedFiles.gallery, 'gallery');
    updateData.constructionProgress = processImageArray(
      updateData.constructionProgress, 
      uploadedFiles.constructionProgress, 
      'constructionProgress'
    );
    updateData.designImages = processImageArray(
      updateData.designImages, 
      uploadedFiles.designImages, 
      'designImages'
    );
    updateData.brochure = processImageArray(
      updateData.brochure, 
      uploadedFiles.brochure, 
      'brochure'
    );
    
    if (uploadedFiles.heroImage) {
      updateData.heroImage = {
        url: uploadedFiles.heroImage.url,
        key: uploadedFiles.heroImage.key,
        path: uploadedFiles.heroImage.path,
        uploaded_at: currentDate
      };
    } else if (updateData.heroImage) {
      const heroUrl = typeof updateData.heroImage === 'object' 
        ? updateData.heroImage.url 
        : updateData.heroImage;
      
      if (heroUrl && !heroUrl.startsWith('blob:') && !heroUrl.startsWith('data:')) {
        if (typeof updateData.heroImage === 'string') {
          updateData.heroImage = { url: updateData.heroImage };
        }
      } else {
        updateData.heroImage = null;
      }
    }
    
    console.log('=== FINAL UPDATE DATA SUMMARY ===');
    console.log('Gallery:', updateData.gallery?.length || 0);
    console.log('ConstructionProgress:', updateData.constructionProgress?.length || 0);
    console.log('DesignImages:', updateData.designImages?.length || 0);
    console.log('Brochure:', updateData.brochure?.length || 0);
    console.log('HeroImage:', updateData.heroImage ? 'Yes' : 'No');
    
    const project = await projectService.updateProjectService(id, updateData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Update project successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const uploadProjectImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageType = 'gallery', folder = 'projects' } = req.body;
    
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const b2File = req.b2Files?.[0];
    
    if (!b2File) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Image upload failed'
      });
    }

    const imageData = {
      url: b2File.url,
      key: b2File.key,
      path: b2File.path,
      name: b2File.originalname,
      type: b2File.mimetype,
      size: b2File.size,
      uploaded_at: new Date()
    };

    if (id && id !== 'new') {
      const project = await Project.findById(id);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      switch (imageType) {
        case 'hero':
          project.heroImage = imageData;
          break;
        case 'gallery':
          project.gallery.push(imageData);
          break;
        case 'constructionProgress':
          project.constructionProgress.push(imageData);
          break;
        case 'designImages':
          project.designImages.push(imageData);
          break;
        case 'brochure':
          project.brochure.push(imageData);
          break;
        default:
          project.gallery.push(imageData);
      }

      project.updatedAt = new Date();
      await project.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: imageData,
        projectId: id,
        imageType: imageType
      }
    });
  } catch (err) {
    next(err);
  }
};

export const uploadMultipleProjectImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageType = 'gallery', folder = 'projects' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const b2Files = req.b2Files || [];
    
    if (b2Files.length === 0) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Image upload failed'
      });
    }

    const imagesData = b2Files.map(b2File => ({
      url: b2File.url,
      key: b2File.key,
      path: b2File.path,
      name: b2File.originalname,
      type: b2File.mimetype,
      size: b2File.size,
      uploaded_at: new Date()
    }));

    if (id && id !== 'new') {
      const project = await Project.findById(id);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }
      console.log(imageType, project)
      switch (imageType) {
        case 'gallery':
          project.gallery.push(...imagesData);
          break;
        case 'constructionProgress':
          project.constructionProgress.push(...imagesData);
          break;
        case 'designImages':
          project.designImages.push(...imagesData);
          break;
        case 'brochure':
          project.brochure.push(...imagesData);
          break;
        default:
          project.gallery.push(...imagesData);
      }

      project.updatedAt = new Date();
      await project.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${imagesData.length} images uploaded successfully`,
      data: {
        images: imagesData,
        projectId: id,
        imageType: imageType,
        count: imagesData.length
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProjectImage = async (req, res, next) => {
  try {
    const { id, imageKey } = req.params;
    const { imageType } = req.query;
    
    if (!imageKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'imageKey is required'
      });
    }

    try {
      await deleteMultipleFromB2([imageKey]);
      console.log(`🗑️ Deleted image from B2: ${imageKey}`);
    } catch (b2Error) {
      console.error('Error deleting from B2:', b2Error);
    }

    if (id && id !== 'new') {
      const project = await Project.findById(id);
      if (project) {
        let updated = false;
        
        if (imageType) {
          switch (imageType) {
            case 'hero':
              if (project.heroImage && project.heroImage.key === imageKey) {
                project.heroImage = null;
                updated = true;
              }
              break;
            case 'gallery':
              project.gallery = project.gallery.filter(img => img.key !== imageKey);
              updated = true;
              break;
            case 'constructionProgress':
              project.constructionProgress = project.constructionProgress.filter(img => img.key !== imageKey);
              updated = true;
              break;
            case 'designImages':
              project.designImages = project.designImages.filter(img => img.key !== imageKey);
              updated = true;
              break;
            case 'brochure':
              project.brochure = project.brochure.filter(doc => doc.key !== imageKey);
              updated = true;
              break;
          }
        } else {
          if (project.heroImage && project.heroImage.key === imageKey) {
            project.heroImage = null;
          }
          project.gallery = project.gallery.filter(img => img.key !== imageKey);
          project.constructionProgress = project.constructionProgress.filter(img => img.key !== imageKey);
          project.designImages = project.designImages.filter(img => img.key !== imageKey);
          project.brochure = project.brochure.filter(doc => doc.key !== imageKey);
          updated = true;
        }
        
        if (updated) {
          project.updatedAt = new Date();
          await project.save();
        }
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        deletedKey: imageKey,
        projectId: id
      }
    });
  } catch (err) {
    next(err);
  }
};

// Thêm hàm này nếu chưa có trong file controller
function extractKeyFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    const parts = pathname.split('/');
    
    const fileIndex = parts.findIndex(part => part === 'file');
    if (fileIndex !== -1 && fileIndex + 2 < parts.length) {
      return parts.slice(fileIndex + 2).join('/');
    }
    
    return parts[parts.length - 1];
    
  } catch (e) {
    console.error('Error extracting key from URL:', url);
    return null;
  }
}

export const remove = async (req, res, next) => {
  try {
    const project = await projectService.getProjectByIdService(req.params.id);
    
    await projectService.deleteProjectService(req.params.id);
    
    if (project) {
      try {
        const itemsToDelete = [];
        
        const extractItems = (imageField) => {
          if (Array.isArray(imageField)) {
            return imageField.map(item => ({
              url: item.url,
              key: item.key
            }));
          } else if (imageField && imageField.url) {
            return [{
              url: imageField.url,
              key: imageField.key
            }];
          }
          return [];
        };
        
        if (project.heroImage) itemsToDelete.push(...extractItems(project.heroImage));
        if (project.gallery) itemsToDelete.push(...extractItems(project.gallery));
        if (project.constructionProgress) itemsToDelete.push(...extractItems(project.constructionProgress));
        if (project.designImages) itemsToDelete.push(...extractItems(project.designImages));
        if (project.brochure) itemsToDelete.push(...extractItems(project.brochure));
        
        if (itemsToDelete.length > 0) {
          const keysToDelete = itemsToDelete
            .filter(item => item.key)
            .map(item => item.key);
          
          if (keysToDelete.length > 0) {
            await deleteMultipleFromB2(keysToDelete);
          }
        }
      } catch (b2Error) {
        console.error('Error deleting files from B2:', b2Error);
      }
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Delete project successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const deleteImages = async (req, res, next) => {
  try {
    const { imageType, imageUrls } = req.body;
    
    if (!imageType || !imageUrls || !Array.isArray(imageUrls)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'imageType and imageUrls (array) are required'
      });
    }

    try {
      const itemsToDelete = imageUrls.map(item => 
        typeof item === 'object' ? item : { url: item }
      );
      
      const keysToDelete = itemsToDelete
        .filter(item => item.key)
        .map(item => item.key);
      
      if (keysToDelete.length > 0) {
        await deleteMultipleFromB2(keysToDelete);
      }
    } catch (b2Error) {
      console.error('Error deleting images from B2:', b2Error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete images from storage'
      });
    }

    const project = await projectService.deleteProjectImagesService(
      req.params.id, 
      imageType, 
      imageUrls
    );
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Delete images successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};