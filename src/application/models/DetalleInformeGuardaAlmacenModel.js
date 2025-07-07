const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Productos = require('./ProductosModel');
const Tarimas = require('./TarimasModel');

const DetalleGuardaAlmancen = db.define('clg_dga_detallesguardalmacen', {
    dga_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    dga_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dga_manifestados: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true
    },
    dga_recibidos: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true
    },
    dga_peso_neto: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true
    },
    dga_peso: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true
    },
    dga_volumen: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    dga_volumen_fisico: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    dga_pro_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    dga_partida_arancelaria: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dga_sku: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dga_ualm_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    dga_fecha_exp: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dga_dai: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    dga_cif: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    dga_fob: {
        type: DataTypes.DECIMAL(9, 2),
        allowNull: true
    },
    dga_fecha_fabricacion: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    dga_pais_origen: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

DetalleGuardaAlmancen.belongsTo(Productos, { foreignKey: 'dga_pro_id' });
DetalleGuardaAlmancen.hasOne(Tarimas, { foreignKey: 'tar_dga_id' });
Tarimas.belongsTo(DetalleGuardaAlmancen, { foreignKey: 'tar_dga_id' });

module.exports = DetalleGuardaAlmancen;
