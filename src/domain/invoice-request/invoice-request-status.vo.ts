export enum InvoiceRequestStatus {
  PENDENTE_EMISSAO = 'PENDENTE_EMISSAO',
  EMITIDA = 'EMITIDA',
  CANCELADA = 'CANCELADA',
}

export class InvoiceRequestStatusVO {
  constructor(public readonly value: InvoiceRequestStatus) { }

  public static pending(): InvoiceRequestStatusVO {
    return new InvoiceRequestStatusVO(InvoiceRequestStatus.PENDENTE_EMISSAO);
  }

  public static issued(): InvoiceRequestStatusVO {
    return new InvoiceRequestStatusVO(InvoiceRequestStatus.EMITIDA);
  }

  public static cancelled(): InvoiceRequestStatusVO {
    return new InvoiceRequestStatusVO(InvoiceRequestStatus.CANCELADA);
  }

  public equals(other: InvoiceRequestStatusVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
