const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envia el usuario

const reportesInterModels = require("../services/ReportesInternosService");

class ReportesInternosController {
  //!
  static async ingresoPorConsolidador(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("consolidador").notEmpty().withMessage("consolidador es requerido."),
      check("destino").notEmpty().withMessage("destino es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        desde,
        hasta,
        consolidador,
        destino,
        tipo,
      } = req.body;

      let data, resumenTotales;

      if (tipo === 1) {
        ({ data, resumenTotales } =
          await reportesInterModels.data_Cliente({
            desde,
            hasta,
            consolidador,
            destino,
          }));
      } else {
        ({ data, resumenTotales } =
          await reportesInterModels.data_Equipo({
            desde,
            hasta,
            consolidador,
            destino,
          }));
      }


      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          total_volumen: resumenTotales,
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


  //!
  static async reporteFacturacion(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("factura").notEmpty().withMessage("factura es requerido."),
      check("servicio").notEmpty().withMessage("servicio es requerido."),
      check("consolidador")
        .notEmpty()
        .withMessage("consolidador es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        desde,
        hasta,
        consolidador,
        servicio,
        factura,
        cliente,
        tipo,
      } = req.body;


      let data, resumenTotales;

      if (tipo === 1) {
        if (factura == 1) {
          ({ data, resumenTotales } =
            await reportesInterModels.data_consolidador_factura({
              // Aqui la variable cliente seria null
              desde,
              hasta,
              consolidador,
              servicio,
              cliente
            }));
        } else {
          ({ data, resumenTotales } =
            await reportesInterModels.data_consolidador_servicio({
              desde,
              hasta,
              consolidador,
              servicio,
              cliente,
            }));
        }
      } else if (tipo === 2) {
        if (factura == 1) {
          ({ data, resumenTotales } =
            await reportesInterModels.data_consolidador_factura({
              // Aqui la variable consolidador seria null
              desde,
              hasta,
              cliente,
              servicio,
              consolidador
            }));
        } else {
          ({ data, resumenTotales } =
            await reportesInterModels.data_consolidador_servicio({
              desde,
              hasta,
              consolidador,
              servicio,
              cliente
            }));
        }
      } else if (tipo === 3) {
        if (factura == 1) {
          ({ data, resumenTotales } =
            await reportesInterModels.data_facturageneral_dia({
              desde,
              hasta,
              consolidador,
              servicio,
              cliente
            }));
        } else {
          console.log("Función no implementada aun ");
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          resumenTotales: resumenTotales,
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


  //!
  static async reporteValoresEnBodega(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("bodega").notEmpty().withMessage("bodega es requerido."),
      check("cliente").notEmpty().withMessage("cliente es requerido."),
      check("fecha_desde").notEmpty().withMessage("fecha_desde es requerido."),
      check("fecha_hasta").notEmpty().withMessage("fecha_hasta es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { tipo, bodega, cliente, fecha_desde, fecha_hasta, tipo_peticion } =
        req.body;

      let data, resumenTotales;

      if (tipo === 1) {
        ({ data, resumenTotales } = await reportesInterModels.data_valores_hoy({
          bodega,
          cliente,
          fecha_desde,
          fecha_hasta,
        }));
      } else if (tipo === 2) {
        ({ data, resumenTotales } = await reportesInterModels.data_valores_hoy({
          bodega,
          cliente,
          fecha_desde,
          fecha_hasta,
        }));
      } else if (tipo === 3) {
        ({ data, resumenTotales } = await reportesInterModels.data_valores_hoy({
          bodega,
          cliente,
          fecha_desde,
          fecha_hasta,
        }));
      } else if (tipo === 4) {
        //mandar tambien tipo_peticion
        if (tipo_peticion === "consulta") {
          const fechas = [];
          for (
            let fecha = new Date(fecha_desde);
            fecha <= new Date(fecha_hasta);
            fecha.setDate(fecha.getDate() + 1)
          ) {
            fechas.push(fecha.toISOString().split("T")[0]);
          }
          const registros = [];
          const totalesPorFecha = {};
          for (const fecha of fechas) {
            const { data } =
              await reportesInterModels.data_valores_promedio_dia({
                bodega,
                cliente,
                fecha,
              });

            registros.push({ fecha, data });
            const totales = {};
            data.forEach((regimen) => {
              if (!totales[regimen.regimen]) {
                totales[regimen.regimen] = 0;
              }
              totales[regimen.regimen] += regimen.cif;
            });
            totalesPorFecha[fecha] = totales;
          }
          return res.json({ data: registros, resumenTotales: totalesPorFecha });
        } else if (tipo_peticion === "excel") {
          //   ({ data, resumenTotales } =
          //     await reportesInterModels.data_valores_promedio_dia({
          //       bodega,
          //       cliente,
          //       fecha_desde,
          //       fecha_hasta,
          //     }));
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          resumenTotales: resumenTotales,
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


  //!
  static async promedioEstadiaBodega(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
      check("tipo_peticion").notEmpty().withMessage("tipo_peticion es requerido."),
      check("consolidador").notEmpty().withMessage("consolidador es requerido."),
      check("id_carta").notEmpty().withMessage("id_carta es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { desde, hasta, consolidador, tipo_peticion, id_carta } =
        req.body;

      let data, resumenTotales;

      if (tipo_peticion === 'General') {
        ({ data, resumenTotales } = await reportesInterModels.data_Promedio_General({
          desde,
          hasta,
          consolidador
        }));
      } else if (tipo_peticion === 'Detalle') {
        ({ data, resumenTotales } = await reportesInterModels.data_Promedio_Detalle({
          desde,
          hasta,
          consolidador,
          id_carta
        }));
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          resumenTotales,
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


  //!
  static async productividadCartas(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { page = 1, datobusqueda } = req.body;
      const limit = 50;
      const offset = (page - 1) * limit;
      let data, total;

      ({ data, total } = await reportesInterModels.data_Cartas({
        limit,
        offset,
        datobusqueda,
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
  static async productividadInfomes(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { page = 1, datobusqueda } = req.body;
      const limit = 50;
      const offset = (page - 1) * limit;
      let data, total;

      ({ data, total } = await reportesInterModels.data_Informes({
        limit,
        offset,
        datobusqueda,
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
  static async extraFacturacion(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { datobusqueda, tipo, desde, hasta } = req.body;

      let data, resumenTotales;
      if (tipo == 1) {
        ({ data, resumenTotales } =
          await reportesInterModels.datos_extra_Facturacion_consolidado({
            datobusqueda,
            desde,
            hasta,
          }));
      } else if (tipo == 2) {
        ({ data, resumenTotales } =
          await reportesInterModels.datos_extra_Facturacion_cliente({
            datobusqueda,
            desde,
            hasta,
          }));
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          total_volumen: resumenTotales,
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

  //!
  static async ComisionesConsolidadores(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { desde, hasta } = req.body;

      let data, resumenTotales;

      ({ data, resumenTotales } =
        await reportesInterModels.datos_comisiones_consolidador({
          desde,
          hasta,
        }));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          total_comision: resumenTotales,
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

  //!
  static async IngresoSalidaCarga(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { desde, hasta } = req.body;

      let data, resumenTotales;

      ({ data, resumenTotales } =
        await reportesInterModels.datos_ingreso_salida({
          desde,
          hasta,
        }));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          total_comision: resumenTotales,
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

  //* AUN NO ENTREGADO AL FRONTEND
  static async historicoCliente(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
      check("cliente").notEmpty().withMessage("cliente es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { desde, hasta, cliente } =
        req.body;

      let data, resumenTotales;

      ({ data, resumenTotales } =
        await reportesInterModels.datos_historico_cliente({
          desde,
          hasta,
          cliente,
        }));

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          total_comision: resumenTotales,
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

  //* AUN NO ENTREGADO AL FRONTEND
  static async reporteMetricasOpertivas(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("consolidador")
        .notEmpty()
        .withMessage("consolidador es requerido."),
      check("fecha_desde").notEmpty().withMessage("fecha_desde es requerido."),
      check("fecha_hasta").notEmpty().withMessage("fecha_hasta es requerido."),
      check("tipo_peticion")
        .notEmpty()
        .withMessage("tipo_peticion es requerido."),
      check("destino").notEmpty().withMessage("destino es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const {
        tipo,
        consolidador,
        fecha_desde,
        fecha_hasta,
        tipo_peticion,
        destino,
      } = req.body;

      let data, resumenTotales;

      if (tipo === 1) {// por cliente
        if (tipo_peticion === "consulta") {
          ({ data, resumenTotales } =
            await reportesInterModels.data_Metricas_Opertivas_cliente({
              consolidador,
              fecha_desde,
              fecha_hasta,
              destino,
            }));
        } else if (tipo_peticion === "excel") {
          console.log("excel aun no implementado");
        }
      } else if (tipo === 2) {// por equipo
        if (tipo_peticion === "consulta") {
          ({ data, resumenTotales } =
            await reportesInterModels.data_Metricas_Opertivas_equipo({
              consolidador,
              fecha_desde,
              fecha_hasta,
              destino,
            }));
        } else if (tipo_peticion === "excel") {
          console.log("excel aun no implementado");
        }
      }

      jsonResponse = {
        status: 200,
        message: "Success",
        response: {
          data: data,
          resumenTotales: resumenTotales,
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

  //!
  static async reporteFacturacionRegiClieCons(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };
    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("desde").notEmpty().withMessage("desde es requerido."),
      check("hasta").notEmpty().withMessage("hasta es requerido."),
      check("page").notEmpty().withMessage("page es requerido."),
    ];
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }
    try {
      const { desde, hasta, page = 1 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } =
        await reportesInterModels.data_fact_regim_client_consol({
          desde,
          hasta,
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

module.exports = ReportesInternosController;