// import { StatusCodes } from "http-status-codes";
// import projectService from "../services/projectService.js";
// import { 
//     uploadProjectFiles,
//     deleteMultipleFromCloudinary
// } from '../config/cloudinary.js';

// export const createProject = async (req, res, next) => {
//   try {
//     console.log('=== REQUEST BODY ===', req.body);
//     console.log('=== REQUEST FILES ===', req.files);
    
//     // Parse JSON data từ field 'data'
//     let projectData = {};
//     if (req.body.data) {
//       try {
//         projectData = JSON.parse(req.body.data);
//         console.log('=== PARSED PROJECT DATA ===', projectData);
//       } catch (parseError) {
//         console.error('Error parsing JSON data:', parseError);
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: 'Invalid JSON data format'
//         });
//       }
//     }

//     // Xử lý files - Upload lên Cloudinary nếu có files
//     let uploadedFiles = {};
//     if (req.files && Object.keys(req.files).length > 0) {
//       try {
//         if (process.env.USE_CLOUDINARY === 'true') {
//           console.log('FILES', req.files)
//           // Upload lên Cloudinary
//           uploadedFiles = await uploadProjectFiles(req.files);
//         } else {
//           // Local storage - giữ nguyên structure
//           uploadedFiles = {
//             heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
//             gallery: req.files['gallery'] || [],
//             constructionProgress: req.files['constructionProgress'] || [],
//             designImages: req.files['designImages'] || [],
//             brochure: req.files['brochure'] || []
//           };
//         }
//       } catch (uploadError) {
//         console.error('File upload error:', uploadError);
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//           success: false,
//           message: 'File upload failed: ' + uploadError.message
//         });
//       }
//     }

//     // Tạo project data object để truyền vào service
//     const projectToCreate = {
//       ...projectData
//     };

//     // Thêm image URLs vào project data DƯỚI DẠNG OBJECT {url, uploaded_at}
//     if (process.env.USE_CLOUDINARY === 'true') {
//       // Cloudinary - sử dụng URLs và thêm uploaded_at
//       const currentDate = new Date();
      
//       projectToCreate.images = {
//         heroImage: uploadedFiles.heroImage ? {
//           url: uploadedFiles.heroImage.url,
//           uploaded_at: currentDate
//         } : null,
//         gallery: uploadedFiles.gallery ? uploadedFiles.gallery.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         })) : [],
//         constructionProgress: uploadedFiles.constructionProgress ? uploadedFiles.constructionProgress.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         })) : [],
//         designImages: uploadedFiles.designImages ? uploadedFiles.designImages.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         })) : [],
//         brochure: uploadedFiles.brochure ? uploadedFiles.brochure.map(doc => ({
//           url: doc.url,
//           uploaded_at: currentDate
//         })) : []
//       };
//     } else {
//       // Local storage - giữ nguyên file objects (sẽ được convert trong service)
//       projectToCreate.files = uploadedFiles;
//     }

//     console.log('=== FINAL PROJECT DATA FOR SERVICE ===', projectToCreate);

//     // Gọi service
//     const project = await projectService.createProjectService(projectToCreate);
    
//     res.status(StatusCodes.CREATED).json({
//       success: true,
//       message: 'Create project successfully',
//       data: project
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Các hàm khác giữ nguyên...
// export const getProjects = async (req, res, next) => {
//   try {
//     const filters = {
//       search: req.query.search,
//       status: req.query.status,
//       page: req.query.page,
//       limit: req.query.limit
//     };
    
