const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const TipoCliente = db.define('clg_tcli_tipocliente', {
    tcli_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tcli_tipo: {
        type: DataTypes.STRING,
        allowNull: false
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos 
    }
);

module.exports = TipoCliente;