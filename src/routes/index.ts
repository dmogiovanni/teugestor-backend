import { Router } from 'express';
import adminRoutes from './admin';
import linkedUsersRoutes from './linkedUsers';
import bankAccountsRoutes from './bankAccounts';
import transfersRoutes from './transfers';
import creditCardsRoutes from './creditCards';
import creditCardInvoicesRoutes from './creditCardInvoices';

const router = Router();

// Rotas de admin
router.use('/admin', adminRoutes);

// Rotas de usuários vinculados
router.use('/linked-users', linkedUsersRoutes);

// Rotas de contas bancárias
router.use('/bank-accounts', bankAccountsRoutes);

// Rotas de transferências
router.use('/transfers', transfersRoutes);

// Rotas de cartões de crédito
router.use('/credit-cards', creditCardsRoutes);

// Rotas de faturas e despesas de cartão de crédito
router.use('/credit-cards', creditCardInvoicesRoutes);

export default router;
