const jwt = require('jsonwebtoken');
//Libreria de encriptacion para la clave enviada por el usuario al momento de registrarse al sistema
const bcrypt = require('bcrypt');
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const secretKey = process.env.SECRET_KEY;

/**  
* *Importación de modelos a utilizar
*/
const Login = require('../models/LoginModel');
const TokenBlacklist = require('../models/TokensLogoutModel');
const Usuarios = require('../models/UsuarioModel');
const Menus = require('../models/MenusModel');
const Submenus = require('../models/SubmenusModel');
const RolSubmenus = require('../models/RolesSubmenusModel');
const RolSubmenu = require('../models/RolesSubmenusModel');


class logincontroller {

    /**  
    * TODO: MÉTODO PARA INICIAR SESIÓN
    */
    static async login(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('usuario').notEmpty().withMessage('Digite su usuario.'),
            check('clave').notEmpty().withMessage('Digite su contraseña.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envio el usuario
            const { usuario, clave } = req.body;
            // Busca al usuario por nombre de usuario
            const user = await Login.findOne({ where: { log_username: usuario } });

            if (!user) {
                jsonResponse = {
                    status: 404,
                    message: "Not Found",
                    response: 'Usuario no encontrado'
                };
            } else {
                if (user.log_estado == 0) {
                    jsonResponse = {
                        status: 403,
                        message: "Forbidden",
                        response: 'Su usuario se encuentra inactivo!'
                    };
                } else {
                    //Comparamos la clave enviada por el usuario (clave) con la clave que esta en la BD (log_password)
                    if (bcrypt.compareSync(clave, user.log_password)) {
                        // Genera un token JWT, con el usuario logueado, firmandolo con la llave secreta y tiempo de expiracion 1 mes
                        const tokenBearer = jwt.sign({ user }, secretKey, { expiresIn: '43200m' });
                        //Quitamos de la respuesta el password
                        user.log_password = undefined;
                        user.log_estado = undefined;

                        const datauser = await Usuarios.findOne({
                            where: {
                                usu_id: user.log_usu_id
                            }
                        });

                        //Obtenemos los menus a los que el usuario tiene acceso
                        const dataPermisos = await RolSubmenus.findAll({
                            where: {
                                rol_id: datauser.rol_id_lgx
                            },
                            include: {
                                model: Submenus,
                                include: {
                                    model: Menus
                                }
                            }
                        });

                        // Creamos un objeto para almacenar los menús y sus submenús correspondientes
                        const menuSubmenuMap = {};

                        // Organizamos los datos según los menús y submenús
                        dataPermisos.forEach(permiso => {
                            const { lgx_submenu } = permiso;
                            const { codigo_menu, nombre_menu, orden, icono, ruta } = lgx_submenu.lgx_menu;

                            if (!menuSubmenuMap[codigo_menu]) {
                                // Si el menú aún no está en el mapa, lo inicializamos
                                menuSubmenuMap[codigo_menu] = {
                                    codigo_menu,
                                    nombre_menu,
                                    orden,
                                    icono,
                                    ruta,
                                    submenus: []
                                };
                            }

                            // Agregamos el submenú al menú correspondiente
                            menuSubmenuMap[codigo_menu].submenus.push({
                                codigo_submenu: lgx_submenu.codigo_submenu,
                                nombre_submenu: lgx_submenu.nombre_submenu,
                                icono: lgx_submenu.icono,
                                ruta: lgx_submenu.ruta,
                                acceso_botones: []
                            });
                        });

                        // Convertimos el mapa a un array de menús con sus submenús
                        const menusConSubmenus = Object.values(menuSubmenuMap);

                        //Objeto que vamos a devolver con la informacion del usuario
                        const dataU = {
                            ...user.toJSON(),
                            usu_nombres: datauser.usu_nombres,
                            usu_apellidos: datauser.usu_apellidos,
                            usu_telefono: datauser.usu_telefono,
                            usu_email: datauser.usu_email,
                            rol_id_lgx: datauser.rol_id_lgx ?? 0,
                            token: tokenBearer,
                            permisos: menusConSubmenus,
                            fotografia: datauser.fotografia
                        };

                        jsonResponse = {
                            status: 200,
                            message: "Success",
                            response: dataU
                        };

                    } else {
                        jsonResponse = {
                            status: 404,
                            message: "Not Found",
                            response: 'Error en usuario y/o contraseña!'
                        };
                    }
                }
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
    }// END login


    /**  
    * TODO: MÉTODO PARA CERRAR SESIÓN
    */
    static async logout(req, res, next) {
        try {
            const token = req.headers['authorization'].split(' ')[1]; // Obtener el token del encabezado Authorization

            //Guardamos el token en la tabla de blacklist
            await TokenBlacklist.create({
                token: token
            });

            return res.status(200).json({ message: "Cierre de sesión exitoso" });
        } catch (error) {
            //! Registramos el error capturado
            next(error);

            return res.status(500).json({ message: error });
        }
    }// END logout
}

module.exports = logincontroller;