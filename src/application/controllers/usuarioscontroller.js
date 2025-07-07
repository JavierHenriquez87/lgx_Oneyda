const bcrypt = require('bcrypt'); //Libreria de encriptacion para la clave enviada por el usuario al momento de registrarse al sistema 
const moment = require('moment');
const { es } = require('date-fns/locale'); //Importar la localización en español
const AWS = require('aws-sdk');
const stream = require('stream');
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const { Op } = require('sequelize'); //Operador especial de Sequelize

/**  
* *Importación de modelos a utilizar
*/
const Usuarios = require('../models/UsuarioModel');
const Rol = require('../models/RolModel');
const Login = require('../models/LoginModel');


class usuarioscontroller {

    /**
     * TODO FUNCION PARA OBTENER USUARIOS
     */
    static async ObtenerUsuarios(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            //Obtenemos la data de los usuarios con acceso a LGX
            const usuarios = await Usuarios.findAll({
                where: {
                    acceso_logix: true,
                    usu_visualizar_clientes: null
                },
                order: [['usu_nombres', 'ASC']],
                include: [
                    {
                        model: Rol,
                        attributes: ['rol_nombre']
                    }
                ]
            });

            // Utilizamos map para modificar cada objeto dentro del array menus
            const dataUser = usuarios.map(usuarios => ({
                ...usuarios.toJSON(), // Copiamos todas las propiedades del objeto menu
                rol_nombre: usuarios.crm_rol == null ? null : usuarios.crm_rol.rol_nombre, // Agregamos la propiedad nombre_menu
                crm_rol: undefined
            }));

            //Obtenemos la información complementaria de las cartas
            const infoUsers = await Promise.all(dataUser.map(async dataU => {
                const datosUsuario = dataU;

                const datoLogin = await Login.findOne({
                    where: {
                        log_usu_id: datosUsuario.usu_id
                    },
                    attributes: ['log_username'] // Aquí especificamos los campos que necesitamos obtener
                });

                datosUsuario.log_username = datoLogin != null ? datoLogin.log_username : '-';

                return datosUsuario;
            }));


            jsonResponse = {
                status: 200,
                message: "Success",
                response: infoUsers
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
    }//END ObtenerUsuarios


    /**
     * TODO FUNCION PARA CREAR USUARIO
     */
    static async CrearUsuario(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";
        var path = null;

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('usu_rol_id').notEmpty().withMessage('Dato requerido.'),
            check('usu_nombres').notEmpty().withMessage('Dato requerido.'),
            check('usu_apellidos').notEmpty().withMessage('Dato requerido.'),
            check('usu_cargo').notEmpty().withMessage('Dato requerido.'),
            check('usu_email').notEmpty().withMessage('Dato requerido.'),
            check('log_username').notEmpty().withMessage('Dato requerido.'),
            check('log_password').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const files = req.files;
            //Si el teléfono no viene en la información lo agregamos como null
            req.body.usu_telefono = req.body.usu_telefono ?? null;

            //Guardamos en estas variables la data que envio el usuario
            const {
                usu_rol_id,
                usu_nombres,
                usu_apellidos,
                usu_cargo,
                usu_telefono,
                usu_email,
                log_username,
                log_password
            } = req.body;

            //! Busca al usuario por nombre de usuario
            const usernameExist = await Login.findOne({
                where: { log_username: log_username }
            });

            if (usernameExist) {
                jsonResponse = {
                    status: 403,
                    message: 'Success',
                    response: 'Ya existe el usuario ' + log_username
                };

                return res.status(jsonResponse.status).json(jsonResponse);
            }


            //! Busca al usuario por el email
            let emailExist = await Usuarios.findOne({ where: { usu_email: usu_email } });

            if (emailExist) {
                jsonResponse = {
                    status: 403,
                    message: 'Success',
                    response: 'Ya existe un usuario con el email ' + usu_email
                };

                return res.status(jsonResponse.status).json(jsonResponse);
            }

            //Guardamos la foto si viene en la información
            if (files || files.length > 0) {
                // Procesar cada archivo
                for (const file of files) {
                    // Nombre del archivo
                    //numero de usu_nombres + fecha + _lgx.jpeg
                    const filename = usu_nombres + '_' + Date.now() + '_lgx.jpeg';
                    path = do_path + 'Fotos_Usuarios/' + filename;

                    const spacesEndpoint = new AWS.Endpoint(do_spe + 'Fotos_Usuarios/');
                    const s3 = new AWS.S3({
                        endpoint: spacesEndpoint,
                        accessKeyId: do_spk,
                        secretAccessKey: do_sps
                    });

                    await s3.putObject({
                        Bucket: do_spn,
                        Key: filename,
                        Body: Buffer.from(file.buffer, file.buffer.length),
                        ContentLength: file.size,
                        ContentType: file.mimetype,
                        ACL: 'public-read'
                    }).promise();
                }
            }

            //Obtenemos la clave que el usuario envió en el formulario para hashearla
            const claveUsuario = log_password;

            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashedClave = bcrypt.hashSync(claveUsuario, salt); //Clave hasheada

            //Guardamos el usuario
            const saveUser = await Usuarios.create({
                usu_rol_id: usu_rol_id,
                usu_com_id: 38,
                usu_nombres: usu_nombres,
                usu_apellidos: usu_apellidos,
                usu_telefono: usu_telefono,
                usu_cargo: usu_cargo,
                usu_email: usu_email,
                usu_estado: true,
                usu_conexion: 'Local',
                acceso_logix: true,
                rol_id_lgx: usu_rol_id,
                acceso_wms: false,
                creado_por: req.user.log_usu_id,//+ ' - ' + req.user.log_username
                fecha_creacion: moment().format(),
                fotografia: path
            });

            //Obtenemos el id del usuario que recien guardamos
            const usu_id = saveUser.usu_id;

            if (saveUser) {
                //Guardamos el registro del usuario en la tabla Login
                await Login.create({
                    log_usu_id: usu_id,
                    log_username: log_username,
                    log_password: hashedClave,
                    log_estado: true
                });

                jsonResponse = {
                    status: 200,
                    message: "Success",
                    response: '¡Usuario guardado con éxito!'
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
    }//END CrearUsuario


    /**
     * TODO FUNCION PARA EDITAR USUARIO
     */
    static async EditarUsuario(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";
        var path = null;

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('usu_rol_id').notEmpty().withMessage('Dato requerido.'),
            check('usu_id').notEmpty().withMessage('Dato requerido.'),
            check('usu_nombres').notEmpty().withMessage('Dato requerido.'),
            check('usu_apellidos').notEmpty().withMessage('Dato requerido.'),
            check('usu_cargo').notEmpty().withMessage('Dato requerido.'),
            check('usu_email').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const files = req.files;
            req.body.usu_telefono = req.body.usu_telefono ?? null;

            //Guardamos en estas variables la data que envió el usuario
            const {
                usu_rol_id,
                usu_id,
                usu_nombres,
                usu_apellidos,
                usu_cargo,
                usu_telefono,
                usu_email
            } = req.body;

            // Busca si otro usuario ya tiene el email enviado
            let emailExist = await Usuarios.findOne({
                where: {
                    usu_email: usu_email,
                    usu_id: {
                        [Op.ne]: usu_id // usu_id debe ser diferente
                    }
                }
            });

            //Si el correo ya existe enviamos mensaje de error
            if (emailExist) {
                jsonResponse = {
                    status: 403,
                    message: 'Forbidden',
                    response: 'Ya existe un usuario con el email ' + usu_email
                };

                return res.status(jsonResponse.status).json(jsonResponse);
            }

            //Guardamos la foto si viene en la información
            if (files || files.length > 0) {

                // Procesar cada archivo
                for (const file of files) {
                    // Nombre del archivo
                    //numero de usu_nombres + fecha + _lgx.jpeg
                    const filename = usu_nombres + '_' + Date.now() + '_lgx.jpeg';
                    path = do_path + 'Fotos_Usuarios/' + filename;

                    const spacesEndpoint = new AWS.Endpoint(do_spe + 'Fotos_Usuarios/');
                    const s3 = new AWS.S3({
                        endpoint: spacesEndpoint,
                        accessKeyId: do_spk,
                        secretAccessKey: do_sps
                    });

                    await s3.putObject({
                        Bucket: do_spn,
                        Key: filename,
                        Body: Buffer.from(file.buffer, file.buffer.length),
                        ContentLength: file.size,
                        ContentType: file.mimetype,
                        ACL: 'public-read'
                    }).promise();
                }

                //actualizamos la data del usuario
                await Usuarios.update(
                    {
                        usu_rol_id: usu_rol_id,
                        rol_id_lgx: usu_rol_id,
                        usu_nombres: usu_nombres,
                        usu_apellidos: usu_apellidos,
                        usu_telefono: usu_telefono,
                        usu_cargo: usu_cargo,
                        usu_email: usu_email,
                        fotografia: path,
                        modificado_por: req.user.log_usu_id,// + ' - ' + req.user.log_username,
                        fecha_modificacion: moment().format()
                    },
                    {
                        where: { usu_id: usu_id }
                    }
                );
            } else {
                //actualizamos la data del usuario si no viene nueva foto
                await Usuarios.update(
                    {
                        usu_rol_id: usu_rol_id,
                        usu_nombres: usu_nombres,
                        usu_apellidos: usu_apellidos,
                        usu_telefono: usu_telefono,
                        usu_cargo: usu_cargo,
                        usu_email: usu_email,
                        modificado_por: req.user.log_usu_id + ' - ' + req.user.log_username,
                        fecha_modificacion: moment().format()
                    },
                    {
                        where: { usu_id: usu_id }
                    }
                );
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: '¡Usuario editado con éxito!'
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
    }//END EditarUsuario


    /**
     * TODO FUNCIÓN PARA EDITAR ESTADO DE USUARIO
     */
    static async EstadoUsuario(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('usu_id').notEmpty().withMessage('Dato requerido.'),
            check('acceso_logix').notEmpty().withMessage('Dato requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const {
                usu_id,
                acceso_logix
            } = req.body;

            //actualizamos la data del usuario
            await Usuarios.update(
                // Datos a actualizar
                {
                    acceso_logix: acceso_logix,
                    modificado_por: req.user.log_usu_id + ' - ' + req.user.log_username,
                    fecha_modificacion: moment().format()
                },
                {
                    where: { usu_id: usu_id }
                }
            );

            jsonResponse = {
                status: 200,
                message: "Success",
                response: '¡Se modifico el estado del usuario con éxito!'
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
    }//END DesactivarUsuario
}

module.exports = usuarioscontroller;