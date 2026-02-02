import { StatusCodes } from "http-status-codes";
import rentService from '../services/rentService.js';
import { 
  deleteFileFromB2,
  deleteMultipleFromB2
} from '../config/b2.js';

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
    
    // ✅ Ensure featuredImage has isFeatured = true
    if (rentalData.featuredImage && typeof rentalData.featuredImage === 'object') {
      rentalData.featuredImage.isFeatured = true;
    }
    
    // ✅ Ensure gallery images have correct isFeatured
    if (rentalData.gallery && Array.isArray(rentalData.gallery)) {
      rentalData.gallery = rentalData.gallery.map(img => ({
        ...img,
        isFeatured: (rentalData.featuredImage && img.id === rentalData.featuredImage.id) || false
      }));
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
    
    // ✅ Same logic for update
    if (rentalData.featuredImage && typeof rentalData.featuredImage === 'object') {
      rentalData.featuredImage.isFeatured = true;
    }
    
    if (rentalData.gallery && Array.isArray(rentalData.gallery)) {
      rentalData.gallery = rentalData.gallery.map(img => ({
        ...img,
        isFeatured: (rentalData.featuredImage && img.id === rentalData.featuredImage.id) || false
      }));
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
    
    // Get rental first to delete associated images từ B2
    const rental = await rentService.getRentalById(id);
    
    if (rental && rental.gallery) {
      // Delete all gallery images từ B2
      const keysToDelete = rental.gallery
        .filter(image => image.key)
        .map(image => image.key);
      
      if (keysToDelete.length > 0) {
        await deleteMultipleFromB2(keysToDelete);
        console.log(`🗑️ Deleted ${keysToDelete.length} rental images from B2`);
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
    
    if (!req.b2Files || req.b2Files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedImages = req.b2Files.map((b2File) => ({
      id: Date.now() + Math.random(),
      url: b2File.url,
      key: b2File.key,
      filename: b2File.key.split('/').pop() || `image-${Date.now()}`,
      size: b2File.size,
      isFeatured: false,
      uploadedAt: new Date(),
      storage: 'b2'
    }));

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

    // Delete image từ B2
    if (image.key) {
      await deleteFileFromB2(image.key);
      console.log(`🗑️ Deleted rental image from B2: ${image.key}`);
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