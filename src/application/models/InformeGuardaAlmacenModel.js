const { DataTypes } = require('sequelize');
const db = require('../../database/db');

const CartaAceptacion = require('./CartaAceptacionModel'); // Importamos el modelo
const Clientes = require('./ClientesModel');
const DetalleGuardaAlmancen = require('./DetalleInformeGuardaAlmacenModel');
const Salidas = require('./SalidasModel');
const DocumentosCambioRegimen = require('./DocumentosCambioRegimenModel');
const EstadosAlmacenaje = require('./EstadosAlmacenajeModel');
const Pais = require('./PaisModel');
const DetalleCA = require('./DetalleCartaAceptacionModel');

const InformeGuardaAlmacen = db.define('clg_iga_informeguardalmacen', {
    iga_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    iga_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    iga_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_cac_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    iga_stal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_marchamo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_codtransportista: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_placavehiculo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_manifiesto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_fechaabandono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_fechaingreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_dmti: {
        type: DataTypes.STRING,
        allowNull: false
    },
    iga_pai_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_cad_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_cli_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_doctransporte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_volumen: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_volumen_fisico: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_comentarios: {
        type: DataTypes.STRING,
        allowNull: false
    },
    iga_archivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_salida: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_origen: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_version_as: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_finiquitado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_valor_inicial: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_valor_actual: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_liberado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_sobredimensionado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_bultos_sd: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_volumen_sd: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    iga_sal_traslado_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    iga_tiempo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_archivo_bl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_archivo_dmti: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_fecha_recepcionado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_ubicacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_menaje_casa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_check: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_fechafacturacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_tipo_volumen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    iga_tarimas_ocupadas: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    de_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
},
    {
        tableName: 'clg_iga_informeguardalmacen',
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creación en automático
        freezeTableName: true //Esta linea hará que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

InformeGuardaAlmacen.belongsTo(CartaAceptacion, { foreignKey: 'iga_cac_id' });
InformeGuardaAlmacen.belongsTo(Clientes, { foreignKey: 'iga_cli_id' });
InformeGuardaAlmacen.hasMany(DetalleGuardaAlmancen, { foreignKey: 'dga_iga_id' });
InformeGuardaAlmacen.hasMany(Salidas, { foreignKey: 'sal_iga_id' });
Salidas.belongsTo(InformeGuardaAlmacen, { foreignKey: "sal_iga_id" });
InformeGuardaAlmacen.hasMany(DocumentosCambioRegimen, { foreignKey: 'doc_iga_id' });
InformeGuardaAlmacen.belongsTo(EstadosAlmacenaje, { foreignKey: 'iga_stal_id' });
InformeGuardaAlmacen.belongsTo(Pais, { foreignKey: 'iga_pai_id' });
InformeGuardaAlmacen.belongsTo(DetalleCA, { foreignKey: 'iga_cad_id' });
DetalleCA.hasOne(InformeGuardaAlmacen, { foreignKey: 'iga_cad_id' });

module.exports = InformeGuardaAlmacen;
