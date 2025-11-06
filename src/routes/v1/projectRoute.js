// const express = require('express');
// const {projectController} = require('../../controllers/projectController.js');
// const validate = require('../../middlewares/validate.js');
// const { createProjectSchema } = require('../../validations/projectValidation.js');
import express from "express";
import { projectController } from "../../controllers/projectController.js";
import validate from "../../middlewares/validate.js";
// // const validate = require('../../middlewares/validate.js');
// // const { createProjectSchema } = require('../../validations/projectValidation.js');
import {createProjectSchema} from '../../validations/projectValidation.js'
// import upload from '~/middlewares/upload'

const Router = express.Router({mergeParams:true});

Router.get('/', projectController.getAllProjects);
Router.post('/', validate(createProjectSchema), projectController.createProject);
Router.get('/:id', projectController.getProjectById);
Router.put('/:id', validate(createProjectSchema), projectController.updateProject);
Router.delete('/:id', projectController.deleteProject);

module.exports = Router;