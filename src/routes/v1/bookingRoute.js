// routes/bookingRoute.js
import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
  updateBookingStatus,
  updatePaymentStatus,
  // getBookingsByProperty,
  // getUpcomingBookings,
  // getBookingStats
} from '../../controllers/bookingController.js';

const router = express.Router();

// GET ALL BOOKINGS with advanced filtering
router.get('/', getAllBookings);

// GET BOOKING STATISTICS
// router.get('/stats', getBookingStats);

// GET UPCOMING BOOKINGS
// router.get('/upcoming', getUpcomingBookings);

// GET BOOKINGS BY PROPERTY
// router.get('/property/:propertyId', getBookingsByProperty);
// CHECK AVAILABILITY
router.get('/check-availability', checkAvailability);
// GET BOOKING BY ID
router.get('/:id', getBookingById);

// CREATE NEW BOOKING (including from contact form)
router.post('/', createBooking);

// UPDATE BOOKING
router.put('/:id', updateBooking);

// DELETE BOOKING
router.delete('/:id', deleteBooking);



// UPDATE BOOKING STATUS
router.patch('/:id/status', updateBookingStatus);

// UPDATE PAYMENT STATUS
// router.patch('/:id/payment-status', updatePaymentStatus);

// ĐÃ LOẠI BỎ SEND BOOKING EMAIL

export default router;