import { ListInvoiceRequestsQuery } from './list-invoice-requests.query';
import { InvoiceRequest } from '../../../domain/invoice-request/invoice-request.aggregate';
import { IInvoiceRequestRepository } from '../../../domain/invoice-request/invoice-request.repository';

export class ListInvoiceRequestsHandler {
  constructor(
    private readonly invoiceRequestRepository: IInvoiceRequestRepository
  ) {}

  public async execute(query: ListInvoiceRequestsQuery): Promise<InvoiceRequest[]> {
    // penas delega a chamada para o repositório para buscar todas as solicitações.
    const requests = await this.invoiceRequestRepository.findAll();
    console.log(`Listando ${requests.length} solicitações de notas fiscais.`);
    return requests;
  }
}