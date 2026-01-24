// routes/projectRoutes.js
import express from "express";
import { 
    getProjects,
    getProjectById,
    getProjectBySlug,
    update,
    remove,
    createProject
} from "../../controllers/projectController.js";

const Router = express.Router({mergeParams:true});

Router.get('/', getProjects);
Router.get('/slug/:slug', getProjectBySlug);
Router.get('/:id', getProjectById);

// Routes chỉ nhận JSON, không xử lý file upload
Router.post('/', createProject);
Router.put('/:id', update);
Router.delete('/:id', remove);

export default Router;