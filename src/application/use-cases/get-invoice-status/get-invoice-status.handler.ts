import { GetInvoiceStatusQuery } from './get-invoice-status.query';
import { InvoiceRequest } from '../../../domain/invoice-request/invoice-request.aggregate';
import { IInvoiceRequestRepository } from '../../../domain/invoice-request/invoice-request.repository';

export class GetInvoiceStatusHandler {
  constructor(
    private readonly invoiceRequestRepository: IInvoiceRequestRepository
  ) { }

  public async execute(query: GetInvoiceStatusQuery): Promise<InvoiceRequest | null> {
    return this.invoiceRequestRepository.findById(query.invoiceRequestId);
  }
}
