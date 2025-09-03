import { Router } from 'express';
import { getUsers, createUser } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { validateRequiredFields } from '../middleware/validation';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /admin/users - Listar usuários
router.get('/users', getUsers);

// POST /admin/create-user - Criar usuário
router.post('/create-user', 
  validateRequiredFields(['name', 'email', 'whatsapp', 'password', 'accessPeriodDays']),
  createUser
);

export default router;
