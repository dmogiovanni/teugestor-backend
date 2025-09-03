# 🚀 **INSTRUÇÕES PARA DEPLOY DO BACKEND**

## ✅ **Problemas Corrigidos:**

### **1. TypeScript Errors:**
- ✅ **`supabaseClient.ts`**: Corrigido import do `createClient`
- ✅ **`adminController.ts`**: Adicionados tipos explícitos
- ✅ **`tsconfig.json`**: Configuração menos rigorosa para build

### **2. Dockerfile:**
- ✅ **Variável de ambiente**: `SUPABASE_SERVICE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 **Como Fazer o Deploy:**

### **Opção 1: Via Easypanel (Recomendado)**
1. Acesse o Easypanel
2. Vá para o projeto `teugestor-backend`
3. Clique em **"Deploy"**
4. Aguarde o build completar

### **Opção 2: Via Docker Local**
```bash
cd teugestor-backend

# Build da imagem
docker build \
  --build-arg SUPABASE_URL="https://zwfbuxcfgujsyldgetye.supabase.co" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZmJ1eGNmZ3Vqc3lsZGdldHllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg5NTc0MiwiZXhwIjoyMDcyNDcxNzQyfQ.HFDzuDbq51rF1iZaJDWNewmHeymjKsKnhRAWmIRK2tQ" \
  --build-arg PORT=80 \
  -t teugestor-backend .

# Executar container
docker run -p 80:80 teugestor-backend
```

## 🎯 **Endpoints Disponíveis:**

- `GET /` - Status do servidor
- `GET /test-cors` - Teste CORS
- `GET /api/admin/users` - Listar usuários (admin)
- `POST /api/admin/create-user` - Criar usuário (admin)
- `GET /api/linked-users` - Listar usuários vinculados
- `POST /api/linked-users` - Criar usuário vinculado
- `PUT /api/linked-users/:id` - Atualizar usuário vinculado
- `DELETE /api/linked-users/:id` - Excluir usuário vinculado

## 🛡️ **Segurança:**
- ✅ Autenticação JWT obrigatória
- ✅ Validação de campos
- ✅ CORS configurado
- ✅ RLS (Row Level Security) ativo

## 📝 **Logs:**
- Verifique os logs no Easypanel para debug
- Todos os endpoints logam operações importantes

**Agora o deploy deve funcionar!** 🎉
