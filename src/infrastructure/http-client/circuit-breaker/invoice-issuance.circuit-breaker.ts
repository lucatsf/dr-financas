import CircuitBreaker from 'opossum';
import { externalApiClientInstance } from '../external-invoice-api.client';

const options = {
  timeout: 5000,    // Se a função demorar mais de 5 segundos, falha (em ms)
  errorThresholdPercentage: 50, // Quando 50% ou mais das requisições falham, o circuito abre
  resetTimeout: 30000 // Após 30 segundos, o circuito transiciona para half-open
};

async function protectedExternalApiCall(payload: any): Promise<any> {
  const response = await externalApiClientInstance.post('/notas-fiscais', payload);

  return response.data;
}

export const invoiceIssuanceCircuitBreaker = new CircuitBreaker(protectedExternalApiCall, options);

invoiceIssuanceCircuitBreaker.on('open', () => console.warn('Circuit Breaker: ABERTO - Parando de enviar requisições para a API externa.'));
invoiceIssuanceCircuitBreaker.on('halfOpen', () => console.warn('Circuit Breaker: MEIO-ABERTO - Enviando requisição de teste para a API externa.'));
invoiceIssuanceCircuitBreaker.on('close', () => console.info('Circuit Breaker: FECHADO - Voltando a enviar requisições normalmente para a API externa.'));
invoiceIssuanceCircuitBreaker.on('fallback', (error) => console.error('Circuit Breaker: FALLBACK ativado - Erro: ', error));
invoiceIssuanceCircuitBreaker.on('reject', () => console.error('Circuit Breaker: Requisição REJEITADA - Circuito está aberto.'));
