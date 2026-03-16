// controllers/projectController.js
import { StatusCodes } from "http-status-codes";
import projectService from "../services/projectService.js";
import { deleteMultipleFromB2 } from '../config/b2.js';
import { Project } from '../models/projectModel.js';
import nodemailer from 'nodemailer';
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
      youtubeLinks: normalizeYouTubeLinks(projectData.youtubeLinks),

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
      galleryThumbnails: projectToCreate.gallery.filter(img => img.hasThumbnail).length,
       youtubeLinks: projectToCreate.youtubeLinks.length // Thêm log youtubeLinks
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
      price:1,
      type:1,
      status: 1,
      createdAt: 1,
      propertyFeatures:1,
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
      location:1,
      youtubeLinks: 1
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
      totalGallery: project.gallery?.length || 0,
       youtubeLinksCount: project.youtubeLinks?.length || 0 // Thêm log youtubeLinks
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
    const { id } = req.params;
    
    const updateData = req.body;
    
    console.log(updateData)
    
    const currentDate = new Date();
    
    // Chuẩn hóa dữ liệu update với thumbnail
    const normalizedUpdateData = {
      updatedAt: currentDate,
      title: updateData.title,
      description: updateData.description,
      status: updateData.status,
      type:updateData.type,
      price:updateData.price,
      location: updateData.location,
      propertyFeatures: updateData.propertyFeatures || [],
      specifications: updateData.specifications || [],
      propertyHighlights: updateData.propertyHighlights || [],
      specialSections: updateData.specialSections || [],
       youtubeLinks: normalizeYouTubeLinks(updateData.youtubeLinks),
      // Chuẩn hóa các trường ảnh với thumbnail
      heroImage: normalizeImageWithThumbnail(updateData.heroImage),
      gallery: normalizeImageArrayWithThumbnail(updateData.gallery),
      constructionProgress: normalizeImageArrayWithThumbnail(updateData.constructionProgress),
      designImages: normalizeImageArrayWithThumbnail(updateData.designImages),
      brochure: normalizeImageArrayWithThumbnail(updateData.brochure)
    };
    
    
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
const normalizeYouTubeLinks = (links) => {
  if (!links || !Array.isArray(links)) return [];
  
  return links
    .filter(link => link && link.url && link.url.trim() !== '')
    .map(link => ({
      id: link.id || `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: link.url.trim()
    }));
};
export const submitProjectContactForm = async (req, res) => {
  try {
      const { projectId } = req.params;
      const {
          firstName,
          lastName,
          email,
          phone,
          projectTitle // Chỉ có 5 trường này
      } = req.body;
      
      console.log('Received project contact form:', {
          projectId,
          firstName,
          lastName,
          email,
          phone,
          projectTitle
      });
      
      // Validate required fields - CHỈ VALIDATE 4 TRƯỜNG
      if (!firstName || !lastName || !email || !phone) {
          return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'All fields (first name, last name, email, phone) are required'
          });
      }

      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
          }
      });

      // Email cho admin
      const adminMailOptions = {
          from: email,
          to: process.env.PROJECT_CONTACT_EMAIL || process.env.SMTP_USER,
          subject: `[PROJECT INQUIRY] New Lead for ${projectTitle}`,
          html: `
              <!DOCTYPE html>
              <html>
              <head>
                  <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background: #2f5855; color: white; padding: 20px; text-align: center; }
                      .project-info { background: #4a7a75; color: white; padding: 15px; margin-top: 20px; }
                      .content { background: #f9f9f9; padding: 20px; }
                      .field { margin-bottom: 15px; }
                      .label { font-weight: bold; color: #2f5855; }
                      .value { margin-top: 5px; }
                      .highlight { background: #e8f4f3; padding: 10px; border-radius: 5px; }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>🎯 New Project Lead</h1>
                          <p>Potential client interested in your project</p>
                      </div>
                      
                      <div class="content">
                          <div class="highlight">
                              <h3 style="margin-top: 0; color: #2f5855;">📋 Project Information</h3>
                              <div class="field">
                                  <div class="label">Project Title:</div>
                                  <div class="value"><strong>${projectTitle}</strong></div>
                              </div>
                              <div class="field">
                                  <div class="label">Project ID:</div>
                                  <div class="value">${projectId}</div>
                              </div>
                          </div>

                          <h3 style="color: #2f5855; margin-top: 30px;">👤 Client Details</h3>
                          <div class="field">
                              <div class="label">Full Name:</div>
                              <div class="value">${firstName} ${lastName}</div>
                          </div>
                          <div class="field">
                              <div class="label">Email:</div>
                              <div class="value">${email}</div>
                          </div>
                          <div class="field">
                              <div class="label">Phone:</div>
                              <div class="value">${phone}</div>
                          </div>
                          <div class="field">
                              <div class="label">Submitted At:</div>
                              <div class="value">${new Date().toLocaleString()}</div>
                          </div>
                      </div>
                      
                      <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;">
                          <strong>💡 Action Required:</strong> Please contact this lead within 24 hours.
                      </div>
                  </div>
              </body>
              </html>
          `
      };

      // Email cho khách hàng
      const customerMailOptions = {
          from: process.env.SMTP_FROM || `"LATELIA" <${process.env.SMTP_USER}>`,
          to: email,
          replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
          subject: `Cảm ơn bạn đã quan tâm đến dự án ${projectTitle}`,
          html: `
              <!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background-color: #2f5855; color: white; padding: 30px 20px; text-align: center; border-radius: 5px 5px 0 0; }
                      .project-highlight { background: #f8f9fa; border-left: 4px solid #2f5855; padding: 15px; margin: 20px 0; }
                      .content { padding: 30px 20px; }
                      .contact-box { background: #e8f4f3; padding: 20px; border-radius: 5px; margin: 25px 0; }
                      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
                      .btn { display: inline-block; background: #2f5855; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                  </style>
              </head>
              <body>
                  <div class="header">
                      <h1 style="margin: 0; font-size: 28px;">LATELIA</h1>
                      <p style="margin: 5px 0 0; opacity: 0.9;">Bất động sản cao cấp</p>
                  </div>
                  
                  <div class="content">
                      <div style="font-size: 18px; margin-bottom: 20px;">
                          Kính gửi Anh/Chị <strong>${firstName} ${lastName}</strong>,
                      </div>
                      
                      <div class="project-highlight">
                          <h3 style="color: #2f5855; margin-top: 0;">Cảm ơn bạn đã quan tâm đến dự án:</h3>
                          <h2 style="color: #333; margin: 10px 0;">${projectTitle}</h2>
                      </div>
                      
                      <div style="margin-bottom: 20px;">
                          Chúng tôi đã nhận được thông tin liên hệ của bạn. Một chuyên viên tư vấn của LATELIA sẽ liên hệ với bạn trong thời gian sớm nhất để:
                      </div>
                      
                      <ul style="margin: 20px 0; padding-left: 20px;">
                          <li>Tư vấn chi tiết về dự án ${projectTitle}</li>
                          <li>Cung cấp thông tin giá và chính sách ưu đãi</li>
                          <li>Hỗ trợ đặt lịch tham quan thực tế</li>
                          <li>Giải đáp mọi thắc mắc của bạn</li>
                      </ul>
                      
                      <div class="contact-box">
                          <h4 style="color: #2f5855; margin-top: 0;">📞 Liên hệ ngay nếu cần hỗ trợ gấp:</h4>
                          <div style="margin: 10px 0;">
                              <strong>Chuyên viên tư vấn:</strong> Mr Tùng
                          </div>
                          <div style="margin: 10px 0;">
                              <strong>Hotline/Zalo:</strong> 096 428 2298
                          </div>
                          <div style="margin: 10px 0;">
                              <strong>Email:</strong> latelia.sale@gmail.com
                          </div>
                          <div style="margin: 10px 0;">
                              <strong>Giờ làm việc:</strong> Thứ 2 - Thứ 6: 10:00-14:00 & 16:00-20:00
                          </div>
                      </div>
                      
                      <div style="margin-top: 30px; font-style: italic; color: #666;">
                          "Chúng tôi cam kết mang đến cho bạn những trải nghiệm dịch vụ tốt nhất và những lựa chọn đầu tư thông minh nhất."
                      </div>
                      
                      <div style="margin-top: 40px;">
                          <strong>Trân trọng,</strong><br>
                          <strong>Mr Tùng</strong> / Giám đốc Kinh doanh<br>
                          <strong>LATELIA</strong>
                      </div>
                  </div>
                  
                  <div class="footer">
                      <p><strong>LATELIA - Premium Real Estate</strong></p>
                      <p>📞 Hotline: 096 428 2298</p>
                      <p>🌐 Website: <a href="https://www.latelia.com" style="color: #2f5855;">www.latelia.com</a></p>
                      <p>📧 Email: <a href="mailto:latelia.sale@gmail.com" style="color: #2f5855;">latelia.sale@gmail.com</a></p>
                  </div>
              </body>
              </html>
          `
      };

      // Send emails
      await transporter.sendMail(adminMailOptions);
      await transporter.sendMail(customerMailOptions);

      res.status(StatusCodes.OK).json({
          success: true,
          message: 'Project inquiry submitted successfully',
          data: {
              projectId,
              projectTitle,
              customerName: `${firstName} ${lastName}`,
              customerEmail: email,
              customerPhone: phone
          }
      });

  } catch (error) {
      console.error('Error submitting project contact form:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to submit project inquiry',
          error: error.message
      });
  }
};