/**  
* *Importación de modelos a utilizar
*/
const Pais = require('../models/PaisModel');


class paisescontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER LOS PAÍSES
     */
    static async ObtenerPaises(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const paises = await Pais.findAll({
                order: [['pai_nombre', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: paises
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

module.exports = paisescontroller;