import React, { useEffect, useState } from 'react';
import { formatNumeroParaEdicao, parseNumeroDigitado } from '../utils/formatters';

/**
 * Campo de valor que aceita o numero escrito do jeito brasileiro.
 *
 * Existe porque `type="number"` descartava o que a pessoa digitava: ao digitar
 * "3.000" o browser julga o valor invalido e devolve string vazia, entao o
 * `Number(e.target.value)` gravava 0 — tres mil virava zero, sem nenhum aviso
 * na tela. Aqui o campo e `type="text"` com `inputMode="decimal"` (teclado
 * numerico no celular, mas sem a validacao do browser) e quem interpreta a
 * string e `parseNumeroDigitado`.
 *
 * O texto digitado fica em estado proprio, nao derivado do numero, para que
 * formas intermediarias de digitacao sobrevivam: "3." e "3.000," passam a ser
 * estados validos enquanto a pessoa ainda escreve, em vez de serem reescritos
 * no meio da palavra. O numero segue sendo a fonte de verdade de quem salva.
 *
 * Use este componente quando o estado do formulario guarda um NUMERO. Quando
 * guarda a string crua — o caso da maioria das telas — nao e preciso
 * componente nenhum: basta `type="text"` + `inputMode="decimal"` no input e
 * `parseNumeroDigitado` na hora de converter.
 */
export const CampoNumerico: React.FC<{
  value: number;
  onChange: (valor: number) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}> = ({ value, onChange, className, placeholder, style, ariaLabel }) => {
  const [texto, setTexto] = useState(() => formatNumeroParaEdicao(value));

  // Ressincroniza so quando o numero muda POR FORA (carga inicial do banco,
  // reset de passo). A guarda evita o caso em que isto reescreveria o texto
  // que esta sendo digitado: se o texto atual ja le como o valor recebido,
  // nao ha nada a corrigir.
  useEffect(() => {
    if (parseNumeroDigitado(texto) !== value) setTexto(formatNumeroParaEdicao(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      placeholder={placeholder}
      className={className}
      style={style}
      aria-label={ariaLabel}
      onChange={(e) => {
        setTexto(e.target.value);
        onChange(parseNumeroDigitado(e.target.value));
      }}
    />
  );
};
