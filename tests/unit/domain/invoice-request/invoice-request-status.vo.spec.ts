import { InvoiceRequestStatus, InvoiceRequestStatusVO } from '../../../../src/domain/invoice-request/invoice-request-status.vo';

describe('InvoiceRequestStatusVO', () => {

  it('should create an InvoiceRequestStatusVO with the correct value', () => {
    const status = new InvoiceRequestStatusVO(InvoiceRequestStatus.PENDENTE_EMISSAO);
    expect(status.value).toBe(InvoiceRequestStatus.PENDENTE_EMISSAO);
  });

  it('should correctly create a PENDENTE_EMISSAO status using the static factory method', () => {
    const status = InvoiceRequestStatusVO.pending();
    expect(status.value).toBe(InvoiceRequestStatus.PENDENTE_EMISSAO);
  });

  it('should correctly create an EMITIDA status using the static factory method', () => {
    const status = InvoiceRequestStatusVO.issued();
    expect(status.value).toBe(InvoiceRequestStatus.EMITIDA);
  });

  it('should correctly create a CANCELADA status using the static factory method', () => {
    const status = InvoiceRequestStatusVO.cancelled();
    expect(status.value).toBe(InvoiceRequestStatus.CANCELADA);
  });

  it('should return true for two equal InvoiceRequestStatusVO instances', () => {
    const status1 = new InvoiceRequestStatusVO(InvoiceRequestStatus.EMITIDA);
    const status2 = new InvoiceRequestStatusVO(InvoiceRequestStatus.EMITIDA);
    expect(status1.equals(status2)).toBe(true);
  });

  it('should return false for two different InvoiceRequestStatusVO instances', () => {
    const status1 = new InvoiceRequestStatusVO(InvoiceRequestStatus.PENDENTE_EMISSAO);
    const status2 = new InvoiceRequestStatusVO(InvoiceRequestStatus.EMITIDA);
    expect(status1.equals(status2)).toBe(false);
  });

  it('should return the string representation of the status', () => {
    const status = new InvoiceRequestStatusVO(InvoiceRequestStatus.CANCELADA);
    expect(status.toString()).toBe('CANCELADA');
  });
});