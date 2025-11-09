import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
export const createProject = async (req, res, next) => {
  try {
    console.log('=== REQUEST BODY ===', req.body);
    console.log('=== REQUEST FILES ===', req.files);
    
    // Parse JSON data từ field 'data'
    let projectData = {};
    if (req.body.data) {
      try {
        projectData = JSON.parse(req.body.data);
        console.log('=== PARSED PROJECT DATA ===', projectData);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON data format'
        });
      }
    }

    // Xử lý files
    const files = {
      heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
      gallery: req.files['gallery'] || [],
      floorPlans: req.files['floorPlans'] || [],
      constructionProgress: req.files['constructionProgress'] || [],
      designImages: req.files['designImages'] || [],
      brochure: req.files['brochure'] || []
    };

    console.log('=== PROCESSED FILES ===', files);

    // Tạo project data object để truyền vào service
    const projectToCreate = {
      ...projectData,
      files: files
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
// controllers/projectController.js
export const update = async (req, res, next) => {
  try {
    console.log('=== UPDATE REQUEST BODY ===', req.body);
    console.log('=== UPDATE REQUEST FILES ===', req.files);
    
    const { id } = req.params;
    
    // Parse JSON data từ field 'data' (giống như create)
    let updateData = {};
    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
        console.log('=== PARSED UPDATE DATA ===', updateData);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON data format'
        });
      }
    }

    // Xử lý files (nếu có file mới upload)
    const files = {
      heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
      gallery: req.files['gallery'] || [],
      floorPlans: req.files['floorPlans'] || [],
      constructionProgress: req.files['constructionProgress'] || [],
      designImages: req.files['designImages'] || [],
      brochure: req.files['brochure'] || []
    };

    console.log('=== PROCESSED UPDATE FILES ===', files);

    // Tạo update data object
    const projectToUpdate = {
      ...updateData,
      files: files
    };

    // Gọi service
    const project = await projectService.updateProjectService(id, projectToUpdate);
    
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
    await projectService.deleteProjectService(req.params.id);
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
    const { imageType, imagePaths } = req.body;
    const project = await projectService.deleteProjectImagesService(req.params.id, imageType, imagePaths);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Delete images successfully',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

  


