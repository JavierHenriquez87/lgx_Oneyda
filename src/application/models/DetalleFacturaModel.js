const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const LineaDetalleFactura = require('./LineaDetalleFacturaModel');

const DetalleFactura = db.define('clg_detfac_detallefactura', {
    detfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    detfac_fac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    detfac_lindetfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    detfac_ampliacionlineadetalle: {
        type: DataTypes.STRING(1000),
        allowNull: true
    },
    detfac_cantidad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    detfac_precio: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_valor: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    detfac_descuento: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    detfac_cbm: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_cif: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_dias: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    detfac_dias_extras: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    detfac_seguro: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_10_porcentaje: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_cantidad_porcentaje10: {
        type: DataTypes.CHAR(2),
        allowNull: true
    },
    detfac_periodo_inicio: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    detfac_periodo_fin: {
        type: DataTypes.FLOAT,
        allowNull: true
    }    
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

DetalleFactura.belongsTo(LineaDetalleFactura, { foreignKey: 'detfac_fac_id' });

module.exports = DetalleFactura;