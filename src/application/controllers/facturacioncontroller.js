//Validaciones de los datos que envia el usuario
const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones");
const FacturaService = require("../services/FacturasService");
//se agregara modelo para clg_corfa_correlativofactura = CorrelativosFac   y clg_cortfac_correlativotipofactura = TipoCorrelativo

//MODELOS A UTILIZAR
const CorrelativosFac = require("../models/CorrelativosFacturaModel");
const TipoCorrelativo = require("../models/TipoCorrelativoModel");
const Facturas = require("../models/FacturasModel");
const helpercontroller = require("./helpercontroller");

////
class facturacioncontroller {
  /**
   * TODO FUNCIÓN PARA OBTENER LA LISTA DE CORRELATIVOS
   */
  static async ObtenerCorrelativos(req, res, next) {
    try {
      const data = await CorrelativosFac.findAll({
        include: [
          {
            model: TipoCorrelativo,
            attributes: ["cortfac_tipofactura"],
            as: "tipofactura",
          },
        ],
        order: [["corfa_anio", "DESC"]],
        raw: true,
        nest: false,
      });

      return res.status(200).json({
        status: 200,
        message: "Success",
        response: data,
      });
    } catch (error) {
      // Llama al middleware de errores si existe
      next(error);

      return res.status(500).json({
        status: 500,
        message: "Error",
        response: error.message,
      });
    }
  }

  // FUNCION PARA AGREGAR CORRELATIVO

  static async AgregarCorrelativo(req, res, next) {
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("rango_inicio")
        .notEmpty()
        .withMessage("rango_inicio es requerido."),
      check("rango_final").notEmpty().withMessage("rango_final es requerido."),
      check("estado").notEmpty().withMessage("estado es requerido."), // 0 = inactivo, 1 = activo
      check("tipo").notEmpty().withMessage("tipo es requerido."), //seria el id
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    //Guardamos en estas variables la data que envió el usuario
    const { rango_inicio, rango_final, estado, tipo, anio } = req.body;

    let datos = {
      corfa_cortfac_id: tipo,
      corfa_rangoinicio: rango_inicio,
      corfa_rangofin: rango_final,
      corfa_anio: anio,
      corfa_correlativoactual: 0,
      corfa_estado: estado,
    };

    const data = await CorrelativosFac.create(datos);

    if (data && data.corfa_id) {
      return res.status(200).json({
        status: 200,
        response: "Correlativo creado exitosamente",
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "No se pudo crear el correlativo",
        response: null,
      });
    }
  }

  //FUNCION PARA ACTUALIZAR EL CORRELATIVO
  static async ActualizarCorrelativo(req, res, next) {
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("corfa_id").notEmpty().withMessage("corfa_id es requerido."), //el id del correlativo
      check("rango_inicio")
        .notEmpty()
        .withMessage("rango_inicio es requerido."),
      check("rango_final").notEmpty().withMessage("rango_final es requerido."),
      check("estado").notEmpty().withMessage("estado es requerido."), // 0 = inactivo, 1 = activo
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    //Guardamos en estas variables la data que envió el usuario
    const { rango_inicio, rango_final, estado, corfa_id } = req.body;

    let datosActualizar = {
      corfa_rangoinicio: rango_inicio,
      corfa_rangofin: rango_final,
      corfa_estado: estado,
    };

    const actualizados = await CorrelativosFac.update(datosActualizar, {
      where: {
        corfa_id: corfa_id,
      },
    });

    if (actualizados > 0) {
      return res.status(200).json({
        status: 200,
        message: "Correlativo actualizado exitosamente",
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "No se encontró el correlativo para actualizar",
      });
    }
  }
   //FUNCION PARA OBTENER TIPOS DE FACTURA
  static async ObtenerTipoFactura(req, res, next) {
    try {
      const data = await TipoCorrelativo.findAll({
        attributes: ["cortfac_id", "cortfac_tipofactura"],
      });

      return res.status(200).json({
        status: 200,
        message: "Success",
        response: data,
      });
    } catch (error) {
      next(error);

      return res.status(500).json({
        status: 500,
        message: "Error",
        response: error.message,
      });
    }
  }
   //FUNCION PARA OBTENER LAS FACTURAS POR PERIODO DE FECHA
  static async ObtenerFacturas(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("fecha_desde").notEmpty().withMessage("fecha_desde es requerido."),
      check("fecha_hasta").notEmpty().withMessage("fecha_hasta es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { fecha_desde, fecha_hasta } = req.body;
      let data, totales;

      ({ data, totales } = await FacturaService.DataFacturas({
        fecha_desde,
        fecha_hasta,
      }));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
        totales: totales,
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
   //FUNCION PARA OBTENER EL DETALLE DE LAS FACTURAS
  static async DetalleFacturas(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("factura_id").notEmpty().withMessage("factura_id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { factura_id } = req.body;
      let data, detalles;

      ({ data, detalles } = await FacturaService.DataDetalleFacturas(
        factura_id
      ));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: data,
        detalles: detalles,
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
   //FUNCION PARA ANULAR UNA FACTURA
  static async AnularFactura(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("factura_id").notEmpty().withMessage("factura_id es requerido."),
      check("comentario").notEmpty().withMessage("comentario es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {

      const { factura_id, comentario } = req.body;

      await Facturas.update(

        { fac_anulada: 1, fac_motivo_anulacion: comentario },
        { where: { fact_id: factura_id } }

      );

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se anulo la factura correctamente",
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
   //FUNCION PARA GENERAR ARCHIVO PDF DE LA FACTURA
  static async GenerarFacturaPDF(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("factura_id").notEmpty().withMessage("factura_id es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {

      const { factura_id } = req.body;

      let data = await helpercontroller.DataFacturaPDF({req,res,next,factura_id});

      jsonResponse = {
        status: 200,
        message: "Success",
        response: "Se anulo la factura correctamente",
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

module.exports = facturacioncontroller;
