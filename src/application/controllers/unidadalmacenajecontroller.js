const { logsUsers } = require('../logs/logsUser'); // Guardar Logs de usuarios
const moment = require('moment-timezone');
require('moment/locale/es'); // Importa el idioma español
// Configuramos el idioma español globalmente
moment.locale('es');
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const { Op } = require('sequelize');

/**  
* *Importación de modelos a utilizar
*/
const UnidadAlmacenaje = require('../models/UnidadAlmacenajeModel');


class unidadalmacenajecontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER LAS UNIDADES DE ALMACENAJE
     */
    static async listUnidadesAlmacenaje(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            const unidadesAlm = await UnidadAlmacenaje.findAll({
                order: [['ualm_unidad', 'ASC']]
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: unidadesAlm
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
    }//END listUnidadesAlmacenaje

}

module.exports = unidadalmacenajecontroller;