const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const TipoDocSalida = db.define('clg_tipodocumento_salida', {
    tdocsal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tdocsal_documento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tdocsal_activo: {
        type: DataTypes.STRING(1),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = TipoDocSalida;