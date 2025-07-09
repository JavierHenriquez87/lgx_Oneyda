const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const TipoCorrelativo = db.define('clg_cortfac_correlativotipofactura', {
    cortfac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cortfac_tipofactura: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    
   
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);


module.exports = TipoCorrelativo;