import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getDefaultAccount
} from '../controllers/bankAccountsController';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /bank-accounts:
 *   get:
 *     tags: [Bank Accounts]
 *     summary: Listar contas bancárias do usuário
 *     description: Retorna todas as contas bancárias do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas bancárias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankAccount'
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
router.get('/', getBankAccounts);

/**
 * @swagger
 * /bank-accounts:
 *   post:
 *     tags: [Bank Accounts]
 *     summary: Criar nova conta bancária
 *     description: Cria uma nova conta bancária para o usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - bank
 *               - account_type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da conta
 *                 example: "Conta Corrente Principal"
 *               bank:
 *                 type: string
 *                 description: Nome do banco
 *                 example: "Banco do Brasil"
 *               account_type:
 *                 type: string
 *                 enum: [checking, savings, investment]
 *                 description: Tipo da conta
 *                 example: "checking"
 *               is_default:
 *                 type: boolean
 *                 description: Se é a conta padrão
 *                 example: false
 *     responses:
 *       201:
 *         description: Conta bancária criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.post('/', createBankAccount);

/**
 * @swagger
 * /bank-accounts/{id}:
 *   put:
 *     tags: [Bank Accounts]
 *     summary: Atualizar conta bancária
 *     description: Atualiza uma conta bancária existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da conta bancária
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da conta
 *               bank:
 *                 type: string
 *                 description: Nome do banco
 *               account_type:
 *                 type: string
 *                 enum: [checking, savings, investment]
 *                 description: Tipo da conta
 *               is_default:
 *                 type: boolean
 *                 description: Se é a conta padrão
 *     responses:
 *       200:
 *         description: Conta bancária atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de autenticação inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Conta bancária não encontrada
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
router.put('/:id', updateBankAccount);

/**
 * @swagger
 * /bank-accounts/{id}:
 *   delete:
 *     tags: [Bank Accounts]
 *     summary: Excluir conta bancária
 *     description: Exclui uma conta bancária
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da conta bancária
 *     responses:
 *       200:
 *         description: Conta bancária excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Token de autenticação inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Conta bancária não encontrada
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
router.delete('/:id', deleteBankAccount);

/**
 * @swagger
 * /bank-accounts/default:
 *   get:
 *     tags: [Bank Accounts]
 *     summary: Obter conta padrão
 *     description: Retorna a conta bancária padrão do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta padrão encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       401:
 *         description: Token de autenticação inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Nenhuma conta padrão encontrada
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
router.get('/default', getDefaultAccount);

export default router;
