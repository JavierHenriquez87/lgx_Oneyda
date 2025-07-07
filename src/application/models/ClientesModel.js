const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const DetalleCA = require('./DetalleCartaAceptacionModel');

const Clientes = db.define('clg_cli_clientes', {
    cli_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cli_alias: {
        type: DataTypes.STRING(1),
        allowNull: true
    },
    cli_grupo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_principal: {
        type: DataTypes.STRING(2),
        allowNull: true
    },
    cli_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cli_nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    cli_direccion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cli_ciudad_pais: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    cli_iva: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cli_nit: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cli_diashabiles: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_tcli_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_tcob_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_dom_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_frefac_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_giro: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cli_periodo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cli_declaracion: {
        type: DataTypes.STRING(2),
        allowNull: true
    },
    cli_alerta_declaracion: {
        type: DataTypes.STRING(2),
        allowNull: true
    },
    cli_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

Clientes.hasMany(DetalleCA, { foreignKey: 'cad_cli_id' });
DetalleCA.belongsTo(Clientes, { foreignKey: 'cad_cli_id' });

module.exports = Clientes;