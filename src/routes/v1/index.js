import express from "express";
import projectRoute from './projectRoute.js'
import mediaRoute from './mediaRoute.js'
import folderRoutes from './folderRoute.js'
import rentRoute from './rentRoute.js'
import bookingRoute from './bookingRoute.js'
import authRoute from './authRoute.js'
import userRoute from './userRoute.js'
import rolePermissionRoute from './rolePermissionRoute.js'
import bookingNotificationRoute from './bookingNotificationRoute.js'
import contactRoute from './contactRoute.js'
import imageRoute from './imageRoute.js';
// const express = require('express');
// const projectRoute = require('./projectRoute.js');
const Router = express.Router();
Router.use('/projects', projectRoute)
Router.use('/media', mediaRoute)
Router.use('/folders', folderRoutes);
Router.use('/rent', rentRoute)
Router.use('/bookings', bookingRoute)
Router.use('/auth', authRoute)
Router.use('/users', userRoute)
Router.use('/role-permissions', rolePermissionRoute)
Router.use('/notifications', bookingNotificationRoute)
Router.use('/contact', contactRoute)
Router.use('/images', imageRoute)
export default Router;