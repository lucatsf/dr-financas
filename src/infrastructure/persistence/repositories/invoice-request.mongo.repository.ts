import { IInvoiceRequestRepository } from '../../../domain/invoice-request/invoice-request.repository';
import { InvoiceRequest } from '../../../domain/invoice-request/invoice-request.aggregate';
import { InvoiceRequestStatus, InvoiceRequestStatusVO } from '../../../domain/invoice-request/invoice-request-status.vo';
import { InvoiceRequestModel, IInvoiceRequestDocument } from '../schemas/invoice-request.schema';

export class InvoiceRequestMongoRepository implements IInvoiceRequestRepository {
  async save(invoiceRequest: InvoiceRequest): Promise<void> {
    const doc = await InvoiceRequestModel.findOne({ id: invoiceRequest.id });

    if (doc) {
      // Atualizar
      doc.set({
        cnpjTomadorServico: invoiceRequest.cnpjTomadorServico,
        municipioPrestacaoServico: invoiceRequest.municipioPrestacaoServico,
        estadoPrestacaoServico: invoiceRequest.estadoPrestacaoServico,
        valorServico: invoiceRequest.valorServico,
        dataDesejadaEmissao: invoiceRequest.dataDesejadaEmissao,
        descricaoServico: invoiceRequest.descricaoServico,
        dataUltimaAtualizacao: new Date(), // Atualiza sempre na persistência
        status: invoiceRequest.status.value,
        numeroNF: invoiceRequest.numeroNF,
        dataEmissaoNF: invoiceRequest.dataEmissaoNF,
      });
      await doc.save();
    } else {
      // Criar novo
      const newDoc = new InvoiceRequestModel({
        id: invoiceRequest.id,
        cnpjTomadorServico: invoiceRequest.cnpjTomadorServico,
        municipioPrestacaoServico: invoiceRequest.municipioPrestacaoServico,
        estadoPrestacaoServico: invoiceRequest.estadoPrestacaoServico,
        valorServico: invoiceRequest.valorServico,
        dataDesejadaEmissao: invoiceRequest.dataDesejadaEmissao,
        descricaoServico: invoiceRequest.descricaoServico,
        dataCriacao: invoiceRequest.dataCriacao,
        dataUltimaAtualizacao: invoiceRequest.dataUltimaAtualizacao,
        status: invoiceRequest.status.value,
        numeroNF: invoiceRequest.numeroNF,
        dataEmissaoNF: invoiceRequest.dataEmissaoNF,
      });
      await newDoc.save();
    }
  }

  async findById(id: string): Promise<InvoiceRequest | null> {
    const doc = await InvoiceRequestModel.findOne({ id }).lean();
    if (!doc) {
      return null;
    }
    return this.mapDocumentToAggregate(doc);
  }

  async findAll(): Promise<InvoiceRequest[]> {
    const docs = await InvoiceRequestModel.find({}).lean();
    return docs.map(doc => this.mapDocumentToAggregate(doc));
  }

  async findByStatus(status: InvoiceRequestStatus): Promise<InvoiceRequest[]> {
    const docs = await InvoiceRequestModel.find({ status }).lean();
    return docs.map(doc => this.mapDocumentToAggregate(doc));
  }

  private mapDocumentToAggregate(doc: IInvoiceRequestDocument): InvoiceRequest {
    // Reconstiui o agregado a partir do documento do banco de dados
    return InvoiceRequest.create({
      id: doc.id,
      cnpjTomadorServico: doc.cnpjTomadorServico,
      municipioPrestacaoServico: doc.municipioPrestacaoServico,
      estadoPrestacaoServico: doc.estadoPrestacaoServico,
      valorServico: doc.valorServico,
      dataDesejadaEmissao: doc.dataDesejadaEmissao,
      descricaoServico: doc.descricaoServico,
      dataCriacao: doc.dataCriacao,
      dataUltimaAtualizacao: doc.dataUltimaAtualizacao,
      status: new InvoiceRequestStatusVO(doc.status),
      numeroNF: doc.numeroNF,
      dataEmissaoNF: doc.dataEmissaoNF,
    });
  }
}
