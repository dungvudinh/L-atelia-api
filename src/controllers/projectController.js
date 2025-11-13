import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { 
    uploadProjectFiles,
    deleteMultipleFromCloudinary
} from '../config/cloudinary.js';

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

    // Xử lý files - Upload lên Cloudinary nếu có files
    let uploadedFiles = {};
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        if (process.env.USE_CLOUDINARY === 'true') {
          console.log('FILES', req.files)
          // Upload lên Cloudinary
          uploadedFiles = await uploadProjectFiles(req.files);
        } else {
          // Local storage - giữ nguyên structure
          uploadedFiles = {
            heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
            gallery: req.files['gallery'] || [],
            constructionProgress: req.files['constructionProgress'] || [],
            designImages: req.files['designImages'] || [],
            brochure: req.files['brochure'] || []
          };
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'File upload failed: ' + uploadError.message
        });
      }
    }

    // Tạo project data object để truyền vào service
    const projectToCreate = {
      ...projectData
    };

    // Thêm image URLs vào project data
    if (process.env.USE_CLOUDINARY === 'true') {
      // Cloudinary - sử dụng URLs
      projectToCreate.images = {
        heroImage: uploadedFiles.heroImage ? uploadedFiles.heroImage.url : null,
        gallery: uploadedFiles.gallery ? uploadedFiles.gallery.map(img => img.url) : [],
        constructionProgress: uploadedFiles.constructionProgress ? uploadedFiles.constructionProgress.map(img => img.url) : [],
        designImages: uploadedFiles.designImages ? uploadedFiles.designImages.map(img => img.url) : [],
        brochure: uploadedFiles.brochure ? uploadedFiles.brochure.map(doc => doc.url) : []
      };
    } else {
      // Local storage - giữ nguyên file objects
      projectToCreate.files = uploadedFiles;
    }

    console.log('=== FINAL PROJECT DATA FOR SERVICE ===', projectToCreate);

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

// Các hàm khác giữ nguyên...
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
    console.log('=== UPDATE REQUEST BODY ===', req.body);
    console.log('=== UPDATE REQUEST FILES ===', req.files);
    
    const { id } = req.params;
    
    // Parse JSON data từ field 'data'
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

    // Xử lý files mới
    let uploadedFiles = {};
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        if (process.env.USE_CLOUDINARY === 'true') {
          uploadedFiles = await uploadProjectFiles(req.files);
          console.log('=== CLOUDINARY UPDATE UPLOAD RESULTS ===', uploadedFiles);
        } else {
          uploadedFiles = {
            heroImage: req.files['heroImage'] ? req.files['heroImage'][0] : null,
            gallery: req.files['gallery'] || [],
            constructionProgress: req.files['constructionProgress'] || [],
            designImages: req.files['designImages'] || [],
            brochure: req.files['brochure'] || []
          };
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'File upload failed: ' + uploadError.message
        });
      }
    }

    // Tạo update data object
    const projectToUpdate = {
      ...updateData,
      _hasNewFiles: Object.keys(uploadedFiles).length > 0
    };

    // Thêm files mới vào update data
    if (process.env.USE_CLOUDINARY === 'true') {
      if (uploadedFiles.heroImage) projectToUpdate.heroImage = uploadedFiles.heroImage.url;
      if (uploadedFiles.gallery) projectToUpdate.gallery = uploadedFiles.gallery.map(img => img.url);
      if (uploadedFiles.constructionProgress) projectToUpdate.constructionProgress = uploadedFiles.constructionProgress.map(img => img.url);
      if (uploadedFiles.designImages) projectToUpdate.designImages = uploadedFiles.designImages.map(img => img.url);
      if (uploadedFiles.brochure) projectToUpdate.brochure = uploadedFiles.brochure.map(doc => doc.url);
    } else {
      projectToUpdate.files = uploadedFiles;
    }

    console.log('=== FINAL UPDATE DATA FOR SERVICE ===', projectToUpdate);

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
    // Lấy project trước khi xóa
    const project = await projectService.getProjectByIdService(req.params.id);
    
    // Xóa project từ database
    await projectService.deleteProjectService(req.params.id);
    
    // Xóa files từ Cloudinary nếu đang sử dụng
    if (process.env.USE_CLOUDINARY === 'true' && project) {
      try {
        const urlsToDelete = [];
        
        if (project.heroImage) urlsToDelete.push(project.heroImage);
        if (project.gallery && project.gallery.length > 0) urlsToDelete.push(...project.gallery);
        if (project.constructionProgress && project.constructionProgress.length > 0) urlsToDelete.push(...project.constructionProgress);
        if (project.designImages && project.designImages.length > 0) urlsToDelete.push(...project.designImages);
        if (project.brochure && project.brochure.length > 0) urlsToDelete.push(...project.brochure);
        
        if (urlsToDelete.length > 0) {
          await deleteMultipleFromCloudinary(urlsToDelete);
          console.log(`🗑️ Deleted ${urlsToDelete.length} files from Cloudinary`);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting files from Cloudinary:', cloudinaryError);
      }
    }
    
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
    const { imageType, imageUrls } = req.body;
    
    if (!imageType || !imageUrls || !Array.isArray(imageUrls)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'imageType and imageUrls (array) are required'
      });
    }

    // Xóa images từ Cloudinary nếu đang sử dụng
    if (process.env.USE_CLOUDINARY === 'true') {
      try {
        await deleteMultipleFromCloudinary(imageUrls);
        console.log(`🗑️ Deleted ${imageUrls.length} ${imageType} images from Cloudinary`);
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to delete images from storage'
        });
      }
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