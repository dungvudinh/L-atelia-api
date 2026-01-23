// routes/projectRoute.js
import express from "express";
import { 
    getProjects,
    getProjectById,
    getProjectBySlug,
    update,
    remove,
    deleteImages,
    createProject, 
    uploadProjectImage, 
    deleteProjectImage, 
    uploadMultipleProjectImages
} from "../../controllers/projectController.js";
import { 
    uploadProjectFields, 
    handleMulterError,
    uploadB2File,
    uploadProjectImagesArray   
} from '../../config/b2.js';

const Router = express.Router({mergeParams:true});

Router.get('/', getProjects);
Router.get('/slug/:slug', getProjectBySlug);
Router.get('/:id', getProjectById);

// Protected routes
Router.post('/', uploadProjectFields, handleMulterError, createProject);
Router.put('/:id', uploadProjectFields, handleMulterError, update);
Router.delete('/:id', remove);
Router.post('/:id/images/delete', deleteImages);

// ========== REAL-TIME UPLOAD ROUTES ==========
Router.post('/:id/upload/image', uploadB2File.single('image'), handleMulterError, uploadProjectImage);
Router.post('/:id/upload/images', uploadProjectImagesArray, handleMulterError, uploadMultipleProjectImages);
Router.delete('/:id/images/:imageKey', deleteProjectImage);



export default Router;