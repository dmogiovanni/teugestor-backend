export interface CreditCardInvoice {
  id: string;
  credit_card_id: string;
  mes: number;
  ano: number;
  data_vencimento: string;
  valor_total: number;
  status: 'aberta' | 'paga' | 'vencida';
  observacao?: string;
  created_at: string;
  updated_at: string;
  poupeja_credit_cards?: {
    id: string;
    name: string;
    brand: string;
    user_id: string;
  };
  credit_card_expenses?: CreditCardExpense[];
}

export interface CreditCardExpense {
  id: string;
  invoice_id: string;
  categoria_id?: string;
  nome: string;
  valor: number;
  data_compra: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
  poupeja_categories?: {
    id: string;
    name: string;
  };
}

export interface CreateInvoiceData {
  credit_card_id: string;
  mes: number;
  ano: number;
  data_vencimento: string;
  observacao?: string;
}

export interface CreateExpenseData {
  invoice_id?: string;
  credit_card_id?: string; // Para criar fatura automaticamente
  categoria_id?: string;
  nome: string;
  valor: number;
  data_compra: string;
  observacao?: string;
}

export interface UpdateExpenseData {
  categoria_id?: string;
  nome?: string;
  valor?: number;
  data_compra?: string;
  observacao?: string;
}

export interface UpdateInvoiceStatusData {
  status: 'aberta' | 'paga' | 'vencida';
}
