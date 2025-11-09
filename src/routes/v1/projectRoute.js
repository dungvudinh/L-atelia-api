import express from "express";
import { 
    getProjects,
    getProjectById,
    getProjectBySlug,
    update,
    remove,
    deleteImages,
  createProject } from "../../controllers/projectController.js";
import validate from "../../middlewares/validate.js";
import{uploadProjectFields, handleMulterError } from '../../config/multer.js'
// import {createProjectSchema} from '../../validations/projectValidation.js'

const Router = express.Router({mergeParams:true});

Router.get('/', getProjects);
Router.get('/slug/:slug', getProjectBySlug);
Router.get('/:id', getProjectById);

// Protected routes (add authentication middleware as needed)
Router.post('/',uploadProjectFields,handleMulterError,  createProject);
Router.put('/:id', uploadProjectFields,handleMulterError, update);
Router.delete('/:id', remove);
Router.post('/:id/images/delete', deleteImages);
// Router.get('/:id', projectController.getProjectById);
// Router.put('/:id', validate(createProjectSchema), projectController.updateProject);
// Router.delete('/:id', projectController.deleteProject);

export default Router;