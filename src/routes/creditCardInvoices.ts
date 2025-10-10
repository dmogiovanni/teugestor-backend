import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @swagger
 * /credit-cards/invoices:
 *   get:
 *     tags: [Credit Card Invoices]
 *     summary: Listar faturas de cartão de crédito
 *     description: Retorna todas as faturas de cartão de crédito do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: credit_card_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cartão de crédito para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aberta, paga, vencida]
 *         description: Status da fatura para filtrar
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês para filtrar
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano para filtrar
 *     responses:
 *       200:
 *         description: Lista de faturas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreditCardInvoice'
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
router.get('/invoices', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { credit_card_id, status, mes, ano } = req.query;

    let query = supabase
      .from('credit_card_invoices')
      .select(`
        *,
        poupeja_credit_cards!inner(
          id,
          name,
          brand,
          user_id
        ),
        credit_card_expenses(
          id,
          nome,
          valor,
          data_compra,
          observacao,
          categoria_id,
          poupeja_categories(
            id,
            name
          )
        )
      `)
      .eq('poupeja_credit_cards.user_id', userId);

    // Aplicar filtros
    if (credit_card_id) {
      query = query.eq('credit_card_id', credit_card_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (mes) {
      query = query.eq('mes', mes);
    }
    if (ano) {
      query = query.eq('ano', ano);
    }

    const { data, error } = await query.order('ano', { ascending: false })
                                       .order('mes', { ascending: false });

    if (error) {
      console.error('Erro ao buscar faturas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro no endpoint de listar faturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /credit-cards/invoices - Criar fatura manualmente
router.post('/invoices', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { credit_card_id, mes, ano, data_vencimento, observacao } = req.body;

    // Validar dados obrigatórios
    if (!credit_card_id || !mes || !ano || !data_vencimento) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Verificar se o cartão pertence ao usuário
    const { data: creditCard, error: cardError } = await supabase
      .from('poupeja_credit_cards')
      .select('id, user_id')
      .eq('id', credit_card_id)
      .eq('user_id', userId)
      .single();

    if (cardError || !creditCard) {
      return res.status(404).json({ error: 'Cartão de crédito não encontrado' });
    }

    // Verificar se já existe fatura para o mês/ano
    const { data: existingInvoice } = await supabase
      .from('credit_card_invoices')
      .select('id')
      .eq('credit_card_id', credit_card_id)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    if (existingInvoice) {
      return res.status(400).json({ error: 'Já existe uma fatura para este mês/ano' });
    }

    // Criar nova fatura
    const { data: newInvoice, error: insertError } = await supabase
      .from('credit_card_invoices')
      .insert({
        credit_card_id,
        mes,
        ano,
        data_vencimento,
        observacao,
        status: 'aberta'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar fatura:', insertError);
      return res.status(500).json({ error: 'Erro ao criar fatura' });
    }

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Erro no endpoint de criar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /credit-cards/invoices/{id} - Detalhes da fatura
router.get('/invoices/:id', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;

    // Buscar fatura com despesas
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .select(`
        *,
        poupeja_credit_cards!inner(
          id,
          name,
          brand,
          user_id
        ),
        credit_card_expenses(
          id,
          categoria_id,
          nome,
          valor,
          data_compra,
          observacao,
          created_at,
          poupeja_categories(
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('poupeja_credit_cards.user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Erro no endpoint de detalhes da fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /credit-cards/expenses - Criar despesa
router.post('/expenses', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('=== DADOS RECEBIDOS ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', userId);

    const { 
      invoice_id, 
      categoria_id, 
      nome, 
      valor, 
      data_compra, 
      observacao,
      credit_card_id, // Para criar fatura automaticamente se necessário
      // Campos para compra parcelada
      is_parcelada,
      numero_parcelas,
      data_primeira_parcela
    } = req.body;

    console.log('=== DADOS EXTRAÍDOS ===');
    console.log('invoice_id:', invoice_id);
    console.log('credit_card_id:', credit_card_id);
    console.log('categoria_id:', categoria_id);
    console.log('nome:', nome);
    console.log('valor:', valor);
    console.log('is_parcelada:', is_parcelada);

    // Validar dados obrigatórios
    if (!nome || !valor) {
      return res.status(400).json({ error: 'Nome e valor são obrigatórios' });
    }

    if (!categoria_id) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    // Validar cartão de crédito - obrigatório quando não há invoice_id
    if (!invoice_id && !credit_card_id) {
      return res.status(400).json({ error: 'Cartão de crédito é obrigatório quando não há fatura específica' });
    }

    // Validar dados específicos para compra parcelada
    if (is_parcelada === true || is_parcelada === 'true') {
      if (!numero_parcelas || numero_parcelas < 2 || numero_parcelas > 24) {
        return res.status(400).json({ error: 'Número de parcelas deve ser entre 2 e 24' });
      }
      if (!data_primeira_parcela) {
        return res.status(400).json({ error: 'Data da primeira parcela é obrigatória' });
      }
      if (!credit_card_id) {
        return res.status(400).json({ error: 'ID do cartão é obrigatório para compras parceladas' });
      }
    } else {
      if (!data_compra) {
        return res.status(400).json({ error: 'Data da compra é obrigatória' });
      }
    }

    // Formatar data sem problemas de timezone
    const formatDateForDB = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Processar compra parcelada ou à vista
    if (is_parcelada === true || is_parcelada === 'true') {
      // Processar compra parcelada
      const valorTotal = valor;
      const numeroParcelas = numero_parcelas;
      const valorBaseParcela = Math.floor((valorTotal / numeroParcelas) * 100) / 100; // Arredonda para baixo
      const diferenca = valorTotal - (valorBaseParcela * numeroParcelas); // Calcula a diferença
      // Buscar dados do cartão para obter closing_day e due_day
      const { data: creditCard, error: cardError } = await supabase
        .from('poupeja_credit_cards')
        .select('closing_day, due_day')
        .eq('id', credit_card_id)
        .single();

      if (cardError || !creditCard) {
        console.error('Erro ao buscar cartão:', cardError);
        return res.status(500).json({ error: 'Erro ao buscar dados do cartão' });
      }

      const despesasCriadas = [];

      for (let i = 0; i < numero_parcelas; i++) {
        // Calcular data da parcela de forma mais robusta
        const dataPrimeiraParcela = new Date(data_primeira_parcela);
        const anoBase = dataPrimeiraParcela.getFullYear();
        const mesBase = dataPrimeiraParcela.getMonth(); // 0-based
        
        // Calcular mês e ano da parcela atual
        const mesParcela = mesBase + i;
        const anoParcela = anoBase + Math.floor(mesParcela / 12);
        const mesFinal = (mesParcela % 12) + 1; // Converter para 1-based
        
        const mes = mesFinal;
        const ano = anoParcela;

        // Buscar ou criar fatura para o mês da parcela
        let invoiceId = null;
        
        // Verificar se fatura já existe
        const { data: existingInvoice } = await supabase
          .from('credit_card_invoices')
          .select('id')
          .eq('credit_card_id', credit_card_id)
          .eq('mes', mes)
          .eq('ano', ano)
          .single();

        if (existingInvoice) {
          invoiceId = existingInvoice.id;
        } else {
          // Criar nova fatura usando o due_day do cartão
          const dataVencimento = new Date(ano, mes - 1, creditCard.due_day);
          
          const { data: newInvoice, error: invoiceError } = await supabase
            .from('credit_card_invoices')
            .insert({
              credit_card_id,
              mes,
              ano,
              data_vencimento: formatDateForDB(dataVencimento),
              status: 'aberta'
            })
            .select('id')
            .single();

          if (invoiceError) {
            console.error('Erro ao criar fatura:', invoiceError);
            return res.status(500).json({ error: 'Erro ao criar fatura' });
          }

          invoiceId = newInvoice.id;
        }

        // Calcular valor da parcela (última recebe a diferença de centavos)
        const valorParcela = i === numero_parcelas - 1 
          ? valorBaseParcela + diferenca 
          : valorBaseParcela;

        // Criar despesa da parcela
        const dataParcela = new Date(ano, mes - 1, new Date(data_primeira_parcela).getDate());
        
        console.log(`=== CRIANDO PARCELA ${i + 1}/${numero_parcelas} ===`);
        console.log('invoiceId:', invoiceId);
        console.log('categoria_id:', categoria_id);
        console.log('valorParcela:', valorParcela);
        console.log('dataParcela:', formatDateForDB(dataParcela));
        
        const { data: newExpense, error: insertError } = await supabase
          .from('credit_card_expenses')
          .insert({
            invoice_id: invoiceId,
            categoria_id,
            nome: `${nome} (${i + 1}/${numero_parcelas})`,
            valor: valorParcela,
            data_compra: formatDateForDB(dataParcela),
            observacao: observacao ? `${observacao} - Parcela ${i + 1}/${numero_parcelas}` : `Parcela ${i + 1}/${numero_parcelas}`
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Erro ao criar despesa da parcela:', insertError);
          console.error('Detalhes do erro:', JSON.stringify(insertError, null, 2));
          return res.status(500).json({ error: 'Erro ao criar despesa da parcela', details: insertError });
        }

        despesasCriadas.push(newExpense);
      }

      res.status(201).json({
        message: 'Compra parcelada criada com sucesso',
        parcelas: despesasCriadas,
        total_parcelas: numero_parcelas,
        valor_total: valorTotal,
        valor_base_parcela: valorBaseParcela,
        diferenca_ultima_parcela: diferenca
      });
    } else {
      // Processar compra à vista (lógica original)
    let finalInvoiceId = invoice_id;

    // Se não foi fornecida invoice_id, criar fatura automaticamente
    if (!finalInvoiceId && credit_card_id) {
      // Buscar dados do cartão para obter closing_day e due_day
      const { data: creditCard, error: cardError } = await supabase
        .from('poupeja_credit_cards')
        .select('closing_day, due_day')
        .eq('id', credit_card_id)
        .single();

      if (cardError || !creditCard) {
        console.error('Erro ao buscar cartão:', cardError);
        return res.status(500).json({ error: 'Erro ao buscar dados do cartão' });
      }

      const dataCompra = new Date(data_compra);
      const diaCompra = dataCompra.getDate();
      const mesCompra = dataCompra.getMonth() + 1;
      const anoCompra = dataCompra.getFullYear();

      // Determinar mês e ano da fatura baseado no closing_day
      let mesFatura, anoFatura;
      
      if (diaCompra >= creditCard.closing_day) {
        // Compra após o fechamento: vai para a fatura do próximo mês
        mesFatura = mesCompra + 1;
        anoFatura = anoCompra;
        
        // Ajustar para dezembro/janeiro
        if (mesFatura > 12) {
          mesFatura = 1;
          anoFatura += 1;
        }
      } else {
        // Compra antes do fechamento: vai para a fatura do mês atual
        mesFatura = mesCompra;
        anoFatura = anoCompra;
      }

      // Calcular data de vencimento usando o due_day do cartão
      const dataVencimento = new Date(anoFatura, mesFatura - 1, creditCard.due_day);

      // Usar função RPC para criar fatura se não existir
      const { data: invoiceId, error: rpcError } = await supabase
        .rpc('create_invoice_if_not_exists', {
          p_credit_card_id: credit_card_id,
          p_mes: mesFatura,
          p_ano: anoFatura,
          p_data_vencimento: formatDateForDB(dataVencimento)
        });

      if (rpcError) {
        console.error('Erro ao criar fatura automaticamente:', rpcError);
        return res.status(500).json({ error: 'Erro ao criar fatura' });
      }

      finalInvoiceId = invoiceId;
    }

    if (!finalInvoiceId) {
      return res.status(400).json({ error: 'ID da fatura é obrigatório' });
    }

    // Verificar se a fatura pertence ao usuário
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .select(`
        id,
        poupeja_credit_cards!inner(
          id,
          user_id
        )
      `)
      .eq('id', finalInvoiceId)
      .eq('poupeja_credit_cards.user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Criar despesa
    const { data: newExpense, error: insertError } = await supabase
      .from('credit_card_expenses')
      .insert({
        invoice_id: finalInvoiceId,
        categoria_id,
        nome,
        valor,
        data_compra,
        observacao
      })
      .select(`
        *,
        poupeja_categories(
          id,
          name
        )
      `)
      .single();

    if (insertError) {
      console.error('Erro ao criar despesa:', insertError);
      return res.status(500).json({ error: 'Erro ao criar despesa' });
    }

    res.status(201).json(newExpense);
    }
  } catch (error) {
    console.error('Erro no endpoint de criar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /credit-cards/expenses/{id} - Editar despesa
router.put('/expenses/:id', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const { categoria_id, nome, valor, data_compra, observacao } = req.body;

    // Verificar se a despesa pertence ao usuário
    const { data: expense, error: expenseError } = await supabase
      .from('credit_card_expenses')
      .select(`
        id,
        credit_card_invoices!inner(
          id,
          poupeja_credit_cards!inner(
            id,
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('credit_card_invoices.poupeja_credit_cards.user_id', userId)
      .single();

    if (expenseError || !expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    // Atualizar despesa
    const { data: updatedExpense, error: updateError } = await supabase
      .from('credit_card_expenses')
      .update({
        categoria_id,
        nome,
        valor,
        data_compra,
        observacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        poupeja_categories(
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Erro ao atualizar despesa:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar despesa' });
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Erro no endpoint de editar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /credit-cards/expenses/{id} - Remover despesa
router.delete('/expenses/:id', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;

    // Verificar se a despesa pertence ao usuário
    const { data: expense, error: expenseError } = await supabase
      .from('credit_card_expenses')
      .select(`
        id,
        credit_card_invoices!inner(
          id,
          poupeja_credit_cards!inner(
            id,
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('credit_card_invoices.poupeja_credit_cards.user_id', userId)
      .single();

    if (expenseError || !expense) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    // Remover despesa
    const { error: deleteError } = await supabase
      .from('credit_card_expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao remover despesa:', deleteError);
      return res.status(500).json({ error: 'Erro ao remover despesa' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro no endpoint de remover despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /credit-cards/invoices/{id}/status - Atualizar status da fatura
router.put('/invoices/:id/status', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['aberta', 'paga', 'vencida'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar se a fatura pertence ao usuário
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .select(`
        id,
        poupeja_credit_cards!inner(
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('poupeja_credit_cards.user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Atualizar status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('credit_card_invoices')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar status da fatura:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar status da fatura' });
    }

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Erro no endpoint de atualizar status da fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /credit-cards/invoices/{id} - Excluir fatura
router.delete('/invoices/:id', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;

    // Verificar se a fatura pertence ao usuário
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .select(`
        id,
        poupeja_credit_cards!inner(
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('poupeja_credit_cards.user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Verificar se há despesas vinculadas à fatura
    const { data: expenses, error: expensesError } = await supabase
      .from('credit_card_expenses')
      .select('id')
      .eq('invoice_id', id);

    if (expensesError) {
      console.error('Erro ao verificar despesas:', expensesError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Excluir despesas vinculadas primeiro (cascata)
    if (expenses && expenses.length > 0) {
      const { error: deleteExpensesError } = await supabase
        .from('credit_card_expenses')
        .delete()
        .eq('invoice_id', id);

      if (deleteExpensesError) {
        console.error('Erro ao excluir despesas:', deleteExpensesError);
        return res.status(500).json({ error: 'Erro ao excluir despesas vinculadas' });
      }
    }

    // Excluir fatura
    const { error: deleteError } = await supabase
      .from('credit_card_invoices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao excluir fatura:', deleteError);
      return res.status(500).json({ error: 'Erro ao excluir fatura' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro no endpoint de excluir fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /credit-cards/invoices/pay - Pagar fatura
router.post('/invoices/pay', authenticateToken, async (req: express.Request, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { invoice_id, bank_account_id, category_id, payment_date } = req.body;

    // Validações
    if (!invoice_id || !bank_account_id || !category_id || !payment_date) {
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios: invoice_id, bank_account_id, category_id, payment_date' 
      });
    }

    // Verificar se a fatura existe e pertence ao usuário
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .select(`
        *,
        poupeja_credit_cards!inner(
          id,
          name,
          user_id
        )
      `)
      .eq('id', invoice_id)
      .eq('poupeja_credit_cards.user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    // Verificar se a fatura já está paga
    if (invoice.status === 'paga') {
      return res.status(400).json({ error: 'Esta fatura já foi paga' });
    }

    // Verificar se a conta bancária existe e pertence ao usuário
    const { data: bankAccount, error: bankAccountError } = await supabase
      .from('poupeja_bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('user_id', userId)
      .single();

    if (bankAccountError || !bankAccount) {
      return res.status(404).json({ error: 'Conta bancária não encontrada' });
    }

    // Verificar se a categoria existe e pertence ao usuário
    const { data: category, error: categoryError } = await supabase
      .from('poupeja_categories')
      .select('*')
      .eq('id', category_id)
      .eq('user_id', userId)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se a categoria é do tipo 'expense'
    if (category.type !== 'expense') {
      return res.status(400).json({ error: 'A categoria deve ser do tipo despesa' });
    }

    // Iniciar transação
    const { data: transaction, error: transactionError } = await supabase
      .from('poupeja_transactions')
      .insert({
        user_id: userId,
        bank_account_id: bank_account_id,
        category_id: category_id,
        type: 'expense',
        amount: invoice.valor_total,
        description: `Pagamento da fatura ${invoice.poupeja_credit_cards.name} - ${invoice.mes.toString().padStart(2, '0')}/${invoice.ano}`,
        date: payment_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erro ao criar transação:', transactionError);
      return res.status(500).json({ error: 'Erro ao criar transação de pagamento' });
    }

    // Atualizar status da fatura para 'paga'
    const { error: updateInvoiceError } = await supabase
      .from('credit_card_invoices')
      .update({ 
        status: 'paga',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice_id);

    if (updateInvoiceError) {
      console.error('Erro ao atualizar status da fatura:', updateInvoiceError);
      // Tentar reverter a transação
      await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', transaction.id);
      
      return res.status(500).json({ error: 'Erro ao atualizar status da fatura' });
    }

    res.status(200).json({
      success: true,
      message: 'Fatura paga com sucesso',
      transaction: transaction,
      invoice: {
        id: invoice.id,
        status: 'paga'
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de pagar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
