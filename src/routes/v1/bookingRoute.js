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
  sendBookingEmail
} from '../../controllers/bookingController.js';

const router = express.Router();

// GET ALL BOOKINGS
router.get('/', getAllBookings);

// GET BOOKING BY ID
router.get('/:id', getBookingById);

// CREATE NEW BOOKING
router.post('/', createBooking);

// UPDATE BOOKING
router.put('/:id', updateBooking);

// DELETE BOOKING
router.delete('/:id', deleteBooking);

// CHECK AVAILABILITY
router.get('/check-availability', checkAvailability);

// UPDATE BOOKING STATUS
router.patch('/:id/status', updateBookingStatus);

// UPDATE PAYMENT STATUS
router.patch('/:id/payment-status', updatePaymentStatus);

// SEND BOOKING EMAIL
router.post('/:id/send-email', sendBookingEmail);

export default router;