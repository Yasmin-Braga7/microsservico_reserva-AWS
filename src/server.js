const { loadSecrets } = require('./config/secrets');

const start = async () => {
  try {
    // Carregar segredos do Infisical se as credenciais estiverem disponíveis
    if (process.env.INFISICAL_CLIENT_ID && process.env.INFISICAL_CLIENT_SECRET) {
      await loadSecrets();
    }

    const fastify = require('fastify')({ logger: true });
    const reservaRoutes = require('./routes/reserva.routes');

    fastify.register(reservaRoutes, { prefix: '/biblioteca/reserva' });

    const port = process.env.PORT;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
};

start();
