const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Menus = db.define('lgx_menus', {
    codigo_menu: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_menu: {
        type: DataTypes.STRING,
        allowNull: false
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    icono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ruta: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Menus;
