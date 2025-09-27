import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * @swagger
 * /transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: Listar transferências do usuário
 *     description: Retorna todas as transferências do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transferências
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
 *                   from_account_id:
 *                     type: string
 *                     format: uuid
 *                   to_account_id:
 *                     type: string
 *                     format: uuid
 *                   amount:
 *                     type: number
 *                     format: decimal
 *                   description:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   from_account:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                   to_account:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', userId)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : userId;

    const { data, error } = await supabase
      .from('transfers')
      .select(`
        *,
        from_account:poupeja_bank_accounts!from_account_id(id, name, is_default),
        to_account:poupeja_bank_accounts!to_account_id(id, name, is_default)
      `)
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    // Mapear transfer_date para date para compatibilidade com frontend
    const mappedData = data?.map(transfer => ({
      ...transfer,
      date: transfer.transfer_date
    }));

    if (error) throw error;
    res.json(mappedData || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transferências' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, date, category, description } = req.body;

    // Validações
    if (!from_account_id || !to_account_id || !amount || !date) {
      return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
    }

    if (from_account_id === to_account_id) {
      return res.status(400).json({ error: 'As contas de origem e destino devem ser diferentes' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'O valor deve ser maior que zero' });
    }

    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', (req as any).user.id)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : (req as any).user.id;

    // Verificar se as contas pertencem ao usuário
    const { data: accounts, error: accountsError } = await supabase
      .from('poupeja_bank_accounts')
      .select('id')
      .eq('user_id', effectiveUserId)
      .in('id', [from_account_id, to_account_id]);

    if (accountsError) {
      throw accountsError;
    }
    
    if (!accounts || accounts.length !== 2) {
      return res.status(400).json({ error: 'Contas inválidas ou não encontradas' });
    }

    // Inserir transferência
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        user_id: effectiveUserId,
        from_account_id,
        to_account_id,
        amount,
        transfer_date: date,
        description
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao criar transferência',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as any).user.id;
    
    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', userId)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : userId;

    // Verificar se a transferência pertence ao usuário
    const { data: existingTransfer, error: checkError } = await supabase
      .from('transfers')
      .select('id')
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .single();

    if (checkError || !existingTransfer) {
      return res.status(404).json({ error: 'Transferência não encontrada' });
    }

    // Validações
    if (updateData.from_account_id && updateData.to_account_id) {
      if (updateData.from_account_id === updateData.to_account_id) {
        return res.status(400).json({ error: 'As contas de origem e destino devem ser diferentes' });
      }
    }

    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return res.status(400).json({ error: 'O valor deve ser maior que zero' });
    }

    const { data, error } = await supabase
      .from('transfers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transferência' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', userId)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : userId;

    // Verificar se a transferência pertence ao usuário
    const { data: existingTransfer, error: checkError } = await supabase
      .from('transfers')
      .select('id')
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .single();

    if (checkError || !existingTransfer) {
      return res.status(404).json({ error: 'Transferência não encontrada' });
    }

    const { error } = await supabase
      .from('transfers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir transferência' });
  }
});

// Rota para estatísticas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', userId)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : userId;

    const { data: transfers, error } = await supabase
      .from('transfers')
      .select('amount, from_account_id, to_account_id, transfer_date')
      .eq('user_id', effectiveUserId);

    if (error) throw error;

    const transfersData = transfers || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calcular estatísticas
    const totalTransfers = transfersData.length;
    const totalAmount = transfersData.reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyTransfers = transfersData.filter(t => {
      const date = new Date(t.transfer_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const monthlyAmount = transfersData.filter(t => {
      const date = new Date(t.transfer_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular conta mais ativa
    const accountActivity: { [key: string]: number } = {};
    transfersData.forEach(t => {
      accountActivity[t.from_account_id] = (accountActivity[t.from_account_id] || 0) + 1;
      accountActivity[t.to_account_id] = (accountActivity[t.to_account_id] || 0) + 1;
    });

    let mostActiveAccount = null;
    let maxCount = 0;
    for (const [accountId, count] of Object.entries(accountActivity)) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveAccount = { id: accountId, count };
      }
    }

    // Buscar nome da conta mais ativa
    if (mostActiveAccount) {
      const { data: account } = await supabase
        .from('poupeja_bank_accounts')
        .select('name')
        .eq('id', mostActiveAccount.id)
        .single();

      if (account) {
        mostActiveAccount.name = account.name;
      }
    }

    res.json({
      totalTransfers,
      totalAmount,
      monthlyTransfers,
      monthlyAmount,
      mostActiveAccount: mostActiveAccount ? {
        id: mostActiveAccount.id,
        name: mostActiveAccount.name || 'Conta não encontrada',
        count: mostActiveAccount.count
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
