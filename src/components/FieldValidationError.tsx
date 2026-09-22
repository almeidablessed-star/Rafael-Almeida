import React from 'react';

/**
 * Substitui o balão de validação NATIVO do navegador (fora do padrão visual
 * do app) quando um campo obrigatório fica vazio. Cada formulário ganha
 * `noValidate` e, no clique de salvar/continuar, usa a própria API do DOM
 * (`form.checkValidity()` + `form.querySelector(':invalid')`) para achar o
 * primeiro campo invalido e guardar o `id` dele num estado local — este
 * componente é renderizado logo abaixo do campo quando o `id` bate.
 */
export const FieldValidationError: React.FC = () => (
  <div
    className="flex items-stretch rounded-[10px] overflow-hidden animate-fadeIn"
    style={{ marginTop: '6px', background: '#FFFFFF', boxShadow: '0 8px 20px rgba(58,35,80,0.09)' }}
  >
    <div
      className="flex items-center justify-center flex-none"
      style={{ width: '34px', background: '#C4626F', color: '#FFFFFF', fontSize: '16px', fontWeight: 700 }}
    >
      !
    </div>
    <div
      className="flex items-center"
      style={{ padding: '11px 15px', fontSize: '13px', fontWeight: 600, color: '#241B2B', fontFamily: "'Manrope', sans-serif" }}
    >
      Preencha este campo.
    </div>
  </div>
);
