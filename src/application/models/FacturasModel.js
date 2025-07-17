const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const DetalleFactura = require('./DetalleFacturaModel');
const CortFacturaCorrelativo = require('./CortFacturaCorrelativoModel');
const Clientes = require('./ClientesModel');

const Facturas = db.define('clg_fac_factura', {
    fact_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    fac_corfa_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fac_cortfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fac_com_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fac_cobro: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    fac_cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fac_origen_tipo: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    fac_origen_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fac_fecha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fac_subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fac_iva: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_totalconiva: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_pagoretenido: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_ivaretencion: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_ventas_exentas: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fac_cant_letras: {
        type: DataTypes.STRING(60),
        allowNull: true
    },
    fac_correlativo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fac_cliente_facturar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fac_estado: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fac_anulada: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: 0
    },
    fac_motivo_anulacion: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    fac_usu_anulacion: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fac_fecha_anulacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fac_fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fac_dias_credito: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fac_impuestos: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
    },
    fac_tiempo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fac_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fac_cbm: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_no_liberado_motivo: {
        type: DataTypes.STRING(1000),
        allowNull: true
    },
    fac_codbar_duca: {
        type: DataTypes.STRING(40),
        allowNull: true
    },
    fac_cif: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fac_10adicional: {
        type: DataTypes.CHAR(2),
        allowNull: true
    },
    fac_devolucion_retencion: {
        type: DataTypes.CHAR(2),
        allowNull: true
    },
    fac_no_comprobante_retencion: {
        type: DataTypes.CHAR(10),
        allowNull: true
    },
    fac_fecha_comprobante_retencion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fac_retencion_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

Facturas.hasMany(DetalleFactura, { foreignKey: 'detfac_fac_id' });
Facturas.belongsTo(CortFacturaCorrelativo, { foreignKey: 'fac_cortfac_id' });
Facturas.belongsTo(Clientes, { foreignKey: 'fac_cliente_id' });

module.exports = Facturas;