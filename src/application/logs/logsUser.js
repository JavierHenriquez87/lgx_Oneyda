/**  
* *Importación de modelos a utilizar
*/
const Logs = require('../models/LogsModel');

/**  
* TODO: Función para guardar logs de usuarios
*/
const logsUsers = async (req, res, next, datalogs) => {
    let ip;
    try {
        ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-').split(',')[0].trim();
    } catch (error) {
        ip = '-';
    }

    datalogs.ip = ip;

    try {
        // Guardar los logs en la base de datos (aquí se supone que tienes un modelo Logs)
        await Logs.create(datalogs);
    } catch (err) {
    }
};

module.exports = {
    logsUsers
};