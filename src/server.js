const { loadSecrets } = require('./config/secrets');

const start = async () => {
  try {
    // 1. Carregar segredos do Infisical se as credenciais estiverem disponíveis
    if (process.env.INFISICAL_CLIENT_ID && process.env.INFISICAL_CLIENT_SECRET) {
      await loadSecrets();
    }

    // 2. Importações de infraestrutura e dependências
    const prisma = require('./utils/prisma');
    const rabbitmq = require('./config/rabbitmq');
    
    // Conectar ao RabbitMQ de forma assíncrona
    rabbitmq.connect().catch(err => {
      console.error('[RabbitMQ] Erro na conexão inicial:', err.message);
    });

    // 3. Inicialização e injeção de dependências (SOLID - DIP)
    const ReservaRepository = require('./infrastructure/repositories/reserva.repository');
    const RabbitMQPublisher = require('./infrastructure/messaging/rabbitmq.publisher');
    const ReservaService = require('./services/reserva.service');
    const ReservasController = require('./controllers/reservas.controller');

    const reservaRepository = new ReservaRepository(prisma);
    const eventPublisher = new RabbitMQPublisher(rabbitmq);
    const reservaService = new ReservaService(reservaRepository, eventPublisher);
    const controller = new ReservasController(reservaService);

    // Inicialização do Consumidor RabbitMQ para eventos de Empréstimo
    const { initConsumer } = require('./infrastructure/messaging/rabbitmq.consumer');
    initConsumer(rabbitmq, reservaRepository).catch(err => {
      console.error('[ReservaConsumer] Falha ao iniciar consumer:', err.message);
    });

    // 4. Configuração do Servidor Web (Fastify)
    const fastify = require('fastify')({ logger: true });
    const cors = require('@fastify/cors');
    const reservaRoutes = require('./routes/reserva.routes');

    // Configuração do CORS
    await fastify.register(cors, {
      origin: '*'
    });

    // Registra o tratador global de erros (Clean Code - Error Handling)
    fastify.setErrorHandler((error, request, reply) => {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({
          success: false,
          error: error.name,
          message: error.message
        });
      }

      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'Ocorreu um erro interno no servidor.'
      });
    });

    // Registra as rotas injetando o controller como dependência
    fastify.register(reservaRoutes, { prefix: '/biblioteca/reserva', controller });

    // 5. Inicialização do servidor na porta definida
    const port = process.env.PORT || 9503;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    console.error('Falha crítica ao iniciar o servidor:', err);
    process.exit(1);
  }
};

start();
