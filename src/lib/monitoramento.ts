import * as Sentry from '@sentry/browser';
import { supabase } from './supabase';

/**
 * Monitoramento de erros (Sentry): avisa o dono do app quando algo quebra para
 * uma cliente, em vez de so aparecer quando ela reclama.
 *
 * So liga se `VITE_SENTRY_DSN` existir (variavel na Vercel). Sem ela — no
 * computador de desenvolvimento, por exemplo — nada e enviado e o app roda igual.
 *
 * O QUE VAI para o Sentry: a mensagem do erro, a linha do codigo, o aparelho e
 * o navegador, os ultimos toques e chamadas de rede (so o endereco, sem os
 * filtros) e o id da conta (um codigo, para saber quantas pessoas foram
 * afetadas).
 *
 * O QUE NAO VAI: e-mail, nome, IP, corpo das chamadas ao banco (pedidos,
 * clientes, fichas) nem o que foi escrito no console fora de erros.
 *
 * Falha de internet da propria cliente ("Failed to fetch") fica de fora: nao e
 * defeito do app e gastaria a cota inteira.
 */

declare const __VERSAO_DO_APP__: string;

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

const RUIDO = [
  'Failed to fetch',
  'Load failed',
  'NetworkError when attempting to fetch resource',
  'ResizeObserver loop',
  'AbortError',
];

/** Endereco sem os filtros: `?nome=eq.Maria` nao sai do aparelho. */
const semFiltros = (url: unknown) => (typeof url === 'string' ? url.split('?')[0] : url);

export const ligaMonitoramento = () => {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: window.location.hostname === 'app.carulaconfeitaria.com.br' ? 'producao' : 'teste',
    release: typeof __VERSAO_DO_APP__ === 'string' ? __VERSAO_DO_APP__ : undefined,
    // Nada de dados pessoais nem do conteudo das chamadas.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    ignoreErrors: RUIDO,
    integrations: (padrao) => [
      // Sem o texto do console na trilha: so toques e chamadas de rede.
      ...padrao.filter((i) => i.name !== 'Console'),
      // Os erros que o app trata e so escreve no console (ex.: uma lista que
      // nao carregou) tambem chegam: sao justamente os que ninguem ve.
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    beforeBreadcrumb(trilha) {
      if (trilha.data?.url) trilha.data.url = semFiltros(trilha.data.url);
      return trilha;
    },
    beforeSend(evento) {
      if (evento.request) {
        evento.request.url = semFiltros(evento.request.url) as string | undefined;
        delete evento.request.data;
        delete evento.request.cookies;
        delete evento.request.query_string;
      }
      if (evento.user) evento.user = { id: evento.user.id };
      return evento;
    },
  });

  // So o id da conta, nunca o e-mail.
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    Sentry.setUser(sessao?.user ? { id: sessao.user.id } : null);
  });
};

/** Erro que derrubou uma tela (ver ErrorBoundary). Sem DSN, nao faz nada. */
export const registrarErroDeTela = (erro: Error, pilhaDeComponentes?: string | null) => {
  if (!DSN) return;
  Sentry.captureException(erro, { extra: { componentes: pilhaDeComponentes }, tags: { origem: 'tela-quebrou' } });
};
