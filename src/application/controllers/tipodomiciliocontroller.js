/**  
* *Importación de modelos a utilizar
*/
const TipoDomicilio = require('../models/TipoDomicilioModel');


class tipodomiciliocontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER TIPOS DE DOMICILIO
     */
    static async ObtenerTiposDomicilio(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const tipodomicilio = await TipoDomicilio.findAll({
                order: [['dom_domicilio', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: tipodomicilio
            };

        }
        catch (error) {
            //! Registramos el error capturado
            next(error);

            jsonResponse = {
                status: 500,
                message: "Error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }//END ObtenerTiposDomicilio

}

module.exports = tipodomiciliocontroller;