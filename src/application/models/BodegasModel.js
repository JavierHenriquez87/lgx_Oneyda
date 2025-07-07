const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Bodegas = db.define('clg_bod_bodegas', {
    bod_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    bod_nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bod_fecha_creacion: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Bodegas;