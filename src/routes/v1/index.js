// import express from "express";
// import projectRoute from './projectRoute.js'
const express = require('express');
const projectRoute = require('./projectRoute.js');
const Router = express.Router();
Router.use('/projects', projectRoute)

export default Router;