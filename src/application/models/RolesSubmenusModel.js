const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Submenus = require('./SubmenusModel'); // Importa el modelo Submenus

const RolSubmenu = db.define('lgx_roles_submenu', {
    codigo_rolsubmenu: {
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
    creado_por: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    modificado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_modificacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    leer: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    crear: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    editar: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    eliminar: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

RolSubmenu.belongsTo(Submenus, { foreignKey: 'codigo_submenu' });

module.exports = RolSubmenu;