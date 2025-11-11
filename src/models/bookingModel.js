// models/bookingModel.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  }
});

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rent',
    required: [true, 'Property ID is required']
  },
  customer: customerSchema,
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Check-in date must be in the future'
    }
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required'],
    validate: {
      validator: function(value) {
        return value > this.checkIn;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'At least 1 guest is required'],
    max: [20, 'Maximum 20 guests allowed']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'completed'],
      message: 'Status must be one of: pending, confirmed, cancelled, completed'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'partial', 'paid', 'refunded'],
      message: 'Payment status must be one of: pending, partial, paid, refunded'
    },
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.isModified('checkIn') || this.isModified('checkOut') || this.isModified('propertyId')) {
    this.calculateTotalAmount();
  }
  next();
});

// Instance method to calculate total amount
bookingSchema.methods.calculateTotalAmount = async function() {
  if (this.propertyId && this.checkIn && this.checkOut) {
    const property = await mongoose.model('Rent').findById(this.propertyId);
    if (property) {
      const nights = Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
      this.totalAmount = nights * property.price;
    }
  }
};

// Virtual for number of nights
bookingSchema.virtual('nights').get(function() {
  if (this.checkIn && this.checkOut) {
    return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Index for better search performance
bookingSchema.index({ bookingNumber: 'text', 'customer.name': 'text', 'customer.email': 'text' });
bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ createdAt: -1 });

// Static method to get bookings by property
bookingSchema.statics.getBookingsByProperty = function(propertyId) {
  return this.find({ propertyId }).sort({ checkIn: 1 });
};

// Static method to get upcoming bookings
bookingSchema.statics.getUpcomingBookings = function() {
  return this.find({ 
    checkIn: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ checkIn: 1 });
};

export default mongoose.model('Booking', bookingSchema);