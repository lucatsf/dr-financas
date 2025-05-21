import { InvoiceIssuanceService } from '../../../../../src/domain/common/services/invoice-issuance.service';
import { IInvoiceRequestRepository } from '../../../../../src/domain/invoice-request/invoice-request.repository';
import { InvoiceRequest } from '../../../../../src/domain/invoice-request/invoice-request.aggregate';
import { InvoiceRequestStatusVO, InvoiceRequestStatus } from '../../../../../src/domain/invoice-request/invoice-request-status.vo';

import { invoiceIssuanceCircuitBreaker } from '../../../../../src/infrastructure/http-client/circuit-breaker/invoice-issuance.circuit-breaker';
import { retryWithExponentialBackoff } from '../../../../../src/shared/utils/retry.util';

jest.mock('../../../../../src/infrastructure/http-client/circuit-breaker/invoice-issuance.circuit-breaker', () => ({
    invoiceIssuanceCircuitBreaker: {
        fire: jest.fn(),
    },
}));

// Mock do utilitário de retry
jest.mock('../../../../../src/shared/utils/retry.util', () => ({
    retryWithExponentialBackoff: jest.fn((fn, options) => fn()),
}));


describe('InvoiceIssuanceService', () => {
    let service: InvoiceIssuanceService;
    let mockInvoiceRequestRepository: jest.Mocked<IInvoiceRequestRepository>;
    const mockedCircuitBreakerFire = invoiceIssuanceCircuitBreaker.fire as jest.Mock;
    const mockedRetryUtil = retryWithExponentialBackoff as jest.Mock;

    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        mockInvoiceRequestRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findByStatus: jest.fn(),
        } as jest.Mocked<IInvoiceRequestRepository>;

        service = new InvoiceIssuanceService(mockInvoiceRequestRepository);

        mockedCircuitBreakerFire.mockClear();
        mockedRetryUtil.mockClear();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    // --- Cenários de Encontrar/Não Encontrar a Solicitação ---
    it('should log an error and return if InvoiceRequest is not found', async () => {
        const invoiceRequestId = 'non-existent-id';
        mockInvoiceRequestRepository.findById.mockResolvedValue(null);

        await service.issueInvoice(invoiceRequestId);

        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Solicitação de NF com ID ${invoiceRequestId} não encontrada.`
        );

        expect(mockedRetryUtil).not.toHaveBeenCalled();
        expect(mockInvoiceRequestRepository.save).not.toHaveBeenCalled();
    });

    it('should log a warning and return if InvoiceRequest status is not PENDENTE_EMISSAO', async () => {
        const invoiceRequestId = 'issued-id';
        // Cria uma InvoiceRequest com status EMITIDA
        const mockInvoiceRequest = InvoiceRequest.create({
            id: invoiceRequestId,
            cnpjTomadorServico: '12345678000190',
            municipioPrestacaoServico: 'Cidade',
            estadoPrestacaoServico: 'UF',
            valorServico: 100,
            dataDesejadaEmissao: new Date(),
            descricaoServico: 'Serviço',
            status: InvoiceRequestStatusVO.issued(),
        });
        mockInvoiceRequestRepository.findById.mockResolvedValue(mockInvoiceRequest);

        await service.issueInvoice(invoiceRequestId);

        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            `Solicitação de NF com ID ${invoiceRequestId} não está PENDENTE_EMISSAO. Status atual: ${InvoiceRequestStatus.EMITIDA}`
        );

        expect(mockedRetryUtil).not.toHaveBeenCalled();
        expect(mockInvoiceRequestRepository.save).not.toHaveBeenCalled();
    });

    // --- Cenários de Sucesso na Emissão ---
    it('should successfully issue invoice, mark as issued, and save', async () => {
        const invoiceRequestId = 'pending-id';
        const mockNumeroNF = 'NF-SUCCESS-123';
        const mockDataEmissaoNF = new Date('2025-05-20T10:30:00Z');

        const mockInvoiceRequest = InvoiceRequest.create({
            id: invoiceRequestId,
            cnpjTomadorServico: '12345678000190',
            municipioPrestacaoServico: 'Cidade',
            estadoPrestacaoServico: 'UF',
            valorServico: 100,
            dataDesejadaEmissao: new Date('2025-05-25T00:00:00Z'),
            descricaoServico: 'Serviço',
            status: InvoiceRequestStatusVO.pending(),
        });
        mockInvoiceRequestRepository.findById.mockResolvedValue(mockInvoiceRequest);

        mockedRetryUtil.mockImplementationOnce((fn: () => Promise<any>) => fn());
        mockedCircuitBreakerFire.mockResolvedValue({
            numeroNF: mockNumeroNF,
            dataEmissao: mockDataEmissaoNF.toISOString(),
        });

        const markAsIssuedSpy = jest.spyOn(mockInvoiceRequest, 'markAsIssued');

        await service.issueInvoice(invoiceRequestId);

        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledWith(invoiceRequestId);

        expect(mockedRetryUtil).toHaveBeenCalledTimes(1);
        expect(mockedRetryUtil).toHaveBeenCalledWith(
            expect.any(Function),
            { maxRetries: 5, initialDelayMs: 1000 }
        );

        // Verifica se o fire do Circuit Breaker foi chamado
        expect(mockedCircuitBreakerFire).toHaveBeenCalledTimes(1);
        const expectedPayload = {
            cnpjTomadorServico: mockInvoiceRequest.cnpjTomadorServico,
            municipioPrestacaoServico: mockInvoiceRequest.municipioPrestacaoServico,
            estadoPrestacaoServico: mockInvoiceRequest.estadoPrestacaoServico,
            valorServico: mockInvoiceRequest.valorServico,
            dataDesejadaEmissao: mockInvoiceRequest.dataDesejadaEmissao.toISOString(),
            descricaoServico: mockInvoiceRequest.descricaoServico,
        };
        expect(mockedCircuitBreakerFire).toHaveBeenCalledWith(expectedPayload);

        expect(markAsIssuedSpy).toHaveBeenCalledTimes(1);
        expect(markAsIssuedSpy).toHaveBeenCalledWith(mockNumeroNF, expect.any(Date));

        expect(mockInvoiceRequestRepository.save).toHaveBeenCalledTimes(1);
        expect(mockInvoiceRequestRepository.save).toHaveBeenCalledWith(mockInvoiceRequest);
        expect(mockInvoiceRequest.status.value).toBe(InvoiceRequestStatus.EMITIDA);

        // Verifica se a mensagem de sucesso foi logada
        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Nota Fiscal ${mockNumeroNF} emitida com sucesso para a solicitação ${invoiceRequestId}`
        );

        // Restaura o spy de markAsIssued
        markAsIssuedSpy.mockRestore();
    });

    // --- Cenários de Falha na Emissão ---
    it('should throw an error and log if invoice issuance fails after retries', async () => {
        const invoiceRequestId = 'fail-id';
        const mockInvoiceRequest = InvoiceRequest.create({
            id: invoiceRequestId,
            cnpjTomadorServico: '12345678000190',
            municipioPrestacaoServico: 'Cidade',
            estadoPrestacaoServico: 'UF',
            valorServico: 100,
            dataDesejadaEmissao: new Date('2025-05-25T00:00:00Z'),
            descricaoServico: 'Serviço',
            status: InvoiceRequestStatusVO.pending(),
        });
        mockInvoiceRequestRepository.findById.mockResolvedValue(mockInvoiceRequest);

        const issuanceError = new Error('API externa falhou após todas as retentativas');
        // Configura o retry util para rejeitar a promise, simulando falha após retentativas
        mockedRetryUtil.mockRejectedValue(issuanceError);

        // Espera que o método lance o erro
        await expect(service.issueInvoice(invoiceRequestId)).rejects.toThrow(issuanceError);

        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);

        expect(mockedRetryUtil).toHaveBeenCalledTimes(1);
        expect(mockedCircuitBreakerFire).toHaveBeenCalledTimes(0);

        expect(mockInvoiceRequestRepository.save).not.toHaveBeenCalled();
        expect(mockInvoiceRequest.status.value).toBe(InvoiceRequestStatus.PENDENTE_EMISSAO);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Falha FINAL ao emitir nota fiscal para a solicitação ${invoiceRequestId} após retentativas:`,
            issuanceError.message
        );
    });

    it('should throw an error if repository findById fails', async () => {
        const invoiceRequestId = 'repo-fail-id';
        const repositoryError = new Error('Erro de conexão com o banco de dados');
        mockInvoiceRequestRepository.findById.mockRejectedValue(repositoryError);

        await expect(service.issueInvoice(invoiceRequestId)).rejects.toThrow(repositoryError);

        // Verifica se findById foi chamado e nada mais
        expect(mockInvoiceRequestRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockedRetryUtil).not.toHaveBeenCalled();
        expect(mockInvoiceRequestRepository.save).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled(); // Porque o erro é relançado, não tratado com log específico ali
    });
});