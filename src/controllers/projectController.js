// controllers/projectController.js
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";

export const createProject = async (req, res, next) => {
  try {
    
    // Nhận JSON thuần từ request body
    const projectData = req.body;
    
    console.log('Project data received:', {
      title: projectData.title,
      description: projectData.description?.length,
      location: projectData.location,
      gallery: projectData.gallery?.length || 0,
      constructionProgress: projectData.constructionProgress?.length || 0,
      designImages: projectData.designImages?.length || 0,
      brochure: projectData.brochure?.length || 0,
      heroImage: projectData.heroImage ? 'Yes' : 'No'
    });
    
    // Validate URLs (đảm bảo URLs hợp lệ từ FolderManager)
    const validateImageUrls = (images) => {
      if (!images) return images;
      
      if (Array.isArray(images)) {
        return images.filter(img => {
          if (!img || typeof img !== 'object') return false;
          
          // Chỉ chấp nhận URLs đã có sẵn từ FolderManager
          const url = img.url || img;
          return url && 
                 (url.startsWith('http') || 
                  url.startsWith('https') || 
                  url.startsWith('/uploads'));
        });
      }
      
      return images;
    };
    
    // Filter các URLs không hợp lệ
    const filteredData = {
      ...projectData,
      heroImage: validateImageUrls(projectData.heroImage),
      gallery: validateImageUrls(projectData.gallery),
      constructionProgress: validateImageUrls(projectData.constructionProgress),
      designImages: validateImageUrls(projectData.designImages),
      brochure: validateImageUrls(projectData.brochure)
    };
    
    console.log('Filtered data counts:', {
      gallery: filteredData.gallery?.length || 0,
      constructionProgress: filteredData.constructionProgress?.length || 0,
      designImages: filteredData.designImages?.length || 0,
      brochure: filteredData.brochure?.length || 0
    });
    
    // Gọi service
    const project = await projectService.createProjectService(filteredData);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    console.log('=== UPDATE PROJECT (JSON ONLY) ===');
    const { id } = req.params;
    
    // Nhận JSON thuần từ request body
    const updateData = req.body;
    
    console.log('Update data received:', {
      id,
      gallery: updateData.gallery?.length || 0,
      constructionProgress: updateData.constructionProgress?.length || 0,
      designImages: updateData.designImages?.length || 0,
      brochure: updateData.brochure?.length || 0,
      heroImage: updateData.heroImage ? 'Yes' : 'No'
    });
    
    // Validate và filter URLs
    const validateImageUrls = (images) => {
      if (!images) return images;
      
      if (Array.isArray(images)) {
        return images.filter(img => {
          if (!img || typeof img !== 'object') return false;
          
          const url = img.url || img;
          return url && 
                 (url.startsWith('http') || 
                  url.startsWith('https') || 
                  url.startsWith('/uploads'));
        });
      }
      
      // Single image (heroImage)
      if (typeof images === 'object') {
        const url = images.url || images;
        if (url && (url.startsWith('http') || url.startsWith('https') || url.startsWith('/uploads'))) {
          return images;
        }
      }
      
      return null;
    };
    
    const filteredData = {
      ...updateData,
      heroImage: validateImageUrls(updateData.heroImage),
      gallery: validateImageUrls(updateData.gallery),
      constructionProgress: validateImageUrls(updateData.constructionProgress),
      designImages: validateImageUrls(updateData.designImages),
      brochure: validateImageUrls(updateData.brochure)
    };
    
    console.log('Filtered update data counts:', {
      gallery: filteredData.gallery?.length || 0,
      constructionProgress: filteredData.constructionProgress?.length || 0,
      designImages: filteredData.designImages?.length || 0,
      brochure: filteredData.brochure?.length || 0
    });
    
    // Gọi service
    const project = await projectService.updateProjectService(id, filteredData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Project updated successfully',
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

export const remove = async (req, res, next) => {
  try {
    await projectService.deleteProjectService(req.params.id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};