# 🔧 **CORREÇÃO DO DEPLOY DO BACKEND**

## 🚨 **Problema Identificado:**
- **Erro**: `Variáveis de ambiente do Supabase não configuradas`
- **Causa**: Nome da variável incorreto no `.env`
- **Código procura**: `SUPABASE_SERVICE_ROLE_KEY`
- **`.env` tem**: `SUPABASE_SERVICE_KEY`

## ✅ **Correções Aplicadas:**

### **1. Arquivo `env.example` corrigido:**
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
```

### **2. Dockerfile já está correto:**
```dockerfile
ARG SUPABASE_SERVICE_ROLE_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
```

## 🛠️ **Ação Necessária:**

### **No Easypanel, corrija a variável de ambiente:**

**Antes (incorreto):**
```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Depois (correto):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 **Passos para Corrigir:**

### **1. No Easypanel:**
1. Acesse o projeto `teugestor-backend`
2. Vá em **Settings** → **Environment Variables**
3. Encontre `SUPABASE_SERVICE_KEY`
4. **Renomeie** para `SUPABASE_SERVICE_ROLE_KEY`
5. Mantenha o mesmo valor da chave
6. Clique em **Save**

### **2. Faça o Deploy:**
1. Clique em **Deploy**
2. Aguarde o build completar
3. Verifique os logs

### **3. Teste:**
```bash
# Teste de saúde
curl https://apiback.teugestor.com.br/health

# Teste de usuários
curl https://apiback.teugestor.com.br/api/admin/users
```

## 🎯 **Resultado Esperado:**
- Backend deve iniciar sem erros
- Endpoints devem responder corretamente
- Frontend deve conseguir acessar o backend

**Execute esses passos e me informe o resultado!** 🔧
