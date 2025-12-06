import express from "express";
import { 
    getProjects,
    getProjectById,
    getProjectBySlug,
    update,
    remove,
    deleteImages,
    createProject 
} from "../../controllers/projectController.js";
import { uploadProjectFields, handleMulterError } from '../../config/b2.js';

const Router = express.Router({mergeParams:true});

Router.get('/', getProjects);
Router.get('/slug/:slug', getProjectBySlug);
Router.get('/:id', getProjectById);

// Protected routes
Router.post('/', uploadProjectFields, handleMulterError, createProject);
Router.put('/:id', uploadProjectFields, handleMulterError, update);
Router.delete('/:id', remove);
Router.post('/:id/images/delete', deleteImages);

export default Router;