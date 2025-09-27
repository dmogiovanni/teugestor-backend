import { Router } from 'express';
import { getUsers, createUser } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { validateRequiredFields } from '../middleware/validation';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Listar usuários (Admin)
 *     description: Retorna todos os usuários do sistema (apenas para administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   email:
 *                     type: string
 *                     format: email
 *                   name:
 *                     type: string
 *                   whatsapp:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   subscription_expires_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Token de autenticação inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado (não é administrador)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', getUsers);

// POST /admin/create-user - Criar usuário
router.post('/create-user', 
  validateRequiredFields(['name', 'email', 'whatsapp', 'password', 'accessPeriodDays']),
  createUser
);

export default router;
