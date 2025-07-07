const { DataTypes } = require('sequelize');
const db = require('../../database/db');
const Transportistas = require('./TransportistaModel');
const Aduanas = require('./AduanasModel');
const DetalleCA = require('./DetalleCartaAceptacionModel');
const PilotosCAceptacion = require('./WMS_PilotosCartasModel');
const EstadosAlmacenaje = require('./EstadosAlmacenajeModel');

const CAceptacion = db.define('clg_cac_aceptacion', {
    cac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    cac_com_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cac_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_guardalmacen_usu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_numero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cac_contenedor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_tipocontenedor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_motivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_tra_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_adu_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_pdf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_fecha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cac_fecha_vigencia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_guardalmacen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_totalbl: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_totalpeso: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    cac_totalcbm: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    cac_tdt_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_estado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_mot_anulacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_estado_ingreso: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cac_tipo_carga: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_tiempo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_manifiesto_archivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cac_stal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    de_lgx: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bloquear_info: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    misma_dmti: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
    {
        timestamps: false, //Esta linea le indica al modelo que no manejaremos creado por, ni fecha de creacion en automatico
        freezeTableName: true //Esta linea hara que Sequelize no pluralice los nombres de las tablas y las busque tal cual le indicamos
    }
);

CAceptacion.belongsTo(Transportistas, { foreignKey: 'cac_tra_id' });
CAceptacion.belongsTo(Aduanas, { foreignKey: 'cac_adu_id' });
CAceptacion.hasMany(DetalleCA, { foreignKey: 'cad_cac_id' });
DetalleCA.belongsTo(CAceptacion, { foreignKey: 'cad_cac_id' });
CAceptacion.hasOne(PilotosCAceptacion, { foreignKey: 'cac_id' });
PilotosCAceptacion.belongsTo(CAceptacion, { foreignKey: 'cac_id' });
CAceptacion.belongsTo(EstadosAlmacenaje, { foreignKey: 'cac_stal_id' });
CAceptacion.hasOne(PilotosCAceptacion, { foreignKey: 'cac_id' });

module.exports = CAceptacion;
