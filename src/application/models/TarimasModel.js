const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Tarimas = db.define('clg_tar_tarimas', {
    tar_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tar_dga_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tar_total: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tar_orden: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tar_inicial: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true
    },
    tar_nbultos: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true
    },
    tar_peso_inicial: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    tar_peso_actual: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_peso_salida: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_cif_inicial: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    tar_cif_actual: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    tar_cif_salida: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    tar_vol_inicial: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_vol_actual: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_vol_salida: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_vol_fisico_inicial: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_vol_fisico_actual: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_vol_fisico_salida: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_salida: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tar_identificador: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    tar_impreso: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tar_pallet_inicial: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tar_pallet_actual: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tar_pallet_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    de_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = Tarimas;