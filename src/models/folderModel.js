// // models/folderModel.js
// import mongoose from 'mongoose';

// const folderSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: [true, 'Folder name is required'],
//     trim: true,
//     minlength: [1, 'Folder name cannot be empty'],
//     maxlength: [100, 'Folder name cannot exceed 100 characters']
//   },
//   parentFolder: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Folder',
//     default: null
//   },
  
//   // Images trong folder
//   images: [{
//     filename: {
//       type: String,
//       required: true
//     },
//     originalName: {
//       type: String,
//       required: true
//     },
//     url: {
//       type: String,
//       required: true
//     },
//     size: {
//       type: Number,
//       required: true
//     },
//     mimetype: {
//       type: String,
//       required: true
//     },
//     uploadedAt: { 
//       type: Date, 
//       default: Date.now 
//     }
//   }],
  
//   // Timestamps
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // Auto-update updatedAt
// folderSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Index for better performance
// folderSchema.index({ name: 1, parentFolder: 1 });
// folderSchema.index({ parentFolder: 1 });

// // Method để thêm ảnh
// folderSchema.methods.addImage = function(imageData) {
//   this.images.push(imageData);
//   return this.save();
// };

// // Method để xóa ảnh
// folderSchema.methods.removeImage = function(imageId) {
//   this.images = this.images.filter(img => img._id.toString() !== imageId);
//   return this.save();
// };

// // Virtual để lấy số lượng ảnh
// folderSchema.virtual('imageCount').get(function() {
//   return this.images.length;
// });

// export const Folder = mongoose.model('Folder', folderSchema);
// models/folderModel.js
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
  
  // Images trong folder - đơn giản hóa
  images: [{
    _id: {  // ✅ Thêm field _id
      type: mongoose.Schema.Types.ObjectId,
      auto: true,  // Tự động tạo
      default: () => new mongoose.Types.ObjectId()
    },
    url: {
      type: String,
      required: true
    },
    key: { // Chỉ cần key để xóa từ B2
      type: String,
      required: true
    },
    filename: { // Tên file để hiển thị
      type: String,
      required: true
    },
    size: { // Thêm field size
      type: Number,
      required: true
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
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

// Index for better performance
folderSchema.index({ name: 1, parentFolder: 1 });
folderSchema.index({ parentFolder: 1 });

// Method để thêm ảnh
folderSchema.methods.addImage = async function(imageData) {
  try {
    console.log('🖼️ Adding image with data:', imageData);
    
    // ✅ Tạo image object với _id mới
    const newImage = {
      _id: new mongoose.Types.ObjectId(),  // ✅ Tạo _id mới
      url: imageData.url,
      key: imageData.key,
      filename: imageData.filename,
      size: imageData.size || 0,
      uploadedAt: imageData.uploadedAt || new Date()
    };
    
    console.log('📝 New image with ID:', newImage._id);
    
    // Thêm vào mảng images
    this.images.push(newImage);
    
    // Lưu folder
    await this.save();
    
    console.log('✅ Image saved with ID:', newImage._id);
    return newImage;  // ✅ Trả về image với _id
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

// Virtual để lấy số lượng ảnh
folderSchema.virtual('imageCount').get(function() {
  return this.images.length;
});

// Ensure virtual fields are serialized
folderSchema.set('toJSON', { virtuals: true });

export const Folder = mongoose.model('Folder', folderSchema);