export interface CreateInvoiceRequestDTO {
  cnpjTomadorServico: string;
  municipioPrestacaoServico: string;
  estadoPrestacaoServico: string;
  valorServico: number;
  dataDesejadaEmissao: string;
  descricaoServico: string;
}

// Helper para validar DTO
export class CreateInvoiceRequestValidator {
  public static validate(body: any): CreateInvoiceRequestDTO {
    const { cnpjTomadorServico, municipioPrestacaoServico, estadoPrestacaoServico, valorServico, dataDesejadaEmissao, descricaoServico } = body;

    if (!cnpjTomadorServico || typeof cnpjTomadorServico !== 'string') {
      throw new Error('cnpjTomadorServico é obrigatório e deve ser uma string.');
    }
    if (!municipioPrestacaoServico || typeof municipioPrestacaoServico !== 'string') {
      throw new Error('municipioPrestacaoServico é obrigatório e deve ser uma string.');
    }
    if (!estadoPrestacaoServico || typeof estadoPrestacaoServico !== 'string') {
      throw new Error('estadoPrestacaoServico é obrigatório e deve ser uma string.');
    }
    if (typeof valorServico !== 'number' || valorServico <= 0) {
      throw new Error('valorServico é obrigatório e deve ser um número positivo.');
    }
    if (!dataDesejadaEmissao || typeof dataDesejadaEmissao !== 'string' || isNaN(new Date(dataDesejadaEmissao).getTime())) {
      throw new Error('dataDesejadaEmissao é obrigatória e deve ser uma data ISO válida.');
    }
    if (!descricaoServico || typeof descricaoServico !== 'string') {
      throw new Error('descricaoServico é obrigatória e deve ser uma string.');
    }

    return {
      cnpjTomadorServico,
      municipioPrestacaoServico,
      estadoPrestacaoServico,
      valorServico,
      dataDesejadaEmissao,
      descricaoServico,
    };
  }
}
