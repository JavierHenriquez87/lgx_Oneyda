/**  
* *Importación de modelos a utilizar
*/
const Bodegas = require('../models/BodegasModel');


class bodegascontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER LISTADO DE BODEGAS DE CLG
     */
    static async ObtenerBodegas(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos las bodegas
            const bodegas = await Bodegas.findAll();

            jsonResponse = {
                status: 200,
                message: "Success",
                response: bodegas
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
    }//END ObtenerBodegas
}

module.exports = bodegascontroller;