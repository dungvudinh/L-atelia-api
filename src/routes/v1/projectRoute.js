import express from "express";
import { projectController } from "../../controllers/projectController";
import { projectValidation } from "~/validations/projectValidation.js";
const validate = require('../../middlewares/validate');
const { createProjectSchema } = require('../../validations/projectValidation');
// import upload from '~/middlewares/upload'

const Router = express.Router({mergeParams:true});

Router.get('/', projectController.getAllProjects);
Router.post('/', validate(createProjectSchema), projectController.createProject);
Router.get('/:id', projectController.getProjectById);
Router.put('/:id', validate(createProjectSchema), projectController.updateProject);
Router.delete('/:id', projectController.deleteProject);

export default Router;