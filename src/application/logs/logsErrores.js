//*************************************************************/
//TODO: MÉTODO PARA GUARDAR EN EL LOGS SI OCURRIÓ ALGÚN ERROR 
//*************************************************************/

const LogsErrors = require('../models/LogsErrorsModel');

const logsError = async (req, res, next, datalogs) => {
    try {
        await LogsErrors.create(datalogs);
    } catch (err) {
        console.error('Error al guardar en LogsErrors: ', err); 
    }
};

module.exports = {
    logsError
};
