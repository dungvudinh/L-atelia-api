// services/projectService.js (backend)
import { Project } from '../models/projectModel.js';

export const createProjectService = async (projectData) => {
  try {
    console.log('=== CREATE PROJECT SERVICE ===');
    
    // Format image data từ URLs
    const formatImageData = (imageData, isArray = false) => {
      if (!imageData) return isArray ? [] : null;
      
      if (isArray && Array.isArray(imageData)) {
        return imageData.map(item => {
          if (typeof item === 'object' && item.url) {
            return {
              url: item.url,
              key: item.key || extractKeyFromUrl(item.url),
              uploaded_at: new Date(),
              name: item.filename || extractFilenameFromUrl(item.url),
              type: item.type || getMimeTypeFromUrl(item.url)
            };
          }
          return {
            url: item,
            key: extractKeyFromUrl(item),
            uploaded_at: new Date(),
            name: extractFilenameFromUrl(item),
            type: getMimeTypeFromUrl(item)
          };
        });
      }
      
      // Single image (heroImage)
      if (typeof imageData === 'object' && imageData.url) {
        return {
          url: imageData.url,
          key: imageData.key || extractKeyFromUrl(imageData.url),
          uploaded_at: new Date(),
          name: imageData.filename || extractFilenameFromUrl(imageData.url),
          type: imageData.type || getMimeTypeFromUrl(imageData.url)
        };
      } else if (typeof imageData === 'string') {
        return {
          url: imageData,
          key: extractKeyFromUrl(imageData),
          uploaded_at: new Date(),
          name: extractFilenameFromUrl(imageData),
          type: getMimeTypeFromUrl(imageData)
        };
      }
      
      return null;
    };
    
    const projectToCreate = {
      title: projectData.title,
      description: projectData.description,
      status: projectData.status || 'draft',
      location: projectData.location,
      propertyFeatures: projectData.propertyFeatures || [],
      specifications: projectData.specifications || [],
      propertyHighlights: projectData.propertyHighlights || [],
      specialSections: projectData.specialSections || [],
      
      // Format image URLs từ FolderManager
      heroImage: formatImageData(projectData.heroImage, false),
      gallery: formatImageData(projectData.gallery, true),
      constructionProgress: formatImageData(projectData.constructionProgress, true),
      designImages: formatImageData(projectData.designImages, true),
      brochure: formatImageData(projectData.brochure, true),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating project with:', {
      title: projectToCreate.title,
      gallery: projectToCreate.gallery.length,
      constructionProgress: projectToCreate.constructionProgress.length,
      designImages: projectToCreate.designImages.length,
      brochure: projectToCreate.brochure.length
    });
    
    const newProject = await Project.create(projectToCreate);
    return newProject;
  } catch (error) {
    console.error('Error in createProjectService:', error);
    throw error;
  }
};

export const updateProjectService = async (id, projectData) => {
  try {
    console.log('=== UPDATE PROJECT SERVICE ===');
    
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }
    
    // Format image data (tương tự như create)
    const formatImageData = (imageData, isArray = false) => {
      if (!imageData) return isArray ? [] : null;
      
      if (isArray && Array.isArray(imageData)) {
        return imageData.map(item => {
          if (typeof item === 'object' && item.url) {
            return {
              url: item.url,
              key: item.key || extractKeyFromUrl(item.url),
              uploaded_at: new Date(),
              name: item.filename || extractFilenameFromUrl(item.url),
              type: item.type || getMimeTypeFromUrl(item.url)
            };
          }
          return {
            url: item,
            key: extractKeyFromUrl(item),
            uploaded_at: new Date(),
            name: extractFilenameFromUrl(item),
            type: getMimeTypeFromUrl(item)
          };
        });
      }
      
      // Single image
      if (typeof imageData === 'object' && imageData.url) {
        return {
          url: imageData.url,
          key: imageData.key || extractKeyFromUrl(imageData.url),
          uploaded_at: new Date(),
          name: imageData.filename || extractFilenameFromUrl(imageData.url),
          type: imageData.type || getMimeTypeFromUrl(imageData.url)
        };
      } else if (typeof imageData === 'string') {
        return {
          url: imageData,
          key: extractKeyFromUrl(imageData),
          uploaded_at: new Date(),
          name: extractFilenameFromUrl(imageData),
          type: getMimeTypeFromUrl(imageData)
        };
      }
      
      return null;
    };
    
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
    
    // Update image fields nếu có
    if (projectData.heroImage !== undefined) {
      updateFields.heroImage = formatImageData(projectData.heroImage, false);
    }
    
    if (projectData.gallery !== undefined) {
      updateFields.gallery = formatImageData(projectData.gallery, true);
    }
    
    if (projectData.constructionProgress !== undefined) {
      updateFields.constructionProgress = formatImageData(projectData.constructionProgress, true);
    }
    
    if (projectData.designImages !== undefined) {
      updateFields.designImages = formatImageData(projectData.designImages, true);
    }
    
    if (projectData.brochure !== undefined) {
      updateFields.brochure = formatImageData(projectData.brochure, true);
    }
    
    console.log('Updating project with:', {
      gallery: updateFields.gallery?.length || 0,
      constructionProgress: updateFields.constructionProgress?.length || 0,
      designImages: updateFields.designImages?.length || 0,
      brochure: updateFields.brochure?.length || 0
    });
    
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

// Các hàm service khác giữ nguyên
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

const deleteProjectService = async (id) => {
  try {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    throw error;
  }
};

// Helper functions
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
  } catch (e) {
    return null;
  }
};

const extractFilenameFromUrl = (url) => {
  if (!url) return 'unknown';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

const getMimeTypeFromUrl = (url) => {
  if (!url) return 'image/*';
  
  const extension = url.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[extension] || 'image/*';
};

const projectService = {
  createProjectService, 
  getProjectsService,
  getProjectByIdService,
  getProjectBySlugService,
  updateProjectService,
  deleteProjectService
}

export default projectService;