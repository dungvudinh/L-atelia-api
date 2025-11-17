// routes/v1/bookingNotifications.js
import express from 'express';
import Booking from '../../models/bookingModel.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Get new booking notifications
router.get('/new', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Lấy bookings mới (trong 24h gần đây)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const newBookings = await Booking.find({
      createdAt: { $gte: twentyFourHoursAgo },
      status: 'pending' // Chỉ lấy các booking pending mới
    })
    .populate('propertyId', 'title location price featuredImage') // Sửa thành propertyId
    .sort({ createdAt: -1 })
    .limit(20);

    // Format response data
    const formattedBookings = newBookings.map(booking => ({
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      customer: {
        name: booking.customer?.name,
        email: booking.customer?.email,
        phone: booking.customer?.phone
      },
      property: {
        _id: booking.propertyId?._id,
        title: booking.propertyId?.title,
        location: booking.propertyId?.location,
        price: booking.propertyId?.price,
        featuredImage: booking.propertyId?.featuredImage
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: formattedBookings,
      count: newBookings.length
    });
  } catch (error) {
    console.error('Error fetching new bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get pending booking count for notifications
router.get('/pending-count', authMiddleware.verifyToken, async (req, res) => {
  try {
    const pendingCount = await Booking.countDocuments({ 
      status: 'pending' 
    });

    res.json({
      success: true,
      data: {
        pendingCount
      }
    });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark notification as read (trong trường hợp này có thể update booking status)
router.patch('/:id/read', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Có thể thêm logic để mark notification as read
    // Ví dụ: update một field trong booking hoặc tạo collection notification riêng
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all pending bookings with pagination
router.get('/pending', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pendingBookings = await Booking.find({ 
      status: 'pending' 
    })
    .populate('propertyId', 'title location price featuredImage')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Booking.countDocuments({ status: 'pending' });

    const formattedBookings = pendingBookings.map(booking => ({
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      customer: {
        name: booking.customer?.name,
        email: booking.customer?.email,
        phone: booking.customer?.phone
      },
      property: {
        _id: booking.propertyId?._id,
        title: booking.propertyId?.title,
        location: booking.propertyId?.location,
        price: booking.propertyId?.price,
        featuredImage: booking.propertyId?.featuredImage
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: formattedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;