import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.GET('/status', AppController.getStatus);
router.GET('/stats', AppController.getStats);
router.POST('/users', UsersController.postNew);
router.GET('/connect', AuthController.getConnect);
router.GET('/disconnect', AuthController.getDisconnect);
router.GET('/users/me', UserController.getMe);
router.POST('/files', FilesController.postUpload);
router.GET('/files/:id', FilesController.getShow);
router.GET('/files', FilesController.getIndex);

export default router;
