const db = require("../../database/db");
const helpercontroller = require("../controllers/helpercontroller");
const CAceptacion = require("../models/CartaAceptacionModel");
const DetalleCA = require("../models/DetalleCartaAceptacionModel");
const InformeGuardaAlmancen = require("../models/InformeGuardaAlmacenModel");
const Salidas = require("../models/SalidasModel");
const DetalleGuardaAlmancen = require("../models/DetalleInformeGuardaAlmacenModel");
const { Op } = require("sequelize");
const InformeGuardaAlmacen = require("../models/InformeGuardaAlmacenModel");

async function data_busquedaPorCarta({ documento, tipo }) {
  let where = `
  `;
  switch (tipo) {
    case "Carta":
      where = `WHERE c.cac_numero = '${documento}'`;
      break;
    case "Informe":
      where = `WHERE i.iga_codigo = '${documento}'`;
      break;
    case "Salida":
      where = `WHERE st.salida = '${documento}'`;
      break;
    case "SAL ID":
      where = `WHERE st.salId = '${documento}'`;
      break;
    default:
      where = ``;
      break;
  }

  const sql = `
    SELECT
      c.cac_id cartaId,
      dt.cad_id cadId,
      i.de_lgx ,
      c.cac_numero carta,
      c.cac_pdf cartaArchivo,
      ad.adu_id,
      ad.adu_nombre aduana,
      t.tra_id,
      t.tra_nombre transportista,
      c.cac_contenedor contenedor,
      CONCAT_WS(' ', uc.usu_nombres, uc.usu_apellidos) cartaUsuario,
      i.iga_id igaId1,
      i.iga_codigo informe,
      i.iga_archivo informeArchivo,
      IF(i.iga_estado = 1, 'Activo', IF(i.iga_estado = 0, 'Inactivo', i.iga_estado )) estadoInforme,
      CONCAT_WS(' ', u.usu_nombres, u.usu_apellidos) informeUsuario,
      st.*,
      d.doc_id imId,
      cl.cli_id,
      cl.cli_nombre cliente,
      d.doc_ndocumento im,
      d.doc_documentos imArchivo,
      c.cac_manifiesto_archivo manifiestoPdf
    FROM
      clg_cac_aceptacion c
    LEFT JOIN clg_iga_informeguardalmacen i on c.cac_id = i.iga_cac_id
    LEFT JOIN clg_cli_clientes cl ON cl.cli_id = i.iga_cli_id
    INNER JOIN clg_adu_aduanas ad ON c.cac_adu_id = ad.adu_id
    INNER JOIN clg_tra_transportistas t ON c.cac_tra_id = t.tra_id
    LEFT JOIN (
      SELECT cad_cac_id, MIN(cad_id) AS cad_id
      FROM clg_cad_detalleaceptacion
      GROUP BY cad_cac_id
    ) dt ON c.cac_id = dt.cad_cac_id
    LEFT JOIN crm_usuario u on u.usu_id = i.iga_usu_id
    LEFT JOIN clg_doc_documentos d ON d.doc_iga_id = i.iga_id
    INNER JOIN crm_usuario uc on uc.usu_id = c.cac_usu_id
    LEFT JOIN (
      SELECT
        s.sal_id salId,
        s.sal_codigo salida,
        IF(d.sald_sco_id IS NULL, s.sal_iga_id, c.sco_iga_id) igaId,
        IF(d.sald_sco_id IS NULL, 'SIMPLE', 'CONSOLIDADA') tipoSalida,
        CONCAT_WS(' ', u.usu_nombres, u.usu_apellidos) salidaUsuario
      FROM
        clg_sald_salidadetalles d
      INNER JOIN clg_sal_salidas s ON
        s.sal_id = d.sald_sal_id
      LEFT JOIN clg_sco_salidaconsolidada c ON
        d.sald_sco_id = c.sco_id
      INNER JOIN crm_usuario u on
        u.usu_id = s.sal_usu_id
      GROUP BY
        d.sald_sal_id,
        igaId,d.sald_sco_id
    ) st on
	  i.iga_id = st.igaId
    ${where}
  `;

  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf =
      row.de_lgx == 1 || row.cartaArchivo?.startsWith("https")
        ? row.cartaArchivo
        : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/" +
          row.cartaArchivo;
    let informe_pdf =
      row.de_lgx == 1 || row.informeArchivo?.startsWith("https")
        ? row.informeArchivo
        : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
          row.informeArchivo;
    let salidas_pdf = row.salida
      ? "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_salidas_aduana/" +
        row.salida +
        ".pdf"
      : row.salida;

    let manifiesto_pdf =
      row.de_lgx == 1 || row.manifiestoPdf?.startsWith("https")
        ? row.manifiestoPdf
        : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/" +
          row.manifiestoPdf;

    datos.push({
      index: index + 1,
      CARTA: row.cartaId,
      cac_numero: row.carta,
      cartaArchivo: carta_pdf,
      cartaUsuario: row.cartaUsuario,
      igaId1: row.igaId1,
      informe: row.informe,
      informeArchivo: informe_pdf,
      estadoInforme: row.estadoInforme,
      informeUsuario: row.informeUsuario,
      salId: row.salId,
      salida: row.salida,
      salidas_pdf: salidas_pdf,
      igaId: row.igaId,
      tipoSalida: row.tipoSalida,
      salidaUsuario: row.salidaUsuario,
      imId: row.imId,
      cliente: row.cliente,
      cli_id: row.cli_id,
      doc_ndocumento: row.doc_ndocumento,
      imArchivo: row.imArchivo,
      manifiestoPdf: manifiesto_pdf,
      de_lgx: row.de_lgx,
      aduana: row.aduana,
      adu_id: row.adu_id,
      transportista: row.transportista,
      tra_id: row.tra_id,
      contenedor: row.contenedor,
      cadId: row.cadId,
    });
  });

  return datos;
}

