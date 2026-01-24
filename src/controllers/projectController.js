
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';
import { PendingImage } from '../models/pendingImageModel.js';
export const createProject = async (req, res, next) => {
  try {
    let projectData = {};
    console.log("DATA:",req.body.data)

    if (req.body.data) {
      try {
        projectData = req.body.data;
        if(typeof projectData === 'string'){
          projectData = JSON.parse(req.body.data);
        }
        // ========== QUAN TRỌNG: LOẠI BỎ BLOB URLs TỪ DỮ LIỆU CLIENT ==========
        // Hàm helper để filter blob và data URLs
        const filterBlobUrls = (array) => {
          if (!array || !Array.isArray(array)) return [];
          return array.filter(item => {
            if (!item) return false;
            
            // Xác định URL
            let url;
            if (typeof item === 'object') {
              url = item.url || '';
            } else {
              url = item || '';
            }
            
            // Chỉ giữ lại URLs không phải blob: hoặc data:
            return url && !url.startsWith('blob:') && !url.startsWith('data:');
          });
        };
        
        console.log('=== CREATE PROJECT: FILTERING BLOB URLs ===');
        console.log('Original gallery count:', projectData.gallery?.length || 0);
        console.log('Original constructionProgress count:', projectData.constructionProgress?.length || 0);
        console.log('Original designImages count:', projectData.designImages?.length || 0);
        console.log('Original brochure count:', projectData.brochure?.length || 0);
        
        // Filter tất cả các mảng ảnh
        projectData.gallery = filterBlobUrls(projectData.gallery);
        projectData.constructionProgress = filterBlobUrls(projectData.constructionProgress);
        projectData.designImages = filterBlobUrls(projectData.designImages);
        projectData.brochure = filterBlobUrls(projectData.brochure);
        
        console.log('After filtering blob URLs:');
        console.log('Gallery count:', projectData.gallery?.length || 0);
        console.log('ConstructionProgress count:', projectData.constructionProgress?.length || 0);
        console.log('DesignImages count:', projectData.designImages?.length || 0);
        console.log('Brochure count:', projectData.brochure?.length || 0);
        
        // Filter heroImage
        if (projectData.heroImage) {
          const heroUrl = typeof projectData.heroImage === 'object' 
            ? projectData.heroImage.url 
            : projectData.heroImage;
          
          if (heroUrl && (heroUrl.startsWith('blob:') || heroUrl.startsWith('data:'))) {
            console.log('Filtering out blob heroImage URL');
            projectData.heroImage = null;
          }
        }
        
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON data format'
        });
      }
    }

    // Xử lý files từ B2
    let uploadedFiles = {};
    if (req.b2Files && req.b2Files.length > 0) {
      console.log(`📁 ${req.b2Files.length} files uploaded to B2`);
      
      // Nhóm files theo fieldname từ req.b2Files
      uploadedFiles = {
        heroImage: req.b2Files.find(file => file.key.includes('heroImage')) || null,
        gallery: req.b2Files.filter(file => file.key.includes('gallery')) || [],
        constructionProgress: req.b2Files.filter(file => file.key.includes('constructionProgress')) || [],
        designImages: req.b2Files.filter(file => file.key.includes('designImages')) || [],
        brochure: req.b2Files.filter(file => file.key.includes('brochure')) || []
      };
      
      console.log('Uploaded files by type:');
      console.log('- HeroImage:', uploadedFiles.heroImage ? 'Yes' : 'No');
      console.log('- Gallery:', uploadedFiles.gallery.length);
      console.log('- ConstructionProgress:', uploadedFiles.constructionProgress.length);
      console.log('- DesignImages:', uploadedFiles.designImages.length);
      console.log('- Brochure:', uploadedFiles.brochure.length);
    }

    // Tạo project data object để truyền vào service
    const projectToCreate = {
      ...projectData
    };

    // Thêm image URLs vào project data (CHỈ từ B2, không kết hợp với client data)
    const currentDate = new Date();
    
    // QUAN TRỌNG: Chỉ sử dụng files từ B2, không kết hợp với bất kỳ dữ liệu nào từ client
    // vì client data chỉ chứa blob URLs (đã được filter ở trên) hoặc empty
    const imagesConfig = {
      heroImage: uploadedFiles.heroImage ? {
        url: uploadedFiles.heroImage.url,
        key: uploadedFiles.heroImage.key,
        path: uploadedFiles.heroImage.path,
        uploaded_at: currentDate,
        name: uploadedFiles.heroImage.originalname,
        type: uploadedFiles.heroImage.mimetype
      } : null,
      
      gallery: uploadedFiles.gallery ? uploadedFiles.gallery.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate,
        name: img.originalname,
        type: img.mimetype
      })) : [],
      
      constructionProgress: uploadedFiles.constructionProgress ? uploadedFiles.constructionProgress.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate,
        name: img.originalname,
        type: img.mimetype
      })) : [],
      
      designImages: uploadedFiles.designImages ? uploadedFiles.designImages.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate,
        name: img.originalname,
        type: img.mimetype
      })) : [],
      
      brochure: uploadedFiles.brochure ? uploadedFiles.brochure.map(doc => ({
        url: doc.url,
        key: doc.key,
        path: doc.path,
        uploaded_at: currentDate,
        name: doc.originalname,
        type: doc.mimetype
      })) : []
    };

    // Ghi đè các fields ảnh trong projectToCreate với chỉ URLs từ B2
    projectToCreate.heroImage = imagesConfig.heroImage;
    projectToCreate.gallery = imagesConfig.gallery;
    projectToCreate.constructionProgress = imagesConfig.constructionProgress;
    projectToCreate.designImages = imagesConfig.designImages;
    projectToCreate.brochure = imagesConfig.brochure;
    
    // DEBUG: Kiểm tra dữ liệu cuối cùng
    console.log('=== FINAL PROJECT DATA FOR CREATE ===');
    console.log('Basic info:', {
      title: projectToCreate.title,
      descriptionLength: projectToCreate.description?.length,
      location: projectToCreate.location
    });
    console.log('Images summary:');
    console.log('- HeroImage:', projectToCreate.heroImage ? 'Has image' : 'No image');
    console.log('- Gallery count:', projectToCreate.gallery?.length || 0);
    console.log('- ConstructionProgress count:', projectToCreate.constructionProgress?.length || 0);
    console.log('- DesignImages count:', projectToCreate.designImages?.length || 0);
    console.log('- Brochure count:', projectToCreate.brochure?.length || 0);
    
    // Kiểm tra nếu không có ảnh nào (bao gồm cả heroImage)
    if (!projectToCreate.heroImage && 
        projectToCreate.gallery.length === 0 &&
        projectToCreate.constructionProgress.length === 0 &&
        projectToCreate.designImages.length === 0 &&
        projectToCreate.brochure.length === 0) {
      console.log('⚠️ Warning: Project created with no images');
    }

    // Gọi service
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
        
        // Debug tất cả các loại ảnh
        console.log('Gallery count from client:', updateData.gallery?.length);
        console.log('ConstructionProgress count:', updateData.constructionProgress?.length);
        console.log('DesignImages count:', updateData.designImages?.length);
        console.log('Brochure count:', updateData.brochure?.length);
        
        // ========== XỬ LÝ XÓA ẢNH TỪ B2 CHO TẤT CẢ LOẠI ==========
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
          
          // Process all image types
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
              // For heroImage (single item, not array)
              const key = extractKeyFromUrl(urls);
              if (key) {
                itemsToDelete.push({ url: urls, key, type });
                console.log(`Will delete ${type}: ${key.substring(0, 50)}`);
              }
            }
          });
          
          // Thực hiện xóa từ B2
          if (itemsToDelete.length > 0) {
            const keysToDelete = itemsToDelete.map(item => item.key).filter(key => key);
            
            if (keysToDelete.length > 0) {
              try {
                await deleteMultipleFromB2(keysToDelete);
                console.log(`🗑️ Successfully deleted ${keysToDelete.length} files from B2`);
                console.log('Deleted types:', [...new Set(itemsToDelete.map(item => item.type))]);
              } catch (b2Error) {
                console.error('❌ Error deleting from B2:', b2Error.message);
                // Continue even if B2 delete fails
              }
            }
          }
          
          // Xóa field deletedImages khỏi updateData
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

    // ========== XỬ LÝ FILES MỚI TỪ B2 ==========
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

    // ========== QUAN TRỌNG: MERGE ẢNH HIỆN TẠI VỚI ẢNH MỚI CHO TẤT CẢ LOẠI ==========
    const currentDate = new Date();
    
    // Hàm helper để filter và merge images
    const processImageArray = (clientArray, uploadedArray, typeName) => {
      if (!clientArray || !Array.isArray(clientArray)) {
        return uploadedArray || [];
      }
      
      console.log(`Processing ${typeName}...`);
      
      // Filter out blob URLs (only keep B2 URLs)
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
      
      // Add new uploaded files
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
    
    // Process ALL image types
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
    
    // Xử lý heroImage
    if (uploadedFiles.heroImage) {
      updateData.heroImage = {
        url: uploadedFiles.heroImage.url,
        key: uploadedFiles.heroImage.key,
        path: uploadedFiles.heroImage.path,
        uploaded_at: currentDate
      };
    } else if (updateData.heroImage) {
      // Giữ heroImage hiện tại nếu không upload mới
      const heroUrl = typeof updateData.heroImage === 'object' 
        ? updateData.heroImage.url 
        : updateData.heroImage;
      
      // Chỉ giữ lại nếu không phải blob URL
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
    
    // Gọi service
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

// Helper function cải tiến để extract key từ URL
function extractKeyFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Pattern: /file/bucket-name/folder/file-name
    const parts = pathname.split('/');
    
    // Lấy phần từ "file" trở đi
    const fileIndex = parts.findIndex(part => part === 'file');
    if (fileIndex !== -1 && fileIndex + 2 < parts.length) {
      // Trả về path từ folder trở đi
      return parts.slice(fileIndex + 2).join('/');
    }
    
    // Fallback: lấy phần cuối cùng
    return parts[parts.length - 1];
    
  } catch (e) {
    console.error('Error extracting key from URL:', url.substring(0, 100));
    return null;
  }
}

