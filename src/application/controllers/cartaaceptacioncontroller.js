const moment = require('moment-timezone');
require('moment/locale/es'); // Importa el idioma español
// Configuramos el idioma español globalmente
moment.locale('es');
const { logsUsers } = require('../logs/logsUser'); // Guardar Logs de usuarios
const router = require('express').Router();
const bcrypt = require('bcrypt'); //Libreria de encriptacion para la clave enviada por el usuario al momento de registrarse al sistema 
const { es } = require('date-fns/locale'); //Importar la localización en español
const AWS = require('aws-sdk');
const stream = require('stream');
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const { Op, Sequelize } = require('sequelize'); //Operador especial de Sequelize
const puppeteer = require('puppeteer');
const path = require('path');

/**  
* * Importación de modelos a utilizar
*/
const CartaAceptacion = require('../models/CartaAceptacionModel');
const InformeGuardaAlmacen = require('../models/InformeGuardaAlmacenModel');
const Transportistas = require('../models/TransportistaModel');
const Aduanas = require('../models/AduanasModel');
const Clientes = require('../models/ClientesModel');
const Salidas = require('../models/SalidasModel');
const DetalleCA = require('../models/DetalleCartaAceptacionModel');
const PilotosCAceptacion = require('../models/WMS_PilotosCartasModel');
const CorrelativosInformes = require('../models/CorrelativosInformesModel');
const helpercontroller = require('../controllers/helpercontroller');
const EstadosAlmacenaje = require('../models/EstadosAlmacenajeModel');
const TipoDocTransporte = require('../models/TipoDocTransporteModel');
const Pais = require('../models/PaisModel');
const Usuarios = require('../models/UsuarioModel');
const Roles = require('../models/RolModel');
const Logs = require('../models/LogsModel');
const Docs = require('../models/DocsModel');

class cartaaceptacioncontroller {

