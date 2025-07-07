const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const Transportistas = db.define('clg_tra_transportistas', {
    tra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tra_com_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tra_nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tra_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tra_direccion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    tra_nrc: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    tra_nit: {
        type: DataTypes.STRING(17),
        allowNull: true
    },
    tra_giro: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = Transportistas;