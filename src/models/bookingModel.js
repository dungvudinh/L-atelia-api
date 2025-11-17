// models/bookingModel.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  }
});

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rent',
    required: true
  },
  customer: customerSchema,
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  // Đơn giản: chỉ lưu adults và children
  adults: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  children: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual để tính tổng guests
bookingSchema.virtual('totalGuests').get(function() {
  return this.adults + this.children;
});

// Virtual để tính số đêm
bookingSchema.virtual('nights').get(function() {
  if (this.checkIn && this.checkOut) {
    return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Indexes
bookingSchema.index({ bookingNumber: 'text' });
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model('Booking', bookingSchema);