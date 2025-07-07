const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const EstadosAlmacenaje = db.define('clg_stal_estadosalmacenaje', {
    stal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    stal_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stal_codsistema: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    stal_estado: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = EstadosAlmacenaje;