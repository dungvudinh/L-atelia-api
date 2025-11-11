// services/bookingService.js
import Booking from '../models/bookingModel.js';
import Rent from '../models/rentModel.js';

class BookingService {
  // GET ALL BOOKINGS WITH PAGINATION AND FILTERS
  async getAllBookings({ page = 1, limit = 10, search = '', status, paymentStatus }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      let query = {};
      
      if (search) {
        query.$or = [
          { bookingNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.email': { $regex: search, $options: 'i' } },
          { 'property.title': { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }
      
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
      
      const bookings = await Booking.find(query)
        .populate('propertyId', 'title location price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Booking.countDocuments(query);
      
      return {
        bookings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // GET BOOKING BY ID
  async getBookingById(id) {
    try {
      const booking = await Booking.findById(id).populate('propertyId', 'title location price beds bedrooms bathrooms');
      return booking;
    } catch (error) {
      throw error;
    }
  }

  // CREATE NEW BOOKING
  async createBooking(bookingData) {
    try {
      // Generate booking number
      const bookingCount = await Booking.countDocuments();
      const bookingNumber = `BK-${(bookingCount + 1).toString().padStart(4, '0')}`;
      
      const booking = new Booking({
        ...bookingData,
        bookingNumber
      });
      
      await booking.save();
      return await booking.populate('propertyId', 'title location price');
    } catch (error) {
      throw error;
    }
  }

  // UPDATE BOOKING
  async updateBooking(id, bookingData) {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { 
          ...bookingData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      ).populate('propertyId', 'title location price');
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return booking;
    } catch (error) {
      throw error;
    }
  }

  // DELETE BOOKING
  async deleteBooking(id) {
    try {
      const booking = await Booking.findByIdAndDelete(id);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return booking;
    } catch (error) {
      throw error;
    }
  }

  // CHECK PROPERTY AVAILABILITY
  async checkAvailability(propertyId, checkIn, checkOut, excludeBookingId = null) {
    try {
      const property = await Rent.findById(propertyId);
      
      if (!property) {
        return {
          success: false,
          message: 'Property not found'
        };
      }
      
      if (property.status !== 'available') {
        return {
          success: false,
          message: 'Property is not available for booking',
          data: { available: false }
        };
      }
      
      // Check for overlapping bookings
      const query = {
        propertyId,
        status: { $in: ['confirmed', 'pending'] }, // Only consider active bookings
        $or: [
          // Existing booking starts during requested period
          { checkIn: { $gte: new Date(checkIn), $lt: new Date(checkOut) } },
          // Existing booking ends during requested period
          { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
          // Existing booking completely contains requested period
          { 
            checkIn: { $lte: new Date(checkIn) },
            checkOut: { $gte: new Date(checkOut) }
          }
        ]
      };
      
      // Exclude current booking when updating
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }
      
      const overlappingBookings = await Booking.find(query);
      
      const available = overlappingBookings.length === 0;
      
      return {
        success: true,
        data: {
          available,
          property: {
            id: property._id,
            title: property.title,
            location: property.location,
            price: property.price,
            priceUnit: property.priceUnit
          },
          conflictingBookings: available ? [] : overlappingBookings
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // UPDATE BOOKING STATUS
  async updateBookingStatus(id, status) {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { 
          status,
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('propertyId', 'title location price');
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return booking;
    } catch (error) {
      throw error;
    }
  }

  // UPDATE PAYMENT STATUS
  async updatePaymentStatus(id, paymentStatus) {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { 
          paymentStatus,
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('propertyId', 'title location price');
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return booking;
    } catch (error) {
      throw error;
    }
  }
}

export default new BookingService();