// routes/projectRoute.js
import express from "express";
import { 
    getProjects,
    getProjectById,
    getProjectBySlug,
    update,
    remove,
    deleteImages,
    createProject,
    submitProjectContactForm
} from "../../controllers/projectController.js";

const Router = express.Router({mergeParams:true});

Router.get('/', getProjects);
Router.get('/slug/:slug', getProjectBySlug);
Router.get('/:id', getProjectById);

// Protected routes - CHỈ GỬI JSON, KHÔNG UPLOAD
Router.post('/', createProject);
Router.put('/:id', update);
Router.delete('/:id', remove);
Router.post('/:id/images/delete', deleteImages);
Router.post('/:projectId/contact', submitProjectContactForm);
// ========== XÓA CÁC ROUTE UPLOAD ==========
// Router.post('/:id/upload/image', ...); // XÓA
// Router.post('/:id/upload/images', ...); // XÓA
// Router.delete('/:id/images/:imageKey', ...); // XÓA

export default Router;