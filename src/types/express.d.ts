import { Request } from 'express';
import { User } from '@supabase/supabase-js';

// Estender o tipo Request para incluir a propriedade user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
