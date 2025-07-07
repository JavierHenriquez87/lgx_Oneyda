const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Menus = require('./MenusModel'); // Importa el modelo Menus
const BotonesDelSistema = require('./BotonesDelSistemaModel');

const Submenus = db.define('lgx_submenus', {
    codigo_submenu: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_submenu: {
        type: DataTypes.STRING,
        allowNull: false
    },
    codigo_menu: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    icono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ruta: {
        type: DataTypes.STRING,
        allowNull: true
    },
    identificador_subm: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

Menus.hasMany(Submenus, { foreignKey: 'codigo_menu' });
Submenus.belongsTo(Menus, { foreignKey: 'codigo_menu' });
Submenus.hasMany(BotonesDelSistema, { foreignKey: 'codigo_submenu' });

module.exports = Submenus;
