const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,

    pool: {
      max: 1,
      min: 0,
      idle: 0,
      acquire: 30000
    },

    dialectOptions: {
      connectTimeout: 100000
    }
  }
);

module.exports = sequelize;
