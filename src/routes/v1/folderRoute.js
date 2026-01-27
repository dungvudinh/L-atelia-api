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
  uploadImageToFolder // NEW
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
Router.delete('/:folderId/images/:imageId', deleteImage);
Router.post('/:id/images/bulk-delete', bulkDeleteImages);
Router.post('/:id/images', uploadImageToFolder); // NEW: For saving image info after direct upload
export default Router;