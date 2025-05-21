import { Schema, model, Document } from 'mongoose';
import { InvoiceRequestStatus } from '../../../domain/invoice-request/invoice-request-status.vo';

export interface IInvoiceRequestDocument extends Document {
  id: string;
  cnpjTomadorServico: string;
  municipioPrestacaoServico: string;
  estadoPrestacaoServico: string;
  valorServico: number;
  dataDesejadaEmissao: Date;
  descricaoServico: string;
  dataCriacao: Date;
  dataUltimaAtualizacao: Date;
  status: InvoiceRequestStatus;
  numeroNF?: string;
  dataEmissaoNF?: Date;
}

const InvoiceRequestSchema = new Schema<IInvoiceRequestDocument>({
  id: { type: String, required: true, unique: true },
  cnpjTomadorServico: { type: String, required: true },
  municipioPrestacaoServico: { type: String, required: true },
  estadoPrestacaoServico: { type: String, required: true },
  valorServico: { type: Number, required: true },
  dataDesejadaEmissao: { type: Date, required: true },
  descricaoServico: { type: String, required: true },
  dataCriacao: { type: Date, required: true, default: Date.now },
  dataUltimaAtualizacao: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: Object.values(InvoiceRequestStatus) },
  numeroNF: { type: String, optional: true },
  dataEmissaoNF: { type: Date, optional: true },
});

export const InvoiceRequestModel = model<IInvoiceRequestDocument>('InvoiceRequest', InvoiceRequestSchema);
