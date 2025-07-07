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
const Productos = require('../models/ProductosModel');


class productoscontroller {

    /**
     * TODO FUNCIÓN PARA OBTENER LOS PRODUCTOS
     */
    static async listadoProductos(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            req.body.datobusqueda = req.body.datobusqueda ?? null;

            //Guardamos en estas variables la data que envió el usuario
            let { datobusqueda } = req.body;
            const limitePorPagina = 500;

            // Normaliza datobusqueda para evitar errores si es null
            datobusqueda = datobusqueda?.trim() || '';

            const whereClause = datobusqueda
                ? {
                    pro_nombre: {
                        [Op.like]: `%${datobusqueda}%`
                    }
                }
                : {}; // si está vacío, no aplicamos ningún filtro

            const productos = await Productos.findAll({
                where: whereClause,
                order: [['pro_nombre', 'ASC']],
                limit: limitePorPagina
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: productos
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
    }//END listadoProductos


    /**
     * TODO FUNCIÓN PARA GUARDAR UN PRODUCTO
     */
    static async guardarProducto(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('pro_nombre').notEmpty().withMessage('pro_nombre es requerido.'),
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            req.body.pro_codigo = req.body.pro_codigo ?? null;
            req.body.pro_medida = req.body.pro_medida ?? null;

            //Guardamos en estas variables la data que envió el usuario
            let { pro_nombre, pro_codigo, pro_medida } = req.body;

            //todo: Buscamos si el producto existe ya en la base de datos con ese nombre
            const existeProd = await Productos.findOne({
                where: {
                    pro_nombre
                }
            });

            if (!existeProd) {
                const newProduct = await Productos.create({
                    pro_nombre,
                    pro_codigo,
                    pro_medida,
                    pro_com_id: 38,
                    pro_estado: 1,
                    pro_usu_id: req.user.log_usu_id
                });


                //! ====================================================================
                //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
                //! ====================================================================
                try {
                    // Definimos la data que se guardara en el logs de usuarios
                    const datalogs = {
                        "usuario": req.user.log_username,
                        "tipo_de_evento": "Crear Nuevo Producto",
                        "fecha_del_evento": moment().format(),
                        "tabla_afectada": "clg_pro_productos",
                        "info_antes_de_modificar": null,
                        "info_despues_de_modificar": JSON.stringify(newProduct),
                        "id_principal": newProduct.pro_id,
                        "tipo_registro": "Producto"
                    };

                    //Enviamos la data a la funcion de logs
                    await logsUsers(req, res, next, datalogs);
                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) {
                    }
                }
                //! ====================================================================
                //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
                //! ====================================================================

                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: "Producto Agregado"
                };
            } else {
                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: "Ya existe un Producto exactamente con esta descripción"
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
    }//END guardarProducto
}

module.exports = productoscontroller;