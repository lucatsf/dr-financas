import { InvoiceRequest } from '../../../../src/domain/invoice-request/invoice-request.aggregate';
import { InvoiceRequestStatus, InvoiceRequestStatusVO } from '../../../../src/domain/invoice-request/invoice-request-status.vo';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-123',
}));

describe('InvoiceRequest Aggregate', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new InvoiceRequest with PENDENTE_EMISSAO status by default', () => {
    const props = {
      cnpjTomadorServico: '12345678000190',
      municipioPrestacaoServico: 'São Paulo',
      estadoPrestacaoServico: 'SP',
      valorServico: 100.50,
      dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
      descricaoServico: 'Serviço de consultoria',
    };

    const invoiceRequest = InvoiceRequest.create(props);

    expect(invoiceRequest.id).toBe('mocked-uuid-123');
    expect(invoiceRequest.cnpjTomadorServico).toBe(props.cnpjTomadorServico);
    expect(invoiceRequest.status.value).toBe(InvoiceRequestStatus.PENDENTE_EMISSAO);
    expect(invoiceRequest.dataCriacao).toBeInstanceOf(Date);
    expect(invoiceRequest.dataUltimaAtualizacao).toBeInstanceOf(Date);
    expect(invoiceRequest.numeroNF).toBeUndefined();
    expect(invoiceRequest.dataEmissaoNF).toBeUndefined();
  });

  it('should mark an InvoiceRequest as EMITIDA', () => {
    const props = {
      cnpjTomadorServico: '12345678000190',
      municipioPrestacaoServico: 'São Paulo',
      estadoPrestacaoServico: 'SP',
      valorServico: 100.50,
      dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
      descricaoServico: 'Serviço de consultoria',
    };

    const invoiceRequest = InvoiceRequest.create(props);
    const numeroNF = 'ABC-12345';
    const dataEmissaoNF = new Date('2025-05-20T10:00:00Z');

    const initialUpdateTime = invoiceRequest.dataUltimaAtualizacao;

    invoiceRequest.markAsIssued(numeroNF, dataEmissaoNF);

    expect(invoiceRequest.status.value).toBe(InvoiceRequestStatus.EMITIDA);
    expect(invoiceRequest.numeroNF).toBe(numeroNF);
    expect(invoiceRequest.dataEmissaoNF).toBe(dataEmissaoNF);
  });

  it('should throw an error if trying to mark an already issued InvoiceRequest as EMITIDA', () => {
    const props = {
      cnpjTomadorServico: '12345678000190',
      municipioPrestacaoServico: 'São Paulo',
      estadoPrestacaoServico: 'SP',
      valorServico: 100.50,
      dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
      descricaoServico: 'Serviço de consultoria',
      status: InvoiceRequestStatusVO.issued() 
    };

    const invoiceRequest = InvoiceRequest.create(props);
    const numeroNF = 'ABC-54321';
    const dataEmissaoNF = new Date('2025-05-20T11:00:00Z');

    expect(() => invoiceRequest.markAsIssued(numeroNF, dataEmissaoNF))
      .toThrow('A nota fiscal só pode ser marcada como emitida se estiver PENDENTE_EMISSAO.');
  });

  it('should mark an InvoiceRequest as CANCELADA', () => {
    const props = {
      cnpjTomadorServico: '12345678000190',
      municipioPrestacaoServico: 'São Paulo',
      estadoPrestacaoServico: 'SP',
      valorServico: 100.50,
      dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
      descricaoServico: 'Serviço de consultoria',
      status: InvoiceRequestStatusVO.pending()
    };

    const invoiceRequest = InvoiceRequest.create(props);

    invoiceRequest.markAsCancelled();
    expect(invoiceRequest.status.value).toBe(InvoiceRequestStatus.CANCELADA);
    expect(invoiceRequest.numeroNF).toBeUndefined();
    expect(invoiceRequest.dataEmissaoNF).toBeUndefined();
  });


  it('should throw an error if trying to mark an already EMITIDA InvoiceRequest as CANCELADA', () => {
    const props = {
      cnpjTomadorServico: '12345678000190',
      municipioPrestacaoServico: 'São Paulo',
      estadoPrestacaoServico: 'SP',
      valorServico: 100.50,
      dataDesejadaEmissao: new Date('2025-06-01T00:00:00Z'),
      descricaoServico: 'Serviço de consultoria',
      status: InvoiceRequestStatusVO.issued()
    };

    const invoiceRequest = InvoiceRequest.create(props);

    expect(() => invoiceRequest.markAsCancelled())
      .toThrow('Não é possível cancelar uma nota fiscal já emitida.');
  });
});
