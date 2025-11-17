// controllers/bookingController.js
import bookingService from '../services/bookingService.js';

export const getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status
    } = req.query;
    
    const result = await bookingService.getAllBookings({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status
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

export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log('📥 Received booking request:', {
      propertyId: bookingData.propertyId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      customer: bookingData.customer?.email
    });

    // Set default dates nếu không có
    if (!bookingData.checkIn || !bookingData.checkOut) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      bookingData.checkIn = bookingData.checkIn || tomorrow;
      bookingData.checkOut = bookingData.checkOut || threeDaysLater;
      
      console.log('🕐 Set default dates:', {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut
      });
    }
    
    // Luôn set status là pending cho booking từ contact form
    bookingData.status = 'pending';
    bookingData.paymentStatus = 'pending';

    // Check property availability (CHỈ kiểm tra confirmed bookings)
    if (bookingData.checkIn && bookingData.checkOut) {
      console.log('🔍 Checking availability...');
      
      const availability = await bookingService.checkAvailability(
        bookingData.propertyId,
        bookingData.checkIn,
        bookingData.checkOut
      );
      
      console.log('📊 Availability result:', {
        success: availability.success,
        available: availability.data?.available,
        conflictingBookings: availability.data?.conflictingBookings?.length || 0
      });
      
      // Nếu có lỗi khi check availability
      if (!availability.success) {
        console.error('❌ Availability check failed:', availability.message);
        return res.status(400).json({
          success: false,
          message: availability.message || 'Error checking property availability'
        });
      }
      
      // CHỈ block nếu có confirmed booking trùng
      // Vẫn cho phép tạo pending booking ngay cả khi có pending khác
      if (!availability.data.available) {
        console.warn('⚠️ Property not available - conflicting with confirmed booking');
        return res.status(400).json({
          success: false,
          message: 'Property is not available for the selected dates (already booked)',
          data: {
            available: false,
            conflictingBookings: availability.data.conflictingBookings,
            suggestedDates: getSuggestedDates(availability.data.conflictingBookings)
          }
        });
      }
      
      console.log('✅ Property available for booking');
    }
    
    // Tạo booking mới (có thể có nhiều pending bookings cùng lúc)
    console.log('🔄 Creating new booking...');
    const newBooking = await bookingService.createBooking(bookingData);
    
    console.log('✅ Booking created successfully:', {
      bookingNumber: newBooking.bookingNumber,
      status: newBooking.status,
      customer: newBooking.customer.email
    });
    
    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: newBooking
    });
    
  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking request'
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by id error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to fetch booking'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const bookingData = req.body;
    
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
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
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