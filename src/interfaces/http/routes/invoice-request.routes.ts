import { Router } from 'express';
import { InvoiceRequestController } from '../controllers/invoice-request.controller';
import { IInvoiceRequestRepository } from '../../../domain/invoice-request/invoice-request.repository';
import { CreateInvoiceRequestHandler } from '../../../application/use-cases/create-invoice-request/create-invoice-request.handler';
import { RabbitMQClient } from '../../../infrastructure/message-queue/rabbitmq.client';
import { GetInvoiceStatusHandler } from '../../../application/use-cases/get-invoice-status/get-invoice-status.handler';
import { ListInvoiceRequestsHandler } from '../../../application/use-cases/list-invoice-requests/list-invoice-requests.handler';

export const setupInvoiceRequestRoutes = (
  router: Router,
  invoiceRequestRepository: IInvoiceRequestRepository,
  rabbitmqClient: RabbitMQClient
) => {
  const createInvoiceRequestHandler = new CreateInvoiceRequestHandler(
    invoiceRequestRepository,
    rabbitmqClient
  );
  const getInvoiceStatusHandler = new GetInvoiceStatusHandler(invoiceRequestRepository);

  const listInvoiceRequestsHandler = new ListInvoiceRequestsHandler(invoiceRequestRepository);

  const controller = new InvoiceRequestController(
    createInvoiceRequestHandler,
    getInvoiceStatusHandler,
    listInvoiceRequestsHandler
  );

  const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  router.post('/invoice-requests', asyncHandler(controller.createInvoiceRequest.bind(controller)));
  router.get('/invoice-requests/:id', asyncHandler(controller.getInvoiceStatus.bind(controller)));
  router.get('/invoice-requests', asyncHandler(controller.listInvoiceRequests.bind(controller)));
};