    /**
     * TODO FUNCIÓN PARA BUSCAR CARTAS DE ACEPTACIÓN EN LA BÚSQUEDA INICIAL DE LOGIX
     */
    static async FiltroInicialCA(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('datobusqueda').notEmpty().withMessage('Dato requerido.'),
            check('tipobusqueda').notEmpty().withMessage('Dato requerido.') //Carta o Informe
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { datobusqueda, tipobusqueda } = req.body; //Parámetros que el usuario envió
            var dataCarta = null; // Variable donde se guardara la información que se devolverá al usuario

            //Verificamos si la búsqueda fue enviada por parámetro de carta
            if (tipobusqueda == 'Contenedor') {
                //Buscamos la carta según el parámetro ingresado
                dataCarta = await CartaAceptacion.findAll({
                    include: [
                        {
                            model: Transportistas
                        },
                        {
                            model: Aduanas
                        }
                    ],
                    where: {
                        cac_contenedor: {
                            [Op.like]: `%${datobusqueda}%`
                        }
                    }
                });

                if (dataCarta && dataCarta.length > 0) {
                    dataCarta = dataCarta.map((carta) => {
                        return {
                            ...carta.toJSON(),
                            archivo: carta.de_lgx
                                ? carta.cac_pdf
                                : 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + carta.cac_pdf
                        };
                    });
                }

            } else if (tipobusqueda == 'Carta') {
                //Buscamos la carta según el parámetro ingresado
                dataCarta = await CartaAceptacion.findAll({
                    include: [
                        {
                            model: Transportistas
                        },
                        {
                            model: Aduanas
                        }
                    ],
                    where: {
                        cac_numero: datobusqueda
                    }
                });

                if (dataCarta && dataCarta.length > 0) {
                    dataCarta = dataCarta.map((carta) => {
                        return {
                            ...carta.toJSON(),
                            archivo: carta.de_lgx
                                ? carta.cac_pdf
                                : 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + carta.cac_pdf
                        };
                    });
                }

            } else {
                //Verificamos si la búsqueda fue enviada por parámetro de informe
                const dataInforme = await InformeGuardaAlmacen.findOne({
                    where: {
                        iga_codigo: datobusqueda
                    }
                });

                //Verificamos si se encontro un informe con el parametro enviado
                if (dataInforme) {
                    //Obtenemos el id del registro encontrado
                    const cac_id = dataInforme.iga_cac_id;

                    //Buscamos la carta a la que pertenece el informe encontrado
                    dataCarta = await CartaAceptacion.findAll({
                        include: [
                            {
                                model: Transportistas
                            },
                            {
                                model: Aduanas
                            }
                        ],
                        where: {
                            cac_id: cac_id
                        }
                    });

                    if (dataCarta && dataCarta.length > 0) {
                        dataCarta = dataCarta.map((carta) => {
                            return {
                                ...carta.toJSON(),
                                archivo: carta.de_lgx
                                    ? carta.cac_pdf
                                    : 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + carta.cac_pdf
                            };
                        });
                    }
                }
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: dataCarta
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
    }//END FiltroInicialCA


    /**
    * TODO FUNCIÓN PARA BUSCAR INFORMES DE GUARDA ALMACÉN EN LA BÚSQUEDA INICIAL DE LOGIX
    */
    static async FiltroInicialIGA(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('datobusqueda').notEmpty().withMessage('Dato requerido.'),
            check('tipobusqueda').notEmpty().withMessage('Dato requerido.') //Carta, Cliente o Informe
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { datobusqueda, tipobusqueda } = req.body; //Parámetros que el usuario envió
            let dataInforme = []; // Variable donde se guardara la información que se devolverá al usuario

            if (tipobusqueda == 'Carta') {
                const dataCarta = await CartaAceptacion.findOne({
                    where: {
                        cac_numero: datobusqueda
                    }
                });

                if (dataCarta) {
                    dataInforme = await InformeGuardaAlmacen.findAll({
                        include: [
                            {
                                model: CartaAceptacion
                            },
                            {
                                model: Clientes
                            }
                        ],
                        where: {
                            iga_cac_id: dataCarta.cac_id,
                            iga_estado: 1
                        },
                        order: [['iga_fecha', 'DESC']],
                    });

                    if (dataInforme && dataInforme.length > 0) {
                        dataInforme = dataInforme.map(dataI => {
                            return {
                                ...dataI.toJSON(),  // Convierte el objeto Sequelize a JSON para obtener solo los datos
                                archivo: 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/' + dataI.iga_archivo
                            };
                        });
                    }
                }
            } else if (tipobusqueda == 'Cliente') {
                dataInforme = await InformeGuardaAlmacen.findAll({
                    include: [
                        {
                            model: CartaAceptacion
                        },
                        {
                            model: Clientes
                        }
                    ],
                    where: {
                        iga_cli_id: datobusqueda,
                        iga_estado: 1
                    },
                    order: [['iga_fecha', 'DESC']],
                });

                if (dataInforme && dataInforme.length > 0) {
                    dataInforme = dataInforme.map(dataI => {
                        return {
                            ...dataI.toJSON(),  // Convierte el objeto Sequelize a JSON para obtener solo los datos
                            archivo: 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/' + dataI.iga_archivo
                        };
                    });
                }
            } else {
                dataInforme = await InformeGuardaAlmacen.findAll({
                    include: [
                        {
                            model: CartaAceptacion
                        },
                        {
                            model: Clientes
                        }
                    ],
                    where: {
                        iga_codigo: datobusqueda,
                        iga_estado: 1
                    },
                    order: [['iga_fecha', 'DESC']],
                });

                if (dataInforme && dataInforme.length > 0) {
                    dataInforme = dataInforme.map(dataI => {
                        return {
                            ...dataI.toJSON(),  // Convierte el objeto Sequelize a JSON para obtener solo los datos
                            archivo: 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/' + dataI.iga_archivo
                        };
                    });
                }
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: dataInforme
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
    }//END FiltroInicialIGA


    /**
    * TODO FUNCIÓN PARA BUSCAR SALIDAS EN LA BÚSQUEDA INICIAL DE LOGIX
    */
    static async FiltroInicialSalidas(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('datobusqueda').notEmpty().withMessage('Dato requerido.'),
            check('tipobusqueda').notEmpty().withMessage('Dato requerido.') //Salida o Cliente
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { datobusqueda, tipobusqueda } = req.body; //Parámetros que el usuario envió
            let dataSalida = []; // Variable donde se guardara la información que se devolverá al usuario
            let whereConditionsSearch = {}; //Variable que tendra la condicion de busqueda

            //Validamos si quiere buscar salidas de un cliente
            if (tipobusqueda == 'Cliente') {
                whereConditionsSearch[Op.and] = [
                    {
                        sal_cli_id: datobusqueda
                    }
                ];
            } else {
                //Condicion de busqueda por codigo de salida
                whereConditionsSearch[Op.and] = [
                    {
                        sal_codigo: datobusqueda
                    }
                ];
            }

            dataSalida = await Salidas.findAll({
                include: [
                    {
                        model: Clientes
                    }
                ],
                where: whereConditionsSearch,
                order: [['sal_fechadm', 'DESC']],
            });

            if (dataSalida && dataSalida.length > 0) {
                // Obtenemos la información complementaria de las cartas
                dataSalida = dataSalida.map(dataS => {
                    return {
                        ...dataS.toJSON(),  // Convierte el objeto Sequelize a JSON para obtener solo los datos
                        archivo: 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_salidas_aduana/' + dataS.sal_codigo + '.pdf'
                    };
                });
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: dataSalida
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
    }//END FiltroInicialSalidas


    /**
    * TODO FUNCIÓN PARA OBTENER LISTADO DE CARTAS DE ACEPTACIÓN
    */
    static async ObtenerCA(req, res, next) {
        var jsonResponse = { status: 500, message: "", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('page').notEmpty().withMessage('Number page is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            req.body.tra_nombre = req.body.tra_nombre ?? null;
            req.body.datobusqueda = req.body.datobusqueda ?? null;

            //Guardamos en estas variables la data que envió el usuario
            const { page, tra_nombre, datobusqueda } = req.body;
            const numPag = page;
            const limitePorPagina = 50; // Número de cartas por página

            // Inicializamos el objeto where
            let whereConditions = {};
            let whereConditionsCA = {};

            // Si cli_nombre tiene un valor, agregamos la condición de búsqueda
            if (tra_nombre) {
                whereConditions[Op.and] = [
                    {
                        tra_nombre: {
                            [Op.like]: `%${tra_nombre}%`
                        }
                    }
                ];
            }

            // Si cac_numero tiene un valor, agregamos la condición de búsqueda
            if (datobusqueda) {
                whereConditionsCA[Op.and] = [
                    {
                        cac_numero: {
                            [Op.like]: `%${datobusqueda}%`
                        }
                    }
                ];
            }

            //Obtenemos la data de los clientes
            const caCount = await CartaAceptacion.count({
                where: whereConditionsCA,
                include: [
                    {
                        model: Transportistas,
                        where: whereConditions
                    }
                ]
            });

            // Calcula el número total de páginas
            const total_pages = Math.ceil(caCount / limitePorPagina);

            //Obtenemos la data de las cartas de aceptacion
            let dataCarta = await CartaAceptacion.findAll({
                where: whereConditionsCA,
                include: [
                    {
                        model: Transportistas,
                        where: whereConditions
                    },
                    {
                        model: Aduanas
                    },
                    {
                        model: PilotosCAceptacion,
                        attributes: [
                            'apertura_completada',
                            [ // Agregar una columna calculada "estado"
                                Sequelize.literal(`
                                    CASE
                                        WHEN apertura_completada = 0 AND firmado_token = 0 THEN 'Apertura de Contenedor'
                                        WHEN apertura_completada = 1 AND firmado_token = 1 THEN 'Finalizado'
                                        ELSE 'Recepcionando'
                                    END
                                `),
                                'estado' // Alias para la columna calculada
                            ]
                        ]
                    },
                    {
                        model: DetalleCA,
                        include: [
                            {
                                model: Clientes
                            }
                        ]
                    }
                ],
                limit: limitePorPagina,
                offset: (numPag - 1) * limitePorPagina,
                order: [['cac_fecha', 'desc']]
            });

            if (dataCarta && dataCarta.length > 0) {
                let nuevasCartas = [];

                for (const carta of dataCarta) {
                    let fecha = moment(carta.cac_fecha).tz('America/El_Salvador').format('YYYY-MM-DD HH:mm:ss');
                    let conInformes = 0;

                    let countInformes = await DetalleCA.count({
                        where: {
                            cad_iga_creado: {
                                [Op.ne]: 0  // diferente de 0
                            },
                            cad_cac_id: carta.cac_id
                        }
                    });

                    if (countInformes > 0) {
                        conInformes = 1;
                    }

                    let cartaTransformada = {
                        ...carta.toJSON(),
                        cac_fecha: fecha,
                        bloquear_info: conInformes,
                        archivo: carta.de_lgx
                            ? carta.cac_pdf
                            : 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + carta.cac_pdf
                    };

                    if (!carta.wms_pilotos_cartaaceptacion) {
                        cartaTransformada.wms_pilotos_cartaaceptacion = {
                            "apertura_completada": 1,
                            "estado": "En Espera"
                        };
                    }

                    nuevasCartas.push(cartaTransformada);
                }

                dataCarta = nuevasCartas;
            }



            const data = {
                total_registros: caCount,
                total_paginas: total_pages,
                registros_por_pagina: limitePorPagina,
                data: dataCarta
            };

            jsonResponse = {
                status: 200,
                message: "Success",
                response: data
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
    }//END ObtenerCA


    /**
    * TODO FUNCIÓN PARA GUARDAR NUEVAS CARTAS DE ACEPTACIÓN 
    */
    static async CrearCA(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";
        var path = null;
        let cac_totalbl = 0;
        let cac_totalpeso = 0;
        let cac_totalcbm = 0;

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('cac_tipo_carga').notEmpty().withMessage('cac_tipo_carga is required.'),
            check('cac_contenedor').notEmpty().withMessage('cac_contenedor is required.'),
            check('cac_tipocontenedor').notEmpty().withMessage('cac_tipocontenedor is required.'),
            check('cac_tra_id').notEmpty().withMessage('cac_tra_id is required.'),
            check('cac_adu_id').notEmpty().withMessage('cac_adu_id is required.'),
            check('cac_tdt_id').notEmpty().withMessage('cac_tdt_id is required.'),
            check('cac_stal_id').notEmpty().withMessage('cac_stal_id is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //! OBTENEMOS EL CORRELATIVO QUE OCUPARA LA CARTA DE ACEPTACIÓN
            const correlativoCA = await cartaaceptacioncontroller.ObtenerCorrelativoCA();

            //Guardamos en estas variables la data que envió el usuario
            const {
                cac_tipo_carga,
                cac_contenedor,
                cac_tipocontenedor,
                cac_tra_id,
                cac_adu_id,
                cac_tdt_id,
                cac_stal_id
            } = req.body;

            if (!req.body.cac_detalle_clientes || req.body.cac_detalle_clientes.trim() === '') {
                return res.status(400).json({ success: false, message: "Debe enviar al menos un cliente.." });
            }

            const dataArrayClientes = JSON.parse(req.body.cac_detalle_clientes); // Convertir el string JSON a array

            // Validar que sea un array y que tenga al menos un objeto
            if (!Array.isArray(dataArrayClientes) || dataArrayClientes.length === 0) {
                return res.status(400).json({ success: false, message: "Debe enviar al menos un cliente." });
            }

            //! OBTENEMOS LA INFORMACIÓN DEL ARCHIVO QUE ACABAMOS DE ADJUNTAR A LA CARTA
            const archivoManifiesto = req.files['cac_manifiesto_archivo'] ? req.files['cac_manifiesto_archivo'][0] : null;

            //TODO: Guardamos el manifiesto de la carta de aceptación
            if (archivoManifiesto) {
                // Obtener la extensión del archivo usando la función
                let extension = await helpercontroller.getExtensionFromMimeType(archivoManifiesto.mimetype);
                // Nombre del archivo
                const filename = correlativoCA + '-manifiesto' + extension;
                path = do_path + 'Manifiestos/' + filename;

                const spacesEndpoint = new AWS.Endpoint(do_spe + 'Manifiestos/');

                const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: do_spk,
                    secretAccessKey: do_sps
                });

                await s3.putObject({
                    Bucket: do_spn,
                    Key: filename,
                    Body: Buffer.from(archivoManifiesto.buffer, archivoManifiesto.buffer.length),
                    ContentLength: archivoManifiesto.size,
                    ContentType: archivoManifiesto.mimetype,
                    ACL: 'public-read'
                }).promise();
            } else {
                jsonResponse = {
                    status: 400,
                    message: "Bad Request",
                    response: "El manifiesto es obligatorio adjuntarlo al crear la carta de aceptación."
                };

                return res.status(jsonResponse.status).json(jsonResponse);
            }

            //TODO: Con esto obtenemos los totales de bl, peso y volumen
            for (const cliente of dataArrayClientes) {
                try {
                    cac_totalbl += cliente.cad_cantbultos;
                    cac_totalpeso += cliente.cad_peso;
                    cac_totalcbm += cliente.cad_cbm;

                    let pais = await Pais.findOne({
                        where: {
                            pai_id: cliente.cad_pai_id
                        }
                    });

                    // Si se encontró el país, asignamos el nombre al cliente
                    cliente.pais = pais ? pais.pai_nombre : "Desconocido";

                    let dataCliente = await Clientes.findOne({
                        where: {
                            cli_id: cliente.cad_cli_id
                        }
                    });

                    // Si se encontró el país, asignamos el nombre al cliente
                    cliente.cliente = dataCliente ? dataCliente.cli_nombre : "Desconocido";
                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) {
                    }
                }
            }

            const saveCarta = await CartaAceptacion.create({
                cac_com_id: 38,
                cac_usu_id: req.user.log_usu_id,
                cac_guardalmacen_usu_id: req.user.log_usu_id,
                cac_numero: correlativoCA,
                cac_contenedor,
                cac_tipocontenedor,
                cac_tra_id,
                cac_adu_id: parseInt(cac_adu_id, 10),
                cac_fecha: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
                cac_fecha_vigencia: moment().utc().add(30, 'days').format("YYYY-MM-DD HH:mm:ss"),
                cac_guardalmacen: 0,
                cac_totalbl: cac_totalbl,
                cac_totalpeso: cac_totalpeso,
                cac_totalcbm: cac_totalcbm,
                cac_tdt_id,
                cac_estado: 1,
                cac_estado_ingreso: 1, //! CORREGIR VALOR DE DONDE VIENE
                cac_tipo_carga,
                cac_tiempo: "00:00:00",
                cac_manifiesto_archivo: path,
                cac_stal_id, //TODO: tipo de regimen
                de_lgx: true //TODO: Indicamos que la carta fue creada desde Logix
            });


            //! ====================================================================
            //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
            //! ====================================================================
            try {
                // Definimos la data que se guardara en el logs de usuarios
                const datalogs = {
                    "usuario": req.user.log_username,
                    "tipo_de_evento": "Crear Carta Aceptación",
                    "fecha_del_evento": moment().format(),
                    "tabla_afectada": "clg_cac_aceptacion",
                    "info_antes_de_modificar": null,
                    "info_despues_de_modificar": JSON.stringify(saveCarta),
                    "id_principal": saveCarta.cac_id,
                    "tipo_registro": "Carta"
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


            //TODO: AQUI VA EL GUARDADO DEL DETALLE DE LA CARTA
            for (const cliente of dataArrayClientes) {
                try {
                    let detCA = await DetalleCA.create({
                        cad_cac_id: saveCarta.cac_id,
                        cad_bl: cliente.cad_bl,
                        cad_cantbultos: cliente.cad_cantbultos,
                        cad_cli_id: cliente.cad_cli_id,
                        cad_peso: cliente.cad_peso,
                        cad_cbm: cliente.cad_cbm,
                        cad_pai_id: cliente.cad_pai_id,
                        cad_pro_number: cliente.cad_pro_number,
                        cad_tarifa_diferenciada: cliente.cad_tarifa_diferenciada,
                        cad_logistic_free: 0,
                        posicion_orden: cliente.posicion_orden,
                    });


                    //! ====================================================================
                    //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
                    //! ====================================================================
                    try {
                        // Definimos la data que se guardara en el logs de usuarios
                        let datalogs = {
                            "usuario": req.user.log_username,
                            "tipo_de_evento": "Crear Detalle C.A.",
                            "fecha_del_evento": moment().format(),
                            "tabla_afectada": "clg_cad_detalleaceptacion",
                            "info_antes_de_modificar": null,
                            "info_despues_de_modificar": JSON.stringify(detCA),
                            "id_principal": detCA.cad_id,
                            "tipo_registro": "Detalle Carta"
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

                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) {
                    }
                }
            }


            //* Obtenemos informacione del estado de almacenaje
            const estadoAlmacenaje = await EstadosAlmacenaje.findOne({
                where: {
                    stal_id: cac_stal_id
                }
            });

            //* Obtenemos informacion del tipo de documento de transporte
            const docTransporte = await TipoDocTransporte.findOne({
                where: {
                    tdt_id: cac_tdt_id
                }
            });

            //* Obtenemos informacion de la aduana
            const aduana = await Aduanas.findOne({
                where: {
                    adu_id: cac_adu_id
                }
            });

            //* Obtenemos informacion del transportista
            const Transportista = await Transportistas.findOne({
                where: {
                    tra_id: cac_tra_id
                }
            });

            //* Obtenemos informacion del usuario que esta creando la carta
            const dataUsuario = await Usuarios.findOne({
                where: {
                    usu_id: req.user.log_usu_id
                },
                include: [
                    {
                        model: Roles
                    }
                ]
            });

            //TODO: Aumentamos el correlativo de las cartas
            await cartaaceptacioncontroller.AumentarCorrelativoCA();

            //************************************************************* */
            // TODO: INICIAMOS PUPPETEER
            //************************************************************* */
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                ignoreHTTPSErrors: true
            });

            // Obtener el contenido HTML con variables dinámicas
            const html = await new Promise((resolve, reject) => {
                res.render('formatoCA', {
                    cartaNumero: correlativoCA,
                    fecha: moment().format("DD-MM-YYYY"),
                    docTransporte: docTransporte.tdt_abreviatura,
                    estadoAlmacenaje: estadoAlmacenaje.stal_estado,
                    cac_tipocontenedor: cac_tipocontenedor,
                    cac_contenedor: cac_contenedor,
                    aduana: aduana.adu_nombre,
                    transportista: Transportista.tra_nombre ?? "N/A",
                    consignatarios: dataArrayClientes,
                    totalBl: cac_totalbl,
                    totalPeso: cac_totalpeso,
                    totalCBM: cac_totalcbm,
                    creada_por: dataUsuario.usu_nombres + ' ' + dataUsuario.usu_apellidos ?? 'CLG',
                    rol: dataUsuario.crm_rol.rol_nombre
                }, (err, html) => {
                    if (err) reject(err);
                    resolve(html);
                });
            });

            //Creamos una nueva pagina (instancia)
            const page = await browser.newPage();
            //Seteamos el contenido de la pagina a Puppeteer
            await page.setContent(html);
            // To reflect CSS used for screens instead of print
            await page.emulateMediaType('screen');


            const footerHtml = await new Promise((resolve, reject) => {
                res.render('footer', {}, (err, footerHtml) => {
                    if (err) reject(err);
                    resolve(footerHtml);
                });
            });


            // Download the PDF
            const pdfBuffer = await page.pdf({
                path: `CartaAceptacion_${correlativoCA}.pdf`,
                displayHeaderFooter: true,
                headerTemplate: '<div style="margin-right: 50px; font-size:10px; text-align:right; width:100%;">Fecha de creación: ' + moment().format("DD-MM-YYYY") + '</div>',
                footerTemplate: `
                <div style="
                    width: 100%;
                    text-align: center;
                    font-size: 12px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    ${footerHtml}
                </div>
                `,
                margin: { top: '30px', right: '50px', bottom: '50px', left: '50px' },
                printBackground: true,
                format: 'Letter'
            });

            //Si lo quisieramos convertir a Base64 
            //const pdfBase64 = pdfBuffer.toString('base64');

            await browser.close();


            // Nombre del archivo
            const filename = correlativoCA + '.pdf';
            const path_carta = do_path + 'Cartas_Aceptacion/' + filename;

            // Configurar el endpoint de DigitalOcean Spaces
            const spacesEndpoint = new AWS.Endpoint(do_spe + 'Cartas_Aceptacion/');
            // Configurar S3 con las credenciales de DigitalOcean Spaces
            const s3 = new AWS.S3({
                endpoint: spacesEndpoint,
                accessKeyId: do_spk,
                secretAccessKey: do_sps
            });

            await s3.putObject({
                Bucket: do_spn,
                Key: filename,
                Body: pdfBuffer,
                ACL: 'public-read',
                ContentType: 'application/pdf'
            }).promise();

            //* Actualizamos la carta agregando el path_carta del pdf de la carta recien creado 
            await CartaAceptacion.update(
                {
                    cac_pdf: path_carta
                },
                {
                    where: { cac_id: saveCarta.cac_id }
                }
            );


            jsonResponse = {
                status: 200,
                message: "Success",
                response: "Carta de Aceptación #" + correlativoCA + " creada con éxito!"
            };
        }
        catch (error) {
            //! Registramos el error capturado
            try {
                console.log(error);
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
    }//END CrearCA


    /**
    * TODO FUNCIÓN PARA OBTENER INFORMACION DE UNA CARTA DE ACEPTACION
    */
    static async InfoCA(req, res, next) {
        var jsonResponse = { status: 500, message: "", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('cac_id').notEmpty().withMessage('cac_id page is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const { cac_id } = req.body;

            //Obtenemos la data de las cartas de aceptacion
            let dataCarta = await CartaAceptacion.findOne({
                where: {
                    cac_id: cac_id
                },
                include: [
                    {
                        model: Transportistas
                    },
                    {
                        model: Aduanas
                    },
                    {
                        model: PilotosCAceptacion,
                        attributes: [
                            'apertura_completada',
                            [ // Agregar una columna calculada "estado"
                                Sequelize.literal(`
                                    CASE
                                        WHEN apertura_completada = 0 AND firmado_token = 0 THEN 'Apertura de Contenedor'
                                        WHEN apertura_completada = 1 AND firmado_token = 1 THEN 'Finalizado'
                                        ELSE 'Recepcionando'
                                    END
                                `),
                                'estado' // Alias para la columna calculada
                            ]
                        ]
                    },
                    {
                        model: DetalleCA,
                        include: [
                            {
                                model: Clientes
                            }
                        ]
                    }
                ]
            });

            if (dataCarta) {
                if (!dataCarta.wms_pilotos_cartaaceptacion) {
                    let dataCAPiloto = [
                        {
                            "apertura_completada": 1,
                            "estado": "En Espera"
                        }
                    ];

                    dataCarta.wms_pilotos_cartaaceptacion = dataCAPiloto;
                }

                dataCarta.archivo = dataCarta.de_lgx
                    ? dataCarta.cac_pdf
                    : 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + dataCarta.cac_pdf;

            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: dataCarta
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
    }//END InfoCA


    /**
    * TODO FUNCIÓN PARA GUARDAR NUEVAS CARTAS DE ACEPTACIÓN
    */
    static async EditarCA(req, res, next) {
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
            check('cac_id').notEmpty().withMessage('cac_id is required.'),
            check('cac_contenedor').notEmpty().withMessage('cac_contenedor is required.'),
            check('cac_tipocontenedor').notEmpty().withMessage('cac_tipocontenedor is required.'),
            check('cac_tra_id').notEmpty().withMessage('cac_tra_id is required.'),
            check('cac_adu_id').notEmpty().withMessage('cac_adu_id is required.'),
            check('cac_tdt_id').notEmpty().withMessage('cac_adu_id is required.'),
            check('motivo_correccion').notEmpty().withMessage('motivo_correccion is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const {
                cac_id,
                cac_contenedor,
                cac_tipocontenedor,
                cac_tra_id,
                cac_adu_id,
                cac_tdt_id,
                motivo_correccion
            } = req.body;

            //! OBTENEMOS INFORMACION DE LA CARTA Y SETEAMOS LOS VALORES ACTUALES QUE TIENE LA CARTA EN EL BL, PESO Y CBM
            const cartaA = await CartaAceptacion.findByPk(cac_id);
            let saveCarta = null;
            let cac_totalbl = 0;
            let cac_totalpeso = 0;
            let cac_totalcbm = 0;

            //! VALIDAMOS QUE EL OBJETO TRAIGA AL MENOS UN CLIENTE REGISTRADO
            if (!req.body.cac_detalle_clientes || req.body.cac_detalle_clientes.trim() === '') {
                return res.status(400).json({ success: false, message: "Debe enviar al menos un cliente.." });
            }

            const dataArrayClientes = JSON.parse(req.body.cac_detalle_clientes); // Convertir el string JSON a array

            // Validar que sea un array y que tenga al menos un objeto
            if (!Array.isArray(dataArrayClientes) || dataArrayClientes.length === 0) {
                return res.status(400).json({ success: false, message: "Debe enviar al menos un cliente." });
            }


            //! OBTENEMOS LA INFORMACIÓN DEL ARCHIVO QUE ACABAMOS DE ADJUNTAR A LA CARTA
            const archivoManifiesto = req.files['cac_manifiesto_archivo'] ? req.files['cac_manifiesto_archivo'][0] : null;

            //TODO: Actualizamos el manifiesto de la carta de aceptación si al editar se envia de nuevo
            if (archivoManifiesto) {
                // Obtener la extensión del archivo usando la función 
                let extension = await helpercontroller.getExtensionFromMimeType(archivoManifiesto.mimetype);
                // Nombre del archivo
                const filename = cartaA.cac_numero + '-manifiesto' + extension;
                path = do_path + 'Manifiestos/' + filename;

                const spacesEndpoint = new AWS.Endpoint(do_spe + 'Manifiestos/');

                const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: do_spk,
                    secretAccessKey: do_sps
                });

                await s3.putObject({
                    Bucket: do_spn,
                    Key: filename,
                    Body: Buffer.from(archivoManifiesto.buffer, archivoManifiesto.buffer.length),
                    ContentLength: archivoManifiesto.size,
                    ContentType: archivoManifiesto.mimetype,
                    ACL: 'public-read'
                }).promise();
            }

            //TODO: Con esto obtenemos los totales de bl, peso y volumen
            for (const cliente of dataArrayClientes) {
                try {
                    cac_totalbl += parseFloat(cliente.cad_cantbultos) || 0;
                    cac_totalpeso += parseFloat(cliente.cad_peso) || 0;
                    cac_totalcbm += parseFloat(cliente.cad_cbm) || 0;

                    let pais = await Pais.findOne({
                        where: {
                            pai_id: cliente.cad_pai_id
                        }
                    });

                    // Si se encontró el país, asignamos el pais del cliente
                    cliente.pais = pais ? pais.pai_nombre : "Desconocido";

                    let dataCliente = await Clientes.findOne({
                        where: {
                            cli_id: cliente.cad_cli_id
                        }
                    });

                    // Si se encontró el cliente, asignamos el nombre al cliente
                    cliente.cliente = dataCliente ? dataCliente.cli_nombre : "Desconocido";
                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) {
                    }
                }
            }

            cac_totalpeso = cac_totalpeso.toFixed(3);
            cac_totalcbm = cac_totalcbm.toFixed(3);

            //! SI PATH ES DIFERENTE DE NULL ES PORQUE SI SE ENVIO UN NUEVO MANIFIESTO Y ACTUALIZAMOS
            if (path) {
                saveCarta = await CartaAceptacion.update(
                    {
                        cac_contenedor,
                        cac_tipocontenedor,
                        cac_tra_id,
                        cac_adu_id: parseInt(cac_adu_id, 10),
                        cac_tdt_id,
                        cac_manifiesto_archivo: path,
                        de_lgx: true

                    },
                    {
                        where: {
                            cac_id: cac_id
                        }
                    }
                );
            } else {
                saveCarta = await CartaAceptacion.update(
                    {
                        cac_contenedor,
                        cac_tipocontenedor,
                        cac_tra_id,
                        cac_tdt_id,
                        cac_adu_id: parseInt(cac_adu_id, 10)
                    },
                    {
                        where: {
                            cac_id: cac_id
                        }
                    }
                );
            }


            //! ====================================================================
            //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
            //! ====================================================================
            try {
                // Definimos la data que se guardara en el logs de usuarios
                const datalogs = {
                    "usuario": req.user.log_username,
                    "tipo_de_evento": "Editar Carta Aceptación",
                    "fecha_del_evento": moment().format(),
                    "tabla_afectada": "clg_cac_aceptacion",
                    "info_antes_de_modificar": JSON.stringify(cartaA),
                    "info_despues_de_modificar": JSON.stringify(saveCarta),
                    "id_principal": cac_id,
                    "tipo_registro": "Carta",
                    "motivo_correccion": motivo_correccion
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



            //TODO: AQUI VA EL GUARDADO DEL DETALLE DE LA CARTA
            for (const cliente of dataArrayClientes) {
                try {
                    let detCartaA = await DetalleCA.findByPk(cliente.cad_id);

                    let detCA = await DetalleCA.update(
                        {
                            cad_bl: cliente.cad_bl,
                            cad_cantbultos: cliente.cad_cantbultos,
                            cad_cli_id: cliente.cad_cli_id,
                            cad_peso: cliente.cad_peso,
                            cad_cbm: cliente.cad_cbm,
                            cad_pai_id: cliente.cad_pai_id,
                            cad_pro_number: cliente.cad_pro_number,
                            cad_tarifa_diferenciada: cliente.cad_tarifa_diferenciada
                        },
                        {
                            where: {
                                cad_id: cliente.cad_id
                            }
                        }
                    );


                    //! ====================================================================
                    //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
                    //! ====================================================================
                    try {
                        // Definimos la data que se guardara en el logs de usuarios
                        let datalogs = {
                            "usuario": req.user.log_username,
                            "tipo_de_evento": "Editar Detalle C.A.",
                            "fecha_del_evento": moment().format(),
                            "tabla_afectada": "clg_cad_detalleaceptacion",
                            "info_antes_de_modificar": JSON.stringify(detCartaA),
                            "info_despues_de_modificar": JSON.stringify(detCA),
                            "id_principal": cliente.cad_id,
                            "tipo_registro": "Detalle Carta",
                            "motivo_correccion": motivo_correccion
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

                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) {
                    }
                }
            }


            try {
                const cartaActualizada = await CartaAceptacion.findByPk(cac_id);

                //* Obtenemos informacione del estado de almacenaje
                const estadoAlmacenaje = await EstadosAlmacenaje.findOne({
                    where: {
                        stal_id: cartaActualizada.cac_stal_id
                    }
                });

                //* Obtenemos informacion del tipo de documento de transporte
                const docTransporte = await TipoDocTransporte.findOne({
                    where: {
                        tdt_id: cartaActualizada.cac_tdt_id
                    }
                });

                //* Obtenemos informacion de la aduana
                const aduana = await Aduanas.findOne({
                    where: {
                        adu_id: cartaActualizada.cac_adu_id
                    }
                });

                //* Obtenemos informacion del transportista
                const Transportista = await Transportistas.findOne({
                    where: {
                        tra_id: cartaActualizada.cac_tra_id
                    }
                });

                //* Obtenemos informacion del usuario que esta creando la carta
                const dataUsuario = await Usuarios.findOne({
                    where: {
                        usu_id: cartaActualizada.cac_usu_id
                    },
                    include: [
                        {
                            model: Roles
                        }
                    ]
                });


                //************************************************************* */
                // TODO: INICIAMOS PUPPETEER
                //************************************************************* */
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    ignoreHTTPSErrors: true
                });

                // Obtener el contenido HTML con variables dinámicas
                const html = await new Promise((resolve, reject) => {
                    res.render('formatoCA', {
                        cartaNumero: cartaActualizada.cac_numero,
                        fecha: cartaActualizada.cac_fecha,
                        docTransporte: docTransporte.tdt_abreviatura,
                        estadoAlmacenaje: estadoAlmacenaje.stal_estado,
                        cac_tipocontenedor: cac_tipocontenedor,
                        cac_contenedor: cac_contenedor,
                        aduana: aduana.adu_nombre,
                        transportista: Transportista.tra_nombre ?? "N/A",
                        consignatarios: dataArrayClientes,
                        totalBl: cac_totalbl,
                        totalPeso: cac_totalpeso,
                        totalCBM: cac_totalcbm,
                        creada_por: dataUsuario.usu_nombres + ' ' + dataUsuario.usu_apellidos ?? 'CLG',
                        rol: dataUsuario.crm_rol.rol_nombre
                    }, (err, html) => {
                        if (err) reject(err);
                        resolve(html);
                    });
                });

                //Creamos una nueva pagina (instancia)
                const page = await browser.newPage();
                //Seteamos el contenido de la pagina a Puppeteer
                await page.setContent(html);
                // To reflect CSS used for screens instead of print
                await page.emulateMediaType('screen');


                const footerHtml = await new Promise((resolve, reject) => {
                    res.render('footer', {}, (err, footerHtml) => {
                        if (err) reject(err);
                        resolve(footerHtml);
                    });
                });


                // Download the PDF
                const pdfBuffer = await page.pdf({
                    path: `CartaAceptacion_${cartaActualizada.cac_numero}.pdf`,
                    displayHeaderFooter: true,
                    headerTemplate: '<div style="margin-right: 50px; font-size:10px; text-align:right; width:100%;">Fecha de creación: ' + moment().format("DD-MM-YYYY") + '</div>',
                    footerTemplate: `
                <div style="
                    width: 100%;
                    text-align: center;
                    font-size: 12px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    ${footerHtml}
                </div>
                `,
                    margin: { top: '30px', right: '50px', bottom: '50px', left: '50px' },
                    printBackground: true,
                    format: 'Letter'
                });

                //Si lo quisieramos convertir a Base64 
                //const pdfBase64 = pdfBuffer.toString('base64');

                await browser.close();


                // Nombre del archivo
                const filename = cartaActualizada.cac_numero + '.pdf';
                const path_carta = do_path + 'Cartas_Aceptacion/' + filename;

                // Configurar el endpoint de DigitalOcean Spaces
                const spacesEndpoint = new AWS.Endpoint(do_spe + 'Cartas_Aceptacion/');
                // Configurar S3 con las credenciales de DigitalOcean Spaces
                const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: do_spk,
                    secretAccessKey: do_sps
                });

                await s3.putObject({
                    Bucket: do_spn,
                    Key: filename,
                    Body: pdfBuffer,
                    ACL: 'public-read',
                    ContentType: 'application/pdf'
                }).promise();

                //* Actualizamos la carta agregando el path_carta del pdf de la carta recien creado 
                await CartaAceptacion.update(
                    {
                        cac_pdf: path_carta
                    },
                    {
                        where: { cac_id }
                    }
                );
            } catch (error) {
                console.log(error);
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: "Carta de Aceptación actualizada exitosamente!"
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
    }//END EditarCA


    /**
    * TODO FUNCIÓN PARA OBTENER CORRELATIVO DE CARTAS DE ACEPTACIÓN
    */
    static async ObtenerCorrelativoCA(req, res, next) {
        try {
            let codigocorrelativo;
            const year = moment().year();

            // Buscar el correlativo actual
            const correlativoActual = await CorrelativosInformes.findOne({
                where: {
                    cor_tipo: 'aceptacion',
                    cor_anio: year,
                }
            });

            if (correlativoActual) {
                // Si ya hay un correlativo para el año actual, incrementar el número
                codigocorrelativo = (correlativoActual.cor_correlativo + 1) + '-' + correlativoActual.cor_anio;
            } else {
                // Si no existe un correlativo para el año, crear uno nuevo
                await CorrelativosInformes.create({
                    cor_tipo: 'aceptacion',
                    cor_correlativo: 1,
                    cor_anio: year
                });

                codigocorrelativo = '1-' + year;
            }

            return codigocorrelativo;
        } catch (error) {
            //! Registramos el error capturado
            try {
                next(error);
            } catch (e) {
            }

            return false;
        }
    }//END ObtenerCorrelativoCA


    /**
    * TODO FUNCIÓN PARA AUMENTAR CORRELATIVO DE CARTAS DE ACEPTACIÓN
    */
    static async AumentarCorrelativoCA(req, res, next) {
        try {
            let codigocorrelativo;
            const year = moment().year();

            // Buscar el correlativo actual
            const correlativoActual = await CorrelativosInformes.findOne({
                where: {
                    cor_tipo: 'aceptacion',
                    cor_anio: year,
                }
            });

            // Actualizar el correlativo en la base de datos
            await correlativoActual.update({ cor_correlativo: correlativoActual.cor_correlativo + 1 });

            return codigocorrelativo;
        } catch (error) {
            //! Registramos el error capturado
            try {
                next(error);
            } catch (e) {
            }

            return false;
        }
    }//END AumentarCorrelativoCA


    /**
    * TODO FUNCIÓN PARA OBTENER HISTORIAL DE CAMBIOS EN CARTA DE ACEPTACION
    */
    static async RegistroDeCambiosCA(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('cac_id').notEmpty().withMessage('cac_id is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            const { cac_id } = req.body;

            const Log = await Logs.findAll({
                attributes: ['usuario', 'tipo_de_evento', 'fecha_del_evento', 'ip'],
                where: {
                    id_principal: cac_id,
                    tipo_registro: "Carta"
                }
            });

            jsonResponse = {
                status: 200,
                message: "Success",
                response: Log
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
    }//END RegistroDeCambiosCA


    /**
    * TODO FUNCIÓN PARA ANULAR CARTAS DE ACEPTACIÓN
    */
    static async AnularCA(req, res, next) {
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
            check('cac_id').notEmpty().withMessage('cac_id is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const {
                cac_id
            } = req.body;

            await CartaAceptacion.update(
                {
                    cac_estado: 0,
                    cac_estado_ingreso: 12
                },
                {
                    where: {
                        cac_id: cac_id
                    }
                }
            );

            //*
            const infoCartaNew = await CartaAceptacion.findByPk(cac_id);

            //! ====================================================================
            //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
            //! ====================================================================
            try {
                // Definimos la data que se guardara en el logs de usuarios
                const datalogs = {
                    "usuario": req.user.log_username,
                    "tipo_de_evento": "Anular Carta Aceptación",
                    "fecha_del_evento": moment().format(),
                    "tabla_afectada": "clg_cac_aceptacion",
                    "info_antes_de_modificar": null,
                    "info_despues_de_modificar": JSON.stringify(infoCartaNew),
                    "id_principal": cac_id,
                    "tipo_registro": "Carta",
                    "motivo_correccion": null
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


            //! OBTENEMOS LA INFORMACIÓN DEL ARCHIVO QUE ACABAMOS DE ADJUNTAR A LA CARTA
            const doc_anulacion = req.files['doc_anulacion'] ? req.files['doc_anulacion'][0] : null;

            //TODO: Guardamos el archivo subido cuando se anulo la carta
            if (doc_anulacion) {
                const identificador = Math.floor(1000 + Math.random() * 9000);
                // Obtener la extensión del archivo usando la función
                let extension = await helpercontroller.getExtensionFromMimeType(doc_anulacion.mimetype);
                // Nombre del archivo
                const filename = infoCartaNew.cac_numero + '-doc-anulacion-' + identificador + extension;
                path = do_path + 'DocsAnulaciones/' + filename;

                const spacesEndpoint = new AWS.Endpoint(do_spe + 'DocsAnulaciones/');

                const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: do_spk,
                    secretAccessKey: do_sps
                });

                await s3.putObject({
                    Bucket: do_spn,
                    Key: filename,
                    Body: Buffer.from(doc_anulacion.buffer, doc_anulacion.buffer.length),
                    ContentLength: doc_anulacion.size,
                    ContentType: doc_anulacion.mimetype,
                    ACL: 'public-read'
                }).promise();

                await Docs.create({
                    nombre_doc: filename,
                    path_doc: path,
                    id_registro: cac_id,
                    tipo_registro: 'ca',
                    tipo_doc: 'Anulacion',
                    creada_por: req.user.log_username,
                    fecha_creacion: moment().format()
                });
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: "Carta de Aceptación anulada exitosamente!"
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
    }//END AnularCA
}

module.exports = cartaaceptacioncontroller;