const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const DocumentosCambioRegimen = db.define('clg_doc_documentos', {
    doc_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    doc_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    doc_ndocumento: {
        type: DataTypes.STRING(250),
        allowNull: true
    },
    doc_fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    doc_pais_origen_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    doc_documentos: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    doc_notaremision: {
        type: DataTypes.STRING(250),
        allowNull: true
    },
    doc_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    doc_tipoDocumento: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    doc_fecharegistro: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = DocumentosCambioRegimen;