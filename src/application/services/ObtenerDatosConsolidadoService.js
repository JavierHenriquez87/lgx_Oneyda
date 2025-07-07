const db = require("../../database/db");

async function data_consolidado(id) {
  const sql = `
    SELECT
        s.sal_id AS id,
        s.sal_codigo AS codigo,
        s.sal_tarimas_prestadas AS tarimasPrestadas,
        c.cli_nombre AS cliente,
        GROUP_CONCAT(con.sco_declaracion SEPARATOR '/') AS numerodm,
        GROUP_CONCAT(con.sco_no_factura SEPARATOR '/') AS factura,
        s.sal_peso AS peso,
        GROUP_CONCAT(con.sco_doc_transporte SEPARATOR '/') AS doctransporte,
        s.sal_volumen AS volumen,
        s.sal_pai_id AS pais,
        s.sal_nbultos AS bultosxtarima,
        s.sal_comentarios AS comentarios,
        s.sal_placa AS placa,
        s.sal_fecha AS fecha,
        s.sal_no_codigo AS noCodigo,
        s.sal_nombre_piloto AS piloto,
        s.sal_dui_piloto AS dui,
        s.sal_licencia_conducir AS licConducir,
        s.sal_endoso AS endosado,
        tdsal.tdocsal_documento AS tipodoc,
        GROUP_CONCAT(DATE_FORMAT(con.sco_fecha_registro, '%d-%m-%Y') SEPARATOR ',') AS fechadm
    FROM clg_sal_salidas s
    LEFT JOIN clg_cli_clientes c ON c.cli_id = s.sal_cli_id
    LEFT JOIN clg_tipodocumento_salida tdsal ON tdsal.tdocsal_id = s.sal_tipo_doc
    LEFT JOIN clg_sco_salidaconsolidada con ON con.sco_sal_id = s.sal_id
    WHERE s.sal_id = '${id}'
    GROUP BY s.sal_id
  `;

  const [generalRows] = await db.query(sql);
  const general = generalRows[0];

  if (!general) {
    return {
      status: 404,
      message: "Salida no encontrada",
      response: null,
    };
  }

  const id_nuevo = general.id;

  const sq2 = `
    SELECT
        p.pro_codigo AS codigopro,
        p.pro_nombre AS descripcion,
        i.iga_fecha AS lote,
        i.iga_id AS idiga,
        i.iga_stal_id AS regimen,
        i.iga_codigo AS codigoiga,
        i.iga_ubicacion AS ubicacion,
        sd.sald_cantidad AS piezas,
        sd.sald_descargo AS descargo,
        cl.cli_nombre AS cliente,
        c.cac_numero AS codigoca
    FROM clg_sald_salidadetalles sd
    LEFT JOIN clg_tar_tarimas t ON t.tar_id = sd.sald_tar_id
    LEFT JOIN clg_dga_detallesguardalmacen dg ON dg.dga_id = t.tar_dga_id
    LEFT JOIN clg_pro_productos p ON p.pro_id = dg.dga_pro_id
    LEFT JOIN clg_iga_informeguardalmacen i ON i.iga_id = dg.dga_iga_id
    LEFT JOIN clg_cli_clientes cl ON cl.cli_id = i.iga_cli_id
    LEFT JOIN clg_cac_aceptacion c ON c.cac_id = i.iga_cac_id
    WHERE sd.sald_sal_id = ${id_nuevo}
  `;

  const [detalle] = await db.query(sq2);

  const sq3 = `
    SELECT sco_iga_id AS iga, sco_fecha_ingreso AS fecha
    FROM clg_sco_salidaconsolidada
    WHERE sco_sal_id = ${id_nuevo}
  `;

  const [ingresos] = await db.query(sq3);

  const fechasigas = {};
  for (const fila of ingresos) {
    fechasigas[fila.iga] = fila.fecha;
  }
  let datos = {
    general,
    detalle,
    fechasigas,
  };

  return { datos };
}

module.exports = {
  data_consolidado
};
