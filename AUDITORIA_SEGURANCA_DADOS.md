# 🔒 AUDITORIA — SEGURANÇA E DADOS
## Carula Confeitaria — SaaS Security Assessment

**Data:** 28 de Agosto de 2026  
**Contexto:** SaaS armazenando dados comerciais de pequenas confeitarias (confidencial, financeiro)  
**Método:** Análise de exposição de dados, autenticação, autorização, validação, armazenamento, APIs

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. DADOS: Transações Armazenadas Apenas em localStorage

**Arquivo:** `src/utils/storage.ts:11-38`  
**Problema:**
```typescript
const STORAGE_KEY = 'carulaconfeitaria_transacoes_v3';
// localStorage = cliente-side, em texto plano
localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
```

**Risco:** 🔴 **CRÍTICO**
- Qualquer script em página pode ler localStorage (XSS vulnerability)
- Dados não criptografados localmente
- Se dispositivo é roubado: dados acessíveis
- Se browser é comprometido: tudo exposto
- Backup manual (BackupModal) exporta JSON em texto plano

**Dados em Risco:**
- Cliente: nome, telefone, endereço
- Financeiro: valores de vendas, lucros, custos
- Histórico: todas as transações de negócio

**Impacto:** 🔴 **CRÍTICO**
- Violação de LGPD (dados pessoais + financeiros)
- Vazamento de informações comerciais
- Exposição de receita/lucro

**Recomendação:** 🔴 **P0**
```typescript
// IMEDIATO: Migrar TUDO para Supabase
// Nunca armazenar dados sensíveis em localStorage

// Se must usar localStorage (offline):
// 1. Criptografar antes de salvar
import crypto from 'crypto-js'

const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(transactions),
  secretKey
).toString()
localStorage.setItem(STORAGE_KEY, encrypted)

// 2. Limpeza periódica
localStorage.removeItem(STORAGE_KEY) // Ao logout

// 3. Indicação visual que está offline
showBanner("Modo offline — dados não sincronizados")
```

**Compliance:** 🔴 **NÃO ESTÁ LGPD-COMPLIANT AGORA**

---

### 2. AUTENTICAÇÃO: Gerenciado por Supabase, Mas Sem Validação Local

**Arquivo:** `src/context/AuthContext.tsx`  
**Problema:**
```typescript
// Supabase Auth é usado, mas:
// 1. Sem MFA (multi-factor auth)
// 2. Sem 2FA
// 3. Sem verificação de email obrigatória (vide SignupPage)
// 4. Session pode ser hijacked (sem CSRF protection visível)
```

**Risco:** 🟠 **IMPORTANTE**
- Senha fraca pode ser brute-forced
- Sem 2FA: conta comprometida facilmente
- Session tokens podem ser roubados (XSS)

**Impacto:** 🟠 **IMPORTANTE**
- Atacante acessa conta de confeiteira
- Pode editar/deletar pedidos
- Pode roubar dados de clientes

**Recomendação:** 🟠 **P1**
```typescript
// 1. Implementar 2FA via Authenticator (TOTP)
const { data, error } = await supabase.auth.mfa.enroll({
  issuer: 'Carula Confeitaria',
  factorType: 'totp'
})

// 2. Validar email obrigatoriamente
// 3. Implementar CSRF tokens para POST/PUT/DELETE
// 4. Rate limiting em login (máx 5 tentativas em 5 min)
// 5. Session timeout (15 min inatividade)
```

---

### 3. AUTORIZAÇÃO: Sem Row-Level Security (RLS)

**Arquivo:** `src/lib/supabase.ts` + Supabase DB policies  
**Problema:**
```typescript
// Usuária A pode ver dados de Usuária B
// Não há filtro de tenant no Supabase query

const { data } = await supabase
  .from('fichas_tecnicas')
  .select('*')
  // Falta: .eq('user_id', user.id)
```

**Risco:** 🔴 **CRÍTICO**
- Sem RLS: qualquer query sem `user_id` filtra pode retornar dados de todos os usuários
- Browser devtools: usuária pode modificar query

**Impacto:** 🔴 **CRÍTICO**
- Vazamento de dados entre confeiteiras
- Confeiteira A vê receitas/custos de Confeiteira B
- Confeiteira A pode deletar pedidos de Confeiteira B

**Recomendação:** 🔴 **P0** — URGENTE
```sql
-- Supabase: Ativar Row-Level Security em TODAS tabelas
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Policy para cada tabela
CREATE POLICY "Users can only see own fichas"
  ON fichas_tecnicas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only update own fichas"
  ON fichas_tecnicas FOR UPDATE
  USING (auth.uid() = user_id);
```

**Status Agora:** 🔴 **CRÍTICO — RLS PROVAVELMENTE NÃO ESTÁ ATIVADO**

---

### 4. DADOS: Backup Sem Criptografia

**Arquivo:** `src/components/BackupModal.tsx`  
**Problema:**
```typescript
// Backup é JSON em texto plano
const backupContent = JSON.stringify(dataToBackup)
// Download em JSON sem proteção
// Usuária pode compartilhar arquivo sem perceber risco
```

