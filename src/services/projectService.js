// const Project = require('../models/Project');
// const { fetchExternalData } = require('./externalApiService');
// import {fetchExternalData} from './'
// import {create, getProjects} from '../models/projectModel.js'
// export const createProject = async (data) => {
//   // Optional: enrich with external API
//   // const external = await fetchExternalData('/properties');
//   const project = await create(data);
//   return await project.save();
// };

// export const getAllProjects = async () => {
//  return await getProjects();
// };

// const getProjectById = async (id) => {
//   return await Project.findById(id);
// };

// const updateProject = async (id, data) => {
//   return await Project.findByIdAndUpdate(id, data, { new: true });
// };

// const deleteProject = async (id) => {
//   return await Project.findByIdAndDelete(id);
// };

import {Project} from '../models/projectModel.js';
// import { PROJECT_CREATE_SCHEMA, PROJECT_UPDATE_SCHEMA} from '../validations/projectValidation.js';
import fs from 'fs';
import path from 'path';
const validateProjectData = async (projectData, schema) => {
  return await schema.validateAsync(projectData, { 
    abortEarly: false, 
    stripUnknown: true 
  });
};

// services/projectService.js
export const createProjectService = async (projectData) => {
  try {
    const {
      title,
      description,
      status,
      location,
      details,
      featureSections,
      files
    } = projectData;

    // Tạo project object với file paths
    const project = {
      title,
      description,
      status: status || 'draft',
      location,
      details: details || {},
      featureSections: featureSections || [],
      heroImage: files.heroImage ? files.heroImage.path : null,
      gallery: files.gallery.map(file => file.path),
      floorPlans: files.floorPlans.map(file => file.path),
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
      .select('-featureSections -details'); // Exclude heavy fields for list view

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
      details,
      featureSections,
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
          // Không throw error để không ảnh hưởng đến update
        }
      }
    };

    // Tạo update object
    const updateFields = {
      title,
      description,
      status,
      location,
      details: { ...existingProject.details, ...details },
      featureSections,
      updatedAt: new Date()
    };

    // Xử lý files - XÓA ẢNH CŨ KHI CÓ ẢNH MỚI
    if (files.heroImage) {
      // Xóa heroImage cũ nếu có
      if (existingProject.heroImage) {
        safeDeleteFile(existingProject.heroImage);
      }
      updateFields.heroImage = files.heroImage.path;
    }
    
    // Xử lý gallery - THÊM ảnh mới, không xóa ảnh cũ (trừ khi có logic xóa cụ thể)
    if (files.gallery.length > 0) {
      updateFields.gallery = [
        ...existingProject.gallery,
        ...files.gallery.map(file => file.path)
      ];
    }
    
    // Tương tự cho các loại files khác
    if (files.floorPlans.length > 0) {
      updateFields.floorPlans = [
        ...existingProject.floorPlans,
        ...files.floorPlans.map(file => file.path)
      ];
    }
    
    if (files.constructionProgress.length > 0) {
      updateFields.constructionProgress = [
        ...existingProject.constructionProgress,
        ...files.constructionProgress.map(file => file.path)
      ];
    }
    
    if (files.designImages.length > 0) {
      updateFields.designImages = [
        ...existingProject.designImages,
        ...files.designImages.map(file => file.path)
      ];
    }
    
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
      case 'floorPlans':
        updateOperation.floorPlans = project.floorPlans.filter(img => !imagePaths.includes(img));
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