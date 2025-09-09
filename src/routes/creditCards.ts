import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface para cartão de crédito
interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  card_limit: number;
  closing_day: number;
  due_day: number;
  brand?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// GET /credit-cards - Listar todos os cartões do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { data: creditCards, error } = await supabase
      .from('poupeja_credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cartões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(creditCards || []);
  } catch (error) {
    console.error('Erro no endpoint GET /credit-cards:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /credit-cards - Criar novo cartão
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { name, card_limit, closing_day, due_day, brand, is_default } = req.body;

    // Validações
    if (!name || !card_limit || !closing_day || !due_day) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: name, card_limit, closing_day, due_day' 
      });
    }

    if (closing_day < 1 || closing_day > 31) {
      return res.status(400).json({ 
        error: 'Dia de fechamento deve estar entre 1 e 31' 
      });
    }

    if (due_day < 1 || due_day > 31) {
      return res.status(400).json({ 
        error: 'Dia de vencimento deve estar entre 1 e 31' 
      });
    }

    if (card_limit <= 0) {
      return res.status(400).json({ 
        error: 'Limite do cartão deve ser maior que zero' 
      });
    }

    const { data: creditCard, error } = await supabase
      .from('poupeja_credit_cards')
      .insert({
        user_id: userId,
        name: name.trim(),
        card_limit: parseFloat(card_limit),
        closing_day: parseInt(closing_day),
        due_day: parseInt(due_day),
        brand: brand?.trim() || null,
        is_default: Boolean(is_default)
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cartão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.status(201).json(creditCard);
  } catch (error) {
    console.error('Erro no endpoint POST /credit-cards:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /credit-cards/:id - Atualizar cartão
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const cardId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { name, card_limit, closing_day, due_day, brand, is_default } = req.body;

    // Validações
    if (closing_day && (closing_day < 1 || closing_day > 31)) {
      return res.status(400).json({ 
        error: 'Dia de fechamento deve estar entre 1 e 31' 
      });
    }

    if (due_day && (due_day < 1 || due_day > 31)) {
      return res.status(400).json({ 
        error: 'Dia de vencimento deve estar entre 1 e 31' 
      });
    }

    if (card_limit && card_limit <= 0) {
      return res.status(400).json({ 
        error: 'Limite do cartão deve ser maior que zero' 
      });
    }

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('poupeja_credit_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    // Preparar dados para atualização
    const updateData: Partial<CreditCard> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (card_limit !== undefined) updateData.card_limit = parseFloat(card_limit);
    if (closing_day !== undefined) updateData.closing_day = parseInt(closing_day);
    if (due_day !== undefined) updateData.due_day = parseInt(due_day);
    if (brand !== undefined) updateData.brand = brand?.trim() || null;
    if (is_default !== undefined) updateData.is_default = Boolean(is_default);

    const { data: creditCard, error } = await supabase
      .from('poupeja_credit_cards')
      .update(updateData)
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cartão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(creditCard);
  } catch (error) {
    console.error('Erro no endpoint PUT /credit-cards/:id:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /credit-cards/:id - Excluir cartão
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const cardId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('poupeja_credit_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const { error } = await supabase
      .from('poupeja_credit_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir cartão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro no endpoint DELETE /credit-cards/:id:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /credit-cards/stats - Estatísticas dos cartões
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { data: creditCards, error } = await supabase
      .from('poupeja_credit_cards')
      .select('card_limit, is_default')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar estatísticas dos cartões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    const totalCards = creditCards?.length || 0;
    const totalLimit = creditCards?.reduce((sum, card) => sum + card.card_limit, 0) || 0;
    const defaultCard = creditCards?.find(card => card.is_default);

    res.json({
      totalCards,
      totalLimit,
      hasDefaultCard: !!defaultCard,
      defaultCardLimit: defaultCard?.card_limit || 0
    });
  } catch (error) {
    console.error('Erro no endpoint GET /credit-cards/stats:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
