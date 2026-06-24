require('dotenv/config');

/** @type {import('@prisma/config').PrismaConfig} */
module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
