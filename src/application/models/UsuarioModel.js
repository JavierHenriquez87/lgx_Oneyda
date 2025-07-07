const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Rol = require('./RolModel');
const Login = require('./LoginModel'); // Importa el modelo de Rol

const Usuarios = db.define('crm_usuario', {
    usu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    usu_rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usu_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usu_nombres: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usu_apellidos: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usu_telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usu_cargo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usu_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    usu_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    usu_conexion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    acceso_logix: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    acceso_wms: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fotografia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    creado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    modificado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_modificacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rol_id_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rol_id_wms: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    usu_path_firma: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

//Usuarios.belongsTo(Rol, { foreignKey: 'rol_id_lgx' });
Usuarios.belongsTo(Rol, {
    foreignKey: 'usu_rol_id',   // en la tabla Usuarios
    targetKey: 'rol_id',        // en la tabla Roles
});
Usuarios.belongsTo(Login, {
    foreignKey: 'usu_id',
    targetKey: 'log_usu_id',
});


module.exports = Usuarios;