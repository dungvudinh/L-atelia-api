import express from "express";
import projectRoute from './projectRoute.js'
import mediaRoute from './mediaRoute.js'
import folderRoutes from './folderRoute.js'

// const express = require('express');
// const projectRoute = require('./projectRoute.js');
const Router = express.Router();
Router.use('/projects', projectRoute)
Router.use('/media', mediaRoute)
Router.use('/folders', folderRoutes);
export default Router;