async function data_fecha_carta({ documento }) {
  const sql = `
    SELECT
      cac_id,
      cac_numero,
      DATE_FORMAT(cac_fecha, '%d-%m-%Y %h:%i:%p') fecha,
      cac_pdf,
      de_lgx
    FROM clg_cac_aceptacion
    WHERE cac_numero = '${documento}'
  `;

  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf =
      row.de_lgx == 1 || row.cac_pdf?.startsWith("http")
        ? row.cac_pdf
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/${row.cac_pdf}`;

    datos.push({
      index: index + 1,
      id: row.cac_id,
      documento: row.cac_numero,
      fecha: row.fecha,
      archivo: carta_pdf,
    });
  });

  return datos;
}

async function data_fecha_informe({ documento }) {
  const sql = `
    SELECT 
      iga_id ,
      iga_codigo,
      DATE_FORMAT(iga_fecha_recepcionado, '%d-%m-%Y %h:%i:%p') fecha,
      iga_archivo,
      de_lgx 
    FROM  clg_iga_informeguardalmacen
    WHERE iga_codigo = '${documento}'
  `;

  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let informe_pdf =
      row.de_lgx == 1 || row.iga_archivo?.startsWith("http")
        ? row.iga_archivo
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/${row.iga_archivo}`;

    datos.push({
      index: index + 1,
      id: row.iga_id,
      documento: row.iga_codigo,
      fecha: row.fecha,
      archivo: informe_pdf,
    });
  });

  return datos;
}

async function data_fecha_salida({ documento }) {
  const sql = `
    SELECT
      sal_id,
      sal_codigo,
      DATE_FORMAT(sal_fecha, '%d-%m-%Y %h:%i:%p') fecha,
      CONCAT(sal_codigo, '.pdf') archivo,
      de_lgx 
    FROM clg_sal_salidas
    WHERE sal_codigo = '${documento}'
  `;

  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let salida_pdf = row.archivo
      ? "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_salidas_aduana/" +
        row.archivo
      : "";

    datos.push({
      index: index + 1,
      id: row.sal_id,
      documento: row.sal_codigo,
      fecha: row.fecha,
      archivo: salida_pdf,
    });
  });

  return datos;
}

async function actualizarFechaDocumento({ tipo, id, nuevaFecha, log }) {
  switch (tipo) {
    case "Carta":
      const actualizarCarta = await CAceptacion.update(
        {
          cac_fecha: nuevaFecha,
        },
        {
          where: { cac_id: id },
        }
      );
      if (actualizarCarta == 0) {
        throw new Error(
          `No se encontró o no se pudo actualizar la carta con id: ${cad_id}`
        );
      }
      break;

    case "Informe":
      console.log(id);
      const actualizarInforme = await InformeGuardaAlmancen.update(
        {
          iga_fecha_recepcionado: nuevaFecha,
        },
        {
          where: { iga_id: id },
        }
      );
      if (actualizarInforme == 0) {
        throw new Error(
          `No se encontró o no se pudo actualizar la carta con id: ${cad_id}`
        );
      }
      break;

    case "Salida":
      const actualizarSalida = await Salidas.update(
        {
          sal_fecha: nuevaFecha,
        },
        {
          where: { sal_id: id },
        }
      );
      if (actualizarSalida == 0) {
        throw new Error(
          `No se encontró o no se pudo actualizar la carta con id: ${cad_id}`
        );
      }
      break;

    default:
      return false;
  }

  return true;
}

