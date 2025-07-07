const moment = require('moment-timezone');
const logsDeErrores = require('../logs/logsErrores');

const errorHandler = async (err, req, res, next) => {
    const datalogs = {
        fecha_error: moment().tz("America/El_Salvador").format(),
        error_producido: err.message ?? 'Error desconocido',
        backend: true,
        data_enviada: JSON.stringify(req.body || {}),
        lgx_wms_dash: 'lgx' // valor por defecto
    };

    try {
        await logsDeErrores.logsError(req, res, next, datalogs);
    } catch (loggingError) {
        console.error("❌ Error al guardar en el log de errores:", loggingError);
    }

    return next(); // Continúa con el flujo si es necesario
};

module.exports = errorHandler;