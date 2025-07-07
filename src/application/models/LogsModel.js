const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Logs = db.define('lgx_wms_logs', {
    codigo_log: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_de_evento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_del_evento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tabla_afectada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    info_antes_de_modificar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    info_despues_de_modificar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_principal: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tipo_registro: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motivo_correccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    solicito_modificacion: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = Logs;