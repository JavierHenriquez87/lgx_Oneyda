/**  
* *Importación de modelos a utilizar
*/
const Servicios = require('../models/ServiciosModel');


class servicioscontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER LOS SERVICIOS
     */
    static async ObtenerServicios(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const servicios = await Servicios.findAll({
                order: [['lindetfac_servicios', 'ASC']]
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: servicios
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

module.exports = servicioscontroller;