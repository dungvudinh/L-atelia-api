// routes/folderRoutes.js
import express from "express";
import { 
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  removeFolder,
  uploadImages,
  deleteImage
} from "../../controllers/folderController.js";
import { uploadMediaArray, handleMulterError } from '../../config/multer.js';

const Router = express.Router({ mergeParams: true });

Router.get('/', getFolders);
Router.get('/:id', getFolderById);

// Protected routes
Router.post('/', createFolder);
Router.put('/:id', updateFolder);
Router.delete('/:id', removeFolder);

// Image management routes
Router.post('/:id/upload', uploadMediaArray, handleMulterError, uploadImages);
Router.delete('/:folderId/images/:imageId', deleteImage);

export default Router;