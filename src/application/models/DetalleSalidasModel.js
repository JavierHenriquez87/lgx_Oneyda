const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Tarima = require('./TarimasModel');

const DetalleSalida = db.define('clg_sald_salidadetalles', {
    sald_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    sald_sco_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sald_tar_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sald_cifdm: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    sald_descargo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sald_sal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sald_volumen: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    sald_cantidad: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    sald_peso: {
        type: DataTypes.DECIMAL(8,3),
        allowNull: true
    },
    sald_cif: {
        type: DataTypes.DECIMAL(8,2),
        allowNull: true
    },
    sald_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sald_vol_fisico: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
},
    {    
        tableName: 'clg_sald_salidadetalles',
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

DetalleSalida.belongsTo(Tarima, { foreignKey: 'sald_tar_id' });

module.exports = DetalleSalida;
