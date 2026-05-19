/**
 * src/tests/reserva.test.js
 *
 * Testes de todos os endpoints do microsserviço de reservas.
 * O controlador é mockado e injetado — nenhuma conexão real com DB ou RabbitMQ é necessária.
 */

// ─── Mocks do Controlador ───────────────────────────────────────────────────
const mockController = {
    criar: jest.fn(),
    listarAtivas: jest.fn(),
    buscarPorId: jest.fn(),
    atualizarTotal: jest.fn(),
    alterarStatus: jest.fn(),
    deletar: jest.fn(),
    buscarHistorico: jest.fn(),
    buscarPorUsuario: jest.fn(),
    listarFilaLivro: jest.fn(),
    renovar: jest.fn(),
    buscarPorStatus: jest.fn(),
    listarVencidas: jest.fn(),
    cancelarVencidasLote: jest.fn(),
    limparPorUsuario: jest.fn(),
    feedRecentes: jest.fn(),
    validarConflito: jest.fn(),
    contarPendentes: jest.fn(),
    contarFilaLivro: jest.fn(),
    registrarNotificacao: jest.fn(),
    feedHistoricoGeral: jest.fn()
};

const fastify = require('fastify')();
const reservaRoutes = require('../routes/reserva.routes');

fastify.register(reservaRoutes, { controller: mockController });

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const reservaMock = {
    reserva_id: 1,
    livro_id: 10,
    usuario_id: 'usr-001',
    reserva_data_criacao: new Date().toISOString(),
    reserva_data_limite_retirada: null,
    status: 1,
};

