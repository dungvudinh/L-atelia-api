// controllers/projectController.js
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';
import { Project } from '../models/projectModel.js';

// controllers/projectController.js - Sửa hàm createProject
export const createProject = async (req, res, next) => {
  try {
    console.log('=== CREATE PROJECT WITH THUMBNAILS ===');
    
    const projectData = req.body;
    
    console.log('Project data received with thumbnails:', {
      title: projectData.title,
      heroImageHasThumbnail: projectData.heroImage?.thumbnailUrl ? 'Yes' : 'No',
      galleryCount: projectData.gallery?.length || 0,
      galleryWithThumbnails: projectData.gallery?.filter(img => img.thumbnailUrl)?.length || 0
    });
    
    const currentDate = new Date();
    
    // Tạo project object đã chuẩn hóa với thumbnail
    const projectToCreate = {
      title: projectData.title || '',
      description: projectData.description || '',
      status: projectData.status || 'draft',
      location: projectData.location || '',
      propertyFeatures: projectData.propertyFeatures || [],
      specifications: projectData.specifications || [],
      propertyHighlights: projectData.propertyHighlights || [],
      specialSections: projectData.specialSections || [],
      
      // Chuẩn hóa các trường ảnh với thumbnail
      heroImage: normalizeImageWithThumbnail(projectData.heroImage),
      gallery: normalizeImageArrayWithThumbnail(projectData.gallery),
      constructionProgress: normalizeImageArrayWithThumbnail(projectData.constructionProgress),
      designImages: normalizeImageArrayWithThumbnail(projectData.designImages),
      brochure: normalizeImageArrayWithThumbnail(projectData.brochure),
      
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Normalized project with thumbnails:', {
      heroImage: projectToCreate.heroImage ? (projectToCreate.heroImage.hasThumbnail ? 'Has thumbnail' : 'No thumbnail') : 'No',
      gallery: projectToCreate.gallery.length,
      galleryThumbnails: projectToCreate.gallery.filter(img => img.hasThumbnail).length
    });
    
    const project = await projectService.createProjectService(projectToCreate);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Create project successfully with thumbnails',
      data: project
    });
  } catch (err) {
    next(err);
  }
};
// controllers/projectController.js - Cập nhật getProjects
export const getProjects = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };
    
    // Chỉ lấy các trường cần thiết cho danh sách
    const projection = {
      title: 1,
      location: 1,
      status: 1,
      createdAt: 1,
      'heroImage.key': 1,
      'heroImage.thumbnailKey': 1,
      'heroImage.thumbnailSize': 1,
      'heroImage.size': 1,
      'heroImage.hasThumbnail': 1, 
      'gallery.key': 1,
      'gallery.thumbnailKey': 1,
      'gallery.thumbnailSize': 1,
      'gallery.size': 1,
      'gallery.hasThumbnail': 1, 
      location:1
    };
    
    const result = await projectService.getProjectsService(filters, projection);
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
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Log thông tin thumbnail
    console.log('Project retrieved with thumbnails:', {
      title: project.title,
      heroImageHasThumbnail: project.heroImage?.hasThumbnail || false,
      galleryThumbnails: project.gallery?.filter(img => img.hasThumbnail).length || 0,
      totalGallery: project.gallery?.length || 0
    });
    
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
    console.log('=== SERVER: UPDATE PROJECT WITH THUMBNAILS ===');
    const { id } = req.params;
    
    const updateData = req.body;
    
    console.log('Update data with thumbnails:', {
      title: updateData.title,
      heroImageHasThumbnail: updateData.heroImage?.thumbnailUrl ? 'Yes' : 'No',
      galleryThumbnails: updateData.gallery?.filter(img => img.thumbnailUrl)?.length || 0
    });
    
    const currentDate = new Date();
    
    // Chuẩn hóa dữ liệu update với thumbnail
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
      
      // Chuẩn hóa các trường ảnh với thumbnail
      heroImage: normalizeImageWithThumbnail(updateData.heroImage),
      gallery: normalizeImageArrayWithThumbnail(updateData.gallery),
      constructionProgress: normalizeImageArrayWithThumbnail(updateData.constructionProgress),
      designImages: normalizeImageArrayWithThumbnail(updateData.designImages),
      brochure: normalizeImageArrayWithThumbnail(updateData.brochure)
    };
    
    console.log('Final update data with thumbnails:', {
      gallery: normalizedUpdateData.gallery.length,
      galleryThumbnails: normalizedUpdateData.gallery.filter(img => img.hasThumbnail).length,
      constructionProgress: normalizedUpdateData.constructionProgress.length,
      constructionThumbnails: normalizedUpdateData.constructionProgress.filter(img => img.hasThumbnail).length,
      heroImage: normalizedUpdateData.heroImage ? (normalizedUpdateData.heroImage.hasThumbnail ? 'Has thumbnail' : 'No') : 'No'
    });
    
    const project = await projectService.updateProjectService(id, normalizedUpdateData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Update project successfully with thumbnails',
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
const normalizeImageWithThumbnail = (imgData) => {
  if (!imgData) return null;
  
  if (typeof imgData === 'object' && imgData.url) {
    return {
      url: imgData.url,
      thumbnailUrl: imgData.thumbnailUrl || null,
      key: imgData.key || null,
      thumbnailKey: imgData.thumbnailKey || null,
      filename: imgData.filename || 'unnamed.jpg',
      size: imgData.size || 0,
      thumbnailSize: imgData.thumbnailSize || 0,
      uploaded_at: imgData.uploaded_at || new Date(),
      hasThumbnail: imgData.hasThumbnail || !!imgData.thumbnailUrl
    };
  }
  
  if (typeof imgData === 'string') {
    return {
      url: imgData,
      filename: imgData.split('/').pop() || 'unnamed.jpg',
      uploaded_at: new Date(),
      hasThumbnail: false
    };
  }
  
  return null;
};
const normalizeImageArrayWithThumbnail = (array) => {
  if (!array || !Array.isArray(array)) return [];
  return array.map(normalizeImageWithThumbnail).filter(img => img !== null);
};