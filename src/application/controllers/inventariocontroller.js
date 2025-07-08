//Validaciones de los datos que envía el usuario
const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envía el usuario
const InventarioService = require("../services/ReporteInventarioService");
/**
 * *Importación de modelos a utilizar
 */

class inventariocontroller {
  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE SALDOS INGRESADOS
   */
  static async obtenerSaldoIngresos(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const { page = 1, tipo_documento, datobusqueda } = req.body;
      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await InventarioService.dataSaldoIngresos({
        datobusqueda,
        tipo_documento,
        limit,
        offset,
      }));
      const totalPages = Math.ceil(total / limit);

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          total_registros: total,
          total_paginas: totalPages,
          registros_por_pagina: limit,
          data: data,
        },
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
  } //END LISTADO DE SALDOS INGRESADOS

  /**
   * TODO FUNCIÓN PARA OBTENER LISTADO DE SALDOS INGRESADOS
   */
  static async SaldoIngresosFecha(req, res, next) {
    var jsonResponse = { status: 500, message: "", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("fecha_inicio").notEmpty().withMessage("fecha_inicio es requerido."),
      check("fecha_final").notEmpty().withMessage("fecha_final es requerido."),
      check("id_cliente").notEmpty().withMessage("id_cliente es requerido."),
     
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      //Guardamos en estas variables la data que envió el usuario
      const {  fecha_inicio, fecha_final,id_cliente } = req.body;
      

      let data, totales;

      ({ data, totales } = await InventarioService.dataSaldoIngresosFecha({
        fecha_inicio,
        fecha_final,
        id_cliente,
      }));
      

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          total_registros: totales,
          data: data,
        },
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
  } //END SaldoIngresosFecha
}

module.exports = inventariocontroller;
