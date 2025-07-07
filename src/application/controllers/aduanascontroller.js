/**  
* *Importación de modelos a utilizar
*/
const Aduanas = require('../models/AduanasModel');


class aduanascontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER ADUANAS
     */
    static async ObtenerAduanas(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data de las aduanas
            const aduanas = await Aduanas.findAll({
                order: [['adu_nombre', 'ASC']],
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: aduanas
            };

        }
        catch (error) {
            //! Registramos el error capturado
            try {
                next(error);
            } catch (e) {
            }

            jsonResponse = {
                status: 500,
                message: "Error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }//END ObtenerAduanas
}

module.exports = aduanascontroller;