import { StatusCodes } from "http-status-codes";
import { createProject, getAllProjects } from "../services/projectService";
// const StatusCodes = require('http-status-codes')
export const create = async (req, res,next) => {
    try {
      const project = await createProject(req.body);
      console.log(project)
      res.status(StatusCodes.CREATED).json({msg:'Create project successfully'})

    } catch (err) {
        console.log(err)
        next(err)
    }
};
export const getProjects = async (req, res, next) => {
    try {
      const projects = await getAllProjects();
      res.status(StatusCodes.OK).json({success:true, data:projects})
    } catch (err) {
        next(err)
    }
  };
  
  // const getProjectById = async (req, res, next) => {
  //   try {
  //     const project = await projectService.getProjectById(req.params.id);
  //     if (!project) res.status(StatusCodes.NOT_FOUND).json({success:false, msg:'Project not found'})
  //       res.status(StatusCodes.OK).json({success:true, data:project})
  //   } catch (err) {
  //     next(err)
  //   }
  // };
  
  // const updateProject = async (req, res, next) => {
  //   try {
  //     const project = await projectService.updateProject(req.params.id, req.body);
  //     if (!project) res.status(StatusCodes.NOT_FOUND).json({success:false, msg:'Project not found'})
  //       res.status(StatusCodes.OK).json({success:true, data:project})
  //   } catch (err) {
  //       next(err)
  //   }
  // };
  
  // const deleteProject = async (req, res, next) => {
  //   try {
  //     const project = await projectService.deleteProject(req.params.id);
  //     if (!project) res.status(StatusCodes.NOT_FOUND).json({success:false, msg:'Project not found'})
  //       res.status(StatusCodes.OK).json({success:true,msg:'Project deleted'})
  //   } catch (err) {
  //       next(err)
  //   }
  // };

