import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getDefaultAccount
} from '../controllers/bankAccountsController';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Rotas para contas bancárias
router.get('/', getBankAccounts);
router.post('/', createBankAccount);
router.put('/:id', updateBankAccount);
router.delete('/:id', deleteBankAccount);
router.get('/default', getDefaultAccount);

export default router;
