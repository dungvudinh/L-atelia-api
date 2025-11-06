// const Project = require('../models/Project');
// const { fetchExternalData } = require('./externalApiService');
// import {fetchExternalData} from './'
import {create, getProjects} from '../models/projectModel.js'
export const createProject = async (data) => {
  // Optional: enrich with external API
  // const external = await fetchExternalData('/properties');
  const project = await create(data);
  return await project.save();
};

export const getAllProjects = async () => {
 return await getProjects();
};

// const getProjectById = async (id) => {
//   return await Project.findById(id);
// };

// const updateProject = async (id, data) => {
//   return await Project.findByIdAndUpdate(id, data, { new: true });
// };

// const deleteProject = async (id) => {
//   return await Project.findByIdAndDelete(id);
// };

