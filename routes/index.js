import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.GET('/status', AppController.getStatus);
router.GET('/stats', AppController.getStats);
router.POST('/users', UsersController.postNew);

export default router;
