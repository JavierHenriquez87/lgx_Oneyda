const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Docs = db.define('lgx_docs', {
    id_doc: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_doc: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    path_doc: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    id_registro: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo_registro: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    tipo_doc: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    creado_por: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.STRING(250),
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Docs;