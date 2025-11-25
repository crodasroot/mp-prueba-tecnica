import { Router } from 'express';
import { getUsers, createUser, login } from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.post('/login', login);

export default router;
