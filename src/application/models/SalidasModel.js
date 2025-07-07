const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Clientes = require('./ClientesModel');
const TipoDocSalida = require('./TipoDocSalidaModel');
const DocumentosSalidas = require('./DocumentosSalidasModel');
const SalidaConsolidada = require("./SalidasConsolidadasModel");
const InformeGuardaAlmacen = require("./InformeGuardaAlmacenModel");
const DetalleSalida = require("./DetalleSalidasModel");

const Salidas = db.define('clg_sal_salidas', {
    sal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    sal_codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_cli_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_fechadm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_fecha_liq_dm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_numerodm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_fac_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_peso: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    sal_doctransporte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_volumen: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    sal_pai_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_nbultos: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_placa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_comentarios: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_iga_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_tipo_doc: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_aduana: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_valor: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    sal_nombre_piloto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_informe: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_dui_piloto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sal_tiempo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_no_codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_licencia_conducir: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_endoso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_fecha_ingreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sal_dti: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_piloto: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    codigo_mediotransporte: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cantidad_unidades: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iniciado_proceso_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    terminado_proceso_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    de_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        tableName: 'clg_sal_salidas',
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

Salidas.belongsTo(Clientes, { foreignKey: 'sal_cli_id' });
Salidas.belongsTo(TipoDocSalida, { foreignKey: 'sal_tipo_doc' });
Salidas.hasMany(DocumentosSalidas, { foreignKey: 'docs_sal_id' });
Salidas.hasMany(SalidaConsolidada, { foreignKey: "sco_sal_id" });
Salidas.hasMany(DetalleSalida, { foreignKey: "sald_sal_id" });

module.exports = Salidas;
