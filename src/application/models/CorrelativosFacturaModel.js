const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const TipoCorrelativo = require('./TipoCorrelativoModel');

const CorrelativosFac = db.define('clg_corfa_correlativofactura', {
    corfa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    corfa_cortfac_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    corfa_rangoinicio: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    corfa_rangofin: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    corfa_anio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    corfa_correlativoactual: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    corfa_serie_inicial: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    corfa_serie_final: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    corfa_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    corfa_serie: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    corfa_resolucion: {
        type: DataTypes.STRING(23),
        allowNull: true
    },
    
   
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);


CorrelativosFac.belongsTo(TipoCorrelativo, {
  foreignKey: 'corfa_cortfac_id',
  as: 'tipofactura',
});


module.exports = CorrelativosFac;