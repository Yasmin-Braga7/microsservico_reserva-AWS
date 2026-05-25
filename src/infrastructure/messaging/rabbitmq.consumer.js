/**
 * src/infrastructure/messaging/rabbitmq.consumer.js
 *
 * Consumidor RabbitMQ do microsserviço de Reserva.
 *
 * Eventos ouvidos (publicados pelo microsserviço de Empréstimo):
 *
 *   biblioteca.emprestimo.criado
 *     → Cancela a reserva ativa do usuário para o livro emprestado (caso já
 *       não tenha sido cancelada via HTTP direto pelo serviço de Empréstimo).
 *
 *   biblioteca.devolucao.registrada
 *     → Notifica (registra histórico) na reserva mais antiga da fila do livro
 *       que o exemplar está disponível para retirada.
 */

const { ReservaStatus } = require('../../domain/reserva.constants');

const EXCHANGE      = 'biblioteca';
const EXCHANGE_TYPE = 'topic';
const QUEUE_NAME    = 'reserva.events.emprestimo';

// Routing keys que este serviço consome
const BINDING_KEYS = [
  'biblioteca.emprestimo.criado',
  'biblioteca.devolucao.registrada',
];

/**
 * Inicializa o consumer.
 *
 * @param {object} rabbitmqClient  - objeto com .connect() e a conexão amqplib
 * @param {object} reservaRepository - instância do ReservaRepository
 */
async function initConsumer(rabbitmqClient, reservaRepository) {
  // Garantir conexão
  const connected = await rabbitmqClient.connect();
  if (!connected) {
    console.warn('[ReservaConsumer] RabbitMQ não disponível. Consumer não iniciado. Tentando novamente em 10s...');
    setTimeout(() => initConsumer(rabbitmqClient, reservaRepository), 10_000);
    return;
  }

  // Acessa o channel interno do rabbitmqClient
  // O rabbitmq.js exporta publish/connect/close, mas não expõe o channel diretamente.
  // Precisamos criar um channel dedicado para consumo.
  const amqplib = require('amqplib');
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@10.136.38.50:5672';

  let consumerConnection;
  let consumerChannel;

  try {
    consumerConnection = await amqplib.connect(RABBITMQ_URL);
    consumerChannel    = await consumerConnection.createChannel();

    await consumerChannel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true, autoDelete: false });
    const { queue } = await consumerChannel.assertQueue(QUEUE_NAME, { durable: true });

    for (const key of BINDING_KEYS) {
      await consumerChannel.bindQueue(queue, EXCHANGE, key);
    }

    consumerChannel.prefetch(1);

    console.log(`[ReservaConsumer] Aguardando mensagens na fila "${QUEUE_NAME}"...`);

    consumerChannel.consume(queue, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      let payload;

      try {
        payload = JSON.parse(msg.content.toString());
      } catch {
        console.error('[ReservaConsumer] Mensagem com JSON inválido. Descartando.');
        consumerChannel.nack(msg, false, false);
        return;
      }

      try {
        if (routingKey === 'biblioteca.emprestimo.criado') {
          await handleEmprestimoCriado(payload, reservaRepository);
        } else if (routingKey === 'biblioteca.devolucao.registrada') {
          await handleDevolucaoRegistrada(payload, reservaRepository);
        }

        consumerChannel.ack(msg);
      } catch (err) {
        console.error(`[ReservaConsumer] Erro ao processar evento "${routingKey}":`, err.message);
        // requeue: false — evita loop infinito em mensagens inválidas
        consumerChannel.nack(msg, false, false);
      }
    });

    consumerConnection.on('close', () => {
      console.warn('[ReservaConsumer] Conexão perdida. Reiniciando consumer em 10s...');
      setTimeout(() => initConsumer(rabbitmqClient, reservaRepository), 10_000);
    });

    consumerConnection.on('error', (err) => {
      console.error('[ReservaConsumer] Erro na conexão do consumer:', err.message);
    });

  } catch (err) {
    console.error('[ReservaConsumer] Falha ao iniciar consumer:', err.message, '— Tentando em 10s...');
    setTimeout(() => initConsumer(rabbitmqClient, reservaRepository), 10_000);
  }
}

