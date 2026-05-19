async function reservaRoutes(fastify, options) {
    const { controller } = options;

    if (!controller) {
        throw new Error('[reservaRoutes] ReservasController instance must be provided in options.');
    }

    fastify.post('/', controller.criar);
    fastify.get('/', controller.listarAtivas);
    fastify.get('/:id', controller.buscarPorId);
    fastify.put('/:id', controller.atualizarTotal);
    fastify.patch('/:id/status', controller.alterarStatus);
    fastify.delete('/:id', controller.deletar);
    fastify.get('/:id/historico', controller.buscarHistorico);
    fastify.get('/usuario/:usuario_id', controller.buscarPorUsuario);
    fastify.get('/livro/:livro_id/fila', controller.listarFilaLivro);
    fastify.patch('/:id/renovar', controller.renovar);
    fastify.get('/status/:status', controller.buscarPorStatus);
    fastify.get('/vencidas/listar', controller.listarVencidas);
    fastify.patch('/lote/cancelar-vencidas', controller.cancelarVencidasLote);
    fastify.delete('/usuario/:usuario_id/limpar', controller.limparPorUsuario);
    fastify.get('/recentes/feed', controller.feedRecentes);
    fastify.post('/validar-conflito', controller.validarConflito);
    fastify.get('/metricas/pendentes', controller.contarPendentes);
    fastify.get('/livro/:livro_id/contagem', controller.contarFilaLivro);
    fastify.patch('/:id/notificar', controller.registrarNotificacao);
    fastify.get('/historico/geral', controller.feedHistoricoGeral);
}

module.exports = reservaRoutes;