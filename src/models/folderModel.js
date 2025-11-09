// models/folderModel.js
import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  
  // Images trong folder
  images: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
folderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method để thêm ảnh
folderSchema.methods.addImage = function(imageData) {
  this.images.push(imageData);
  return this.save();
};

// Method để xóa ảnh
folderSchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(img => img._id.toString() !== imageId);
  return this.save();
};

export const Folder = mongoose.model('Folder', folderSchema);