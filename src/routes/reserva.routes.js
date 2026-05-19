async function reservaRoutes(fastify, options) {
    const { controller } = options;

    if (!controller) {
        throw new Error('[reservaRoutes] ReservasController instance must be provided in options.');
    }

    fastify.post('/criar', controller.criar);
    fastify.get('/listar-ativas', controller.listarAtivas);
    fastify.get('/listar/:id', controller.buscarPorId);
    fastify.put('/atualizar/:id', controller.atualizarTotal);
    fastify.patch('/atualizar-status/:id', controller.alterarStatus);
    fastify.delete('/deletar/:id', controller.deletar);
    fastify.get('/historico/:id', controller.buscarHistorico);
    fastify.get('/usuario/listar/:usuario_id', controller.buscarPorUsuario);
    fastify.get('/livro/listar-fila/:livro_id', controller.listarFilaLivro);
    fastify.patch('/atualizar-data/:id', controller.renovar);
    fastify.get('/status/listar/:status', controller.buscarPorStatus);
    fastify.get('/vencidas/listar', controller.listarVencidas);
    fastify.patch('/lote/cancelar-vencidas', controller.cancelarVencidasLote);
    fastify.delete('/usuario/limpar/:usuario_id', controller.limparPorUsuario);
    fastify.get('/recentes/feed', controller.feedRecentes);
    fastify.post('/validar-conflito', controller.validarConflito);
    fastify.get('/metricas/pendentes', controller.contarPendentes);
    fastify.get('/livro/contagem/:livro_id', controller.contarFilaLivro);
    fastify.patch('/registrar-notificacao/:id', controller.registrarNotificacao);
    fastify.get('/historico/geral', controller.feedHistoricoGeral);
}

module.exports = reservaRoutes;