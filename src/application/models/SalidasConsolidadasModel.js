const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const SalidaConsolidada = db.define('clg_sco_salidaconsolidada', {
    sco_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    sco_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sco_sal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sco_declaracion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sco_doc_transporte: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sco_fecha_registro: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sco_fecha_liquidacion: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 0
    },
    sco_no_factura: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sco_peso: {
        type: DataTypes.FLOAT(255,0),
        allowNull: true
    },
    sco_volumen: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    sco_total_bultos: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sco_valor: {
        type: DataTypes.FLOAT(255,0),
        allowNull: true
    },
    sco_fecha_ingreso: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sco_dti: {
        type: DataTypes.STRING(40),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = SalidaConsolidada;