const historicoMock = {
    reserva_historico_id: 1,
    reserva_id: 1,
    reserva_historico_status_anterior: 1,
    reserva_historico_status_novo: 2,
    motivo: 'Teste',
    reserva_historico_data_alteracao: new Date().toISOString(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Reservas API — todos os endpoints', () => {

    afterAll(() => fastify.close());
    beforeEach(() => jest.clearAllMocks());

    // ── POST /  ──────────────────────────────────────────────────────────────
    test('POST / — deve criar uma reserva (201)', async () => {
        mockController.criar.mockImplementationOnce((req, reply) => {
            return reply.code(201).send({ success: true, data: reservaMock });
        });

        const res = await fastify.inject({
            method: 'POST',
            url: '/criar',
            payload: { livro_id: 10, usuario_id: 'usr-001' },
        });

        expect(res.statusCode).toBe(201);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: reservaMock });
        expect(mockController.criar).toHaveBeenCalledTimes(1);
    });

    // ── GET /  ───────────────────────────────────────────────────────────────
    test('GET / — deve retornar lista de reservas ativas (200)', async () => {
        mockController.listarAtivas.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/listar-ativas' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── GET /:id  ─────────────────────────────────────────────────────────────
    test('GET /:id — deve buscar reserva por id (200)', async () => {
        mockController.buscarPorId.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            return reply.code(200).send({ success: true, data: reservaMock });
        });

        const res = await fastify.inject({ method: 'GET', url: '/listar/1' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: reservaMock });
        expect(mockController.buscarPorId).toHaveBeenCalledTimes(1);
    });

    // ── PUT /:id  ─────────────────────────────────────────────────────────────
    test('PUT /:id — deve atualizar reserva totalmente (200)', async () => {
        const atualizada = { ...reservaMock, livro_id: 99 };
        mockController.atualizarTotal.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            expect(req.body).toEqual({ livro_id: 99 });
            return reply.code(200).send({ success: true, data: atualizada });
        });

        const res = await fastify.inject({
            method: 'PUT',
            url: '/atualizar/1',
            payload: { livro_id: 99 },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: atualizada });
    });

    // ── PATCH /:id/status  ────────────────────────────────────────────────────
    test('PATCH /:id/status — deve alterar status (200)', async () => {
        const alterada = { ...reservaMock, status: 2 };
        mockController.alterarStatus.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            expect(req.body).toEqual({ status_novo: 2, motivo: 'Cancelado pelo usuário' });
            return reply.code(200).send({ success: true, data: alterada });
        });

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/atualizar-status/1',
            payload: { status_novo: 2, motivo: 'Cancelado pelo usuário' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: alterada });
    });

    // ── DELETE /:id  ──────────────────────────────────────────────────────────
    test('DELETE /:id — deve deletar logicamente (204)', async () => {
        mockController.deletar.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            return reply.code(204).send();
        });

        const res = await fastify.inject({ method: 'DELETE', url: '/deletar/1' });

        expect(res.statusCode).toBe(204);
        expect(res.body).toBe('');
    });

    // ── GET /:id/historico  ───────────────────────────────────────────────────
    test('GET /:id/historico — deve retornar histórico da reserva (200)', async () => {
        mockController.buscarHistorico.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            return reply.code(200).send({ success: true, data: [historicoMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/historico/1' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [historicoMock] });
    });

    // ── GET /usuario/:usuario_id  ─────────────────────────────────────────────
    test('GET /usuario/:usuario_id — deve buscar reservas por usuário (200)', async () => {
        mockController.buscarPorUsuario.mockImplementationOnce((req, reply) => {
            expect(req.params.usuario_id).toBe('usr-001');
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/usuario/listar/usr-001' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── GET /livro/:livro_id/fila  ────────────────────────────────────────────
    test('GET /livro/:livro_id/fila — deve listar fila do livro (200)', async () => {
        mockController.listarFilaLivro.mockImplementationOnce((req, reply) => {
            expect(req.params.livro_id).toBe('10');
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/livro/listar-fila/10' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── PATCH /:id/renovar  ───────────────────────────────────────────────────
    test('PATCH /:id/renovar — deve renovar data limite (200)', async () => {
        const renovada = { ...reservaMock, reserva_data_limite_retirada: '2026-12-31' };
        mockController.renovar.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            expect(req.body).toEqual({ nova_data: '2026-12-31' });
            return reply.code(200).send({ success: true, data: renovada });
        });

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/atualizar-data/1',
            payload: { nova_data: '2026-12-31' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: renovada });
    });

    // ── GET /status/:status  ──────────────────────────────────────────────────
    test('GET /status/:status — deve buscar reservas por status (200)', async () => {
        mockController.buscarPorStatus.mockImplementationOnce((req, reply) => {
            expect(req.params.status).toBe('1');
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/status/listar/1' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── GET /vencidas/listar  ─────────────────────────────────────────────────
    test('GET /vencidas/listar — deve listar reservas vencidas (200)', async () => {
        mockController.listarVencidas.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/vencidas/listar' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── PATCH /lote/cancelar-vencidas  ────────────────────────────────────────
    test('PATCH /lote/cancelar-vencidas — deve cancelar vencidas em lote (200)', async () => {
        mockController.cancelarVencidasLote.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: { count: 3 } });
        });

        const res = await fastify.inject({ method: 'PATCH', url: '/lote/cancelar-vencidas' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { count: 3 } });
    });

    // ── DELETE /usuario/:usuario_id/limpar  ───────────────────────────────────
    test('DELETE /usuario/:usuario_id/limpar — deve limpar reservas do usuário (200)', async () => {
        mockController.limparPorUsuario.mockImplementationOnce((req, reply) => {
            expect(req.params.usuario_id).toBe('usr-001');
            return reply.code(200).send({ success: true, data: { count: 2 } });
        });

        const res = await fastify.inject({ method: 'DELETE', url: '/usuario/limpar/usr-001' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { count: 2 } });
    });

    // ── GET /recentes/feed  ───────────────────────────────────────────────────
    test('GET /recentes/feed — deve retornar feed de recentes (200)', async () => {
        mockController.feedRecentes.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: [reservaMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/recentes/feed' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── POST /validar-conflito  ───────────────────────────────────────────────
    test('POST /validar-conflito — deve validar conflito (200)', async () => {
        mockController.validarConflito.mockImplementationOnce((req, reply) => {
            expect(req.body).toEqual({ usuario_id: 'usr-001', livro_id: 10 });
            return reply.code(200).send({ success: true, data: { conflito: false, count: 0 } });
        });

        const res = await fastify.inject({
            method: 'POST',
            url: '/validar-conflito',
            payload: { usuario_id: 'usr-001', livro_id: 10 },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { conflito: false, count: 0 } });
    });

    // ── GET /metricas/pendentes  ──────────────────────────────────────────────
    test('GET /metricas/pendentes — deve contar pendentes (200)', async () => {
        mockController.contarPendentes.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: { total_pendentes: 7 } });
        });

        const res = await fastify.inject({ method: 'GET', url: '/metricas/pendentes' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { total_pendentes: 7 } });
    });

    // ── GET /livro/:livro_id/contagem  ────────────────────────────────────────
    test('GET /livro/:livro_id/contagem — deve contar fila do livro (200)', async () => {
        mockController.contarFilaLivro.mockImplementationOnce((req, reply) => {
            expect(req.params.livro_id).toBe('10');
            return reply.code(200).send({ success: true, data: { fila_tamanho: 4 } });
        });

        const res = await fastify.inject({ method: 'GET', url: '/livro/contagem/10' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { fila_tamanho: 4 } });
    });

    // ── PATCH /:id/notificar  ─────────────────────────────────────────────────
    test('PATCH /:id/notificar — deve registrar notificação (200)', async () => {
        mockController.registrarNotificacao.mockImplementationOnce((req, reply) => {
            expect(req.params.id).toBe('1');
            expect(req.body).toEqual({ motivo: 'Notificação de prazo' });
            return reply.code(200).send({ success: true, data: historicoMock });
        });

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/registrar-notificacao/1',
            payload: { motivo: 'Notificação de prazo' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: historicoMock });
    });

    // ── GET /historico/geral  ─────────────────────────────────────────────────
    test('GET /historico/geral — deve retornar feed do histórico geral (200)', async () => {
        mockController.feedHistoricoGeral.mockImplementationOnce((req, reply) => {
            return reply.code(200).send({ success: true, data: [historicoMock] });
        });

        const res = await fastify.inject({ method: 'GET', url: '/historico/geral' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [historicoMock] });
    });
});
