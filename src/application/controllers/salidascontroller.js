const router = require("express").Router();
const { logsUsers } = require("../logs/logsUser"); //Validaciones de los datos que envía el usuario
const bcrypt = require("bcrypt"); //Libreria de encriptacion para la clave enviada por el usuario al momento de registrarse al sistema
const moment = require("moment");
const { es } = require("date-fns/locale"); //Importar la localización en español
const AWS = require("aws-sdk");
const stream = require("stream");
const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envia el usuario
const { Op, Sequelize } = require("sequelize"); //Operador especial de Sequelize
const puppeteer = require("puppeteer");
const path = require("path");

/**
 * *Importación de modelos a utilizar
 */
const Salidas = require("../models/SalidasModel");
const Clientes = require("../models/ClientesModel");
const TipoDocSalida = require("../models/TipoDocSalidaModel");

//Importación de servicio para obtener los informes segun cliente
const ImformesClientes = require("../services/ObtenerInformesClientesService");

class salidascontroller {
  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE SALIDAS
   */
  static async ObtenerSalida(req, res, next) {
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
      const limitePorPagina = 50; // Número de Salidas por página

      // Inicializamos el objeto where
      let whereConditions = {};
      let whereConditionsSAL = {};

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
        whereConditionsSAL[Op.and] = [
          {
            sal_codigo: {
              [Op.like]: `%${datobusqueda}%`,
            },
          },
        ];
      }

      //Obtenemos la data de los clientes
      const salCount = await Salidas.count({
        where: whereConditionsSAL,
        include: [
          {
            model: Clientes,
            where: whereConditions,
          },
        ],
      });

      // Calcula el número total de páginas
      const total_pages = Math.ceil(salCount / limitePorPagina);

      //Obtenemos la data de las salidas
      let dataSalida = await Salidas.findAll({
        where: whereConditionsSAL,
        include: [
          {
            model: Clientes,
            where: whereConditions,
          },
          {
            model: TipoDocSalida,
          },
        ],
        limit: limitePorPagina,
        offset: (numPag - 1) * limitePorPagina,
        order: [["sal_fechadm", "desc"]],
      });

      if (dataSalida && dataSalida.length > 0) {
        dataSalida = dataSalida.map((salida) => {
          return {
            ...salida.toJSON(),
            archivo:
              "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_salidas_aduana/" +
              dataSalida.sal_codigo +
              ".pdf",
          };
        });
      }

      const data = {
        total_registros: salCount,
        total_paginas: total_pages,
        registros_por_pagina: limitePorPagina,
        data: dataSalida,
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
  } //END ObtenerSalida

  /**
   * TODO FUNCIÓN PARA EDITAR COMENTARIOS DE SALIDA DESDE EL DASHBOARD
   */
  static async EditarComentSalDashboard(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("sal_id").notEmpty().withMessage("sal_id is required."),
      check("sal_comentarios")
        .notEmpty()
        .withMessage("sal_comentarios is required."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { sal_id, sal_comentarios } = req.body;

      //* Obtenemos la información que tenia antes de la modificación
      const infoSalOld = await Salidas.findByPk(sal_id);

      await Salidas.update(
        {
          sal_comentarios,
        },
        {
          where: { sal_id },
        }
      );

      //! ====================================================================
      //* GUARDAMOS EL LOGS DE REGISTRO DE LA ACCIÓN
      //! ====================================================================
      try {
        // Definimos la data que se guardara en el logs de usuarios
        const datalogs = {
          usuario: req.user.log_username,
          tipo_de_evento: "Mod Comentario de Salida",
          fecha_del_evento: moment().format(),
          tabla_afectada: "clg_sal_salidas",
          info_antes_de_modificar: infoSalOld.sal_comentarios,
          info_despues_de_modificar: sal_comentarios,
          id_principal: sal_id,
          tipo_registro: "SAL",
          motivo_correccion: null,
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

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Comentario modificado en la salida",
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
  } //END EditarComentSalDashboard

  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE INFORMES SEGUN EL CLIENTE
   */
  static async consultarInformeClientes(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("id_cliente").notEmpty().withMessage("id_cliente es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
     

      let { id_cliente } = req.body;

      const data = await ImformesClientes.data_informes_clientes(id_cliente);

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
  } //END Obtenerlistado
}

module.exports = salidascontroller;
