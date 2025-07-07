const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Servicios = db.define('clg_lindetfac_lineadetallefactura', {
    lindetfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    lindetfac_servicios: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lindetfac_tipocliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lindetfac_creacion_servicio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lindetfac_regimen: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lindetfac_orden: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Servicios;