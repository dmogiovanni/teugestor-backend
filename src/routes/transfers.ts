import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Endpoint de teste que simula exatamente o que o frontend faz
router.get('/test-frontend-simulation', authenticateToken, async (req, res) => {
  try {
    console.log('Teste frontend - User ID:', (req as any).user.id);
    console.log('Teste frontend - Headers:', req.headers);
    
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
    
    // Simular exatamente a query que o frontend está tentando fazer
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .eq('user_id', effectiveUserId)
      .limit(5);

    if (error) {
      console.log('Erro na query:', error);
      return res.status(500).json({ 
        error: 'Erro na query de transferências',
        details: error.message,
        user_id: userId,
        effective_user_id: effectiveUserId
      });
    }

    res.json({ 
      message: 'Query de transferências funcionando!',
      data: data || [],
      count: data ? data.length : 0,
      user_id: userId,
      effective_user_id: effectiveUserId
    });
  } catch (error) {
    console.log('Erro geral:', error);
    res.status(500).json({ 
      error: 'Erro geral na simulação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint de teste com joins (que pode estar falhando)
router.get('/test-with-joins', authenticateToken, async (req, res) => {
  try {
    console.log('Teste joins - User ID:', (req as any).user.id);
    
    // Testar a query com joins que pode estar falhando
    const { data, error } = await supabase
      .from('transfers')
      .select(`
        *,
        from_account:poupeja_bank_accounts!from_account_id(id, name, is_default),
        to_account:poupeja_bank_accounts!to_account_id(id, name, is_default)
      `)
      .or(`user_id.eq.${(req as any).user.id},user_id.in.(SELECT linked_users.main_user_id FROM linked_users WHERE linked_users.linked_user_id = '${(req as any).user.id}' AND linked_users.is_active = true)`)
      .limit(5);

    if (error) {
      console.log('Erro na query com joins:', error);
      return res.status(500).json({ 
        error: 'Erro na query com joins',
        details: error.message,
        user_id: (req as any).user.id
      });
    }

    res.json({ 
      message: 'Query com joins funcionando!',
      data: data || [],
      count: data ? data.length : 0,
      user_id: (req as any).user.id
    });
  } catch (error) {
    console.log('Erro geral com joins:', error);
    res.status(500).json({ 
      error: 'Erro geral na simulação com joins',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint de teste para criação de transferência sem triggers
router.post('/test-create', authenticateToken, async (req, res) => {
  try {
    console.log('=== TESTE CRIAÇÃO SEM TRIGGERS ===');
    console.log('User ID:', (req as any).user.id);
    console.log('Body:', req.body);
    
    const { from_account_id, to_account_id, amount, date, category, description } = req.body;

    // Validações básicas
    if (!from_account_id || !to_account_id || !amount || !date) {
      return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
    }

    // Determinar effectiveUserId
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', (req as any).user.id)
      .eq('is_active', true)
      .single();

    const effectiveUserId = linkedUser ? linkedUser.main_user_id : (req as any).user.id;
    console.log('Effective User ID:', effectiveUserId);

    // Testar inserção simples sem triggers
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        user_id: effectiveUserId,
        from_account_id,
        to_account_id,
        amount,
        transfer_date: date,
        category,
        description
      })
      .select()
      .single();

    console.log('Resultado inserção:', { data, error });

    if (error) {
      return res.status(500).json({ 
        error: 'Erro na inserção',
        details: error.message,
        code: error.code
      });
    }

    res.status(201).json({ 
      message: 'Transferência criada com sucesso (teste)',
      data 
    });
  } catch (error) {
    console.log('Erro geral no teste:', error);
    res.status(500).json({ 
      error: 'Erro geral no teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para verificar se a tabela transfers existe
router.get('/test-table', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        error: 'Erro ao acessar tabela transfers',
        details: error.message 
      });
    }
    
    res.json({ 
      message: 'Tabela transfers existe e está acessível!',
      timestamp: new Date().toISOString(),
      data: data,
      count: data ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao verificar tabela transfers',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rotas de transferências
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

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transferências' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== CRIAR TRANSFERÊNCIA ===');
    console.log('User ID:', (req as any).user.id);
    console.log('Body:', req.body);
    
    const { from_account_id, to_account_id, amount, date, category, description } = req.body;

    // Validações
    if (!from_account_id || !to_account_id || !amount || !date) {
      console.log('Erro: Campos obrigatórios não fornecidos');
      return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
    }

    if (from_account_id === to_account_id) {
      console.log('Erro: Contas iguais');
      return res.status(400).json({ error: 'As contas de origem e destino devem ser diferentes' });
    }

    if (amount <= 0) {
      console.log('Erro: Valor inválido');
      return res.status(400).json({ error: 'O valor deve ser maior que zero' });
    }

    console.log('Verificando contas...');
    // Primeiro, verificar se é usuário vinculado
    const { data: linkedUser } = await supabase
      .from('linked_users')
      .select('main_user_id')
      .eq('linked_user_id', (req as any).user.id)
      .eq('is_active', true)
      .single();

    // Determinar o user_id efetivo para a query
    const effectiveUserId = linkedUser ? linkedUser.main_user_id : (req as any).user.id;
    console.log('Effective User ID:', effectiveUserId);

    // Verificar se as contas pertencem ao usuário
    const { data: accounts, error: accountsError } = await supabase
      .from('poupeja_bank_accounts')
      .select('id')
      .eq('user_id', effectiveUserId)
      .in('id', [from_account_id, to_account_id]);

    console.log('Resultado verificação contas:', { accounts, accountsError });

    if (accountsError) {
      console.log('Erro ao verificar contas:', accountsError);
      throw accountsError;
    }
    
    if (!accounts || accounts.length !== 2) {
      console.log('Erro: Contas inválidas ou não encontradas');
      return res.status(400).json({ error: 'Contas inválidas ou não encontradas' });
    }

    console.log('Inserindo transferência...');
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        user_id: effectiveUserId,
        from_account_id,
        to_account_id,
        amount,
        transfer_date: date, // Mapear 'date' para 'transfer_date'
        category,
        description
      })
      .select()
      .single();

    console.log('Resultado inserção:', { data, error });

    if (error) {
      console.log('Erro na inserção:', error);
      throw error;
    }
    
    console.log('Transferência criada com sucesso:', data);
    res.status(201).json(data);
  } catch (error) {
    console.log('Erro geral ao criar transferência:', error);
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

    // Verificar se a transferência pertence ao usuário
    const { data: existingTransfer, error: checkError } = await supabase
      .from('transfers')
      .select('id')
      .eq('id', id)
      .or(`user_id.eq.${(req as any).user.id},user_id.in.(SELECT linked_users.main_user_id FROM linked_users WHERE linked_users.linked_user_id = '${(req as any).user.id}' AND linked_users.is_active = true)`)
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

    // Verificar se a transferência pertence ao usuário
    const { data: existingTransfer, error: checkError } = await supabase
      .from('transfers')
      .select('id')
      .eq('id', id)
      .or(`user_id.eq.${(req as any).user.id},user_id.in.(SELECT linked_users.main_user_id FROM linked_users WHERE linked_users.linked_user_id = '${(req as any).user.id}' AND linked_users.is_active = true)`)
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
    const { data: transfers, error } = await supabase
      .from('transfers')
      .select('amount, from_account_id, to_account_id, date')
      .or(`user_id.eq.${(req as any).user.id},user_id.in.(SELECT linked_users.main_user_id FROM linked_users WHERE linked_users.linked_user_id = '${(req as any).user.id}' AND linked_users.is_active = true)`);

    if (error) throw error;

    const transfersData = transfers || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calcular estatísticas
    const totalTransfers = transfersData.length;
    const totalAmount = transfersData.reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyTransfers = transfersData.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const monthlyAmount = transfersData.filter(t => {
      const date = new Date(t.date);
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
