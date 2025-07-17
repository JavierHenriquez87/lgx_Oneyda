const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const FotosCBM = require('./WMS_FotosCBMModel');

const CBM_Consignatarios = db.define('wms_consignatario_ca', {
    id_consig_cbm: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    codigo_pilotocarta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cad_cli_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    codigo_barra: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_tipo_carga: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_dano: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    danos_en_carga_cons: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    n_bultos: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    peso_cbm: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    creado_por: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: true
    },
    comentario_cbm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // ubicacion_mercaderia: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },//Eliminar este campo porque no existe en la tabla
    iga_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    carga_retirada: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_dano_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    danos_en_carga_cons_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    n_bultos_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    despachado_montacarga: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bulto_correcto_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    despachado_despachador: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comentario_cbm_salida: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

CBM_Consignatarios.hasMany(FotosCBM, { foreignKey: 'id_consig_cbm' });

module.exports = CBM_Consignatarios;