class ReservaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async create(data) {
        return this.prisma.reserva.create({ data });
    }

    async findManyActive() {
        return this.prisma.reserva.findMany({
            where: { status: { not: 0 } },
            orderBy: { reserva_data_criacao: 'desc' }
        });
    }

    async findById(reserva_id) {
        return this.prisma.reserva.findFirst({
            where: { reserva_id, status: { not: 0 } }
        });
    }

    async update(reserva_id, data) {
        return this.prisma.reserva.update({
            where: { reserva_id },
            data
        });
    }

    async createHistory(data) {
        return this.prisma.reservaHistorico.create({ data });
    }

    async findHistoryByReservaId(reserva_id) {
        return this.prisma.reservaHistorico.findMany({
            where: { reserva_id },
            orderBy: { reserva_historico_data_alteracao: 'desc' }
        });
    }

    async findManyByUsuarioId(usuario_id) {
        return this.prisma.reserva.findMany({
            where: { usuario_id, status: { not: 0 } }
        });
    }

    async findManyByLivroIdAndStatus(livro_id, status) {
        return this.prisma.reserva.findMany({
            where: { livro_id, status },
            orderBy: { reserva_data_criacao: 'asc' }
        });
    }

    async findManyByStatus(status) {
        return this.prisma.reserva.findMany({
            where: { status }
        });
    }

    async findManyVencidas(now) {
        return this.prisma.reserva.findMany({
            where: { reserva_data_limite_retirada: { lt: now }, status: 1 }
        });
    }

    async updateManyVencidasToStatus(now, status) {
        return this.prisma.reserva.updateMany({
            where: { reserva_data_limite_retirada: { lt: now }, status: 1 },
            data: { status }
        });
    }

    async updateManyByUsuarioToStatus(usuario_id, status) {
        return this.prisma.reserva.updateMany({
            where: { usuario_id, status: { not: 0 } },
            data: { status }
        });
    }

    async findManyRecentes(limit) {
        return this.prisma.reserva.findMany({
            where: { status: { not: 0 } },
            orderBy: { reserva_data_criacao: 'desc' },
            take: limit
        });
    }

    async countByUsuarioAndLivro(usuario_id, livro_id) {
        return this.prisma.reserva.count({
            where: { usuario_id, livro_id, status: { not: 0 } }
        });
    }

    async countByStatus(status) {
        return this.prisma.reserva.count({
            where: { status }
        });
    }

    async countByLivroAndStatus(livro_id, status) {
        return this.prisma.reserva.count({
            where: { livro_id, status: { not: 0 } }
        });
    }

    async findManyHistoryGeral(limit) {
        return this.prisma.reservaHistorico.findMany({
            orderBy: { reserva_historico_data_alteracao: 'desc' },
            take: limit
        });
    }

    async transaction(callback) {
        return this.prisma.$transaction(callback);
    }
}

module.exports = ReservaRepository;
