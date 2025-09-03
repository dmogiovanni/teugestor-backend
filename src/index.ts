import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { supabase } from './supabaseClient';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://teugestor.com.br'],
  credentials: true
}));

app.get('/', (req: Request, res: Response) => {
  res.send('Teu Gestor Backend rodando!');
});

// Endpoint de debug para verificar usuários
app.get('/debug/users', async (req: Request, res: Response) => {
  try {
    // Verificar usuários na tabela poupeja_users
    const { data: poupejaUsers, error: poupejaError } = await supabase
      .from('poupeja_users')
      .select('*')
      .limit(10);

    // Verificar usuários na auth (apenas contagem)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    // Verificar assinaturas
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('poupeja_subscriptions')
      .select('*')
      .limit(5);

    res.status(200).json({
      poupeja_users: {
        count: poupejaUsers?.length || 0,
        data: poupejaUsers,
        error: poupejaError?.message
      },
      auth_users: {
        count: authUsers?.users?.length || 0,
        error: authError?.message
      },
      poupeja_subscriptions: {
        count: subscriptions?.length || 0,
        data: subscriptions,
        error: subscriptionsError?.message
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para criação manual de usuários pelo admin
app.post('/admin/create-user', async (req: Request, res: Response) => {
  try {
    console.log('Dados recebidos:', req.body);
    
    const { 
      name, 
      email, 
      whatsapp, 
      password, 
      accessPeriodDays 
    } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !whatsapp || !password || !accessPeriodDays) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios: name, email, whatsapp, password, accessPeriodDays'
      });
    }

    // Validação do período de acesso
    if (accessPeriodDays <= 0 || !Number.isInteger(accessPeriodDays)) {
      return res.status(400).json({
        error: 'accessPeriodDays deve ser um número inteiro positivo'
      });
    }

    console.log('Tentando criar usuário na auth...');
    
    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        whatsapp,
        full_name: name
      },
      app_metadata: {
        name,
        whatsapp
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário na autenticação:', authError);
      return res.status(500).json({
        error: 'Erro ao criar usuário na autenticação',
        details: authError.message
      });
    }

    console.log('Usuário criado na auth:', authData.user.id);
    const userId = authData.user.id;

    // Atualizar o usuário na auth para definir o nome de exibição
    console.log('Atualizando nome do usuário na auth...');
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        name,
        whatsapp,
        full_name: name
      },
      app_metadata: {
        name,
        whatsapp
      }
    });

    if (updateAuthError) {
      console.error('Erro ao atualizar usuário na auth:', updateAuthError);
      // Continuar mesmo com erro na atualização do nome
    } else {
      console.log('Nome atualizado na auth com sucesso');
    }

    // 2. Criar/atualizar registro na tabela poupeja_users
    // Observação: alguns ambientes podem ter trigger que insere automaticamente
    // o usuário em poupeja_users quando ele é criado em auth.users. Para evitar
    // erro de chave duplicada, usamos upsert com conflito em 'id'.
    // Remover o +55 do telefone para a tabela poupeja_users
    const phoneForPoupejaUsers = whatsapp.startsWith('+55') ? whatsapp.substring(3) : whatsapp;
    console.log('Sincronizando registro em poupeja_users (upsert)...', { phoneForPoupejaUsers });
    const { error: userError } = await supabase
      .from('poupeja_users')
      .upsert({
        id: userId,
        email,
        name,
        phone: phoneForPoupejaUsers
      }, { onConflict: 'id' });

    if (userError) {
      console.error('Erro ao criar usuário na tabela poupeja_users:', userError);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: 'Erro ao criar perfil do usuário',
        details: userError.message
      });
    }

    console.log('Registro criado na poupeja_users');

    // 3. Calcular datas de período
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + accessPeriodDays);

    // 4. Criar registro na tabela poupeja_subscriptions
    console.log('Tentando criar assinatura...');
    const { error: subscriptionError } = await supabase
      .from('poupeja_subscriptions')
      .insert({
        user_id: userId,
        status: 'active',
        plan_type: 'manual',
        current_period_start: currentDate.toISOString(),
        current_period_end: endDate.toISOString(),
        is_manual: true
      });

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
      await supabase.from('poupeja_users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: 'Erro ao criar assinatura',
        details: subscriptionError.message
      });
    }

    console.log('Assinatura criada com sucesso');

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: userId,
        email,
        name,
        whatsapp,
        accessPeriodDays,
        subscriptionEnd: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para listagem de usuários pelo admin
app.get('/admin/users', async (req: Request, res: Response) => {
  try {
    // 1. Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from('poupeja_users')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return res.status(500).json({
        error: 'Erro ao buscar usuários',
        details: usersError.message
      });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        message: 'Usuários listados com sucesso',
        total: 0,
        users: []
      });
    }

    // 2. Buscar assinaturas para cada usuário
    const userIds = users.map(user => user.id);
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('poupeja_subscriptions')
      .select('user_id, status, plan_type, current_period_end, is_manual')
      .in('user_id', userIds);

    if (subscriptionsError) {
      console.error('Erro ao buscar assinaturas:', subscriptionsError);
      // Continuar mesmo com erro nas assinaturas
    }

    // 3. Combinar dados
    const formattedUsers = users.map((user: any) => {
      const userSubscription = subscriptions?.find(sub => sub.user_id === user.id);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp: user.phone,
        createdAt: user.created_at,
        subscription: {
          status: userSubscription?.status || 'inactive',
          planType: userSubscription?.plan_type || 'unknown',
          endDate: userSubscription?.current_period_end || null,
          isManual: userSubscription?.is_manual || false
        }
      };
    });

    res.status(200).json({
      message: 'Usuários listados com sucesso',
      total: formattedUsers.length,
      users: formattedUsers
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 80;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

export default app; 