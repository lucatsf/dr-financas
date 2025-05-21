import { CreateInvoiceRequestCommand } from './create-invoice-request.command';
import { InvoiceRequest } from '../../../domain/invoice-request/invoice-request.aggregate';
import { IInvoiceRequestRepository } from '../../../domain/invoice-request/invoice-request.repository';
import { InvoiceRequestedEvent } from '../../../domain/events/invoice-requested.event';
import { RabbitMQClient } from '../../../infrastructure/message-queue/rabbitmq.client';

export class CreateInvoiceRequestHandler {
  constructor(
    private readonly invoiceRequestRepository: IInvoiceRequestRepository,
    private readonly messageQueueClient: RabbitMQClient
  ) { }

  public async execute(command: CreateInvoiceRequestCommand): Promise<InvoiceRequest> {
    // 1. Criar o agregado de domínio
    const invoiceRequest = InvoiceRequest.create({
      cnpjTomadorServico: command.cnpjTomadorServico,
      municipioPrestacaoServico: command.municipioPrestacaoServico,
      estadoPrestacaoServico: command.estadoPrestacaoServico,
      valorServico: command.valorServico,
      dataDesejadaEmissao: command.dataDesejadaEmissao,
      descricaoServico: command.descricaoServico,
    });

    await this.invoiceRequestRepository.save(invoiceRequest);

    const event = new InvoiceRequestedEvent(invoiceRequest.id);
    await this.messageQueueClient.publish('invoice_requests', JSON.stringify(event));

    console.log(`Solicitação de NF ${invoiceRequest.id} criada e evento publicado.`);
    return invoiceRequest;
  }
}
