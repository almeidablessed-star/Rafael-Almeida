/**
 * Aritmetica de janela de periodo (semanal / quinzenal / mensal).
 *
 * Dono UNICO de toda conta de calendario do app. Antes ela vivia espalhada:
 * `weeklyArchiveUtils` tinha a versao correta, em data local, e
 * `financialEngine.getWeekRange` tinha uma segunda implementacao que passava
 * por `.toISOString()`. Duas fontes para a mesma pergunta significam duas
 * chances de discordarem — e elas discordavam mesmo, em fusos positivos (ver
 * a nota em `getJanela`).
 *
 * Alem da aritmetica, este modulo e dono do VOCABULARIO de cada periodo (ver
 * `rotulos`): as telas nunca montam "essa " + substantivo, porque portugues
 * tem concordancia e o resultado sairia errado no modo mensal.
 *
 * ── REGRA INEGOCIAVEL ──────────────────────────────────────────────────────
 * Toda data e construida com `new Date(ano, mes - 1, dia)` (horario LOCAL) e
 * toda string de saida e montada a mao com `getFullYear/getMonth/getDate`.
 * NUNCA usar `.toISOString()` aqui.
 *
 * O motivo esta documentado desde a correcao em `weeklyArchiveUtils`: uma data
 * ISO no formato `YYYY-MM-DD` interpretada como UTC cai na noite do dia
 * ANTERIOR para qualquer fuso atras de UTC (Brasil em UTC-3, a confeitaria de
 * teste em Massachusetts em UTC-4/-5), jogando a janela inteira um dia pra
 * tras. `.toISOString()` faz o caminho inverso e erra em fusos positivos.
 * Os dois erros ja aconteceram neste repositorio.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type PeriodoReset = 'semanal' | 'quinzenal' | 'mensal';

export interface JanelaPeriodo {
  /** Primeiro dia da janela, `YYYY-MM-DD`, inclusive. */
  inicioIso: string;
  /** Ultimo dia da janela, `YYYY-MM-DD`, inclusive. */
  fimIso: string;
}