**Risco:** 🟠 **IMPORTANTE**
- Arquivo de backup pode ser visto por alguém que pega o arquivo
- Não há senha/criptografia no arquivo

**Impacto:** 🟠 **IMPORTANTE**
- Se confeiteira compartilha arquivo com técnico: todos os dados vazam
- Se computador é compartilhado: co-worker vê tudo

**Recomendação:** 🟠 **P1**
```typescript
// Criptografar backup com password
import crypto from 'crypto-js'

const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(backup),
  userPassword
).toString()

// Arquivo salvo como .carula (formato proprietário)
// ao restaurar: pedir senha
```

---

### 5. VALIDAÇÃO: Falta em APIs/Inputs

**Arquivo:** `src/components/TransactionFormModal.tsx`, `src/context/*`  
**Problema:**
```typescript
// Sem validação clara em inputs
const handleSave = () => {
  // Precisa preencher X e Y, mas onde está a validação?
  // Se submit com values inválidos?
  saveTransaction(formData) // O que valida antes?
}

// Sem schema validation
```

**Risco:** 🟠 **IMPORTANTE**
- Usuária submete "Quantidade: -5" → o que acontece?
- "Preço: 999999999999999" → overflow?
- "Cliente: <script>alert('xss')</script>" → sanitized?

**Impacto:** 🟠 **IMPORTANTE**
- Dados inválidos na DB
- Possível XSS via nome de cliente
- Cálculos errados

**Recomendação:** 🟠 **P1**
```typescript
// Usar Zod para validação
import { z } from 'zod'

const TransactionSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitValue: z.number().nonnegative(),
  totalValue: z.number().nonnegative(),
  customerName: z.string().trim().min(1).max(200),
  // ... mais validações
})

// Validar antes de salvar
const result = TransactionSchema.safeParse(formData)
if (!result.success) {
  showError(result.error.errors[0].message)
  return
}

// Backend (Supabase) também deve validar
```

---

### 6. EXPOSIÇÃO: IDs Manipuláveis

**Arquivo:** `src/utils/storage.ts:44`  
**Problema:**
```typescript
const id = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
// ID é previsível (timestamp + random curto)
// Browser devtools: usuária pode ver padrão
```

**Risco:** 🟡 **MÉDIO**
- Usuária pode adivinhar ID de outro pedido
- Possível race condition se criar 2 pedidos rápido

**Impacto:** 🟡 **MÉDIO**
- Sem RLS: grave. Com RLS: menos grave (RLS filtra mesmo assim)

**Recomendação:** 🟡 **P1**
```typescript
// Usar UUID v4 (verdadeiramente randômico)
import { v4 as uuidv4 } from 'uuid'

const id = uuidv4() // ex: 550e8400-e29b-41d4-a716-446655440000
// Muito mais difícil de adivinhar
```

---

### 7. LOGS: Erro Visível ao Usuário

**Arquivo:** `src/` (múltiplos componentes)  
**Problema:**
```typescript
// Erros mostram stack trace
throw new Error('Erro ao salvar transação: ' + error.message)
// Usuária vê detalhes da falha (file paths, stack)
```

**Risco:** 🟠 **IMPORTANTE** (Information Disclosure)
- Usuária vê stack trace → descobre arquitetura
- Descrição de erro pode expor dados

**Recomendação:** 🟠 **P1**
```typescript
// Nunca mostrar erro técnico ao usuário
try {
  await saveTransaction(data)
} catch (error) {
  console.error('[Internal Error]', error) // Log interna apenas
  showUserError('Não conseguimos salvar. Tente novamente.') // Genérica
}

// Logging estruturado (não console.error)
import { logger } from './lib/logger'
logger.error('transaction_save_failed', {
  userId: user.id,
  error: error.message,
  timestamp: new Date()
})
```

---

### 8. SESSION: Sem Timeout / Sem CSRF

**Arquivo:** `src/context/AuthContext.tsx`  
**Problema:**
```typescript
// Sem lógica de timeout de sessão
// Usuária deixa app aberta indefinidamente
// Se computador é compartilhado: outra pessoa pode acessar
```

**Risco:** 🟡 **MÉDIO**
- Outra pessoa consegue usar conta sem re-autenticar
- CSRF attack possível (sem token validation em POST/PUT/DELETE)

**Recomendação:** 🟡 **P1**
```typescript
// Implementar session timeout
const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 min

let sessionTimer: NodeJS.Timeout | null = null

const resetSessionTimer = () => {
  if (sessionTimer) clearTimeout(sessionTimer)
  sessionTimer = setTimeout(() => {
    logout() // Force logout after inactivity
  }, SESSION_TIMEOUT)
}

// Reset timer em cada ação de usuária
window.addEventListener('mousemove', resetSessionTimer)
window.addEventListener('keypress', resetSessionTimer)
window.addEventListener('click', resetSessionTimer)

// CSRF token para POST/PUT/DELETE
// Supabase handles some of this, but verify
```

