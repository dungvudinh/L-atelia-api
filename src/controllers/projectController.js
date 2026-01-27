// controllers/projectController.js
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';
import { Project } from '../models/projectModel.js';

// controllers/projectController.js - Sửa hàm createProject
export const createProject = async (req, res, next) => {
  try {
    console.log('=== CREATE PROJECT ===');
    
    // Nhận JSON trực tiếp từ body
    const projectData = req.body;
    
    console.log('Project data received:', {
      title: projectData.title,
      galleryCount: projectData.gallery?.length || 0,
      constructionProgressCount: projectData.constructionProgress?.length || 0,
      designImagesCount: projectData.designImages?.length || 0,
      brochureCount: projectData.brochure?.length || 0
    });
    
    // Chuẩn hóa dữ liệu ảnh
    const currentDate = new Date();
    
    // Hàm chuẩn hóa image object đơn giản
    const normalizeImage = (imgData) => {
      if (!imgData) return null;
      
      if (typeof imgData === 'object' && imgData.url) {
        return {
          url: imgData.url,
          uploaded_at: imgData.uploaded_at || currentDate
        };
      }
      
      if (typeof imgData === 'string') {
        return {
          url: imgData,
          uploaded_at: currentDate
        };
      }
      
      return null;
    };
    
    // Chuẩn hóa các mảng ảnh
    const normalizeImageArray = (array) => {
      if (!array || !Array.isArray(array)) return [];
      return array.map(normalizeImage).filter(img => img !== null);
    };
    
    // Tạo project object đã chuẩn hóa
    const projectToCreate = {
      title: projectData.title || '',
      description: projectData.description || '',
      status: projectData.status || 'draft',
      location: projectData.location || '',
      propertyFeatures: projectData.propertyFeatures || [],
      specifications: projectData.specifications || [],
      propertyHighlights: projectData.propertyHighlights || [],
      specialSections: projectData.specialSections || [],
      
      // Chuẩn hóa các trường ảnh
      heroImage: normalizeImage(projectData.heroImage),
      gallery: normalizeImageArray(projectData.gallery),
      constructionProgress: normalizeImageArray(projectData.constructionProgress),
      designImages: normalizeImageArray(projectData.designImages),
      brochure: normalizeImageArray(projectData.brochure),
      
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Normalized project:', {
      heroImage: projectToCreate.heroImage ? 'Yes' : 'No',
      gallery: projectToCreate.gallery.length,
      constructionProgress: projectToCreate.constructionProgress.length,
      designImages: projectToCreate.designImages.length,
      brochure: projectToCreate.brochure.length
    });
    
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
    
    // Nhận JSON trực tiếp từ body
    const updateData = req.body;
    
    console.log('Update data received:', {
      title: updateData.title,
      galleryCount: updateData.gallery?.length || 0,
      constructionProgressCount: updateData.constructionProgress?.length || 0,
      designImagesCount: updateData.designImages?.length || 0,
      brochureCount: updateData.brochure?.length || 0
    });
    
    const currentDate = new Date();
    
    // Hàm chuẩn hóa image object
    const normalizeImage = (imgData) => {
      if (!imgData) return null;
      
      if (typeof imgData === 'object' && imgData.url) {
        return {
          url: imgData.url,
          uploaded_at: imgData.uploaded_at || currentDate
        };
      }
      
      if (typeof imgData === 'string') {
        return {
          url: imgData,
          uploaded_at: currentDate
        };
      }
      
      return null;
    };
    
    // Chuẩn hóa các mảng ảnh
    const normalizeImageArray = (array) => {
      if (!array || !Array.isArray(array)) return [];
      return array.map(normalizeImage).filter(img => img !== null);
    };
    
    // Chuẩn hóa dữ liệu update
    const normalizedUpdateData = {
      updatedAt: currentDate,
      title: updateData.title,
      description: updateData.description,
      status: updateData.status,
      location: updateData.location,
      propertyFeatures: updateData.propertyFeatures || [],
      specifications: updateData.specifications || [],
      propertyHighlights: updateData.propertyHighlights || [],
      specialSections: updateData.specialSections || [],
      
      // Chuẩn hóa các trường ảnh
      heroImage: normalizeImage(updateData.heroImage),
      gallery: normalizeImageArray(updateData.gallery),
      constructionProgress: normalizeImageArray(updateData.constructionProgress),
      designImages: normalizeImageArray(updateData.designImages),
      brochure: normalizeImageArray(updateData.brochure)
    };
    
    console.log('Final update data:', {
      gallery: normalizedUpdateData.gallery.length,
      constructionProgress: normalizedUpdateData.constructionProgress.length,
      designImages: normalizedUpdateData.designImages.length,
      brochure: normalizedUpdateData.brochure.length,
      heroImage: normalizedUpdateData.heroImage ? 'Yes' : 'No'
    });
    
    const project = await projectService.updateProjectService(id, normalizedUpdateData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Update project successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const project = await projectService.deleteProjectService(req.params.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Delete project successfully',
      data: project
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