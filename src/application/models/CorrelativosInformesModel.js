const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const CorrelativosInformes = db.define('clg_cor_correlativosinformes', {
    cor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cor_tipo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cor_correlativo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cor_anio: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = CorrelativosInformes;
