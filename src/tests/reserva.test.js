const fastify = require('fastify')();
const reservaRoutes = require('../routes/reserva.routes');
const service = require('../services/reserva.service');

// Mock do service para não depender do banco real nos testes de rota
jest.mock('../services/reserva.service');

fastify.register(reservaRoutes);

describe('Reservas API', () => {
    afterAll(() => {
        fastify.close();
    });

    test('GET / deve retornar lista de reservas ativas', async () => {
        const mockData = [{ reserva_id: 1, usuario_id: 'user1', libro_id: 101 }];
        service.listarAtivas.mockResolvedValue(mockData);

        const response = await fastify.inject({
            method: 'GET',
            url: '/'
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ success: true, data: mockData });
    });

    test('POST / deve criar uma nova reserva', async () => {
        const mockReserva = { reserva_id: 2, usuario_id: 'user2', libro_id: 102 };
        service.criar.mockResolvedValue(mockReserva);

        const response = await fastify.inject({
            method: 'POST',
            url: '/',
            payload: { libro_id: 102, usuario_id: 'user2' }
        });

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toEqual({ success: true, data: mockReserva });
    });
});
