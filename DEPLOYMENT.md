# Carula Confeitaria — Deployment Guide

O app foi buildado com sucesso! Aqui estão as opções para fazer deploy:

## 🚀 Opção 1: Netlify Drop (MAIS FÁCIL — Recomendado)

**Sem precisa de account ou git. Funciona em segundos.**

1. Abra: https://app.netlify.com/drop
2. Arraste a pasta `dist/` para a página
3. Pronto! Você recebe um link público automaticamente

**Vantagens:** Instantâneo, sem config
**Desvantagens:** URL aleatória, sem controle de domínio

---

## 🚀 Opção 2: Vercel (RECOMENDADO se quer domínio customizado)

**Integração direta com Git, deploy automático a cada push.**

### Setup Rápido (sem GitHub):
1. Instale Vercel CLI: `npm i -g vercel`
2. Na pasta do projeto: `vercel`
3. Siga o wizard
4. Vercel cria um projeto e dá um link público

**Vantagens:** URL estável, deploy automático, domínio customizado
**Desvantagens:** Precisa de Vercel account

### Com GitHub (melhor):
1. Crie repositório no GitHub
2. Push: `git remote add origin https://github.com/seu-user/carula-confeitaria.git && git push -u origin main`
3. Acesse vercel.com, clique "Import Project"
4. Selecione seu repo no GitHub
5. Vercel faz deploy automático
6. Recebe URL pública como: `carula-confeitaria.vercel.app`

---

## 🚀 Opção 3: GitHub Pages (GRATUITO)

1. Crie repositório público no GitHub
2. Push: `git remote add origin https://github.com/seu-user/carula-confeitaria.git && git push -u origin main`
3. Vá em Settings → Pages
4. Selecione "Deploy from a branch"
5. Escolha branch `main` e pasta `/` (ou `/dist` se configurar)
6. Acesse: `seu-user.github.io/carula-confeitaria`

**Vantagens:** Gratuito, integrado com GitHub
**Desvantagens:** URL longa, menos flexível

---

## 📊 Comparação Rápida

| Opção | Setup | URL | Automático | Customização |
|-------|-------|-----|-----------|--------------|
| **Netlify Drop** | 30s | aleatória | ❌ | ❌ |
| **Vercel** | 2min | `*.vercel.app` | ✅ | ✅ |
| **GitHub Pages** | 5min | `*.github.io` | ✅ | ⭐ |

---

## 🎯 Minha Recomendação

**Se quer algo rápido agora:** Netlify Drop (30 segundos)
**Se quer URL profissional:** Vercel CLI (2 minutos)
**Se quer tudo de graça + GitHub:** GitHub Pages (5 minutos)

---

## 📦 Build Location

O app buildado está em: `./dist/`

Pronto para upload em qualquer platform acima.

**Todos os files estão prontos e funcionando!** ✅
