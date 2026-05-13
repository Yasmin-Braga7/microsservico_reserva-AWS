const fastify = require('fastify')({ logger: true });
const reservaRoutes = require('./routes/reserva.routes');

// Registrar rotas
fastify.register(reservaRoutes, { prefix: '/reservas' });

const start = async () => {
  try {
    const port = process.env.PORT || 9503;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