async function data_cambio_destino({ documento, tipo }) {
  let sql = ``;
  switch (tipo) {
    case "Carta":
      sql = `
        SELECT
          c.cac_id ,
          c.cac_numero ,
          c.cac_pdf,
          d.cad_id ,
          cl.cli_nombre,
          p.pai_id,
          p.pai_nombre,
          IF(c.cac_guardalmacen = 1,'Informe','Carta') ultimoDoc
        FROM clg_cac_aceptacion c 
        INNER JOIN clg_cad_detalleaceptacion  d ON c.cac_id = d.cad_cac_id
        INNER JOIN clg_cli_clientes  cl ON cl.cli_id = d.cad_cli_id
        INNER JOIN clg_pai_paises p ON p.pai_id = d.cad_pai_id
        WHERE c.cac_numero = '${documento}'
            `;
      break;

    default:
      sql = ``;
      break;
  }
  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf =
      row.de_lgx == 1 || row.cac_pdf?.startsWith("http")
        ? row.cac_pdf
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/${row.cac_pdf}`;

    datos.push({
      index: index + 1,
      cac_id: row.cac_id,
      cac_numero: row.cac_numero,
      carta_pdf: carta_pdf,
      cad_id: row.cad_id,
      cli_nombre: row.cli_nombre,
      pai_id: row.pai_id,
      pai_nombre: row.pai_nombre,
      ultimoDoc: row.ultimoDoc,
    });
  });

  return datos;
}
async function data_cambio_origen({ documento, tipo }) {
  let sql = ``;
  switch (tipo) {
    case "Informe":
      sql = `SELECT
              
              a.cac_numero,
              a.cac_pdf,
              a.cac_id,
              i.iga_id ,
              i.iga_codigo informe,
              i.iga_archivo archivoInforme,
              c.cli_nombre,
              d.cad_id ,
              po.pai_id idOrigen,
              po.pai_nombre paisOrigen,
              pd.pai_nombre paisDestino,
              i.iga_manifiesto manifiesto,
              i.iga_marchamo marchamo,
              i.iga_codtransportista codigoTransportista,
              i.iga_placavehiculo placaVehiculo,
              DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaIngreso,
              DATE_FORMAT(i.iga_fechaabandono, '%d-%m-%Y') fechaAbandono,
              a.de_lgx
              FROM
                clg_iga_informeguardalmacen i
              INNER JOIN clg_cad_detalleaceptacion d ON
                i.iga_cad_id = d.cad_id
              INNER JOIN clg_cac_aceptacion a ON
                d.cad_cac_id = a.cac_id
              INNER JOIN clg_pai_paises pd ON
                d.cad_pai_id = pd.pai_id
              INNER JOIN clg_pai_paises po ON
                i.iga_pai_id = po.pai_id
              INNER JOIN clg_cli_clientes c ON
                i.iga_cli_id = c.cli_id
              WHERE
              i.iga_cac_id = (
              SELECT
                iga_cac_id
              from
                clg_iga_informeguardalmacen
              where
                iga_codigo = '${documento}'
                                          )
          `;
      break;
    default:
      sql = ``;
      break;
  }
  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf =
      row.de_lgx == 1 || row.cac_pdf?.startsWith("http")
        ? row.cac_pdf
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/${row.cac_pdf}`;

    let informe_pdf =
      row.de_lgx == 1 || row.archivoInforme?.startsWith("http")
        ? row.archivoInforme
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/${row.archivoInforme}`;

    datos.push({
      index: index + 1,
      archivoCarta: carta_pdf,
      archivoInforme: informe_pdf,
      cac_id: row.cac_id,
      cad_id: row.cad_id,
      cac_numero: row.cac_numero,
      iga_id: row.iga_id,
      informe: row.informe,
      cliente: row.cli_nombre,
      idOrigen: row.idOrigen,
      paisOrigen: row.paisOrigen,
      paisDestino: row.paisDestino,
      manifiesto: row.manifiesto,
      marchamo: row.marchamo,
      codigoTransportista: row.codigoTransportista,
      placaVehiculo: row.placaVehiculo,
      fechaIngreso: row.fechaIngreso,
      fechaAbandono: row.fechaAbandono,
      de_lgx: row.de_lgx,
    });
  });

  return datos;
}

async function data_actualizar_destino({
  req,
  res,
  next,
  documento,
  tipo,
  pais_nuevo,
  cad_id,
}) {
  if (tipo !== "Carta") {
    throw new Error(`Tipo de documento inválido: ${tipo}`);
  }

  // Actualizar carta
  const [actualizarCarta] = await DetalleCA.update(
    { cad_pai_id: pais_nuevo },
    { where: { cad_id } }
  );

  if (actualizarCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  // Obtener cad_cac_id relacionado
  const registro = await DetalleCA.findOne({
    where: { cad_id },
    attributes: ["cad_cac_id"],
  });

  const cad_cac_id = registro?.cad_cac_id;
  if (!cad_cac_id) {
    throw new Error(
      `No se encontró cad_cac_id relacionado a la carta con cad_id: ${cad_id}`
    );
  }

  // Crear PDF carta
  const actualizarCartapdf = await helpercontroller.CrearPDFCA({
    req,
    res,
    next,
    id: cad_cac_id,
  });

  if (!actualizarCartapdf) {
    throw new Error(
      `No se pudo crear el PDF de la carta con cad_cac_id: ${cad_cac_id}`
    );
  }

  // Consultar informe relacionado usando parámetro para seguridad
  const [informes] = await db.query(
    `SELECT
      c.cac_id AS cacId,
      c.cac_numero AS carta,
      i.iga_id AS igaId,
      i.iga_codigo AS informe,
      i.iga_estado AS estado
    FROM clg_cac_aceptacion c
    INNER JOIN clg_cad_detalleaceptacion d ON c.cac_id = d.cad_cac_id
    LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = d.cad_id
    WHERE d.cad_id = ${cad_id} AND (i.iga_estado IS NULL OR i.iga_estado = 1);
  `
  );

  if (!informes || informes.length === 0) {
    throw new Error(`No se encontró informe para cad_id: ${cad_id}`);
  }

  const igaId = informes[0]?.igaId;
  if (!igaId) {
    throw new Error(`La variable igaId es null o indefinida`);
  }

  // Crear PDF informe
  const Actualizadopdf = await helpercontroller.CrearPdfInforme({
    req,
    res,
    next,
    id: igaId,
  });

  if (!Actualizadopdf) {
    throw new Error(
      `No se pudo crear el PDF del informe con cad_cac_id: ${cad_cac_id}`
    );
  }

  return true; // Indicamos éxito
}

async function data_actualizar_origen({
  req,
  res,
  next,
  documento,
  tipo,
  pais_nuevo,
  cac_id,
}) {
  let resultado = false;

  switch (tipo) {
    case "Informe": {
      // obtener todos los informes

      const informes = await InformeGuardaAlmancen.findAll({
        where: { iga_cac_id: cac_id },
        attributes: ["iga_codigo", "iga_id"],
      });

      if (!informes || informes.length === 0) {
        throw new Error(`No hay informes con iga_cac_id: ${cac_id}`);
      }
      //actualizar todos los informes y su pdf
      for (const inf of informes) {
        const actualizado = await InformeGuardaAlmancen.update(
          { iga_pai_id: pais_nuevo },
          { where: { iga_id: inf.iga_id } }
        );

        if (actualizado == 0) {
          throw new Error(`No se actualizo el informe: ${inf.iga_id}`);
        }

        const actualizarpdfinforme = await helpercontroller.CrearPdfInforme({
          req,
          res,
          next,
          id: inf.iga_id,
        });

        if (actualizarpdfinforme == false) {
          throw new Error(
            `No se actualizó el pdf de informe con iga_codigo: ${inf.iga_codigo}`
          );
        }
      }

      resultado = true;
      break;
    }

    default:
      throw new Error(`Tipo de documento inválido: ${tipo}`);
  }

  return resultado;
}

async function data_actualizar_cliente({
  req,
  res,
  next,
  documento,
  tipo,
  cliente_nuevo,
  cad_id,
}) {
  let resultado = false;

  switch (tipo) {
    case "Carta":
      const [actualizarCarta] = await DetalleCA.update(
        { cad_cli_id: cliente_nuevo },
        { where: { cad_id } }
      );

      if (actualizarCarta === 0) {
        throw new Error(
          `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
        );
      }

      // Obtener cad_cac_id relacionado
      const registro = await DetalleCA.findOne({
        where: { cad_id },
        attributes: ["cad_cac_id"],
      });

      const cad_cac_id = registro?.cad_cac_id;
      if (!cad_cac_id) {
        throw new Error(
          `No se encontró cad_cac_id relacionado a la carta con cad_id: ${cad_id}`
        );
      }

      // Crear PDF carta
      const actualizarCartapdf = await helpercontroller.CrearPDFCA({
        req,
        res,
        next,
        id: cad_cac_id,
      });

      if (!actualizarCartapdf) {
        throw new Error(
          `No se pudo crear el PDF de la carta con cad_cac_id: ${cad_cac_id}`
        );
      }

      // Buscar informe relacionado
      const [informes] = await db.query(`
        SELECT
          c.cac_id AS cacId,
          c.cac_numero AS carta,
          i.iga_id AS igaId,
          i.iga_codigo AS informe,
          i.iga_estado AS estado
        FROM clg_cac_aceptacion c
        INNER JOIN clg_cad_detalleaceptacion d ON c.cac_id = d.cad_cac_id
        LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = d.cad_id
        WHERE d.cad_id = ${cad_id} AND (i.iga_estado IS NULL OR i.iga_estado = 1);
      `);

      if (!informes || informes.length === 0) {
        throw new Error(`No se encontró informe para cad_id: ${cad_id}`);
      }

      const igaId = informes[0]?.igaId;
      if (!igaId) {
        throw new Error(`La variable igaId es null o indefinida`);
      }

      const actualizadoInforme = await InformeGuardaAlmancen.update(
        { iga_cli_id: cliente_nuevo },
        { where: { iga_id: igaId } }
      );

      if (actualizadoInforme === 0) {
        throw new Error(`No se actualizó el informe: ${igaId}`);
      }

      // Crear PDF del informe
      const Actualizadopdf = await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: igaId,
      });

      if (Actualizadopdf === false) {
        throw new Error(
          `No se pudo crear el PDF del informe con cad_cac_id: ${cad_cac_id}`
        );
      }

      resultado = true;
      break;

    case "Informe":
      const informe = await InformeGuardaAlmancen.findOne({
        where: { iga_codigo: documento },
        attributes: ["iga_cac_id", "iga_codigo", "iga_id"],
      });

      if (!informe) {
        throw new Error(`No se encontró informe con iga_codigo: ${documento}`);
      }

      const actualizado = await InformeGuardaAlmancen.update(
        { iga_cli_id: cliente_nuevo },
        { where: { iga_codigo: informe.iga_codigo } }
      );

      if (actualizado === 0) {
        throw new Error(
          `No se encontró o no se pudo actualizar el informe con iga_codigo: ${informe.iga_codigo}`
        );
      }

      await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: informe.iga_id,
      });

      resultado = true;
      break;

    default:
      resultado = false;
  }

  return resultado;
}

