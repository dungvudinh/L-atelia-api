import { StatusCodes } from "http-status-codes";
import rentService from '../services/rentService.js';
import { 
  uploadRentFiles,
  deleteFromCloudinaryByUrl,
  deleteMultipleFromCloudinary
} from '../config/cloudinary.js';

export const getAllRentals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, featured } = req.query;
    
    const result = await rentService.getAllRentals({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      featured
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.rentals,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all rentals error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch rentals'
    });
  }
};

export const getRentalById = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await rentService.getRentalById(id);
    
    if (!rental) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Get rental by id error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch rental'
    });
  }
};

export const createRental = async (req, res) => {
  try {
    const rentalData = req.body;
    
    // Parse array fields from string to array
    if (rentalData.beds && !rentalData.adultBeds) {
      rentalData.adultBeds = rentalData.beds;
      delete rentalData.beds;
    }
    if (rentalData.highlights && typeof rentalData.highlights === 'string') {
      rentalData.highlights = JSON.parse(rentalData.highlights);
    }
    
    if (rentalData.amenities && typeof rentalData.amenities === 'string') {
      rentalData.amenities = JSON.parse(rentalData.amenities);
    }
    
    if (rentalData.gallery && typeof rentalData.gallery === 'string') {
      rentalData.gallery = JSON.parse(rentalData.gallery);
    }
    
    if (rentalData.contactInfo && typeof rentalData.contactInfo === 'string') {
      rentalData.contactInfo = JSON.parse(rentalData.contactInfo);
    }
    
    const newRental = await rentService.createRental(rentalData);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Rental created successfully',
      data: newRental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create rental'
    });
  }
};

export const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rentalData = req.body;
    if (rentalData.beds && !rentalData.adultBeds) {
      rentalData.adultBeds = rentalData.beds;
      delete rentalData.beds;
    }
    // Parse array fields from string to array
    if (rentalData.highlights && typeof rentalData.highlights === 'string') {
      rentalData.highlights = JSON.parse(rentalData.highlights);
    }
    
    if (rentalData.amenities && typeof rentalData.amenities === 'string') {
      rentalData.amenities = JSON.parse(rentalData.amenities);
    }
    
    if (rentalData.gallery && typeof rentalData.gallery === 'string') {
      rentalData.gallery = JSON.parse(rentalData.gallery);
    }
    
    if (rentalData.contactInfo && typeof rentalData.contactInfo === 'string') {
      rentalData.contactInfo = JSON.parse(rentalData.contactInfo);
    }
    
    const updatedRental = await rentService.updateRental(id, rentalData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Rental updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update rental'
    });
  }
};

export const deleteRental = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get rental first to delete associated images
    const rental = await rentService.getRentalById(id);
    
    if (rental && rental.gallery) {
      // Delete all gallery images from Cloudinary or local
      if (process.env.USE_CLOUDINARY === 'true') {
        const imageUrls = rental.gallery
          .filter(image => image.url)
          .map(image => image.url);
        
        if (imageUrls.length > 0) {
          await deleteMultipleFromCloudinary(imageUrls);
          console.log(`🗑️ Deleted ${imageUrls.length} rental images from Cloudinary`);
        }
      } else {
        // Local storage
        const { deleteFile } = await import('../config/multer.js');
        rental.gallery.forEach(image => {
          if (image.url) {
            const filename = image.url.split('/').pop();
            const filePath = `uploads/rent/${filename}`;
            deleteFile(filePath);
          }
        });
      }
    }
    
    await rentService.deleteRental(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Rental deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to delete rental'
    });
  }
};

export const uploadRentalImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    let uploadedImages = [];

    if (process.env.USE_CLOUDINARY === 'true') {
      // Upload to Cloudinary
      const cloudinaryResults = await uploadRentFiles(req.files);
      
      uploadedImages = cloudinaryResults.map((result, index) => ({
        id: Date.now() + Math.random(),
        url: result.url,
        name: req.files[index].originalname,
        isFeatured: false,
        cloudinaryPublicId: result.publicId,
        size: result.size
      }));
    } else {
      // Local storage
      uploadedImages = req.files.map(file => ({
        id: Date.now() + Math.random(),
        url: `/uploads/rent/${file.filename}`,
        name: file.originalname,
        isFeatured: false,
        size: file.size
      }));
    }
    
    const updatedRental = await rentService.uploadRentalImages(id, uploadedImages);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        rental: updatedRental,
        uploadedImages: uploadedImages
      }
    });
  } catch (error) {
    console.error('Upload rental images error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};

export const deleteRentalImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Get rental first to find image
    const rental = await rentService.getRentalById(id);
    const image = rental.gallery.find(img => img.id === imageId);
    
    if (!image) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete image from Cloudinary or local
    if (process.env.USE_CLOUDINARY === 'true') {
      if (image.url) {
        await deleteFromCloudinaryByUrl(image.url);
      }
    } else {
      // Local storage
      const { deleteFile } = await import('../config/multer.js');
      if (image.url) {
        const filename = image.url.split('/').pop();
        const filePath = `uploads/rent/${filename}`;
        deleteFile(filePath);
      }
    }
    
    const updatedRental = await rentService.deleteRentalImage(id, imageId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Image deleted successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Delete rental image error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
};

export const setFeaturedImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'imageId is required'
      });
    }
    
    const updatedRental = await rentService.setFeaturedImage(id, imageId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Featured image updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Set featured image error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to set featured image'
    });
  }
};

export const updateRentalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const updatedRental = await rentService.updateRentalStatus(id, status);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Rental status updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Update rental status error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update rental status'
    });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    if (typeof featured !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Featured must be a boolean value'
      });
    }
    
    const updatedRental = await rentService.toggleFeatured(id, featured);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Rental ${featured ? 'marked as' : 'removed from'} featured`,
      data: updatedRental
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to toggle featured'
    });
  }
};
