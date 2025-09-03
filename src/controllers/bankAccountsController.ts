import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Obter todas as contas bancárias do usuário
export const getBankAccounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    // Verificar se é usuário vinculado e obter o ID efetivo
    const { data: linkedUser } = await supabase.rpc('is_linked_user', {
      user_uuid: userId
    });

    let effectiveUserId = userId;
    if (linkedUser) {
      const { data: mainUserId } = await supabase.rpc('get_main_user_id', {
        user_uuid: userId
      });
      if (mainUserId) {
        effectiveUserId = mainUserId;
      }
    }

    const { data, error } = await supabase
      .from('poupeja_bank_accounts')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro no controller getBankAccounts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova conta bancária
export const createBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const { name, is_default = false } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da conta é obrigatório' });
    }

    // Verificar se é usuário vinculado e obter o ID efetivo
    const { data: linkedUser } = await supabase.rpc('is_linked_user', {
      user_uuid: userId
    });

    let effectiveUserId = userId;
    if (linkedUser) {
      const { data: mainUserId } = await supabase.rpc('get_main_user_id', {
        user_uuid: userId
      });
      if (mainUserId) {
        effectiveUserId = mainUserId;
      }
    }

    // Verificar permissões de edição
    const { data: hasFullAccess } = await supabase.rpc('has_full_access', {
      user_uuid: userId
    });

    if (!hasFullAccess) {
      return res.status(403).json({ error: 'Você não tem permissão para criar contas bancárias' });
    }

    // Se está marcando como padrão, desmarcar outras contas
    if (is_default) {
      await supabase
        .from('poupeja_bank_accounts')
        .update({ is_default: false })
        .eq('user_id', effectiveUserId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('poupeja_bank_accounts')
      .insert({
        user_id: effectiveUserId,
        name,
        is_default
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta bancária:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro no controller createBankAccount:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar conta bancária
export const updateBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const { id } = req.params;
    const { name, is_default } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID da conta é obrigatório' });
    }

    // Verificar se é usuário vinculado e obter o ID efetivo
    const { data: linkedUser } = await supabase.rpc('is_linked_user', {
      user_uuid: userId
    });

    let effectiveUserId = userId;
    if (linkedUser) {
      const { data: mainUserId } = await supabase.rpc('get_main_user_id', {
        user_uuid: userId
      });
      if (mainUserId) {
        effectiveUserId = mainUserId;
      }
    }

    // Verificar permissões de edição
    const { data: hasFullAccess } = await supabase.rpc('has_full_access', {
      user_uuid: userId
    });

    if (!hasFullAccess) {
      return res.status(403).json({ error: 'Você não tem permissão para editar contas bancárias' });
    }

    // Se está marcando como padrão, desmarcar outras contas
    if (is_default) {
      await supabase
        .from('poupeja_bank_accounts')
        .update({ is_default: false })
        .eq('user_id', effectiveUserId)
        .eq('is_default', true);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabase
      .from('poupeja_bank_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', effectiveUserId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta bancária:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro no controller updateBankAccount:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir conta bancária (desativar)
export const deleteBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID da conta é obrigatório' });
    }

    // Verificar se é usuário vinculado e obter o ID efetivo
    const { data: linkedUser } = await supabase.rpc('is_linked_user', {
      user_uuid: userId
    });

    let effectiveUserId = userId;
    if (linkedUser) {
      const { data: mainUserId } = await supabase.rpc('get_main_user_id', {
        user_uuid: userId
      });
      if (mainUserId) {
        effectiveUserId = mainUserId;
      }
    }

    // Verificar permissões de edição
    const { data: hasFullAccess } = await supabase.rpc('has_full_access', {
      user_uuid: userId
    });

    if (!hasFullAccess) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir contas bancárias' });
    }

    const { error } = await supabase
      .from('poupeja_bank_accounts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', effectiveUserId);

    if (error) {
      console.error('Erro ao excluir conta bancária:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({ message: 'Conta bancária excluída com sucesso' });
  } catch (error) {
    console.error('Erro no controller deleteBankAccount:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter conta padrão
export const getDefaultAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    // Verificar se é usuário vinculado e obter o ID efetivo
    const { data: linkedUser } = await supabase.rpc('is_linked_user', {
      user_uuid: userId
    });

    let effectiveUserId = userId;
    if (linkedUser) {
      const { data: mainUserId } = await supabase.rpc('get_main_user_id', {
        user_uuid: userId
      });
      if (mainUserId) {
        effectiveUserId = mainUserId;
      }
    }

    const { data, error } = await supabase
      .from('poupeja_bank_accounts')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar conta padrão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json(data || null);
  } catch (error) {
    console.error('Erro no controller getDefaultAccount:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
