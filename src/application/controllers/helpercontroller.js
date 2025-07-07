const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const moment = require('moment');
const AWS = require('aws-sdk');
const stream = require('stream');
const puppeteer = require("puppeteer");
const path = require("path");

/**  
 * *Importación de modelos a utilizar
*/
const Usuarios = require('../models/UsuarioModel');
const EstadosAlmacenaje = require("../models/EstadosAlmacenajeModel");
const TipoDocTransporte = require("../models/TipoDocTransporteModel");
const Aduanas = require("../models/AduanasModel");
const Transportistas = require("../models/TransportistaModel");
const CartaAceptacion = require("../models/CartaAceptacionModel");
const DetalleCA = require("../models/DetalleCartaAceptacionModel");
const Clientes = require("../models/ClientesModel");
const Pais = require("../models/PaisModel");
const Roles = require("../models/RolModel");
const DetalleGuardaAlmancen = require("../models/DetalleInformeGuardaAlmacenModel");
const Productos = require("../models/ProductosModel");
const InformeGuardaAlmacen = require("../models/InformeGuardaAlmacenModel");
const Registro_correcciones = require("../models/RegistroCorreccionesModel");
const Salidas = require("../models/SalidasModel");
const TipoDocSalidas = require("../models/TipoDocSalidaModel");
const DetalleSalida = require("../models/DetalleSalidasModel");
const SalidaConsolidada = require("../models/SalidasConsolidadasModel");
const InformeGuardaAlmancen = require("../models/InformeGuardaAlmacenModel");
const Tarimas = require("../models/TarimasModel");
const { data_consolidado } = require("../services/ObtenerDatosConsolidadoService");

class helpercontroller {

