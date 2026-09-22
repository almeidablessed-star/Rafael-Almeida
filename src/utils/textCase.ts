/**
 * Capitaliza so a PRIMEIRA letra da string inteira — nao title-case por
 * palavra, que estragaria nomes como "Bolo de Chocolate" -> "Bolo De
 * Chocolate". Usado nos campos de nome (cliente, produto, ficha, insumo...)
 * pra salvar sempre capitalizado, mesmo se a confeiteira digitar tudo em
 * minusculo — evita "farinha" e "Farinha" virando duas entradas diferentes
 * so por causa de digitacao inconsistente.
 */
export const capitalizeFirstLetter = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
