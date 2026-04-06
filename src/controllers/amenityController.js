// controllers/amenityController.js
import { StatusCodes } from "http-status-codes";
import rentService from '../services/rentService.js';

export const getAllAmenities = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    
    const result = await rentService.getAllAmenities({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.amenities,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all amenities error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch amenities'
    });
  }
};

export const getAmenityById = async (req, res) => {
  try {
    const { id } = req.params;
    const amenity = await rentService.getAmenityById(id);
    
    if (!amenity) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Amenity not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: amenity
    });
  } catch (error) {
    console.error('Get amenity by id error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to fetch amenity'
    });
  }
};

export const createAmenity = async (req, res) => {
  try {
    const amenityData = req.body;
    
    const newAmenity = await rentService.createAmenity(amenityData);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Amenity created successfully',
      data: newAmenity
    });
  } catch (error) {
    console.error('Create amenity error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create amenity'
    });
  }
};

export const updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const amenityData = req.body;
    
    const updatedAmenity = await rentService.updateAmenity(id, amenityData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Amenity updated successfully',
      data: updatedAmenity
    });
  } catch (error) {
    console.error('Update amenity error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update amenity'
    });
  }
};

export const deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    
    await rentService.deleteAmenity(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Amenity deleted successfully'
    });
  } catch (error) {
    console.error('Delete amenity error:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to delete amenity'
    });
  }
};