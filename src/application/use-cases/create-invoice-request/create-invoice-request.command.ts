export class CreateInvoiceRequestCommand {
  constructor(
    public readonly cnpjTomadorServico: string,
    public readonly municipioPrestacaoServico: string,
    public readonly estadoPrestacaoServico: string,
    public readonly valorServico: number,
    public readonly dataDesejadaEmissao: Date,
    public readonly descricaoServico: string
  ) { }
}
