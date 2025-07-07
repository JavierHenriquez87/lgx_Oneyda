const db = require("../../database/db");
const moment = require("moment");

async function dataAnexo1_1Ingresos({
  anio = null,
  datobusqueda = null,
  compania_id,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE c.cac_id NOT IN (5485,6993)
    AND i.iga_estado = 1
    AND i.iga_ubicacion <> 'Externa'
    AND i.iga_com_id = ${compania_id}
  `;
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  if (datobusqueda) {
    where += ` AND cl.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  if (desde && hasta) {
    where += ` AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`;
  }

  const sql = `
    SELECT
      cl.cli_nombre,
      'DUCA-T' AS tipoDoc,
      i.iga_dmti,
      i.iga_codigo,
      DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') AS iga_fechaingreso,
      d.dga_partida_arancelaria,
      p.pro_codigo,
      IFNULL(ualm.ualm_unidad, '') AS unidad,
      p.pro_nombre,
      SUBSTR(d.dga_partida_arancelaria, 1, 4) AS codProducto,
      d.dga_recibidos,
      ROUND(d.dga_peso, 2) AS pesoNeto,
      ROUND(d.dga_cif, 2) AS cif,
      e.stal_estado 
    FROM
      clg_cac_aceptacion c
    INNER JOIN clg_iga_informeguardalmacen AS i ON c.cac_id = i.iga_cac_id
    INNER JOIN clg_cli_clientes AS cl ON i.iga_cli_id = cl.cli_id
    INNER JOIN clg_stal_estadosalmacenaje AS e ON i.iga_stal_id = e.stal_id
    INNER JOIN clg_tdt_tipodoctransporte AS tdt ON tdt.tdt_id = c.cac_tdt_id
    INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
    INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
    LEFT JOIN clg_unidad_almacenaje AS ualm ON d.dga_ualm_id = ualm.ualm_id
    ${where}
    GROUP BY
      cl.cli_nombre,
      i.iga_dmti,
      i.iga_codigo,
      iga_fechaingreso,
      d.dga_partida_arancelaria,
      p.pro_codigo,
      unidad,
      p.pro_nombre,
      codProducto,
      d.dga_recibidos,
      pesoNeto,
      cif,
      e.stal_estado,
      i.iga_fechaingreso
    ORDER BY i.iga_fechaingreso
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT
    COUNT(*) AS total
    FROM
      clg_cac_aceptacion c
      INNER JOIN clg_iga_informeguardalmacen AS i ON c.cac_id = i.iga_cac_id
      INNER JOIN clg_cli_clientes AS cl ON i.iga_cli_id = cl.cli_id
      INNER JOIN clg_stal_estadosalmacenaje AS e ON i.iga_stal_id = e.stal_id
      INNER JOIN clg_tdt_tipodoctransporte AS tdt ON tdt.tdt_id = c.cac_tdt_id
      INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
      INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
      LEFT JOIN clg_unidad_almacenaje AS ualm ON d.dga_ualm_id = ualm.ualm_id
      ${where}
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_1Egresos({
  anio = null,
  datobusqueda = null,
  compania_id,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE i.iga_cac_id NOT IN (5485,6993)
    AND i.iga_estado = 1
    AND i.iga_ubicacion <> 'Externa'
    AND i.iga_com_id = ${compania_id}
  `;
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  if (datobusqueda) {
    where += ` AND c.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  if (desde && hasta) {
    where += ` AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`;
  }

  const sql = `
    SELECT
      c.cli_nombre ,
      tds.tdocsal_documento ,
      s.sal_numerodm,
      i.iga_codigo ,
      s.sal_fecha,
      s.sal_codigo,
      s.sal_peso ,
      p.pro_codigo,
      p.pro_nombre,
      ROUND(dg.dga_peso, 2) AS pesoNeto,
      dg.dga_partida_arancelaria,
      SUBSTR(dg.dga_partida_arancelaria, 1, 4) AS codProducto,
      IFNULL(u.ualm_unidad, '') AS unidad,
      e.stal_estado,
      ROUND(IFNULL(Sum(sd.sald_cifdm), ''), 2) AS cifDM,
      Sum(sd.sald_cantidad) AS cuantia
    FROM
      clg_sal_salidas s
    INNER JOIN clg_sald_salidadetalles sd ON s.sal_id = sd.sald_sal_id
    INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.sal_iga_id
    INNER JOIN clg_cli_clientes c ON c.cli_id = i.iga_cli_id
    INNER JOIN clg_stal_estadosalmacenaje AS e ON i.iga_stal_id = e.stal_id
    INNER JOIN clg_tar_tarimas AS t ON t.tar_id = sd.sald_tar_id
    INNER JOIN clg_dga_detallesguardalmacen AS dg ON dg.dga_id = t.tar_dga_id
    INNER JOIN clg_pro_productos AS p ON dg.dga_pro_id = p.pro_id
    LEFT JOIN clg_unidad_almacenaje AS u ON dg.dga_ualm_id = u.ualm_id
    INNER JOIN clg_tipodocumento_salida AS tds ON tds.tdocsal_id = s.sal_tipo_doc
    ${where}
    GROUP BY
      c.cli_nombre,
      tds.tdocsal_documento,
      s.sal_numerodm,
      i.iga_codigo,
      s.sal_fecha,
      s.sal_codigo,
      s.sal_peso,
      p.pro_codigo,
      p.pro_nombre,
      dg.dga_peso,
      dg.dga_partida_arancelaria,
      SUBSTR(dg.dga_partida_arancelaria, 1, 2),
      IFNULL(u.ualm_unidad, ''),
      e.stal_estado,
      sd.sald_cifdm,
      sd.sald_cantidad
    ORDER BY
      s.sal_fecha DESC
      LIMIT ${limit} OFFSET ${offset};
   `;

  const countSql = `
    SELECT
      COUNT(*) AS total
    FROM
      clg_sal_salidas s
    INNER JOIN clg_sald_salidadetalles sd ON s.sal_id = sd.sald_sal_id
    INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.sal_iga_id
    INNER JOIN clg_cli_clientes c ON c.cli_id = i.iga_cli_id
    INNER JOIN clg_stal_estadosalmacenaje AS e ON i.iga_stal_id = e.stal_id
    INNER JOIN clg_tar_tarimas AS t ON t.tar_id = sd.sald_tar_id
    INNER JOIN clg_dga_detallesguardalmacen AS dg ON dg.dga_id = t.tar_dga_id
    INNER JOIN clg_pro_productos AS p ON dg.dga_pro_id = p.pro_id
    LEFT JOIN clg_unidad_almacenaje AS u ON dg.dga_ualm_id = u.ualm_id
    INNER JOIN clg_tipodocumento_salida AS tds ON tds.tdocsal_id = s.sal_tipo_doc
    ${where} 
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_2({
  anio = null,
  datobusqueda = null,
  compania_id,
  limit = 50,
  offset = 0,
}) {
  const desde = moment(`${anio}-01-01`)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const hasta = moment(`${anio}-12-31`)
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  const wherebasico = [
    "c.cac_id <> 5485",
    "i.iga_estado = 1",
    "i.iga_ubicacion <> 'Externa'",
    "d.dga_recibidos > 0",
    "i.iga_stal_id <> 1",
    `i.iga_com_id = ${compania_id}`,
  ];

  if (desde && hasta) {
    wherebasico.push(`i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`);
  }

  if (datobusqueda) {
    wherebasico.push(`cl.cli_nombre LIKE '%${datobusqueda}%'`);
  }

  const where = `WHERE ${wherebasico.join(" AND ")}`;

  const sql = `
    SELECT
      i.iga_id,
      cl.cli_nombre,
      IF(dt.tdt_documento = 'CP' OR dt.tdt_documento = 'BL', 'DUCA-T', dt.tdt_documento) tipoDocumento,
      IF(dt.tdt_documento = 'CP' OR dt.tdt_documento = 'BL', i.iga_dmti, i.iga_doctransporte) numeroDocumento,
      i.iga_codigo,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaIngreso,
      DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%Y') fecha,
      d.dga_partida_arancelaria,
      p.pro_nombre,
      SUM(t.tar_inicial) tar_inicial,
      u.ualm_unidad,
      st.stal_estado,
      SUM(t.tar_nbultos) tar_nbultos
    FROM
      clg_iga_informeguardalmacen i
      INNER JOIN clg_stal_estadosalmacenaje st ON st.stal_id = i.iga_stal_id
      INNER JOIN clg_cac_aceptacion c ON i.iga_cac_id = c.cac_id
      INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
      INNER JOIN clg_tdt_tipodoctransporte dt ON c.cac_tdt_id = dt.tdt_id
      INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
      LEFT JOIN clg_unidad_almacenaje u ON u.ualm_id = d.dga_ualm_id
      INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
    ${where}
    GROUP BY
      d.dga_id,
      cl.cli_nombre,
      dt.tdt_documento,
      i.iga_codigo,
      i.iga_fechaingreso,
      d.dga_partida_arancelaria
    HAVING
      tar_inicial <> 0
      AND tar_nbultos > 0
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 1
      FROM
        clg_iga_informeguardalmacen i
        INNER JOIN clg_stal_estadosalmacenaje st ON st.stal_id = i.iga_stal_id
        INNER JOIN clg_cac_aceptacion c ON i.iga_cac_id = c.cac_id
        INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
        INNER JOIN clg_tdt_tipodoctransporte dt ON c.cac_tdt_id = dt.tdt_id
        INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
        LEFT JOIN clg_unidad_almacenaje u ON u.ualm_id = d.dga_ualm_id
        INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
        INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
      ${where}
      GROUP BY
        d.dga_id,
        cl.cli_nombre,
        dt.tdt_documento,
        i.iga_codigo,
        i.iga_fechaingreso,
        d.dga_partida_arancelaria
      HAVING
        SUM(t.tar_inicial) <> 0
        AND SUM(t.tar_nbultos) > 0
    ) AS subquery;
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_3({
  anio = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE i.iga_cac_id NOT IN (5485, 6993)
      AND i.iga_stal_id = 2
      AND i.iga_ubicacion <> 'Externa'
      AND d.dga_recibidos > 0
  `;
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  if (datobusqueda) {
    where += ` AND c.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  if (desde && hasta) {
    where += ` AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`;
  }

  const sql = `
    SELECT
      i.iga_codigo,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaIngreso,
      d.dga_partida_arancelaria,
      c.cli_nombre,
      p.pro_codigo,
      p.pro_nombre,
      doc.doc_ndocumento,
      sx.docEgreso,
      DATE_FORMAT(doc.doc_fecha, '%d-%m-%Y') fechaDocIngreso,
      sx.fechaDocEgreso,
      sx.fechaSalida,
      sx.salida,
      ROUND(d.dga_peso, 3) AS pesoNeto,
      t.tar_id,
      t.tar_inicial,
      sd.sald_cantidad,
      i.iga_stal_id
    FROM
      clg_dga_detallesguardalmacen d
      INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = d.dga_iga_id
      INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
      INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
      INNER JOIN clg_sald_salidadetalles sd ON t.tar_id = sd.sald_tar_id
      INNER JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') tipo,
          s.sal_id salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
          s.sal_codigo salida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) docEgreso,
          DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') fechaDocEgreso
          FROM
            clg_sal_salidas s
            LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
      ) sx ON sx.salId = sd.sald_sal_id
      AND sx.igaId = i.iga_id
      LEFT JOIN clg_doc_documentos doc ON doc.doc_iga_id = i.iga_id
    ${where}
    ORDER BY
    i.iga_id DESC,
    d.dga_id ASC,
    sald_id ASC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT
      COUNT(*) AS total
    FROM
      clg_dga_detallesguardalmacen d
      INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = d.dga_iga_id
      INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
      INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
      INNER JOIN clg_sald_salidadetalles sd ON t.tar_id = sd.sald_tar_id
      INNER JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') tipo,
          s.sal_id salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
          s.sal_codigo salida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) docEgreso,
          DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') fechaDocEgreso
        FROM
          clg_sal_salidas s
          LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
      ) sx ON sx.salId = sd.sald_sal_id
      AND sx.igaId = i.iga_id
      LEFT JOIN clg_doc_documentos doc ON doc.doc_iga_id = i.iga_id
      ${where}
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const saldos = {};
  const formatoData = rows.map((row, index) => {
    const tarId = row.tar_id;

    if (!saldos.hasOwnProperty(tarId)) {
      saldos[tarId] = row.tar_inicial;
    }

    saldos[tarId] -= row.sald_cantidad;

    return {
      ...row,
      index: index + 1,
      saldo: saldos[tarId],
      lote: "",
    };
  });

  return { data: formatoData, total };
}

