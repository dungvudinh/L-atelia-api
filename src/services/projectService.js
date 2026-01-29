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

const getProjectsService = async (filters = {}, projection = {}) => {
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

    // Sử dụng projection để chỉ lấy các trường cần thiết
    const projects = await Project.find(query, projection)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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

    console.log('=== UPDATE SERVICE WITH THUMBNAILS ===');
    
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

    // ========== XỬ LÝ TẤT CẢ CÁC LOẠI ẢNH VỚI THUMBNAIL ==========
    
    // Hàm helper để xử lý image arrays với thumbnail
    const processImageArrayFieldWithThumbnail = (fieldName, data) => {
      if (data[fieldName] !== undefined) {
        // Filter out blob URLs và giữ lại cả original và thumbnail
        const validItems = (data[fieldName] || []).filter(item => {
          if (!item) return false;
          
          // Xác định URL original
          let url;
          if (typeof item === 'object') {
            url = item.url || item;
          } else {
            url = item;
          }
          
          // Chỉ giữ lại URLs đã upload lên B2 (không phải blob/data URLs)
          const isValid = url && !url.startsWith('blob:') && !url.startsWith('data:');
          return isValid;
        });
        
        console.log(`${fieldName}: ${validItems.length} valid items`);
        console.log(`${fieldName} thumbnails: ${validItems.filter(item => item.thumbnailUrl).length} items have thumbnails`);
        
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
      processImageArrayFieldWithThumbnail(field, projectData);
    });
    
    // Process heroImage (single) với thumbnail
    if (projectData.heroImage !== undefined) {
      if (projectData.heroImage) {
        // Kiểm tra heroImage object
        if (typeof projectData.heroImage === 'object') {
          const heroUrl = projectData.heroImage.url;
          const hasThumbnail = !!projectData.heroImage.thumbnailUrl;
          
          // Chỉ giữ lại nếu không phải blob URL
          if (heroUrl && !heroUrl.startsWith('blob:') && !heroUrl.startsWith('data:')) {
            updateFields.heroImage = projectData.heroImage;
            console.log(`HeroImage: Valid ${hasThumbnail ? 'with thumbnail' : 'no thumbnail'}`);
          } else {
            updateFields.heroImage = null;
            console.log('HeroImage: Filtered out (blob URL)');
          }
        } else if (typeof projectData.heroImage === 'string') {
          // Nếu là string URL (legacy)
          if (!projectData.heroImage.startsWith('blob:') && !projectData.heroImage.startsWith('data:')) {
            updateFields.heroImage = {
              url: projectData.heroImage,
              filename: projectData.heroImage.split('/').pop() || 'hero.jpg',
              uploaded_at: new Date(),
              hasThumbnail: false
            };
            console.log('HeroImage: String URL (legacy, no thumbnail)');
          }
        }
      } else {
        updateFields.heroImage = null;
        console.log('HeroImage: Set to null');
      }
    }

    console.log('=== FINAL UPDATE FIELDS WITH THUMBNAILS ===');
    console.log('HeroImage hasThumbnail:', updateFields.heroImage?.hasThumbnail || false);
    console.log('Gallery items:', updateFields.gallery?.length || 0);
    console.log('Gallery thumbnails:', updateFields.gallery?.filter(img => img.hasThumbnail).length || 0);
    console.log('ConstructionProgress thumbnails:', updateFields.constructionProgress?.filter(img => img.hasThumbnail).length || 0);

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