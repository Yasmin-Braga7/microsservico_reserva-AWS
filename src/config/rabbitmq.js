/**
 * src/config/rabbitmq.js
 *
 * Gerencia a conexão persistente com o RabbitMQ.
 * Reconecta automaticamente em caso de queda.
 *
 * Uso:
 *   const { publish } = require('../config/rabbitmq');
 *   await publish('biblioteca.relatorio.criado', { relatorioId: 1 });
 */

const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@10.136.38.50:5672';
const EXCHANGE = 'biblioteca';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel = null;
let connected = false;
const delayReconnect = 6000;
const queueEvents = 'biblioteca.events';

/**
 * Tenta reconectar ao RabbitMQ
 */
async function connect() {
    if (connected) return true;

    try {
        console.log('[RabbitMQ] Connecting...');
        connection = await amqplib.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, {
            durable: true,
            autoDelete: false
        });

        console.log('[RabbitMQ] Connected successfully');
        connected = true;
        return true;
    } catch (error) {
        console.error('[RabbitMQ] Failed to connect:', error.message);
        connected = false;
        return false;
    }
}

/**
 * Reconecta automaticamente ao RabbitMQ em caso de queda
 */
async function autoReconnect(fn) {
    if (!connected) {
        if (!(await connect())) {
            setTimeout(() => autoReconnect(fn), delayReconnect);
            return; // tenta novamente em alguns segundos
        }
    }
    // executa a função (publish, init consumers, etc.)
    return fn();
}

/**
 * Publica mensagem no RabbitMQ com retry automático
 */
async function publish(routingKey, payload) {
    return autoReconnect(async () => {
        const message = Buffer.from(JSON.stringify(payload), 'utf-8');
        await channel.publish(EXCHANGE, routingKey, message, {
            deliveryMode: 2,          // persistente
            persistent: true,
            contentType: 'application/json',
            timestamp: Math.floor(Date.now() / 1000),
            appId: 'biblioteca-reserva',
        });
        console.log('[RabbitMQ] Publicado:', routingKey, payload);
        return true;
    });
}

/**
 * Encerra a conexão com o RabbitMQ
 */
async function close() {
    try {
        await channel.close();
        await connection.close();
        console.log('[RabbitMQ] Connection closed');
        connected = false;
    } catch (_) { }
}

// ─── Chaves de roteamento dos eventos deste microsserviço ────────────────────
const EVENTS = {
    RESERVA_CRIADA: 'RESERVA_CRIADA',
    RESERVA_CANCELADA: 'RESERVA_CANCELADA',
    SNAPSHOT_LIVRO_GERADO: 'biblioteca.relatorio.snapshot_livro.gerado',
    SNAPSHOT_USUARIO_GERADO: 'biblioteca.relatorio.snapshot_usuario.gerado',
    SNAPSHOT_EMPRESTIMO_GERADO: 'biblioteca.relatorio.snapshot_emprestimo.gerado',
};

module.exports = { connect, publish, close, EVENTS };
