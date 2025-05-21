import { ListInvoiceRequestsHandler } from '../../../../../src/application/use-cases/list-invoice-requests/list-invoice-requests.handler';
import { ListInvoiceRequestsQuery } from '../../../../../src/application/use-cases/list-invoice-requests/list-invoice-requests.query';
import { IInvoiceRequestRepository } from '../../../../../src/domain/invoice-request/invoice-request.repository';
import { InvoiceRequest } from '../../../../../src/domain/invoice-request/invoice-request.aggregate';
import { InvoiceRequestStatusVO } from '../../../../../src/domain/invoice-request/invoice-request-status.vo';

describe('ListInvoiceRequestsHandler', () => {
  let handler: ListInvoiceRequestsHandler;
  let mockInvoiceRequestRepository: jest.Mocked<IInvoiceRequestRepository>;

  beforeEach(() => {
    mockInvoiceRequestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(), 
      findByStatus: jest.fn(),
    } as jest.Mocked<IInvoiceRequestRepository>;

    handler = new ListInvoiceRequestsHandler(mockInvoiceRequestRepository);
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  it('should return a list of InvoiceRequests when requests are found', async () => {
    const query = new ListInvoiceRequestsQuery();

    const mockInvoiceRequests: InvoiceRequest[] = [
      InvoiceRequest.create({
        id: 'id-1',
        cnpjTomadorServico: '11111111000100',
        municipioPrestacaoServico: 'São Paulo',
        estadoPrestacaoServico: 'SP',
        valorServico: 100.00,
        dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
        descricaoServico: 'Serviço A',
        status: InvoiceRequestStatusVO.pending(),
      }),
      InvoiceRequest.create({
        id: 'id-2',
        cnpjTomadorServico: '22222222000100',
        municipioPrestacaoServico: 'Rio de Janeiro',
        estadoPrestacaoServico: 'RJ',
        valorServico: 200.00,
        dataDesejadaEmissao: new Date('2025-06-05T00:00:00Z'),
        descricaoServico: 'Serviço B',
        status: InvoiceRequestStatusVO.issued(),
      }),
    ];

    // Configura o mock do findAll para resolver com a lista mockada
    mockInvoiceRequestRepository.findAll.mockResolvedValue(mockInvoiceRequests);

    const consoleSpy = jest.spyOn(console, 'log');

    const result = await handler.execute(query);

    expect(mockInvoiceRequestRepository.findAll).toHaveBeenCalledTimes(1);

    expect(result).toEqual(mockInvoiceRequests);
    expect(result.length).toBe(2);

    expect(consoleSpy).toHaveBeenCalledWith('Listando 2 solicitações de notas fiscais.');

    consoleSpy.mockRestore();
  });

  it('should return an empty array when no InvoiceRequests are found', async () => {
    const query = new ListInvoiceRequestsQuery();

    mockInvoiceRequestRepository.findAll.mockResolvedValue([]);

    const consoleSpy = jest.spyOn(console, 'log');

    const result = await handler.execute(query);

    expect(mockInvoiceRequestRepository.findAll).toHaveBeenCalledTimes(1);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);

    expect(consoleSpy).toHaveBeenCalledWith('Listando 0 solicitações de notas fiscais.');

    consoleSpy.mockRestore();
  });

  it('should throw an error if repository findAll fails', async () => {
    const query = new ListInvoiceRequestsQuery();

    const repositoryError = new Error('Database connection error');
    mockInvoiceRequestRepository.findAll.mockRejectedValue(repositoryError);

    await expect(handler.execute(query)).rejects.toThrow(repositoryError);

    expect(mockInvoiceRequestRepository.findAll).toHaveBeenCalledTimes(1);
  });
});