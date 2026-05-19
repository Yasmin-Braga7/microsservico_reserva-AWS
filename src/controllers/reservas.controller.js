class ReservasController {
    constructor(reservaService) {
        this.reservaService = reservaService;
    }

    criar = async (req, reply) => {
        const data = await this.reservaService.criar(req.body);
        return reply.code(201).send({ success: true, data });
    }

    listarAtivas = async (req, reply) => {
        const data = await this.reservaService.listarAtivas();
        return reply.code(200).send({ success: true, data });
    }

    alterarStatus = async (req, reply) => {
        const data = await this.reservaService.alterarStatus(req.params.id, req.body);
        return reply.code(200).send({ success: true, data });
    }

    deletar = async (req, reply) => {
        await this.reservaService.deletarLogico(req.params.id);
        return reply.code(204).send();
    }

    buscarPorId = async (req, reply) => {
        const data = await this.reservaService.buscarPorId(req.params.id);
        return reply.code(200).send({ success: true, data });
    }

    atualizarTotal = async (req, reply) => {
        const data = await this.reservaService.atualizarTotal(req.params.id, req.body);
        return reply.code(200).send({ success: true, data });
    }

    buscarHistorico = async (req, reply) => {
        const data = await this.reservaService.buscarHistorico(req.params.id);
        return reply.code(200).send({ success: true, data });
    }

    buscarPorUsuario = async (req, reply) => {
        const data = await this.reservaService.buscarPorUsuario(req.params.usuario_id);
        return reply.code(200).send({ success: true, data });
    }

    listarFilaLivro = async (req, reply) => {
        const data = await this.reservaService.listarFilaLivro(req.params.livro_id);
        return reply.code(200).send({ success: true, data });
    }

    renovar = async (req, reply) => {
        const data = await this.reservaService.renovar(req.params.id, req.body);
        return reply.code(200).send({ success: true, data });
    }

    buscarPorStatus = async (req, reply) => {
        const data = await this.reservaService.buscarPorStatus(req.params.status);
        return reply.code(200).send({ success: true, data });
    }

    listarVencidas = async (req, reply) => {
        const data = await this.reservaService.listarVencidas();
        return reply.code(200).send({ success: true, data });
    }

    cancelarVencidasLote = async (req, reply) => {
        const data = await this.reservaService.cancelarVencidasLote();
        return reply.code(200).send({ success: true, data });
    }

    limparPorUsuario = async (req, reply) => {
        const data = await this.reservaService.limparPorUsuario(req.params.usuario_id);
        return reply.code(200).send({ success: true, data });
    }

    feedRecentes = async (req, reply) => {
        const data = await this.reservaService.feedRecentes();
        return reply.code(200).send({ success: true, data });
    }

    validarConflito = async (req, reply) => {
        const data = await this.reservaService.validarConflito(req.body);
        return reply.code(200).send({ success: true, data });
    }

    contarPendentes = async (req, reply) => {
        const data = await this.reservaService.contarPendentes();
        return reply.code(200).send({ success: true, data });
    }

    contarFilaLivro = async (req, reply) => {
        const data = await this.reservaService.contarFilaLivro(req.params.livro_id);
        return reply.code(200).send({ success: true, data });
    }

    registrarNotificacao = async (req, reply) => {
        const data = await this.reservaService.registrarNotificacao(req.params.id, req.body);
        return reply.code(200).send({ success: true, data });
    }

    feedHistoricoGeral = async (req, reply) => {
        const data = await this.reservaService.feedHistoricoGeral();
        return reply.code(200).send({ success: true, data });
    }
}

module.exports = ReservasController;