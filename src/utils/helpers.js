import Booking from '../models/bookingModel.js';

// Generate unique booking number
export const generateBookingNumber = async () => {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  let bookingNumber = `${prefix}${timestamp}${random}`;
  
  // Ensure uniqueness
  let exists = await Booking.findOne({ bookingNumber });
  let attempts = 0;
  
  while (exists && attempts < 10) {
    const newRandom = Math.random().toString(36).substring(2, 5).toUpperCase();
    bookingNumber = `${prefix}${timestamp}${newRandom}`;
    exists = await Booking.findOne({ bookingNumber });
    attempts++;
  }
  
  if (exists) {
    throw new Error('Unable to generate unique booking number');
  }
  
  return bookingNumber;
};

// Validate date range
export const validateDateRange = (checkIn, checkOut) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkInDate < today) {
    throw new Error('Check-in date must be today or in the future');
  }
  
  if (checkOutDate <= checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
  
  return true;
};

// Calculate total amount
export const calculateTotalAmount = (price, checkIn, checkOut) => {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  return nights * price;
};

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};