const service = require('../services/reserva.service');

async function criar(req, reply) {
    const data = await service.criar(req.body);
    return reply.code(201).send({ success: true, data });
}

async function listarAtivas(req, reply) {
    const data = await service.listarAtivas();
    return reply.code(200).send({ success: true, data });
}

async function alterarStatus(req, reply) {
    const data = await service.alterarStatus(req.params.id, req.body);
    return reply.code(200).send({ success: true, data });
}

async function deletar(req, reply) {
    await service.deletarLogico(req.params.id);
    return reply.code(204).send();
}

async function buscarPorId(req, reply) {
    const data = await service.buscarPorId(req.params.id);
    return reply.code(200).send({ success: true, data });
}

async function atualizarTotal(req, reply) {
    const data = await service.atualizarTotal(req.params.id, req.body);
    return reply.code(200).send({ success: true, data });
}

async function buscarHistorico(req, reply) {
    const data = await service.buscarHistorico(req.params.id);
    return reply.code(200).send({ success: true, data });
}

async function buscarPorUsuario(req, reply) {
    const data = await service.buscarPorUsuario(req.params.usuario_id);
    return reply.code(200).send({ success: true, data });
}

async function listarFilaLivro(req, reply) {
    const data = await service.listarFilaLivro(req.params.livro_id);
    return reply.code(200).send({ success: true, data });
}

async function renovar(req, reply) {
    const data = await service.renovar(req.params.id, req.body);
    return reply.code(200).send({ success: true, data });
}

async function buscarPorStatus(req, reply) {
    const data = await service.buscarPorStatus(req.params.status);
    return reply.code(200).send({ success: true, data });
}

async function listarVencidas(req, reply) {
    const data = await service.listarVencidas();
    return reply.code(200).send({ success: true, data });
}

async function cancelarVencidasLote(req, reply) {
    const data = await service.cancelarVencidasLote();
    return reply.code(200).send({ success: true, data });
}

async function limparPorUsuario(req, reply) {
    const data = await service.limparPorUsuario(req.params.usuario_id);
    return reply.code(200).send({ success: true, data });
}

async function feedRecentes(req, reply) {
    const data = await service.feedRecentes();
    return reply.code(200).send({ success: true, data });
}

async function validarConflito(req, reply) {
    const data = await service.validarConflito(req.body);
    return reply.code(200).send({ success: true, data });
}

async function contarPendentes(req, reply) {
    const data = await service.contarPendentes();
    return reply.code(200).send({ success: true, data });
}

async function contarFilaLivro(req, reply) {
    const data = await service.contarFilaLivro(req.params.livro_id);
    return reply.code(200).send({ success: true, data });
}

async function registrarNotificacao(req, reply) {
    const data = await service.registrarNotificacao(req.params.id, req.body);
    return reply.code(200).send({ success: true, data });
}

async function feedHistoricoGeral(req, reply) {
    const data = await service.feedHistoricoGeral();
    return reply.code(200).send({ success: true, data });
}

module.exports = {
    criar, listarAtivas, alterarStatus, deletar,
    buscarPorId, atualizarTotal, buscarHistorico, buscarPorUsuario,
    listarFilaLivro, renovar, buscarPorStatus, listarVencidas,
    cancelarVencidasLote, limparPorUsuario, feedRecentes, validarConflito,
    contarPendentes, contarFilaLivro, registrarNotificacao, feedHistoricoGeral
};