//     const result = await projectService.getProjectsService(filters);
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: result
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getProjectById = async (req, res, next) => {
//   try {
//     const project = await projectService.getProjectByIdService(req.params.id);
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: project
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getProjectBySlug = async (req, res, next) => {
//   try {
//     const project = await projectService.getProjectBySlugService(req.params.slug);
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: project
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const update = async (req, res, next) => {
//   try {
//     console.log('=== UPDATE REQUEST BODY ===', req.body);
//     console.log('=== UPDATE REQUEST FILES ===', req.files);
    
//     const { id } = req.params;
    
//     // Parse JSON data từ field 'data'
//     let updateData = {};
//     if (req.body.data) {
//       try {
//         updateData = JSON.parse(req.body.data);
//         console.log('=== PARSED UPDATE DATA ===', updateData);
//       } catch (parseError) {
//         console.error('Error parsing JSON data:', parseError);
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: 'Invalid JSON data format'
//         });
//       }
//     }

//     // Xử lý files mới
//     let uploadedFiles = {};
//     if (req.files && Object.keys(req.files).length > 0) {
//       try {
//         if (process.env.USE_CLOUDINARY === 'true') {
//           uploadedFiles = await uploadProjectFiles(req.files);
//           console.log('=== CLOUDINARY UPDATE UPLOAD RESULTS ===', uploadedFiles);
//         } else {
//           uploadedFiles = {
//             heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
//             gallery: req.files['gallery'] || [],
//             constructionProgress: req.files['constructionProgress'] || [],
//             designImages: req.files['designImages'] || [],
//             brochure: req.files['brochure'] || []
//           };
//         }
//       } catch (uploadError) {
//         console.error('File upload error:', uploadError);
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//           success: false,
//           message: 'File upload failed: ' + uploadError.message
//         });
//       }
//     }

//     // Tạo update data object
//     const projectToUpdate = {
//       ...updateData,
//       _hasNewFiles: Object.keys(uploadedFiles).length > 0
//     };

//     // Thêm files mới vào update data DƯỚI DẠNG OBJECT {url, uploaded_at}
//     if (process.env.USE_CLOUDINARY === 'true') {
//       const currentDate = new Date();
      
//       if (uploadedFiles.heroImage) {
//         projectToUpdate.heroImage = {
//           url: uploadedFiles.heroImage.url,
//           uploaded_at: currentDate
//         };
//       }
//       if (uploadedFiles.gallery) {
//         projectToUpdate.gallery = uploadedFiles.gallery.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         }));
//       }
//       if (uploadedFiles.constructionProgress) {
//         projectToUpdate.constructionProgress = uploadedFiles.constructionProgress.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         }));
//       }
//       if (uploadedFiles.designImages) {
//         projectToUpdate.designImages = uploadedFiles.designImages.map(img => ({
//           url: img.url,
//           uploaded_at: currentDate
//         }));
//       }
//       if (uploadedFiles.brochure) {
//         projectToUpdate.brochure = uploadedFiles.brochure.map(doc => ({
//           url: doc.url,
//           uploaded_at: currentDate
//         }));
//       }
//     } else {
//       projectToUpdate.files = uploadedFiles;
//     }

//     console.log('=== FINAL UPDATE DATA FOR SERVICE ===', projectToUpdate);

//     // Gọi service
//     const project = await projectService.updateProjectService(id, projectToUpdate);
    
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: 'Update project successfully',
//       data: project
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const remove = async (req, res, next) => {
//   try {
//     // Lấy project trước khi xóa
//     const project = await projectService.getProjectByIdService(req.params.id);
    
//     // Xóa project từ database
//     await projectService.deleteProjectService(req.params.id);
    
//     // Xóa files từ Cloudinary nếu đang sử dụng
//     if (process.env.USE_CLOUDINARY === 'true' && project) {
//       try {
//         const urlsToDelete = [];
        
//         // Hàm extract URL từ image object
//         const extractUrl = (imageField) => {
//           if (Array.isArray(imageField)) {
//             return imageField.map(item => item.url);
//           } else if (imageField && imageField.url) {
//             return [imageField.url];
//           }
//           return [];
//         };
        
//         if (project.heroImage) urlsToDelete.push(...extractUrl(project.heroImage));
//         if (project.gallery) urlsToDelete.push(...extractUrl(project.gallery));
//         if (project.constructionProgress) urlsToDelete.push(...extractUrl(project.constructionProgress));
//         if (project.designImages) urlsToDelete.push(...extractUrl(project.designImages));
//         if (project.brochure) urlsToDelete.push(...extractUrl(project.brochure));
        
//         if (urlsToDelete.length > 0) {
//           await deleteMultipleFromCloudinary(urlsToDelete);
//           console.log(`🗑️ Deleted ${urlsToDelete.length} files from Cloudinary`);
//         }
//       } catch (cloudinaryError) {
//         console.error('Error deleting files from Cloudinary:', cloudinaryError);
//       }
//     }
    
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: 'Delete project successfully'
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const deleteImages = async (req, res, next) => {
//   try {
//     const { imageType, imageUrls } = req.body;
    
//     if (!imageType || !imageUrls || !Array.isArray(imageUrls)) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: 'imageType and imageUrls (array) are required'
//       });
//     }

//     // Xóa images từ Cloudinary nếu đang sử dụng
//     if (process.env.USE_CLOUDINARY === 'true') {
//       try {
//         // Extract URLs từ image objects
//         const urlsToDelete = imageUrls.map(url => 
//           typeof url === 'object' ? url.url : url
//         );
        
//         await deleteMultipleFromCloudinary(urlsToDelete);
//         console.log(`🗑️ Deleted ${urlsToDelete.length} ${imageType} images from Cloudinary`);
//       } catch (cloudinaryError) {
//         console.error('Error deleting images from Cloudinary:', cloudinaryError);
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//           success: false,
//           message: 'Failed to delete images from storage'
//         });
//       }
//     }

//     const project = await projectService.deleteProjectImagesService(
//       req.params.id, 
//       imageType, 
//       imageUrls
//     );
    
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: 'Delete images successfully',
//       data: project
//     });
//   } catch (err) {
//     next(err);
//   }
// };
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';

export const createProject = async (req, res, next) => {
  try {
    let projectData = {};
    if (req.body.data) {
      try {
        projectData = JSON.parse(req.body.data);
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
      // Nhóm files theo fieldname từ req.b2Files
      uploadedFiles = {
        heroImage: req.b2Files.find(file => file.key.includes('heroImage')) || null,
        gallery: req.b2Files.filter(file => file.key.includes('gallery')) || [],
        constructionProgress: req.b2Files.filter(file => file.key.includes('constructionProgress')) || [],
        designImages: req.b2Files.filter(file => file.key.includes('designImages')) || [],
        brochure: req.b2Files.filter(file => file.key.includes('brochure')) || []
      };
    }

    // Tạo project data object để truyền vào service
    const projectToCreate = {
      ...projectData
    };

    // Thêm image URLs vào project data
    const currentDate = new Date();
    
    projectToCreate.images = {
      heroImage: uploadedFiles.heroImage ? {
        url: uploadedFiles.heroImage.url,
        key: uploadedFiles.heroImage.key,
        path: uploadedFiles.heroImage.path,
        uploaded_at: currentDate
      } : null,
      gallery: uploadedFiles.gallery ? uploadedFiles.gallery.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate
      })) : [],
      constructionProgress: uploadedFiles.constructionProgress ? uploadedFiles.constructionProgress.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate
      })) : [],
      designImages: uploadedFiles.designImages ? uploadedFiles.designImages.map(img => ({
        url: img.url,
        key: img.key,
        path: img.path,
        uploaded_at: currentDate
      })) : [],
      brochure: uploadedFiles.brochure ? uploadedFiles.brochure.map(doc => ({
        url: doc.url,
        key: doc.key,
        path: doc.path,
        uploaded_at: currentDate
      })) : []
    };

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