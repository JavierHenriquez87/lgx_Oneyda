const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envía el usuario
const { Sequelize, where } = require("sequelize");
const Login = require("../models/LoginModel");
const { el } = require("date-fns/locale");
const db = require("../../database/db");
//Controladores a
const helpercontroller = require("./helpercontroller");
const panelcorrecciones = require("../services/PanelCorreccionesService");

// Modelos a utilizar
const Usuarios = require("../models/UsuarioModel");
const InformeGuardaAlmancen = require("../models/InformeGuardaAlmacenModel");
const DetalleCA = require("../models/DetalleCartaAceptacionModel");
const CAceptacion = require("../models/CartaAceptacionModel");
const InformeGuardaAlmacen = require("../models/InformeGuardaAlmacenModel");

class panelcorreccionescontroller {
  //* Obtener listado de usuario para el select de solicitantes de correcciones
  static async ObtenerUsuariosCorrecciones(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    try {
      const data = await Usuarios.findAll({
        attributes: [
          ["usu_id", "id"],
          [
            Sequelize.literal("CONCAT(usu_nombres, ' ', usu_apellidos)"),
            "nombre",
          ],
          [
            Sequelize.literal("CONCAT(usu_cargo, ' - ', `log_username`)"),
            "usuario",
          ],
        ],
        where: {
          usu_clg_correccion: "Si",
        },
        include: [
          {
            model: Login,
            attributes: [], // No incluir columnas adicionales
          },
        ],
        order: [["nombre", "asc"]],
        raw: true,
      });

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Obtener datos para la consulta de documentos (Cartas, Informes, Salidas)
  static async ConsultarDocumento(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo } = req.body;

      let data = await panelcorrecciones.data_busquedaPorCarta({
        documento,
        tipo,
      });

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Obtener datos de los documentos para
  //* Cambio de fecha
  static async ObtenerDatosDocumento(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo } = req.body;

      let data;
      if (tipo == "Carta") {
        data = await panelcorrecciones.data_fecha_carta({
          documento,
        });
      } else if (tipo == "Informe") {
        data = await panelcorrecciones.data_fecha_informe({
          documento,
        });
      } else if (tipo == "Salida") {
        data = await panelcorrecciones.data_fecha_salida({
          documento,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //!
  static async CambiarFechaDocumento(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("id").notEmpty().withMessage("id es requerido."),
      check("nuevaFecha").notEmpty().withMessage("nuevaFecha es requerido."),
      check("nuevaAntigua")
        .notEmpty()
        .withMessage("nuevaAntigua es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        id,
        nuevaFecha,
        nuevaAntigua,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;

      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      } else if (tipo == "Salida") {
        tipoLog = "SAL";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: nuevaFecha,
        dato_antiguo: nuevaAntigua,
      };

      data = await panelcorrecciones.actualizarFechaDocumento({
        tipo,
        id,
        nuevaFecha,
        log,
      });

      let resultadoPDF = false;

      let registroGuardado = false;

      if (data == true) {
        switch (tipo) {
          case "Carta":
            resultadoPDF = await helpercontroller.CrearPDFCA({
              req,
              res,
              next,
              id,
            });
            break;
          case "Informe":
            resultadoPDF = await helpercontroller.CrearPdfInforme({
              req,
              res,
              next,
              id,
            });
            break;
          case "Salida":
            resultadoPDF = await helpercontroller.CrearPDFSAL({
              req,
              res,
              next,
              id,
            });
            break;
          default:
            resultadoPDF = false;
        }

        if (resultadoPDF == true) {
          registroGuardado = await helpercontroller.GuardarCorrecciones({
            req,
            log,
          });
        }

        jsonResponse = {
          status: 200,
          message: "Success",
          response: "Documento Actualizado con éxito",
        };
      } else {
        jsonResponse = {
          status: 200,
          message: "Success",
          response: "No se realizó modificación",
        };
      }
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para actualizar el PDF de una Carta, Informe o Salida
  static async ActualizarPDF(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("id").notEmpty().withMessage("id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo, id, motivoCorreccion, solicitante } = req.body;

      let data,
        tipoLog = tipo;
      let clave = "";
      if (tipo == "Carta") {
        tipoLog = "CA";
        clave += "cac";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
        clave += "iga";
      } else if (tipo == "Salida") {
        tipoLog = "SAL";
        clave += "sal";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: "",
        dato_antiguo: "",
      };

      let registroGuardado = false;
      let informes = [];
      switch (tipo) {
        case "Carta":
          data = await helpercontroller.CrearPDFCA({
            req,
            res,
            next,
            id,
          });

          if (data == true) {
            informes =
              (await InformeGuardaAlmancen.findAll({
                where: {
                  iga_cac_id: id,
                },

                attributes: ["iga_id"],
              })) || 0;

            if (informes.length > 0) {
              informes.forEach(async (row) => {
                await helpercontroller.CrearPdfInforme({
                  req,
                  res,
                  next,
                  id: row.iga_id,
                });
              });
            }
          }

          break;
        case "Informe":
          data = await helpercontroller.CrearPdfInforme({
            req,
            res,
            next,
            id: id,
          });

          break;
        case "Salida":
          data = await helpercontroller.CrearPDFSAL({
            req,
            res,
            next,
            id,
          });

          break;
        default:
          data = false;
      }
      if (data == true) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Documento modificado con éxito",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para obtener los datos de pais de destino de una Carta,
  static async ObtenerDatosPaisDestino(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo } = req.body;

      let data;

      data = await panelcorrecciones.data_cambio_destino({ documento, tipo });

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para obtener los datos de pais de origen de un Informe
  static async ObtenerDatosPaisOrigen(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo } = req.body;

      let data;

      data = await panelcorrecciones.data_cambio_origen({ documento, tipo });

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para actualizar los datos de pais de destino de una Carta,
  static async ActualizarPaisDestino(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("pais_nuevo").notEmpty().withMessage("pais_nuevo es requerido."),
      check("pais_antiguo")
        .notEmpty()
        .withMessage("pais_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        pais_nuevo,
        cad_id,
        motivoCorreccion,
        solicitante,
        pais_antiguo,
      } = req.body;

      let data,
        tipoLog = tipo;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }
      let registroGuardado = false;

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: pais_nuevo,
        dato_antiguo: pais_antiguo,
      };

      data = await panelcorrecciones.data_actualizar_destino({
        req,
        res,
        next,
        documento,
        tipo,
        pais_nuevo,
        cad_id,
      });

      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para actualizar los datos de pais de origen de un Informe,
  static async ActualizarPaisOrigen(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("pais_nuevo").notEmpty().withMessage("pais_nuevo es requerido."),
      check("pais_antiguo")
        .notEmpty()
        .withMessage("pais_antiguo es requerido."),
      check("cac_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        pais_nuevo,
        cac_id,
        motivoCorreccion,
        solicitante,
        pais_antiguo,
      } = req.body;

      let data,
        tipoLog = tipo;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }
      let registroGuardado = false;

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: pais_nuevo,
        dato_antiguo: pais_antiguo,
      };

      data = await panelcorrecciones.data_actualizar_origen({
        req,
        res,
        next,
        documento,
        tipo,
        pais_nuevo,
        cac_id,
      });

      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar cliente en carta e informe
  static async CambioCliente(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("cliente_nuevo")
        .notEmpty()
        .withMessage("cliente_nuevo es requerido."),
      check("cliente_antiguo")
        .notEmpty()
        .withMessage("cliente_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        cliente_nuevo,
        cliente_antiguo,
        cad_id,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: cliente_nuevo,
        dato_antiguo: cliente_antiguo,
      };

      data = await panelcorrecciones.data_actualizar_cliente({
        req,
        res,
        next,
        documento,
        tipo,
        cliente_nuevo,
        cad_id,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar aduana a carta e informe
  static async CambioAduana(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("aduana_nuevo")
        .notEmpty()
        .withMessage("aduana_nuevo es requerido."),
      check("aduana_antiguo")
        .notEmpty()
        .withMessage("aduana_antiguo es requerido."),
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        aduana_nuevo,
        aduana_antiguo,
        id_carta,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: aduana_nuevo,
        dato_antiguo: aduana_antiguo,
      };

      data = await panelcorrecciones.data_actualizar_aduana({
        req,
        res,
        next,
        documento,
        tipo,
        aduana_nuevo,
        id_carta,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizó el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar transportist a carta e informe
  static async CambioTransportista(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("transportista_nuevo")
        .notEmpty()
        .withMessage("transportista_nuevo es requerido."),
      check("transportista_antiguo")
        .notEmpty()
        .withMessage("transportista_antiguo es requerido."),
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        transportista_nuevo,
        transportista_antiguo,
        id_carta,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: transportista_nuevo,
        dato_antiguo: transportista_antiguo,
      };

      data = await panelcorrecciones.data_actualizar_transportista({
        req,
        res,
        next,
        documento,
        tipo,
        transportista_nuevo,
        id_carta,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
        // response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar contenedor a carta e informe
  static async CambioContenedor(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("contenedor_nuevo")
        .notEmpty()
        .withMessage("contenedor_nuevo es requerido."),
      check("contenedor_antiguo")
        .notEmpty()
        .withMessage("transportista_antiguo es requerido."),
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        contenedor_nuevo,
        contenedor_antiguo,
        id_carta,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: contenedor_nuevo,
        dato_antiguo: contenedor_antiguo,
      };

      data = await panelcorrecciones.Actualizar_contenedor({
        req,
        res,
        next,
        documento,
        tipo,
        contenedor_nuevo,
        id_carta,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //*Obtener la informacion general
  static async informacionDocTransporte(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento, tipo } = req.body;
      let data, total, volumen, bultos;
      ({ data, total, volumen, bultos } =
        await panelcorrecciones.DataDocTransporte({
          documento,
          tipo,
        }));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
        peso_total: total,
        volumen_total: volumen,
        bultos_total: bultos,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar el documento transporte a carta e informe
  static async CambioDocumentoTransporte(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("DocTransporte_nuevo")
        .notEmpty()
        .withMessage("DocTransporte_nuevo es requerido."),
      check("DocTransporte_antiguo")
        .notEmpty()
        .withMessage("DocTransporte_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        DocTransporte_nuevo,
        DocTransporte_antiguo,
        cad_id,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: DocTransporte_nuevo,
        dato_antiguo: DocTransporte_antiguo,
      };

      data = await panelcorrecciones.Actualizar_DocTransporte({
        req,
        res,
        next,
        documento,
        tipo,
        DocTransporte_nuevo,
        cad_id,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar el peso a carta e informe
  static async CambioPeso(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("Peso_nuevo").notEmpty().withMessage("Peso_nuevo es requerido."),
      check("Peso_antiguo")
        .notEmpty()
        .withMessage("Peso_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        Peso_nuevo,
        Peso_antiguo,
        cad_id,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: Peso_nuevo,
        dato_antiguo: Peso_antiguo,
      };

      data = await panelcorrecciones.Actualizar_Peso({
        req,
        res,
        next,
        documento,
        tipo,
        Peso_nuevo,
        cad_id,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }
      if (data == true) {
        jsonResponse = {
          status: 200,
          message: "Success",
          response: "Se actualizo el dato correctamente",
        };
      }
      jsonResponse = {
        status: 500,
        message: "error",
        response: "No se  actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar el volumen a carta e informe
  static async CambioVolumen(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("volumen_nuevo")
        .notEmpty()
        .withMessage("Volumen_nuevo es requerido."),
      check("volumen_antiguo")
        .notEmpty()
        .withMessage("volumen_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        volumen_nuevo,
        volumen_antiguo,
        cad_id,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: volumen_nuevo,
        dato_antiguo: volumen_antiguo,
      };

      data = await panelcorrecciones.Actualizar_Volumen({
        req,
        res,
        next,
        documento,
        tipo,
        volumen_nuevo,
        cad_id,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para cambiar los bultos a carta e informe
  static async Cambio_Bultos(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("bulto_nuevo").notEmpty().withMessage("Bulto_nuevo es requerido."),
      check("bulto_antiguo")
        .notEmpty()
        .withMessage("Bulto_antiguo es requerido."),
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento,
        tipo,
        bulto_nuevo,
        bulto_antiguo,
        cad_id,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data,
        tipoLog = tipo;
      let registroGuardado = false;
      if (tipo == "Carta") {
        tipoLog = "CA";
      } else if (tipo == "Informe") {
        tipoLog = "IGA";
      }

      let log = {
        tipo: tipoLog,
        documento,
        motivoCorreccion,
        solicitante,
        dato_nuevo: bulto_nuevo,
        dato_antiguo: bulto_antiguo,
      };

      data = await panelcorrecciones.Actualizar_Bultos({
        req,
        res,
        next,
        documento,
        tipo,
        bulto_nuevo,
        cad_id,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Obtener los clientes
  static async Informacion_Clientes(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento").notEmpty().withMessage("documento es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { documento } = req.body;

      const data = await panelcorrecciones.DataClientes(documento);

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //* Enviar datos para agregar cliente en carta
  static async Agregar_Cliente(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("documento_bl")
        .notEmpty()
        .withMessage("documento_bl es requerido."), // tipo texto
      check("tarifa").notEmpty().withMessage("tarifa es requerido."), // Si = 1, No = 0  es tipo texto
      check("bultos").notEmpty().withMessage("bultos es requerido."), //tipo entero
      check("peso").notEmpty().withMessage("peso es requerido."), //tipo decimal
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("cbm").notEmpty().withMessage("cbm es requerido."), //tipo decimal
      check("id_cliente").notEmpty().withMessage("id_cliente es requerido."), //tipo entero
      check("id_pais").notEmpty().withMessage("id_pais es requerido."), //tipo entero
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        documento_bl,
        tarifa,
        bultos,
        peso,
        id_carta,
        cbm,
        id_cliente,
        id_pais,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let registroGuardado = false;

      let log = {
        tipo: "Carta",
        documento: id_carta,
        motivoCorreccion,
        solicitante,
        dato_nuevo: id_cliente,
        dato_antiguo: "",
      };
      let cadTarifa = tarifa == "Si" ? 1 : 0;

      //validar que si el cliente ya existe que no se pueda agregar de nuevo
      const clienteExiste = await DetalleCA.findOne({
        where: { cad_cli_id: id_cliente },
      });

      if (clienteExiste.length > 0 ) {
        throw new Error(`El cliente ya existe en la carta`);
      }

      // Agregar el cliente a la carta
      const data = await DetalleCA.create({
        cad_cac_id: id_carta,
        cad_bl: documento_bl.toUpperCase(),
        cad_cantbultos: bultos,
        cad_cli_id: id_cliente,
        cad_peso: parseFloat(peso),
        cad_cbm: cbm,
        cad_pai_id: id_pais,
        cad_tarifa_diferenciada: cadTarifa,
      });

      if (data) {
        // obtener las sumatoria de la carta detalle
        const [sumatoriaCad] = await db.query(`
          SELECT SUM(cad_cantbultos) bultos,
            SUM(cad_peso) peso,
            SUM(cad_cbm) volumen,
            cad_cac_id carta
          FROM clg_cad_detalleaceptacion
          WHERE cad_cac_id = ${id_carta}
        `);

        if (!sumatoriaCad || sumatoriaCad.length === 0) {
          throw new Error(`No se encontro sumatoria para carta: ${id_carta}`);
        }

        //actualizar la carta con los nuevos datos de la sumatoria
        const [actualizarCarta] = await CAceptacion.update(
          {
            cac_totalbl: sumatoriaCad[0]?.bultos,
            cac_totalpeso: sumatoriaCad[0]?.peso,
            cac_totalvolumen: sumatoriaCad[0]?.volumen,
          },
          {
            where: { cac_id: id_carta },
          }
        );

        if (actualizarCarta === 0) {
          throw new Error(
            `No se encontró o no se pudo actualizar la carta con id: ${id_carta}`
          );
        }

        const actualizarCartapdf = await helpercontroller.CrearPDFCA({
          req,
          res,
          next,
          id: id_carta,
        });

        if (actualizarCartapdf == false) {
          throw new Error(
            `No se pudo crear el PDF de la carta con cad_cac_id: ${id_carta}`
          );
        }

        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
        jsonResponse = {
          status: 200,
          message: "Success",
          response: "Se agrego el cliente correctamente",
        };
      } else {
        jsonResponse = {
          status: 500,
          message: "error",
          response: data,
        };
      }
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  //funcion para eliminar clientes tanto en la carta como en el informe relacionado
  static async Eliminar_cliente(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("cad_id").notEmpty().withMessage("cad_id es requerido."),
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("motivoCorreccion")
        .notEmpty()
        .withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { cad_id, id_carta, motivoCorreccion, solicitante } =
        req.body;

      let registroGuardado = false;

      let log = {
        tipo: "Carta",
        documento: id_carta,
        motivoCorreccion,
        solicitante,
        dato_nuevo: cad_id,
        dato_antiguo: "",
      };

      let informe = await InformeGuardaAlmacen.findOne({
        where: { iga_cad_id: cad_id },
      })

      if(informe ){
        throw new Error(`El cliente ya tiene informe guardalmacen no se puede eliminar!!`);
      }

      // Eliminar el cliente a la carta
      const data = await DetalleCA.destroy({
        where: { cad_id: cad_id },
      });

      if (data) {
        // obtener las sumatoria de la carta detalle
        const [sumatoriaCad] = await db.query(`
          SELECT SUM(cad_cantbultos) bultos,
            SUM(cad_peso) peso,
            SUM(cad_cbm) volumen,
            cad_cac_id carta
          FROM clg_cad_detalleaceptacion
          WHERE cad_cac_id = ${id_carta}
        `);

        if (!sumatoriaCad || sumatoriaCad.length === 0) {
          throw new Error(`No se encontro sumatoria para carta: ${id_carta}`);
        }

        //actualizar la carta con los nuevos datos de la sumatoria
        const [actualizarCarta] = await CAceptacion.update(
          {
            cac_totalbl: sumatoriaCad[0]?.bultos,
            cac_totalpeso: sumatoriaCad[0]?.peso,
            cac_totalvolumen: sumatoriaCad[0]?.volumen,
          },
          {
            where: { cac_id: id_carta },
          }
        );

        if (actualizarCarta === 0) {
          throw new Error(
            `No se encontró o no se pudo actualizar la carta con id: ${id_carta}`
          );
        }

        const actualizarCartapdf = await helpercontroller.CrearPDFCA({
          req,
          res,
          next,
          id: id_carta,
        });

        if (actualizarCartapdf == false) {
          throw new Error(
            `No se pudo crear el PDF de la carta con cad_cac_id: ${id_carta}`
          );
        }

        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });

        jsonResponse = {
          status: 200,
          message: "Success",
          response: "Se elimino el cliente correctamente",
        };
      } else {
        jsonResponse = {
          status: 500,
          message: "error",
          response: data,
        };
      }
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }
  
  static async Cambio_manifiesto(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("manifiesto_nuevo").notEmpty().withMessage("Manifiesto_nuevo es requerido."),
      check("manifiesto_antiguo").notEmpty().withMessage("Manifiesto_antiguo es requerido."),
      check("motivoCorreccion").notEmpty().withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        id_carta,
        manifiesto_nuevo,
        manifiesto_antiguo,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data;
      let registroGuardado = false;

      let log = {
        tipo: "Carta",
        documento: id_carta,
        motivoCorreccion,
        solicitante,
        dato_nuevo: manifiesto_nuevo,
        dato_antiguo: manifiesto_antiguo,
      };

      data = await panelcorrecciones.Actualizar_Manifiesto({
        req,
        res,
        next,
        id_carta,
        manifiesto_nuevo,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }
  
  static async Cambio_marchamo(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("id_carta").notEmpty().withMessage("id_carta es requerido."),
      check("marchamo_nuevo").notEmpty().withMessage("Marchamo_nuevo es requerido."),
      check("marchamo_antiguo").notEmpty().withMessage("Marchamo_antiguo es requerido."),
      check("motivoCorreccion").notEmpty().withMessage("motivoCorreccion es requerido."),
      check("solicitante").notEmpty().withMessage("solicitante es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        id_carta,
        marchamo_nuevo,
        marchamo_antiguo,
        motivoCorreccion,
        solicitante,
      } = req.body;

      let data;
      let registroGuardado = false;

      let log = {
        tipo: "Carta",
        documento: id_carta,
        motivoCorreccion,
        solicitante,
        dato_nuevo: marchamo_nuevo,
        dato_antiguo: marchamo_antiguo,
      };

      data = await panelcorrecciones.Actualizar_Marchamo({
        req,
        res,
        next,
        id_carta,
        marchamo_nuevo,
      });
      if (data) {
        registroGuardado = await helpercontroller.GuardarCorrecciones({
          req,
          log,
        });
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se actualizo el dato correctamente",
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }

  static async pruebaspdfinforme(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("id").notEmpty().withMessage("id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { id } = req.body;

      let data;

      data = await helpercontroller.CrearPDFCA({ req, res, next, id });
      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
        },
      };
    } catch (error) {
      next(error);
      jsonResponse = {
        status: 500,
        message: "Error",
        response: error.message,
      };
    }

    return res.status(jsonResponse.status).json(jsonResponse);
  }
}

module.exports = panelcorreccionescontroller;
