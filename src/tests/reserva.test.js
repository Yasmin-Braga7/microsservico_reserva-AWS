/**
 * src/tests/reserva.test.js
 *
 * Testes de todos os endpoints do microsserviço de reservas.
 * O Prisma e o RabbitMQ são mockados — nenhuma conexão real é necessária.
 */

// ─── Mocks (antes de qualquer require do módulo real) ─────────────────────────
jest.mock('../services/reserva.service');
jest.mock('../config/rabbitmq', () => ({
    connect: jest.fn().mockResolvedValue(true),
    publish: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    EVENTS: {
        RESERVA_CRIADA: 'RESERVA_CRIADA',
        RESERVA_CANCELADA: 'RESERVA_CANCELADA',
    },
}));

const fastify = require('fastify')();
const reservaRoutes = require('../routes/reserva.routes');
const service = require('../services/reserva.service');

fastify.register(reservaRoutes);

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
        service.criar.mockResolvedValue(reservaMock);

        const res = await fastify.inject({
            method: 'POST',
            url: '/',
            payload: { livro_id: 10, usuario_id: 'usr-001' },
        });

        expect(res.statusCode).toBe(201);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: reservaMock });
        expect(service.criar).toHaveBeenCalledTimes(1);
    });

    // ── GET /  ───────────────────────────────────────────────────────────────
    test('GET / — deve retornar lista de reservas ativas (200)', async () => {
        service.listarAtivas.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── GET /:id  ─────────────────────────────────────────────────────────────
    test('GET /:id — deve buscar reserva por id (200)', async () => {
        service.buscarPorId.mockResolvedValue(reservaMock);

        const res = await fastify.inject({ method: 'GET', url: '/1' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: reservaMock });
        expect(service.buscarPorId).toHaveBeenCalledWith('1');
    });

    // ── PUT /:id  ─────────────────────────────────────────────────────────────
    test('PUT /:id — deve atualizar reserva totalmente (200)', async () => {
        const atualizada = { ...reservaMock, livro_id: 99 };
        service.atualizarTotal.mockResolvedValue(atualizada);

        const res = await fastify.inject({
            method: 'PUT',
            url: '/1',
            payload: { livro_id: 99 },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: atualizada });
    });

    // ── PATCH /:id/status  ────────────────────────────────────────────────────
    test('PATCH /:id/status — deve alterar status (200)', async () => {
        const alterada = { ...reservaMock, status: 2 };
        service.alterarStatus.mockResolvedValue(alterada);

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/1/status',
            payload: { status_novo: 2, motivo: 'Cancelado pelo usuário' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: alterada });
    });

    // ── DELETE /:id  ──────────────────────────────────────────────────────────
    test('DELETE /:id — deve deletar logicamente (204)', async () => {
        service.deletarLogico.mockResolvedValue(undefined);

        const res = await fastify.inject({ method: 'DELETE', url: '/1' });

        expect(res.statusCode).toBe(204);
        expect(res.body).toBe('');
    });

    // ── GET /:id/historico  ───────────────────────────────────────────────────
    test('GET /:id/historico — deve retornar histórico da reserva (200)', async () => {
        service.buscarHistorico.mockResolvedValue([historicoMock]);

        const res = await fastify.inject({ method: 'GET', url: '/1/historico' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [historicoMock] });
    });

    // ── GET /usuario/:usuario_id  ─────────────────────────────────────────────
    test('GET /usuario/:usuario_id — deve buscar reservas por usuário (200)', async () => {
        service.buscarPorUsuario.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/usuario/usr-001' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
        expect(service.buscarPorUsuario).toHaveBeenCalledWith('usr-001');
    });

    // ── GET /livro/:livro_id/fila  ────────────────────────────────────────────
    test('GET /livro/:livro_id/fila — deve listar fila do livro (200)', async () => {
        service.listarFilaLivro.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/livro/10/fila' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── PATCH /:id/renovar  ───────────────────────────────────────────────────
    test('PATCH /:id/renovar — deve renovar data limite (200)', async () => {
        const renovada = { ...reservaMock, reserva_data_limite_retirada: '2026-12-31' };
        service.renovar.mockResolvedValue(renovada);

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/1/renovar',
            payload: { nova_data: '2026-12-31' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: renovada });
    });

    // ── GET /status/:status  ──────────────────────────────────────────────────
    test('GET /status/:status — deve buscar reservas por status (200)', async () => {
        service.buscarPorStatus.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/status/1' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
        expect(service.buscarPorStatus).toHaveBeenCalledWith('1');
    });

    // ── GET /vencidas/listar  ─────────────────────────────────────────────────
    test('GET /vencidas/listar — deve listar reservas vencidas (200)', async () => {
        service.listarVencidas.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/vencidas/listar' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── PATCH /lote/cancelar-vencidas  ────────────────────────────────────────
    test('PATCH /lote/cancelar-vencidas — deve cancelar vencidas em lote (200)', async () => {
        service.cancelarVencidasLote.mockResolvedValue({ count: 3 });

        const res = await fastify.inject({ method: 'PATCH', url: '/lote/cancelar-vencidas' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { count: 3 } });
    });

    // ── DELETE /usuario/:usuario_id/limpar  ───────────────────────────────────
    test('DELETE /usuario/:usuario_id/limpar — deve limpar reservas do usuário (200)', async () => {
        service.limparPorUsuario.mockResolvedValue({ count: 2 });

        const res = await fastify.inject({ method: 'DELETE', url: '/usuario/usr-001/limpar' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { count: 2 } });
    });

    // ── GET /recentes/feed  ───────────────────────────────────────────────────
    test('GET /recentes/feed — deve retornar feed de recentes (200)', async () => {
        service.feedRecentes.mockResolvedValue([reservaMock]);

        const res = await fastify.inject({ method: 'GET', url: '/recentes/feed' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [reservaMock] });
    });

    // ── POST /validar-conflito  ───────────────────────────────────────────────
    test('POST /validar-conflito — deve validar conflito (200)', async () => {
        service.validarConflito.mockResolvedValue({ conflito: false, count: 0 });

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
        service.contarPendentes.mockResolvedValue({ total_pendentes: 7 });

        const res = await fastify.inject({ method: 'GET', url: '/metricas/pendentes' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { total_pendentes: 7 } });
    });

    // ── GET /livro/:livro_id/contagem  ────────────────────────────────────────
    test('GET /livro/:livro_id/contagem — deve contar fila do livro (200)', async () => {
        service.contarFilaLivro.mockResolvedValue({ fila_tamanho: 4 });

        const res = await fastify.inject({ method: 'GET', url: '/livro/10/contagem' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: { fila_tamanho: 4 } });
    });

    // ── PATCH /:id/notificar  ─────────────────────────────────────────────────
    test('PATCH /:id/notificar — deve registrar notificação (200)', async () => {
        service.registrarNotificacao.mockResolvedValue(historicoMock);

        const res = await fastify.inject({
            method: 'PATCH',
            url: '/1/notificar',
            payload: { motivo: 'Notificação de prazo' },
        });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: historicoMock });
    });

    // ── GET /historico/geral  ─────────────────────────────────────────────────
    test('GET /historico/geral — deve retornar feed do histórico geral (200)', async () => {
        service.feedHistoricoGeral.mockResolvedValue([historicoMock]);

        const res = await fastify.inject({ method: 'GET', url: '/historico/geral' });

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ success: true, data: [historicoMock] });
    });
});
