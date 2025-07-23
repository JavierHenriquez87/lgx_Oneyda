const router = require("express").Router();
const bcrypt = require("bcrypt"); //Librería de encriptaron para la clave enviada por el usuario al momento de registrarse al sistema
const moment = require("moment-timezone");
const { es } = require("date-fns/locale"); //Importar la localización en español
const AWS = require("aws-sdk");
const stream = require("stream");
const { logsUsers } = require("../logs/logsUser"); //Validaciones de los datos que envía el usuario
const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envía el usuario
const { Op, Sequelize, QueryTypes } = require("sequelize"); //Operador especial de Sequelize
const puppeteer = require("puppeteer");
const path = require("path");
const db = require("../../database/db"); // Importa la configuración de Sequelize
const qs = require("qs");
const { v4: uuidv4 } = require("uuid");

/**
 * *Importación de modelos a utilizar
 */
const CartaAceptacion = require("../models/CartaAceptacionModel");
const DetalleCA = require("../models/DetalleCartaAceptacionModel");
const InformeGuardaAlmacen = require("../models/InformeGuardaAlmacenModel");
const Clientes = require("../models/ClientesModel");
const helpercontroller = require("./helpercontroller");
const DetalleGuardaAlmancen = require("../models/DetalleInformeGuardaAlmacenModel");
const Tarimas = require("../models/TarimasModel");
const EstadosAlmacenaje = require("../models/EstadosAlmacenajeModel");
const PilotosCAceptacion = require("../models/WMS_PilotosCartasModel");
const CBM_Consignatarios = require("../models/WMS_ConsignatarioCartaModel");
const Salidas = require("../models/SalidasModel");
const DocumentosSalidas = require("../models/DocumentosSalidasModel");
const DocumentosCambioRegimen = require("../models/DocumentosCambioRegimenModel");
const Aduanas = require("../models/AduanasModel");
const CorrelativosInformes = require("../models/CorrelativosInformesModel");
const Transportistas = require("../models/TransportistaModel");
const Pais = require("../models/PaisModel");
const Productos = require("../models/ProductosModel");

