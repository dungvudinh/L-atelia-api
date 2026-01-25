// import express from "express";
// import { 
//   getFolders,
//   getFolderById,
//   createFolder,
//   updateFolder,
//   removeFolder,
//   uploadImages,
//   deleteImage
// } from "../../controllers/folderController.js";
// import { uploadFolderArray, handleMulterError } from '../../config/multer.js';

// const Router = express.Router();

// Router.get('/', getFolders);
// Router.get('/:id', getFolderById);

// // Protected routes
// Router.post('/', createFolder);
// Router.put('/:id', updateFolder);
// Router.delete('/:id', removeFolder);

// // Image management routes
// Router.post('/:id/upload', uploadFolderArray, handleMulterError, uploadImages);
// Router.delete('/:folderId/images/:imageId', deleteImage);

// export default Router;
import express from "express";
import { 
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  removeFolder,
  uploadImages,
  deleteImage,
  bulkDeleteImages,
  uploadImagesViaForm  // 👈 IMPORT HÀM MỚI
} from "../../controllers/folderController.js";
import { uploadFolderArray, handleMulterError } from '../../config/b2.js';

const Router = express.Router();

Router.get('/', getFolders);
Router.get('/:id', getFolderById);

// Protected routes
Router.post('/', createFolder);
Router.put('/:id', updateFolder);
Router.delete('/:id', removeFolder);

// Image management routes
Router.post('/:id/upload', uploadFolderArray, handleMulterError, uploadImages);
Router.post('/:id/upload-form', uploadFolderArray, handleMulterError, uploadImagesViaForm); 
Router.delete('/:folderId/images/:imageId', deleteImage);
Router.post('/:id/images/bulk-delete', bulkDeleteImages);

export default Router;