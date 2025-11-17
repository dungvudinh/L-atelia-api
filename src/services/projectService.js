import { Project } from '../models/projectModel.js';
import fs from 'fs';

// services/projectService.js
export const createProjectService = async (projectData) => {
  try {
    console.log('=== CREATE PROJECT SERVICE ===');
    console.log('Project Data:', projectData);

    const {
      title,
      description,
      status,
      location,
      propertyFeatures,
      specifications,
      propertyHighlights,
      specialSections,
      files,        // Local storage
      images        // Cloudinary storage
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

    // Xử lý images - LUÔN LƯU DƯỚI DẠNG OBJECT {url, uploaded_at}
    if (files) {
      // Local storage format - convert thành object với uploaded_at
      const currentDate = new Date();
      
      project.heroImage = files.heroImage ? {
        url: files.heroImage.path,
        uploaded_at: currentDate
      } : null;
      
      project.gallery = files.gallery ? files.gallery.map(file => ({
        url: file.path,
        uploaded_at: currentDate
      })) : [];
      
      project.constructionProgress = files.constructionProgress ? files.constructionProgress.map(file => ({
        url: file.path,
        uploaded_at: currentDate
      })) : [];
      
      project.designImages = files.designImages ? files.designImages.map(file => ({
        url: file.path,
        uploaded_at: currentDate
      })) : [];
      
      project.brochure = files.brochure ? files.brochure.map(file => ({
        url: file.path,
        uploaded_at: currentDate
      })) : [];
      
    } else if (images) {
      // Cloudinary storage format - đã có uploaded_at từ controller
      project.heroImage = images.heroImage || null;
      project.gallery = images.gallery || [];
      project.constructionProgress = images.constructionProgress || [];
      project.designImages = images.designImages || [];
      project.brochure = images.brochure || [];
    } else {
      // No images
      project.heroImage = null;
      project.gallery = [];
      project.constructionProgress = [];
      project.designImages = [];
      project.brochure = [];
    }

    console.log('Final Project Object:', project);
    
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
    console.log(id)
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

// services/projectService.js - UPDATE VỚI OBJECT {url, uploaded_at}
export const updateProjectService = async (id, projectData) => {
  try {
    console.log('=== UPDATE PROJECT SERVICE ===');
    console.log('Project ID:', id);
    console.log('Update Data:', projectData);

    // Tìm project hiện tại
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
      _hasNewFiles,
      files  // Local storage backup
    } = projectData;

    // Tạo update object
    const updateFields = {
      updatedAt: new Date()
    };

    // Cập nhật các field cơ bản
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (location !== undefined) updateFields.location = location;
    if (propertyFeatures !== undefined) updateFields.propertyFeatures = propertyFeatures;
    if (specifications !== undefined) updateFields.specifications = specifications;
    if (propertyHighlights !== undefined) updateFields.propertyHighlights = propertyHighlights;
    if (specialSections !== undefined) updateFields.specialSections = specialSections;

    // Xử lý images - LUÔN LƯU DƯỚI DẠNG OBJECT {url, uploaded_at}
    if (_hasNewFiles) {
      console.log('=== PROCESSING NEW FILES ===');

      // Hàm xóa file local an toàn
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

      // Xử lý heroImage
      if (heroImage !== undefined) {
        // Xóa heroImage cũ nếu là local file
        if (existingProject.heroImage && existingProject.heroImage.url && existingProject.heroImage.url.startsWith('/uploads/')) {
          safeDeleteFile(existingProject.heroImage.url);
        }
        updateFields.heroImage = heroImage;
        console.log('Updated heroImage:', heroImage);
      }

      // Xử lý gallery (thêm vào gallery hiện tại)
      if (gallery && Array.isArray(gallery) && gallery.length > 0) {
        const existingGallery = existingProject.gallery || [];
        updateFields.gallery = [...existingGallery, ...gallery];
        console.log('Updated gallery - Total images:', updateFields.gallery.length);
      }

      // Xử lý constructionProgress (thêm vào constructionProgress hiện tại)
      if (constructionProgress && Array.isArray(constructionProgress) && constructionProgress.length > 0) {
        const existingProgress = existingProject.constructionProgress || [];
        updateFields.constructionProgress = [...existingProgress, ...constructionProgress];
        console.log('Updated constructionProgress - Total images:', updateFields.constructionProgress.length);
      }

      // Xử lý designImages (thêm vào designImages hiện tại)
      if (designImages && Array.isArray(designImages) && designImages.length > 0) {
        const existingDesigns = existingProject.designImages || [];
        updateFields.designImages = [...existingDesigns, ...designImages];
        console.log('Updated designImages - Total images:', updateFields.designImages.length);
      }

      // Xử lý brochure (thêm vào brochure hiện tại)
      if (brochure && Array.isArray(brochure) && brochure.length > 0) {
        const existingBrochures = existingProject.brochure || [];
        updateFields.brochure = [...existingBrochures, ...brochure];
        console.log('Updated brochure - Total files:', updateFields.brochure.length);
      }

      // Fallback: xử lý local files nếu có
      if (files && files.heroImage) {
        if (existingProject.heroImage && existingProject.heroImage.url) {
          safeDeleteFile(existingProject.heroImage.url);
        }
        updateFields.heroImage = {
          url: files.heroImage.path,
          uploaded_at: new Date()
        };
      }
    }

    console.log('Final Update Fields:', updateFields);

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

    // Xóa files local nếu có
    const safeDeleteFile = (filePath) => {
      if (filePath && filePath.startsWith('/uploads/') && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted file: ${filePath}`);
        } catch (deleteError) {
          console.error(`⚠️ Could not delete file ${filePath}:`, deleteError.message);
        }
      }
    };

    // Xóa tất cả files local
    if (project.heroImage && project.heroImage.url) safeDeleteFile(project.heroImage.url);
    if (project.gallery) project.gallery.forEach(img => safeDeleteFile(img.url));
    if (project.constructionProgress) project.constructionProgress.forEach(img => safeDeleteFile(img.url));
    if (project.designImages) project.designImages.forEach(img => safeDeleteFile(img.url));
    if (project.brochure) project.brochure.forEach(doc => safeDeleteFile(doc.url));

    // Xóa project từ database
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

    // Xóa files local nếu có
    const safeDeleteFile = (filePath) => {
      if (filePath && filePath.startsWith('/uploads/') && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted file: ${filePath}`);
        } catch (deleteError) {
          console.error(`⚠️ Could not delete file ${filePath}:`, deleteError.message);
        }
      }
    };

    const updateOperation = {};
    switch (imageType) {
      case 'gallery':
        // Xóa files local
        imageUrls.forEach(url => {
          const fileUrl = typeof url === 'object' ? url.url : url;
          if (fileUrl.startsWith('/uploads/')) {
            safeDeleteFile(fileUrl);
          }
        });
        updateOperation.gallery = project.gallery.filter(img => 
          !imageUrls.some(url => {
            const compareUrl = typeof url === 'object' ? url.url : url;
            return img.url === compareUrl;
          })
        );
        break;
      case 'constructionProgress':
        imageUrls.forEach(url => {
          const fileUrl = typeof url === 'object' ? url.url : url;
          if (fileUrl.startsWith('/uploads/')) {
            safeDeleteFile(fileUrl);
          }
        });
        updateOperation.constructionProgress = project.constructionProgress.filter(img => 
          !imageUrls.some(url => {
            const compareUrl = typeof url === 'object' ? url.url : url;
            return img.url === compareUrl;
          })
        );
        break;
      case 'designImages':
        imageUrls.forEach(url => {
          const fileUrl = typeof url === 'object' ? url.url : url;
          if (fileUrl.startsWith('/uploads/')) {
            safeDeleteFile(fileUrl);
          }
        });
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