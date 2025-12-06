import { Project } from '../models/projectModel.js';
import { deleteMultipleFromB2 } from '../config/b2.js';

export const createProjectService = async (projectData) => {
  try {
    const {
      title,
      description,
      status,
      location,
      propertyFeatures,
      specifications,
      propertyHighlights,
      specialSections,
      images
    } = projectData;

    // Tạo project object
    const project = {
      title,
      description,
      status: status || 'draft',
      location,
      propertyFeatures: propertyFeatures || [],
      specifications: specifications || [],
      propertyHighlights: propertyHighlights || [],
      specialSections: specialSections || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Xử lý images từ B2
    project.heroImage = images?.heroImage || null;
    project.gallery = images?.gallery || [];
    project.constructionProgress = images?.constructionProgress || [];
    project.designImages = images?.designImages || [];
    project.brochure = images?.brochure || [];
    
    // Lưu vào database
    const newProject = await Project.create(project);
    return newProject;
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

export const updateProjectService = async (id, projectData) => {
  try {
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    const {
      title,
      description,
      status,
      location,
      propertyFeatures,
      specifications,
      propertyHighlights,
      specialSections,
      heroImage,
      gallery,
      constructionProgress,
      designImages,
      brochure,
      _hasNewFiles
    } = projectData;

    const updateFields = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (location !== undefined) updateFields.location = location;
    if (propertyFeatures !== undefined) updateFields.propertyFeatures = propertyFeatures;
    if (specifications !== undefined) updateFields.specifications = specifications;
    if (propertyHighlights !== undefined) updateFields.propertyHighlights = propertyHighlights;
    if (specialSections !== undefined) updateFields.specialSections = specialSections;

    // Xử lý images mới từ B2
    if (_hasNewFiles) {
      // Hàm xóa file từ B2
      const safeDeleteFile = async (fileInfo) => {
        if (!fileInfo || !fileInfo.key) return;
        
        try {
          await deleteMultipleFromB2([fileInfo.key]);
        } catch (deleteError) {
          console.error('Could not delete B2 file:', deleteError.message);
        }
      };

      if (heroImage !== undefined) {
        if (existingProject.heroImage) {
          await safeDeleteFile(existingProject.heroImage);
        }
        updateFields.heroImage = heroImage;
      }

      if (gallery && Array.isArray(gallery) && gallery.length > 0) {
        const existingGallery = existingProject.gallery || [];
        updateFields.gallery = [...existingGallery, ...gallery];
      }

      if (constructionProgress && Array.isArray(constructionProgress) && constructionProgress.length > 0) {
        const existingProgress = existingProject.constructionProgress || [];
        updateFields.constructionProgress = [...existingProgress, ...constructionProgress];
      }

      if (designImages && Array.isArray(designImages) && designImages.length > 0) {
        const existingDesigns = existingProject.designImages || [];
        updateFields.designImages = [...existingDesigns, ...designImages];
      }

      if (brochure && Array.isArray(brochure) && brochure.length > 0) {
        const existingBrochures = existingProject.brochure || [];
        updateFields.brochure = [...existingBrochures, ...brochure];
      }
    }

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