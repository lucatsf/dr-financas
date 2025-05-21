import { InvoiceRequest } from './invoice-request.aggregate';
import { InvoiceRequestStatus } from './invoice-request-status.vo';

export interface IInvoiceRequestRepository {
  save(invoiceRequest: InvoiceRequest): Promise<void>;
  findById(id: string): Promise<InvoiceRequest | null>;
  findAll(): Promise<InvoiceRequest[]>;
  findByStatus(status: InvoiceRequestStatus): Promise<InvoiceRequest[]>;
}