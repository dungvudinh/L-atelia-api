// models/pendingImageModel.js
import mongoose from 'mongoose';

const pendingImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: { type: String, required: true },
  field: { 
    type: String, 
    enum: ['heroImage', 'gallery', 'constructionProgress', 'designImages', 'brochure'],
    required: true 
  },
  tempId: { type: String, required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  uploaded_at: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'deleted'],
    default: 'pending' 
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24h
}, {
  timestamps: true
});

// Tạo index cho cleanup
pendingImageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
pendingImageSchema.index({ status: 1, uploaded_at: 1 });

export const PendingImage = mongoose.model('PendingImage', pendingImageSchema);