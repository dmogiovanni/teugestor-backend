import { Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import { AuthenticatedRequest } from '../middleware/auth';

export interface CreateLinkedUserData {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  permission_type: 'view_only' | 'full_access';
}

export interface UpdateLinkedUserData {
  permission_type?: 'view_only' | 'full_access';
  is_active?: boolean;
  linked_user_name?: string;
  linked_user_email?: string;
  linked_user_phone?: string;
}

export const getLinkedUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    // Buscar usuários vinculados
    const { data: linkedUsers, error: linkedUsersError } = await supabase
      .from('linked_users')
      .select('*')
      .eq('main_user_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (linkedUsersError) {
      console.error('Erro ao buscar usuários vinculados:', linkedUsersError);
      return res.status(500).json({
        error: 'Erro ao buscar usuários vinculados',
        details: linkedUsersError.message
      });
    }

    // Formatar resposta
    const formattedLinkedUsers = (linkedUsers || []).map((linkedUser: any) => ({
      id: linkedUser.id,
      linked_user_id: linkedUser.linked_user_id,
      permission_type: linkedUser.permission_type,
      is_active: linkedUser.is_active,
      created_at: linkedUser.created_at,
      updated_at: linkedUser.updated_at,
      user_info: {
        id: linkedUser.linked_user_id,
        email: linkedUser.linked_user_email,
        name: linkedUser.linked_user_name,
        phone: linkedUser.linked_user_phone || ''
      }
    }));

    res.status(200).json({
      message: 'Usuários vinculados listados com sucesso',
      total: formattedLinkedUsers.length,
      linked_users: formattedLinkedUsers
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const createLinkedUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const { 
      name, 
      email, 
      password, 
      whatsapp, 
      permission_type 
    } = req.body as CreateLinkedUserData;

    console.log('Criando usuário vinculado:', { name, email, permission_type });

    // 1. Criar usuário na autenticação
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone: whatsapp
      }
    });

    if (createAuthError) {
      console.error('Erro ao criar usuário na autenticação:', createAuthError);
      return res.status(500).json({
        error: 'Erro ao criar usuário na autenticação',
        details: createAuthError.message
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        error: 'Erro ao criar usuário'
      });
    }

    // 2. Criar vínculo na tabela linked_users
    const { data: linkData, error: linkError } = await supabase
      .from('linked_users')
      .insert({
        main_user_id: req.user.id,
        linked_user_id: authData.user.id,
        permission_type,
        linked_user_name: name,
        linked_user_email: email,
        linked_user_phone: whatsapp
      })
      .select()
      .single();

    if (linkError) {
      console.error('Erro ao criar vínculo:', linkError);
      // Limpar usuário criado na auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Erro ao criar vínculo do usuário',
        details: linkError.message
      });
    }

    console.log('Usuário vinculado criado com sucesso');

    res.status(201).json({
      message: 'Usuário vinculado criado com sucesso',
      linked_user: {
        id: linkData.id,
        linked_user_id: authData.user.id,
        permission_type: linkData.permission_type,
        user_info: {
          id: authData.user.id,
          email,
          name,
          phone: whatsapp
        }
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const updateLinkedUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const linkedUserId = req.params.id;
    const updateData = req.body as UpdateLinkedUserData;

    // Preparar dados para atualização
    const dataToUpdate: any = {};
    if (updateData.permission_type !== undefined) dataToUpdate.permission_type = updateData.permission_type;
    if (updateData.is_active !== undefined) dataToUpdate.is_active = updateData.is_active;
    if (updateData.linked_user_name !== undefined) dataToUpdate.linked_user_name = updateData.linked_user_name;
    if (updateData.linked_user_email !== undefined) dataToUpdate.linked_user_email = updateData.linked_user_email;
    if (updateData.linked_user_phone !== undefined) dataToUpdate.linked_user_phone = updateData.linked_user_phone;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo válido fornecido para atualização'
      });
    }

    // Atualizar usuário vinculado
    const { data: updatedLinkedUser, error: updateError } = await supabase
      .from('linked_users')
      .update(dataToUpdate)
      .eq('id', linkedUserId)
      .eq('main_user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar usuário vinculado:', updateError);
      return res.status(500).json({
        error: 'Erro ao atualizar usuário vinculado',
        details: updateError.message
      });
    }

    if (!updatedLinkedUser) {
      return res.status(404).json({
        error: 'Usuário vinculado não encontrado'
      });
    }

    res.status(200).json({
      message: 'Usuário vinculado atualizado com sucesso',
      linked_user: {
        id: updatedLinkedUser.id,
        linked_user_id: updatedLinkedUser.linked_user_id,
        permission_type: updatedLinkedUser.permission_type,
        is_active: updatedLinkedUser.is_active,
        user_info: {
          id: updatedLinkedUser.linked_user_id,
          email: updatedLinkedUser.linked_user_email,
          name: updatedLinkedUser.linked_user_name,
          phone: updatedLinkedUser.linked_user_phone || ''
        }
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const deleteLinkedUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const linkedUserId = req.params.id;

    // Desativar usuário vinculado
    const { error: deleteError } = await supabase
      .from('linked_users')
      .update({ is_active: false })
      .eq('id', linkedUserId)
      .eq('main_user_id', req.user.id);

    if (deleteError) {
      console.error('Erro ao excluir usuário vinculado:', deleteError);
      return res.status(500).json({
        error: 'Erro ao excluir usuário vinculado',
        details: deleteError.message
      });
    }

    res.status(200).json({
      message: 'Usuário vinculado excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};
