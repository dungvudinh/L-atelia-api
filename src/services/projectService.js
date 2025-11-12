import {Project} from '../models/projectModel.js';
import fs from 'fs';

// services/projectService.js
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
      files
    } = projectData;

    // Tạo project object với file paths - ĐÃ LOẠI BỎ floorPlans
    const project = {
      title,
      description,
      status: status || 'draft',
      location,
      propertyFeatures: propertyFeatures || [],
      specifications: specifications || [],
      propertyHighlights: propertyHighlights || [],
      specialSections: specialSections || [],
      heroImage: files.heroImage ? files.heroImage.path : null,
      gallery: files.gallery.map(file => file.path),
      constructionProgress: files.constructionProgress.map(file => file.path),
      designImages: files.designImages.map(file => file.path),
      brochure: files.brochure.map(file => file.path)
    };

    console.log('Creating project with data:', project);
    
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
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-propertyHighlights -specialSections'); // Exclude heavy fields for list view

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

// services/projectService.js
export const updateProjectService = async (id, projectData) => {
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
      files
    } = projectData;

    // Tìm project hiện tại
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Hàm xóa file an toàn
    const safeDeleteFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old file: ${filePath}`);
        } catch (deleteError) {
          console.error(`⚠️ Could not delete file ${filePath}:`, deleteError.message);
        }
      }
    };

    // Tạo update object với cấu trúc mới
    const updateFields = {
      title,
      description,
      status,
      location,
      propertyFeatures: propertyFeatures || [],
      specifications: specifications || [],
      propertyHighlights: propertyHighlights || [],
      specialSections: specialSections || [],
      updatedAt: new Date()
    };

    // Xử lý files - ĐÃ LOẠI BỎ floorPlans
    if (files.heroImage) {
      if (existingProject.heroImage) {
        safeDeleteFile(existingProject.heroImage);
      }
      updateFields.heroImage = files.heroImage.path;
    }
    
    // Xử lý gallery - THÊM ảnh mới
    if (files.gallery.length > 0) {
      updateFields.gallery = [
        ...existingProject.gallery,
        ...files.gallery.map(file => file.path)
      ];
    }
    
    // Xử lý construction progress
    if (files.constructionProgress.length > 0) {
      updateFields.constructionProgress = [
        ...existingProject.constructionProgress,
        ...files.constructionProgress.map(file => file.path)
      ];
    }
    
    // Xử lý design images
    if (files.designImages.length > 0) {
      updateFields.designImages = [
        ...existingProject.designImages,
        ...files.designImages.map(file => file.path)
      ];
    }
    
    // Xử lý brochure
    if (files.brochure.length > 0) {
      updateFields.brochure = [
        ...existingProject.brochure,
        ...files.brochure.map(file => file.path)
      ];
    }

    console.log('Updating project with data:', updateFields);
    
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
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    throw error;
  }
};

const deleteProjectImagesService = async (id, imageType, imagePaths) => {
  try {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    const updateOperation = {};
    switch (imageType) {
      case 'gallery':
        updateOperation.gallery = project.gallery.filter(img => !imagePaths.includes(img));
        break;
      case 'constructionProgress':
        updateOperation.constructionProgress = project.constructionProgress.filter(img => !imagePaths.includes(img));
        break;
      case 'designImages':
        updateOperation.designImages = project.designImages.filter(img => !imagePaths.includes(img));
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