// Helper function để extract key từ URL
// function extractKeyFromUrl(url) {
//   if (!url) return null;
//   try {
//     // URL pattern: https://.../projects/[key]
//     const urlObj = new URL(url);
//     const pathParts = urlObj.pathname.split('/');
//     // Lấy phần cuối cùng của path
//     return pathParts[pathParts.length - 1];
//   } catch (e) {
//     console.error('Error extracting key from URL:', e);
//     return null;
//   }
// }

export const remove = async (req, res, next) => {
  try {
    // Lấy project trước khi xóa
    const project = await projectService.getProjectByIdService(req.params.id);
    
    // Xóa project từ database
    await projectService.deleteProjectService(req.params.id);
    
    // Xóa files từ B2
    if (project) {
      try {
        const itemsToDelete = [];
        
        // Hàm extract thông tin từ image object
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

    // Xóa images từ B2
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
export const confirmTempImages = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { tempImageData } = req.body;
    
    if (!tempImageData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'tempImageData is required'
      });
    }

    // Process each image type
    const imagesToConfirm = {
      heroImage: null,
      gallery: [],
      constructionProgress: [],
      designImages: [],
      brochure: []
    };

    // Process heroImage
    if (tempImageData.heroImage && tempImageData.heroImage.tempId) {
      const pendingImg = await PendingImage.findOne({
        tempId: tempImageData.heroImage.tempId,
        status: 'pending'
      });
      
      if (pendingImg) {
        imagesToConfirm.heroImage = {
          url: pendingImg.url,
          key: pendingImg.key,
          uploaded_at: pendingImg.uploaded_at
        };
        
        // Update status to active
        pendingImg.status = 'active';
        pendingImg.projectId = projectId;
        await pendingImg.save();
      }
    }
    
    // Process gallery images
    if (tempImageData.gallery && Array.isArray(tempImageData.gallery)) {
      const tempIds = tempImageData.gallery
        .map(item => item.tempId)
        .filter(tempId => tempId);
      
      if (tempIds.length > 0) {
        const pendingImages = await PendingImage.find({
          tempId: { $in: tempIds },
          status: 'pending'
        });
        
        imagesToConfirm.gallery = pendingImages.map(img => ({
          url: img.url,
          key: img.key,
          uploaded_at: img.uploaded_at
        }));
        
        // Update status
        await PendingImage.updateMany(
          { tempId: { $in: tempIds } },
          { $set: { status: 'active', projectId } }
        );
      }
    }
    
    // Process constructionProgress
    if (tempImageData.constructionProgress && Array.isArray(tempImageData.constructionProgress)) {
      const tempIds = tempImageData.constructionProgress
        .map(item => item.tempId)
        .filter(tempId => tempId);
      
      if (tempIds.length > 0) {
        const pendingImages = await PendingImage.find({
          tempId: { $in: tempIds },
          status: 'pending'
        });
        
        imagesToConfirm.constructionProgress = pendingImages.map(img => ({
          url: img.url,
          key: img.key,
          uploaded_at: img.uploaded_at
        }));
        
        await PendingImage.updateMany(
          { tempId: { $in: tempIds } },
          { $set: { status: 'active', projectId } }
        );
      }
    }
    
    // Process designImages
    if (tempImageData.designImages && Array.isArray(tempImageData.designImages)) {
      const tempIds = tempImageData.designImages
        .map(item => item.tempId)
        .filter(tempId => tempId);
      
      if (tempIds.length > 0) {
        const pendingImages = await PendingImage.find({
          tempId: { $in: tempIds },
          status: 'pending'
        });
        
        imagesToConfirm.designImages = pendingImages.map(img => ({
          url: img.url,
          key: img.key,
          uploaded_at: img.uploaded_at
        }));
        
        await PendingImage.updateMany(
          { tempId: { $in: tempIds } },
          { $set: { status: 'active', projectId } }
        );
      }
    }
    
    // Process brochure
    if (tempImageData.brochure && Array.isArray(tempImageData.brochure)) {
      const tempIds = tempImageData.brochure
        .map(item => item.tempId)
        .filter(tempId => tempId);
      
      if (tempIds.length > 0) {
        const pendingImages = await PendingImage.find({
          tempId: { $in: tempIds },
          status: 'pending'
        });
        
        imagesToConfirm.brochure = pendingImages.map(img => ({
          url: img.url,
          key: img.key,
          uploaded_at: img.uploaded_at
        }));
        
        await PendingImage.updateMany(
          { tempId: { $in: tempIds } },
          { $set: { status: 'active', projectId } }
        );
      }
    }
    
    // Cập nhật project với images đã confirmed
    const updatedProject = await projectService.confirmProjectImagesService(
      projectId,
      imagesToConfirm
    );
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Images confirmed and linked to project',
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};
// projectController.js - Thêm hàm này sau hàm createProject
export const createProjectWithConfirm = async (req, res, next) => {
  try {
    console.log('=== CREATE PROJECT WITH CONFIRM ===');
    
    const { projectData, tempImageData } = req.body;
    
    if (!projectData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'projectData is required'
      });
    }
    
    // ========== FILTER BLOB URLs ==========
    const filterBlobUrls = (array) => {
      if (!array || !Array.isArray(array)) return [];
      return array.filter(item => {
        if (!item) return false;
        
        let url;
        if (typeof item === 'object') {
          url = item.url || '';
        } else {
          url = item || '';
        }
        
        return url && !url.startsWith('blob:') && !url.startsWith('data:');
      });
    };
    
    console.log('Filtering blob URLs from project data...');
    
    // Filter all image arrays
    projectData.gallery = filterBlobUrls(projectData.gallery);
    projectData.constructionProgress = filterBlobUrls(projectData.constructionProgress);
    projectData.designImages = filterBlobUrls(projectData.designImages);
    projectData.brochure = filterBlobUrls(projectData.brochure);
    
    // Filter heroImage
    if (projectData.heroImage) {
      const heroUrl = typeof projectData.heroImage === 'object' 
        ? projectData.heroImage.url 
        : projectData.heroImage;
      
      if (heroUrl && (heroUrl.startsWith('blob:') || heroUrl.startsWith('data:'))) {
        console.log('Filtering out blob heroImage URL');
        projectData.heroImage = null;
      }
    }
    
    console.log('After filtering:');
    console.log('- Gallery:', projectData.gallery?.length || 0);
    console.log('- ConstructionProgress:', projectData.constructionProgress?.length || 0);
    console.log('- DesignImages:', projectData.designImages?.length || 0);
    console.log('- Brochure:', projectData.brochure?.length || 0);
    
    // ========== CREATE PROJECT FIRST ==========
    const projectToCreate = {
      ...projectData,
      // Không có images ban đầu, sẽ được thêm sau khi confirm
      heroImage: null,
      gallery: [],
      constructionProgress: [],
      designImages: [],
      brochure: []
    };
    
    // Tạo project trống (không có images)
    let project = await projectService.createProjectService(projectToCreate);
    console.log(`✅ Project created with ID: ${project._id}`);
    
    // ========== CONFIRM TEMP IMAGES ==========
    if (tempImageData) {
      console.log('Processing temp images...');
      
      try {
        // Process each image type
        const imagesToConfirm = {
          heroImage: null,
          gallery: [],
          constructionProgress: [],
          designImages: [],
          brochure: []
        };

        // Process heroImage
        if (tempImageData.heroImage && tempImageData.heroImage.tempId) {
          const pendingImg = await PendingImage.findOne({
            tempId: tempImageData.heroImage.tempId,
            status: 'pending'
          });
          
          if (pendingImg) {
            imagesToConfirm.heroImage = {
              url: pendingImg.url,
              key: pendingImg.key,
              uploaded_at: pendingImg.uploaded_at
            };
            
            // Update status to active
            pendingImg.status = 'active';
            pendingImg.projectId = project._id;
            await pendingImg.save();
          }
        }
        
        // Process gallery images
        if (tempImageData.gallery && Array.isArray(tempImageData.gallery)) {
          const tempIds = tempImageData.gallery
            .map(item => item.tempId)
            .filter(tempId => tempId);
          
          if (tempIds.length > 0) {
            const pendingImages = await PendingImage.find({
              tempId: { $in: tempIds },
              status: 'pending'
            });
            
            imagesToConfirm.gallery = pendingImages.map(img => ({
              url: img.url,
              key: img.key,
              uploaded_at: img.uploaded_at
            }));
            
            // Update status
            await PendingImage.updateMany(
              { tempId: { $in: tempIds } },
              { $set: { status: 'active', projectId: project._id } }
            );
          }
        }
        
        // Process constructionProgress
        if (tempImageData.constructionProgress && Array.isArray(tempImageData.constructionProgress)) {
          const tempIds = tempImageData.constructionProgress
            .map(item => item.tempId)
            .filter(tempId => tempId);
          
          if (tempIds.length > 0) {
            const pendingImages = await PendingImage.find({
              tempId: { $in: tempIds },
              status: 'pending'
            });
            
            imagesToConfirm.constructionProgress = pendingImages.map(img => ({
              url: img.url,
              key: img.key,
              uploaded_at: img.uploaded_at
            }));
            
            await PendingImage.updateMany(
              { tempId: { $in: tempIds } },
              { $set: { status: 'active', projectId: project._id } }
            );
          }
        }
        
        // Process designImages
        if (tempImageData.designImages && Array.isArray(tempImageData.designImages)) {
          const tempIds = tempImageData.designImages
            .map(item => item.tempId)
            .filter(tempId => tempId);
          
          if (tempIds.length > 0) {
            const pendingImages = await PendingImage.find({
              tempId: { $in: tempIds },
              status: 'pending'
            });
            
            imagesToConfirm.designImages = pendingImages.map(img => ({
              url: img.url,
              key: img.key,
              uploaded_at: img.uploaded_at
            }));
            
            await PendingImage.updateMany(
              { tempId: { $in: tempIds } },
              { $set: { status: 'active', projectId: project._id } }
            );
          }
        }
        
        // Process brochure
        if (tempImageData.brochure && Array.isArray(tempImageData.brochure)) {
          const tempIds = tempImageData.brochure
            .map(item => item.tempId)
            .filter(tempId => tempId);
          
          if (tempIds.length > 0) {
            const pendingImages = await PendingImage.find({
              tempId: { $in: tempIds },
              status: 'pending'
            });
            
            imagesToConfirm.brochure = pendingImages.map(img => ({
              url: img.url,
              key: img.key,
              uploaded_at: img.uploaded_at
            }));
            
            await PendingImage.updateMany(
              { tempId: { $in: tempIds } },
              { $set: { status: 'active', projectId: project._id } }
            );
          }
        }
        
        // ========== UPDATE PROJECT WITH CONFIRMED IMAGES ==========
        if (imagesToConfirm.heroImage || 
            imagesToConfirm.gallery.length > 0 ||
            imagesToConfirm.constructionProgress.length > 0 ||
            imagesToConfirm.designImages.length > 0 ||
            imagesToConfirm.brochure.length > 0) {
          
          console.log('Updating project with confirmed images...');
          console.log('- HeroImage:', imagesToConfirm.heroImage ? 'Yes' : 'No');
          console.log('- Gallery:', imagesToConfirm.gallery.length);
          console.log('- ConstructionProgress:', imagesToConfirm.constructionProgress.length);
          console.log('- DesignImages:', imagesToConfirm.designImages.length);
          console.log('- Brochure:', imagesToConfirm.brochure.length);
          
          // Update project với images đã confirmed
          project = await projectService.updateProjectService(project._id, {
            heroImage: imagesToConfirm.heroImage,
            gallery: imagesToConfirm.gallery,
            constructionProgress: imagesToConfirm.constructionProgress,
            designImages: imagesToConfirm.designImages,
            brochure: imagesToConfirm.brochure
          });
          
          console.log('✅ Project updated with confirmed images');
        }
        
      } catch (imageError) {
        console.error('Error confirming images:', imageError);
        // Nếu confirm images thất bại, xóa project và throw error
        await projectService.deleteProjectService(project._id);
        throw new Error('Failed to confirm images: ' + imageError.message);
      }
    }
    
    // ========== RESPONSE ==========
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Project created successfully with confirmed images',
      data: project
    });
    
  } catch (err) {
    console.error('Error in createProjectWithConfirm:', err);
    next(err);
  }
};