---

## 🟠 PROBLEMAS IMPORTANTES

### 9. DADOS: Sem Criptografia em Trânsito

**Risco:** 🟠 **IMPORTANTE**
- Assuming HTTPS (bom)
- MAS: verificar se certificate é válido
- Sem verificação de pinning

**Recomendação:** 🟡 **P2**
```typescript
// Verificar que Supabase está sempre HTTPS
// Não confiar em HTTP nunca
const supabaseUrl = 'https://...' // Never http://

// Certificate pinning (advanced)
```

---

### 10. DEPENDÊNCIAS: Sem Audit de Vulnerabilidades

**Risco:** 🟠 **IMPORTANTE**
- `npm audit` nunca foi rodado
- Dependencies podem ter CVEs conhecidos

**Recomendação:** 🟠 **P1**
```bash
npm audit
npm audit fix
# Configurar CI para fail se vulnerabilidades
```

---

### 11. DADOS: Sensíveis Podem Estar em Logs/Console

**Risco:** 🟡 **MÉDIO**
- console.log pode expor dados sensíveis
- Browser console em público (cozinha) pode mostrar

**Recomendação:** 🟡 **P2**
```typescript
// Remover todos console.log, console.error em production
// Usar logger estruturado
// Nunca logar: senha, token, customer data, financeiro
```

---

## 📊 SUMMARY: SECURITY ISSUES

| # | Problema | Tipo | Risco | P0-P3 |
|---|---|---|---|---|
| 1 | localStorage com dados sensíveis | Data Exposure | 🔴 CRÍTICO | P0 |
| 2 | Sem 2FA/MFA | Authentication | 🟠 IMPORTANTE | P1 |
| 3 | Sem RLS (Row-Level Security) | Authorization | 🔴 CRÍTICO | P0 |
| 4 | Backup sem criptografia | Data Protection | 🟠 IMPORTANTE | P1 |
| 5 | Falta validação de inputs | Input Validation | 🟠 IMPORTANTE | P1 |
| 6 | IDs previsíveis | Enumeration | 🟡 MÉDIO | P1 |
| 7 | Erros técnicos ao usuário | Information Disclosure | 🟠 IMPORTANTE | P1 |
| 8 | Sem session timeout/CSRF | Session Security | 🟡 MÉDIO | P1 |
| 9 | Sem verificação de HTTPS | Transport Security | 🟠 IMPORTANTE | P2 |
| 10 | Sem npm audit | Dependency Security | 🟠 IMPORTANTE | P1 |
| 11 | Dados sensíveis em logs | Logging | 🟡 MÉDIO | P2 |

---

## 🎯 COMPLIANCE CHECK

| Aspecto | Status | Comentário |
|---|---|---|
| **LGPD (Brasil)** | 🔴 NÃO | Dados pessoais em localStorage = violação |
| **GDPR (EU)** | 🔴 NÃO | Sem RLS = violação |
| **Data Encryption** | 🔴 NÃO | localStorage em texto plano |
| **Access Control** | 🔴 NÃO | Sem RLS |
| **Audit Logging** | 🟡 PARCIAL | Sem logs estruturados |
| **Incident Response** | 🔴 NÃO | Sem plano |

---

## 🔒 RECOMENDAÇÕES PRIORIZADAS

### P0 (CRÍTICO, BLOQUEIA LANÇAMENTO)
1. **Migrar transactions para Supabase** — Remover localStorage com dados sensíveis
2. **Ativar Row-Level Security em TODAS tabelas** — Sem RLS = qualquer usuária vê dados de outras
3. **Implementar validação com Zod** — Prevenir injeção

### P1 (IMPORTANTE, ANTES DE LANÇAR)
4. Implementar 2FA (TOTP via Authenticator)
5. Criptografar backups com password
6. Usar UUID v4 para IDs (não timestamp predictable)
7. Implementar session timeout (15min inatividade)
8. Logging estruturado (sem dados sensíveis)
9. Validação de inputs em todas APIs
10. npm audit + CI check para CVEs

### P2 (DESEJÁVEL)
11. Certificate pinning (advanced)
12. WAF rules em produção
13. SIEM/logging centralizado

---

## ⏰ TIMELINE

**Sprint 0 (URGENT): P0 items**
- Migrar transactions → Supabase (16h)
- Ativar RLS em DB (8h)
- Validação com Zod (12h)
**Total: 36h (1 dev para 1 semana)**

**Sprint 1: P1 items**
- 2FA setup (12h)
- Session timeout + CSRF (8h)
- Logging + error handling (12h)
- npm audit + CI (4h)
**Total: 36h**

---

**Classificação Geral:** 🔴 **NÃO PRONTO PARA PRODUÇÃO. DADOS SENSÍVEIS EM RISCO. P0 CRITICAL.**

**LGPD/GDPR Status:** ❌ **NÃO COMPLIANT AGORA** — Requer P0 fixes antes de qualquer produção.
