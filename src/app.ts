// src/app.ts

import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { setupInvoiceRequestRoutes } from './interfaces/http/routes/invoice-request.routes';
import { InvoiceRequestMongoRepository } from './infrastructure/persistence/repositories/invoice-request.mongo.repository';
import { RabbitMQClient } from './infrastructure/message-queue/rabbitmq.client';

const MONGODB_URI = 'mongodb://localhost:27017/invoice_db';
const RABBITMQ_URL = 'amqp://localhost';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

async function bootstrap() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB!');

    const rabbitmqClient = new RabbitMQClient(RABBITMQ_URL);
    await rabbitmqClient.connect();
    console.log('Conectado ao RabbitMQ!');

    const invoiceRequestRepository = new InvoiceRequestMongoRepository();

    const router = express.Router();
    setupInvoiceRequestRoutes(router, invoiceRequestRepository, rabbitmqClient);
    app.use('/api', router);

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });

  } catch (error) {
    console.error('Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

bootstrap();
