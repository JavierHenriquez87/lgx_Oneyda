const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const PilotosCAceptacion = db.define('wms_pilotos_cartaaceptacion', {
    codigo_pilotocarta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_piloto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cac_numero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_ingreso: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creado_por: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    num_marchamo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    num_contenedor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    danos_en_carga: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comentario_1: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    apertura_completada: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    firmado_token: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    firmado_por: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_firmado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    path_status_carta: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = PilotosCAceptacion;