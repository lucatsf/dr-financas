import axios, { AxiosInstance, AxiosError } from 'axios';

interface ExternalApiPayload {
  cnpjTomadorServico: string;
  municipioPrestacaoServico: string;
  estadoPrestacaoServico: string;
  valorServico: number;
  dataDesejadaEmissao: string;
  descricaoServico: string;
}

interface ExternalApiResponse {
  numeroNF: string;
  dataEmissao: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: 'https://api.drfinancas.com/testes',
  headers: {
    'Authorization': '87451e7c-48bc-48d1-a038-c16783dd404c',
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Interceptor para logar erros HTTP de forma centralizada
instance.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error(`[ExternalInvoiceApiClient] Erro da API externa: Status ${error.response.status}, Dados: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('[ExternalInvoiceApiClient] Erro de requisição: Nenhuma resposta recebida da API externa.');
    } else {
      console.error('[ExternalInvoiceApiClient] Erro ao configurar requisição para API externa:', error.message);
    }
    // NOTE: Quando eu rejeitar o erro aqui o Circuit Breaker e o Retry vão capturá-lo
    return Promise.reject(error);
  }
);

export const externalApiClientInstance = instance;

export class ExternalInvoiceApiClient {
  public async sendInvoice(payload: ExternalApiPayload): Promise<ExternalApiResponse> {
    const response = await externalApiClientInstance.post<ExternalApiResponse>('/notas-fiscais', payload);
    return response.data;
  }
}
