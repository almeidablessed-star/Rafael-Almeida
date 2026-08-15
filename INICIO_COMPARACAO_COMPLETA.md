# 🔄 TELA INÍCIO - Comparação Completa: Design-Reference vs App Atual

**Método:** Análise visual lado-a-lado  
**Design-Reference:** http://localhost:3001/design-reference.html  
**App Atual:** http://localhost:3001  

---

## 📊 DIFERENÇAS ENCONTRADAS

### BLOCO 2: Card Overlay + Gauge Principal

#### Design-Reference:
```
"LUCRO LÍQUIDO DO MÊS (RENDIMENTO)"  ← UPPERCASE
"R$ 4.980,00"                        ← Dados de exemplo
```

#### App Atual:
```
"Lucro Líquido do Mês (Rendimento)"  ← Sentence Case
"R$ 0,00"                            ← Dados mock
```

**Mudança necessária:** Capitalizar para UPPERCASE
```diff
- "Lucro Líquido do Mês (Rendimento)"
+ "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)"
```

---

### BLOCO 3: 3 Sub-cards Translúcidos

#### Design-Reference:
```
"VENDAS PAGAS"     ← UPPERCASE
"SAÍDAS"           ← UPPERCASE
"⏳ A RECEBER"      ← UPPERCASE
```

#### App Atual:
```
"Vendas Pagas"     ← Sentence Case
"Saídas"           ← Sentence Case
"⏳ A Receber"      ← Sentence Case
```

**Mudanças necessárias:**
```diff
- "Vendas Pagas"
+ "VENDAS PAGAS"

- "Saídas"
+ "SAÍDAS"

- "⏳ A Receber"
+ "⏳ A RECEBER"
```

---

### BLOCO 6: Saldos & Divisão dos Pedidos

#### Design-Reference:
```
"🔄 REPOSIÇÃO"      ← UPPERCASE + emoji ✅ (já corrigido)
"🟣 MÃO DE OBRA"    ← UPPERCASE + emoji ✅ (já corrigido)
"📊 CUSTO + INVEST."← UPPERCASE + emoji ✅ (já corrigido)
```

#### App Atual (após correção anterior):
```
"🔄 REPOSIÇÃO"      ← ✅ CONFORME
"🟣 MÃO DE OBRA"    ← ✅ CONFORME
"📊 CUSTO + INVEST."← ✅ CONFORME
```

**Status:** ✅ JÁ CONFORME

---

## 📋 LISTA DE MUDANÇAS A FAZER

### Arquivo: `src/components/Dashboard.tsx`

#### 1. Label "Lucro Líquido do Mês" → "LUCRO LÍQUIDO DO MÊS (RENDIMENTO)"
**Localização:** Linha ~88 (Card principal)
```diff
- <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">
-   Lucro Líquido do Mês (Rendimento)
- </div>

+ <div className="text-xs font-black uppercase tracking-widest text-white/80 mb-2">
+   LUCRO LÍQUIDO DO MÊS (RENDIMENTO)
+ </div>
```

#### 2. Label "Vendas Pagas" → "VENDAS PAGAS"
**Localização:** Linha ~107
```diff
- <div className="text-xs text-white/80 font-bold uppercase tracking-wide">Vendas Pagas</div>

+ <div className="text-xs text-white/80 font-bold uppercase tracking-wide">VENDAS PAGAS</div>
```

#### 3. Label "Saídas" → "SAÍDAS"
**Localização:** Linha ~113
```diff
- <div className="text-xs text-white/80 font-bold uppercase tracking-wide">Saídas</div>

+ <div className="text-xs text-white/80 font-bold uppercase tracking-wide">SAÍDAS</div>
```

#### 4. Label "A Receber" → "A RECEBER"
**Localização:** Linha ~119
```diff
- <div className="text-xs text-white/80 font-bold uppercase tracking-wide">⏳ A Receber</div>

+ <div className="text-xs text-white/80 font-bold uppercase tracking-wide">⏳ A RECEBER</div>
```

---

## ✅ MUDANÇAS JÁ FEITAS

- ✅ 🔄 REPOSIÇÃO (com emoji)
- ✅ 🟣 MÃO DE OBRA (com emoji)
- ✅ 📊 CUSTO + INVEST. (com emoji)
- ✅ Border-radius 22px → 28px (3 cards)

---

## 🎯 RESUMO

**Total de mudanças a fazer:** 4 labels UPPERCASE  
**Tempo estimado:** 5 minutos  
**Status:** Pronto para implementação

