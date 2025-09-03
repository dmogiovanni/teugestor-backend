# Endpoints Administrativos do Backend

## 🟢 1. Criação Manual de Usuários

### Descrição
Este endpoint permite que administradores criem usuários manualmente no sistema, sem necessidade de integração com Stripe.

### Endpoint
```
POST /admin/create-user
```

### Campos de Entrada (JSON)
```json
{
  "name": "Nome Completo do Usuário",
  "email": "usuario@exemplo.com",
  "whatsapp": "+5511999999999",
  "password": "senha123",
  "accessPeriodDays": 30
}
```

### Campos Obrigatórios
- **name**: Nome completo do usuário
- **email**: E-mail válido e único
- **whatsapp**: Número de WhatsApp (será salvo no campo `phone`)
- **password**: Senha para acesso ao sistema
- **accessPeriodDays**: Período de acesso em dias (número inteiro positivo)

### O que o Endpoint Faz

#### 1. Criação na Autenticação
- Cria usuário na sessão de **Authentication** do Supabase
- Confirma o email automaticamente (`email_confirm: true`)
- Armazena nome e WhatsApp nos metadados do usuário

#### 2. Perfil do Usuário
- Cria registro na tabela `poupeja_users`
- Vincula com o ID da autenticação
- Salva email, nome e WhatsApp

#### 3. Assinatura Manual
- Cria registro na tabela `poupeja_subscriptions`
- Define `status` como "active"
- Define `plan_type` como "manual"
- Define `current_period_start` como data atual
- Define `current_period_end` como data atual + período informado
- Define `is_manual` como `true`

### Resposta de Sucesso
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "name": "Nome Completo do Usuário",
    "whatsapp": "+5511999999999",
    "accessPeriodDays": 30,
    "subscriptionEnd": "2024-02-14T10:30:00.000Z"
  }
}
```

---

## 🟢 2. Listagem de Usuários

### Descrição
Este endpoint retorna todos os usuários cadastrados no sistema com informações básicas e status de assinatura.

### Endpoint
```
GET /admin/users
```

### O que o Endpoint Retorna

#### Dados do Usuário
- **id**: UUID único do usuário
- **name**: Nome completo
- **email**: E-mail do usuário
- **whatsapp**: Número de WhatsApp (campo `phone`)
- **createdAt**: Data de criação da conta

#### Informações da Assinatura
- **status**: Status da assinatura (active, inactive, etc.)
- **planType**: Tipo do plano (manual, premium, etc.)
- **endDate**: Data de término da assinatura
- **isManual**: Se foi criada manualmente pelo admin

### Resposta de Sucesso
```json
{
  "message": "Usuários listados com sucesso",
  "total": 2,
  "users": [
    {
      "id": "uuid-1",
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "whatsapp": "+5511999999999",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "subscription": {
        "status": "active",
        "planType": "manual",
        "endDate": "2024-02-14T10:30:00.000Z",
        "isManual": true
      }
    },
    {
      "id": "uuid-2",
      "name": "Maria Santos",
      "email": "maria@exemplo.com",
      "whatsapp": "+5511888888888",
      "createdAt": "2024-01-10T15:45:00.000Z",
      "subscription": {
        "status": "active",
        "planType": "premium",
        "endDate": "2024-04-10T15:45:00.000Z",
        "isManual": false
      }
    }
  ]
}
```

---

## 🔒 Segurança e Acesso

### Autenticação
- Ambos os endpoints são destinados ao painel administrativo
- Recomenda-se implementar autenticação e autorização adequadas
- Usar a chave de serviço do Supabase para operações administrativas

### Políticas RLS
- Mantém todas as políticas RLS existentes
- Não interfere com a lógica de assinaturas via Stripe
- Dados sensíveis não são expostos

---

## 📋 Tratamento de Erros

### Códigos de Status
- **200**: Sucesso na listagem
- **201**: Usuário criado com sucesso
- **400**: Campos obrigatórios ausentes ou inválidos
- **500**: Erro interno do servidor

### Exemplo de Erro
```json
{
  "error": "Todos os campos são obrigatórios: name, email, whatsapp, password, accessPeriodDays"
}
```

---

## 🧪 Testes

### Exemplo de Uso (cURL)

#### Criar Usuário
```bash
curl -X POST http://localhost:3000/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "whatsapp": "+5511999999999",
    "password": "senha123",
    "accessPeriodDays": 90
  }'
```

#### Listar Usuários
```bash
curl -X GET http://localhost:3000/admin/users
```

---

## 📝 Notas Importantes

### Criação de Usuários
- O usuário criado terá acesso imediato ao sistema
- A assinatura será marcada como `is_manual: true`
- Não há integração com Stripe
- O período de acesso é calculado a partir da data atual
- Em caso de falha, todos os registros criados são removidos (rollback)

### Listagem de Usuários
- Ordenação por data de criação (mais recentes primeiro)
- Inclui apenas usuários com perfis ativos
- Retorna informações de assinatura quando disponíveis
- Não expõe dados sensíveis como senhas
