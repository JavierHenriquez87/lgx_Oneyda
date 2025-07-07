const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Pais = db.define('clg_pai_paises', {
    pai_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    pai_nombre: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    pai_nacionalidad: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    pai_nacionalidadm: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    pai_abreviatura: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    pai_continente: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Pais;