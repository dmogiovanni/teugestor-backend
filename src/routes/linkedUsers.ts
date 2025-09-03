import { Router } from 'express';
import { 
  getLinkedUsers, 
  createLinkedUser, 
  updateLinkedUser, 
  deleteLinkedUser 
} from '../controllers/linkedUsersController';
import { authenticateToken } from '../middleware/auth';
import { 
  validateRequiredFields, 
  validatePermissionType, 
  validateEmail 
} from '../middleware/validation';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /linked-users - Listar usuários vinculados
router.get('/', getLinkedUsers);

// POST /linked-users - Criar usuário vinculado
router.post('/', 
  validateRequiredFields(['name', 'email', 'password', 'whatsapp', 'permission_type']),
  validatePermissionType,
  validateEmail,
  createLinkedUser
);

// PUT /linked-users/:id - Atualizar usuário vinculado
router.put('/:id', 
  validatePermissionType,
  validateEmail,
  updateLinkedUser
);

// DELETE /linked-users/:id - Excluir usuário vinculado
router.delete('/:id', deleteLinkedUser);

export default router;
