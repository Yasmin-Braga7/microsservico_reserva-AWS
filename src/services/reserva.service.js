const { NotFoundError, ValidationError } = require('../domain/errors');
const { ReservaStatus } = require('../domain/reserva.constants');

class ReservaService {
    constructor(reservaRepository, eventPublisher) {
        this.reservaRepository = reservaRepository;
        this.eventPublisher = eventPublisher;
    }

    async criar({ livro_id, usuario_id, data_limite }) {
        if (!livro_id || !usuario_id) {
            throw new ValidationError('Livro ID e Usuário ID são obrigatórios.');
        }

        const dataLimiteObj = data_limite ? new Date(data_limite) : null;

        const reserva = await this.reservaRepository.create({
            livro_id: Number(livro_id),
            usuario_id: String(usuario_id),
            reserva_data_limite_retirada: dataLimiteObj,
            status: ReservaStatus.ACTIVE
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
        if (!reserva) {
            throw new NotFoundError('Reserva não encontrada.');
        }
        return reserva;
    }

    async alterarStatus(id, { status_novo, motivo }) {
        if (!id || status_novo === undefined) {
            throw new ValidationError('ID da reserva e novo status são obrigatórios.');
        }

        const result = await this.reservaRepository.transaction(async (tx) => {
            const reservaAtual = await tx.reserva.findUnique({
                where: { reserva_id: Number(id) }
            });

            if (!reservaAtual) {
                throw new NotFoundError('Reserva não encontrada.');
            }

            const atualizada = await tx.reserva.update({
                where: { reserva_id: Number(id) },
                data: { status: Number(status_novo) }
            });

            await tx.reservaHistorico.create({
                data: {
                    reserva_id: Number(id),
                    reserva_historico_status_anterior: reservaAtual.status,
                    reserva_historico_status_novo: Number(status_novo),
                    motivo: motivo || 'Atualização de status'
                }
            });

            return atualizada;
        });

        if (Number(status_novo) === ReservaStatus.INACTIVE) {
            await this.eventPublisher.publish('RESERVA_CANCELADA', { reserva_id: Number(id) });
        }

        return result;
    }

    async deletarLogico(id) {
        return this.alterarStatus(id, {
            status_novo: ReservaStatus.INACTIVE,
            motivo: 'Exclusão Lógica'
        });
    }

    async atualizarTotal(id, data) {
        if (!id) throw new ValidationError('ID da reserva é obrigatório.');

        const updateData = {};
        if (data.livro_id !== undefined) updateData.livro_id = Number(data.livro_id);
        if (data.usuario_id !== undefined) updateData.usuario_id = String(data.usuario_id);
        if (data.data_limite !== undefined) {
            updateData.reserva_data_limite_retirada = data.data_limite ? new Date(data.data_limite) : null;
        }
        if (data.status !== undefined) updateData.status = Number(data.status);

        try {
            return await this.reservaRepository.update(Number(id), updateData);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('Reserva não encontrada.');
            }
            throw error;
        }
    }

    async buscarHistorico(id) {
        if (!id) throw new ValidationError('ID da reserva é obrigatório.');
        
        const reserva = await this.reservaRepository.findById(Number(id));
        if (!reserva) {
            throw new NotFoundError('Reserva não encontrada.');
        }

        return this.reservaRepository.findHistoryByReservaId(Number(id));
    }

    async buscarPorUsuario(usuario_id) {
        if (!usuario_id) throw new ValidationError('ID do usuário é obrigatório.');
        return this.reservaRepository.findManyByUsuarioId(String(usuario_id));
    }

    async listarFilaLivro(livro_id) {
        if (!livro_id) throw new ValidationError('ID do livro é obrigatório.');
        return this.reservaRepository.findManyByLivroIdAndStatus(Number(livro_id), ReservaStatus.ACTIVE);
    }

    async renovar(id, { nova_data }) {
        if (!id || !nova_data) {
            throw new ValidationError('ID da reserva e nova data são obrigatórios.');
        }

        try {
            return await this.reservaRepository.update(Number(id), {
                reserva_data_limite_retirada: new Date(nova_data)
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('Reserva não encontrada.');
            }
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
        return this.reservaRepository.updateManyVencidasToStatus(new Date(), ReservaStatus.INACTIVE);
    }

    async limparPorUsuario(usuario_id) {
        if (!usuario_id) throw new ValidationError('ID do usuário é obrigatório.');
        return this.reservaRepository.updateManyByUsuarioToStatus(String(usuario_id), ReservaStatus.INACTIVE);
    }

    async feedRecentes() {
        return this.reservaRepository.findManyRecentes(10);
    }

    async validarConflito({ usuario_id, livro_id }) {
        if (!usuario_id || !livro_id) {
            throw new ValidationError('ID do usuário e ID do livro são obrigatórios.');
        }
        const count = await this.reservaRepository.countByUsuarioAndLivro(String(usuario_id), Number(livro_id));
        return { conflito: count > 0, count };
    }

    async contarPendentes() {
        const count = await this.reservaRepository.countByStatus(ReservaStatus.ACTIVE);
        return { total_pendentes: count };
    }

    async contarFilaLivro(livro_id) {
        if (!livro_id) throw new ValidationError('ID do livro é obrigatório.');
        const count = await this.reservaRepository.countByLivroAndStatus(Number(livro_id), ReservaStatus.ACTIVE);
        return { fila_tamanho: count };
    }

    async registrarNotificacao(id, { motivo }) {
        if (!id || !motivo) {
            throw new ValidationError('ID da reserva e motivo são obrigatórios.');
        }

        return this.reservaRepository.transaction(async (tx) => {
            const reserva = await tx.reserva.findUnique({
                where: { reserva_id: Number(id) }
            });
            if (!reserva) {
                throw new NotFoundError('Reserva não encontrada.');
            }

            return tx.reservaHistorico.create({
                data: {
                    reserva_id: Number(id),
                    reserva_historico_status_anterior: reserva.status,
                    reserva_historico_status_novo: reserva.status,
                    motivo: motivo
                }
            });
        });
    }

    async feedHistoricoGeral() {
        return this.reservaRepository.findManyHistoryGeral(50);
    }
}

module.exports = ReservaService;