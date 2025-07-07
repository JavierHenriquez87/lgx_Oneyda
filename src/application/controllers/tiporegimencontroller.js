/**  
* *Importación de modelos a utilizar
*/
const TipoRegimen = require('../models/TipoRegimenModel');


class tiporegimencontroller {

    /**
     * TODO FUNCION PARA OBTENER TIPO DE REGIMEN
     */
    static async ObtenerTipoRegimen(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const tiporegimen = await TipoRegimen.findAll({
                order: [['stal_estado', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: tiporegimen
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
    }//END ObtenerTipoRegimen

}

module.exports = tiporegimencontroller;