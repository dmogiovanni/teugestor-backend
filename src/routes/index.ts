import { Router } from 'express';
import adminRoutes from './admin';
import linkedUsersRoutes from './linkedUsers';
import bankAccountsRoutes from './bankAccounts';

const router = Router();

// Rotas de admin
router.use('/admin', adminRoutes);

// Rotas de usuários vinculados
router.use('/linked-users', linkedUsersRoutes);

// Rotas de contas bancárias
router.use('/bank-accounts', bankAccountsRoutes);

export default router;
