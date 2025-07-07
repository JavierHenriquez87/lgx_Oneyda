const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Pais = require('./PaisModel');

const DetalleCA = db.define('clg_cad_detalleaceptacion', {
    cad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cad_cac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cad_bl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cad_cantbultos: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cad_cli_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cad_peso: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    cad_cbm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cad_pai_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cad_tarifa_diferenciada: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cad_pro_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cad_logistic_free: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cad_iga_creado: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

DetalleCA.belongsTo(Pais, { foreignKey: 'cad_pai_id' });

module.exports = DetalleCA;