/**
 * Trata o evento biblioteca.emprestimo.criado
 *
 * Payload esperado:
 *   { emprestimoId, usuarioId, livroId, exemplarId, dataPrazo, timestamp }
 *
 * Ação: cancela a reserva ativa do usuário para o livro (idempotente — já
 *       pode ter sido cancelada via HTTP pelo serviço de Empréstimo).
 */
async function handleEmprestimoCriado(payload, reservaRepository) {
  const { usuarioId, livroId, emprestimoId } = payload;

  if (!usuarioId || !livroId) {
    console.warn('[ReservaConsumer] emprestimo.criado: usuarioId ou livroId ausente. Ignorando.');
    return;
  }

  // Busca reservas ativas do usuário para este livro
  const reservas = await reservaRepository.prisma.reserva.findMany({
    where: {
      usuario_id: String(usuarioId),
      livro_id:   Number(livroId),
      status:     ReservaStatus.ACTIVE,
    },
  });

  if (reservas.length === 0) {
    console.log(`[ReservaConsumer] emprestimo.criado: nenhuma reserva ativa para usuário ${usuarioId} / livro ${livroId}. Nada a fazer.`);
    return;
  }

  for (const res of reservas) {
    // Cancela a reserva e registra no histórico
    await reservaRepository.transaction(async (tx) => {
      await tx.reserva.update({
        where: { reserva_id: res.reserva_id },
        data:  { status: ReservaStatus.INACTIVE },
      });

      await tx.reservaHistorico.create({
        data: {
          reserva_id:                        res.reserva_id,
          reserva_historico_status_anterior: ReservaStatus.ACTIVE,
          reserva_historico_status_novo:     ReservaStatus.INACTIVE,
          motivo: `Empréstimo ${emprestimoId} realizado — reserva cancelada automaticamente via evento RabbitMQ.`,
        },
      });
    });

    console.log(`[ReservaConsumer] Reserva ${res.reserva_id} cancelada (usuário ${usuarioId} / livro ${livroId} / empréstimo ${emprestimoId}).`);
  }
}

/**
 * Trata o evento biblioteca.devolucao.registrada
 *
 * Payload esperado:
 *   { devolucaoId, emprestimoId, usuarioId, exemplarId, diasAtraso, possuiMulta, multaId, valorMulta, timestamp }
 *
 * Ação: encontra o livro via exemplarId (não disponível diretamente no payload),
 *       porém o publisher inclui livroId quando disponível.
 *       Notifica o próximo da fila do livro registrando um histórico.
 */
async function handleDevolucaoRegistrada(payload, reservaRepository) {
  const { livroId, exemplarId, emprestimoId } = payload;

  // livroId pode não estar no payload do empréstimo original.
  // Se não vier, não há como notificar a fila sem consultar o catálogo.
  if (!livroId) {
    console.log(`[ReservaConsumer] devolucao.registrada: livroId ausente no payload (emprestimoId=${emprestimoId}). Pulando notificação de fila.`);
    return;
  }

  // Busca a reserva mais antiga ativa para este livro
  const fila = await reservaRepository.prisma.reserva.findMany({
    where:   { livro_id: Number(livroId), status: ReservaStatus.ACTIVE },
    orderBy: { reserva_data_criacao: 'asc' },
    take:    1,
  });

  if (fila.length === 0) {
    console.log(`[ReservaConsumer] devolucao.registrada: nenhuma reserva ativa na fila para o livro ${livroId}.`);
    return;
  }

  const proxima = fila[0];

  // Registra notificação no histórico da reserva
  await reservaRepository.transaction(async (tx) => {
    await tx.reservaHistorico.create({
      data: {
        reserva_id:                        proxima.reserva_id,
        reserva_historico_status_anterior: proxima.status,
        reserva_historico_status_novo:     proxima.status, // status não muda, apenas notifica
        motivo: `Exemplar ${exemplarId ?? 'N/A'} devolvido (empréstimo ${emprestimoId}). Livro disponível para retirada.`,
      },
    });
  });

  console.log(`[ReservaConsumer] Próximo da fila notificado: reserva ${proxima.reserva_id} (usuário ${proxima.usuario_id} / livro ${livroId}).`);
}

module.exports = { initConsumer };
