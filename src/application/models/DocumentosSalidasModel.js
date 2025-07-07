const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const DocumentosSalidas = db.define('clg_docs_documentos', {
    docs_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    docs_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    docs_sal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    docs_file: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

module.exports = DocumentosSalidas;