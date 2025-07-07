const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const LineaDetalleFactura = db.define('clg_lindetfac_lineadetallefactura', {
    lindetfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    lindetfac_servicios: {
        type: DataTypes.STRING(1000),
        allowNull: true
    },
    lindetfac_tipocliente: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    lindetfac_creacion_servicio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lindetfac_regimen: {
        type: DataTypes.STRING(15),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = LineaDetalleFactura;