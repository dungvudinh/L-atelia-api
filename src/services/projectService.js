import { Project } from '../models/projectModel.js';
import { deleteMultipleFromB2 } from '../config/b2.js';

// services/projectService.js - Sửa hàm createProjectService
export const createProjectService = async (projectData) => {
  try {
    // Tạo project object với tất cả dữ liệu
    const project = new Project({
      title: projectData.title,
      description: projectData.description,
      status: projectData.status || 'draft',
      location: projectData.location,
      propertyFeatures: projectData.propertyFeatures || [],
      specifications: projectData.specifications || [],
      propertyHighlights: projectData.propertyHighlights || [],
      specialSections: projectData.specialSections || [],
      
      // Ảnh đã được xử lý ở controller
      heroImage: projectData.heroImage || null,
      gallery: projectData.gallery || [],
      constructionProgress: projectData.constructionProgress || [],
      designImages: projectData.designImages || [],
      brochure: projectData.brochure || [],
      
      createdAt: projectData.createdAt || new Date(),
      updatedAt: projectData.updatedAt || new Date()
    });
    
    console.log('=== SAVING PROJECT TO DATABASE ===');
    console.log('HeroImage:', project.heroImage ? 'Yes' : 'No');
    console.log('Gallery:', project.gallery.length);
    console.log('ConstructionProgress:', project.constructionProgress.length);
    console.log('DesignImages:', project.designImages.length);
    console.log('Brochure:', project.brochure.length);
    
    // Lưu vào database
    const savedProject = await project.save();
    
    console.log('✅ Project saved with ID:', savedProject._id);
    return savedProject;
  } catch (error) {
    console.error('Error in createProjectService:', error);
    throw error;
  }
};

const getProjectsService = async (filters = {}) => {
  try {
    const { search, status, page = 1, limit = 10 } = filters;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-propertyHighlights -specialSections');

    const total = await Project.countDocuments(query);

    return {
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };
  } catch (error) {
    throw error;
  }
};

const getProjectByIdService = async (id) => {
  try {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    throw error;
  }
};

const getProjectBySlugService = async (slug) => {
  try {
    const project = await Project.findOne({ slug });
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    throw error;
  }
};

// services/projectService.js - Sửa hàm updateProjectService
export const updateProjectService = async (id, projectData) => {
  try {
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    console.log('=== UPDATE SERVICE DEBUG ===');
    
    const updateFields = {
      updatedAt: new Date()
    };

    // Update basic fields
    const basicFields = [
      'title', 'description', 'status', 'location',
      'propertyFeatures', 'specifications', 
      'propertyHighlights', 'specialSections'
    ];
    
    basicFields.forEach(field => {
      if (projectData[field] !== undefined) {
        updateFields[field] = projectData[field];
      }
    });

    // ========== XỬ LÝ TẤT CẢ CÁC LOẠI ẢNH ==========
    
    // Hàm helper để xử lý image arrays
    const processImageArrayField = (fieldName, data) => {
      if (data[fieldName] !== undefined) {
        // Filter out blob URLs (chỉ giữ lại URLs từ B2)
        const validItems = (data[fieldName] || []).filter(item => {
          if (!item) return false;
          
          // Xác định URL
          let url;
          if (typeof item === 'object') {
            url = item.url || item;
          } else {
            url = item;
          }
          
          // Chỉ giữ lại URLs đã upload lên B2
          const isValid = url && !url.startsWith('blob:') && !url.startsWith('data:');
          if (!isValid && url) {
            console.log(`Filtering out blob URL from ${fieldName}: ${url.substring(0, 50)}`);
          }
          return isValid;
        });
        
        console.log(`${fieldName}: ${validItems.length} valid items`);
        updateFields[fieldName] = validItems;
      }
    };
    
    // Process ALL image array fields
    const imageArrayFields = [
      'gallery',
      'constructionProgress', 
      'designImages',
      'brochure'
    ];
    
    imageArrayFields.forEach(field => {
      processImageArrayField(field, projectData);
    });
    
    // Process heroImage (single)
    if (projectData.heroImage !== undefined) {
      if (projectData.heroImage) {
        const heroUrl = typeof projectData.heroImage === 'object' 
          ? projectData.heroImage.url 
          : projectData.heroImage;
        
        // Chỉ giữ lại nếu không phải blob URL
        if (heroUrl && !heroUrl.startsWith('blob:') && !heroUrl.startsWith('data:')) {
          updateFields.heroImage = projectData.heroImage;
          console.log('HeroImage: Valid');
        } else {
          updateFields.heroImage = null;
          console.log('HeroImage: Filtered out (blob URL)');
        }
      } else {
        updateFields.heroImage = null;
        console.log('HeroImage: Set to null');
      }
    }

    // ========== XỬ LÝ ẢNH MỚI UPLOAD ==========
    if (projectData._hasNewFiles) {
      // Hàm xóa file từ B2
      const safeDeleteFile = async (fileInfo) => {
        if (!fileInfo || !fileInfo.key) return;
        
        try {
          await deleteMultipleFromB2([fileInfo.key]);
          console.log(`Deleted old B2 file: ${fileInfo.key.substring(0, 50)}`);
        } catch (deleteError) {
          console.error('Could not delete B2 file:', deleteError.message);
        }
      };

      // Xử lý heroImage mới
      if (projectData.heroImage && updateFields.heroImage) {
        // Xóa heroImage cũ nếu có
        if (existingProject.heroImage && existingProject.heroImage.key) {
          await safeDeleteFile(existingProject.heroImage);
        }
      }

      // Xử lý các loại ảnh mới khác
      // (Controller đã merge ảnh mới vào array, nên ở đây chỉ cần lưu)
      console.log('New files were uploaded, updating image arrays');
    }

    console.log('=== FINAL UPDATE FIELDS ===');
    console.log('Gallery:', updateFields.gallery?.length || 0);
    console.log('ConstructionProgress:', updateFields.constructionProgress?.length || 0);
    console.log('DesignImages:', updateFields.designImages?.length || 0);
    console.log('Brochure:', updateFields.brochure?.length || 0);
    console.log('HeroImage:', updateFields.heroImage ? 'Yes' : 'No');

    const updatedProject = await Project.findByIdAndUpdate(
      id, 
      updateFields,
      { new: true, runValidators: true }
    );
    
    return updatedProject;
  } catch (error) {
    console.error('Error in updateProjectService:', error);
    throw error;
  }
};

