import express from "express";
import projectRoute from './projectRoute'
const Router = express.Router();

Router.use('/projects', projectRoute)

export default Router;