class informesguardaalmacencontroller {
  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE INFORMES GUARDA ALMACÉN
   */
  static async ObtenerIGA(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("Number page is required."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      req.body.cli_nombre = req.body.cli_nombre ?? null;
      req.body.datobusqueda = req.body.datobusqueda ?? null;

      //Guardamos en estas variables la data que envió el usuario
      const { page, cli_nombre, datobusqueda } = req.body;
      const numPag = page;
      const limitePorPagina = 50; // Número de cartas por página

      // Inicializamos el objeto where
      let whereConditions = {};
      let whereConditionsIGA = {};

      // Si cli_nombre tiene un valor, agregamos la condición de búsqueda
      if (cli_nombre) {
        whereConditions[Op.and] = [
          {
            cli_nombre: {
              [Op.like]: `%${cli_nombre}%`,
            },
          },
        ];
      }

      // Si datobusqueda tiene un valor, agregamos la condición de búsqueda
      if (datobusqueda) {
        whereConditionsIGA[Op.and] = [
          {
            iga_codigo: {
              [Op.like]: `%${datobusqueda}%`,
            },
          },
        ];
      }

      //Obtenemos la data de los clientes
      const igaCount = await InformeGuardaAlmacen.count({
        where: whereConditionsIGA,
        include: [
          {
            model: Clientes,
            where: whereConditions,
          },
        ],
      });

      // Calcula el número total de páginas
      const total_pages = Math.ceil(igaCount / limitePorPagina);

      //Obtenemos la data de los informes de guarda almacen
      let dataInforme = await InformeGuardaAlmacen.findAll({
        where: whereConditionsIGA,
        include: [
          {
            model: Clientes,
            where: whereConditions,
          },
          {
            model: CartaAceptacion,
          },
          {
            model: DetalleGuardaAlmancen,
          },
        ],
        limit: limitePorPagina,
        offset: (numPag - 1) * limitePorPagina,
        order: [["iga_id", "desc"]],
      });

      if (dataInforme && dataInforme.length > 0) {
        dataInforme = dataInforme.map((informe) => {
          return {
            ...informe.toJSON(),
            archivo: informe.de_lgx
              ? informe.iga_archivo
              : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
                informe.iga_archivo,
          };
        });
      }

      const data = {
        total_registros: igaCount,
        total_paginas: total_pages,
        registros_por_pagina: limitePorPagina,
        data: dataInforme,
      };

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END ObtenerIGA

  /**
   * TODO FUNCIÓN PARA OBTENER INFORMACIÓN DE UN INFORME GUARDA ALMACÉN
   */
  static async ObtInfoIGA(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_id").notEmpty().withMessage("iga_id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { iga_id } = req.body;

      //Obtenemos la data de los informes de guarda almacen
      let dataInforme = await InformeGuardaAlmacen.findOne({
        where: {
          iga_id,
        },
        include: [
          {
            model: Clientes,
          },
          {
            model: CartaAceptacion,
            include: [
              {
                model: EstadosAlmacenaje,
              },
              {
                model: PilotosCAceptacion,
              },
            ],
          },
          {
            model: DetalleGuardaAlmancen,
            include: [
              {
                model: Tarimas,
              },
            ],
          },
        ],
      });

      if (Array.isArray(dataInforme) && dataInforme.length > 0) {
        dataInforme = dataInforme.map((informe) => {
          const info =
            typeof informe.toJSON === "function" ? informe.toJSON() : informe;

          return {
            ...info,
            iga_archivo:
              info.iga_archivo && !info.iga_archivo.startsWith("http")
                ? "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
                  info.iga_archivo
                : info.iga_archivo,
            iga_archivo_bl:
              info.iga_archivo_bl && !info.iga_archivo_bl.startsWith("http")
                ? "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
                  info.iga_archivo_bl
                : info.iga_archivo_bl,
            iga_archivo_dmti:
              info.iga_archivo_dmti && !info.iga_archivo_dmti.startsWith("http")
                ? "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
                  info.iga_archivo_dmti
                : info.iga_archivo_dmti,
          };
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: dataInforme,
      };

      jsonResponse = {
        status: 200,
        message: "Success",
        response: dataInforme,
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END ObtInfoIGA

  /**
   * TODO FUNCIÓN PARA OBTENER VIÑETAS
   */
  static async ObtenerVinetas(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("codigo").notEmpty().withMessage("codigo is required."),
      check("tipo").notEmpty().withMessage("tipo is required."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { codigo, tipo } = req.body;

      let sqlQueryData = `
            SELECT
                c.cac_id,
                c.cac_numero,
                i.iga_id,
                i.iga_stal_id,
                i.iga_codigo,
                i.iga_comentarios,
                d.dga_id,
                d.dga_recibidos,
                da.cad_peso,
                da.cad_bl,
                p.pro_nombre,
                IF(p.pro_codigo = '', 'Sin Dato', IFNULL(p.pro_codigo, 'Sin Dato')) AS lote,
                cl.cli_nombre,
                IF(DATE_FORMAT(d.dga_fecha_exp, '%d-%m-%Y') = '00-00-0000', 'Sin Dato', DATE_FORMAT(d.dga_fecha_exp, '%d-%m-%Y')) AS fechaVencimiento,
                t.tar_id,
                t.tar_total,
                t.tar_orden,
                t.tar_nbultos,
                t.tar_identificador,
                t.tar_impreso,
                t.de_lgx
                FROM clg_tar_tarimas AS t
                INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_id = t.tar_dga_id
                INNER JOIN clg_iga_informeguardalmacen AS i ON i.iga_id = d.dga_iga_id
                INNER JOIN clg_cad_detalleaceptacion AS da ON da.cad_id = i.iga_cad_id
                INNER JOIN clg_cac_aceptacion AS c ON c.cac_id = da.cad_cac_id
                INNER JOIN clg_pro_productos AS p ON p.pro_id = d.dga_pro_id
                INNER JOIN clg_cli_clientes AS cl ON cl.cli_id = da.cad_cli_id
            `;

      if (tipo == 1) {
        sqlQueryData += ` WHERE c.cac_numero = '${codigo}'`;
      }

      if (tipo == 2) {
        sqlQueryData += ` WHERE i.iga_codigo = '${codigo}'`;
      }

      const vinetas = await db.query(sqlQueryData, {
        type: QueryTypes.SELECT,
      });

      for (const data of vinetas) {
        if (data.de_lgx == 1) {
          data.archivo =
            "https://wms-assets.nyc3.digitaloceanspaces.com/LGX/Vinetas/" +
            data.tar_identificador +
            ".pdf";
        } else {
          data.archivo =
            "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/vinetas/" +
            data.tar_identificador +
            ".pdf";
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: vinetas,
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END ObtenerVinetas

  /**
   * TODO FUNCIÓN PARA CREAR VIÑETAS
   */
  static async CrearVinetas(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    //creamos el dato para subirlo a DO Space
    const do_path = process.env.DO_SPACES_PATH;
    const do_spe = process.env.DO_SPACES_ENDPOINT || "";
    const do_spk = process.env.DO_SPACES_KEY;
    const do_sps = process.env.DO_SPACES_SECRET;
    const do_spn = process.env.DO_SPACES_NAME || "";
    var path = null;

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_id").notEmpty().withMessage("iga_id is required."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { iga_id } = req.body;

      const sqlQueryData = `
                SELECT
                cl.cli_nombre,
                i.iga_codigo,
                da.cad_peso,
                t.tar_orden,
                t.tar_total,
                t.tar_nbultos,
                i.iga_stal_id,
                c.cac_id,
                c.cac_numero,
                i.iga_id,
                i.iga_comentarios,
                d.dga_id,
                d.dga_recibidos,
                da.cad_bl,
                p.pro_nombre,
                IF(p.pro_codigo = '', 'Sin Dato', IFNULL(p.pro_codigo, 'Sin Dato')) AS lote,
                IF(DATE_FORMAT(d.dga_fecha_exp, '%d-%m-%Y') = '00-00-0000', 'Sin Dato', DATE_FORMAT(d.dga_fecha_exp, '%d-%m-%Y')) AS fechaVencimiento,
                t.tar_id,
                t.tar_identificador,
                t.tar_impreso
                FROM clg_tar_tarimas AS t
                INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_id = t.tar_dga_id
                INNER JOIN clg_iga_informeguardalmacen AS i ON i.iga_id = d.dga_iga_id
                INNER JOIN clg_cad_detalleaceptacion AS da ON da.cad_id = i.iga_cad_id
                INNER JOIN clg_cac_aceptacion AS c ON c.cac_id = da.cad_cac_id
                INNER JOIN clg_pro_productos AS p ON p.pro_id = d.dga_pro_id
                INNER JOIN clg_cli_clientes AS cl ON cl.cli_id = da.cad_cli_id
                WHERE i.iga_id = '${iga_id}'
            `;

      const vinetas = await db.query(sqlQueryData, {
        type: QueryTypes.SELECT,
      });

      if (vinetas.length == 0) {
        jsonResponse = {
          status: 404,
          message: "Not Found",
          response:
            "No se encontraron registros para la creación de las viñetas.",
        };

        return res.status(jsonResponse.status).json(jsonResponse);
      }

      //************************************************************* */
      // TODO: INICIAMOS PUPPETEER PARA CREAR EL ARCHIVO PDF
      //************************************************************* */
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
      });

      for (const vineta of vinetas) {
        // Obtener el contenido HTML con variables dinámicas
        let html = await new Promise((resolve, reject) => {
          res.render(
            "vinetas",
            {
              cli_nombre: vineta.cli_nombre,
              iga_codigo: vineta.iga_codigo,
              cad_peso: vineta.cad_peso,
              tar_orden: vineta.tar_orden,
              tar_total: vineta.tar_total,
              tar_nbultos: vineta.tar_nbultos,
              iga_stal_id: vineta.iga_stal_id,
              lote: vineta.lote,
              cad_bl: vineta.cad_bl,
              dga_recibidos: vineta.dga_recibidos,
              cac_numero: vineta.cac_numero,
              fechaVencimiento: vineta.fechaVencimiento,
              pro_nombre: vineta.pro_nombre,
              iga_comentarios: vineta.iga_comentarios,
              fecha: moment().format("DD-MM-YYYY"),
            },
            (err, html) => {
              if (err) reject(err);
              resolve(html);
            }
          );
        });

        //Creamos una nueva pagina (instancia)
        let page = await browser.newPage();
        //Seteamos el contenido de la pagina a Puppeteer
        await page.setContent(html);
        // To reflect CSS used for screens instead of print
        await page.emulateMediaType("screen");

        // Download the PDF
        let pdfBuffer = await page.pdf({
          path: vineta.tar_identificador + ".pdf",
          displayHeaderFooter: false,
          margin: { top: "30px", right: "50px", bottom: "50px", left: "50px" },
          printBackground: false,
          format: "Letter",
          landscape: true, // Habilita el formato horizontal
        });

        await browser.close();

        // Nombre del archivo
        let filename = vineta.tar_identificador + ".pdf";
        let path_vineta = do_path + "Vinetas/" + filename;

        // Configurar el endpoint de DigitalOcean Spaces
        const spacesEndpoint = new AWS.Endpoint(do_spe + "Vinetas/");
        // Configurar S3 con las credenciales de DigitalOcean Spaces
        const s3 = new AWS.S3({
          endpoint: spacesEndpoint,
          accessKeyId: do_spk,
          secretAccessKey: do_sps,
        });

        await s3
          .putObject({
            Bucket: do_spn,
            Key: filename,
            Body: pdfBuffer,
            ACL: "public-read",
            ContentType: "application/pdf",
          })
          .promise();

        //* Actualizamos la carta agregando el path_vineta del pdf de la carta recien creado
        await Tarimas.update(
          {
            tar_impreso: 1,
            de_lgx: true,
          },
          {
            where: { tar_id: vineta.tar_id },
          }
        );
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se crearon las viñetas solicitadas",
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END CrearVinetas

  /**
   * TODO FUNCIÓN PARA EDITAR COMENTARIOS DE IGA
   */
  static async EditarComentarios(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_id").notEmpty().withMessage("iga_id is required."),
      check("iga_comentarios")
        .notEmpty()
        .withMessage("iga_comentarios is required."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { iga_id, iga_comentarios } = req.body;

      //* Obtenemos la información que tenia antes de la modificación
      const infoIgaOld = await InformeGuardaAlmacen.findByPk(iga_id);

      let actualizar = await InformeGuardaAlmacen.update(
        {
          iga_comentarios,
        },
        {
          where: { iga_id },
        }
      );

      //! ====================================================================
      //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
      //! ====================================================================
      try {
        // Definimos la data que se guardara en el logs de usuarios
        const datalogs = {
          usuario: req.user.log_username,
          tipo_de_evento: "Mod Comentario IGA",
          fecha_del_evento: moment().format(),
          tabla_afectada: "clg_iga_informeguardalmacen",
          info_antes_de_modificar: infoIgaOld.iga_comentarios,
          info_despues_de_modificar: iga_comentarios,
          id_principal: iga_id,
          tipo_registro: "IGA",
          motivo_correccion: null,
        };

        //Enviamos la data a la funcion de logs
        await logsUsers(req, res, next, datalogs);
      } catch (error) {
        //! Registramos el error capturado
        console.error("Error al registrar log:", error);

      }
      //! ====================================================================
      //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
      //! ====================================================================
      
      if(actualizar == false){

        throw new Error(`Error al actualizar el comentario `);

      }
      let id = iga_id
      let actualizarPdf = await helpercontroller.CrearPdfInforme({ req,res,next,id})
      
      if(actualizarPdf == false){

        throw new Error(`Error al actualizar el pdf de informe `);

      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Comentario modificado",
      };
    } catch (error) {
      //! Registramos el error capturado
      
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END EditarComentarios

  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE DOCUMENTOS (AUDITORIA DE DOCUMENTOS)
   */
  static async auditoriaDocumentos(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("Número de pagina es requerido."),
      check("fecha_inicio")
        .notEmpty()
        .withMessage("fecha_inicio es requerido."),
      check("fecha_fin").notEmpty().withMessage("fecha_fin es requerido."),
      check("tipo_regimen")
        .notEmpty()
        .withMessage("tipo_regimen es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      req.body.tipobusqueda = req.body.tipobusqueda ?? null;
      req.body.datobusqueda = req.body.datobusqueda ?? null;
      //* Guardamos en estas variables la data que envió el usuario
      const {
        page,
        fecha_inicio,
        fecha_fin,
        tipo_regimen,
        datobusqueda,
        tipobusqueda,
      } = req.body;
      let documentos = [];
      let whereConditionsCA = {};
      let whereConditionsIG = {};
      let whereConditionsSAL = {};
      const numPag = page;
      const limitePorPagina = 50; // Número de cartas por página

      // Asegurarnos de que las fechas de inicio y fin tengan la hora adecuada
      const fechaInicio = moment(fecha_inicio)
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      const fechaFin = moment(fecha_fin)
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");

      if (tipo_regimen == "dt") {
        //TODO: Cuando el tipo de regimen enviado es dt
        whereConditionsIG = {
          iga_estado: 1,
          iga_stal_id: 1,
          iga_finiquitado: 0,
          iga_fechaingreso: {
            [Op.between]: [fechaInicio, fechaFin],
          },
        };
      } else if (tipo_regimen == "at") {
        //TODO: Cuando el tipo de regimen enviado es at
        whereConditionsIG = {
          iga_estado: 1,
          iga_stal_id: 2,
          iga_finiquitado: 0,
          iga_fechaingreso: {
            [Op.between]: [fechaInicio, fechaFin],
          },
        };
      } else if (tipo_regimen == "as") {
        //TODO: Cuando el tipo de regimen enviado es as
        whereConditionsIG = {
          iga_estado: 1,
          iga_stal_id: 3,
          iga_finiquitado: 0,
          iga_fechaingreso: {
            [Op.between]: [fechaInicio, fechaFin],
          },
        };
      }

      //* Si `datobusqueda` tiene un valor, agregarlo a la condición de `iga_codigo`
      if (tipobusqueda && datobusqueda) {
        if (tipobusqueda == "sal") {
          whereConditionsSAL.sal_codigo = {
            [Op.like]: `%${datobusqueda}%`,
          };
        } else if (tipobusqueda == "ig") {
          whereConditionsIG.iga_codigo = {
            [Op.like]: `%${datobusqueda}%`,
          };
        } else {
          whereConditionsCA.cac_numero = {
            [Op.like]: `%${datobusqueda}%`,
          };
        }
      }

      //* Obtenemos el total de registros de informes de Guarda Almacen que cumplen con las condiciones
      const documentosCount = await InformeGuardaAlmacen.findAll({
        where: whereConditionsIG,
        include: [
          {
            model: CartaAceptacion,
            where: whereConditionsCA,
          },
          {
            model: Clientes,
          },
          {
            model: Salidas,
            where: whereConditionsSAL,
            include: [
              {
                model: DocumentosSalidas,
                required: false,
              },
            ],
          },
          {
            model: DocumentosCambioRegimen,
            required: false,
          },
        ],
        order: [[Salidas, "sal_fecha", "DESC"]],
      });

      // Calcula el número total de páginas
      const total_pages = Math.ceil(documentosCount.length / limitePorPagina);

      documentos = await InformeGuardaAlmacen.findAll({
        where: whereConditionsIG,
        attributes: ["iga_id", "iga_codigo", "iga_stal_id", "iga_fechaingreso"],
        include: [
          {
            model: CartaAceptacion,
            attributes: ["cac_numero"],
            where: whereConditionsCA,
          },
          {
            model: Clientes,
            attributes: ["cli_id", "cli_nombre"],
          },
          {
            model: Salidas,
            where: whereConditionsSAL,
            attributes: [
              "sal_id",
              "sal_iga_id",
              "sal_codigo",
              "sal_numerodm",
              "sal_fecha",
            ],
            include: [
              {
                model: DocumentosSalidas,
                required: false,
              },
            ],
          },
          {
            model: DocumentosCambioRegimen,
            required: false,
          },
        ],
        order: [[Salidas, "sal_fecha", "DESC"]],
        limit: limitePorPagina,
        offset: (numPag - 1) * limitePorPagina,
      });

      for (const docs of documentos) {
        for (const sal of docs.clg_sal_salidas) {
          for (const doc_docs of sal.clg_docs_documentos) {
            doc_docs.dataValues.docs_file_path =
              "https://sistemas.clgsv.com/ucontrol/ci/clg/documentos/" +
              sal.sal_id +
              "/" +
              doc_docs.docs_file;
          }
        }

        for (const im of docs.clg_doc_documentos) {
          im.dataValues.docs_file_path =
            "https://sistemas.clgsv.com/ucontrol/ci/clg/cambioregimen/" +
            docs.iga_id +
            "/" +
            im.doc_documentos;
        }
      }

      const data = {
        total_registros: documentosCount.length,
        total_paginas: total_pages,
        registros_por_pagina: limitePorPagina,
        data: documentos,
      };

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END auditoriaDocumentos

  /**
   * TODO FUNCIÓN PARA OBTENER INFORMACIÓN DE UNA CARTA CON SUS DETALLES PARA CREAR INFORMES
   */
  static async ObtInfoParaCrearInformes(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("cac_id").notEmpty().withMessage("cac_id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { cac_id } = req.body;

      //Obtenemos la data de los informes de guarda almacen
      let dataInfoCarta = await CartaAceptacion.findOne({
        where: {
          cac_id,
        },
        include: [
          {
            model: Aduanas,
          },
          {
            model: EstadosAlmacenaje,
          },
          {
            model: PilotosCAceptacion,
          },
          {
            model: DetalleCA,
            include: [
              {
                model: Clientes,
              },
              {
                model: InformeGuardaAlmacen,
                attributes: [
                  "iga_archivo",
                  "iga_archivo_bl",
                  "iga_archivo_dmti",
                ],
              },
            ],
          },
        ],
      });

      //* Buscamos si existe al menos un detalle de carta de aceptacion que ya se le hizo informe
      let dataDetalleCA = await DetalleCA.findOne({
        where: {
          cad_iga_creado: {
            [Op.ne]: 0, // diferente de 0
          },
          cad_cac_id: cac_id,
        },
      });

      //* Si ya hay un informe de guarda almacen creado, entonces agregamos las propiedades que se agregaron como generales
      if (dataDetalleCA) {
        let dataInformeGA = await InformeGuardaAlmacen.findOne({
          where: {
            iga_cac_id: cac_id,
          },
        });

        dataInfoCarta.dataValues.iga_fechaingreso =
          dataInformeGA.iga_fechaingreso;
        dataInfoCarta.dataValues.iga_fechaabandono =
          dataInformeGA.iga_fechaabandono;
        dataInfoCarta.dataValues.iga_manifiesto = dataInformeGA.iga_manifiesto;
        dataInfoCarta.dataValues.iga_cac_id = dataInformeGA.iga_cac_id;
        dataInfoCarta.dataValues.iga_marchamo = dataInformeGA.iga_marchamo;
        dataInfoCarta.dataValues.iga_pai_id = dataInformeGA.iga_pai_id;
        dataInfoCarta.dataValues.iga_codtransportista =
          dataInformeGA.iga_codtransportista;
        dataInfoCarta.dataValues.iga_placavehiculo =
          dataInformeGA.iga_placavehiculo;
        dataInfoCarta.dataValues.iga_ubicacion = dataInformeGA.iga_ubicacion;
        dataInfoCarta.bloquear_info = 1;
      }

      const infoPilotoCarta = await PilotosCAceptacion.findOne({
        where: {
          cac_id,
        },
      });

      if (infoPilotoCarta) {
        for (const item of dataInfoCarta.clg_cad_detalleaceptacions) {
          // Código para realizar la suma de n_bultos
          let sumaBultosDescargados = await CBM_Consignatarios.sum("n_bultos", {
            where: {
              codigo_pilotocarta: infoPilotoCarta.codigo_pilotocarta,
              cad_cli_id: item.cad_cli_id,
            },
          });

          item.dataValues.dga_recibidos = sumaBultosDescargados;
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: dataInfoCarta,
      };
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END ObtInfoParaCrearInformes

  /**
   * TODO FUNCIÓN PARA CREAR INFORMES GUARDA ALMACEN
   */
  static async CrearInformesGuardaAlmacen(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    //creamos el dato para subirlo a DO Space
    const do_path = process.env.DO_SPACES_PATH;
    const do_spe = process.env.DO_SPACES_ENDPOINT || "";
    const do_spk = process.env.DO_SPACES_KEY;
    const do_sps = process.env.DO_SPACES_SECRET;
    const do_spn = process.env.DO_SPACES_NAME || "";

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_cac_id").notEmpty().withMessage("iga_cac_id es requerido."),
      check("iga_stal_id").notEmpty().withMessage("iga_stal_id es requerido."), //Estado almacenaje DT, AS, AT
      check("iga_marchamo")
        .notEmpty()
        .withMessage("iga_marchamo es requerido."),
      check("iga_codtransportista")
        .notEmpty()
        .withMessage("iga_codtransportista es requerido."),
      check("iga_placavehiculo")
        .notEmpty()
        .withMessage("iga_placavehiculo es requerido."),
      check("iga_manifiesto")
        .notEmpty()
        .withMessage("iga_manifiesto es requerido."),
      check("iga_fechaabandono")
        .notEmpty()
        .withMessage("iga_fechaabandono es requerido."),
      check("iga_fechaingreso")
        .notEmpty()
        .withMessage("iga_fechaingreso es requerido."),
      check("iga_pai_id").notEmpty().withMessage("iga_pai_id es requerido."),
      check("iga_ubicacion")
        .notEmpty()
        .withMessage("iga_ubicacion es requerido."),
      check("misma_dmti").notEmpty().withMessage("misma_dmti es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    let saveIGA; //* Para el registro del informe
    let saveDGA; //* Para el registro del detalle del informe
    let saveTarima; //* Para el registro de la tarima
    let observacion; //* Para indicar en msj que fallo al crear el pdf del informe

    try {
      //Guardamos en estas variables la data que envió el usuario
      const {
        iga_cac_id,
        iga_stal_id,
        iga_marchamo,
        iga_codtransportista,
        iga_placavehiculo,
        iga_manifiesto,
        iga_fechaabandono,
        iga_fechaingreso,
        iga_pai_id,
        iga_ubicacion,
        misma_dmti,
      } = req.body;

      //TODO: Validamos que en los detalles venga al menos un cliente
      const { detalles } = qs.parse(req.body);

      if (!detalles || detalles.length === 0) {
        jsonResponse = {
          status: 400,
          message: "Error",
          response: "Debe incluir al menos un detalle.",
        };

        return res.status(jsonResponse.status).json(jsonResponse);
      }

      //* Configuramos las propiedades para subir el documento al space
      const spacesEndpoint = new AWS.Endpoint(do_spe);
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: do_spk,
        secretAccessKey: do_sps,
      });

      // Definir la zona horaria de El Salvador
      const fecha = moment().tz("America/El_Salvador");
      // Obtener mes
      const mes = fecha.month() + 1; // ¡OJO! mes() retorna de 0 (enero) a 11 (diciembre)
      // Agrupar archivos por cliente
      const archivosPorCliente = {};
      //if (misma_dmti == null || misma_dmti == 0) {
      for (const file of req.files) {
        const match = file.fieldname.match(/^detalles\[(\d+)]\[(.+)]$/);
        if (match) {
          const index = parseInt(match[1]); // Índice del cliente
          const key = match[2]; // Nombre del archivo (iga_archivo_dmti o iga_archivo_bl)
          if (!archivosPorCliente[index]) archivosPorCliente[index] = {};
          archivosPorCliente[index][key] = file;
        }
      }
      //}

      for (const [i, detalle] of detalles.entries()) {
        //* Obtenemos informacion del estado de almacenaje
        let infoEstadoAlmacenaje = await EstadosAlmacenaje.findByPk(
          iga_stal_id
        );

        //* Obtenemos informacion del correlativo
        const correlativo =
          await informesguardaalmacencontroller.ObtenerCorrelativoIga();

        //* Creamos el codigo del informe
        //Todo: correlativo + mes + anio + tipo almacenaje (DT, SA, AT, etc) + 001
        let codigocorrelativo =
          String(correlativo.cor_correlativo) +
          String(mes).padStart(2, "0") +
          String(correlativo.cor_anio) +
          String(infoEstadoAlmacenaje.stal_codsistema) +
          "001";

        //* Obtener archivos del cliente
        const archivos = archivosPorCliente[i] || {};
        const archivoDMTI = archivos["iga_archivo_dmti"] || null;
        const archivoBL = archivos["iga_archivo_bl"] || null;

        if (misma_dmti == null || misma_dmti == 0) {
          if (!archivoDMTI) {
            return res.status(400).json({
              status: 400,
              message: "Bad Request",
              response: `Debe adjuntar DMTI para el cliente ${i + 1}.`,
            });
          }
        }

        if (!archivoBL) {
          return res.status(400).json({
            status: 400,
            message: "Bad Request",
            response: `Debe adjuntar BL para el cliente ${i + 1}.`,
          });
        }

        //* Obtenemos informacion de la carta para validar si la propiedad misma_dmti es
        //* null => que no se ha guardado aun un informe
        //* 0 => que sera distinta dmti para todos los clientes
        //* 1 => que sera la misma dmti para todos los clientes
        const validarCarta = await CartaAceptacion.findByPk(iga_cac_id);
        let pathDMTI = null;

        //* Si validarCarta.misma_dmti es null es porque no se ha guardado aun un archivo dmti
        //* Si misma_dmti es 0 es porque sera distinto archivo dmti por cliente
        if (validarCarta.misma_dmti == null || misma_dmti == 0) {
          //* Guardar archivo DMTI
          const extensionDMTI = await helpercontroller.getExtensionFromMimeType(
            archivoDMTI.mimetype
          );
          const filenameDMTI = codigocorrelativo + "-DMTI" + extensionDMTI;
          pathDMTI = do_path + "DocumentosIGA/dmti/" + filenameDMTI;

          //* Subir archivo DMTI
          await s3
            .putObject({
              Bucket: do_spn,
              Key: `DocumentosIGA/dmti/${filenameDMTI}`, // Carpeta + nombre
              Body: Buffer.from(archivoDMTI.buffer),
              ContentLength: archivoDMTI.size,
              ContentType: archivoDMTI.mimetype,
              ACL: "public-read",
            })
            .promise();
        } else {
          //* Si se eligio que sera misma dmti para todos los clientes buscamos cual es el path de la dmti
          const infoDMTI = await InformeGuardaAlmacen.findOne({
            where: {
              iga_cac_id,
            },
            order: [["iga_id", "ASC"]],
          });

          pathDMTI = infoDMTI.iga_archivo_dmti;
        }

        //* Guardar archivo BL
        const extensionBL = await helpercontroller.getExtensionFromMimeType(
          archivoBL.mimetype
        );
        const filenameBL = codigocorrelativo + "-BL" + extensionBL;
        const pathBL = do_path + "DocumentosIGA/doc_transporte/" + filenameBL;

        //* Subir archivo BL
        await s3
          .putObject({
            Bucket: do_spn,
            Key: `DocumentosIGA/doc_transporte/${filenameBL}`, // Carpeta + nombre
            Body: Buffer.from(archivoBL.buffer),
            ContentLength: archivoBL.size,
            ContentType: archivoBL.mimetype,
            ACL: "public-read",
          })
          .promise();

        //* Generamos el informe de guarda almacen
        saveIGA = await InformeGuardaAlmacen.create({
          iga_com_id: 38,
          iga_usu_id: 156,
          // iga_usu_id: req.user.log_usu_id,
          iga_cac_id,
          iga_stal_id,
          iga_marchamo: iga_marchamo.toUpperCase(),
          iga_codtransportista: iga_codtransportista.toUpperCase(),
          iga_placavehiculo: iga_placavehiculo.toUpperCase(),
          iga_manifiesto: iga_manifiesto.toUpperCase(),
          iga_fechaabandono,
          iga_fechaingreso,
          iga_dmti:
            detalle.iga_dmti != null ? detalle.iga_dmti.toUpperCase() : null,
          iga_pai_id,
          iga_codigo: codigocorrelativo,
          iga_cad_id: detalle.iga_cad_id,
          iga_cli_id: detalle.iga_cli_id,
          iga_doctransporte: detalle.iga_doctransporte,
          iga_volumen: detalle.iga_volumen,
          iga_volumen_fisico: detalle.iga_volumen_fisico ?? 0,
          iga_comentarios: detalle.iga_comentarios,
          iga_archivo: null, //* Esta propiedad se actualiza mas adelante ya que es cuando se crea el pdf
          iga_estado: 1,
          iga_salida: 0,
          iga_origen: null,
          iga_version_as: 0,
          iga_finiquitado: 0,
          iga_valor_inicial: 0,
          iga_valor_actual: 0,
          iga_liberado: 0,
          iga_sobredimensionado: detalle.iga_sobredimensionado,
          iga_bultos_sd: detalle.iga_bultos_sd ?? null,
          iga_volumen_sd: detalle.iga_volumen_sd ?? null,
          iga_sal_traslado_id: null,
          iga_tiempo: "00:20:00",
          iga_archivo_bl: pathBL,
          iga_archivo_dmti: pathDMTI,
          iga_fecha_recepcionado: "2025-05-09 17:03:58", //! consultar por esta fecha
          iga_ubicacion,
          iga_menaje_casa: detalle.iga_menaje_casa ?? "No",
          iga_check: null,
          iga_fecha_facturacion: null,
          iga_tipo_volumen: "detalle",
          iga_tarimas_ocupadas: detalle.iga_tarimas_ocupadas ?? 0,
          de_lgx: true,
        });

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: "Crear Informe Guarda Almacen",
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_iga_informeguardalmacen",
            info_antes_de_modificar: null,
            info_despues_de_modificar: JSON.stringify(saveIGA),
            id_principal: saveIGA.iga_id,
            tipo_registro: "Informe",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          try {
            next(error);
          } catch (e) {}
        }
        //! ====================================================================
        //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================

        //* Guardamos el detalle del informe previamente guardado
        saveDGA = await DetalleGuardaAlmancen.create({
          dga_iga_id: saveIGA.iga_id,
          dga_manifestados: detalle.dga_manifestados,
          dga_recibidos: detalle.dga_recibidos,
          dga_peso_neto:
            detalle.dga_peso_neto == "" ? 0 : detalle.dga_peso_neto,
          dga_peso: detalle.dga_peso == "" ? 0 : detalle.dga_peso,
          dga_volumen: detalle.iga_volumen == "" ? 0 : detalle.iga_volumen,
          dga_volumen_fisico:
            detalle.iga_volumen_fisico == "" ? 0 : detalle.iga_volumen_fisico,
          dga_pro_id: detalle.dga_pro_id,
          dga_partida_arancelaria: detalle.dga_partida_arancelaria,
          dga_sku: detalle.dga_sku,
          dga_ualm_id: detalle.dga_ualm_id == "" ? 19 : detalle.dga_ualm_id,
          dga_fecha_exp:
            detalle.dga_fecha_exp == ""
              ? "0000-00-00 00:00:00"
              : detalle.dga_fecha_exp,
          dga_dai: detalle.dga_dai == "" ? 0 : detalle.dga_dai,
          dga_cif: detalle.dga_cif == "" ? 0 : detalle.dga_cif,
          dga_fob: detalle.dga_fob == "" ? 0 : detalle.dga_fob,
          dga_fecha_fabricacion: detalle.dga_fecha_fabricacion,
          dga_pais_origen: detalle.dga_pais_origen,
        });

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: "Crear Detalle de Informe Guarda Almacen",
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_dga_detallesguardalmacen",
            info_antes_de_modificar: null,
            info_despues_de_modificar: JSON.stringify(saveDGA),
            id_principal: saveDGA.dga_id,
            tipo_registro: "Detalle Informe",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          try {
            next(error);
          } catch (e) {}
        }
        //! ====================================================================
        //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================

        //* Guardamos los valores de la tarima
        saveTarima = await Tarimas.create({
          tar_dga_id: saveDGA.dga_id, //* Id del detalle de guarda almacen
          tar_total: 1, //* Cuantas tarimas se han creado, pero se usa una (1) tarima por detalle de producto
          tar_orden: 1,
          tar_inicial: detalle.dga_recibidos, //* Bultos con los que se inicio el inventario del producto
          tar_nbultos: detalle.dga_recibidos, //* Bultos actuales (Como es un registro recien agregado, es igual a los iniciales)
          tar_peso_inicial: detalle.dga_peso ?? 0,
          tar_peso_actual: detalle.dga_peso ?? 0,
          tar_cif_inicial: detalle.dga_cif == "" ? 0 : detalle.dga_cif,
          tar_cif_actual: detalle.dga_cif == "" ? 0 : detalle.dga_cif,
          tar_vol_inicial: detalle.iga_volumen == "" ? 0 : detalle.iga_volumen,
          tar_vol_actual: detalle.iga_volumen == "" ? 0 : detalle.iga_volumen,
          tar_vol_fisico_inicial: 0,
          tar_vol_fisico_actual: 0,
          tar_salida: 0,
          tar_identificador: uuidv4(), //* Generamos un UUID
          tar_impreso: 0,
          tar_pallet_inicial: 0,
          tar_pallet_actual: 0,
          tar_pallet_salida: 0,
          de_lgx: 1,
        });

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: "Crear Tarima",
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_tar_tarimas",
            info_antes_de_modificar: null,
            info_despues_de_modificar: JSON.stringify(saveTarima),
            id_principal: saveTarima.tar_id,
            tipo_registro: "Tarima",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          try {
            next(error);
          } catch (e) {}
        }
        //! ====================================================================
        //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================

        //* Aumentamos el correlativo del informe guarda almacen
        await informesguardaalmacencontroller.AumentarCorrelativoIGA();

        //* Actualizamos la carta para indicar que se usara la misma dmti para todos (1) o 0 que sera por separado
        if (validarCarta.misma_dmti == null) {
          await CartaAceptacion.update(
            {
              misma_dmti: misma_dmti,
            },
            {
              where: { cac_id: iga_cac_id },
            }
          );
        }

        //* Actualizamos el detalle de la carta para indicar que ya fue generado un informe de guarda almacen
        await DetalleCA.update(
          {
            cad_iga_creado: saveIGA.iga_id,
          },
          {
            where: { cad_id: detalle.iga_cad_id },
          }
        );

        //* Contamos cuantos clientes son de la carta (Cuantos detalles hay)
        const totalClientes = await DetalleCA.count({
          where: { cad_cac_id: iga_cac_id },
        });

        //* Contamos cuantos clientes son de la carta pero que ya tienen creado el informe
        const totalClientesConInforme = await DetalleCA.count({
          where: {
            cad_cac_id: iga_cac_id,
            cad_iga_creado: {
              [Op.gt]: 0,
            },
          },
        });

        //* Comparamos si todos los clientes de la carta de aceptacion tienen informe
        //* Si todos tienen informe se cambia el estado de la carta
        if (totalClientesConInforme >= totalClientes) {
          await CartaAceptacion.update(
            {
              cac_guardalmacen: 1,
              cac_estado_ingreso: 9, //* Descargado (De la tabla clg_estado_ingreso)
            },
            {
              where: { cac_id: iga_cac_id },
            }
          );
        }

        //TODO CREAR ARCHIVO PDF
        observacion = await informesguardaalmacencontroller.CrearPdfIga(
          req,
          res,
          next,
          saveIGA.iga_id
        );
      } //! End for

      jsonResponse = {
        status: 200,
        message: "Success",
        response: `Informe Guarda Almacen Creado con Exito! ${observacion}`,
      };
    } catch (error) {
      //* Si da algun error la insercion eliminamos el informe y el detalle si se creo
      if (saveIGA && saveIGA.iga_id) {
        await InformeGuardaAlmacen.destroy({
          where: { iga_id: saveIGA.iga_id },
        });
      }

      jsonResponse = {
        status: 400,
        message: "Error",
        response: `Ocurrio un error al crear el Informe Guarda Almacen. ==> ${error.message}`,
      };

      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END CrearInformesGuardaAlmacen

  /**
   * TODO FUNCIÓN PARA OBTENER CORRELATIVO DE CARTAS DE ACEPTACIÓN
   */
  static async ObtenerCorrelativoIga(req, res, next) {
    try {
      let codigocorrelativo;
      const year = moment().year();

      // Buscar el correlativo actual
      const correlativoActual = await CorrelativosInformes.findOne({
        where: {
          cor_tipo: "guardalmacen",
          cor_anio: year,
        },
      });

      if (correlativoActual) {
        codigocorrelativo = correlativoActual;
      } else {
        // Si no existe un correlativo para el año, crear uno nuevo
        const nuevoCorrelativo = await CorrelativosInformes.create({
          cor_tipo: "guardalmacen",
          cor_correlativo: 1,
          cor_anio: year,
        });

        codigocorrelativo = nuevoCorrelativo;
      }

      return codigocorrelativo;
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      return false;
    }
  } //END ObtenerCorrelativoiga

  /**
   * TODO FUNCIÓN PARA AUMENTAR CORRELATIVO DE LOS INFORME DE GUARDA ALMACEN
   */
  static async AumentarCorrelativoIGA(req, res, next) {
    try {
      let codigocorrelativo;
      const year = moment().year();

      // Buscar el correlativo actual
      const correlativoActual = await CorrelativosInformes.findOne({
        where: {
          cor_tipo: "guardalmacen",
          cor_anio: year,
        },
      });

      // Actualizar el correlativo en la base de datos
      await correlativoActual.update({
        cor_correlativo: correlativoActual.cor_correlativo + 1,
      });

      return codigocorrelativo;
    } catch (error) {
      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      return false;
    }
  } //END AumentarCorrelativoIGA

  /**
   * TODO FUNCIÓN PARA EDITAR INFORMES GUARDA ALMACEN
   */
  static async EditarInformesGuardaAlmacen(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    //creamos el dato para subirlo a DO Space
    const do_path = process.env.DO_SPACES_PATH;
    const do_spe = process.env.DO_SPACES_ENDPOINT || "";
    const do_spk = process.env.DO_SPACES_KEY;
    const do_sps = process.env.DO_SPACES_SECRET;
    const do_spn = process.env.DO_SPACES_NAME || "";

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_id").notEmpty().withMessage("iga_id es requerido."),
      check("iga_fechaabandono")
        .notEmpty()
        .withMessage("iga_fechaabandono es requerido."),
      check("iga_fechaingreso")
        .notEmpty()
        .withMessage("iga_fechaingreso es requerido."),
      check("iga_dmti").notEmpty().withMessage("iga_dmti es requerido."),
      check("iga_doctransporte")
        .notEmpty()
        .withMessage("iga_doctransporte es requerido."),
      check("iga_comentarios")
        .notEmpty()
        .withMessage("iga_comentarios es requerido."),
      check("iga_sobredimensionado")
        .notEmpty()
        .withMessage("iga_sobredimensionado es requerido."),
      check("iga_bultos_sd")
        .notEmpty()
        .withMessage("iga_bultos_sd es requerido."),
      check("iga_volumen_sd")
        .notEmpty()
        .withMessage("iga_volumen_sd es requerido."),
      check("iga_menaje_casa")
        .notEmpty()
        .withMessage("iga_menaje_casa es requerido."),
      check("iga_tarimas_ocupadas")
        .notEmpty()
        .withMessage("iga_tarimas_ocupadas es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    let saveIGA; //* Para el registro del informe
    let saveDGA; //* Para el registro del detalle del informe
    let oldDataDGA; //* Para el registro del detalle del informe
    let saveTarima; //* Para el registro de la tarima
    let oldDataTAR; //* Para el registro dela tarima
    //* Para indicar en msj que fallo al crear el pdf del informe
    let bl_manif = 0;
    let bl_recib = 0;
    let observacion;
    let peso = 0;
    let volumen = 0;
    let volumen_fisico = 0;

    try {
      //Guardamos en estas variables la data que envió el usuario
      const {
        iga_id,
        iga_fechaabandono,
        iga_fechaingreso,
        iga_dmti,
        iga_doctransporte,
        iga_comentarios,
        iga_sobredimensionado,
        iga_bultos_sd,
        iga_volumen_sd,
        iga_menaje_casa,
        iga_tarimas_ocupadas,
      } = req.body;

      //* Obtenemos informacion actual del informe
      const oldData = await InformeGuardaAlmacen.findByPk(iga_id);

      //TODO: Si el informe esta inactivo (iga_estado 0) o si tiene salidas (iga_salida 1) no se puede editar
      if (oldData.iga_estado == 0 || oldData.iga_salida == 1) {
        jsonResponse = {
          status: 400,
          message: "Error",
          response:
            "No puedes modificar este informe. Se encuentra Inactivo o ya tiene salidas.",
        };

        return res.status(jsonResponse.status).json(jsonResponse);
      }

      //TODO: Validamos que en los detalles venga al menos un producto
      const { detalles } = qs.parse(req.body);

      if (!detalles || detalles.length === 0) {
        jsonResponse = {
          status: 400,
          message: "Error",
          response: "Debe incluir al menos un detalle de producto.",
        };

        return res.status(jsonResponse.status).json(jsonResponse);
      }

      //* Configuramos las propiedades para subir el documento al space
      const spacesEndpoint = new AWS.Endpoint(do_spe);
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: do_spk,
        secretAccessKey: do_sps,
      });

      //! OBTENEMOS LA INFORMACIÓN DEL ARCHIVO DMTI SI SE ENVIO UNO NUEVO
      const archivoDMTI = req.files["iga_archivo_dmti"]
        ? req.files["iga_archivo_dmti"][0]
        : null;
      const archivoBL = req.files["iga_archivo_bl"]
        ? req.files["iga_archivo_bl"][0]
        : null;
      let pathDMTI = null;
      let pathBL = null;

      //* Guardar archivo DMTI si viene uno nuevo adjunto
      if (archivoDMTI) {
        const extensionDMTI = await helpercontroller.getExtensionFromMimeType(
          archivoDMTI.mimetype
        );
        const filenameDMTI = oldData.iga_archivo_dmti + extensionDMTI;
        pathDMTI = do_path + "DocumentosIGA/dmti/" + filenameDMTI;

        //* Subir archivo DMTI
        await s3
          .putObject({
            Bucket: do_spn,
            Key: `DocumentosIGA/dmti/${filenameDMTI}`, // Carpeta + nombre
            Body: Buffer.from(archivoDMTI.buffer),
            ContentLength: archivoDMTI.size,
            ContentType: archivoDMTI.mimetype,
            ACL: "public-read",
          })
          .promise();
      }

      //* Guardar archivo BL si viene uno nuevo adjunto
      if (archivoBL) {
        const extensionBL = await helpercontroller.getExtensionFromMimeType(
          archivoBL.mimetype
        );
        const filenameBL = oldData.iga_archivo_bl + extensionBL;
        pathBL = do_path + "DocumentosIGA/doc_transporte/" + filenameBL;

        //* Subir archivo BL
        await s3
          .putObject({
            Bucket: do_spn,
            Key: `DocumentosIGA/doc_transporte/${filenameBL}`, // Carpeta + nombre
            Body: Buffer.from(archivoBL.buffer),
            ContentLength: archivoBL.size,
            ContentType: archivoBL.mimetype,
            ACL: "public-read",
          })
          .promise();
      }

      //* Obtenemos los totales de volumen y peso
      for (const item of detalles) {
        bl_manif += parseFloat(item.dga_manifestados) || 0;
        bl_recib += parseFloat(item.dga_recibidos) || 0;
        peso += parseFloat(item.dga_peso) || 0;
        volumen += parseFloat(item.iga_volumen) || 0;
        volumen_fisico += parseFloat(item.iga_volumen_fisico) || 0;
      }

      const dataToUpdate = {
        iga_fechaabandono,
        iga_fechaingreso,
        iga_dmti: iga_dmti.toUpperCase(),
        iga_doctransporte: iga_doctransporte,
        iga_volumen: volumen, //Este se calcula sumando todos los detalles de productos
        iga_volumen_fisico: volumen_fisico ?? 0, //Este se calcula sumando todos los detalles de productos
        iga_comentarios: iga_comentarios,
        iga_sobredimensionado: iga_sobredimensionado,
        iga_bultos_sd: iga_bultos_sd ?? null,
        iga_volumen_sd: iga_volumen_sd ?? null,
        iga_menaje_casa: iga_menaje_casa ?? "No",
        iga_tarimas_ocupadas: iga_tarimas_ocupadas ?? 0,
        de_lgx: true,
      };

      // Solo si viene un valor «real» lo añadimos al objeto:
      if (pathBL != null) {
        // null o undefined → NO entra
        dataToUpdate.iga_archivo_bl = pathBL;
      }
      if (pathDMTI != null) {
        dataToUpdate.iga_archivo_dmti = pathDMTI;
      }

      await InformeGuardaAlmacen.update(dataToUpdate, {
        where: { iga_id },
      });

      //* Obtenemos la informacion del informe con los datos actualizados
      saveIGA = await InformeGuardaAlmacen.findByPk(iga_id);

      //! ====================================================================
      //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
      //! ====================================================================
      try {
        // Definimos la data que se guardara en el logs de usuarios
        const datalogs = {
          usuario: req.user.log_username,
          tipo_de_evento: "Editar Informe Guarda Almacen",
          fecha_del_evento: moment().format(),
          tabla_afectada: "clg_iga_informeguardalmacen",
          info_antes_de_modificar: JSON.stringify(oldData),
          info_despues_de_modificar: JSON.stringify(saveIGA),
          id_principal: iga_id,
          tipo_registro: "Informe",
        };

        //Enviamos la data a la funcion de logs
        await logsUsers(req, res, next, datalogs);
      } catch (error) {
        //! Registramos el error capturado
        console.error("Error en logs detalle:", error.message);
      }
      //! ====================================================================
      //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
      //! ====================================================================

      let tipo_de_evento = null;
      let tipo_de_evento_tarima = null;
      let dga_id; //* Variable para guardar el id del informe ya sea que se guardo o que se edito
      for (const det of detalles) {
        //* SI dga_id viene como 0 entonces es un producto nuevo el que se esta agregando
        if (det.dga_id == 0) {
          //* Guardamos el detalle del informe previamente guardado
          saveDGA = await DetalleGuardaAlmancen.create({
            dga_iga_id: iga_id,
            dga_manifestados: det.dga_manifestados,
            dga_recibidos: det.dga_recibidos,
            dga_peso_neto: det.dga_peso == "" ? 0 : det.dga_peso,
            dga_peso: det.dga_peso == "" ? 0 : det.dga_peso,
            dga_volumen: det.iga_volumen == "" ? 0 : det.iga_volumen,
            dga_volumen_fisico:
              det.iga_volumen_fisico == "" ? 0 : det.iga_volumen_fisico,
            dga_pro_id: det.dga_pro_id,
            dga_partida_arancelaria: det.dga_partida_arancelaria,
            dga_sku: det.dga_sku,
            dga_ualm_id: det.dga_ualm_id == "" ? 19 : det.dga_ualm_id,
            dga_fecha_exp:
              det.dga_fecha_exp == ""
                ? "0000-00-00 00:00:00"
                : det.dga_fecha_exp,
            dga_dai: det.dga_dai == "" ? 0 : det.dga_dai,
            dga_cif: det.dga_cif == "" ? 0 : det.dga_cif,
            dga_fob: det.dga_fob == "" ? 0 : det.dga_fob,
            dga_fecha_fabricacion: det.dga_fecha_fabricacion,
            dga_pais_origen: det.dga_pais_origen,
          });

          //* Guardamos los valores de la tarima
          saveTarima = await Tarimas.create({
            tar_dga_id: saveDGA.dga_id, //* Id del detalle de guarda almacen
            tar_total: 1, //* Cuantas tarimas se han creado, pero se usa una (1) tarima por detalle de producto
            tar_orden: 1,
            tar_inicial: det.dga_recibidos, //* Bultos con los que se inicio el inventario del producto
            tar_nbultos: det.dga_recibidos, //* Bultos actuales (Como es un registro recien agregado, es igual a los iniciales)
            tar_peso_inicial: det.dga_peso ?? 0,
            tar_peso_actual: det.dga_peso ?? 0,
            tar_cif_inicial: det.dga_cif == "" ? 0 : det.dga_cif,
            tar_cif_actual: det.dga_cif == "" ? 0 : det.dga_cif,
            tar_vol_inicial: det.iga_volumen == "" ? 0 : det.iga_volumen,
            tar_vol_actual: det.iga_volumen == "" ? 0 : det.iga_volumen,
            tar_vol_fisico_inicial: det.iga_volumen,
            tar_vol_fisico_actual: det.iga_volumen,
            tar_salida: 0,
            tar_identificador: uuidv4(), //* Generamos un UUID
            tar_impreso: 0,
            tar_pallet_inicial: 0,
            tar_pallet_actual: 0,
            tar_pallet_salida: 0,
            de_lgx: 1,
          });

          dga_id = saveDGA.dga_id; //! Id del detalle recien creado
          tipo_de_evento = "Crear Detalle de Informe Guarda Almacen";
          tipo_de_evento_tarima = "Crear Tarima de Detalle de IGA";
        } else {
          //* Obtenemos la informacion del detalle antes de modificar
          oldDataDGA = await DetalleGuardaAlmancen.findByPk(det.dga_id);
          oldDataTAR = await Tarimas.findByPk(det.tar_id);

          //* ACTUALIZAMOS EL DETALLE DE ESE PRODUCTO QUE YA EXISTIA
          await DetalleGuardaAlmancen.update(
            {
              dga_manifestados: det.dga_manifestados,
              dga_recibidos: det.dga_recibidos,
              dga_peso_neto: det.dga_peso == "" ? 0 : det.dga_peso,
              dga_peso: det.dga_peso == "" ? 0 : det.dga_peso,
              dga_volumen: det.iga_volumen == "" ? 0 : det.iga_volumen,
              dga_volumen_fisico:
                det.iga_volumen_fisico == "" ? 0 : det.iga_volumen_fisico,
              dga_pro_id: det.dga_pro_id,
              dga_partida_arancelaria: det.dga_partida_arancelaria,
              dga_sku: det.dga_sku,
              dga_ualm_id: det.dga_ualm_id == "" ? 19 : det.dga_ualm_id,
              dga_fecha_exp:
                det.dga_fecha_exp == ""
                  ? "0000-00-00 00:00:00"
                  : det.dga_fecha_exp,
              dga_dai: det.dga_dai == "" ? 0 : det.dga_dai,
              dga_cif: det.dga_cif == "" ? 0 : det.dga_cif,
              dga_fob: det.dga_fob == "" ? 0 : det.dga_fob,
              dga_fecha_fabricacion: det.dga_fecha_fabricacion,
              dga_pais_origen: det.dga_pais_origen,
            },
            {
              where: {
                dga_id: det.dga_id,
              },
            }
          );

          //* Actualizamos los valores de la tarima que pertenecen al detalle recien modificado
          await Tarimas.update(
            {
              tar_inicial: det.dga_recibidos, //* Bultos con los que se inicio el inventario del producto
              tar_nbultos: det.dga_recibidos, //* Bultos actuales (Como es un registro recien agregado, es igual a los iniciales)
              tar_peso_inicial: det.dga_peso ?? 0,
              tar_peso_actual: det.dga_peso ?? 0,
              tar_cif_inicial: det.dga_cif == "" ? 0 : det.dga_cif,
              tar_cif_actual: det.dga_cif == "" ? 0 : det.dga_cif,
              tar_vol_inicial: det.iga_volumen == "" ? 0 : det.iga_volumen,
              tar_vol_actual: det.iga_volumen == "" ? 0 : det.iga_volumen,
              tar_vol_fisico_inicial: 0,
              tar_vol_fisico_actual: 0,
              de_lgx: 1,
            },
            {
              where: {
                tar_id: det.tar_id,
              },
            }
          );

          //* Obtenemos la informacion del detalle antes de modificar
          saveDGA = await DetalleGuardaAlmancen.findByPk(det.dga_id);
          saveTarima = await DetalleGuardaAlmancen.findByPk(det.tar_id);
          dga_id = saveDGA.dga_id; //! Id del detalle que se modifico
          tipo_de_evento = "Editar Detalle de Informe Guarda Almacen";
          tipo_de_evento_tarima = "Editar Tarima de Detalle de IGA";
        }

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: tipo_de_evento,
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_dga_detallesguardalmacen",
            info_antes_de_modificar: JSON.stringify(oldDataDGA),
            info_despues_de_modificar: JSON.stringify(saveDGA),
            id_principal: saveDGA.dga_id,
            tipo_registro: "Detalle Informe",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          console.error("Error en logs detalle:", error.message);
        }
        //! ====================================================================
        //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: tipo_de_evento_tarima,
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_tar_tarimas",
            info_antes_de_modificar: JSON.stringify(oldDataTAR),
            info_despues_de_modificar: JSON.stringify(saveTarima),
            id_principal: saveTarima.tar_id,
            tipo_registro: "Tarima",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          console.error("Error en logs detalle:", error.message);
        }
        //! ====================================================================
        //* FIN DEL GUARDADO DEL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================

        //TODO CREAR ARCHIVO PDF

        let id = iga_id;
        observacion = await helpercontroller.CrearPdfInforme({
          req,
          res,
          next,
          id,
        });
        //return res.status(200).json(observacion);

        if (observacion == false) {
          throw new Error(`Error al crear PDF`);
        }
      } //! End for

      jsonResponse = {
        status: 200,
        message: "Success",
        response: `Informe Guarda Almacen Creado con Exito! ${observacion}`,
      };
    } catch (error) {
      console.error("Error general:", error); //! CAMBIO
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END EditarInformesGuardaAlmacen

  /**
   * TODO FUNCIÓN PARA CREAR EL ARCHIVO PDF
   */
  static async CrearPdfIga(req, res, next, iga_id_param = null) {
    var jsonResponse = { status: 500, message: "", response: "" };

    //creamos el dato para subirlo a DO Space
    const do_path = process.env.DO_SPACES_PATH;
    const do_spe = process.env.DO_SPACES_ENDPOINT || "";
    const do_spk = process.env.DO_SPACES_KEY;
    const do_sps = process.env.DO_SPACES_SECRET;
    const do_spn = process.env.DO_SPACES_NAME || "";
    let iga_id = iga_id_param || req.body.iga_id;

    try {
      // Si no se pasó como argumento directo, buscarlo desde req

      if (!iga_id) {
        return res.status(400).json({ message: "iga_id es requerido" });
      }

      const infoIga = await InformeGuardaAlmacen.findOne({
        include: [
          {
            model: EstadosAlmacenaje,
          },
          {
            model: Clientes,
          },
          {
            model: CartaAceptacion,
            include: [
              {
                model: Transportistas,
              },
              {
                model: Aduanas,
              },
            ],
          },
          {
            model: Pais,
          },
          {
            model: DetalleGuardaAlmancen,
            include: [
              {
                model: Productos,
              },
            ],
          },
          {
            model: DetalleCA,
            include: [
              {
                model: Pais,
              },
            ],
          },
        ],
        where: {
          iga_id,
        },
      });

      //************************************************************* */
      // TODO: INICIAMOS PUPPETEER
      //************************************************************* */
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
      });

      // Obtener el contenido HTML con variables dinámicas
      const html = await new Promise((resolve, reject) => {
        res.render(
          "formatoIGA",
          {
            iga_codigo: infoIga.iga_codigo,
            iga_fecha_recepcionado: moment(
              infoIga.iga_fecha_recepcionado
            ).format("DD-MM-YYYY hh:mm A"),
            stal_estado: infoIga.clg_stal_estadosalmacenaje.stal_estado,
            iga_fechaingreso: infoIga.iga_fechaingreso,
            tra_nombre:
              infoIga.clg_cac_aceptacion.clg_tra_transportista.tra_nombre,
            cac_numero: infoIga.clg_cac_aceptacion.cac_numero,
            iga_manifiesto: infoIga.iga_manifiesto,
            cac_fecha: infoIga.clg_cac_aceptacion.cac_fecha,
            cac_contenedor: infoIga.clg_cac_aceptacion.cac_contenedor,
            pai_nombre_procedencia: infoIga.clg_pai_paise.pai_nombre,
            iga_marchamo: infoIga.iga_marchamo,
            pai_nombre_destino:
              infoIga.clg_cad_detalleaceptacion.clg_pai_paise.pai_nombre,
            iga_codtransportista: infoIga.iga_codtransportista,
            adu_nombre: infoIga.clg_cac_aceptacion.clg_adu_aduana.adu_nombre,
            iga_placavehiculo: infoIga.iga_placavehiculo,
            iga_dmti: infoIga.iga_dmti,
            iga_ubicacion: infoIga.iga_ubicacion,
            iga_volumen: infoIga.iga_volumen,
            cli_nombre: infoIga.clg_cli_cliente.cli_nombre,
            iga_doctransporte: infoIga.iga_doctransporte,
            detalles: infoIga.clg_dga_detallesguardalmacens,
            iga_menaje_casa: infoIga.iga_menaje_casa,
            iga_comentarios: infoIga.iga_comentarios,
            iga_tarimas_ocupadas: infoIga.iga_tarimas_ocupadas,
          },
          (err, html) => {
            if (err) reject(err);
            resolve(html);
          }
        );
      });

      //Creamos una nueva pagina (instancia)
      const page = await browser.newPage();
      //Seteamos el contenido de la pagina a Puppeteer
      await page.setContent(html);
      // To reflect CSS used for screens instead of print
      await page.emulateMediaType("screen");

      const footerHtml = await new Promise((resolve, reject) => {
        res.render("footer", {}, (err, footerHtml) => {
          if (err) reject(err);
          resolve(footerHtml);
        });
      });

      // Download the PDF
      const pdfBuffer = await page.pdf({
        path: `${infoIga.iga_codigo}.pdf`,
        displayHeaderFooter: true,
        headerTemplate: "",
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
        margin: { top: "20px", right: "40px", bottom: "30px", left: "40px" },
        printBackground: true,
        format: "Letter",
      });

      await browser.close();

      //* Nombre del archivo
      const filename = `${infoIga.iga_codigo}.pdf`;
      const path_carta =
        do_path + "DocumentosIGA/informes_guardaalmacen/" + filename;
      //* Configurar el endpoint de DigitalOcean Spaces
      const spacesEndpoint = new AWS.Endpoint(
        do_spe + "DocumentosIGA/informes_guardaalmacen/"
      );
      //* Configurar S3 con las credenciales de DigitalOcean Spaces
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: do_spk,
        secretAccessKey: do_sps,
      });

      await s3
        .putObject({
          Bucket: do_spn,
          Key: filename,
          Body: pdfBuffer,
          ACL: "public-read",
          ContentType: "application/pdf",
        })
        .promise();

      //* Actualizamos el informe con el path
      await InformeGuardaAlmacen.update(
        {
          iga_archivo: path_carta,
        },
        {
          where: { iga_id: iga_id },
        }
      );

      if (iga_id_param != null) {
        console.log("iga param: " + iga_id_param);
        return "";
      } else {
        console.log("iga api: " + iga_id_param);
        return res.status(200).json(path_carta);
      }
    } catch (error) {
      if (iga_id_param != null) {
        console.log("error iga param: " + iga_id_param + error.message);
        return `Ocurrió un error al generar el documento PDF del Informe`;
      } else {
        console.log("error iga api: " + iga_id_param);
        //! Registramos el error capturado
        try {
          next(error);
        } catch (e) {}

        jsonResponse = {
          status: 500,
          message: "Error",
          response: error.message,
        };

        return res.status(500).json(jsonResponse);
      }
    }
  }

  /**
   * TODO FUNCIÓN PARA CREAR INFORMES GUARDA ALMACEN
   */
  static async CrearIGACambioRegimen(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("iga_id").notEmpty().withMessage("iga_id es requerido."),
      check("iga_stal_id").notEmpty().withMessage("iga_stal_id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //* Guardamos en estas variables la data que envió el usuario
      const { iga_id, iga_stal_id } = req.body;

      let nuevoIGA;
      //* Obtenemos informacion del informe GA que se va a cambiar de regimen
      const infoGA = await InformeGuardaAlmacen.findByPk(iga_id);
      
      //* Obtenemos informacion del estado de almacenaje
      let infoEstadoAlmacenaje = await EstadosAlmacenaje.findByPk(iga_stal_id);
      
      //* Reemplazamos las letras por el nuevo código -------- 3306052025DT001 =====> 3306052025AS001 o segun el regimen enviado
      const correlativoActual = infoGA.iga_codigo;
      const codigocorrelativo = correlativoActual.replace(
        /[A-Z]+/,
        infoEstadoAlmacenaje.stal_codsistema
      );
      
      
      //TODO: Buscamos si ya existe un informe con el tipo de regimen al que se quiere cambiar el informe
      const infoGA_Creado = await InformeGuardaAlmacen.findOne({
        where: {
          iga_codigo: codigocorrelativo,
          iga_id:iga_id
        },
      });
    

       //TODO: Buscamos todos los informes con regimen diferentes 
      const infoGAs_Creados = await InformeGuardaAlmacen.findAll({
        where: {
          iga_cad_id: infoGA.iga_cad_id
        },
        attributes:["iga_id","iga_codigo","iga_archivo","iga_stal_id","iga_estado"]
      });
     

      if (infoGA_Creado) {

        if(infoGAs_Creados){

            for (const i of infoGAs_Creados) {
                await InformeGuardaAlmacen.update(
                    { iga_estado: 0 },
                    { where: { iga_id: i.iga_id } }
                );
            }
        }

        nuevoIGA = infoGA_Creado;
        let cambiarEstado = await InformeGuardaAlmacen.update(
          {
            iga_estado: 1,
          },
          {
            where: { iga_id: iga_id },
          }
        );


        if (!cambiarEstado || cambiarEstado[0] === 0) {

            throw new Error(`Error al actualizar estado, ya esta en estado 1`);
            
        }
        

      } else {
        
        if(infoGAs_Creados){

            for (const i of infoGAs_Creados) {
                await InformeGuardaAlmacen.update(
                    { iga_estado: 0 },
                    { where: { iga_id: i.iga_id } }
                );
            }
        }

        const dataOriginal = infoGA.toJSON();
        delete dataOriginal.iga_id; //* Como sera un nuevo id de informe, borramos el id actual para que se cree uno nuevo

        //* Cambiamos algunos valores que no necesitamos se copien en el nuevo informe
        dataOriginal.iga_usu_id = req.user.log_usu_id;
        dataOriginal.iga_stal_id = iga_stal_id;
        dataOriginal.iga_codigo = codigocorrelativo;
        dataOriginal.iga_fechaabandono = infoGA_Creado?.iga_fechaabandono
          ? formatFechaSafe(infoGA_Creado.iga_fechaabandono)
          : null;
        dataOriginal.iga_fechaingreso = infoGA_Creado?.iga_fechaingreso
          ? formatFechaSafe(infoGA_Creado.iga_fechaingreso)
          : null;
 
        dataOriginal.iga_fecha = infoGA_Creado?.iga_fecha
          ? formatFechaSafe(infoGA_Creado.iga_fecha)
          :  moment().format('YYYY-MM-DD HH:mm:ss'); 

        dataOriginal.iga_fecha_recepcionado =
          infoGA_Creado?.iga_fecha_recepcionado
            ? formatFechaSafe(infoGA_Creado.iga_fecha_recepcionado)
            : null;
        dataOriginal.iga_archivo = null;
        dataOriginal.iga_estado = 1;
        dataOriginal.iga_salida = 0;
        dataOriginal.de_lgx = 1;
        console.log(dataOriginal);

        nuevoIGA = await InformeGuardaAlmacen.create(dataOriginal);

        //! ====================================================================
        //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
        //! ====================================================================
        try {
          // Definimos la data que se guardara en el logs de usuarios
          const datalogs = {
            usuario: req.user.log_username,
            tipo_de_evento: "Crear IGA - Cambio Regimen",
            fecha_del_evento: moment().format(),
            tabla_afectada: "clg_iga_informeguardalmacen",
            info_antes_de_modificar: null,
            info_despues_de_modificar: JSON.stringify(nuevoIGA),
            id_principal: nuevoIGA.iga_id,
            tipo_registro: "Informe",
          };

          //Enviamos la data a la funcion de logs
          await logsUsers(req, res, next, datalogs);
        } catch (error) {
          //! Registramos el error capturado
          try {
            next(error);
          } catch (e) {}
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: nuevoIGA,
      };

    } catch (error) {
      jsonResponse = {
        status: 400,
        message: "Error",
        response: `Ocurrio un error al crear el Informe Guarda Almacen. ==> ${error.message}`,
      };

      //! Registramos el error capturado
      try {
        next(error);
      } catch (e) {}

      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  } //END CrearIGACambioRegimen

  static async formatFechaSafe(fecha) {
    if (!fecha) return null;
    const d = new Date(fecha);
    if (isNaN(d)) return null; // Si no es una fecha válida
    return d.toISOString().slice(0, 19).replace("T", " ");
  }
}

module.exports = informesguardaalmacencontroller;
