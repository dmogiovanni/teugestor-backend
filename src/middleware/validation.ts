import { Request, Response, NextFunction } from 'express';

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Campos obrigatórios: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

export const validatePermissionType = (req: Request, res: Response, next: NextFunction) => {
  const { permission_type } = req.body;
  
  if (permission_type && !['view_only', 'full_access'].includes(permission_type)) {
    return res.status(400).json({
      error: 'permission_type deve ser "view_only" ou "full_access"'
    });
  }
  
  next();
};

export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }
  }
  
  next();
};
