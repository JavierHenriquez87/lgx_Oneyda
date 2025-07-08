const db = require("../../database/db");

async function dataSaldoIngresos({
  datobusqueda = null,
  tipo_documento = null,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE 
    i.iga_estado = 1
  `;
  if (tipo_documento == null) {
    where += ``;
  } else if (tipo_documento == "Cliente" && datobusqueda != null) {
    where += `
    AND c.cli_nombre like '%${datobusqueda}%'
  `;
  } else if (tipo_documento == "Carta" && datobusqueda != null) {
    where += `
    AND cac.cac_numero = '${datobusqueda}'
  `;
  } else if (tipo_documento == "Informe" && datobusqueda != null) {
    where += `
    AND i.iga_codigo = '${datobusqueda}'
  `;
  } else if (tipo_documento == "Transporte" && datobusqueda != null) {
    where += `
    AND i.iga_doctransporte = '${datobusqueda}'
  `;
  }

  const sql = `
    SELECT 
      i.iga_id, 
      i.iga_valor_inicial, 
      i.iga_valor_actual, 
      c.cli_nombre,
      c.cli_id, 
      i.iga_codigo,
      i.iga_stal_id,
      cac.cac_numero, 
      cac.cac_contenedor, 
      ta.stal_estado, 
      i.iga_fechaingreso, 
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaingreso,
      i.iga_fechaabandono, 
      i.iga_doctransporte, 
      d.dga_id, 
      t.tar_nbultos, 
      ROUND(SUM(t.tar_vol_actual), 2) as saldoVolumen,
      ROUND(SUM(t.tar_vol_actual), 2) as tar_vol_actual,
      da.cad_pai_id, 
      doc.doc_ndocumento
    FROM clg_iga_informeguardalmacen AS i
    JOIN clg_stal_estadosalmacenaje AS ta ON ta.stal_id = i.iga_stal_id
    JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
    JOIN clg_cli_clientes AS c ON c.cli_id = i.iga_cli_id
    JOIN clg_cac_aceptacion AS cac ON cac.cac_id = i.iga_cac_id
    JOIN clg_cad_detalleaceptacion AS da ON da.cad_id = i.iga_cad_id
    JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
    LEFT JOIN clg_doc_documentos AS doc ON doc.doc_iga_id = i.iga_id
    ${where}
    GROUP BY 
        i.iga_id,cac.cac_numero,d.dga_id,doc.doc_ndocumento,t.tar_nbultos
    ORDER BY 
        i.iga_fechaingreso DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  const [general] = await db.query(sql);

  const detallePromises = general.map(async (row) => {
    let detalles = [];
    let saldoInicial = [];
    let salidas = [];
    let salidasdetalles = [];

    if (row.iga_stal_id != 1) {
      const detalleSQL = `
        SELECT
          idiga,
          nInforme,
          codProducto,
          descripcionProducto,
          codigo_macro,
          medida,
          partida,
          pesoInicial,
          bultos,
          ROUND(pesoInicial/bultos, 2) as pesoUnitario,
          cuantiaSaldoProducto,
          ROUND(saldoVolumen, 2) as saldoVolumen,
          ROUND(pesoSaldo, 2) as pesoSaldo,
          cifSaldo,
          dm
        FROM (
          SELECT
            i.iga_id AS idiga,
            i.iga_codigo AS nInforme
          FROM clg_iga_informeguardalmacen AS i
          WHERE i.iga_id = ${row.iga_id} AND i.iga_com_id = 38
        ) iga
        LEFT JOIN (
          SELECT
            d.dga_id AS iddga,
            d.dga_iga_id AS idigafor,
            d.dga_peso AS pesoInicial,
            d.dga_recibidos AS bultos,
            d.dga_partida_arancelaria AS partida,
            p.pro_codigo AS codProducto,
            p.pro_nombre AS descripcionProducto,
            p.pro_codigo AS codigo_macro,
            p.pro_medida AS medida
          FROM clg_dga_detallesguardalmacen AS d
          INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
        ) dga ON dga.idigafor = iga.idiga
        LEFT JOIN (
          SELECT
            t.tar_dga_id AS dgaid,
            t.tar_dga_id AS iddgafor,
            SUM(t.tar_nbultos)  AS cuantiaSaldoProducto,
            SUM(t.tar_peso_actual) AS pesoSaldo,
            SUM(t.tar_cif_actual) AS cifSaldo,
            SUM(t.tar_vol_actual) AS saldoVolumen
          FROM clg_tar_tarimas AS t
          GROUP BY dgaid
        ) tar ON tar.iddgafor = dga.iddga
        LEFT JOIN (
          SELECT
            doc.doc_iga_id AS idigadoc,
            doc.doc_ndocumento AS dm
          FROM clg_doc_documentos AS doc
          GROUP BY dm, doc.doc_iga_id
        ) docs ON docs.idigadoc = iga.idiga;
      `;
      const [resultado] = await db.query(detalleSQL);
      detalles = resultado;

      const detalleinicial = `
        SELECT
          idiga,
          nInforme,
          nui,
          descripcionProducto,
          codigo_macro,
          medida,
          partida,
          ROUND(peso_inicial, 2) peso_inicial,
          bultos_inicial,
          ROUND(volumen_inicial, 2) volumen_inicial,
          cif_inicial,
          dm,
          ROUND(peso_inicial/bultos_inicial, 2) as pesoUnitario
        FROM
          (
            SELECT
              i.iga_id AS idiga,
              i.iga_codigo AS nInforme
            FROM
            clg_iga_informeguardalmacen AS i
            where i.iga_id = ${row.iga_id} AND i.iga_com_id = 38
          ) iga
        LEFT JOIN (
          SELECT
            d.dga_id AS iddga,
            d.dga_iga_id AS idigafor,
            d.dga_partida_arancelaria AS partida,
            p.pro_codigo AS nui,
            p.pro_nombre AS descripcionProducto,
            p.pro_codigo AS codigo_macro,
            p.pro_medida AS medida
          FROM
            clg_dga_detallesguardalmacen AS d
          INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
        ) dga ON dga.idigafor = iga.idiga
        LEFT JOIN (
          SELECT
            t.tar_dga_id AS dgaid,
            t.tar_dga_id AS iddgafor,
            IFNULL(SUM(t.tar_salida),0)+SUM(t.tar_nbultos) as bultos_inicial,
            SUM(t.tar_cif_inicial) AS cif_inicial,
            SUM(t.tar_vol_inicial) AS volumen_inicial,
          SUM(t.tar_peso_inicial) AS peso_inicial
          FROM
            clg_tar_tarimas AS t
          GROUP BY
            dgaid
        ) tar ON tar.iddgafor = dga.iddga
        LEFT JOIN (
          SELECT
            doc.doc_iga_id AS idigadoc,
            doc.doc_ndocumento AS dm
          FROM
            clg_doc_documentos AS doc
            GROUP BY dm,doc.doc_iga_id
        ) docs ON docs.idigadoc = iga.idiga
      `;
      const [resultado2] = await db.query(detalleinicial);
      saldoInicial = resultado2;

      const detallesalida = `
        SELECT
          sal_id
        FROM
        clg_sal_salidas
        WHERE sal_iga_id = ${row.iga_id}
        ORDER BY
        sal_fecha ASC
      `;
      const [resultado3] = await db.query(detallesalida);
      salidas = resultado3;

      for (const salida of salidas) {
        const detalleSalidaSQL = `
           SELECT
            sd.sald_descargo AS dm,
            sd.sald_volumen AS volumen,
            sd.sald_cantidad AS bultos,
            sd.sald_peso AS peso,
            sd.sald_cif AS cif,
            p.pro_codigo AS nui,
            p.pro_nombre AS nombre_producto,
            p.pro_codigo AS codigo_macro,
            p.pro_medida AS medida
          FROM
            clg_sald_salidadetalles sd
          INNER JOIN clg_tar_tarimas AS t ON t.tar_id = sd.sald_tar_id
          INNER JOIN clg_dga_detallesguardalmacen AS dg ON dg.dga_id = t.tar_dga_id
          INNER JOIN clg_pro_productos AS p ON dg.dga_pro_id = p.pro_id
          WHERE sd.sald_sal_id = ${salida.sal_id}
        `;
        const [resultado4] = await db.query(detalleSalidaSQL);
        salidasdetalles.push(...resultado4);
      }
    }

    return {
      ...row,
      detalles,
      saldoInicial,
      salidasdetalles,
    };
  });

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT 
        i.iga_id, 
        i.iga_valor_inicial, 
        i.iga_valor_actual, 
        c.cli_nombre,
        c.cli_id, 
        i.iga_codigo,
        i.iga_stal_id,
        cac.cac_numero, 
        cac.cac_contenedor, 
        ta.stal_estado, 
        i.iga_fechaingreso, 
        DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaingreso,
        i.iga_fechaabandono, 
        i.iga_doctransporte, 
        d.dga_id, 
        SUM(t.tar_nbultos) AS saldo, 
        SUM(t.tar_vol_actual) AS vol, 
        da.cad_pai_id, 
        doc.doc_ndocumento
      FROM clg_iga_informeguardalmacen AS i
      JOIN clg_stal_estadosalmacenaje AS ta ON ta.stal_id = i.iga_stal_id
      JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
      JOIN clg_cli_clientes AS c ON c.cli_id = i.iga_cli_id
      JOIN clg_cac_aceptacion AS cac ON cac.cac_id = i.iga_cac_id
      JOIN clg_cad_detalleaceptacion AS da ON da.cad_id = i.iga_cad_id
      JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
      LEFT JOIN clg_doc_documentos AS doc ON doc.doc_iga_id = i.iga_id
      ${where}
      GROUP BY 
          i.iga_id,cac.cac_numero,d.dga_id,doc.doc_ndocumento
      ORDER BY 
          i.iga_fechaingreso DESC
    ) AS resultados;
  `;

  const [[{ total }]] = await db.query(countSql);
  const resultadoFinal = await Promise.all(detallePromises);

  return { data: resultadoFinal, total };
}

async function dataSaldoIngresosFecha({
  fecha_inicio,
  fecha_final,
  id_cliente,
}) {
  const sql = `
    SELECT
      i.iga_id ,
      i.iga_cac_id ,
      i.iga_codigo ,
      i.iga_estado ,
      i.iga_doctransporte ,
      c.cli_nombre ,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaingreso,
      i.iga_fechaingreso ,
      cac.cac_numero ,
      cac.cac_contenedor ,
      (IFNULL(SUM(t.tar_nbultos), 0)+IFNULL(SUM(t.tar_salida),0)) AS saldo_inicial,
      SUM(t.tar_nbultos) AS saldo,
      e.stal_estado AS tipoalmacenaje
    FROM
      clg_iga_informeguardalmacen AS i
    INNER JOIN clg_cac_aceptacion AS cac ON cac.cac_id = i.iga_cac_id
    INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
    INNER JOIN clg_stal_estadosalmacenaje AS e ON i.iga_stal_id = e.stal_id
    INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
    INNER JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
    WHERE i.iga_estado = 1  AND i.iga_cli_id = ${id_cliente} AND i.iga_fechaingreso BETWEEN '${fecha_inicio}' and '${fecha_final}'
    GROUP BY i.iga_id,cac.cac_numero
    ORDER BY
      i.iga_fechaingreso DESC  
  `;
  const [resultado] = await db.query(sql);

  let nuevoarreglo = [];
  let total_inicial = 0;
  let total_salida = 0;

  for (const row of resultado) {

    const sqlSalidas = `
      SELECT IFNULL(SUM(sal_nbultos), 0) AS bultos
      FROM clg_sal_salidas
      WHERE sal_iga_id = ${row.iga_id} 
        AND sal_fecha BETWEEN '${fecha_inicio}' AND '${fecha_final}'
    `;
    const [[{ bultos }]] = await db.query(sqlSalidas);

    const saldo = row.saldo_inicial - bultos;

    if (saldo > 0) {
      total_inicial += row.saldo_inicial;
      total_salida += Number(saldo);

      nuevoarreglo.push({
        ...row,
        bultos_salida: bultos,
        saldo_calculado: saldo,
      });

    }

  }
  let totales = {
    total_inicial,
    total_salida
  }

  return { data: nuevoarreglo, totales };
}
module.exports = {
  dataSaldoIngresos,
  dataSaldoIngresosFecha,
};
