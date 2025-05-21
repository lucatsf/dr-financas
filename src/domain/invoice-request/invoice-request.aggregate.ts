import { v4 as uuidv4 } from 'uuid';
import { InvoiceRequestStatusVO, InvoiceRequestStatus } from './invoice-request-status.vo';

interface InvoiceRequestProps {
  id?: string;
  cnpjTomadorServico: string;
  municipioPrestacaoServico: string;
  estadoPrestacaoServico: string;
  valorServico: number;
  dataDesejadaEmissao: Date;
  descricaoServico: string;
  dataCriacao?: Date;
  dataUltimaAtualizacao?: Date;
  status?: InvoiceRequestStatusVO;
  numeroNF?: string;
  dataEmissaoNF?: Date;
}

export class InvoiceRequest {
  public readonly id: string;
  public cnpjTomadorServico: string;
  public municipioPrestacaoServico: string;
  public estadoPrestacaoServico: string;
  public valorServico: number;
  public dataDesejadaEmissao: Date;
  public descricaoServico: string;
  public dataCriacao: Date;
  public dataUltimaAtualizacao: Date;
  public status: InvoiceRequestStatusVO;
  public numeroNF?: string;
  public dataEmissaoNF?: Date;

  private constructor(props: InvoiceRequestProps) {
    this.id = props.id || uuidv4(); // Gera um UUID se não for fornecido
    this.cnpjTomadorServico = props.cnpjTomadorServico;
    this.municipioPrestacaoServico = props.municipioPrestacaoServico;
    this.estadoPrestacaoServico = props.estadoPrestacaoServico;
    this.valorServico = props.valorServico;
    this.dataDesejadaEmissao = props.dataDesejadaEmissao;
    this.descricaoServico = props.descricaoServico;
    this.dataCriacao = props.dataCriacao || new Date();
    this.dataUltimaAtualizacao = props.dataUltimaAtualizacao || new Date();
    this.status = props.status || InvoiceRequestStatusVO.pending();
    this.numeroNF = props.numeroNF;
    this.dataEmissaoNF = props.dataEmissaoNF;
  }

  public static create(props: InvoiceRequestProps): InvoiceRequest {
    // NOTE: Talvez posso criar validações aqui 
    // Ex: if (props.valorServico <= 0) throw new InvalidValueDomainError();
    return new InvoiceRequest(props);
  }

  public markAsIssued(numeroNF: string, dataEmissaoNF: Date): void {
    if (this.status.value !== InvoiceRequestStatus.PENDENTE_EMISSAO) {
      throw new Error('A nota fiscal só pode ser marcada como emitida se estiver PENDENTE_EMISSAO.');
    }
    this.status = InvoiceRequestStatusVO.issued();
    this.numeroNF = numeroNF;
    this.dataEmissaoNF = dataEmissaoNF;
    this.dataUltimaAtualizacao = new Date();
  }

  public markAsCancelled(): void {
    if (this.status.value === InvoiceRequestStatus.EMITIDA) {
      throw new Error('Não é possível cancelar uma nota fiscal já emitida.');
    }
    this.status = InvoiceRequestStatusVO.cancelled();
    this.dataUltimaAtualizacao = new Date();
  }
}
