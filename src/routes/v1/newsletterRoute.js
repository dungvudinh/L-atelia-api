// routes/newsletterRoutes.js
import express from 'express';
import { 
    subscribeToNewsletter, 
    getSubscribers, 
    unsubscribe 
} from '../../controllers/newsletterController';

const router = express.Router();

router.post('/subscribe', subscribeToNewsletter);
router.get('/subscribers', getSubscribers); // For admin
router.post('/unsubscribe', unsubscribe);

export default router;