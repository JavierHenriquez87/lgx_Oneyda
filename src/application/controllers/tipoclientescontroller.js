/**  
* *Importación de modelos a utilizar
*/
const TipoCliente = require('../models/TipoClienteModel');


class tipoclientescontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER TIPOS DE CLIENTES
     */
    static async ObtenerTiposClientes(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const tipocliente = await TipoCliente.findAll({
                order: [['tcli_tipo', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: tipocliente
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
    }//END ObtenerTiposClientes

}

module.exports = tipoclientescontroller;