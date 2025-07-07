/**  
* *Importación de modelos a utilizar
*/
const TipoDocTransporte = require('../models/TipoDocTransporteModel');


class tipodoctransportecontroller {

    /**
     * TODO FUNCION PARA OBTENER TIPOS DE DOCUMENTO DE TRANSPORTE
     */
    static async ObtenerTipoDocTransporte(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const tipodoctransporte = await TipoDocTransporte.findAll({
                order: [['tdt_documento', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: tipodoctransporte
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
    }//END ObtenerTipoDocTransporte

}

module.exports = tipodoctransportecontroller;