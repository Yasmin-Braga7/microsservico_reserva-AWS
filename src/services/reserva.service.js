const prisma = require('../utils/prisma');
const { publish, EVENTS } = require('../config/rabbitmq');

async function criar({ livro_id, usuario_id, data_limite }) {
    // O status '1' representa ATIVA
    const reserva = await prisma.reserva.create({
        data: {
            livro_id: Number(livro_id),
            usuario_id: String(usuario_id),
            reserva_data_limite_retirada: data_limite ? new Date(data_limite) : null,
            status: 1
        }
    });
    return reserva;
}

async function listarAtivas() {
    // Ignorando excluídas logicamente, onde o status=0
    return prisma.reserva.findMany({
        where: { status: { not: 0 } },
        orderBy: { reserva_data_criacao: 'desc' }
    });
}

async function alterarStatus(reserva_id, { status_novo, motivo }) {
    // Transação para garantir que o histórico é sempre gravado com a alteração
    return prisma.$transaction(async (tx) => {
        const reservaAtual = await tx.reserva.findUnique({
            where: { reserva_id: Number(reserva_id) }
        });

        if (!reservaAtual) throw new Error('Reserva não encontrada.');

        // Altera o status da reserva
        const atualizada = await tx.reserva.update({
            where: { reserva_id: Number(reserva_id) },
            data: { status: Number(status_novo) }
        });

        // Grava o registo no histórico
        await tx.reservaHistorico.create({
            data: {
                reserva_id: Number(reserva_id),
                reserva_historico_status_anterior: reservaAtual.status,
                reserva_historico_status_novo: Number(status_novo),
                motivo: motivo || 'Atualização de status'
            }
        });

        return atualizada;
    });
}

async function deletarLogico(reserva_id) {
    return alterarStatus(reserva_id, { status_novo: 0, motivo: 'Exclusão Lógica' });
}

async function buscarPorId(reserva_id) {
    return prisma.reserva.findFirst({ where: { reserva_id: Number(reserva_id), status: { not: 0 } } });
}

async function atualizarTotal(reserva_id, data) {
    return prisma.reserva.update({
        where: { reserva_id: Number(reserva_id) },
        data: {
            livro_id: data.livro_id ? Number(data.livro_id) : undefined,
            usuario_id: data.usuario_id ? String(data.usuario_id) : undefined,
            reserva_data_limite_retirada: data.data_limite ? new Date(data.data_limite) : undefined,
            status: data.status ? Number(data.status) : undefined
        }
    });
}

async function buscarHistorico(reserva_id) {
    return prisma.reservaHistorico.findMany({
        where: { reserva_id: Number(reserva_id) },
        orderBy: { reserva_historico_data_alteracao: 'desc' }
    });
}

async function buscarPorUsuario(usuario_id) {
    return prisma.reserva.findMany({
        where: { usuario_id: String(usuario_id), status: { not: 0 } }
    });
}

async function listarFilaLivro(livro_id) {
    return prisma.reserva.findMany({
        where: { livro_id: Number(livro_id), status: 1 },
        orderBy: { reserva_data_criacao: 'asc' }
    });
}

async function renovar(reserva_id, { nova_data }) {
    return prisma.reserva.update({
        where: { reserva_id: Number(reserva_id) },
        data: { reserva_data_limite_retirada: new Date(nova_data) }
    });
}

async function buscarPorStatus(status) {
    return prisma.reserva.findMany({ where: { status: Number(status) } });
}

async function listarVencidas() {
    return prisma.reserva.findMany({
        where: { reserva_data_limite_retirada: { lt: new Date() }, status: 1 }
    });
}

async function cancelarVencidasLote() {
    return prisma.reserva.updateMany({
        where: { reserva_data_limite_retirada: { lt: new Date() }, status: 1 },
        data: { status: 0 }
    });
}

async function limparPorUsuario(usuario_id) {
    return prisma.reserva.updateMany({
        where: { usuario_id: String(usuario_id), status: { not: 0 } },
        data: { status: 0 }
    });
}

async function feedRecentes() {
    return prisma.reserva.findMany({
        where: { status: { not: 0 } },
        orderBy: { reserva_data_criacao: 'desc' },
        take: 10
    });
}

async function validarConflito({ usuario_id, livro_id }) {
    const count = await prisma.reserva.count({
        where: { usuario_id: String(usuario_id), livro_id: Number(livro_id), status: { not: 0 } }
    });
    return { conflito: count > 0, count };
}

async function contarPendentes() {
    const count = await prisma.reserva.count({ where: { status: 1 } });
    return { total_pendentes: count };
}

async function contarFilaLivro(livro_id) {
    const count = await prisma.reserva.count({
        where: { livro_id: Number(livro_id), status: { not: 0 } }
    });
    return { fila_tamanho: count };
}

async function registrarNotificacao(reserva_id, { motivo }) {
    return prisma.$transaction(async (tx) => {
        const res = await tx.reserva.findUnique({ where: { reserva_id: Number(reserva_id) } });
        if (!res) throw new Error("Reserva não encontrada");
        return tx.reservaHistorico.create({
            data: {
                reserva_id: Number(reserva_id),
                reserva_historico_status_anterior: res.status,
                reserva_historico_status_novo: res.status,
                motivo: motivo
            }
        });
    });
}

async function feedHistoricoGeral() {
    return prisma.reservaHistorico.findMany({
        orderBy: { reserva_historico_data_alteracao: 'desc' },
        take: 50
    });
}

module.exports = {
    criar, listarAtivas, alterarStatus, deletarLogico,
    buscarPorId, atualizarTotal, buscarHistorico, buscarPorUsuario,
    listarFilaLivro, renovar, buscarPorStatus, listarVencidas,
    cancelarVencidasLote, limparPorUsuario, feedRecentes, validarConflito,
    contarPendentes, contarFilaLivro, registrarNotificacao, feedHistoricoGeral
};