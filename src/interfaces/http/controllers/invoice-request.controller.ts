import { Request, Response } from 'express';
import { CreateInvoiceRequestHandler } from '../../../application/use-cases/create-invoice-request/create-invoice-request.handler';
import { CreateInvoiceRequestCommand } from '../../../application/use-cases/create-invoice-request/create-invoice-request.command';
import { CreateInvoiceRequestValidator } from '../dtos/create-invoice-request.dto';
import { GetInvoiceStatusHandler } from '../../../application/use-cases/get-invoice-status/get-invoice-status.handler';
import { GetInvoiceStatusQuery } from '../../../application/use-cases/get-invoice-status/get-invoice-status.query';
import { ListInvoiceRequestsQuery } from '../../../application/use-cases/list-invoice-requests/list-invoice-requests.query';
import { ListInvoiceRequestsHandler } from '../../../application/use-cases/list-invoice-requests/list-invoice-requests.handler';

export class InvoiceRequestController {
  constructor(
    private readonly createInvoiceRequestHandler: CreateInvoiceRequestHandler,
    private readonly getInvoiceStatusHandler: GetInvoiceStatusHandler,
    private readonly listInvoiceRequestsHandler: ListInvoiceRequestsHandler
  ) { }

  public async createInvoiceRequest(req: Request, res: Response): Promise<Response> {
    try {
      const dto = CreateInvoiceRequestValidator.validate(req.body);
      const command = new CreateInvoiceRequestCommand(
        dto.cnpjTomadorServico,
        dto.municipioPrestacaoServico,
        dto.estadoPrestacaoServico,
        dto.valorServico,
        new Date(dto.dataDesejadaEmissao),
        dto.descricaoServico
      );

      const invoiceRequest = await this.createInvoiceRequestHandler.execute(command);

      return res.status(202).json({
        id: invoiceRequest.id,
        status: invoiceRequest.status.value,
        message: 'Solicitação de nota fiscal recebida e encaminhada para processamento.'
      });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de NF:', error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  public async getInvoiceStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID da solicitação é obrigatório.' });
      }

      const query = new GetInvoiceStatusQuery(id);
      const invoiceRequest = await this.getInvoiceStatusHandler.execute(query);

      if (!invoiceRequest) {
        return res.status(404).json({ message: 'Solicitação de nota fiscal não encontrada.' });
      }

      return res.status(200).json({
        id: invoiceRequest.id,
        status: invoiceRequest.status.value,
        numeroNF: invoiceRequest.numeroNF,
        dataEmissaoNF: invoiceRequest.dataEmissaoNF ? invoiceRequest.dataEmissaoNF.toISOString() : undefined,
        dataCriacao: invoiceRequest.dataCriacao.toISOString(),
        dataUltimaAtualizacao: invoiceRequest.dataUltimaAtualizacao.toISOString()
      });
    } catch (error: any) {
      console.error('Erro ao obter status da solicitação:', error.message);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  public async listInvoiceRequests(req: Request, res: Response): Promise<Response> {
    try {
      const query = new ListInvoiceRequestsQuery();
      const invoiceRequests = await this.listInvoiceRequestsHandler.execute(query);

      // Mapeia a lista de Agregados para um formato JSON adequado para a resposta
      const responseData = invoiceRequests.map(req => ({
        id: req.id,
        cnpjTomadorServico: req.cnpjTomadorServico,
        municipioPrestacaoServico: req.municipioPrestacaoServico,
        estadoPrestacaoServico: req.estadoPrestacaoServico,
        valorServico: req.valorServico,
        dataDesejadaEmissao: req.dataDesejadaEmissao.toISOString(),
        descricaoServico: req.descricaoServico,
        dataCriacao: req.dataCriacao.toISOString(),
        dataUltimaAtualizacao: req.dataUltimaAtualizacao.toISOString(),
        status: req.status.value,
        numeroNF: req.numeroNF,
        dataEmissaoNF: req.dataEmissaoNF ? req.dataEmissaoNF.toISOString() : undefined,
      }));

      return res.status(200).json(responseData);
    } catch (error: any) {
      console.error('Erro ao listar solicitações de NF:', error.message);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
}
