import { Router } from 'express';
import adminRoutes from './admin';
import linkedUsersRoutes from './linkedUsers';

const router = Router();

// Rotas de admin
router.use('/admin', adminRoutes);

// Rotas de usuários vinculados
router.use('/linked-users', linkedUsersRoutes);

export default router;
