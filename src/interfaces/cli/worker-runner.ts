import 'reflect-metadata';
import mongoose from 'mongoose';
import { RabbitMQClient } from '../../infrastructure/message-queue/rabbitmq.client';
import { InvoiceIssuanceService } from '../../domain/common/services/invoice-issuance.service';
import { InvoiceRequestMongoRepository } from '../../infrastructure/persistence/repositories/invoice-request.mongo.repository';
import { InvoiceRequestedEvent } from '../../domain/events/invoice-requested.event';

const MONGODB_URI = 'mongodb://localhost:27017/invoice_db';
const RABBITMQ_URL = 'amqp://localhost';
const INVOICE_REQUEST_QUEUE = 'invoice_requests';

async function startWorker() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Worker: Conectado ao MongoDB!');

    const rabbitmqClient = new RabbitMQClient(RABBITMQ_URL);
    await rabbitmqClient.connect();
    console.log('Worker: Conectado ao RabbitMQ!');

    const invoiceRequestRepository = new InvoiceRequestMongoRepository();

    const invoiceIssuanceService = new InvoiceIssuanceService(
      invoiceRequestRepository
    );

    console.log(`Worker: Iniciando consumo da fila ${INVOICE_REQUEST_QUEUE}...`);

    await rabbitmqClient.consume(INVOICE_REQUEST_QUEUE, async (message) => {
      console.log(`Worker: Mensagem recebida: ${message}`);
      const event: InvoiceRequestedEvent = JSON.parse(message);
      try {
        await invoiceIssuanceService.issueInvoice(event.invoiceRequestId);
        console.log(`Worker: Solicitação ${event.invoiceRequestId} processada com sucesso.`);
      } catch (error: any) {
        console.error(`Worker: Falha ao processar solicitação ${event.invoiceRequestId}: ${error.message}.`);
        throw error;
      }
    });

  } catch (error) {
    console.error('Worker: Erro fatal ao iniciar o worker:', error);
    process.exit(1);
  }
}

startWorker();
