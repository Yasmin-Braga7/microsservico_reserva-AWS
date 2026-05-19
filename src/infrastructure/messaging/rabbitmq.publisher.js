class RabbitMQPublisher {
    constructor(rabbitmqClient) {
        this.rabbitmqClient = rabbitmqClient;
    }

    async publish(routingKey, payload) {
        if (!this.rabbitmqClient || typeof this.rabbitmqClient.publish !== 'function') {
            console.warn('[RabbitMQPublisher] Publisher not fully initialized. Skipping message.');
            return false;
        }
        return this.rabbitmqClient.publish(routingKey, payload);
    }
}

module.exports = RabbitMQPublisher;
