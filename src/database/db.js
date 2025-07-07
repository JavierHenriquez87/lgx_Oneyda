const { Sequelize } = require('sequelize');
require('dotenv').config();

//********************************
// Parametros de conexion a la base de datos 
//********************************
const db = new Sequelize(process.env.DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.PORT_DATABASE,
    dialect: 'mysql'
});

// Exportar la instancia de Sequelize configurada
module.exports = db;