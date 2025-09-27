import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';

const router = Router();

/**
 * @swagger
 * /auth/login-by-user-id:
 *   post:
 *     tags: [Auth]
 *     summary: Obter token JWT por ID do usuário
 *     description: Gera um novo token JWT para um usuário específico usando seu ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID único do usuário
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Token JWT do Supabase
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID do usuário é obrigatório
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "ID do usuário é obrigatório"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Usuário não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Erro interno do servidor"
 */
router.post('/login-by-user-id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'ID do usuário é obrigatório'
      });
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);

    if (userError || !user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Gerar um novo token JWT para o usuário
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.user.email!,
      options: {
        redirectTo: process.env.FRONTEND_URL || 'http://localhost:3000'
      }
    });

    if (tokenError) {
      console.error('Erro ao gerar token:', tokenError);
      return res.status(500).json({
        error: 'Erro ao gerar token de autenticação'
      });
    }

    // Extrair o token da URL de magic link
    const url = new URL(tokenData.properties.action_link);
    const token = url.searchParams.get('token');

    if (!token) {
      return res.status(500).json({
        error: 'Erro ao extrair token da URL'
      });
    }

    // Verificar o token para obter os dados completos
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser(token);

    if (verifyError || !verifiedUser) {
      return res.status(500).json({
        error: 'Erro ao verificar token'
      });
    }

    res.json({
      success: true,
      token,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.user_metadata?.name || verifiedUser.email,
        phone: verifiedUser.user_metadata?.phone,
        created_at: verifiedUser.created_at,
        updated_at: verifiedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Erro na rota login-by-user-id:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
