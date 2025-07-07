const moment = require('moment');
const { es } = require('date-fns/locale'); //Importar la localización en español
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const { logsUsers } = require('../logs/logsUser'); //Validaciones de los datos que envia el usuario
const { Op } = require('sequelize'); //Operador especial de Sequelize

/**  
* *Importación de modelos a utilizar
*/
const Clientes = require('../models/ClientesModel');


class clientescontroller {

    /**
    * TODO: FUNCIÓN PARA OBTENER CLIENTES PARA EL SELECT DE LA PAGINA DE INICIO
    */
    static async ObtenerClientesSelectInicio(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {

            const clientes = await Clientes.findAll({
                attributes: [
                    'cli_id',
                    'cli_nombre'
                ],
                order: [['cli_nombre', 'ASC']]
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: clientes
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
    }//END ObtenerClientesSelectInicio

    /**
     * TODO: FUNCIÓN PARA OBTENER CLIENTES
     */
    static async ObtenerClientes(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('pagina').notEmpty().withMessage('Numero de pagina requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { pagina } = req.body;
            const numPag = pagina;
            const limitePorPagina = 50; // Número de registros por página
            req.body.datobusqueda = req.body.datobusqueda ?? null;
            var clientes = null;
            var clientesCount = 0;

            if (req.body.datobusqueda != null) {
                //Verificamos que el dato de búsqueda contenga al menos 3 caracteres
                if (req.body.datobusqueda.length < 3) {
                    jsonResponse = {
                        status: 400,
                        message: "Bad Request",
                        response: "Debe digitar al menos 3 caracteres para buscar coincidencias."
                    };
                    return res.status(jsonResponse.status).json(jsonResponse);
                }

                //Contamos TODOS los clientes registrados segun la busqueda
                clientesCount = await Clientes.count({
                    where: {
                        [Op.or]: [
                            {
                                cli_nombre: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            },
                            {
                                cli_nit: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            },
                            {
                                cli_iva: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            }
                        ]
                    }
                });

                clientes = await Clientes.findAll({
                    where: {
                        [Op.or]: [
                            {
                                cli_nombre: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            },
                            {
                                cli_nit: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            },
                            {
                                cli_iva: {
                                    [Op.like]: '%' + req.body.datobusqueda + '%'
                                }
                            }
                        ]
                    },
                    order: [['cli_nombre', 'ASC']]
                });
            } else {
                //Contamos TODOS los clientes registrados
                clientesCount = await Clientes.count();

                //Obtenemos la data de los primeros 25 clientes y asi segun el numero de pagina
                clientes = await Clientes.findAll({
                    limit: limitePorPagina,
                    offset: (numPag - 1) * limitePorPagina,
                    order: [['cli_nombre', 'ASC']]
                });

            }

            // Calcula el número total de páginas
            const total_pages = Math.ceil(clientesCount / limitePorPagina);

            const data = {
                total_registros: clientesCount,
                total_paginas: total_pages,
                registros_por_pagina: limitePorPagina,
                data: clientes
            };

            jsonResponse = {
                status: 200,
                message: "Success",
                response: data
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
    }//END ObtenerClientes

    /**
     * TODO: FUNCIÓN PARA CREAR CLIENTE DESDE ADMIN
     */
    static async CrearCliente(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('cli_nombre').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //propiedades que no vienen en la informacion lo agregamos como null
            req.body.cli_direccion = req.body.cli_direccion ?? null;
            req.body.cli_ciudad_pais = req.body.cli_ciudad_pais ?? null;
            req.body.cli_iva = req.body.cli_iva ?? null;
            req.body.cli_nit = req.body.cli_nit ?? null;
            req.body.cli_giro = req.body.cli_giro ?? null;

            //Guardamos en estas variables la data que envio el usuario
            const {
                cli_nombre,
                cli_direccion,
                cli_ciudad_pais,
                cli_iva,
                cli_nit,
                cli_tcli_id,
                cli_tcob_id,
                cli_dom_id,
                cli_frefac_id,
                cli_giro
            } = req.body;

            //Guardamos el cliente
            const saveClient = await Clientes.create({
                cli_alias: null,
                cli_grupo: null,
                cli_principal: null,
                cli_com_id: 38,
                cli_nombre: (cli_nombre ?? '').toUpperCase(),
                cli_direccion: (cli_direccion ?? '').toUpperCase(),
                cli_ciudad_pais: (cli_ciudad_pais ?? '').toUpperCase(),
                cli_iva: (cli_iva ?? '').toUpperCase(),
                cli_nit: cli_nit,
                cli_diashabiles: 0,
                cli_tcli_id: cli_tcli_id, //tipo de cliente
                cli_tcob_id: cli_tcob_id, //tipo de cobro (Por CBM, por Producto, etc)
                cli_dom_id: cli_dom_id, //Domicilio
                cli_frefac_id: cli_frefac_id, //frecuencia de facturacion
                cli_estado: 1,
                cli_giro: (cli_giro ?? '').toUpperCase(),
                cli_periodo: 0,
                cli_declaracion: "No",
                cli_alerta_declaracion: "No",
                cli_periodo: 0,
                cli_usu_id: req.user.log_usu_id,
                cli_creacion: moment().format()
            });

            if (saveClient) {
                try {
                    // Definimos la data que se guardara en el logs de usuarios
                    const datalogs = {
                        "usuario": req.user.log_username,
                        "tipo_de_evento": "GuardarNuevoCliente",
                        "fecha_del_evento": moment().format(),
                        "tabla_afectada": "clg_cli_clientes",
                        "info_antes_de_modificar": null,
                        "info_despues_de_modificar": JSON.stringify(saveClient)
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
                    response: 'Cliente guardado con éxito!'
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
    }//END CrearCliente


    /**
     * TODO: FUNCIÓN PARA EDITAR CLIENTE DESDE ADMIN
     */
    static async EditarCliente(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('cli_id').notEmpty().withMessage('Dato requerido.'),
            check('cli_nombre').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //propiedades que no vienen en la información lo agregamos como null
            req.body.cli_direccion = req.body.cli_direccion ?? null;
            req.body.cli_ciudad_pais = req.body.cli_ciudad_pais ?? null;
            req.body.cli_iva = req.body.cli_iva ?? null;
            req.body.cli_nit = req.body.cli_nit ?? null;
            req.body.cli_giro = req.body.cli_giro ?? null;

            //Guardamos en estas variables la data que envió el usuario
            const {
                cli_id,
                cli_nombre,
                cli_direccion,
                cli_ciudad_pais,
                cli_iva,
                cli_nit,
                cli_tcli_id,
                cli_tcob_id,
                cli_dom_id,
                cli_frefac_id,
                cli_giro
            } = req.body;


            //Actualizamos el registro
            const updateClient = await Clientes.update(
                // Datos a actualizar
                {
                    cli_nombre: (cli_nombre ?? '').toUpperCase(),
                    cli_direccion: (cli_direccion ?? '').toUpperCase(),
                    cli_ciudad_pais: (cli_ciudad_pais ?? '').toUpperCase(),
                    cli_iva: (cli_iva ?? '').toUpperCase(),
                    cli_nit: cli_nit,
                    cli_tcli_id: cli_tcli_id, //tipo de cliente
                    cli_tcob_id: cli_tcob_id, //tipo de cobro (Por CBM, por Producto, etc)
                    cli_dom_id: cli_dom_id, //Domicilio
                    cli_frefac_id: cli_frefac_id, //frecuencia de facturación
                    cli_giro: (cli_giro ?? '').toUpperCase()
                },
                // Opciones de actualización
                {
                    where: { cli_id: cli_id }
                }
            );

            if (updateClient) {
                try {
                    // Definimos la data que se guardara en el logs de usuarios
                    const datalogs = {
                        "usuario": req.user.log_username,
                        "tipo_de_evento": "ActualizarCliente",
                        "fecha_del_evento": moment().format(),
                        "tabla_afectada": "clg_cli_clientes",
                        "info_antes_de_modificar": null,
                        "info_despues_de_modificar": JSON.stringify(saveClient)
                    };

                    //Enviamos la data a la funcion de logs
                    await logsUsers(req, res, next, datalogs);
                } catch (error) {
                    //! Registramos el error capturado
                    next(error);
                }

                //Devolvemos la respuesta si el cliente se guardo con exito
                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: 'Cliente actualizado con éxito!'
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
    }//END EditarCliente
}

module.exports = clientescontroller;