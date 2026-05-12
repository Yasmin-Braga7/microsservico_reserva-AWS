// Placeholder for RabbitMQ configuration
const EVENTS = {
    RESERVA_CRIADA: 'RESERVA_CRIADA',
    RESERVA_CANCELADA: 'RESERVA_CANCELADA',
    // Adicione outros eventos conforme necessário
};

async function publish(event, data) {
    console.log(`[RabbitMQ] Publishing event ${event}:`, data);
    // Aqui viria a lógica real do amqplib
}

module.exports = { publish, EVENTS };
