// services/bookingService.js
import Booking from '../models/bookingModel.js';
import Rent from '../models/rentModel.js';
import { generateBookingNumber } from '../utils/helpers.js';

export const getAllBookings = async (filters = {}) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status 
    } = filters;

    const query = {};
    
    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('propertyId', 'title location price featuredImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    return {
      bookings,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getBookingById = async (id) => {
  try {
    const booking = await Booking.findById(id)
      .populate('propertyId', 'title location price priceUnit');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  } catch (error) {
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const bookingNumber = await generateBookingNumber();
    
    const property = await Rent.findById(bookingData.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Tính total amount
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * property.price;

    const booking = new Booking({
      ...bookingData,
      bookingNumber,
      totalAmount
    });

    const savedBooking = await booking.save();
    await savedBooking.populate('propertyId', 'title location price');
    
    return savedBooking;
  } catch (error) {
    throw error;
  }
};

export const updateBooking = async (id, bookingData) => {
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Nếu cập nhật dates hoặc property, tính lại total amount
    if (bookingData.checkIn || bookingData.checkOut || bookingData.propertyId) {
      const propertyId = bookingData.propertyId || booking.propertyId;
      const checkIn = bookingData.checkIn ? new Date(bookingData.checkIn) : booking.checkIn;
      const checkOut = bookingData.checkOut ? new Date(bookingData.checkOut) : booking.checkOut;

      const property = await Rent.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      bookingData.totalAmount = nights * property.price;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { ...bookingData, updatedAt: new Date() },
      { new: true }
    ).populate('propertyId', 'title location price');

    return updatedBooking;
  } catch (error) {
    throw error;
  }
};

export const deleteBooking = async (id) => {
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    await Booking.findByIdAndDelete(id);
    return booking;
  } catch (error) {
    throw error;
  }
};

export const checkAvailability = async (propertyId, checkIn, checkOut, excludeBookingId = null) => {
  try {
    const property = await Rent.findById(propertyId);
    if (!property) {
      return {
        success: false,
        message: 'Property not found'
      };
    }

    const searchCheckIn = new Date(checkIn);
    const searchCheckOut = new Date(checkOut);

    // Tìm booking trùng
    const query = {
      propertyId,
      status: { $in: [ 'confirmed'] },
      $or: [
        { 
          checkIn: { $lt: searchCheckOut }, 
          checkOut: { $gt: searchCheckIn } 
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const overlappingBookings = await Booking.find(query);
    const available = overlappingBookings.length === 0;

    return {
      success: true,
      data: {
        available,
        nights: Math.ceil((searchCheckOut - searchCheckIn) / (1000 * 60 * 60 * 24)),
        totalAmount: available ? Math.ceil((searchCheckOut - searchCheckIn) / (1000 * 60 * 60 * 24)) * property.price : 0
      }
    };
  } catch (error) {
    throw error;
  }
};

export const updateBookingStatus = async (id, status) => {
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    return updatedBooking;
  } catch (error) {
    throw error;
  }
};

const bookingService = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
  updateBookingStatus
};

export default bookingService;