async function data_actualizar_aduana({
  req,
  res,
  next,
  documento,
  tipo,
  aduana_nuevo,
  id_carta,
}) {
  let cac_id = id_carta;

  try {
    const [actualizarCarta] = await CAceptacion.update(
      { cac_adu_id: aduana_nuevo },
      { where: { cac_id } }
    );

    if (actualizarCarta === 0) {
      throw new Error(`No se actualizó la carta con cac_id: ${cac_id}`);
    }

    const actualizarPDF = await helpercontroller.CrearPDFCA({
      req,
      res,
      next,
      id: cac_id,
    });

    if (!actualizarPDF) {
      throw new Error(
        `No se actualizó el PDF de la carta con cac_id: ${cac_id}`
      );
    }

    const informes = await InformeGuardaAlmancen.findAll({
      where: { iga_cac_id: cac_id },
      attributes: ["iga_codigo", "iga_id"],
    });

    if (!informes || informes.length === 0) {
      throw new Error(
        `No se encontraron informes relacionados con cac_id: ${cac_id}`
      );
    }

    let actualizaciones = 0;
    for (const informe of informes) {
      const actualizado = await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: informe.iga_id,
      });
      if (actualizado === true) {
        actualizaciones++;
      }
    }

    if (actualizaciones === 0) {
      throw new Error(`No se actualizó ningún informe para cac_id: ${cac_id}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

async function data_actualizar_transportista({
  req,
  res,
  next,
  documento,
  tipo,
  transportista_nuevo,
  id_carta,
}) {
  let resultado = false;
  const cac_id = id_carta;

  if (tipo === "Carta") {
    // Actualiza transportista en carta
    const actualizarCarta = await CAceptacion.update(
      { cac_tra_id: transportista_nuevo },
      { where: { cac_id } }
    );

    if (actualizarCarta === 0) {
      throw new Error(`No se actualizó la carta con cac_id: ${cac_id}`);
    }

    // Regenera el PDF de la carta
    const pdfCA = await helpercontroller.CrearPDFCA({
      req,
      res,
      next,
      id: cac_id,
    });

    if (!pdfCA) {
      throw new Error(`No se generó el PDF para la carta con id: ${cac_id}`);
    }

    // Obtiene todos los informes relacionados
    const informes = await InformeGuardaAlmancen.findAll({
      where: { iga_cac_id: cac_id },
      attributes: ["iga_codigo", "iga_id"],
    });

    if (!informes || informes.length === 0) {
      throw new Error(
        `No se encontraron informes relacionados con la carta: ${cac_id}`
      );
    }

    // Regenerar PDF por cada informe
    let totalActualizados = 0;
    for (const informe of informes) {
      const generado = await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: informe.iga_id,
      });
      if (generado) totalActualizados++;
    }

    if (totalActualizados === 0) {
      throw new Error(
        `No se generaron los PDF de los informes relacionados con carta: ${cac_id}`
      );
    }

    resultado = true;
  } else if (tipo === "Informe") {
    // Solo actualiza la carta relacionada al informe
    const [actualizarCarta] = await CAceptacion.update(
      { cac_tra_id: transportista_nuevo },
      { where: { cac_id } }
    );

    if (actualizarCarta === 0) {
      throw new Error(`No se actualizó la carta con cac_id: ${cac_id}`);
    }

    // Regenera solo el PDF de la carta
    const pdfCA = await helpercontroller.CrearPDFCA({
      req,
      res,
      next,
      id: cac_id,
    });

    if (!pdfCA) {
      throw new Error(`No se generó el PDF para la carta con id: ${cac_id}`);
    }

    // Obtiene los informes para regenerar solo uno
    const informes = await InformeGuardaAlmancen.findAll({
      where: { iga_cac_id: cac_id },
      attributes: ["iga_codigo", "iga_id"],
    });

    for (const informe of informes) {
      resultado = await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: informe.iga_id,
      });
    }
  } else {
    throw new Error(`Tipo no reconocido: ${tipo}`);
  }

  return resultado;
}

async function Actualizar_contenedor({
  req,
  res,
  next,
  documento,
  tipo,
  contenedor_nuevo,
  id_carta,
}) {
  let cac_id = id_carta;
  try {
    // Actualizar la carta
    const [actualizarCarta] = await CAceptacion.update(
      { cac_contenedor: contenedor_nuevo },
      { where: { cac_id } }
    );

    if (actualizarCarta === 0) {
      throw new Error(`No se actualizó la carta con cac_id: ${cac_id}`);
    }

    // Crear PDF de la carta
    const actualizarPDF = await helpercontroller.CrearPDFCA({
      req,
      res,
      next,
      id: cac_id,
    });

    if (actualizarPDF === false) {
      throw new Error(
        `No se actualizó el PDF de la carta con cac_id: ${cac_id}`
      );
    }

    // Obtener informes relacionados
    const informes = await InformeGuardaAlmancen.findAll({
      where: { iga_cac_id: cac_id },
      attributes: ["iga_codigo", "iga_id"],
    });

    if (!informes || informes.length === 0) {
      throw new Error(
        `No se encontraron informes relacionados con cac_id: ${cac_id}`
      );
    }

    // Generar PDF por cada informe
    let actualizaciones = 0;
    for (const informe of informes) {
      const actualizado = await helpercontroller.CrearPdfInforme({
        req,
        res,
        next,
        id: informe.iga_id,
      });

      if (actualizado === true) {
        actualizaciones++;
      }
    }

    if (actualizaciones === 0) {
      throw new Error(`No se actualizó ningún informe para cac_id: ${cac_id}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

async function DataDocTransporte({ documento, tipo }) {
  let where = `
  `;
  switch (tipo) {
    case "Carta":
      where = `a.cac_numero = '${documento}'`;
      break;
    case "Informe":
      where = `i.iga_codigo = '${documento}'`;
      break;
    default:
      where = ``;
      break;
  }

  const sql = `
    SELECT
      d.cad_id ,
      a.cac_numero ,
      a.cac_id,
      a.cac_pdf ,
      i.iga_archivo ,
      IFNULL(i.iga_id, 'No') iga_id,
      c.cli_nombre ,
      a.cac_guardalmacen ,
      i.iga_codigo ,
      d.cad_bl docTransporte,
      td.tdt_documento ,
      d.cad_cantbultos bultos,
      a.cac_totalbl totalBultosCarta,
      d.cad_peso ,
      d.cad_cbm volumenCad,
      a.cac_totalpeso pesoTotal,
      a.cac_totalcbm volumenTotal,
      dg.dga_manifestados bultosManifestados,
      dg.dga_recibidos bultosRecibidos,
      a.de_lgx 
    FROM
    clg_cac_aceptacion a
    INNER JOIN clg_cad_detalleaceptacion d ON a.cac_id = d.cad_cac_id
    INNER JOIN clg_tdt_tipodoctransporte td ON td.tdt_id = a.cac_tdt_id
    LEFT JOIN clg_iga_informeguardalmacen i ON d.cad_id = i.iga_cad_id
    LEFT JOIN clg_dga_detallesguardalmacen dg ON dg.dga_iga_id = i.iga_id
    INNER JOIN clg_cli_clientes c ON c.cli_id = d.cad_cli_id
    WHERE
    ${where}
    AND (i.iga_estado is null OR i.iga_estado = 1)
  `;

  const [rows] = await db.query(sql);
  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf =
      row.de_lgx == 1 || row.cac_pdf?.startsWith("https")
        ? row.cac_pdf
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/${row.cac_pdf}`;

    let informe_pdf =
      row.de_lgx == 1 || row.iga_archivo?.startsWith("https")
        ? row.iga_archivo
        : `https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/${row.iga_archivo}`;

    datos.push({
      index: index + 1,
      cac_id: row.cac_id,
      cad_id: row.cad_id,
      cac_numero: row.cac_numero,
      cac_pdf: carta_pdf,
      iga_archivo: informe_pdf,
      iga_id: row.iga_id,
      cli_nombre: row.cli_nombre,
      cac_guardalmacen: row.cac_guardalmacen,
      iga_codigo: row.iga_codigo,
      docTransporte: row.docTransporte,
      tdt_documento: row.tdt_documento,
      bultos: row.bultos,
      totalBultosCarta: row.totalBultosCarta,
      cad_peso: row.cad_peso,
      volumenCad: row.volumenCad,
      pesoTotal: row.pesoTotal,
      volumenTotal: row.volumenTotal,
      bultosManifestados: row.bultosManifestados,
      bultosRecibidos: row.bultosRecibidos,
      de_lgx: row.de_lgx,
    });
  });

  let cad_id = datos[0].cad_id;

  const [sumatoriaCad] = await db.query(`
    SELECT 
      SUM(cad_cantbultos) AS bultos,
      SUM(cad_peso) AS peso,
      SUM(cad_cbm) AS volumen,
      cad_cac_id AS carta
    FROM clg_cad_detalleaceptacion
    WHERE cad_cac_id = (
      SELECT cad_cac_id
      FROM clg_cad_detalleaceptacion
      WHERE cad_id = ${cad_id}
    )
    GROUP BY cad_cac_id;
  `);

  if (!sumatoriaCad || sumatoriaCad.length === 0) {
    throw new Error(`No se encontro sumatoria para  cac_id: ${cad_id}`);
  }

  let totalCad = sumatoriaCad[0]?.peso;
  let totalCad2 = sumatoriaCad[0]?.volumen;
  let v = parseFloat(totalCad2)
  let total_vol = v.toFixed(3)

  return { data: datos, total: totalCad , volumen:total_vol};
}

async function Actualizar_DocTransporte({
  req,
  res,
  next,
  documento,
  tipo,
  DocTransporte_nuevo,
  cad_id,
}) {
  let resultado = false;

  //actualizar el detalle de la carta
  const [actualizarCarta] = await DetalleCA.update(
    { cad_bl: DocTransporte_nuevo },
    { where: { cad_id } }
  );

  if (actualizarCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  //obtener id de la carta
  const registro = await DetalleCA.findOne({
    where: { cad_id },
    attributes: ["cad_cac_id"],
  });

  const cad_cac_id = registro?.cad_cac_id;
  if (!cad_cac_id) {
    throw new Error(
      `No se encontró cad_cac_id relacionado a la carta con cad_id: ${cad_id}`
    );
  }

  // generar PDF de la carta
  const actualizarCartapdf = await helpercontroller.CrearPDFCA({
    req,
    res,
    next,
    id: cad_cac_id,
  });

  if (!actualizarCartapdf) {
    throw new Error(
      `No se pudo crear el PDF de la carta con cad_cac_id: ${cad_cac_id}`
    );
  }

  //  Buscar informe relacionado con la carta
  const [informes] = await db.query(`
    SELECT
      i.iga_id AS igaId
    FROM clg_cac_aceptacion c
    INNER JOIN clg_cad_detalleaceptacion d ON c.cac_id = d.cad_cac_id
    LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = d.cad_id
    WHERE d.cad_id = ${cad_id} AND (i.iga_estado IS NULL OR i.iga_estado = 1);
  `);

  if (!informes || informes.length === 0) {
    throw new Error(`No se encontró informe para cad_id: ${cad_id}`);
  }

  const igaId = informes[0]?.igaId;
  if (!igaId) {
    throw new Error(`La variable igaId es null o indefinida`);
  }

  //actualizar informe
  const [actualizadoInforme] = await InformeGuardaAlmancen.update(
    { iga_doctransporte: DocTransporte_nuevo },
    { where: { iga_id: igaId } }
  );

  if (actualizadoInforme === 0) {
    throw new Error(`No se actualizó el informe: ${igaId}`);
  }

  // generar PDF del informe
  const Actualizadopdf = await helpercontroller.CrearPdfInforme({
    req,
    res,
    next,
    id: igaId,
  });

  if (!Actualizadopdf) {
    throw new Error(
      `No se pudo crear el PDF del informe con cad_cac_id: ${cad_cac_id}`
    );
  }

  resultado = true;
  return resultado;
}

async function Actualizar_Peso({
  req,
  res,
  next,
  documento,
  tipo,
  Peso_nuevo,
  cad_id,
}) {
  let resultado = false;

  //actualizar el detalle de la carta
  const [actualizarDCarta] = await DetalleCA.update(
    { cad_peso: Peso_nuevo },
    { where: { cad_id } }
  );

  if (actualizarDCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  //obtenemos el peso total de nuevo para actualizar la carta con la sumatoria o resta del peso que se haya cambiado
  const [sumatoriaCad] = await db.query(`
    SELECT 
      SUM(cad_cantbultos) AS bultos,
      SUM(cad_peso) AS peso,
      SUM(cad_cbm) AS volumen,
      cad_cac_id AS carta
    FROM clg_cad_detalleaceptacion
    WHERE cad_cac_id = (
      SELECT cad_cac_id
      FROM clg_cad_detalleaceptacion
      WHERE cad_id = ${cad_id}
    )
    GROUP BY cad_cac_id;
  `);

  if (!sumatoriaCad || sumatoriaCad.length === 0) {
    throw new Error(`No se encontro sumatoria para  cac_id: ${cad_id}`);
  }

  let totalCad = sumatoriaCad[0]?.peso;
  let cac_id = sumatoriaCad[0]?.carta;
  // se mandan los datos obtenidos de la sumatoria, para tener el nuevo peso en la carta
  const [actualizarCarta] = await CAceptacion.update(
    { cac_totalpeso: totalCad },
    { where: { cac_id } }
  );

  if (actualizarCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  //obtener id de la carta
  const registro = await DetalleCA.findOne({
    where: { cad_id },
    attributes: ["cad_cac_id"],
  });

  const cad_cac_id = registro?.cad_cac_id;
  if (!cad_cac_id) {
    throw new Error(
      `No se encontró cad_cac_id relacionado a la carta con cad_id: ${cad_id}`
    );
  }

  // generar PDF de la carta
  const actualizarCartapdf = await helpercontroller.CrearPDFCA({
    req,
    res,
    next,
    id: cad_cac_id,
  });

  if (actualizarCartapdf == false) {
    throw new Error(
      `No se pudo crear el PDF de la carta con cad_cac_id: ${cad_cac_id}`
    );
  }

  //  Buscar informe relacionado con la carta
  const [informes] = await db.query(`
    SELECT
      i.iga_id AS igaId
    FROM clg_cac_aceptacion c
    INNER JOIN clg_cad_detalleaceptacion d ON c.cac_id = d.cad_cac_id
    LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = d.cad_id
    WHERE d.cad_id = ${cad_id} AND (i.iga_estado IS NULL OR i.iga_estado = 1);
  `);

  if (!informes || informes.length === 0) {
    throw new Error(`No se encontró informe para cad_id: ${cad_id}`);
  }

  const igaId = informes[0]?.igaId;
  if (!igaId) {
    throw new Error(`La variable igaId es null o indefinida`);
  }

  //actualizar el peso en detalle informe guardaalmacen

  const [actualizarDInforme] = await DetalleGuardaAlmancen.update(
    { dga_peso: Peso_nuevo },
    { where: { dga_iga_id: igaId } }
  );

  if (actualizarDInforme === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar el detalle informe con igaId: ${cad_id}`
    );
  }

  // generar PDF del informe
  const Actualizadopdf = await helpercontroller.CrearPdfInforme({
    req,
    res,
    next,
    id: igaId,
  });

  if (Actualizadopdf == false) {
    throw new Error(
      `No se pudo crear el PDF del informe con cad_cac_id: ${cad_cac_id}`
    );
  }

  resultado = true;
  return resultado;
}

