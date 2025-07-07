const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const moment = require('moment');
const { es } = require('date-fns/locale'); //Importar la localización en español

/**  
* *Importación de modelos a utilizar
*/
const Rol = require('../models/RolModel');
const RolSubmenu = require('../models/RolesSubmenusModel');
const Submenus = require('../models/SubmenusModel');
const Menus = require('../models/MenusModel');
const BotonesDelSistema = require('../models/BotonesDelSistemaModel');
const RolesBotones = require('../models/RolesBotonesModel');


class rolcontroller {

    /**
     * TODO: FUNCIÓN PARA OBTENER LOS ROLES
     */
    static async ObtenerRoles(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos los roles que pertenecen a Logix
            const roles = await Rol.findAll({
                where: {
                    rol_de_lgx: true
                },
                attributes: ['rol_id', 'rol_nombre', 'rol_descripcion'],
                order: [['rol_nombre', 'ASC']]
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: roles
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
    }//END ObtenerRoles


    /**
    * TODO: FUNCIÓN PARA GUARDAR UN NUEVO ROL
    */
    static async GuardarRol(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('rol_nombre').notEmpty().withMessage('Dato requerido.'),
            check('rol_descripcion').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envio el usuario
            const {
                rol_nombre,
                rol_descripcion
            } = req.body;

            await Rol.create({
                rol_com_id: 38,
                rol_nombre: rol_nombre,
                rol_descripcion: rol_descripcion,
                rol_estado: 1,
                rol_fecha_creacion: moment().format(),
                rol_de_lgx: true
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: '¡Se creó el rol con éxito!'
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
    }//END GuardarRol


    /**
    * TODO: FUNCIÓN PARA EDITAR LOS ROLES
    */
    static async EditarRol(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('rol_id').notEmpty().withMessage('Dato requerido.'),
            check('rol_nombre').notEmpty().withMessage('Dato requerido.'),
            check('rol_descripcion').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envio el usuario
            const {
                rol_id,
                rol_nombre,
                rol_descripcion
            } = req.body;

            //actualizamos la data del usuario
            await Rol.update(
                // Datos a actualizar
                {
                    rol_nombre: rol_nombre,
                    rol_descripcion: rol_descripcion
                },
                {
                    where: { rol_id: rol_id }
                }
            );

            jsonResponse = {
                status: 200,
                message: "Success",
                response: '¡Se modifico el rol con éxito!'
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
    }//END EditarRol


    /**
    * TODO: FUNCIÓN PARA AGREGAR ACCESO A UN SUBMENU A UN ROL
    */
    static async EditarPermisosRol(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('rol_id').notEmpty().withMessage('Dato requerido.'),
            check('codigo_submenu').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const {
                rol_id,
                codigo_submenu
            } = req.body;

            //* Buscamos si el menu ya fue asignado en el rol
            const existe = await RolSubmenu.count(
                {
                    where: {
                        rol_id: rol_id,
                        codigo_submenu: codigo_submenu
                    }
                }
            );

            if (existe == 0) {
                //! Si el rol no tiene acceso al submenu lo agregamos
                await RolSubmenu.create({
                    rol_id: rol_id,
                    codigo_submenu: codigo_submenu,
                    creado_por: req.user.log_username,
                    fecha_creacion: moment().format()
                });
            } else {
                //! Si el rol ya tenia acceso al submenu se lo quitamos
                await RolSubmenu.destroy(
                    {
                        where: {
                            rol_id: rol_id,
                            codigo_submenu: codigo_submenu
                        }
                    }
                );
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: "Se modificó el permiso!"
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
    }//END EditarPermisosRol


    /**
    * TODO: FUNCIÓN PARA AGREGAR ACCESO A UN BOTÓN A UN ROL
    */
    static async AccesoBtnRol(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('rol_id').notEmpty().withMessage('Dato requerido.'),
            check('codigo_submenu').notEmpty().withMessage('Dato requerido.'),
            check('identificador_btn').notEmpty().withMessage('Dato requerido.'),
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            let resp = "Se modificó el permiso!";

            //Guardamos en estas variables la data que envió el usuario
            const {
                rol_id,
                identificador_btn,
                codigo_submenu
            } = req.body;

            //* Buscamos si el boton ya fue asignado en el rol
            const existe = await RolesBotones.count(
                {
                    where: {
                        rol_id,
                        identificador_btn,
                        codigo_submenu
                    }
                }
            );

            if (existe == 0) {
                //! Si el rol no tiene acceso al botón lo agregamos
                await RolesBotones.create({
                    rol_id,
                    identificador_btn,
                    codigo_submenu,
                    creado_por: req.user.log_username,
                    fecha_creacion: moment().format()
                });

                resp = "Se agrego acceso al botón."
            } else {
                //! Si el rol ya tenia acceso al botón se lo quitamos
                await RolesBotones.destroy(
                    {
                        where: {
                            rol_id,
                            codigo_submenu,
                            identificador_btn
                        }
                    }
                );

                resp = "Se quito acceso al botón."
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: resp
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
    }//END AccesoBtnRol


    /**
    * TODO: FUNCIÓN PARA OBTENER LOS BOTONES DEL SISTEMA
    */
    static async ObtenerBotonesSistemaLGX(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos los botones que pertenecen a Logix
            const botones = await BotonesDelSistema.findAll({
                where: {
                    btn_lgx: true
                },
                order: [['nombre_boton', 'ASC']]
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: botones
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
    }//END ObtenerBotonesSistema
}

module.exports = rolcontroller;