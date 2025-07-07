const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const logsErrors = db.define('lgx_wms_dash_logs_errores', {
    id_log_error: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_error: {
        type: DataTypes.STRING,
        allowNull: true
    },
    error_producido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    backend: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    data_enviada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lgx_wms_dash: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = logsErrors;