# Etapa 4 — scripts de desfazer

Cópia de segurança dos desfazeres da Etapa 4, guardada aqui para não depender de
achar a conversa onde foram escritos. **Nada aqui precisa ser rodado** — os
Scripts A e B já estão aplicados e verificados em produção desde 2026-10-07 (ver
`supabase/migrations/20261007_1_*` e `20261007_2_*`). Isto é o botão de pânico.

A rede de segurança é o SQL Editor do Supabase: ele roda como service-role e
ignora a RLS, então funciona mesmo que o app inteiro esteja trancado.

Existem **dois** desfazeres, e qual usar depende de quanto já foi aplicado.

## Script C-B — desfaz só o B

Devolve a `anon` e a `authenticated` os sete privilégios na tabela inteira, como
era antes. Serve quando apenas o Script B foi aplicado. O `REVOKE ALL` tem de vir
primeiro: sem ele os privilégios por coluna sobreviveriam somados aos da tabela.

```sql
BEGIN;
REVOKE ALL ON public.usuarias FROM anon, authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuarias TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuarias TO authenticated;
COMMIT;
```

## Script C completo — desfaz A e B

Recria as **22 políticas** originais (20 das oito tabelas de dados — cinco em
`administrative_costs`, cinco em `clientes`, cinco em `fichas_tecnicas` e uma em
cada uma das outras cinco — mais duas das tabelas antigas `pedidos` e
`saldos_semanais`) e devolve os privilégios de `usuarias`. É este que vale hoje,
com os dois scripts aplicados.

```sql
BEGIN;
DROP POLICY IF EXISTS "custos proprios" ON public.administrative_costs;
CREATE POLICY administrative_costs_select_own ON public.administrative_costs FOR SELECT USING (usuaria_id = auth.uid());
CREATE POLICY administrative_costs_insert_own ON public.administrative_costs FOR INSERT WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY administrative_costs_update_own ON public.administrative_costs FOR UPDATE USING (usuaria_id = auth.uid()) WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY administrative_costs_delete_own ON public.administrative_costs FOR DELETE USING (usuaria_id = auth.uid());
CREATE POLICY "custos proprios" ON public.administrative_costs FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);

DROP POLICY IF EXISTS usuaria_acessa_seus_clientes ON public.clientes;
CREATE POLICY clientes_select_own ON public.clientes FOR SELECT USING (usuaria_id = auth.uid());
CREATE POLICY clientes_insert_own ON public.clientes FOR INSERT WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY clientes_update_own ON public.clientes FOR UPDATE USING (usuaria_id = auth.uid()) WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY clientes_delete_own ON public.clientes FOR DELETE USING (usuaria_id = auth.uid());
CREATE POLICY usuaria_acessa_seus_clientes ON public.clientes FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);

DROP POLICY IF EXISTS usuaria_acessa_suas_fichas ON public.fichas_tecnicas;
CREATE POLICY fichas_tecnicas_select_own ON public.fichas_tecnicas FOR SELECT USING (usuaria_id = auth.uid());
CREATE POLICY fichas_tecnicas_insert_own ON public.fichas_tecnicas FOR INSERT WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY fichas_tecnicas_update_own ON public.fichas_tecnicas FOR UPDATE USING (usuaria_id = auth.uid()) WITH CHECK (usuaria_id = auth.uid());
CREATE POLICY fichas_tecnicas_delete_own ON public.fichas_tecnicas FOR DELETE USING (usuaria_id = auth.uid());
CREATE POLICY usuaria_acessa_suas_fichas ON public.fichas_tecnicas FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);

DROP POLICY IF EXISTS "transacoes proprias" ON public.transacoes;
CREATE POLICY "transacoes proprias" ON public.transacoes FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS "produtos proprios" ON public.produtos;
CREATE POLICY "produtos proprios" ON public.produtos FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS "movimentos proprios" ON public.estoque_movimentos;
CREATE POLICY "movimentos proprios" ON public.estoque_movimentos FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS "despesas proprias" ON public.despesas_empresa;
CREATE POLICY "despesas proprias" ON public.despesas_empresa FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS "historico proprio" ON public.configuracao_empresa_historico;
CREATE POLICY "historico proprio" ON public.configuracao_empresa_historico FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS usuaria_acessa_seus_pedidos ON public.pedidos;
CREATE POLICY usuaria_acessa_seus_pedidos ON public.pedidos FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);
DROP POLICY IF EXISTS usuaria_acessa_seus_saldos ON public.saldos_semanais;
CREATE POLICY usuaria_acessa_seus_saldos ON public.saldos_semanais FOR ALL USING (auth.uid() = usuaria_id) WITH CHECK (auth.uid() = usuaria_id);

REVOKE ALL ON public.usuarias FROM anon, authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuarias TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuarias TO authenticated;
COMMIT;
```

O Script C completo **não** remove a função `tem_acesso_ativo()`, de propósito:
sem política nenhuma usando-a ela fica inerte, e deixá-la no lugar permite
reaplicar o Script A sem recriá-la.