const deleteProjectService = async (id) => {
  try {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Xóa files từ B2
    const keysToDelete = [];

    if (project.heroImage && project.heroImage.key) {
      keysToDelete.push(project.heroImage.key);
    }
    
    if (project.gallery) {
      project.gallery.forEach(img => {
        if (img.key) keysToDelete.push(img.key);
      });
    }
    
    if (project.constructionProgress) {
      project.constructionProgress.forEach(img => {
        if (img.key) keysToDelete.push(img.key);
      });
    }
    
    if (project.designImages) {
      project.designImages.forEach(img => {
        if (img.key) keysToDelete.push(img.key);
      });
    }
    
    if (project.brochure) {
      project.brochure.forEach(doc => {
        if (doc.key) keysToDelete.push(doc.key);
      });
    }

    if (keysToDelete.length > 0) {
      await deleteMultipleFromB2(keysToDelete);
    }

    await Project.findByIdAndDelete(id);
    
    return project;
  } catch (error) {
    throw error;
  }
};

const deleteProjectImagesService = async (id, imageType, imageUrls) => {
  try {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Xóa files từ B2
    const keysToDelete = imageUrls
      .map(item => typeof item === 'object' ? item.key : null)
      .filter(key => key !== null);

    if (keysToDelete.length > 0) {
      await deleteMultipleFromB2(keysToDelete);
    }

    const updateOperation = {};
    switch (imageType) {
      case 'gallery':
        updateOperation.gallery = project.gallery.filter(img => 
          !imageUrls.some(url => {
            const compareUrl = typeof url === 'object' ? url.url : url;
            return img.url === compareUrl;
          })
        );
        break;
        
      case 'constructionProgress':
        updateOperation.constructionProgress = project.constructionProgress.filter(img => 
          !imageUrls.some(url => {
            const compareUrl = typeof url === 'object' ? url.url : url;
            return img.url === compareUrl;
          })
        );
        break;
        
      case 'designImages':
        updateOperation.designImages = project.designImages.filter(img => 
          !imageUrls.some(url => {
            const compareUrl = typeof url === 'object' ? url.url : url;
            return img.url === compareUrl;
          })
        );
        break;
        
      default:
        throw new Error('Invalid image type');
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true }
    );

    return updatedProject;
  } catch (error) {
    throw error;
  }
};

const projectService = {
  createProjectService, 
  getProjectsService,
  getProjectByIdService,
  getProjectBySlugService,
  updateProjectService,
  deleteProjectService,
  deleteProjectImagesService
}

export default projectService;