// controllers/rentController.js
import rentService from '../services/rentService.js';
import { deleteFile } from '../config/multer.js';

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
    
    res.json({
      success: true,
      data: result.rentals,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all rentals error:', error);
    res.status(500).json({
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
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Get rental by id error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rental'
    });
  }
};

export const createRental = async (req, res) => {
  try {
    const rentalData = req.body;
    
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
    
    const newRental = await rentService.createRental(rentalData);
    
    res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: newRental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create rental'
    });
  }
};

export const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rentalData = req.body;
    
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
    
    res.json({
      success: true,
      message: 'Rental updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(400).json({
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
      // Delete all gallery images
      rental.gallery.forEach(image => {
        if (image.url) {
          const filename = image.url.split('/').pop();
          const filePath = `uploads/rent/${filename}`;
          deleteFile(filePath);
        }
      });
    }
    
    await rentService.deleteRental(id);
    
    res.json({
      success: true,
      message: 'Rental deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete rental'
    });
  }
};

export const uploadRentalImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const uploadedImages = req.files.map(file => ({
      id: Date.now() + Math.random(),
      url: `/uploads/rent/${file.filename}`,
      name: file.originalname,
      isFeatured: false
    }));
    
    const updatedRental = await rentService.uploadRentalImages(id, uploadedImages);
    
    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Upload rental images error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};

export const deleteRentalImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Get rental first to find image path
    const rental = await rentService.getRentalById(id);
    const image = rental.gallery.find(img => img.id === imageId);
    
    if (image && image.url) {
      const filename = image.url.split('/').pop();
      const filePath = `uploads/rent/${filename}`;
      deleteFile(filePath);
    }
    
    const updatedRental = await rentService.deleteRentalImage(id, imageId);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Delete rental image error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
};

export const setFeaturedImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageId } = req.body;
    
    const updatedRental = await rentService.setFeaturedImage(id, imageId);
    
    res.json({
      success: true,
      message: 'Featured image updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Set featured image error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set featured image'
    });
  }
};

export const updateRentalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedRental = await rentService.updateRentalStatus(id, status);
    
    res.json({
      success: true,
      message: 'Rental status updated successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Update rental status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update rental status'
    });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const updatedRental = await rentService.toggleFeatured(id, featured);
    
    res.json({
      success: true,
      message: `Rental ${featured ? 'marked as' : 'removed from'} featured`,
      data: updatedRental
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to toggle featured'
    });
  }
};