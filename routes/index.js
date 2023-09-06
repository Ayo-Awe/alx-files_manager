import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import auth from '../middlewares/auth';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/stats', AppController.getStats);
router.get('/status', AppController.getStatus);
router.post('/users', UsersController.postNew);
router.get('/users/me', auth, UsersController.getMe);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', auth, AuthController.getDisconnect);
router.post('/files', auth, FilesController.postUpload);
router.get('/files', auth, FilesController.getIndex);
router.get('/files/:id', auth, FilesController.getShow);

export default router;
