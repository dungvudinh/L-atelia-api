// models/AmenityModel.js
import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Amenity name is required'],
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>'
  }
}, {
  timestamps: true
});

export default mongoose.model('Amenity', amenitySchema);