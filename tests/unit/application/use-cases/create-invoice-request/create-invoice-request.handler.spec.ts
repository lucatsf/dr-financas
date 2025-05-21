import { CreateInvoiceRequestHandler } from '../../../../../src/application/use-cases/create-invoice-request/create-invoice-request.handler';
import { CreateInvoiceRequestCommand } from '../../../../../src/application/use-cases/create-invoice-request/create-invoice-request.command';
import { InvoiceRequest } from '../../../../../src/domain/invoice-request/invoice-request.aggregate';
import { IInvoiceRequestRepository } from '../../../../../src/domain/invoice-request/invoice-request.repository';
import { RabbitMQClient } from '../../../../../src/infrastructure/message-queue/rabbitmq.client';
import { InvoiceRequestedEvent } from '../../../../../src/domain/events/invoice-requested.event';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-123-handler',
}));

describe('CreateInvoiceRequestHandler', () => {
  let handler: CreateInvoiceRequestHandler;
  let mockInvoiceRequestRepository: jest.Mocked<IInvoiceRequestRepository>;
  let mockRabbitMQClient: jest.Mocked<RabbitMQClient>;

  beforeEach(() => {
    mockInvoiceRequestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
    } as jest.Mocked<IInvoiceRequestRepository>;

    mockRabbitMQClient = {
      connect: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<RabbitMQClient>;

    handler = new CreateInvoiceRequestHandler(
      mockInvoiceRequestRepository,
      mockRabbitMQClient
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an invoice request, save it, and publish an event', async () => {
    const command = new CreateInvoiceRequestCommand(
      '98765432000100',
      'Curitiba',
      'PR',
      250.75,
      new Date('2025-07-15T00:00:00Z'),
      'Desenvolvimento de software'
    );

    mockInvoiceRequestRepository.save.mockResolvedValue(undefined); 

    mockRabbitMQClient.publish.mockResolvedValue(true); 

    const result = await handler.execute(command);

    // Verifica se a InvoiceRequest foi criada corretamente
    expect(result).toBeInstanceOf(InvoiceRequest);
    expect(result.id).toBe('mocked-uuid-123-handler');
    expect(result.cnpjTomadorServico).toBe(command.cnpjTomadorServico);
    expect(result.descricaoServico).toBe(command.descricaoServico);
    expect(result.municipioPrestacaoServico).toBe(command.municipioPrestacaoServico);
    expect(result.estadoPrestacaoServico).toBe(command.estadoPrestacaoServico);
    expect(result.valorServico).toBe(command.valorServico);
    expect(result.dataDesejadaEmissao).toEqual(command.dataDesejadaEmissao);
    expect(result.status.value).toBe('PENDENTE_EMISSAO');
    expect(result.dataCriacao).toBeInstanceOf(Date);
    expect(result.dataUltimaAtualizacao).toBeInstanceOf(Date);
    expect(result.numeroNF).toBeUndefined();
    expect(result.dataEmissaoNF).toBeUndefined();

    expect(mockInvoiceRequestRepository.save).toHaveBeenCalledTimes(1);
    expect(mockInvoiceRequestRepository.save).toHaveBeenCalledWith(result);

    expect(mockRabbitMQClient.publish).toHaveBeenCalledTimes(1);
    const expectedQueueName = 'invoice_requests';
    const expectedEvent = new InvoiceRequestedEvent('mocked-uuid-123-handler');

    expect(mockRabbitMQClient.publish).toHaveBeenCalledWith(
      expectedQueueName,
      JSON.stringify(expectedEvent)
    );
  });

  it('should throw an error if saving to repository fails', async () => {
    const command = new CreateInvoiceRequestCommand(
      '98765432000100',
      'Curitiba',
      'PR',
      250.75,
      new Date('2025-07-15T00:00:00Z'),
      'Desenvolvimento de software'
    );

    const saveError = new Error('Database connection failed');

    mockInvoiceRequestRepository.save.mockRejectedValue(saveError);

    await expect(handler.execute(command)).rejects.toThrow(saveError);

    expect(mockInvoiceRequestRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRabbitMQClient.publish).not.toHaveBeenCalled();
  });

  it('should throw an error if publishing event to message queue fails', async () => {
    const command = new CreateInvoiceRequestCommand(
      '98765432000100',
      'Curitiba',
      'PR',
      250.75,
      new Date('2025-07-15T00:00:00Z'),
      'Desenvolvimento de software'
    );

    mockInvoiceRequestRepository.save.mockResolvedValue(undefined);

    const publishError = new Error('RabbitMQ connection issue');
    mockRabbitMQClient.publish.mockRejectedValue(publishError);

    await expect(handler.execute(command)).rejects.toThrow(publishError);

    expect(mockInvoiceRequestRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRabbitMQClient.publish).toHaveBeenCalledTimes(1);
  });
});