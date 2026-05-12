const ctrl = require('../controllers/reservas.controller');

async function reservaRoutes(fastify) {
    fastify.post('/', ctrl.criar);
    fastify.get('/', ctrl.listarAtivas);
    fastify.get('/:id', ctrl.buscarPorId);
    fastify.put('/:id', ctrl.atualizarTotal);
    fastify.patch('/:id/status', ctrl.alterarStatus);
    fastify.delete('/:id', ctrl.deletar);
    fastify.get('/:id/historico', ctrl.buscarHistorico);
    fastify.get('/usuario/:usuario_id', ctrl.buscarPorUsuario);
    fastify.get('/livro/:livro_id/fila', ctrl.listarFilaLivro);
    fastify.patch('/:id/renovar', ctrl.renovar);
    fastify.get('/status/:status', ctrl.buscarPorStatus);
    fastify.get('/vencidas/listar', ctrl.listarVencidas);
    fastify.patch('/lote/cancelar-vencidas', ctrl.cancelarVencidasLote);
    fastify.delete('/usuario/:usuario_id/limpar', ctrl.limparPorUsuario);
    fastify.get('/recentes/feed', ctrl.feedRecentes);
    fastify.post('/validar-conflito', ctrl.validarConflito);
    fastify.get('/metricas/pendentes', ctrl.contarPendentes);
    fastify.get('/livro/:livro_id/contagem', ctrl.contarFilaLivro);
    fastify.patch('/:id/notificar', ctrl.registrarNotificacao);
    fastify.get('/historico/geral', ctrl.feedHistoricoGeral);
}

module.exports = reservaRoutes;