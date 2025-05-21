import { GetInvoiceStatusHandler } from '../../../../../src/application/use-cases/get-invoice-status/get-invoice-status.handler';
import { GetInvoiceStatusQuery } from '../../../../../src/application/use-cases/get-invoice-status/get-invoice-status.query';
import { IInvoiceRequestRepository } from '../../../../../src/domain/invoice-request/invoice-request.repository';
import { InvoiceRequest } from '../../../../../src/domain/invoice-request/invoice-request.aggregate';
import { InvoiceRequestStatusVO } from '../../../../../src/domain/invoice-request/invoice-request-status.vo';

describe('GetInvoiceStatusHandler', () => {
  let handler: GetInvoiceStatusHandler;
  let mockInvoiceRequestRepository: jest.Mocked<IInvoiceRequestRepository>;

  beforeEach(() => {
    mockInvoiceRequestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
    } as jest.Mocked<IInvoiceRequestRepository>;

    handler = new GetInvoiceStatusHandler(mockInvoiceRequestRepository);
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  it('should return an InvoiceRequest if found by ID', async () => {
    const invoiceRequestId = 'test-invoice-id-123';
    const query = new GetInvoiceStatusQuery(invoiceRequestId);

    const mockInvoiceRequest = InvoiceRequest.create({
      id: invoiceRequestId,
      cnpjTomadorServico: '11223344000155',
      municipioPrestacaoServico: 'Florianópolis',
      estadoPrestacaoServico: 'SC',
      valorServico: 500.00,
      dataDesejadaEmissao: new Date('2025-08-01T00:00:00Z'),
      descricaoServico: 'Serviço de manutenção',
      status: InvoiceRequestStatusVO.pending(),
    });

    mockInvoiceRequestRepository.findById.mockResolvedValue(mockInvoiceRequest);

    const result = await handler.execute(query);

    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);

    expect(result).toEqual(mockInvoiceRequest);
  });

  it('should return null if InvoiceRequest is not found by ID', async () => {
    const invoiceRequestId = 'non-existent-id-456';
    const query = new GetInvoiceStatusQuery(invoiceRequestId);

    // Configura o mock do findById para resolver com null (não encontrado)
    mockInvoiceRequestRepository.findById.mockResolvedValue(null);

    const result = await handler.execute(query);

    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);

    expect(result).toBeNull();
  });

  it('should throw an error if repository findById fails', async () => {
    const invoiceRequestId = 'error-causing-id-789';
    const query = new GetInvoiceStatusQuery(invoiceRequestId);

    const repositoryError = new Error('Database read error');
    // Configura o mock do findById para rejeitar a promise, simulando uma falha
    mockInvoiceRequestRepository.findById.mockRejectedValue(repositoryError);

    await expect(handler.execute(query)).rejects.toThrow(repositoryError);

    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);
  });
});