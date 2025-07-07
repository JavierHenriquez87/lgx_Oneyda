const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario

/**  
* *Importación de modelos a utilizar
*/
const Menus = require('../models/MenusModel');
const RolSubmenu = require('../models/RolesSubmenusModel');
const Submenus = require('../models/SubmenusModel');
const BotonesDelSistema = require('../models/BotonesDelSistemaModel');
const RolesBotones = require('../models/RolesBotonesModel');

class menucontroller {

    /**
     * TODO: FUNCIÓN PARA OBTENER LOS MENUS
     */
    static async ObtenerMenus(req, res, next) {
        let jsonResponse = { status: 500, message: "Error", response: "" };

        const validaciones = [
            check('rol_id').notEmpty().withMessage('rol_id es requerido')
        ];

        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp !== true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { rol_id } = req.body;

            // Traemos todos los menús, submenús y botones (todos)
            const menus = await Menus.findAll({
                include: [
                    {
                        model: Submenus,
                        required: false,
                        include: [
                            {
                                model: BotonesDelSistema,
                                where: { btn_lgx: true },
                                required: false
                            }
                        ]
                    }
                ],
                order: [['orden', 'ASC']]
            });

            // Accesos del rol
            const permisosSubmenus = await RolSubmenu.findAll({
                where: { rol_id: rol_id }
            });

            const permisosBotones = await RolesBotones.findAll({
                where: { rol_id: rol_id }
            });

            const submenusPermitidos = new Set(permisosSubmenus.map(p => p.codigo_submenu));
            const botonesPermitidos = new Set(permisosBotones.map(p => p.identificador_btn));

            // Construir la estructura final
            const resultado = menus.map(menu => {
                const submenus = (menu.lgx_submenus || []).map(sub => {
                    const tieneAccesoSubmenu = submenusPermitidos.has(sub.codigo_submenu);
                
                    const botones = (sub.lgx_wms_botones || []).map(btn => ({
                        identificador_btn: btn.identificador_btn,
                        descripcion_boton: btn.descripcion_boton,
                        pantalla: btn.pantalla,
                        nombre_boton: btn.nombre_boton,
                        btn_lgx: btn.btn_lgx,
                        btn_wms: btn.btn_wms,
                        codigo_submenu: btn.codigo_submenu,
                        icono_btn: btn.icono_btn,
                        tiene_acceso: botonesPermitidos.has(btn.identificador_btn) // Aquí haces la comparación
                    }));
                
                    return {
                        codigo_submenu: sub.codigo_submenu,
                        nombre_submenu: sub.nombre_submenu,
                        icono: sub.icono,
                        ruta: sub.ruta,
                        identificador_subm: sub.identificador_subm,
                        tiene_acceso: tieneAccesoSubmenu,
                        lgx_wms_botones: botones // Solo este, sin agregar lgx_botones_del_sistemas
                    };
                });

                return {
                    ...menu.dataValues,
                    lgx_submenus: submenus
                };
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: resultado
            };

        } catch (error) {
            try {
                next(error);
            } catch (e) { }

            jsonResponse = {
                status: 500,
                message: "Error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }//END ObtenerMenus


    /**  
    * TODO: MÉTODO PARA OBTENER LOS MENUS Y BOTONES A LOS QUE TIENE ACCESO UN ROL
    */
    static async accesosMenus(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('rol_id_lgx').notEmpty().withMessage('rol_id_lgx es requerido')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envio el usuario
            const { rol_id_lgx } = req.body;

            //Obtenemos los menus a los que el usuario tiene acceso
            const dataPermisos = await RolSubmenu.findAll({
                where: {
                    rol_id: rol_id_lgx
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
            for (const permiso of dataPermisos) {
                const { lgx_submenu } = permiso;
                const { codigo_menu, nombre_menu, orden, icono, ruta } = lgx_submenu.lgx_menu;

                if (!menuSubmenuMap[codigo_menu]) {
                    menuSubmenuMap[codigo_menu] = {
                        codigo_menu,
                        nombre_menu,
                        orden,
                        icono,
                        ruta,
                        submenus: []
                    };
                }

                // Esperamos la consulta correctamente
                let accessBtn = await RolesBotones.findAll({
                    where: {
                        rol_id: rol_id_lgx,
                        codigo_submenu: lgx_submenu.codigo_submenu
                    },
                    include: [
                        {
                            model: BotonesDelSistema
                        }
                    ]
                });

                menuSubmenuMap[codigo_menu].submenus.push({
                    codigo_submenu: lgx_submenu.codigo_submenu,
                    nombre_submenu: lgx_submenu.nombre_submenu,
                    icono: lgx_submenu.icono,
                    ruta: lgx_submenu.ruta,
                    identificador_subm: lgx_submenu.identificador_subm,
                    acceso_botones: accessBtn
                });
            }


            // Convertimos el mapa a un array de menús con sus submenús
            const menusConSubmenus = Object.values(menuSubmenuMap);

            jsonResponse = {
                status: 200,
                message: "Success",
                response: menusConSubmenus
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
    }// END accesosMenus
}

module.exports = menucontroller;