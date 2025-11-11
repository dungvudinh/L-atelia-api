// routes/v1/bookingNotifications.js
import express from 'express';
import Booking from '../../models/bookingModel.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Get new booking
router.get('/new', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Lấy bookings mới (trong 24h gần đây)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const newBookings = await Booking.find({
      createdAt: { $gte: twentyFourHoursAgo },
      status: 'pending' // hoặc 'confirmed' tùy logic
    })
    .populate('customer', 'name email')
    .populate('property', 'title')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: newBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Logic mark as read
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;