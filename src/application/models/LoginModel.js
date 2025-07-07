const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Login = db.define('crm_login', {
    log_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    log_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    log_username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    log_password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    log_estado: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Login;