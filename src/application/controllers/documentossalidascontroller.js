//controlador
const TipoDocSalida = require("../models/TipoDocSalidaModel");

class documentossalidascontroller {
  //* Obtener listado de documentos de salidas
  static async ObtenerDocumentosSalida(req, res, next) {
    let jsonResponse = { status: 500, message: "Error", response: "" };

    try {
      const data = await TipoDocSalida.findAll({
        where: {
          tdocsal_activo: 1,
        },
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
}

module.exports = documentossalidascontroller;
