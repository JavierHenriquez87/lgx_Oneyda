const { logsUsers } = require('../logs/logsUser'); //Validaciones de los datos que envia el usuario
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const moment = require('moment');
const { es } = require('date-fns/locale'); //Importar la localización en español

/**  
* *Importación de modelos a utilizar
*/
const Transportista = require('../models/TransportistaModel');


class transportistacontroller {

    /**
     * TODO FUNCION PARA OBTENER TRANSPORTISTAS
     */
    static async ObtenerTransportistas(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data
            const transportistas = await Transportista.findAll({
                order: [['tra_nombre', 'ASC']],

            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: transportistas
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
    }//END ObtenerTransportistas


    /**
    * TODO: FUNCIÓN PARA CREAR TRANSPORTISTAS (DESDE CREACIÓN DE CARTA)
    */
    static async CrearTransportista(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('tra_nombre').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            req.body.tra_direccion = req.body.tra_direccion ?? null;
            req.body.tra_nrc = req.body.tra_nrc ?? null;
            req.body.tra_nit = req.body.tra_nit ?? null;
            req.body.tra_giro = req.body.tra_giro ?? null;

            //Guardamos en estas variables la data que envió el usuario
            const { tra_nombre, tra_direccion, tra_nrc, tra_nit, tra_giro } = req.body;

            //Guardamos el cliente
            const saveTransportista = await Transportista.create({
                tra_com_id: 38,
                tra_nombre: tra_nombre.toUpperCase(),
                tra_direccion,
                tra_nrc,
                tra_nit,
                tra_giro,
                tra_usu_id: req.user.log_usu_id
            });

            if (saveTransportista) {
                try {
                    // Definimos la data que se guardara en el logs de usuarios
                    const datalogs = {
                        "usuario": req.user.log_username,
                        "tipo_de_evento": "GuardarNuevoTransportista",
                        "fecha_del_evento": moment().format(),
                        "tabla_afectada": "clg_tra_transportistas",
                        "info_antes_de_modificar": null,
                        "info_despues_de_modificar": JSON.stringify(saveTransportista)
                    };

                    //Enviamos la data a la funcion de logs
                    await logsUsers(req, res, next, datalogs);
                } catch (error) {
                    //! Registramos el error capturado
                    next(error);
                }

                //Devolvemos la respuesta si el cliente se guardo con éxito
                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: 'Transportista guardado con éxito!'
                };
            }
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
    }//END CrearTransportista


    /**
     * TODO: FUNCIÓN PARA EDITAR TRANSPORTISTA
     */
    static async EditarTransportista(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('tra_id').notEmpty().withMessage('tra_id is required.'),
            check('tra_nombre').notEmpty().withMessage('tra_nombre is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            req.body.tra_direccion = req.body.tra_direccion ?? null;
            req.body.tra_nrc = req.body.tra_nrc ?? null;
            req.body.tra_nit = req.body.tra_nit ?? null;
            req.body.tra_giro = req.body.tra_giro ?? null;

            //Guardamos en estas variables la data que envió el usuario
            const {
                tra_id,
                tra_nombre,
                tra_direccion,
                tra_nrc,
                tra_nit,
                tra_giro
            } = req.body;

            const oldData = await Transportista.findByPk(tra_id);

            //Actualizamos el registro
            const updateTransportista = await Transportista.update(
                {
                    tra_nombre: tra_nombre.toUpperCase(),
                    tra_direccion: (tra_direccion ?? '').toUpperCase(),
                    tra_nrc: (tra_nrc ?? '').toUpperCase(),
                    tra_nit: (tra_nit ?? '').toUpperCase(),
                    tra_giro: (tra_giro ?? '').toUpperCase()
                },
                {
                    where: { tra_id: tra_id }
                }
            );


            if (updateTransportista) {
                const newData = await Transportista.findByPk(tra_id);

                try {
                    // Definimos la data que se guardara en el logs de usuarios
                    const datalogs = {
                        "usuario": req.user.log_username,
                        "tipo_de_evento": "ActualizarTransportista",
                        "fecha_del_evento": moment().format(),
                        "tabla_afectada": "clg_tra_transportista",
                        "info_antes_de_modificar": JSON.stringify(oldData),
                        "info_despues_de_modificar": JSON.stringify(newData)
                    };

                    //Enviamos la data a la funcion de logs
                    await logsUsers(req, res, next, datalogs);
                } catch (error) {
                    console.log(error);
                }

                //Devolvemos la respuesta si el cliente se guardo con exito
                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: 'Transportista actualizado con éxito!'
                };
            }
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
    }//END EditarTransportista
}

module.exports = transportistacontroller;