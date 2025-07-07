const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const UnidadAlmacenaje = db.define('clg_unidad_almacenaje', {
    ualm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    ualm_cod: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    ualm_unidad: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = UnidadAlmacenaje;