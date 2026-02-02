import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'star'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

// models/rentModel.js - Cập nhật galleryImageSchema
const galleryImageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  thumbnailKey: {
    type: String,
    default: null
  },
  thumbnailSize: {
    type: Number,
    default: 0
  },
  hasThumbnail: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const rentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [500, 'Location cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    required: [true, 'Price unit is required'],
    enum: {
      values: ['per night', 'for 2 nights', 'per week', 'per month'],
      message: 'Price unit must be one of: per night, for 2 nights, per week, per month'
    },
    default: 'per night'
  },
  adultBeds: {
    type: Number,
    min: [0, 'Adult beds cannot be negative'],
    default: 0
  },
  childBeds: {
    type: Number,
    min: [0, 'Child beds cannot be negative'],
    default: 0
  },
  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative'],
    default: 0
  },
  bathrooms: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  descriptionShort: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  highlights: [highlightSchema],
  amenities: [{
    type: String,
    trim: true
  }],
  gallery: [galleryImageSchema],
  featuredImage: galleryImageSchema,
  status: {
    type: String,
    enum: {
      values: ['available', 'occupied', 'maintenance'],
      message: 'Status must be one of: available, occupied, maintenance'
    },
    default: 'available'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
rentSchema.index({ title: 'text', location: 'text' });
rentSchema.index({ status: 1 });
rentSchema.index({ featured: 1 });
rentSchema.index({ createdAt: -1 });

// Virtual for formatted price
rentSchema.virtual('formattedPrice').get(function() {
  return `${this.price.toLocaleString()} ${this.priceUnit}`;
});

// Method to check if rental is available
rentSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Static method to get featured rentals
rentSchema.statics.getFeatured = function() {
  return this.find({ featured: true, status: 'available' });
};

// Static method to get available rentals
rentSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' });
};

export default mongoose.model('Rent', rentSchema);