/** `YYYY-MM-DD` a partir de um Date, sempre pelos getters LOCAIS. */
const paraIsoLocal = (data: Date): string =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
    data.getDate()
  ).padStart(2, '0')}`;

/** Date local a partir de `YYYY-MM-DD`, sem passar pelo parser UTC do Date. */
const paraDataLocal = (iso: string): Date => {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

/** Hoje em `YYYY-MM-DD` local. */
const hojeIsoLocal = (): string => paraIsoLocal(new Date());

/**
 * Diferenca em dias inteiros entre duas datas ISO.
 *
 * `Date.UTC` de proposito, e so aqui: as duas pontas ja sao `YYYY-MM-DD` sem
 * hora, e o que se quer e a distancia em dias do calendario. Montar em UTC
 * evita que a troca de horario de verao (um dia de 23h ou 25h) desloque a
 * divisao por 7. Isto NAO e converter data local para UTC — e usar UTC como
 * regua uniforme entre dois pontos que ja sao dias puros.
 */
const diferencaEmDias = (isoA: string, isoB: string): number => {
  const paraUtcMs = (iso: string) => {
    const [a, m, d] = iso.split('-').map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((paraUtcMs(isoA) - paraUtcMs(isoB)) / (24 * 60 * 60 * 1000));
};

/** Ultimo dia do mes de uma data ISO, como numero (28..31). */
const ultimoDiaDoMes = (ano: number, mes: number): number =>
  // Dia 0 do mes seguinte e o ultimo dia deste mes. Resolve fevereiro e ano
  // bissexto sem tabela nenhuma.
  new Date(ano, mes, 0).getDate();

/**
 * Segunda-feira da semana que contem a data informada.
 *
 * Mantida identica a implementacao que estava em `weeklyArchiveUtils`, ate no
 * detalhe do domingo: `getDay()` devolve 0 para domingo, e o `-6` faz o
 * domingo pertencer a semana que COMECOU na segunda anterior, nao a que vai
 * comecar no dia seguinte.
 */
const segundaDaSemana = (dataIso: string): string => {
  const data = paraDataLocal(dataIso);
  const diaDaSemana = data.getDay();
  const diff = data.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1);
  data.setDate(diff);
  return paraIsoLocal(data);
};

/**
 * Janela que contem a data informada, no periodo escolhido.
 *
 * - `semanal`: segunda a domingo. Unico dos tres que pode atravessar a virada
 *   do mes — o resto do app ja lida com isso agrupando pelo mes da segunda.
 * - `quinzenal`: dias 1-15 e 16 ate o fim do mes. Convencao de calendario, nao
 *   janela rolante de 14 dias: assim toda quinzena cabe dentro de um mes, e a
 *   navegacao ano -> mes -> janelas do Historico continua valendo.
 * - `mensal`: o mes inteiro.
 */
export function getJanela(dataIso: string, periodo: PeriodoReset): JanelaPeriodo {
  const [ano, mes, dia] = dataIso.split('-').map(Number);

  switch (periodo) {
    case 'semanal': {
      const inicioIso = segundaDaSemana(dataIso);
      const inicio = paraDataLocal(inicioIso);
      // `setDate` com estouro de mes e resolvido pelo proprio Date: dia 30 + 6
      // vira o dia 5 do mes seguinte, inclusive na virada de ano.
      const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
      return { inicioIso, fimIso: paraIsoLocal(fim) };
    }

    case 'quinzenal': {
      const primeiraQuinzena = dia <= 15;
      const inicioDia = primeiraQuinzena ? 1 : 16;
      const fimDia = primeiraQuinzena ? 15 : ultimoDiaDoMes(ano, mes);
      return {
        inicioIso: paraIsoLocal(new Date(ano, mes - 1, inicioDia)),
        fimIso: paraIsoLocal(new Date(ano, mes - 1, fimDia)),
      };
    }

    case 'mensal': {
      return {
        inicioIso: paraIsoLocal(new Date(ano, mes - 1, 1)),
        fimIso: paraIsoLocal(new Date(ano, mes - 1, ultimoDiaDoMes(ano, mes))),
      };
    }
  }
}

/** Janela corrente, a que contem hoje. */
export function getJanelaAtual(periodo: PeriodoReset): JanelaPeriodo {
  return getJanela(hojeIsoLocal(), periodo);
}

/**
 * Quantas janelas cabem, em media, num mes. Divisor da meta mensal.
 *
 * - `semanal`: 52/12 (~4,3333), nao 4. A diferenca nao e detalhe: num valor
 *   mensal de R$ 2.000, dividir por 4 daria meta de R$ 500 e um rombo de uns
 *   R$ 350 por mes, justamente no numero que existe para evitar rombo.
 * - `quinzenal`: 2, exato por construcao da convencao de calendario. A meta da
 *   quinzena e a mensal dividida por 2 FIXO, mesmo a segunda quinzena tendo
 *   13 a 16 dias — ratear por dias faria a meta oscilar de quinzena pra
 *   quinzena, o que confunde mais do que a desigualdade resolve.
 * - `mensal`: 1, exato.
 */
export function janelasPorMes(periodo: PeriodoReset): number {
  switch (periodo) {
    case 'semanal':
      return 52 / 12;
    case 'quinzenal':
      return 2;
    case 'mensal':
      return 1;
  }
}

/**
 * Vocabulario de cada periodo, em FRASES INTEIRAS.
 *
 * O motivo de nao montar por concatenacao (`'essa ' + substantivo`) e
 * concordancia de genero: "essa semana" e "essa quinzena", mas "ESSE mes".
 * Montar com pedacos produz exatamente o tipo de erro que ja apareceu neste
 * app — "Já existe um ficha técnica" — que soa como texto de robo justamente
 * no momento em que a confeiteira precisa confiar no numero ao lado.
 *
 * Cada campo carrega o artigo e a preposicao prontos. Quem exibe so escolhe a
 * chave; nunca remonta a frase.
 */
export interface RotulosPeriodo {
  /** "semana" / "quinzena" / "mes" — para quando so o substantivo serve. */
  substantivo: string;
  /** Titulo do card de meta no Inicio. */
  tituloMeta: string;
  /** "por semana" / "por quinzena" / "por mes". */
  porPeriodo: string;
  /** "essa semana" / "essa quinzena" / "esse mes" — note o artigo mudando. */
  nessePeriodo: string;
  /** "da semana" / "da quinzena" / "do mes" — a preposicao tambem muda. */
  daPeriodo: string;
  /** "de semanas anteriores" / "de quinzenas anteriores" / "de meses anteriores". */
  anteriores: string;
  /** Explicacao do reset, no rodape dos numeros do Inicio. */
  explicacaoReset: string;
  /** Prefixo do intervalo em `getWeekRange().formattedRange`. */
  prefixoIntervalo: string;
}

export const rotulos = (periodo: PeriodoReset): RotulosPeriodo => {
  switch (periodo) {
    case 'semanal':
      return {
        substantivo: 'semana',
        tituloMeta: 'Meta da Semana',
        porPeriodo: 'por semana',
        nessePeriodo: 'essa semana',
        daPeriodo: 'da semana',
        anteriores: 'de semanas anteriores',
        explicacaoReset: 'Números da semana atual (seg–dom) · reinicia toda segunda',
        prefixoIntervalo: 'Semana de',
      };
    case 'quinzenal':
      return {
        substantivo: 'quinzena',
        tituloMeta: 'Meta da Quinzena',
        porPeriodo: 'por quinzena',
        nessePeriodo: 'essa quinzena',
        daPeriodo: 'da quinzena',
        anteriores: 'de quinzenas anteriores',
        explicacaoReset: 'Números da quinzena atual (dias 1–15 e 16 ao fim do mês) · reinicia dia 1 e dia 16',
        prefixoIntervalo: 'Quinzena de',
      };
    case 'mensal':
      return {
        substantivo: 'mês',
        tituloMeta: 'Meta do Mês',
        porPeriodo: 'por mês',
        nessePeriodo: 'esse mês',
        daPeriodo: 'do mês',
        anteriores: 'de meses anteriores',
        explicacaoReset: 'Números do mês atual · reinicia todo dia 1',
        prefixoIntervalo: 'Mês de',
      };
  }
};

/**
 * Indice da janela dentro do mes. Usado so como rotulo no Historico.
 *
 * No modo `semanal` a contagem e pelo mes da SEGUNDA-FEIRA da janela, nao pelo
 * mes da data consultada, e por isso ela as vezes passa de 5: uma semana que
 * comeca em 31/08 e a sexta janela ancorada em agosto. Esse comportamento e
 * preservado de proposito — e o mesmo numero que o card Historico ja exibe
 * hoje, e mudar a contagem agora renomearia janelas antigas sem motivo.
 */
export function getIndiceNoMes(dataIso: string, periodo: PeriodoReset): number {
  switch (periodo) {
    case 'semanal': {
      const segunda = segundaDaSemana(dataIso);
      const [ano, mes] = segunda.split('-').map(Number);
      const primeiroDoMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const primeiraSegunda = segundaDaSemana(primeiroDoMes);
      return Math.round(diferencaEmDias(segunda, primeiraSegunda) / 7) + 1;
    }

    case 'quinzenal': {
      const dia = Number(dataIso.split('-')[2]);
      return dia <= 15 ? 1 : 2;
    }

    case 'mensal':
      return 1;
  }
}
