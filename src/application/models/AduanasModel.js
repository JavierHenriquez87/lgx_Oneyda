const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Aduanas = db.define('clg_adu_aduanas', {
    adu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    adu_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    adu_nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Aduanas;