import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teu Gestor API',
      version: '1.0.0',
      description: 'API para o sistema de controle financeiro Teu Gestor',
      contact: {
        name: 'Teu Gestor Team',
        email: 'contato@teugestor.com.br'
      }
    },
    servers: [
      {
        url: 'http://localhost:80',
        description: 'Servidor de desenvolvimento'
      },
      {
        url: 'https://apiback.teugestor.com.br',
        description: 'Servidor de produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT do Supabase'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            details: {
              type: 'string',
              description: 'Detalhes adicionais do erro'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de sucesso'
            },
            data: {
              type: 'object',
              description: 'Dados retornados'
            }
          }
        },
        BankAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da conta bancária'
            },
            name: {
              type: 'string',
              description: 'Nome da conta bancária'
            },
            bank: {
              type: 'string',
              description: 'Nome do banco'
            },
            account_type: {
              type: 'string',
              enum: ['checking', 'savings', 'investment'],
              description: 'Tipo da conta'
            },
            balance: {
              type: 'number',
              format: 'decimal',
              description: 'Saldo atual da conta'
            },
            is_default: {
              type: 'boolean',
              description: 'Se é a conta padrão'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do usuário proprietário'
            }
          }
        },
        CreditCard: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do cartão'
            },
            name: {
              type: 'string',
              description: 'Nome do cartão'
            },
            brand: {
              type: 'string',
              description: 'Bandeira do cartão'
            },
            limit: {
              type: 'number',
              format: 'decimal',
              description: 'Limite do cartão'
            },
            used_limit: {
              type: 'number',
              format: 'decimal',
              description: 'Limite utilizado'
            },
            due_day: {
              type: 'integer',
              minimum: 1,
              maximum: 31,
              description: 'Dia de vencimento da fatura'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do usuário proprietário'
            }
          }
        },
        CreditCardInvoice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da fatura'
            },
            credit_card_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cartão de crédito'
            },
            mes: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Mês da fatura'
            },
            ano: {
              type: 'integer',
              description: 'Ano da fatura'
            },
            valor_total: {
              type: 'number',
              format: 'decimal',
              description: 'Valor total da fatura'
            },
            status: {
              type: 'string',
              enum: ['aberta', 'paga', 'vencida'],
              description: 'Status da fatura'
            },
            data_vencimento: {
              type: 'string',
              format: 'date',
              description: 'Data de vencimento'
            }
          }
        },
        CreditCardExpense: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da despesa'
            },
            invoice_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da fatura'
            },
            categoria_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da categoria'
            },
            nome: {
              type: 'string',
              description: 'Nome da despesa'
            },
            valor: {
              type: 'number',
              format: 'decimal',
              description: 'Valor da despesa'
            },
            data_compra: {
              type: 'string',
              format: 'date',
              description: 'Data da compra'
            },
            observacao: {
              type: 'string',
              description: 'Observações'
            },
            numero_parcela: {
              type: 'string',
              description: 'Número da parcela (ex: "1/3")'
            },
            parcela_total: {
              type: 'integer',
              description: 'Total de parcelas'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da categoria'
            },
            name: {
              type: 'string',
              description: 'Nome da categoria'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Tipo da categoria'
            },
            icon: {
              type: 'string',
              description: 'Ícone da categoria'
            },
            color: {
              type: 'string',
              description: 'Cor da categoria'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do usuário proprietário'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da transação'
            },
            bank_account_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da conta bancária'
            },
            category_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da categoria'
            },
            description: {
              type: 'string',
              description: 'Descrição da transação'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Valor da transação'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense', 'transfer'],
              description: 'Tipo da transação'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Data da transação'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do usuário proprietário'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde do servidor'
      },
      {
        name: 'Auth',
        description: 'Endpoints de autenticação'
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos'
      },
      {
        name: 'Bank Accounts',
        description: 'Gerenciamento de contas bancárias'
      },
      {
        name: 'Credit Cards',
        description: 'Gerenciamento de cartões de crédito'
      },
      {
        name: 'Credit Card Invoices',
        description: 'Gerenciamento de faturas de cartão de crédito'
      },
      {
        name: 'Linked Users',
        description: 'Gerenciamento de usuários vinculados'
      },
      {
        name: 'Transfers',
        description: 'Transferências entre contas'
      }
    ]
  },
  apis: [
    './src/routes/auth.ts',
    './src/routes/bankAccounts.ts',
    './src/routes/creditCards.ts',
    './src/routes/creditCardInvoices.ts',
    './src/routes/transfers.ts',
    './src/routes/linkedUsers.ts',
    './src/routes/admin.ts',
    './src/index.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Debug: verificar se as specs foram geradas
  console.log('Swagger paths encontrados:', specs.paths ? Object.keys(specs.paths) : 'Nenhum path encontrado');
  
  app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Teu Gestor API Documentation'
  }));
};

export default specs;