async function dataAnexo1_4({
  anio = null,
  compania_id = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE i.iga_cac_id NOT IN (5485, 6993)
      AND i.iga_stal_id = 2
      AND i.iga_estado= 1
      AND dt.saldoActual > 0
      AND i.iga_com_id = ${compania_id}
  `;
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  if (datobusqueda) {
    where += ` AND cl.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  if (desde && hasta) {
    where += ` AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`;
  }

  const sql = `
    SELECT
      i.iga_id igaId,
      DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') fechaIngreso,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaFiltro,
      cl.cli_nombre cliente,
      i.iga_codigo informe,
      dt.cuantiaInicial,
      sx.codigoSalida salida,
      SUM(s.cuantiaSalida) cuantiaSalida,
      '' lote,
      sx.ndmegreso numeroDM
    FROM
      clg_iga_informeguardalmacen i
    LEFT JOIN clg_doc_documentos dc ON dc.doc_iga_id = i.iga_id
    INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
    INNER JOIN (
      SELECT
        dga_iga_id,
        SUM(t.tar_inicial) cuantiaInicial,
        SUM(t.tar_nbultos) saldoActual,
        IFNULL(SUM(t.tar_salida), 0) cuantiaSalida
      FROM
        clg_dga_detallesguardalmacen d
        INNER JOIN clg_tar_tarimas t ON d.dga_id = t.tar_dga_id
      GROUP BY
        dga_iga_id
    ) dt ON i.iga_id = dt.dga_iga_id
    LEFT JOIN (
      SELECT
        IF(sc.sco_id IS NULL, 'S', 'C') tipo,
        s.sal_id salId,
        IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
        s.sal_codigo codigoSalida,
        DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
        IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) ndmegreso,
        IF(s.sal_numerodm = 'VARIOS', sc.sco_dti, s.sal_dti) dti
      FROM
        clg_sal_salidas s
        LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
    ) sx ON sx.igaId = i.iga_id
    LEFT JOIN (
      SELECT
        s.sal_id salId,
        IF(sc.sco_id IS NULL, 'S', 'C') tipo,
        s.sal_codigo salida,
        IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
        sald_cantidad cuantiaSalida
      FROM
        clg_sald_salidadetalles sd
        LEFT JOIN clg_sco_salidaconsolidada sc ON sd.sald_sco_id = sc.sco_id
        INNER JOIN clg_sal_salidas s ON s.sal_id = sd.sald_sal_id
    ) s ON s.igaId = i.iga_id
    AND s.salId = sx.salId
    ${where}
    GROUP BY
      i.iga_id,
      s.salId,
      i.iga_fechaingreso,
      cl.cli_nombre,
      i.iga_codigo ,
      dt.cuantiaInicial,
      sx.codigoSalida,
      s.cuantiaSalida,
      sx.ndmegreso 
      LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*) AS total 
    FROM (
      SELECT i.iga_id, s.salId
      FROM clg_iga_informeguardalmacen i
      LEFT JOIN clg_doc_documentos dc ON dc.doc_iga_id = i.iga_id
      INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
      INNER JOIN (
        SELECT
          dga_iga_id,
          SUM(t.tar_inicial) cuantiaInicial,
          SUM(t.tar_nbultos) saldoActual,
          IFNULL(SUM(t.tar_salida), 0) cuantiaSalida
        FROM clg_dga_detallesguardalmacen d
        INNER JOIN clg_tar_tarimas t ON d.dga_id = t.tar_dga_id
        GROUP BY dga_iga_id
      ) dt ON i.iga_id = dt.dga_iga_id
      LEFT JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') tipo,
          s.sal_id salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
          s.sal_codigo codigoSalida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) ndmegreso,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_dti, s.sal_dti) dti
        FROM clg_sal_salidas s
        LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
      ) sx ON sx.igaId = i.iga_id
      LEFT JOIN (
        SELECT
          s.sal_id salId,
          IF(sc.sco_id IS NULL, 'S', 'C') tipo,
          s.sal_codigo salida,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
          sald_cantidad cuantiaSalida
        FROM clg_sald_salidadetalles sd
        LEFT JOIN clg_sco_salidaconsolidada sc ON sd.sald_sco_id = sc.sco_id
        INNER JOIN clg_sal_salidas s ON s.sal_id = sd.sald_sal_id
      ) s ON s.igaId = i.iga_id AND s.salId = sx.salId
      ${where}
      GROUP BY
          i.iga_id,
          s.salId,
          i.iga_fechaingreso,
          cl.cli_nombre,
          i.iga_codigo,
          dt.cuantiaInicial,
          sx.codigoSalida,
          s.cuantiaSalida,
          sx.ndmegreso
    ) AS sub;

  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const datos = [];
  const cantidadActual = {};
  rows.forEach((row, index) => {
    const igaId = row.igaId;

    if (!cantidadActual.hasOwnProperty(igaId)) {
      cantidadActual[igaId] = row.cuantiaInicial;
    }

    const salida = Number(row.cuantiaSalida) || 0;
    const nuevoSaldo = cantidadActual[igaId] - salida;

    datos.push({
      no: index + 1,
      cliente: row.cliente,
      informe: row.informe,
      cuantiaInicial: row.cuantiaInicial,
      salida: row.salida,
      cuantiaActual: cantidadActual[igaId],
      cuantiaSalida: row.cuantiaSalida,
      numeroDM: row.numeroDM,
      lote: row.lote || "",
      fechaIngreso: row.fechaIngreso,
      fechaFiltro: row.fechaFiltro,
      nuevoSaldo,
    });
    cantidadActual[igaId] = nuevoSaldo;
  });

  return { data: datos, total };
}

async function dataAnexo1_5({
  anio = null,
  compania_id = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE i.iga_cac_id NOT IN (5485, 6993)
      AND i.iga_stal_id = 1
      AND i.iga_ubicacion <> 'Externa'
      AND i.iga_estado= 1
      AND i.iga_com_id = ${compania_id}
  `;
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  if (datobusqueda) {
    where += ` AND c.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  if (desde && hasta) {
    where += ` AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'`;
  }

  const sql = `
   SELECT
      nombreCliente,
      nDocumento,
      fechaIngreso,
      fechaAbandono,
      estadoSalida,
      dti,
      codigoProducto,
      descripcionComercial,
      cuantia,
      ROUND(cif, 2) AS cif,
      partida,
      Dias,
      unidad,
      ndmegreso,
      fechaDMegreso,
      codigoSalida,
      cuantiaSalida,
      ROUND(pesoNeto, 2) AS pesoNeto,
      tipoOperacion,
      saldo
    FROM (
      SELECT
        i.iga_id AS idiga,
        c.cli_nombre AS nombreCliente,
        i.iga_codigo AS nDocumento,
        i.iga_fechaingreso AS fechaIngreso,
        i.iga_fechaabandono AS fechaAbandono,
        i.iga_dmti AS dti,
        i.iga_salida AS estadoSalida,
        e.stal_estado AS tipoOperacion,
        DATEDIFF(NOW(), i.iga_fechaingreso) AS Dias
      FROM
      clg_iga_informeguardalmacen i
      INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
      INNER JOIN clg_stal_estadosalmacenaje e ON i.iga_stal_id = e.stal_id
      ${where}
    ) AS iga
    LEFT JOIN (
      SELECT
        d.dga_id AS iddga,
        d.dga_iga_id AS idigafor,
        d.dga_peso AS pesoNeto,
        d.dga_partida_arancelaria AS partida,
        SUBSTRING(d.dga_partida_arancelaria, 1, 2) AS codigoProducto,
        IFNULL(d.dga_cif, 0) AS cif,
        IFNULL(ualm.ualm_unidad, '') AS unidad,
        p.pro_nombre AS descripcionComercial
      FROM
        clg_dga_detallesguardalmacen d
        INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
        LEFT JOIN clg_unidad_almacenaje ualm ON d.dga_ualm_id = ualm.ualm_id
    ) AS dga ON dga.idigafor = iga.idiga
    LEFT JOIN (
      SELECT
        t.tar_dga_id AS iddgafor,
        SUM(t.tar_nbultos) AS saldo,
        SUM(IFNULL(t.tar_salida, 0)) + SUM(t.tar_nbultos) AS cuantia
      FROM
        clg_tar_tarimas t
      GROUP BY t.tar_dga_id
    ) AS tar ON tar.iddgafor = dga.iddga
    LEFT JOIN (
      SELECT
        s.sal_iga_id AS idigasal,
        s.sal_numerodm AS ndmegreso,
        s.sal_fechadm AS fechaDMegreso,
        i.iga_codigo AS nDoc,
        s.sal_fecha AS fechaSalida,
        s.sal_codigo AS codigoSalida,
        s.sal_peso AS peso,
        p.pro_nombre AS descCom,
        dg.dga_peso AS pesoN,
        dg.dga_partida_arancelaria AS part,
        e.stal_estado AS tipoOpe,
        SUM(sd.sald_cantidad) AS cuantiaSalida
      FROM
        clg_sal_salidas s
        INNER JOIN clg_sald_salidadetalles sd ON s.sal_id = sd.sald_sal_id
        INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.sal_iga_id
        INNER JOIN clg_stal_estadosalmacenaje e ON i.iga_stal_id = e.stal_id
        INNER JOIN clg_tar_tarimas t ON t.tar_id = sd.sald_tar_id
        INNER JOIN clg_dga_detallesguardalmacen dg ON dg.dga_id = t.tar_dga_id
        INNER JOIN clg_pro_productos p ON dg.dga_pro_id = p.pro_id
      GROUP BY
        s.sal_iga_id,
        s.sal_numerodm,
        s.sal_fechadm,
        s.sal_fecha,
        s.sal_codigo,
        s.sal_peso,
        p.pro_nombre,
        dg.dga_peso,
        dg.dga_partida_arancelaria,
        e.stal_estado,
        i.iga_codigo
      ) AS sal ON sal.idigasal = iga.idiga AND sal.descCom = dga.descripcionComercial
      WHERE
        Dias > 28
      ORDER BY
        fechaIngreso DESC
        LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT
        nombreCliente,
        nDocumento,
        fechaIngreso,
        fechaAbandono,
        estadoSalida,
        dti,
        codigoProducto,
        descripcionComercial,
        cuantia,
        ROUND(cif, 2) AS cif,
        partida,
        Dias,
        unidad,
        ndmegreso,
        fechaDMegreso,
        codigoSalida,
        cuantiaSalida,
        ROUND(pesoNeto, 2) AS pesoNeto,
        tipoOperacion,
        saldo
      FROM (
        SELECT
          i.iga_id AS idiga,
          c.cli_nombre AS nombreCliente,
          i.iga_codigo AS nDocumento,
          i.iga_fechaingreso AS fechaIngreso,
          i.iga_fechaabandono AS fechaAbandono,
          i.iga_dmti AS dti,
          i.iga_salida AS estadoSalida,
          e.stal_estado AS tipoOperacion,
          DATEDIFF(NOW(), i.iga_fechaingreso) AS Dias
        FROM
          clg_iga_informeguardalmacen i
          INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
          INNER JOIN clg_stal_estadosalmacenaje e ON i.iga_stal_id = e.stal_id
        ${where}
      ) AS iga
      LEFT JOIN (
        SELECT
          d.dga_id AS iddga,
          d.dga_iga_id AS idigafor,
          d.dga_peso AS pesoNeto,
          d.dga_partida_arancelaria AS partida,
          SUBSTRING(d.dga_partida_arancelaria, 1, 2) AS codigoProducto,
          IFNULL(d.dga_cif, 0) AS cif,
          IFNULL(ualm.ualm_unidad, '') AS unidad,
          p.pro_nombre AS descripcionComercial
        FROM
          clg_dga_detallesguardalmacen d
          INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
          LEFT JOIN clg_unidad_almacenaje ualm ON d.dga_ualm_id = ualm.ualm_id
      ) AS dga ON dga.idigafor = iga.idiga
      LEFT JOIN (
        SELECT
          t.tar_dga_id AS iddgafor,
          SUM(t.tar_nbultos) AS saldo,
          SUM(IFNULL(t.tar_salida, 0)) + SUM(t.tar_nbultos) AS cuantia
        FROM
          clg_tar_tarimas t
        GROUP BY t.tar_dga_id
      ) AS tar ON tar.iddgafor = dga.iddga
      LEFT JOIN (
        SELECT
          s.sal_iga_id AS idigasal,
          s.sal_numerodm AS ndmegreso,
          s.sal_fechadm AS fechaDMegreso,
          i.iga_codigo AS nDoc,
          s.sal_fecha AS fechaSalida,
          s.sal_codigo AS codigoSalida,
          s.sal_peso AS peso,
          p.pro_nombre AS descCom,
          dg.dga_peso AS pesoN,
          dg.dga_partida_arancelaria AS part,
          e.stal_estado AS tipoOpe,
          SUM(sd.sald_cantidad) AS cuantiaSalida
        FROM
          clg_sal_salidas s
          INNER JOIN clg_sald_salidadetalles sd ON s.sal_id = sd.sald_sal_id
          INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.sal_iga_id
          INNER JOIN clg_stal_estadosalmacenaje e ON i.iga_stal_id = e.stal_id
          INNER JOIN clg_tar_tarimas t ON t.tar_id = sd.sald_tar_id
          INNER JOIN clg_dga_detallesguardalmacen dg ON dg.dga_id = t.tar_dga_id
          INNER JOIN clg_pro_productos p ON dg.dga_pro_id = p.pro_id
        GROUP BY
          s.sal_iga_id,
          s.sal_numerodm,
          s.sal_fechadm,
          s.sal_fecha,
          s.sal_codigo,
          s.sal_peso,
          p.pro_nombre,
          dg.dga_peso,
          dg.dga_partida_arancelaria,
          e.stal_estado,
          i.iga_codigo
      ) AS sal ON sal.idigasal = iga.idiga AND sal.descCom = dga.descripcionComercial
      WHERE
        Dias > 28
      ORDER BY
        fechaIngreso DESC
        ) AS resultados;

      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_6({
  anio = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  const desde = `1-01-${anio}`;
  const hasta = `31-12-${anio}`;

  let where = `WHERE
    i.iga_estado = 1
    AND i.iga_cac_id NOT IN (5485, 6993)
    AND i.iga_stal_id = 1
    AND DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') BETWEEN '${desde}' AND '${hasta}'
    AND i.iga_ubicacion <> 'Externa'
    AND d.dga_recibidos > 0`;

  if (datobusqueda) {
    where += ` AND cl.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  const sql = `
    SELECT
      i.iga_id AS id,
      cl.cli_nombre AS cliente,
      i.iga_dmti AS dti,
      i.iga_codigo AS informe,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') AS fechaIngreso,
      DATE_FORMAT(i.iga_fechaingreso, '%Y%m%d') AS fechaIngresoOrden,
      DATE_FORMAT(i.iga_fechaabandono, '%d-%m-%Y') AS vencimiento20dias,
      d.dga_partida_arancelaria AS rubroArancelario,
      p.pro_codigo AS codigoProducto,
      p.pro_nombre AS descripcionComercial,
      t.cuantia AS cuantia,
      u.ualm_unidad AS unidad,
      d.dga_peso AS pesoNeto,
      d.dga_fob AS fob,
      d.dga_cif AS cif,
      st.tipoDocumentoSalida AS tipoDocumentoSalida,
      st.noDocumentoSalida AS noDocumentoSalida,
      st.fechaRegistroSalida AS fechaRegistroSalida,
      st.cuantiaSalida AS cuantiaSalida,
      st.pesoSalida AS pesoSalida,
      ss.saldo AS saldo
    FROM
        clg_iga_informeguardalmacen i
        JOIN clg_cad_detalleaceptacion cd ON i.iga_cad_id = cd.cad_id
        JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
        JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
        JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
        LEFT JOIN clg_unidad_almacenaje u ON d.dga_ualm_id = u.ualm_id
        JOIN (
            SELECT
                tar_dga_id AS dgaId,
                SUM(tar_inicial) AS cuantia
            FROM clg_tar_tarimas
            GROUP BY tar_dga_id
        ) t ON d.dga_id = t.dgaId
        LEFT JOIN (
            SELECT
                sd.sald_sal_id AS salId,
                t.tar_dga_id AS dgaId,
                tds.tdocsal_documento AS tipoDocumentoSalida,
                IF(s.sal_numerodm = 'VARIOS', c.sco_declaracion, s.sal_numerodm) AS noDocumentoSalida,
                IF(s.sal_numerodm = 'VARIOS', c.sco_fecha_registro, s.sal_fechadm) AS fechaRegistroSalida,
                SUM(sd.sald_cantidad) AS cuantiaSalida,
                IF(s.sal_numerodm = 'VARIOS', c.sco_peso, s.sal_peso) AS pesoSalida
            FROM
                clg_sald_salidadetalles sd
                JOIN clg_tar_tarimas t ON sd.sald_tar_id = t.tar_id
                JOIN clg_sal_salidas s ON sd.sald_sal_id = s.sal_id
                JOIN clg_tipodocumento_salida tds ON s.sal_tipo_doc = tds.tdocsal_id
                LEFT JOIN clg_sco_salidaconsolidada c ON sd.sald_sco_id = c.sco_id
            GROUP BY t.tar_dga_id, sd.sald_sal_id, c.sco_declaracion, c.sco_fecha_registro, c.sco_peso, s.sal_peso
        ) st ON st.dgaId = d.dga_id
        JOIN (
            SELECT
                SUM(tar_nbultos) AS saldo,
                tar_dga_id AS dgaId
            FROM clg_tar_tarimas
            GROUP BY tar_dga_id
        ) ss ON ss.dgaId = d.dga_id
    ${where}
    ORDER BY i.iga_fechaingreso DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT i.iga_id
      FROM clg_iga_informeguardalmacen i
      JOIN clg_cad_detalleaceptacion cd ON i.iga_cad_id = cd.cad_id
      JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
      JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
      JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      LEFT JOIN clg_unidad_almacenaje u ON d.dga_ualm_id = u.ualm_id
      JOIN (
          SELECT tar_dga_id AS dgaId, SUM(tar_inicial) AS cuantia
          FROM clg_tar_tarimas
          GROUP BY tar_dga_id
      ) t ON d.dga_id = t.dgaId
      LEFT JOIN (
          SELECT
              sd.sald_sal_id AS salId,
              t.tar_dga_id AS dgaId,
              tds.tdocsal_documento AS tipoDocumentoSalida,
              IF(s.sal_numerodm = 'VARIOS', c.sco_declaracion, s.sal_numerodm) AS noDocumentoSalida,
              IF(s.sal_numerodm = 'VARIOS', c.sco_fecha_registro, s.sal_fechadm) AS fechaRegistroSalida,
              SUM(sd.sald_cantidad) AS cuantiaSalida,
              IF(s.sal_numerodm = 'VARIOS', c.sco_peso, s.sal_peso) AS pesoSalida
          FROM clg_sald_salidadetalles sd
          JOIN clg_tar_tarimas t ON sd.sald_tar_id = t.tar_id
          JOIN clg_sal_salidas s ON sd.sald_sal_id = s.sal_id
          JOIN clg_tipodocumento_salida tds ON s.sal_tipo_doc = tds.tdocsal_id
          LEFT JOIN clg_sco_salidaconsolidada c ON sd.sald_sco_id = c.sco_id
          GROUP BY t.tar_dga_id, sd.sald_sal_id, c.sco_declaracion, c.sco_fecha_registro, c.sco_peso, s.sal_peso
      ) st ON st.dgaId = d.dga_id
      JOIN (
          SELECT SUM(tar_nbultos) AS saldo, tar_dga_id AS dgaId
          FROM clg_tar_tarimas
          GROUP BY tar_dga_id
      ) ss ON ss.dgaId = d.dga_id
      ${where}
    ) AS resultados
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_7({
  anio = null,
  datobusqueda = null,
  compania_id = null,
  limit = 50,
  offset = 0,
}) {
  const desde = `1-01-${anio}`;
  const hasta = `31-12-${anio}`;

  let where = `WHERE
    i.iga_estado = 1
    AND i.iga_cac_id NOT IN (5485, 6993)
    AND i.iga_stal_id = 2
    AND DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') BETWEEN '${desde}' AND '${hasta}'
    AND i.iga_ubicacion <> 'Externa'
    AND d.dga_recibidos > 0
    AND i.iga_com_id = ${compania_id}`;

  if (datobusqueda) {
    where += ` AND cl.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  const sql = `
    SELECT
      cl.cli_nombre AS cliente,
      i.iga_codigo AS informe,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') AS fechaIngreso,
      dc.doc_ndocumento AS noRegistroDM,
      DATE_FORMAT(dc.doc_fecha, '%d-%m-%Y') AS fechaRegDM,
      p.pro_codigo AS codigoProducto,
      d.dga_partida_arancelaria AS rubroArancelario,
      p.pro_nombre AS descripcionComercial,
      pa.pai_abreviatura AS paisOrigen,
      t.cuantia,
      u.ualm_unidad AS unidad,
      d.dga_peso_neto AS pesoNeto,
      d.dga_peso AS pesoBruto,
      d.dga_fob AS fob,
      d.dga_cif AS cif,
      MAX(IF(sx.salId IS NULL, '', sx.ndmegreso)) AS registroDM,
      MAX(IF(sx.salId IS NULL, '', sx.fechaDMegreso)) AS fechaRegistroDM,
      SUM(sx.cuantiaSalida) AS cuantiaSalida,
      MAX(IF(sx.salId IS NULL, '', d.dga_peso)) AS pesoBrutoSal,
      MAX(IF(sx.salId IS NULL, '', d.dga_peso_neto)) AS pesoNetoSal,
      (t.cuantia - IFNULL(SUM(sx.cuantiaSalida), 0)) AS saldo
    FROM clg_iga_informeguardalmacen i
    INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
    INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
    INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
    LEFT JOIN clg_doc_documentos dc ON dc.doc_iga_id = i.iga_id
    LEFT JOIN clg_pai_paises pa ON pa.pai_id = dc.doc_pais_origen_id
    LEFT JOIN clg_unidad_almacenaje u ON d.dga_ualm_id = u.ualm_id
    INNER JOIN (
        SELECT tar_dga_id AS dgaId, SUM(ROUND(tar_inicial, 2)) AS cuantia
        FROM clg_tar_tarimas
        GROUP BY tar_dga_id
    ) t ON d.dga_id = t.dgaId
    LEFT JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') AS tipo,
          s.sal_id AS salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) AS igaId,
          s.sal_codigo AS codigoSalida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') AS fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) AS ndmegreso,
          DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') AS fechaDMegreso,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_dti, s.sal_dti) AS dti,
          t.tar_dga_id AS dgaId,
          ROUND(sd.sald_cantidad, 2) AS cuantiaSalida
        FROM clg_sald_salidadetalles sd
        INNER JOIN clg_tar_tarimas t ON sd.sald_tar_id = t.tar_id
        LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_id = sd.sald_sco_id
        INNER JOIN clg_sal_salidas s ON s.sal_id = sd.sald_sal_id
    ) sx ON sx.dgaId = d.dga_id
    ${where}
    GROUP BY
      d.dga_id, dc.doc_ndocumento, dc.doc_fecha, pa.pai_abreviatura
    HAVING
      saldo <> 0
    ORDER BY i.iga_id DESC
      LIMIT ${limit} OFFSET ${offset};
      `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
    SELECT
      cl.cli_nombre AS cliente,
      i.iga_codigo AS informe,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') AS fechaIngreso,
      dc.doc_ndocumento AS noRegistroDM,
      DATE_FORMAT(dc.doc_fecha, '%d-%m-%Y') AS fechaRegDM,
      p.pro_codigo AS codigoProducto,
      d.dga_partida_arancelaria AS rubroArancelario,
      p.pro_nombre AS descripcionComercial,
      pa.pai_abreviatura AS paisOrigen,
      t.cuantia,
      u.ualm_unidad AS unidad,
      d.dga_peso_neto AS pesoNeto,
      d.dga_peso AS pesoBruto,
      d.dga_fob AS fob,
      d.dga_cif AS cif,
      MAX(IF(sx.salId IS NULL, '', sx.ndmegreso)) AS registroDM,
      MAX(IF(sx.salId IS NULL, '', sx.fechaDMegreso)) AS fechaRegistroDM,
      SUM(sx.cuantiaSalida) AS cuantiaSalida,
      MAX(IF(sx.salId IS NULL, '', d.dga_peso)) AS pesoBrutoSal,
      MAX(IF(sx.salId IS NULL, '', d.dga_peso_neto)) AS pesoNetoSal,
      (t.cuantia - IFNULL(SUM(sx.cuantiaSalida), 0)) AS saldo
    FROM clg_iga_informeguardalmacen i
    INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
    INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
    INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
    LEFT JOIN clg_doc_documentos dc ON dc.doc_iga_id = i.iga_id
    LEFT JOIN clg_pai_paises pa ON pa.pai_id = dc.doc_pais_origen_id
    LEFT JOIN clg_unidad_almacenaje u ON d.dga_ualm_id = u.ualm_id
    INNER JOIN (
        SELECT tar_dga_id AS dgaId, SUM(ROUND(tar_inicial, 2)) AS cuantia
        FROM clg_tar_tarimas
        GROUP BY tar_dga_id
    ) t ON d.dga_id = t.dgaId
    LEFT JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') AS tipo,
          s.sal_id AS salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) AS igaId,
          s.sal_codigo AS codigoSalida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') AS fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) AS ndmegreso,
          DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') AS fechaDMegreso,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_dti, s.sal_dti) AS dti,
          t.tar_dga_id AS dgaId,
          ROUND(sd.sald_cantidad, 2) AS cuantiaSalida
        FROM clg_sald_salidadetalles sd
        INNER JOIN clg_tar_tarimas t ON sd.sald_tar_id = t.tar_id
        LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_id = sd.sald_sco_id
        INNER JOIN clg_sal_salidas s ON s.sal_id = sd.sald_sal_id
    ) sx ON sx.dgaId = d.dga_id
    ${where}
    GROUP BY
      d.dga_id, dc.doc_ndocumento, dc.doc_fecha, pa.pai_abreviatura
    HAVING
      saldo <> 0
    ORDER BY
      i.iga_id DESC
      ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_8({
  anio = null,
  datobusqueda = null,
  compania_id = null,
  limit = 50,
  offset = 0,
}) {
  const desde = `1-01-${anio}`;
  const hasta = `31-12-${anio}`;

  let where = `WHERE
      i.iga_estado = 1
      AND i.iga_com_id
    AND DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') BETWEEN '${desde}' AND '${hasta}'
    AND i.iga_com_id = ${compania_id}`;

  if (datobusqueda) {
    where += ` AND c.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  const sql = `
    SELECT
      nombreCliente,
      nDocumento,
      fechaIngreso,
      codigoProducto,
      partida,
      descripcionComercial,
      cuantia,
      pesoNeto,
      dti,
      noInforme
    FROM
      (
        SELECT
          i.iga_id AS idiga,
          c.cli_nombre AS nombreCliente,
          i.iga_codigo AS nDocumento,
          i.iga_fechaingreso AS fechaIngreso,
          i.iga_comentarios AS descripcionComercial,
          i.iga_dmti AS dti,
          ca.cac_numero AS noInforme
        FROM
          clg_iga_informeguardalmacen AS i
          INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
          INNER JOIN clg_cac_aceptacion AS ca ON i.iga_cac_id = ca.cac_id
        ${where}
      ) iga
      LEFT JOIN (
        SELECT
          d.dga_id AS iddga,
          d.dga_iga_id AS idigafor,
          d.dga_peso AS pesoNeto,
          p.pro_codigo AS codigoProducto,
          d.dga_partida_arancelaria AS partida
        FROM
          clg_dga_detallesguardalmacen AS d
          INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
      ) dga ON dga.idigafor = iga.idiga
      LEFT JOIN (
        SELECT
          t.tar_dga_id AS iddgafor,
          IFNULL(SUM(t.tar_salida), 0) + SUM(t.tar_nbultos) AS cuantia
        FROM
          clg_tar_tarimas AS t
          GROUP BY t.tar_dga_id
      ) tar ON tar.iddgafor = dga.iddga
      GROUP BY
        nombreCliente,
        nDocumento,
        fechaIngreso,
        codigoProducto,
        partida,
        descripcionComercial,
        cuantia,
        pesoNeto,
        dti,
        noInforme
      LIMIT ${limit} OFFSET ${offset};
      `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT
      nombreCliente,
      nDocumento,
      fechaIngreso,
      codigoProducto,
      partida,
      descripcionComercial,
      cuantia,
      pesoNeto,
      dti,
      noInforme
    FROM
      (
        SELECT
          i.iga_id AS idiga,
          c.cli_nombre AS nombreCliente,
          i.iga_codigo AS nDocumento,
          i.iga_fechaingreso AS fechaIngreso,
          i.iga_comentarios AS descripcionComercial,
          i.iga_dmti AS dti,
          ca.cac_numero AS noInforme
        FROM
          clg_iga_informeguardalmacen AS i
          INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
          INNER JOIN clg_cac_aceptacion AS ca ON i.iga_cac_id = ca.cac_id
        ${where}
      ) iga
      LEFT JOIN (
        SELECT
          d.dga_id AS iddga,
          d.dga_iga_id AS idigafor,
          d.dga_peso AS pesoNeto,
          p.pro_codigo AS codigoProducto,
          d.dga_partida_arancelaria AS partida
        FROM
          clg_dga_detallesguardalmacen AS d
          INNER JOIN clg_pro_productos AS p ON d.dga_pro_id = p.pro_id
      ) dga ON dga.idigafor = iga.idiga
      LEFT JOIN (
        SELECT
          t.tar_dga_id AS iddgafor,
          IFNULL(SUM(t.tar_salida), 0) + SUM(t.tar_nbultos) AS cuantia
        FROM
          clg_tar_tarimas AS t
          GROUP BY t.tar_dga_id
      ) tar ON tar.iddgafor = dga.iddga
      GROUP BY
        nombreCliente,
        nDocumento,
        fechaIngreso,
        codigoProducto,
        partida,
        descripcionComercial,
        cuantia,
        pesoNeto,
        dti,
        noInforme
      ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_9({
  anio = null,
  datobusqueda = null,
  compania_id = null,
  limit = 50,
  offset = 0,
}) {
  const desde = `${anio}-01-01`;
  const hasta = `${anio}-12-31`;

  let where = `
    WHERE
      i.iga_estado = 1
      AND i.iga_cac_id NOT IN (5485, 6993)
      AND i.iga_com_id = ${compania_id}
      AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'
      AND i.iga_stal_id = 4
  `;

  
  if (datobusqueda) {

    where += ` AND cl.cli_nombre LIKE '%${datobusqueda}%'`;
  }

  const sql = `
    SELECT
      IF(dc.doc_tipoDocumento IS NOT NULL, 'dc', tdt.tdt_abreviatura) tipoDocumentoIngreso,
      IFNULL(dc.doc_tipoDocumento, cad.cad_bl) documentoIngreso,
      IFNULL(dc.doc_ndocumento, 'SN') nfactura,
      cl.cli_nombre nombreCliente,
      i.iga_codigo nDocumento,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaIngreso,
      p.pro_codigo codProducto,
      d.dga_partida_arancelaria partida,
      p.pro_nombre descripcionComercial,
      cu.cuantia cuantia,
      IFNULL(u.ualm_unidad, '') unidad,
      ROUND(d.dga_peso_neto, 2) pesoNeto,
      sx.codigoSalida,
      sx.ndmegreso,
      sx.fechaDMegreso,
      tx.cuantiaSalida,
      sx.dti,
      d.dga_recibidos recibidos,
      sx.fechaSalida,
      (cu.cuantia - IFNULL(tx.cuantiaSalida, 0)) saldo,
      ROUND(d.dga_peso, 2) pesoBruto,
      ROUND(d.dga_cif, 2) cif,
      ROUND(d.dga_fob, 2) fob,
      i.iga_salida AS estadoSalida
    FROM
      clg_iga_informeguardalmacen i
    INNER JOIN clg_cad_detalleaceptacion cad ON cad.cad_id = i.iga_cad_id
    INNER JOIN clg_cac_aceptacion a ON i.iga_cac_id = a.cac_id
    INNER JOIN clg_tdt_tipodoctransporte tdt ON tdt.tdt_id = a.cac_tdt_id
    INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
    LEFT JOIN clg_doc_documentos dc ON dc.doc_iga_id = i.iga_id
    INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
    LEFT JOIN clg_unidad_almacenaje u ON d.dga_ualm_id = u.ualm_id
    INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
    INNER JOIN (
      SELECT SUM(tar_inicial) cuantia, tar_dga_id dgaId
      FROM clg_tar_tarimas
      GROUP BY tar_dga_id
    ) cu ON cu.dgaId = d.dga_id
    LEFT JOIN (
      SELECT
        IF(sc.sco_id IS NULL, 'S', 'C') tipo,
        s.sal_id salId,
        IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
        s.sal_codigo codigoSalida,
        DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
        IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) ndmegreso,
        DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') fechaDMegreso,
        IF(s.sal_numerodm = 'VARIOS', sc.sco_dti, s.sal_dti) dti
      FROM clg_sal_salidas s
      LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
    ) sx ON sx.igaId = i.iga_id
    INNER JOIN (
      SELECT t.tar_dga_id dgaId, SUM(sald_cantidad) cuantiaSalida
      FROM clg_tar_tarimas t
      LEFT JOIN clg_sald_salidadetalles s ON s.sald_tar_id = t.tar_id
      GROUP BY dgaId
    ) tx ON tx.dgaId = d.dga_id
    ${where}
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM clg_iga_informeguardalmacen i
    INNER JOIN clg_cli_clientes cl ON i.iga_cli_id = cl.cli_id
    ${where}
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

async function dataAnexo1_10({
  anio = null,
  compania_id = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  let where = `
    WHERE i.iga_cac_id NOT IN (5485, 6993)
      AND i.iga_stal_id = 3
      AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'
      AND i.iga_estado= 1
      AND i.iga_com_id = ${compania_id}
  `;

  if (datobusqueda) {
    where += ` AND c.cli_nombre LIKE '%${datobusqueda}%'`;
  }


  const sql = `
    SELECT
      c.cli_nombre nombreCliente,
      i.iga_codigo nDocumento,
      DATE_FORMAT(i.iga_fechaingreso, '%d-%m-%Y') fechaIngreso,
      d.dga_partida_arancelaria partida,
      p.pro_nombre descripcionComercial,
      p.pro_codigo codProducto,
      t.tar_id tarId,
      t.tar_inicial cuantia,
      IFNULL(doc.doc_ndocumento, da.cad_bl) ndmingreso,
      sx.docEgreso ndmegreso,
      sx.fechaDocEgreso fechaDMegreso,
      DATE_FORMAT(doc.doc_fecha, '%d-%m-%Y') fechaDMingreso,
      sx.fechaSalida,
      sx.salida codigoSalida,
      sd.sald_cantidad cuantiaSalida,
      ROUND(d.dga_peso_neto, 3) AS pesoNeto,
      ROUND(d.dga_peso, 3) AS pesoBruto,
      ROUND(d.dga_cif, 3) AS cif,
      ROUND(d.dga_fob, 3) AS fob,
      u.ualm_unidad unidad,
      i.iga_salida estadoSalida
    FROM
      clg_dga_detallesguardalmacen d
      INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = d.dga_iga_id
      INNER JOIN clg_cad_detalleaceptacion da ON i.iga_cad_id = da.cad_id
      LEFT JOIN clg_unidad_almacenaje u ON u.ualm_id = d.dga_ualm_id
      INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
      INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
      INNER JOIN clg_sald_salidadetalles sd ON t.tar_id = sd.sald_tar_id
      INNER JOIN (
        SELECT
          IF(sc.sco_id IS NULL, 'S', 'C') tipo,
          s.sal_id salId,
          IF(s.sal_iga_id = 0, sc.sco_iga_id, s.sal_iga_id) igaId,
          s.sal_codigo salida,
          DATE_FORMAT(s.sal_fecha, '%d-%m-%Y') fechaSalida,
          IF(s.sal_numerodm = 'VARIOS', sc.sco_declaracion, s.sal_numerodm) docEgreso,
          DATE_FORMAT(IFNULL(s.sal_fechadm, sc.sco_fecha_registro), '%d-%m-%Y') fechaDocEgreso
        FROM
          clg_sal_salidas s
          LEFT JOIN clg_sco_salidaconsolidada sc ON sc.sco_sal_id = s.sal_id
      ) sx ON sx.salId = sd.sald_sal_id
      AND sx.igaId = i.iga_id
      LEFT JOIN clg_doc_documentos doc ON doc.doc_iga_id = i.iga_id
      ${where}
      ORDER BY
        i.iga_id DESC,
        d.dga_id ASC,
        sald_id ASC
        LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT
      COUNT(*) AS total
    FROM
      clg_dga_detallesguardalmacen d
      INNER JOIN clg_iga_informeguardalmacen i ON i.iga_id = d.dga_iga_id
      INNER JOIN clg_cad_detalleaceptacion da ON i.iga_cad_id = da.cad_id
      LEFT JOIN clg_unidad_almacenaje u ON u.ualm_id = d.dga_ualm_id
      INNER JOIN clg_cli_clientes c ON i.iga_cli_id = c.cli_id
      INNER JOIN clg_pro_productos p ON d.dga_pro_id = p.pro_id
      INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
      INNER JOIN clg_sald_salidadetalles sd ON t.tar_id = sd.sald_tar_id
      LEFT JOIN clg_doc_documentos doc ON doc.doc_iga_id = i.iga_id
    ${where}

  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const datos = [];
  const cantidadActual = {};
  rows.forEach((row, index) => {
    const tarId = row.tarId;

    if (!cantidadActual.hasOwnProperty(tarId)) {
      cantidadActual[tarId] = row.cuantia;
    }

    const salida = Number(row.cuantiaSalida) || 0;
    const nuevoSaldo = cantidadActual[tarId] - salida;

    datos.push({
      no: index + 1,
      cli_nombre : row.nombreCliente,
      iga_codigo : row.nDocumento,
      iga_fechaingreso: row.fechaIngreso,
      dga_partida_arancelaria : row.partida,
      pro_nombre : row.descripcionComercial,
      pro_codigo : row.codProducto,
      tar_id : row.tarId,
      tar_inicial : row.cuantia,
      doc_ndocumento: row.ndmingreso,
      docEgreso : row.ndmegreso,
      fechaDocEgreso : row.fechaDMegreso,
      doc_fecha: row.fechaDMingreso,
      fechaSalida: row.fechaSalida,
      salida : row.codigoSalida,
      sald_cantidad : row.cuantiaSalida,
      dga_peso_neto: row.pesoNeto,
      dga_peso : row.pesoBruto,
      dga_cif: row.cif,
      dga_fob: row.fob,
      ualm_unidad : row.unidad,
      iga_salida : row.estadoSalida,
      nuevoSaldo
    });
    cantidadActual[tarId] = nuevoSaldo;
  });

  return { data: datos, total };
}

async function dataAnexo1_11({
  anio = null,
  datobusqueda = null,
  limit = 50,
  offset = 0,
}) {
  
  let desde = moment(`${anio}-01-01`).format("YYYY-MM-DD HH:mm:ss");
  let hasta = moment(`${anio}-12-31`).format("YYYY-MM-DD HH:mm:ss");

  let where = `
    WHERE s.sal_fecha BETWEEN '${desde}' AND '${hasta}'
  `;

  if (datobusqueda) {
    where += ` AND p.pro_nombre LIKE '%${datobusqueda}%'`;
  }

  const sql = `
    SELECT
        s.sal_id AS id,
        s.sal_codigo AS codigo,
        p.pro_nombre AS descripcion,
        '' AS lote,
        s.sal_fecha,
        date_format(IF(isnull(sc.sco_id), s.sal_fecha_ingreso, sc.sco_fecha_ingreso), '%d-%m-%Y') AS fechaIngreso,
        d.sald_peso AS peso,
        d.sald_volumen AS volumen,
        d.sald_cantidad AS cantidadSalida,
        d.sald_descargo AS DMDescargo,
        s.sal_placa AS placas,
        ifnull(sc.sco_doc_transporte, s.sal_doctransporte) AS documentoTransporte,
        s.sal_pai_id AS destino,
        s.sal_fac_id AS factura,
        ifnull(sc.sco_declaracion, s.sal_numerodm) AS numeroDeclaracion,
        date_format(ifnull(sc.sco_fecha_registro, s.sal_fechadm), '%d-%m-%Y') AS fechaDeclaracion
    FROM
      (
        (
          (
            (
              (clg_sald_salidadetalles d JOIN clg_tar_tarimas t ON ((d.sald_tar_id = t.tar_id)))
              JOIN clg_dga_detallesguardalmacen dg ON ((dg.dga_id = t.tar_dga_id))
            )
            JOIN clg_pro_productos p ON ((dg.dga_pro_id = p.pro_id))
          )
          JOIN clg_sal_salidas s ON ((s.sal_id = d.sald_sal_id))
        )
        LEFT JOIN clg_sco_salidaconsolidada sc ON ((sc.sco_id = d.sald_sco_id))
      )
    ${where}
    ORDER BY
      s.sal_id
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `
    SELECT
      COUNT(*) AS total
    FROM
      (
        (
          (
            (
              (clg_sald_salidadetalles d JOIN clg_tar_tarimas t ON ((d.sald_tar_id = t.tar_id)))
              JOIN clg_dga_detallesguardalmacen dg ON ((dg.dga_id = t.tar_dga_id))
            )
            JOIN clg_pro_productos p ON ((dg.dga_pro_id = p.pro_id))
          )
          JOIN clg_sal_salidas s ON ((s.sal_id = d.sald_sal_id))
        )
        LEFT JOIN clg_sco_salidaconsolidada sc ON ((sc.sco_id = d.sald_sco_id))
      )
    ${where}
    ORDER BY
      s.sal_id
  `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}

module.exports = {
  dataAnexo1_1Ingresos,
  dataAnexo1_1Egresos,
  dataAnexo1_2,
  dataAnexo1_3,
  dataAnexo1_4,
  dataAnexo1_5,
  dataAnexo1_6,
  dataAnexo1_7,
  dataAnexo1_8,
  dataAnexo1_9,
  dataAnexo1_10,
  dataAnexo1_11
};
