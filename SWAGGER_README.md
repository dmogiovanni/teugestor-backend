# Swagger API Documentation

## Visão Geral

A documentação da API do Teu Gestor foi implementada usando Swagger/OpenAPI 3.0. Todas as rotas do backend estão documentadas e podem ser visualizadas através da interface Swagger UI.

## Acesso à Documentação

### Desenvolvimento Local
```
http://localhost:80/api/swagger
```

### Produção
```
https://apiback.teugestor.com.br/api/swagger
```

## Estrutura da Documentação

### Tags Organizadas
- **Health**: Endpoints de verificação de saúde do servidor
- **Auth**: Endpoints de autenticação
- **Admin**: Endpoints administrativos
- **Bank Accounts**: Gerenciamento de contas bancárias
- **Credit Cards**: Gerenciamento de cartões de crédito
- **Credit Card Invoices**: Gerenciamento de faturas de cartão de crédito
- **Linked Users**: Gerenciamento de usuários vinculados
- **Transfers**: Transferências entre contas

### Schemas Definidos
- **BankAccount**: Estrutura de conta bancária
- **CreditCard**: Estrutura de cartão de crédito
- **CreditCardInvoice**: Estrutura de fatura de cartão
- **CreditCardExpense**: Estrutura de despesa de cartão
- **Category**: Estrutura de categoria
- **Transaction**: Estrutura de transação
- **Error**: Estrutura padrão de erro
- **Success**: Estrutura padrão de sucesso

### Autenticação
Todas as rotas privadas requerem autenticação via Bearer Token (JWT do Supabase).

## Como Usar

1. **Acesse a documentação**: Navegue até `/api/swagger`
2. **Explore as rotas**: Use a interface Swagger para navegar pelas rotas
3. **Teste as APIs**: Use o botão "Try it out" para testar endpoints
4. **Autenticação**: Para rotas privadas, clique em "Authorize" e insira seu token JWT

## Exemplo de Uso

### 1. Obter Token de Autenticação
```bash
POST /api/auth/login-by-user-id
{
  "user_id": "seu-user-id-aqui"
}
```

### 2. Usar o Token
1. Clique em "Authorize" no Swagger UI
2. Insira: `Bearer seu-token-jwt-aqui`
3. Agora você pode testar todas as rotas privadas

### 3. Testar uma Rota
```bash
GET /api/bank-accounts
Authorization: Bearer seu-token-jwt-aqui
```

## Recursos Implementados

- ✅ Documentação completa de todas as rotas
- ✅ Schemas reutilizáveis para estruturas de dados
- ✅ Exemplos de requisições e respostas
- ✅ Códigos de status HTTP documentados
- ✅ Parâmetros de query, path e body documentados
- ✅ Autenticação Bearer Token configurada
- ✅ Interface Swagger UI customizada
- ✅ Organização por tags/módulos
- ✅ Suporte a desenvolvimento e produção

## Manutenção

Para adicionar novas rotas à documentação:

1. Adicione comentários `@swagger` acima da rota
2. Use os schemas existentes quando possível
3. Siga o padrão de documentação estabelecido
4. Teste a documentação no Swagger UI

## Exemplo de Documentação de Nova Rota

```typescript
/**
 * @swagger
 * /nova-rota:
 *   get:
 *     tags: [Nova Tag]
 *     summary: Descrição da rota
 *     description: Descrição detalhada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parametro
 *         schema:
 *           type: string
 *         description: Descrição do parâmetro
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nova-rota', authenticateToken, async (req, res) => {
  // Implementação da rota
});
```

