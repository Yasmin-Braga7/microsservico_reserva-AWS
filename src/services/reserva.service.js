const { NotFoundError, ValidationError } = require('../domain/errors');

class ReservaService {
    constructor(reservaRepository, eventPublisher) {
        this.reservaRepository = reservaRepository;
        this.eventPublisher = eventPublisher;
    }

    async criar({ livro_id, usuario_id }) {
        if (!livro_id || !usuario_id) {
            throw new ValidationError('Livro ID e Usuário ID são obrigatórios.');
        }

        const reserva = await this.reservaRepository.create({
            livro_id: Number(livro_id),
            usuario_id: Number(usuario_id),
            reserva_data_reserva: new Date(),
            reserva_posicao_fila: 0,
            reserva_status: 1
        });

        await this.eventPublisher.publish('RESERVA_CRIADA', reserva);
        return reserva;
    }

    async listarAtivas() {
        return this.reservaRepository.findManyActive();
    }

    async buscarPorId(id) {
        if (!id) throw new ValidationError('ID da reserva é obrigatório.');
        const reserva = await this.reservaRepository.findById(Number(id));
        if (!reserva) throw new NotFoundError('Reserva não encontrada.');
        return reserva;
    }

    async alterarStatus(id, { reserva_status, motivo }) {
        if (!id || reserva_status === undefined) {
            throw new ValidationError('ID da reserva e novo status são obrigatórios.');
        }

        const result = await this.reservaRepository.transaction(async (tx) => {
            const reservaAtual = await tx.reserva.findUnique({
                where: { reserva_id: Number(id) }
            });
            if (!reservaAtual) throw new NotFoundError('Reserva não encontrada.');

            const atualizada = await tx.reserva.update({
                where: { reserva_id: Number(id) },
                data: { reserva_status: Number(reserva_status) }
            });

            await tx.reservaHistorico.create({
                data: {
                    reserva_id: Number(id),
                    reserva_historico_data: new Date(),
                    reserva_historico_status: Number(reserva_status),
                    motivo: motivo || 'Atualização de status'
                }
            });

            return atualizada;
        });

        if (Number(reserva_status) === 0) {
            await this.eventPublisher.publish('RESERVA_CANCELADA', { reserva_id: Number(id) });
        }

        return result;
    }

    async deletarLogico(id) {
        return this.alterarStatus(id, { reserva_status: 0, motivo: 'Exclusão Lógica' });
    }

    async atualizarTotal(id, data) {
        if (!id) throw new ValidationError('ID da reserva é obrigatório.');
        const updateData = {};
        if (data.livro_id !== undefined) updateData.livro_id = Number(data.livro_id);
        if (data.usuario_id !== undefined) updateData.usuario_id = Number(data.usuario_id);
        if (data.reserva_status !== undefined) updateData.reserva_status = Number(data.reserva_status);
        try {
            return await this.reservaRepository.update(Number(id), updateData);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundError('Reserva não encontrada.');
            throw error;
        }
    }

    async buscarHistorico(id) {
        if (!id) throw new ValidationError('ID da reserva é obrigatório.');
        const reserva = await this.reservaRepository.findById(Number(id));
        if (!reserva) throw new NotFoundError('Reserva não encontrada.');
        return this.reservaRepository.findHistoryByReservaId(Number(id));
    }

    async buscarPorUsuario(usuario_id) {
        if (!usuario_id) throw new ValidationError('ID do usuário é obrigatório.');
        return this.reservaRepository.findManyByUsuarioId(Number(usuario_id));
    }

    async listarFilaLivro(livro_id) {
        if (!livro_id) throw new ValidationError('ID do livro é obrigatório.');
        return this.reservaRepository.findManyByLivroIdAndStatus(Number(livro_id), 1);
    }

    async renovar(id, { nova_data }) {
        if (!id || !nova_data) throw new ValidationError('ID da reserva e nova data são obrigatórios.');
        try {
            return await this.reservaRepository.update(Number(id), {
                reserva_data_reserva: new Date(nova_data)
            });
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundError('Reserva não encontrada.');
            throw error;
        }
    }

    async buscarPorStatus(status) {
        if (status === undefined) throw new ValidationError('Status é obrigatório.');
        return this.reservaRepository.findManyByStatus(Number(status));
    }

    async listarVencidas() {
        return this.reservaRepository.findManyVencidas(new Date());
    }

    async cancelarVencidasLote() {
        return this.reservaRepository.updateManyVencidasToStatus(new Date(), 0);
    }

    async limparPorUsuario(usuario_id) {
        if (!usuario_id) throw new ValidationError('ID do usuário é obrigatório.');
        return this.reservaRepository.updateManyByUsuarioToStatus(Number(usuario_id), 0);
    }

    async feedRecentes() {
        return this.reservaRepository.findManyRecentes(10);
    }

    async validarConflito({ usuario_id, livro_id }) {
        if (!usuario_id || !livro_id) throw new ValidationError('ID do usuário e ID do livro são obrigatórios.');
        const count = await this.reservaRepository.countByUsuarioAndLivro(Number(usuario_id), Number(livro_id));
        return { conflito: count > 0, count };
    }

    async contarPendentes() {
        const count = await this.reservaRepository.countByStatus(1);
        return { total_pendentes: count };
    }

    async contarFilaLivro(livro_id) {
        if (!livro_id) throw new ValidationError('ID do livro é obrigatório.');
        const count = await this.reservaRepository.countByLivroAndStatus(Number(livro_id), 1);
        return { fila_tamanho: count };
    }

    async registrarNotificacao(id, { motivo }) {
        if (!id || !motivo) throw new ValidationError('ID da reserva e motivo são obrigatórios.');
        return this.reservaRepository.transaction(async (tx) => {
            const reserva = await tx.reserva.findUnique({ where: { reserva_id: Number(id) } });
            if (!reserva) throw new NotFoundError('Reserva não encontrada.');
            return tx.reservaHistorico.create({
                data: {
                    reserva_id: Number(id),
                    reserva_historico_data: new Date(),
                    reserva_historico_status: reserva.reserva_status,
                    motivo
                }
            });
        });
    }

    async feedHistoricoGeral() {
        return this.reservaRepository.findManyHistoryGeral(50);
    }
}

module.exports = ReservaService;