// controllers/bookingController.js
import bookingService from '../services/bookingService.js';

export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, paymentStatus } = req.query;
    
    const result = await bookingService.getAllBookings({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      paymentStatus
    });
    
    res.json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bookings'
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by id error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking'
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Check property availability
    const availability = await bookingService.checkAvailability(
      bookingData.propertyId,
      bookingData.checkIn,
      bookingData.checkOut
    );
    
    if (!availability.success || !availability.data.available) {
      return res.status(400).json({
        success: false,
        message: 'Property is not available for the selected dates'
      });
    }
    
    const newBooking = await bookingService.createBooking(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const bookingData = req.body;
    
    // If dates are being updated, check availability (excluding current booking)
    if (bookingData.checkIn || bookingData.checkOut) {
      const existingBooking = await bookingService.getBookingById(id);
      const availability = await bookingService.checkAvailability(
        bookingData.propertyId || existingBooking.propertyId,
        bookingData.checkIn || existingBooking.checkIn,
        bookingData.checkOut || existingBooking.checkOut,
        id
      );
      
      if (!availability.success || !availability.data.available) {
        return res.status(400).json({
          success: false,
          message: 'Property is not available for the selected dates'
        });
      }
    }
    
    const updatedBooking = await bookingService.updateBooking(id, bookingData);
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update booking'
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    await bookingService.deleteBooking(id);
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete booking'
    });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, excludeBookingId } = req.query;
    
    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, check-in, and check-out dates are required'
      });
    }
    
    const availability = await bookingService.checkAvailability(
      propertyId,
      checkIn,
      checkOut,
      excludeBookingId
    );
    
    res.json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to check availability'
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedBooking = await bookingService.updateBookingStatus(id, status);
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update booking status'
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const updatedBooking = await bookingService.updatePaymentStatus(id, paymentStatus);
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
};

export const sendBookingEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailType } = req.body;
    
    // In a real application, you would integrate with an email service
    // For now, we'll just simulate sending an email
    
    const booking = await bookingService.getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Simulate email sending
    console.log(`Sending ${emailType} email to ${booking.customer.email}`);
    
    res.json({
      success: true,
      message: `${emailType} email sent successfully to ${booking.customer.email}`
    });
  } catch (error) {
    console.error('Send booking email error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
};