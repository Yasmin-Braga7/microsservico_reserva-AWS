const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://20261_projint5_manha:senac%4012938@edumysql.acesso.rj.senac.br:3306/20261_projint5_manha_biblioteca_reserva"
    }
  }
});

module.exports = prisma;
