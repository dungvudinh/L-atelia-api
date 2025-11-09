// routes/mediaRoutes.js
import express from "express";
import { 
  getMedia,
  getMediaById,
  createMedia,
  updateMedia,
  remove
} from "../../controllers/mediaController.js";

const Router = express.Router({ mergeParams: true });

Router.get('/', getMedia);
Router.get('/:id', getMediaById);

// Protected routes
Router.post('/', createMedia);
Router.put('/:id', updateMedia);
Router.delete('/:id', remove);

export default Router;