const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Roles = db.define('crm_rol', {
    rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    rol_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rol_nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol_descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol_fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol_estado: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rol_grupo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rol_de_wms: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rol_de_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = Roles;