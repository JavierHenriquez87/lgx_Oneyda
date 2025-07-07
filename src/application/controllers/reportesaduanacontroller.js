const { check } = require("express-validator");
const { realizarValidaciones } = require("../validaciones/validaciones"); //Validaciones de los datos que envia el usuario

const reportesModels = require("../services/ReportesAduanaService");

class aduanasreportescontroller {
  /**
   * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.1
   */
  static async obtenerAnexo1_1(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("tipo").notEmpty().withMessage("tipo es requerido."),
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, tipo, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      if (tipo === "ingresos") {
        ({ data, total } = await reportesModels.dataAnexo1_1Ingresos({
          anio: anio,
          datobusqueda,
          compania_id,
          limit,
          offset,
        }));
      } else if (tipo === "egresos") {
        ({ data, total } = await reportesModels.dataAnexo1_1Egresos({
          anio: anio,
          datobusqueda,
          compania_id,
          limit,
          offset,
        }));
      } else {
        ({ data, total } = await reportesModels.dataAnexo1_1Ingresos({
          anio: anio,
          datobusqueda,
          compania_id,
          limit,
          offset,
        }));
      }

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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.2
  */
  static async obtenerAnexo1_2(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_2({
        anio: anio,
        datobusqueda,
        compania_id,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.3
  */
  static async obtenerAnexo1_3(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_3({
        anio: anio,
        datobusqueda,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.4
  */
  static async obtenerAnexo1_4(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_4({
        anio: anio,
        compania_id: compania_id,
        datobusqueda,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.5
  */
  static async obtenerAnexo1_5(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_5({
        anio: anio,
        datobusqueda,
        compania_id,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.6
  */
  static async obtenerAnexo1_6(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido."),
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_6({
        anio: anio,
        datobusqueda,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.7
  */
  static async obtenerAnexo1_7(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_7({
        anio: anio,
        datobusqueda,
        compania_id,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.8
  */
  static async obtenerAnexo1_8(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_8({
        anio: anio,
        datobusqueda,
        compania_id,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.9
  */
  static async obtenerAnexo1_9(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_9({
        anio: anio,
        datobusqueda,
        compania_id,
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

  
  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.10
  */
  static async obtenerAnexo1_10(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda, compania_id = 38 } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_10({
        anio: anio,
        datobusqueda,
        compania_id,
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


  /**
  * TODO FUNCIÓN PARA OBTENER REPORTE ADUANAL 1.11
  */
  static async obtenerAnexo1_11(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    // Definir las validaciones de campos dentro del método
    const validaciones = [
      check("page").notEmpty().withMessage("page es requerido."),
      check("anio").notEmpty().withMessage("anio es requerido.")
    ];

    // Ejecutar las validaciones
    const resp = await realizarValidaciones(req, res, next, validaciones);

    if (resp != true) {
      return res.status(400).json({ errors: resp });
    }

    try {
      const { page = 1, anio, datobusqueda } = req.body;

      const limit = 50;
      const offset = (page - 1) * limit;

      let data, total;

      ({ data, total } = await reportesModels.dataAnexo1_11({
        anio: anio,
        datobusqueda,
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

module.exports = aduanasreportescontroller;