async function Actualizar_Volumen({
  req,
  res,
  next,
  documento,
  tipo,
  Volumen_nuevo,
  cad_id,
}) {
  let resultado = false;

  //actualizar el detalle de la carta
  const [actualizarDCarta] = await DetalleCA.update(
    { cad_cbm: Volumen_nuevo },
    { where: { cad_id } }
  );

  if (actualizarDCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  //obtenemos el peso total de nuevo para actualizar la carta con la sumatoria o resta del peso que se haya cambiado
  const [sumatoriaCad] = await db.query(`
    SELECT 
      SUM(cad_cantbultos) AS bultos,
      SUM(cad_peso) AS peso,
      SUM(cad_cbm) AS volumen,
      cad_cac_id AS carta
    FROM clg_cad_detalleaceptacion
    WHERE cad_cac_id = (
      SELECT cad_cac_id
      FROM clg_cad_detalleaceptacion
      WHERE cad_id = ${cad_id}
    )
    GROUP BY cad_cac_id;
  `);

  if (!sumatoriaCad || sumatoriaCad.length === 0) {
    throw new Error(`No se encontro sumatoria para  cac_id: ${cad_id}`);
  }

  let totalCad = sumatoriaCad[0]?.volumen;
  let cac_id = sumatoriaCad[0]?.carta;
  // se mandan los datos obtenidos de la sumatoria, para tener el nuevo peso en la carta
  const [actualizarCarta] = await CAceptacion.update(
    { cac_totalcbm: totalCad },
    { where: { cac_id } }
  );

  if (actualizarCarta === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar la carta con cad_id: ${cad_id}`
    );
  }

  //obtener id de la carta
  const registro = await DetalleCA.findOne({
    where: { cad_id },
    attributes: ["cad_cac_id"],
  });

  const cad_cac_id = registro?.cad_cac_id;
  if (!cad_cac_id) {
    throw new Error(
      `No se encontró cad_cac_id relacionado a la carta con cad_id: ${cad_id}`
    );
  }

  // generar PDF de la carta
  const actualizarCartapdf = await helpercontroller.CrearPDFCA({
    req,
    res,
    next,
    id: cad_cac_id,
  });

  if (actualizarCartapdf == false) {
    throw new Error(
      `No se pudo crear el PDF de la carta con cad_cac_id: ${cad_cac_id}`
    );
  }

  //  Buscar informe relacionado con la carta
  const [informes] = await db.query(`
    SELECT
      i.iga_id AS igaId
    FROM clg_cac_aceptacion c
    INNER JOIN clg_cad_detalleaceptacion d ON c.cac_id = d.cad_cac_id
    LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = d.cad_id
    WHERE d.cad_id = ${cad_id} AND (i.iga_estado IS NULL OR i.iga_estado = 1);
  `);

  if (!informes || informes.length === 0) {
    throw new Error(`No se encontró informe para cad_id: ${cad_id}`);
  }

  const igaId = informes[0]?.igaId;
  if (!igaId) {
    throw new Error(`La variable igaId es null o indefinida`);
  }

  //actualizar el peso en detalle informe guardaalmacen

  const [actualizarInforme] = await InformeGuardaAlmacen.update(
    { iga_volumen: Volumen_nuevo },
    { where: { iga_id: igaId } }
  );

  if (actualizarInforme === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar el  informe con igaId: ${cad_id}`
    );
  }

  const [actualizarDInforme] = await DetalleGuardaAlmancen.update(
    { dga_volumen: Volumen_nuevo },
    { where: { dga_iga_id: igaId } }
  );

  if (actualizarDInforme === 0) {
    throw new Error(
      `No se encontró o no se pudo actualizar el detalle informe con igaId: ${cad_id}`
    );
  }

  // generar PDF del informe
  const Actualizadopdf = await helpercontroller.CrearPdfInforme({
    req,
    res,
    next,
    id: igaId,
  });

  if (Actualizadopdf == false) {
    throw new Error(
      `No se pudo crear el PDF del informe con cad_cac_id: ${cad_cac_id}`
    );
  }

  resultado = true;
  return resultado;
}

module.exports = {
  data_busquedaPorCarta,
  data_fecha_carta,
  data_fecha_informe,
  data_fecha_salida,
  actualizarFechaDocumento,
  data_cambio_destino,
  data_cambio_origen,
  data_actualizar_destino,
  data_actualizar_origen,
  data_actualizar_cliente,
  data_actualizar_aduana,
  data_actualizar_transportista,
  Actualizar_contenedor,
  DataDocTransporte,
  Actualizar_DocTransporte,
  Actualizar_Peso,
  Actualizar_Volumen
};
