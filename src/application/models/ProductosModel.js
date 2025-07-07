const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Productos = db.define('clg_pro_productos', {
    pro_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    pro_nombre: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    pro_codigo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    pro_medida: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    pro_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pro_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pro_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = Productos;