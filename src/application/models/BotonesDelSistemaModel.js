const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const BotonesDelSistema = db.define('lgx_wms_botones', {
    identificador_btn: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    descripcion_boton: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pantalla: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nombre_boton: {
        type: DataTypes.STRING,
        allowNull: true
    },
    btn_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    btn_wms: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    codigo_submenu: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    icono_btn: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = BotonesDelSistema;