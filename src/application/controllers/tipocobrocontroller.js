/**  
* *Importación de modelos a utilizar
*/
const TipoCobro = require('../models/TipoCobroModel');


class tipocobrocontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER TIPOS DE COBROS
     */
    static async ObtenerTiposCobro(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const tipocobro = await TipoCobro.findAll({
                order: [['tcob_id', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: tipocobro
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
    }//END ObtenerTiposCobro

}

module.exports = tipocobrocontroller;