    /**
     * !PASA EL DATO DE ROL_ID A ROL_ID_LGX
     */
    static async PasarRolNewCampoRol(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        try {
            const usuarios = await Usuarios.findAll({
                where: {
                    acceso_logix: true
                }
            });

            await Promise.all(usuarios.map(async dataU => {
                const datosUsuario = dataU;

                await Usuarios.update(
                    // Datos a actualizar
                    {
                        rol_id_lgx: datosUsuario.usu_rol_id
                    },
                    {
                        where: { usu_id: datosUsuario.usu_id }
                    }
                );
            }));

            jsonResponse = {
                status: 200,
                message: "Success",
                response: "Terminado"
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
    }//END ObtenerRoles

    // !Función para obtener la extensión a partir del mimetype
    static async getExtensionFromMimeType(mimeType) {
        const mimeTypeMap = {
            'image/jpeg': '.jpeg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/bmp': '.bmp',
            'image/svg+xml': '.svg',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
        };

        return mimeTypeMap[mimeType] || '.bin';  // Retorna .jpg por defecto si no se encuentra el mimetype
    }


    //*****************************************************/
    //MÉTODO PARA GUARDAR IMÁGENES DE MENU DE LGX (NO ES PARA USAR EN LA APP O DASHBOARD)
    //*****************************************************/
    static async Menus(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };
        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";
        let path = null;

        try {
            //Guardamos en estas variables la data que envio el usuario
            const { name_icon } = req.body;

            //! OBTENEMOS LA INFORMACIÓN DEL ARCHIVO QUE ACABAMOS DE ADJUNTAR A LA CARTA
            const iconoImage = req.files['icono'] ? req.files['icono'][0] : null;

            //TODO: Guardamos el archivo subido cuando se anulo la carta
            if (iconoImage) {
                // Obtener la extensión del archivo usando la función
                let extension = await helpercontroller.getExtensionFromMimeType(iconoImage.mimetype);
                // Nombre del archivo
                const filename = name_icon + extension;
                path = do_path + 'IconosDelSistema/' + filename;

                const spacesEndpoint = new AWS.Endpoint(do_spe + 'IconosDelSistema/');

                const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: do_spk,
                    secretAccessKey: do_sps
                });

                await s3.putObject({
                    Bucket: do_spn,
                    Key: filename,
                    Body: Buffer.from(iconoImage.buffer, iconoImage.buffer.length),
                    ContentLength: iconoImage.size,
                    ContentType: iconoImage.mimetype,
                    ACL: 'public-read'
                }).promise();

            }

            jsonResponse = {
                status: 200,
                message: "success",
                response: path
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
                message: "error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }


    /**
    * TODO FUNCIÓN PARA GUARDAR LOS REGISTROS DE CORRECCIONES
    */
    static async GuardarCorrecciones({ req, log }) {
        try {
            await Registro_correcciones.create({
                rec_tipo_documento: log.tipo,
                rec_ndocumento: log.documento,
                rec_motivo: log.motivoCorreccion,
                rec_solicito: log.solicitante,
                rec_nuevo: log.dato_nuevo,
                rec_antiguo: log.dato_antiguo,
                //rec_corrigio: req.user.log_username,
                rec_corrigio: "oneyda chavez",
            });

            return true;
        } catch (error) {
            console.error("Error al registrar correcciones:", error);
            throw new Error(error.message);
        }
    }


    /**
     * TODO FUNCIÓN PARA GUARDAR NUEVAS CARTAS DE ACEPTACIÓN
     */
    static async CrearPDFCA({ req, res, next, id }) {
        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";
        let path_carta = null;
        let cac_totalbl = 0;
        let cac_totalpeso = 0;
        let cac_totalcbm = 0;

        try {
            //const { cac_id } = req.body;
            let cac_id = id;
            console.log("CAC ID:", cac_id);
            const datos_carta = await CartaAceptacion.findByPk(cac_id);
            const dataArrayClientes = await DetalleCA.findAll({
                where: {
                    cad_cac_id: cac_id,
                },
                include: [
                    {
                        model: Clientes,
                    },
                    {
                        model: Pais,
                    },
                ],
                order: [["cad_cac_id", "ASC"]],
            });

            //TODO: Con esto obtenemos los totales de bl, peso y volumen
            for (const cliente of dataArrayClientes) {
                try {
                    cac_totalbl += parseFloat(cliente.cad_cantbultos) || 0;
                    cac_totalpeso += parseFloat(cliente.cad_peso) || 0;
                    cac_totalcbm += parseFloat(cliente.cad_cbm) || 0;
                } catch (error) {
                    //! Registramos el error capturado
                    try {
                        next(error);
                    } catch (e) { }
                }
            }
            //* Obtenemos informacione del estado de almacenaje
            const estadoAlmacenaje = await EstadosAlmacenaje.findOne({
                where: {
                    stal_id: datos_carta.cac_stal_id,
                },
            });

            //* Obtenemos informacion del tipo de documento de transporte
            const docTransporte = await TipoDocTransporte.findOne({
                where: {
                    tdt_id: datos_carta.cac_tdt_id,
                },
            });

            //* Obtenemos informacion de la aduana
            const aduana = await Aduanas.findOne({
                where: {
                    adu_id: datos_carta.cac_adu_id,
                },
            });

            //* Obtenemos informacion del transportista
            const Transportista = await Transportistas.findOne({
                where: {
                    tra_id: datos_carta.cac_tra_id,
                },
            });
            

          

            //* Obtenemos informacion del usuario que esta creando la carta
            const dataUsuario = await Usuarios.findOne({
                where: {
                    usu_id: datos_carta.cac_guardalmacen_usu_id,
                },
                include: [
                    {
                        model: Roles,
                        foreignKey: "usu_rol_id",
                        targetKey: "rol_id",
                    },
                ],
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
                    "formatoCA",
                    {
                        cartaNumero: datos_carta.cac_numero,
                        fecha: moment(datos_carta.cac_fecha).format("DD-MM-YYYY"),
                        docTransporte: docTransporte.tdt_abreviatura,
                        estadoAlmacenaje: estadoAlmacenaje
                            ? estadoAlmacenaje.stal_estado
                            : "",
                        cac_tipocontenedor: datos_carta.cac_tipocontenedor,
                        cac_contenedor: datos_carta.cac_contenedor,
                        aduana: aduana.adu_nombre,
                        transportista: Transportista.tra_nombre ?? '',
                        consignatarios: dataArrayClientes,
                        totalBl: cac_totalbl,
                        totalPeso: cac_totalpeso.toFixed(3),
                        totalCBM: cac_totalcbm.toFixed(3),
                        creada_por:
                            dataUsuario.usu_nombres + " " + dataUsuario.usu_apellidos ??
                            "CLG",
                        rol: dataUsuario.crm_rol.rol_nombre,
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
                res.render("footerCA", {}, (err, footerHtml) => {
                    if (err) reject(err);
                    resolve(footerHtml);
                });
            });

            // Download the PDF
            const pdfBuffer = await page.pdf({
                path: `CartaAceptacion_${datos_carta.cac_numero}.pdf`,
                displayHeaderFooter: true,
                headerTemplate:
                    '<div style="margin-right: 50px; font-size:10px; text-align:right; width:100%;">Fecha de creación: ' +
                    moment(datos_carta.cac_fecha).format("DD-MM-YYYY") +
                    "</div>",
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
                margin: { top: "30px", right: "50px", bottom: "50px", left: "50px" },
                printBackground: true,
                format: "Letter",
            });

            //Si lo quisieramos convertir a Base64
            //const pdfBase64 = pdfBuffer.toString('base64');

            await browser.close();

            // Nombre del archivo
            const filename = datos_carta.cac_numero + ".pdf";
            path_carta = do_path + "Cartas_Aceptacion/" + filename;

            // Configurar el endpoint de DigitalOcean Spaces
            const spacesEndpoint = new AWS.Endpoint(do_spe + "Cartas_Aceptacion/");
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

            //* Actualizamos la carta agregando el path_carta del pdf de la carta recien creado
            await CartaAceptacion.update(
                {
                    cac_pdf: path_carta,
                },
                {
                    where: { cac_id },
                }
            );

            return true;
        } catch (error) {
            console.error("Error al crear PDF de CA:", error);
            throw new Error(error.message); // Lanza el error si necesitas capturarlo fuera
        }
    } //END CrearPDFCA


    /**
   * TODO FUNCIÓN PARA CREAR EL ARCHIVO DE INFORME PDF
   */
  static async CrearPdfInforme({ req, res, next, id }) {
    //creamos el dato para subirlo a DO Space
    const do_path = process.env.DO_SPACES_PATH;
    const do_spe = process.env.DO_SPACES_ENDPOINT || "";
    const do_spk = process.env.DO_SPACES_KEY;
    const do_sps = process.env.DO_SPACES_SECRET;
    const do_spn = process.env.DO_SPACES_NAME || "";
    let iga_id = id;

    try {
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
          iga_id: iga_id,
        },
      });

      const dataUsuario = await Usuarios.findOne({
        where: {
          usu_id: infoIga.iga_usu_id,
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
            iga_fecha_recepcionado: moment
              .utc(infoIga.iga_fecha_recepcionado)
              .format("DD-MM-YYYY hh:mm A"),
            stal_estado: infoIga.clg_stal_estadosalmacenaje.stal_estado,
            iga_fechaingreso: moment
              .utc(infoIga.iga_fechaingreso)
              .format("DD-MM-YYYY"),
            tra_nombre:
              infoIga.clg_cac_aceptacion.clg_tra_transportista.tra_nombre ?? '',
            cac_numero: infoIga.clg_cac_aceptacion.cac_numero,
            iga_manifiesto: infoIga.iga_manifiesto,
            cac_fecha: moment
              .utc(infoIga.clg_cac_aceptacion.cac_fecha)
              .format("DD-MM-YYYY"),
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
            correo_usuario: dataUsuario.usu_email,
            descripcion:
              infoIga.clg_dga_detallesguardalmacens[0].clg_pro_producto
                .pro_nombre,
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
        res.render("footerIGA", {}, (err, footerHtml) => {
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
      return true;
    } catch (error) {
      console.error("Error al crear PDF de INFORME:", error);
      throw new Error(error.message);
    }
  } //END CrearPdfInforme


    /**
     * TODO: FUNCION PARA CREAR EL ARCHIVO PDF DE SALIDA SIMPLE Y CONSOLIDADA
     */
    static async CrearPDFSAL({ req, res, next, id }) {
        const salida_consolidada =
            (await SalidaConsolidada.findOne({
                where: {
                    sco_sal_id: id,
                },
            })) || 0;

        let tipoSalida = salida_consolidada ? "Consolidada" : "Simple";
        let datos = false;

        if (tipoSalida == "Simple") {
            datos = await this.CrearPDFSALSIMPLE({ req, res, next, id });
        } else if (tipoSalida == "Consolidada") {
            datos = await this.CrearPDFSALConsolidada({ req, res, next, id });
        }

        return datos;
    } //END CrearPdfSalidas


    /**
     * TODO: FUNCION PARA CREAR EL ARCHIVO PDF DE SALIDA SIMPLE Y CONSOLIDADA
     */
    static async CrearPDFSALSIMPLE({ req, res, next, id }) {
        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";

        try {
            const infoSalGeneral = await Salidas.findOne({
                where: {
                    sal_id: id,
                },
                include: [
                    {
                        model: InformeGuardaAlmancen,
                        include: [
                            {
                                model: CartaAceptacion,
                                attributes: ["cac_numero"],
                            },
                        ],
                    },
                    {
                        model: TipoDocSalidas,
                        attributes: ["tdocsal_documento"],
                    },
                ],
            });
            // return infoSalGeneral;

            const dataCliente = await Clientes.findOne({
                where: {
                    cli_id: infoSalGeneral.sal_cli_id,
                },
                attributes: ["cli_nombre"],
            });
            const infoSalDetalle = await DetalleSalida.findOne({
                where: {
                    sald_sal_id: infoSalGeneral.sal_id,
                },
                include: [
                    {
                        model: Tarimas,
                        include: [
                            {
                                model: DetalleGuardaAlmancen,
                                include: [
                                    {
                                        model: Productos,
                                        attributes: ["pro_id", "pro_nombre", "pro_codigo"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            // return infoSalGeneral;

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
                    "formatoSAL",
                    {
                        salida: infoSalGeneral.sal_codigo,
                        tarimasPrestadas: infoSalGeneral.tarimasPrestadas,
                        fechaImpresion: moment.utc(infoSalGeneral.sal_fecha).format(
                            "DD-MM-YYYY hh:mm A"
                        ),
                        fecha: infoSalGeneral.sal_fecha,
                        cliente: dataCliente.cli_nombre,
                        tipoDocumento:
                            infoSalGeneral.clg_tipodocumento_salida.tdocsal_documento,
                        fechaDocumento: moment.utc(infoSalGeneral.sal_fechadm).format(
                            "DD-MM-YYYY hh:mm A"
                        ),
                        noDocumento: infoSalGeneral.sal_numerodm,
                        factura: infoSalGeneral.sal_fac_id,
                        peso: infoSalGeneral.sal_peso,
                        documentoTransporte: infoSalGeneral.sal_doctransporte,
                        volumen: infoSalGeneral.sal_volumen,
                        destino: infoSalGeneral.sal_pai_id,
                        totalBultos: infoSalGeneral.sal_nbultos,
                        cartaAceptacion:
                            infoSalGeneral.clg_iga_informeguardalmacen?.clg_cac_aceptacion
                                ?.cac_numero || "",
                        placa: infoSalGeneral.sal_placa,
                        piloto: infoSalGeneral.sal_nombre_piloto,
                        codigo: infoSalGeneral.sal_codigo,
                        licencia: infoSalGeneral.sal_licencia_conducir,
                        comentarios: infoSalGeneral.sal_comentarios,
                        informe: infoSalGeneral.clg_iga_informeguardalmacen.iga_codigo,
                        regimen: infoSalGeneral.clg_iga_informeguardalmacen.iga_stal_id,
                        ubicacion: infoSalGeneral.clg_iga_informeguardalmacen.iga_ubicacion,
                        lote: moment(
                            infoSalGeneral.clg_iga_informeguardalmacen.iga_fecha
                        ).format("Y"),
                        fechaIngreso: moment(infoSalGeneral.sal_fecha_ingreso).format(
                            "DD-MM-YYYY"
                        ),
                        endoso: infoSalGeneral.sal_endoso,
                        codigo:
                            infoSalDetalle.clg_tar_tarima.clg_dga_detallesguardalmacen
                                .clg_pro_producto.pro_codigo,
                        descripcion:
                            infoSalDetalle.clg_tar_tarima.clg_dga_detallesguardalmacen
                                .clg_pro_producto.pro_nombre,
                        descargo: infoSalDetalle.sald_descargo,
                        bultos: infoSalDetalle.sald_cantidad,
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
                res.render(
                    "footerSAL",
                    { endoso: infoSalGeneral.sal_endoso },
                    (err, footerHtml) => {
                        if (err) reject(err);
                        resolve(footerHtml);
                    }
                );
            });

            // Download the PDF
            const pdfBuffer = await page.pdf({
                path: `${infoSalGeneral.sal_codigo}.pdf`,
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
            const filename = `${infoSalGeneral.sal_codigo}.pdf`;
            const path_carta = do_path + "DocumentosSal/Salidas/" + filename;
            //* Configurar el endpoint de DigitalOcean Spaces
            const spacesEndpoint = new AWS.Endpoint(
                do_spe + "DocumentosSal/Salidas/ "
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


            return true;
        } catch (error) {
            console.error("Error al crear PDF de salida simple:", error);
            throw new Error(error.message);
        }
    } //END CrearPdfSalidasSimples


    /**
    * TODO: FUNCION PARA CREAR EL ARCHIVO PDF DE SALIDA SIMPLE Y CONSOLIDADA
    */
    static async CrearPDFSALConsolidada({ req, res, next, id }) {
        //creamos el dato para subirlo a DO Space
        const do_path = process.env.DO_SPACES_PATH;
        const do_spe = process.env.DO_SPACES_ENDPOINT || "";
        const do_spk = process.env.DO_SPACES_KEY;
        const do_sps = process.env.DO_SPACES_SECRET;
        const do_spn = process.env.DO_SPACES_NAME || "";

        try {
            const infoSalSalida = await data_consolidado(id);

            let salidas = infoSalSalida.datos.detalle;
            let arrayCodigos = [];
            salidas.map((item) => {
                arrayCodigos.push(item.codigoca);
            });

            let codigoca = arrayCodigos.join("/");
            //return codigoca

            // return infoSalSalida.datos;
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
                    "formatoSALConsolidada",
                    {
                        codigo: infoSalSalida.datos.general.codigo,
                        tarimasPrestadas: infoSalSalida.datos.general.tarimasPrestadas,
                        cliente: infoSalSalida.datos.general.cliente,
                        numerodm: infoSalSalida.datos.general.numerodm,
                        factura: infoSalSalida.datos.general.factura,
                        peso: infoSalSalida.datos.general.peso,
                        doctransporte: infoSalSalida.datos.general.doctransporte,
                        volumen: infoSalSalida.datos.general.volumen,
                        pais: infoSalSalida.datos.general.pais,
                        bultosxtarima: infoSalSalida.datos.general.bultosxtarima,
                        comentarios: infoSalSalida.datos.general.comentarios,
                        placa: infoSalSalida.datos.general.placa,
                        fechaImpresion: moment.utc(infoSalSalida.datos.general.fecha).format(
                            "DD-MM-YYYY hh:mm A"
                        ),
                        fechadm: moment.utc(infoSalSalida.datos.general.fechadm).format(
                            "DD-MM-YYYY"
                        ),
                        fecha: moment.utc(infoSalSalida.datos.general.fecha).format(
                            "DD-MM-YYYY"
                        ),
                        noCodigo: infoSalSalida.datos.general.noCodigo,
                        piloto: infoSalSalida.datos.general.piloto,
                        dui: infoSalSalida.datos.general.dui,
                        licConducir: infoSalSalida.datos.general.licConducir,
                        endosado: infoSalSalida.datos.general.endosado,
                        tipodoc: infoSalSalida.datos.general.tipodoc,
                        codigopro: infoSalSalida.datos.detalle.codigopro,
                        descripcion: infoSalSalida.datos.detalle.descripcion,
                        lote: infoSalSalida.datos.detalle.lote,
                        idiga: infoSalSalida.datos.detalle.idiga,
                        regimen: infoSalSalida.datos.detalle.regimen,
                        codigoiga: infoSalSalida.datos.detalle.codigoiga,
                        ubicacion: infoSalSalida.datos.detalle.ubicacion,
                        piezas: infoSalSalida.datos.detalle.piezas,
                        descargo: infoSalSalida.datos.detalle.descargo,
                        clienteDetalle: infoSalSalida.datos.detalle.clienteDetalle,
                        codigoca: infoSalSalida.datos.detalle.codigoca,
                        codigocaArreglo: codigoca,
                        detalles: infoSalSalida.datos.detalle,
                        fechasigas: infoSalSalida.datos.fechasigas,

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
                res.render("footerSAL", { endoso: infoSalSalida.datos.general.endosado }, (err, footerHtml) => {
                    if (err) reject(err);
                    resolve(footerHtml);
                });
            });

            // Download the PDF
            const pdfBuffer = await page.pdf({
                path: `${infoSalSalida.datos.general.codigo}.pdf`,
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
                landscape: true,
            });

            await browser.close();

            //* Nombre del archivo
            const filename = `${infoSalSalida.datos.general.codigo}.pdf`;
            const path_carta =
                do_path + "DocumentosSal/Salidas/" + filename;
            //* Configurar el endpoint de DigitalOcean Spaces
            const spacesEndpoint = new AWS.Endpoint(
                do_spe + "DocumentosSal/Salidas/"
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

            return true;
        } catch (error) {
            console.error("Error al crear PDF de salida consolidada:", error);
            throw new Error(error.message);
        }
    } //END CrearPdfSalidasconsolidads


    static async actualizarSecuenciaPDF({
        req,
        res,
        next,
        dato_nuevo,
        cad_cac_id,
    }) {
        try {
            const informes = await InformeGuardaAlmacen.findAll({
                where: { iga_cac_id: cad_cac_id },
                attributes: ["iga_codigo", "iga_id"],
            });


            if (!informes || informes.length === 0) return false;

            for (const informe of informes) {
                const [actualizado] = await InformeGuardaAlmacen.update(
                    { iga_cli_id: dato_nuevo },
                    {
                        where: {
                            iga_codigo: informe.iga_codigo,
                        },
                    }
                );


                if (actualizado > 0) {
                    await helpercontroller.CrearPdfInforme({
                        req,
                        res,
                        next,
                        id: informe.iga_id,
                    });
                } else {
                    console.warn(`No se actualizó el informe con iga_codigo: ${informe.iga_codigo}`);

                }
            }

            return true;
        } catch (error) {
            console.error("Error al actualizar secuencia PDF:", error);
            throw new Error(error.message);
        }
    }
}

module.exports = helpercontroller;