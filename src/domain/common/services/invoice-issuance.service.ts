import { IInvoiceRequestRepository } from '../../invoice-request/invoice-request.repository';
import { invoiceIssuanceCircuitBreaker } from '../../../infrastructure/http-client/circuit-breaker/invoice-issuance.circuit-breaker';
import { retryWithExponentialBackoff } from '../../../shared/utils/retry.util';

export class InvoiceIssuanceService {
  constructor(
    private readonly invoiceRequestRepository: IInvoiceRequestRepository
  ) {}

  public async issueInvoice(invoiceRequestId: string): Promise<void> {
    const invoiceRequest = await this.invoiceRequestRepository.findById(invoiceRequestId);

    if (!invoiceRequest) {
      console.error(`Solicitação de NF com ID ${invoiceRequestId} não encontrada.`);
      return;
    }

    if (invoiceRequest.status.value !== 'PENDENTE_EMISSAO') {
      console.warn(`Solicitação de NF com ID ${invoiceRequestId} não está PENDENTE_EMISSAO. Status atual: ${invoiceRequest.status.value}`);
      return;
    }

    try {
      const payload = {
        cnpjTomadorServico: invoiceRequest.cnpjTomadorServico,
        municipioPrestacaoServico: invoiceRequest.municipioPrestacaoServico,
        estadoPrestacaoServico: invoiceRequest.estadoPrestacaoServico,
        valorServico: invoiceRequest.valorServico,
        dataDesejadaEmissao: invoiceRequest.dataDesejadaEmissao.toISOString(),
        descricaoServico: invoiceRequest.descricaoServico,
      };

      const result = await retryWithExponentialBackoff(
        () => invoiceIssuanceCircuitBreaker.fire(payload) as Promise<any>,
        { maxRetries: 5, initialDelayMs: 1000 }
      );

      invoiceRequest.markAsIssued(result.numeroNF, new Date(result.dataEmissao));
      await this.invoiceRequestRepository.save(invoiceRequest);
      console.log(`Nota Fiscal ${result.numeroNF} emitida com sucesso para a solicitação ${invoiceRequestId}`);

    } catch (error: any) {
      console.error(`Falha FINAL ao emitir nota fiscal para a solicitação ${invoiceRequestId} após retentativas:`, error.message);
      // NOTE: Posso colocar uma chamda DLQ aqui ou um outro mecanismo de fallback
      throw error;
    }
  }
}