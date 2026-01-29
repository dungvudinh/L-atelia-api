import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Folder name is required'],
    trim: true,
    minlength: [1, 'Folder name cannot be empty'],
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  
  // Images trong folder - cập nhật với thumbnail
  images: [{
    _id: { 
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
      default: () => new mongoose.Types.ObjectId()
    },
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: { // ✅ Thêm thumbnail URL
      type: String,
      default: null
    },
    key: {
      type: String,
      required: true
    },
    thumbnailKey: { // ✅ Thêm thumbnail key
      type: String,
      default: null
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    thumbnailSize: { // ✅ Thêm thumbnail size
      type: Number,
      default: 0
    },
    dimensions: { // ✅ Thêm dimensions cho original
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 }
    },
    thumbnailDimensions: { // ✅ Thêm dimensions cho thumbnail
      width: { type: Number, default: THUMBNAIL_WIDTH },
      height: { type: Number, default: THUMBNAIL_HEIGHT }
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    },
    hasThumbnail: { // ✅ Flag để biết có thumbnail không
      type: Boolean,
      default: false
    }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Constants
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

// Auto-update updatedAt
folderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
folderSchema.index({ name: 1, parentFolder: 1 });
folderSchema.index({ parentFolder: 1 });

// Method để thêm ảnh với thumbnail
folderSchema.methods.addImage = async function(imageData) {
  try {
    console.log('🖼️ Adding image with thumbnail data:', imageData);
    
    // ✅ Tạo image object với thumbnail
    const newImage = {
      _id: new mongoose.Types.ObjectId(),
      url: imageData.url,
      thumbnailUrl: imageData.thumbnailUrl || null,
      key: imageData.key,
      thumbnailKey: imageData.thumbnailKey || null,
      filename: imageData.filename,
      size: imageData.size || 0,
      thumbnailSize: imageData.thumbnailSize || 0,
      dimensions: imageData.dimensions || { width: 0, height: 0 },
      thumbnailDimensions: {
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT
      },
      uploadedAt: imageData.uploadedAt || new Date(),
      hasThumbnail: !!imageData.thumbnailUrl
    };
    
    console.log('📝 New image with thumbnail:', {
      id: newImage._id,
      hasThumbnail: newImage.hasThumbnail,
      thumbnailUrl: newImage.thumbnailUrl ? 'yes' : 'no'
    });
    
    // Thêm vào mảng images
    this.images.push(newImage);
    
    // Lưu folder
    await this.save();
    
    console.log('✅ Image with thumbnail saved successfully');
    return newImage;
  } catch (error) {
    console.error('❌ Error in addImage method:', error);
    throw error;
  }
};

// Method để xóa ảnh
folderSchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(img => img._id.toString() !== imageId);
  return this.save();
};

// Method để lấy thumbnail URL (fallback về original nếu không có thumbnail)
folderSchema.methods.getThumbnailUrl = function(imageId) {
  const image = this.images.id(imageId);
  if (!image) return null;
  
  return image.thumbnailUrl || image.url;
};

// Virtual để lấy số lượng ảnh
folderSchema.virtual('imageCount').get(function() {
  return this.images.length;
});

// Ensure virtual fields are serialized
folderSchema.set('toJSON', { virtuals: true });

export const Folder = mongoose.model('Folder', folderSchema);