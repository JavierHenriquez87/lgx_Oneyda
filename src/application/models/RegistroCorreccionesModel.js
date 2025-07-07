const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Registro_correcciones = db.define('clg_rec_registro_correcciones', {
    rec_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    rec_tipo_documento: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    rec_ndocumento: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    rec_antiguo: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    rec_nuevo: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    rec_motivo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    rec_solicito: {
        type: DataTypes.STRING(25),
        allowNull: true
    },
    rec_corrigio: {
        type: DataTypes.STRING(25),
        allowNull: true
    },
    rec_fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rec_categoria: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    rec_tipo_correccion: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Registro_correcciones;