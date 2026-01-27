// controllers/projectController.js - Thêm hàm mới
export const uploadProjectImage = async (req, res, next) => {
  try {
    console.log('=== UPLOAD PROJECT IMAGE REQUEST ===');
    console.log('Body:', req.body);
    
    if (!req.b2Files || req.b2Files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadedFile = req.b2Files[0];
    const { imageType, projectId } = req.body;
    
    // Validate image type
    const validImageTypes = [
      'heroImage', 
      'gallery', 
      'constructionProgress', 
      'designImages', 
      'brochure'
    ];
    
    if (!validImageTypes.includes(imageType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid image type. Must be one of: ${validImageTypes.join(', ')}`
      });
    }

    // Tạo cấu trúc image object theo schema
    const imageObject = {
      url: uploadedFile.url,
      uploaded_at: new Date()
    };

    // Nếu có projectId, cập nhật luôn vào database
    if (projectId) {
      let updateOperation;
      
      switch (imageType) {
        case 'heroImage':
          updateOperation = { $set: { heroImage: imageObject } };
          break;
        case 'gallery':
        case 'constructionProgress':
        case 'designImages':
        case 'brochure':
          updateOperation = { $push: { [imageType]: imageObject } };
          break;
      }
      
      if (updateOperation) {
        await Project.findByIdAndUpdate(projectId, updateOperation, { new: true });
      }
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Project image uploaded successfully',
      data: {
        ...imageObject,
        key: uploadedFile.key,
        path: uploadedFile.path,
        name: uploadedFile.originalname,
        type: uploadedFile.mimetype,
        size: uploadedFile.size,
        imageType: imageType
      }
    });
  } catch (err) {
    console.error('Upload project image error:', err);
    next(err);
  }
};