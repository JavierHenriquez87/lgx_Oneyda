const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const BotonesDelSistema = require('./BotonesDelSistemaModel');

const RolesBotones = db.define('lgx_roles_botones', {
    codigo_rol_identbtn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    codigo_submenu: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    identificador_btn: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

RolesBotones.belongsTo(BotonesDelSistema, { foreignKey: 'identificador_btn' });

module.exports = RolesBotones;