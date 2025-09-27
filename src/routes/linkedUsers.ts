import { Router, Response } from 'express';
import { 
  getLinkedUsers, 
  createLinkedUser, 
  updateLinkedUser, 
  deleteLinkedUser 
} from '../controllers/linkedUsersController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  validateRequiredFields, 
  validatePermissionType, 
  validateEmail 
} from '../middleware/validation';
import { supabase } from '../utils/supabaseClient';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /linked-users:
 *   get:
 *     tags: [Linked Users]
 *     summary: Listar usuários vinculados
 *     description: Retorna todos os usuários vinculados ao usuário principal
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários vinculados
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
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   whatsapp:
 *                     type: string
 *                   permission_type:
 *                     type: string
 *                     enum: [view, edit]
 *                   is_active:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Token de autenticação inválido
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

// POST /linked-users/check - Verificar se é usuário vinculado
router.post('/check', 
  authenticateToken,
  async (req: any, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          error: 'userId é obrigatório'
        });
      }

      // Verificar se o usuário existe na tabela linked_users
      const { data: linkedUser, error } = await supabase
        .from('linked_users')
        .select('id')
        .eq('linked_user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao verificar usuário vinculado:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor'
        });
      }

      res.status(200).json({
        isLinkedUser: !!linkedUser
      });

    } catch (error) {
      console.error('Erro interno:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
);

// DELETE /linked-users/:id - Excluir usuário vinculado
router.delete('/:id', deleteLinkedUser);

export default router;
