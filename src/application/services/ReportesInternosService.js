const db = require("../../database/db");

async function data_Cliente({
  desde,
  hasta,
  consolidador = 0,
  destino = 0,
}) {
  // 0 es igual a "Todos los destinos"
  // 1 es igual a "Destino Nacional"
  // 2 es igual a "Destino Extranjero"
  let condicion = "";
  if (destino == 1) {
    condicion = "AND cad.cada_pais = 26";
  } else if (destino == 2) {
    condicion =
      "AND cad.cada_pais != 26 AND (i.iga_stal_id = 1 OR i.iga_stal_id = 4)";
  }

  let where = `
    WHERE i.iga_estado = 1 AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'
  `;

  if (consolidador == 0) {
    where += condicion;
  } else {
    where += ` AND t.tra_id = ${consolidador}`;
  }


  const sql = `SELECT
				i.iga_fechaingreso ,
                i.iga_codigo ,
                t.tra_nombre ,
                c.cli_nombre ,
                cac.cac_numero ,
                cac.cac_contenedor ,
                p.pai_nombre ,
                ROUND(SUM(d.dga_volumen), 3) AS volumen,
                cad.cad_pai_id ,
                cad.cad_bl ,
                po.pai_nombre AS pais_origen
			FROM
				clg_iga_informeguardalmacen AS i
			INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
			INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
			INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
			INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
			INNER JOIN clg_cad_detalleaceptacion AS cad ON i.iga_cad_id = cad.cad_id
			INNER JOIN clg_pai_paises AS p ON cad.cad_pai_id = p.pai_id
			INNER JOIN clg_pai_paises AS po ON po.pai_id = i.iga_pai_id
			${where}
			GROUP BY
				i.iga_id,t.tra_nombre,cac.cac_numero
			ORDER BY
				i.iga_fechaingreso ASC;
  `;


  const [rows] = await db.query(sql);

  const datos = [];
  let total_nacional = 0;
  let total_extranjero = 0;
  let total_volumen = 0;
  rows.forEach((row, index) => {
    const volumen = parseFloat(row.volumen) || 0;

    const Nacional = row.cad_pai_id == 26;

    let volumen_nacional = 0;
    let volumen_extranjero = 0;

    if (Nacional) {
      volumen_nacional = volumen;
    } else {
      volumen_extranjero = volumen;
    }

    total_nacional += volumen_nacional;
    total_extranjero += volumen_extranjero;
    total_volumen += volumen;

    const fechaIngreso = new Date(row.iga_fechaingreso);
    const dia = String(fechaIngreso.getDate()).padStart(2, "0");
    const mes = String(fechaIngreso.getMonth() + 1).padStart(2, "0");
    const anio = fechaIngreso.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    datos.push({
      index: index + 1,
      cliente: row.cli_nombre,
      consolidador: row.tra_nombre,
      carta_aceptacion: row.cac_numero,
      no_equipo: row.cac_contenedor,
      doctransporte: row.cad_bl,
      informe: row.iga_codigo,
      fecha_ingreso: fechaFormateada,
      volumen: volumen,
      pais_origen: row.pais_origen,
      destino: row.pai_nombre,
      volumen_nacional,
      volumen_extranjero,
      volumen_total: volumen,
    });
  });

  const resumenTotales = {
    total_nacional: parseFloat(total_nacional.toFixed(3)),
    total_extranjero: parseFloat(total_extranjero.toFixed(3)),
    total: parseFloat(total_volumen.toFixed(3)),
  };

  return { data: datos, resumenTotales };
}


async function data_Equipo({
  desde,
  hasta,
  consolidador = null,
  destino = null
}) {
  let condicion = "";
  if (destino == 1) {
    condicion = "AND cad.cada_pais = 26";
  } else if (destino == 2) {
    condicion =
      "AND cad.cada_pais != 26 AND (i.iga_stal_id = 1 OR i.iga_stal_id = 4)";
  }

  let where = `
    WHERE i.iga_estado = 1 AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'
  `;

  if (consolidador == 0) {
    where += ` ${condicion}`;
  } else {
    where += ` AND t.tra_id = ${consolidador}`;
  }


  const sql = `
    SELECT
        i.iga_fechaingreso AS FECHA_INGRESO,
        t.tra_nombre AS CONSOLIDADOR,
        UPPER(cac.cac_tipo_carga) AS Tipo,
        cac.cac_numero AS CARTA_DE_ACEPTACION,
        cac.cac_id AS carta_id,
        cac.cac_contenedor AS NO_EQUIPO,
        ROUND(SUM(d.dga_volumen), 3) AS VOLUMEN,
        COUNT(DISTINCT cad.cad_id) AS Clientes,
        po.pai_nombre AS pais_origen
        FROM
        clg_iga_informeguardalmacen AS i
        INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
        INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
        INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
        INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
        INNER JOIN clg_cad_detalleaceptacion AS cad ON i.iga_cad_id = cad.cad_id
        INNER JOIN clg_pai_paises AS po ON po.pai_id = i.iga_pai_id
    ${where}
    GROUP BY
        i.iga_cac_id,t.tra_nombre,iga_fechaingreso,cac.cac_tipo_carga,cac.cac_numero,po.pai_nombre
    ORDER BY FECHA_INGRESO ASC;
  `;


  const [rows] = await db.query(sql);

  const datos = [];
  let total_volumen = 0;
  let total_clientes = 0;

  rows.forEach((row, index) => {
    const volumen = parseFloat(row.VOLUMEN) || 0;
    total_volumen += volumen;
    total_clientes += parseInt(row.Clientes) || 0;

    const fecha = new Date(row.FECHA_INGRESO);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    datos.push({
      index: index + 1,
      fecha_ingreso: fechaFormateada,
      consolidador: row.CONSOLIDADOR,
      tipo: row.Tipo,
      carta_aceptacion: row.CARTA_DE_ACEPTACION,
      no_equipo: row.NO_EQUIPO,
      volumen: volumen,
      clientes: row.Clientes,
      pais_origen: row.pais_origen,
    });
  });

  const resumenTotales = {
    totalClientes: total_clientes,
    totalVolumen: parseFloat(total_volumen.toFixed(3)),
  };

  return { data: datos, resumenTotales };
}


async function data_consolidador_factura({
  desde,
  hasta,
  consolidador = 0,
  cliente = 0,
  servicio = 0,
}) {
  let where = `
    WHERE f.fac_anulada = 0 AND f.fac_fecha BETWEEN '${desde}' AND '${hasta}'
  `;

  if (consolidador == 0) {
    where += "";
  } else {
    where += ` AND cac.cac_tra_id = ${consolidador}`;
  }

  if (cliente != 0) {
    where += ` AND f.fac_cliente_id = ${cliente}`;
  }

  const sql = `
    SELECT DISTINCT
        f.fact_id,
        c.cli_nombre AS CLIENTE,
        f.fac_cliente_facturar AS F_CLIENTE,
        f.fac_cortfac_id AS tipofactura,
        f.fac_cobro AS cobro,
        f.fac_pagoretenido AS pago_retenido,
        f.fac_ivaretencion AS iva_retencion,
        td.cortfac_tipofactura AS tipoDoc,
        f.fac_cliente_id AS idcliente,
        f.fac_correlativo AS NO_FACTURA,
        f.fac_fecha AS FECHA_FACTURA,
        f.fac_fecha AS fecha,
        f.fac_total AS total,
        f.fac_subtotal AS TOTAl_FACTURA,
        f.fac_iva AS iva,
        i.iga_codigo AS INFORME,
        i.iga_fechaingreso AS FECHA_INGRESO,
        i.iga_volumen AS VOLUMEN,
        cac.cac_numero AS CARTA_DE_ACEPTACION,
        cac.cac_contenedor AS NO_EQUIPO,
        t.tra_nombre AS CONSOLIDADOR
    FROM
        clg_fac_factura f
        INNER JOIN clg_cli_clientes c ON f.fac_cliente_id = c.cli_id
        INNER JOIN clg_cortfac_correlativotipofactura td ON f.fac_cortfac_id = td.cortfac_id
        INNER JOIN clg_iga_informeguardalmacen i ON f.fac_origen_id = i.iga_id
        INNER JOIN clg_cac_aceptacion cac ON i.iga_cac_id = cac.cac_id
        INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
    ${where}
    GROUP BY
        f.fac_correlativo,
        i.iga_codigo,
        c.cli_nombre,
        f.fac_cliente_facturar,
        f.fac_cortfac_id,
        f.fac_cobro,
        f.fac_pagoretenido,
        f.fac_ivaretencion,
        f.fac_cliente_id,
        f.fac_fecha,
        f.fac_total,
        f.fac_subtotal,
        f.fac_iva,
        i.iga_fechaingreso,
        i.iga_volumen,
        cac.cac_numero,
        f.fact_id
    ORDER BY
        f.fact_id DESC
  `;

  const [rows] = await db.query(sql);

  let datos = [];
  let subTotal = 0;
  let total_iva = 0;
  let total_Final = 0;
  let total_pago_retenido = 0;
  let total_iva_retencion = 0;

  rows.forEach((row, index) => {
    const subtotal = parseFloat(row.TOTAl_FACTURA) || 0;
    const iva = parseFloat(row.iva) || 0;
    const iva_retenido = parseFloat(row.iva_retencion) || 0;
    const pago_retenido = parseFloat(row.pago_retenido) || 0;
    const total_final = parseFloat(row.total) || 0;
    subTotal += subtotal;
    total_iva += iva;
    total_iva_retencion += iva_retenido;
    total_Final += total_final;
    total_pago_retenido += pago_retenido;

    const fac_fecha = new Date(row.FECHA_FACTURA);
    const dia = String(fac_fecha.getDate()).padStart(2, "0");
    const mes = String(fac_fecha.getMonth() + 1).padStart(2, "0");
    const anio = fac_fecha.getFullYear();
    const fechaFormateada1 = `${dia}-${mes}-${anio}`;

    const iga_fechaingreso = new Date(row.FECHA_INGRESO);
    const dia1 = String(iga_fechaingreso.getDate()).padStart(2, "0");
    const mes1 = String(iga_fechaingreso.getMonth() + 1).padStart(2, "0");
    const anio1 = iga_fechaingreso.getFullYear();
    const fechaFormateada2 = `${dia1}-${mes1}-${anio1}`;

    datos.push({
      index: index + 1,
      cli_nombre: row.CLIENTE,
      fac_cliente_facturar: row.F_CLIENTE,
      fac_cortfac_id: row.tipofactura,
      fac_cobro: row.cobro,
      fac_pagoretenido: row.pago_retenido,
      fac_ivaretencion: row.iva_retencion,
      cortfac_tipofactura: row.tipoDoc,
      fac_cliente_id: row.idcliente,
      fac_correlativo: row.NO_FACTURA,
      fechaFormateada1,
      fac_total: row.total,
      fac_subtotal: row.TOTAl_FACTURA,
      fac_iva: row.iva,
      iga_codigo: row.INFORME,
      fechaFormateada2,
      iga_volumen: row.VOLUMEN,
      cac_numero: row.CARTA_DE_ACEPTACION,
      cac_contenedor: row.NO_EQUIPO,
      tra_nombre: row.CONSOLIDADOR,
    });
  });

  const resumenTotales = {
    subTotal: parseFloat(subTotal.toFixed(3)),
    total_iva: parseFloat(total_iva.toFixed(3)),
    total_iva_retencion: parseFloat(total_iva_retencion.toFixed(3)),
    total_pago_retenido: parseFloat(total_pago_retenido.toFixed(3)),
    total_Final: parseFloat(total_Final.toFixed(3)),
  };

  return { data: datos, resumenTotales };
}


async function data_consolidador_servicio({
  desde,
  hasta,
  consolidador = 0,
  servicio = 0,
  cliente = 0,
}) {
  let where = `
    WHERE f.fac_anulada = 0 
    AND f.fac_fecha BETWEEN '${desde}' AND '${hasta}' 
    AND ld.lindetfac_id NOT IN (13, 17, 18, 21, 22, 23, 30)
  `;

  if (consolidador != 0 && servicio == 0) {
    where += ` AND cac.cac_tra_id = ${consolidador}`;
  } else if (consolidador == 0 && servicio != 0) {
    where += ` AND df.detfac_lindetfac_id = ${servicio}`;
  } else if (consolidador != 0 && servicio != 0) {
    where += ` AND cac.cac_tra_id = ${consolidador} AND df.detfac_lindetfac_id = ${servicio}`;
  } else {
    where += "";
  }
  if (cliente != 0) {
    where += ` AND f.fac_cliente_id = ${cliente}`;
  }

  const sql = `
    SELECT 
     
      ld.lindetfac_servicios AS SERVICIO,
      i.iga_stal_id AS regimen_id,
      SUM(df.detfac_valor) AS TOTAL_SERVICIO
    FROM
      clg_fac_factura AS f
      LEFT JOIN clg_detfac_detallefactura AS df ON f.fact_id = df.detfac_fac_id
      INNER JOIN clg_lindetfac_lineadetallefactura AS ld ON ld.lindetfac_id = df.detfac_lindetfac_id
      INNER JOIN clg_cli_clientes c ON f.fac_cliente_id = c.cli_id
      INNER JOIN clg_iga_informeguardalmacen AS i ON f.fac_origen_id = i.iga_id
      INNER JOIN clg_stal_estadosalmacenaje AS s ON i.iga_stal_id = s.stal_id
      INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
      INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
    ${where}
    GROUP BY
      ld.lindetfac_servicios, i.iga_stal_id
  `;
  const [rows] = await db.query(sql);

  const serviciosMap = {};
  const resumenTotales = { DT: 0, AT: 0, AS: 0, TOTAL: 0 };

  for (const row of rows) {
    const { SERVICIO, regimen_id, TOTAL_SERVICIO } = row;

    if (!serviciosMap[SERVICIO]) {
      serviciosMap[SERVICIO] = { SERVICIO, DT: 0, AT: 0, AS: 0, TOTAL: 0 };
    }

    const valor = parseFloat(TOTAL_SERVICIO);

    if (regimen_id === 1) {
      serviciosMap[SERVICIO].DT += valor;
      resumenTotales.DT += valor;
    } else if (regimen_id === 2) {
      serviciosMap[SERVICIO].AT += valor;
      resumenTotales.AT += valor;
    } else if (regimen_id === 3) {
      serviciosMap[SERVICIO].AS += valor;
      resumenTotales.AS += valor;
    }

    serviciosMap[SERVICIO].TOTAL += valor;
    resumenTotales.TOTAL += valor;
  }

  for (const servicio of Object.values(serviciosMap)) {
    servicio.DT = parseFloat(servicio.DT.toFixed(3));
    servicio.AT = parseFloat(servicio.AT.toFixed(3));
    servicio.AS = parseFloat(servicio.AS.toFixed(3));
    servicio.TOTAL = parseFloat(servicio.TOTAL.toFixed(3));
  }
  resumenTotales.DT = parseFloat(resumenTotales.DT.toFixed(3));
  resumenTotales.AT = parseFloat(resumenTotales.AT.toFixed(3));
  resumenTotales.AS = parseFloat(resumenTotales.AS.toFixed(3));
  resumenTotales.TOTAL = parseFloat(resumenTotales.TOTAL.toFixed(3));

  const datos = Object.values(serviciosMap);

  return {
    data: datos,
    resumenTotales,
  };
}


async function data_facturageneral_dia({
  desde,
  hasta,
  consolidador = 0,
  cliente = 0,
  servicio = 0,
}) {
  let where = `
    WHERE f.fac_anulada = 0 
    AND f.fac_fecha BETWEEN '${desde}' AND '${hasta}' 
  `;

  const sql = `
    SELECT
        DATE_FORMAT(a.FECHA_FACTURA, '%Y%m%d') Codigo,
        DATE_FORMAT(a.FECHA_FACTURA, '%d-%m-%Y') Dia,
        ROUND(SUM(a.TOTAl_FACTURA), 2) Subtotal,
        ROUND(SUM(a.iva), 2) Iva,
        ROUND(SUM(a.iva_retencion), 2) IvaRetenido,
        ROUND(SUM(a.pago_retenido), 2) PagoRetenido,
        ROUND(SUM(a.total), 2) Total
        FROM
            (
            SELECT DISTINCT
            f.fac_correlativo facturaNumero,
            f.fac_pagoretenido AS pago_retenido,
            f.fac_ivaretencion AS iva_retencion,
            f.fac_fecha AS FECHA_FACTURA,
            f.fac_fecha AS fecha,
            f.fac_total AS total,
            f.fac_subtotal AS TOTAl_FACTURA,
            f.fac_iva AS iva,
            i.iga_fechaingreso AS FECHA_INGRESO
            FROM
            clg_fac_factura f
            INNER JOIN clg_cli_clientes c ON f.fac_cliente_id = c.cli_id
            INNER JOIN clg_cortfac_correlativotipofactura td ON f.fac_cortfac_id = td.cortfac_id
            INNER JOIN clg_iga_informeguardalmacen i ON f.fac_origen_id = i.iga_id
            INNER JOIN clg_cac_aceptacion cac ON i.iga_cac_id = cac.cac_id
            INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
        ${where}
        GROUP BY
            f.fac_correlativo,
            i.iga_codigo,f.fac_ivaretencion,f.fac_pagoretenido,f.fac_fecha,f.fac_total,f.fac_subtotal,f.fac_iva,i.iga_fechaingreso
            ORDER BY
            f.fac_fecha ASC
        ) a
        GROUP BY
            a.FECHA_FACTURA
  `;

  const [rows] = await db.query(sql);

  const columnas = [];
  const filas = [];
  const resumenTotales = {
    Subtotal: 0,
    Iva: 0,
    IvaRetenido: 0,
    PagoRetenido: 0,
    Total: 0,
  };
  for (const row of rows) {
    columnas.push(row.Codigo);
    filas.push({
      Dia: row.Dia,
      Subtotal: parseFloat(row.Subtotal.toFixed(3)),
      Iva: parseFloat(row.Iva.toFixed(3)),
      IvaRetenido: parseFloat(row.IvaRetenido.toFixed(3)),
      PagoRetenido: parseFloat(row.PagoRetenido.toFixed(3)),
      Total: parseFloat(row.Total.toFixed(3)),
    });
    resumenTotales.Subtotal += row.Subtotal;
    resumenTotales.Iva += row.Iva;
    resumenTotales.IvaRetenido += row.IvaRetenido;
    resumenTotales.PagoRetenido += row.PagoRetenido;
    resumenTotales.Total += row.Total;
  }
  resumenTotales.Subtotal = parseFloat(resumenTotales.Subtotal.toFixed(3));
  resumenTotales.Iva = parseFloat(resumenTotales.Iva.toFixed(3));
  resumenTotales.IvaRetenido = parseFloat(
    resumenTotales.IvaRetenido.toFixed(3)
  );
  resumenTotales.PagoRetenido = parseFloat(
    resumenTotales.PagoRetenido.toFixed(3)
  );
  resumenTotales.Total = parseFloat(resumenTotales.Total.toFixed(3));
  const datos = {
    columnas,
    filas,
    dias: rows.length,
  };

  return {
    data: datos,
    resumenTotales,
  };
}


async function data_valores_hoy({
  fecha_desde,
  fecha_hasta,
  cliente = 0,
  bodega = 0,
}) {
  let where = `
    WHERE t.tar_nbultos > 0
        AND i.iga_estado = 1
        AND i.iga_fechaingreso BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
  `;
  if (cliente !== 0) {
    where += ` AND i.iga_cli_id = ${cliente}`;
  }

  if (bodega !== 0) {
    where += ` AND i.iga_ubicacion = '${bodega}'`;
  }

  const sql = `
    SELECT
        s.stal_estado AS Regimen,
        SUM(t.tar_cif_actual) AS Saldocif,
        i.iga_stal_id AS regimen_id
       
    FROM
        clg_iga_informeguardalmacen AS i
        INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
        INNER JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
        INNER JOIN clg_stal_estadosalmacenaje AS s ON i.iga_stal_id = s.stal_id
    ${where}
    GROUP BY
        i.iga_stal_id
  `;

  const [rows] = await db.query(sql);
  const regimenesEsperados = [
    "Depósito Temporal",
    "Admisión Temporal",
    "Almacenaje Simple",
    "Consolidación para la Exportación",
  ];
  const mapaRegimen = {};
  for (const row of rows) {
    mapaRegimen[row.Regimen] = parseFloat(row.Saldocif ?? 0);
  }
  const data = regimenesEsperados.map((regimen) => ({
    REGIMEN: regimen,
    "VALORES USD": `${mapaRegimen[regimen]?.toFixed(2) ?? "0.00"}`,
  }));

  let Totales = 0;
  for (const row of rows) {
    Totales += parseFloat(row.Saldocif);
  }

  const totalValor = regimenesEsperados.reduce(
    (acc, reg) => acc + (mapaRegimen[reg] ?? 0),
    0
  );

  const resumenTotales = {
    totalValor: parseFloat(totalValor.toFixed(3)),
  };

  return {
    data,
    resumenTotales,
  };
}


async function data_valores_promedio_dia({ fecha, bodega = 0, cliente = 0 }) {
  let filtrocliente = `WHERE   
                    i.iga_estado = 1
                     AND ( i.iga_fechaingreso < DATE('${fecha}') AND i.iga_fechaingreso < DATE('${fecha}'))
                     AND sal_fecha > DATE('${fecha}')`;

  if (cliente !== 0) {
    filtrocliente = ` AND i.iga_cli_id = ${cliente}`;
  }
  if (bodega !== 0) {
    filtrocliente += ` AND i.iga_ubicacion = '${bodega}'`;
  }

  const sql = `
        SELECT
            hoy.regimen_id regimenId,
            hoy.Regimen regimen,
            ROUND(hoy.cif - IFNULL(ingresos.cif, 0) + IFNULL(salidas.cif, 0), 2) AS cif


        FROM
            (
                SELECT
                    SUM(t.tar_cif_actual) AS cif,
                    i.iga_stal_id AS regimen_id,
                    s.stal_estado AS Regimen
                FROM
                    clg_iga_informeguardalmacen AS i
                INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
                INNER JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
                INNER JOIN clg_stal_estadosalmacenaje AS s ON i.iga_stal_id = s.stal_id
                WHERE
                    t.tar_nbultos > 0
                AND i.iga_estado = 1 
                GROUP BY
                    i.iga_stal_id
            ) hoy
            LEFT JOIN   (
                            SELECT
                                DATE_FORMAT(MAX(b.fechaIngreso), '%Y-%m-%d') fecha,
                                b.regimen_id,
                                SUM(b.cifCalculado) cif
                            FROM
                                (
                                SELECT
                                    a.*,
                                    ROUND(((a.cif / a.bultosRecibidos) * (a.bultosRecibidos - a.bultosEnSalida)), 2) cifCalculado
                                FROM
                                    (
                                    SELECT
                                        i.iga_fechaingreso fechaIngreso,
                                        i.iga_stal_id regimen_id,
                                        MAX(s.igaId),
                                        dg.dga_id dgaId,
                                        MAX(t.tar_id) tarimaId,
                                        dg.dga_recibidos bultosRecibidos,
                                        SUM(s.salBultos) bultosEnSalida,
                                        dg.dga_cif cif
                                    FROM
                                        (
                                            SELECT
                                                IF(MAX(s.sal_iga_id) = 0, MAX(d.sald_iga_id), MAX(s.sal_iga_id)) igaId,
                                                d.sald_tar_id tarimaId,
                                                SUM(d.sald_cantidad) salBultos
                                            FROM
                                                clg_sal_salidas AS s
                                            INNER JOIN clg_sald_salidadetalles AS d ON s.sal_id = d.sald_sal_id
                                            WHERE
                                                s.sal_fecha < DATE('${fecha}')
                                            GROUP BY
                                                d.sald_tar_id
                                        ) s
                                        INNER JOIN clg_tar_tarimas t ON t.tar_id = s.tarimaId
                                        INNER JOIN clg_dga_detallesguardalmacen dg ON dg.dga_id = t.tar_dga_id
                                        INNER JOIN clg_iga_informeguardalmacen i ON dg.dga_iga_id = i.iga_id
                                        WHERE
                                        i.iga_estado = 1
                                        GROUP BY
                                        dg.dga_id
                                    ) a
                                    WHERE
                                        a.bultosRecibidos > a.bultosEnSalida
                                ) b
                                GROUP BY
                                b.regimen_id
                            ) ingresos ON ingresos.regimen_id = hoy.regimen_id
                            LEFT JOIN (
                                SELECT
                                a.regimenId regimen_id,
                                SUM(a.cifSalida) cif
                                FROM
                                (
                                    SELECT
                                        i.iga_stal_id regimenId,
                                        i.iga_id igaId,
                                        d.dga_id dgaId,
                                        t.tar_id tarId,
                                        s.sal_id salId,
                                        DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') fechaIngreso,
                                        DATE_FORMAT(s.sal_fecha, '%Y-%m-%d') fechaSalida,
                                        d.dga_recibidos bultosRecibidos,
                                        sd.sald_cantidad bultosSalida,
                                        d.dga_cif,
                                        ROUND(((d.dga_cif / d.dga_recibidos) * sd.sald_cantidad), 2) cifSalida
                                    FROM
                                        clg_iga_informeguardalmacen i
                                    INNER JOIN clg_dga_detallesguardalmacen d ON i.iga_id = d.dga_iga_id
                                    INNER JOIN clg_tar_tarimas t ON t.tar_dga_id = d.dga_id
                                    LEFT JOIN clg_sald_salidadetalles sd ON sd.sald_tar_id = t.tar_id
                                    INNER JOIN clg_sal_salidas s ON s.sal_id = sd.sald_sal_id
                                    ${filtrocliente}
                                    ORDER BY
                                        igaId,
                                        dgaId,
                                        tarId ASC
                                ) a
                                GROUP BY
                                a.regimenId
                            ) salidas ON salidas.regimen_id = hoy.regimen_id;
    `;

  const [row] = await db.query(sql);

  return {
    data: row,
  };
}


async function data_Promedio_General({ desde, hasta, consolidador = 0 }) {
  let where = `
    WHERE i.iga_estado = 1 
    AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}' 
    AND i.iga_origen IS NULL
  `;

  if (consolidador != 0) {
    where += ` AND t.tra_id = ${consolidador}`;
  }

  const sqlPrincipal = `
    SELECT
  i.iga_fechaingreso AS FECHA_INGRESO,
  t.tra_nombre AS CONSOLIDADOR,
  UPPER(cac.cac_tipo_carga) AS Tipo,
  cac.cac_numero AS CARTA_DE_ACEPTACION,
  cac.cac_id AS carta_id,
  cac.cac_contenedor AS NO_EQUIPO,
  ROUND(SUM(d.dga_volumen), 3) AS VOLUMEN,
  COUNT(DISTINCT cad.cad_id) AS Clientes,
  po.pai_nombre AS pais_origen
FROM
  clg_iga_informeguardalmacen AS i
  INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
  INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
  INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
  INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
  INNER JOIN clg_cad_detalleaceptacion AS cad ON i.iga_cad_id = cad.cad_id
  INNER JOIN clg_pai_paises AS po ON po.pai_id = i.iga_pai_id
${where}
GROUP BY
  i.iga_cac_id,i.iga_fechaingreso,t.tra_nombre,cac.cac_tipo_carga,cac.cac_numero,po.pai_nombre

ORDER BY
  i.iga_fechaingreso ASC
  

  `;

  const [cartas] = await db.query(sqlPrincipal);
  const nuevoArray = [];
  let volumenTotal = 0;
  let clientesTotal = 0;
  let promedioTotal = 0;
  let index = 1;
  for (const value of cartas) {
    const sqlDetalle = `
        SELECT
            c.cli_nombre AS cliente,
            i.iga_fechaingreso AS fechaIngreso,
            s.sal_codigo AS salida,
            s.sal_fecha AS FechaSalida,
            IFNULL(DATEDIFF(s.sal_fecha, i.iga_fechaingreso), 0) AS dias,
            s.sal_volumen AS volumen
        FROM
            clg_iga_informeguardalmacen i
            INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
            LEFT JOIN clg_sal_salidas AS s ON s.sal_iga_id = i.iga_id
            WHERE
            i.iga_cac_id = ${value.carta_id}
            AND i.iga_estado = 1
            ORDER BY
            i.iga_cad_id ASC
    `;

    const [detalle] = await db.query(sqlDetalle);

    let sumaDias = 0;
    let nClientes = 0;

    for (const row of detalle) {
      if (row.dias > 0) {
        sumaDias += row.dias;
        nClientes++;
      }
    }

    const promedio = nClientes > 0 ? sumaDias / nClientes : 0;

    const fac_fecha = new Date(value.FECHA_INGRESO);
    const dia = String(fac_fecha.getDate()).padStart(2, "0");
    const mes = String(fac_fecha.getMonth() + 1).padStart(2, "0");
    const anio = fac_fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;
    let pro = parseFloat(promedio.toFixed(3));

    if (promedio > 0) {
      volumenTotal += value.VOLUMEN;
      clientesTotal += value.Clientes;
      promedioTotal += pro;
      nuevoArray.push({
        index: index++,
        consolidador: value.CONSOLIDADOR,
        carta: value.CARTA_DE_ACEPTACION,
        equipo: value.NO_EQUIPO,
        fecha_ingreso: fechaFormateada,
        tipo: value.Tipo,
        volumen: value.VOLUMEN,
        clientes: value.Clientes,
        carta_id: value.carta_id,
        promedio: pro,
      });
    }
  }
  const resumenTotales = {
    totalVolumen: parseFloat(volumenTotal.toFixed(3)),
    clientesTotal: parseFloat(clientesTotal.toFixed(3)),
    promedioTotal: parseFloat(promedioTotal.toFixed(3)),
  };

  return {
    data: nuevoArray,
    resumenTotales,
  };
}


async function data_Promedio_Detalle({
  desde = null,
  hasta = null,
  consolidador = 0,
  id_carta,
}) {

  const sql = `
        SELECT
            cac.cac_numero AS CARTA,
            c.cli_nombre AS cliente,
            i.iga_fechaingreso AS fechaIngreso,
            s.sal_codigo AS salida,
            s.sal_fecha AS FechaSalida,
            IFNULL(DATEDIFF(s.sal_fecha, i.iga_fechaingreso), 0) AS dias,
            s.sal_volumen AS volumen
        FROM
            clg_iga_informeguardalmacen i
            INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
            LEFT JOIN clg_sal_salidas AS s ON s.sal_iga_id = i.iga_id
            INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
            WHERE
            i.iga_cac_id = ${id_carta}
            AND i.iga_estado = 1
            ORDER BY
            i.iga_cad_id ASC
  `;

  const [rows] = await db.query(sql);

  const datos = [];
  let promedio = 0;
  let nclientes = 0;

  rows.forEach((row, index) => {
    if (row.dias > 0) {
      promedio += row.dias;
      nclientes++;
    }


    const fecha = new Date(row.fechaIngreso);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    const fecha2 = new Date(row.FechaSalida);
    const dia2 = String(fecha2.getDate()).padStart(2, "0");
    const mes2 = String(fecha2.getMonth() + 1).padStart(2, "0");
    const anio2 = fecha2.getFullYear();
    const fechaFormateada2 = `${dia2}-${mes2}-${anio2}`;

    datos.push({
      index: index + 1,
      CARTA: row.CARTA,
      cliente: row.cliente,
      fecha_ingreso: fechaFormateada,
      FechaSalida: fechaFormateada2,
      no_salida: row.salida,
      dias: row.dias,
    });
  });
  if (promedio > 0) {
    promedio = promedio / nclientes;
  } else {
    promedio = 0;
  }
  const resumenTotales = {
    promedio: parseFloat(promedio.toFixed(3)),
  };

  return { data: datos, resumenTotales };
}


async function data_Cartas({ limit = 50, offset = 0, datobusqueda = null }) {
  let where = ` WHERE a.cac_com_id = 38
          AND a.cac_estado = 1`;
  if (datobusqueda) {
    where += ` AND a.cac_numero = '${datobusqueda}'`;
  }
  const sql = `
        SELECT 
          a.cac_numero AS ncarta,
          a.cac_fecha AS fecha,
          u.usu_nombres AS usuario,
          a.cac_tiempo AS tiempo,
          COUNT(cad.cad_id) AS clientes,
          a.cac_contenedor AS contenedor,
          tr.tra_nombre AS consolidador,
          a.cac_totalcbm AS cbm,
          a.cac_id AS cac_id,
          ad.adu_nombre AS aduingreso,
          u.usu_nombres AS nombre_guardalmacen,
          a.cac_pdf AS archivo,
          a.cac_guardalmacen AS guardalmacen,
          st.est_estado AS estado_ingreso,
          st.est_id AS estado_id,
          a.de_lgx
        FROM clg_cac_aceptacion AS a
        JOIN crm_usuario AS u ON u.usu_id = a.cac_usu_id
        JOIN clg_adu_aduanas AS ad ON ad.adu_id = a.cac_adu_id
        JOIN clg_tra_transportistas AS tr ON tr.tra_id = a.cac_tra_id
        JOIN clg_estado_ingreso AS st ON a.cac_estado_ingreso = st.est_id
        JOIN clg_cad_detalleaceptacion AS cad ON a.cac_id = cad.cad_cac_id
        ${where}
        GROUP BY a.cac_id
        ORDER BY a.cac_id DESC
        LIMIT ${limit} OFFSET ${offset};

  `;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT 
          a.cac_numero AS ncarta,
          a.cac_id
      FROM clg_cac_aceptacion AS a
      JOIN crm_usuario AS u ON u.usu_id = a.cac_usu_id
      JOIN clg_adu_aduanas AS ad ON ad.adu_id = a.cac_adu_id
      JOIN clg_tra_transportistas AS tr ON tr.tra_id = a.cac_tra_id
      JOIN clg_estado_ingreso AS st ON a.cac_estado_ingreso = st.est_id
      JOIN clg_cad_detalleaceptacion AS cad ON a.cac_id = cad.cad_cac_id
      ${where}
      GROUP BY a.cac_id
      ORDER BY a.cac_id DESC
    ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf = row.de_lgx
      ? row.archivo
      : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/" +
      row.archivo;

    const fecha = new Date(row.fecha);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    datos.push({
      index: index + 1,
      CARTA: row.ncarta,
      fecha: fechaFormateada,
      usuario: row.usuario,
      tiempo: row.tiempo,
      clientes: row.clientes,
      contenedor: row.contenedor,
      consolidador: row.consolidador,
      cbm: row.cbm,
      cac_id: row.cac_id,
      aduingreso: row.aduingreso,
      carta_pdf: carta_pdf,
      nombre_guardalmacen: row.nombre_guardalmacen,
      guardalmacen: row.guardalmacen,
      estado_ingreso: row.estado_ingreso,
      estado_id: row.estado_id,
      de_lgx: row.de_lgx,
    });
  });

  return { data: datos, total };
}


async function data_Informes({ limit = 50, offset = 0, datobusqueda = null }) {
  let where = ``;
  if (datobusqueda) {
    where += ` where a.cac_numero = '${datobusqueda}'`;
  }
  const sql = `
        select
            i.iga_id AS id,
            a.cac_numero AS ncarta,
            a.cac_pdf AS archivo_carta,
            a.de_lgx ,
            i.iga_codigo AS informe,
            i.iga_fecha AS fecha,
            concat_ws(' ', u.usu_nombres, u.usu_apellidos) AS usuario,
            c.cli_nombre AS cliente,
            i.iga_tiempo AS tiempo,
            if((i.iga_estado = 1), 'Activo', 'Inactivo') AS estado,
            i.iga_archivo AS archivo_informe
        from
            (((clg_iga_informeguardalmacen i
        join crm_usuario u on
            ((i.iga_usu_id = u.usu_id)))
        join clg_cli_clientes c on
            ((i.iga_cli_id = c.cli_id)))
        join clg_cac_aceptacion a on
            ((i.iga_cac_id = a.cac_id)))
        ${where}
        order by
            i.iga_id desc
        LIMIT ${limit} OFFSET ${offset};

  `;
  const countSql = `
    SELECT COUNT(*) AS total
      FROM (
        select
            
            a.cac_numero AS carta
        from
            (((clg_iga_informeguardalmacen i
        join crm_usuario u on
            ((i.iga_usu_id = u.usu_id)))
        join clg_cli_clientes c on
            ((i.iga_cli_id = c.cli_id)))
        join clg_cac_aceptacion a on
            ((i.iga_cac_id = a.cac_id)))
        ${where}
        order by
            i.iga_id desc
      ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf = row.de_lgx
      ? row.archivo_carta
      : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/" +
      row.archivo_carta;
    let informe_pdf = row.de_lgx
      ? row.archivo_informe
      : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
      row.archivo_informe;

    const fecha = new Date(row.fecha);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    datos.push({
      index: index + 1,
      id: row.id,
      CARTA: row.ncarta,
      carta_pdf: carta_pdf,
      de_lgx: row.de_lgx,
      informe_codigo: row.informe,
      fecha: fechaFormateada,
      usuario: row.usuario,
      cliente: row.cliente,
      tiempo: row.tiempo,
      estado: row.estado,
      informe_pdf: informe_pdf,
    });
  });

  return { data: datos, total };
}


async function data_Informes({ limit = 50, offset = 0, datobusqueda = null }) {
  let where = ``;
  if (datobusqueda) {
    where += ` where a.cac_numero = '${datobusqueda}'`;
  }
  const sql = `
        select
            i.iga_id AS id,
            a.cac_numero AS ncarta,
            a.cac_pdf AS archivo_carta,
            a.de_lgx ,
            i.iga_codigo AS informe,
            i.iga_fecha AS fecha,
            concat_ws(' ', u.usu_nombres, u.usu_apellidos) AS usuario,
            c.cli_nombre AS cliente,
            i.iga_tiempo AS tiempo,
            if((i.iga_estado = 1), 'Activo', 'Inactivo') AS estado,
            i.iga_archivo AS archivo_informe
        from
            (((clg_iga_informeguardalmacen i
        join crm_usuario u on
            ((i.iga_usu_id = u.usu_id)))
        join clg_cli_clientes c on
            ((i.iga_cli_id = c.cli_id)))
        join clg_cac_aceptacion a on
            ((i.iga_cac_id = a.cac_id)))
        ${where}
        order by
            i.iga_id desc
        LIMIT ${limit} OFFSET ${offset};

  `;
  const countSql = `
    SELECT COUNT(*) AS total
      FROM (
        select
            
            a.cac_numero AS carta
        from
            (((clg_iga_informeguardalmacen i
        join crm_usuario u on
            ((i.iga_usu_id = u.usu_id)))
        join clg_cli_clientes c on
            ((i.iga_cli_id = c.cli_id)))
        join clg_cac_aceptacion a on
            ((i.iga_cac_id = a.cac_id)))
        ${where}
        order by
            i.iga_id desc
      ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  const datos = [];

  rows.forEach((row, index) => {
    let carta_pdf = row.de_lgx
      ? row.archivo_carta
      : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/" +
      row.archivo_carta;
    let informe_pdf = row.de_lgx
      ? row.archivo_informe
      : "https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/" +
      row.archivo_informe;

    const fecha = new Date(row.fecha);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    datos.push({
      index: index + 1,
      id: row.id,
      CARTA: row.ncarta,
      carta_pdf: carta_pdf,
      de_lgx: row.de_lgx,
      informe_codigo: row.informe,
      fecha: fechaFormateada,
      usuario: row.usuario,
      cliente: row.cliente,
      tiempo: row.tiempo,
      estado: row.estado,
      informe_pdf: informe_pdf,
    });
  });

  return { data: datos, total };
}


async function resumen_de_ingreso_carga({
  desde = null,
  hasta = null,
  consolidador = 0,
  id_carta,
}) {
  const sql = `
        SELECT
            cac.cac_numero AS CARTA,
            c.cli_nombre AS cliente,
            i.iga_fechaingreso AS fechaIngreso,
            s.sal_codigo AS salida,
            s.sal_fecha AS FechaSalida,
            IFNULL(DATEDIFF(s.sal_fecha, i.iga_fechaingreso), 0) AS dias,
            s.sal_volumen AS volumen
        FROM
            clg_iga_informeguardalmacen i
            INNER JOIN clg_cli_clientes AS c ON i.iga_cli_id = c.cli_id
            LEFT JOIN clg_sal_salidas AS s ON s.sal_iga_id = i.iga_id
            INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
            WHERE
            i.iga_cac_id = ${id_carta}
            AND i.iga_estado = 1
            ORDER BY
            i.iga_cad_id ASC
  `;

  const [rows] = await db.query(sql);

  const datos = [];
  let promedio = 0;
  let nclientes = 0;

  rows.forEach((row, index) => {
    if (row.dias > 0) {
      promedio += row.dias;
      nclientes++;
    }

    const fecha = new Date(row.fechaIngreso);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${anio}`;

    const fecha2 = new Date(row.FechaSalida);
    const dia2 = String(fecha2.getDate()).padStart(2, "0");
    const mes2 = String(fecha2.getMonth() + 1).padStart(2, "0");
    const anio2 = fecha2.getFullYear();
    const fechaFormateada2 = `${dia2}-${mes2}-${anio2}`;

    datos.push({
      index: index + 1,
      CARTA: row.CARTA,
      cliente: row.cliente,
      fecha_ingreso: fechaFormateada,
      FechaSalida: fechaFormateada2,
      no_salida: row.salida,
      dias: row.dias,
    });
  });
  if (promedio > 0) {
    promedio = promedio / nclientes;
  } else {
    promedio = 0;
  }
  const resumenTotales = {
    promedio: parseFloat(promedio.toFixed(3)),
  };

  return { data: datos, resumenTotales };
}


async function datos_extra_Facturacion_consolidado({
  desde,
  hasta,
  datobusqueda = null,
}) {
  let where = `WHERE l.lindetfac_id in (3) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'`;

  if (datobusqueda) {
    where += ` AND transportista like '%${datobusqueda}%'`;
  }
  const sql = `
        SELECT transportista , ROUND(SUM(seguro),2) seguro 
        FROM (
          SELECT 
            t.tra_nombre transportista, 
            i.iga_codigo informe, 
            fecha, 
            tipo, 
            factura, 
            cif, 
            subtotal, 
            ROUND(((subtotal/dias) * diasExtras),2) seguro, 
            dias, 
            diasExtras 
          FROM (
            SELECT
              f.fac_origen_id igaId,
              DATE_FORMAT(f.fac_fecha,'%Y-%m-%d') fecha,
              t.cortfac_tipofactura tipo,
              d.detfac_dias dias,
              d.detfac_dias_extras diasExtras,
              f.fac_correlativo factura,
              f.fac_fecha_creacion creacion,
              d.detfac_cif cif,
              d.detfac_valor subtotal
            FROM clg_fac_factura f
            INNER JOIN clg_detfac_detallefactura d on f.fact_id = d.detfac_fac_id
            INNER JOIN clg_lindetfac_lineadetallefactura l on d.detfac_lindetfac_id = l.lindetfac_id
            INNER JOIN clg_cortfac_correlativotipofactura t on t.cortfac_id = f.fac_cortfac_id
            ${where}
          ) a
          INNER JOIN clg_iga_informeguardalmacen i on a.igaId = i.iga_id
          INNER JOIN clg_cac_aceptacion c on c.cac_id = i.iga_cac_id
          INNER JOIN clg_tra_transportistas t on t.tra_id=c.cac_tra_id
        )b
        WHERE seguro > 0 AND seguro IS NOT NULL
        GROUP BY transportista
        ORDER BY seguro DESC    
  `;
  const sql2 = `
        SELECT ROUND(SUM(seguro),2) seguro 
        FROM (
            SELECT 
              fecha, 
              tipo, 
              factura, 
              cliente, 
              cif, 
              subtotal, 
              ROUND(((subtotal/dias) * diasExtras),2) seguro, 
              dias, 
              diasExtras 
            FROM (
              SELECT
                DATE_FORMAT(f.fac_fecha,'%Y-%m-%d') fecha,
                t.cortfac_tipofactura tipo,
                f.fac_cliente_facturar cliente,
                d.detfac_dias dias,
                d.detfac_dias_extras diasExtras,
                f.fac_correlativo factura,
                f.fac_fecha_creacion creacion,
                d.detfac_cif cif,
                d.detfac_valor subtotal
              FROM clg_fac_factura f
              INNER JOIN clg_detfac_detallefactura d on f.fact_id = d.detfac_fac_id
              INNER JOIN clg_lindetfac_lineadetallefactura l on d.detfac_lindetfac_id = l.lindetfac_id
              INNER JOIN clg_cortfac_correlativotipofactura t on t.cortfac_id = f.fac_cortfac_id
              WHERE l.lindetfac_id in (3) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'
            ) a
        )b
        WHERE seguro > 0 AND seguro IS NOT NULL
        ORDER BY fecha ASC   
  `;
  const sql3 = `
        SELECT SUM(cobroExtra) cbmExtra from (
        SELECT
          ROUND(((d.detfac_cbm - f.fac_cbm) * d.detfac_precio), 2) cobroExtra
        FROM clg_fac_factura f
        INNER JOIN clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        INNER JOIN clg_lindetfac_lineadetallefactura l ON d.detfac_lindetfac_id = l.lindetfac_id
        WHERE l.lindetfac_id in (1) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'
            AND d.detfac_precio BETWEEN 6 AND 12
          ORDER BY cobroExtra ASC
        ) a
        WHERE cobroExtra > 0
  `;
  let sql4 = ``;
  if (hasta <= "2022-02-28") {
    sql4 += `
        SELECT
          ROUND((SUM(d.detfac_valor) / 110) * 10, 2) porcentaje
        FROM clg_fac_factura f
        inner join clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        where 
        fac_10adicional = 'si' 
        and fac_anulada = 0 
        AND fac_fecha BETWEEN '${desde}' AND '${hasta}'
    `;
  } else if (desde >= "2022-03-01") {
    sql4 += `
        SELECT
          ROUND((SUM(d.detfac_valor) / 112) * 12, 2) porcentaje
        FROM clg_fac_factura f
        inner join clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        where fac_10adicional = 'si' 
        and fac_anulada = 0 
        AND detfac_lindetfac_id = 1 
        AND fac_fecha BETWEEN '${desde}' AND '${hasta}'
  `;
  }

  const [datos_consolidador] = await db.query(sql);
  const [seguro_extra] = await db.query(sql2);
  const [cbmExtra] = await db.query(sql3);
  const [porcentajeDiez] = await db.query(sql4);

  const seguro = Number(seguro_extra?.[0]?.seguro ?? 0);
  const cbm = Number(cbmExtra?.[0]?.cbmExtra ?? 0);
  const porcentaje = Number(porcentajeDiez?.[0]?.porcentaje ?? 0);

  const total = Number((seguro + cbm + porcentaje).toFixed(2));

  let resumenTotales = {
    seguro_extra,
    cbmExtra,
    porcentajeDiez: porcentajeDiez?.[0]?.porcentaje ?? 0,
    total
  };

  return { data: datos_consolidador, resumenTotales };
}


async function datos_extra_Facturacion_cliente({
  desde,
  hasta,
  datobusqueda = null,
}) {
  let where = `WHERE l.lindetfac_id in (3) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'`;

  if (datobusqueda) {
    where += ` AND cliente like '%${datobusqueda}%'`;
  }
  const sql = `
        SELECT 
          cliente, 
          ROUND(SUM(seguro), 2) AS seguro,
          clienteId
        FROM (
          SELECT 
            fecha, 
            tipo, 
            factura, 
            clienteId, 
            cliente, 
            cif, 
            subtotal, 
            ROUND(((subtotal / dias) * diasExtras), 2) AS seguro, 
            dias, 
            diasExtras 
          FROM (
            SELECT
              DATE_FORMAT(f.fac_fecha, '%Y-%m-%d') AS fecha,
              t.cortfac_tipofactura AS tipo,
              f.fac_cliente_id AS clienteId,
              f.fac_cliente_facturar AS cliente,
              d.detfac_dias AS dias,
              d.detfac_dias_extras AS diasExtras,
              f.fac_correlativo AS factura,
              f.fac_fecha_creacion AS creacion,
              d.detfac_cif AS cif,
              d.detfac_valor AS subtotal
            FROM clg_fac_factura f
            INNER JOIN clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
            INNER JOIN clg_lindetfac_lineadetallefactura l ON d.detfac_lindetfac_id = l.lindetfac_id
            INNER JOIN clg_cortfac_correlativotipofactura t ON t.cortfac_id = f.fac_cortfac_id
            ${where}
          ) a
          ) b
          WHERE seguro > 0 AND seguro IS NOT NULL
          GROUP BY clienteId, cliente
          ORDER BY seguro DESC;

  `;
  const sql2 = `
        SELECT ROUND(SUM(seguro),2) seguro 
        FROM (
            SELECT 
              fecha, 
              tipo, 
              factura, 
              cliente, 
              cif, 
              subtotal, 
              ROUND(((subtotal/dias) * diasExtras),2) seguro, 
              dias, 
              diasExtras 
            FROM (
              SELECT
                DATE_FORMAT(f.fac_fecha,'%Y-%m-%d') fecha,
                t.cortfac_tipofactura tipo,
                f.fac_cliente_facturar cliente,
                d.detfac_dias dias,
                d.detfac_dias_extras diasExtras,
                f.fac_correlativo factura,
                f.fac_fecha_creacion creacion,
                d.detfac_cif cif,
                d.detfac_valor subtotal
              FROM clg_fac_factura f
              INNER JOIN clg_detfac_detallefactura d on f.fact_id = d.detfac_fac_id
              INNER JOIN clg_lindetfac_lineadetallefactura l on d.detfac_lindetfac_id = l.lindetfac_id
              INNER JOIN clg_cortfac_correlativotipofactura t on t.cortfac_id = f.fac_cortfac_id
              WHERE l.lindetfac_id in (3) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'
            ) a
        )b
        WHERE seguro > 0 AND seguro IS NOT NULL
        ORDER BY fecha ASC   
  `;
  const sql3 = `
        SELECT SUM(cobroExtra) cbmExtra from (
        SELECT
          ROUND(((d.detfac_cbm - f.fac_cbm) * d.detfac_precio), 2) cobroExtra
        FROM clg_fac_factura f
        INNER JOIN clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        INNER JOIN clg_lindetfac_lineadetallefactura l ON d.detfac_lindetfac_id = l.lindetfac_id
        WHERE l.lindetfac_id in (1) and f.fac_anulada = 0 and fac_fecha BETWEEN '${desde}' AND '${hasta}'
            AND d.detfac_precio BETWEEN 6 AND 12
          ORDER BY cobroExtra ASC
        ) a
        WHERE cobroExtra > 0
  `;
  let sql4 = ``;
  if (hasta <= "2022-02-28") {
    sql4 += `
        SELECT
          ROUND((SUM(d.detfac_valor) / 110) * 10, 2) porcentaje
        FROM clg_fac_factura f
        inner join clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        where 
        fac_10adicional = 'si' 
        and fac_anulada = 0 
        AND fac_fecha BETWEEN '${desde}' AND '${hasta}'
    `;
  } else if (desde >= "2022-03-01") {
    sql4 += `
        SELECT
          ROUND((SUM(d.detfac_valor) / 112) * 12, 2) porcentaje
        FROM clg_fac_factura f
        inner join clg_detfac_detallefactura d ON f.fact_id = d.detfac_fac_id
        where fac_10adicional = 'si' 
        and fac_anulada = 0 
        AND detfac_lindetfac_id = 1 
        AND fac_fecha BETWEEN '${desde}' AND '${hasta}'
  `;
  }

  const [datos_consolidador] = await db.query(sql);
  const [seguro_extra] = await db.query(sql2);
  const [cbmExtra] = await db.query(sql3);
  const [porcentajeDiez] = await db.query(sql4);

  const seguro = Number(seguro_extra?.[0]?.seguro ?? 0);
  const cbm = Number(cbmExtra?.[0]?.cbmExtra ?? 0);
  const porcentaje = Number(porcentajeDiez?.[0]?.porcentaje ?? 0);

  const total = Number((seguro + cbm + porcentaje).toFixed(2));

  let resumenTotales = {
    seguro_extra,
    cbmExtra,
    porcentajeDiez: porcentajeDiez?.[0]?.porcentaje ?? 0,
    total
  };

  return { data: datos_consolidador, resumenTotales };
}


async function datos_comisiones_consolidador({ desde, hasta }) {
  let sql = `
      SELECT
				transportistaId,
				consolidador,
				ROUND(SUM(IF(destino = 26, volumen, 0)), 3) nacional,
				ROUND(SUM(IF(destino <> 26, volumen, 0)), 3) extranjero,
				ROUND(SUM(volumen), 3) total,
				comision,
				tipoCobro,
				IF(transportistaId = 33 OR transportistaId = 106, ROUND(SUM(IF(destino = 26, volumen, 0)), 3), ROUND(SUM(volumen), 3)) volTransaccion
			FROM (
				SELECT
					t.tra_id transportistaId,
					t.tra_nombre AS consolidador,
					ROUND( SUM( d.dga_volumen ), 3 ) volumen,
					cad.cad_pai_id destino,
					IF(cc.cco_id IS NULL, 0, cc.cco_comision) comision,
					IF(cc.cco_id IS NULL, '', cc.cco_tipo_cobro) tipoCobro
				FROM
					clg_iga_informeguardalmacen AS i
					INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
					INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
					INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
					INNER JOIN clg_cad_detalleaceptacion AS cad ON i.iga_cad_id = cad.cad_id
					INNER JOIN clg_pai_paises AS p ON cad.cad_pai_id = p.pai_id
					LEFT JOIN clg_cco_contratoconsolidador cc ON cc.cco_tra_id = t.tra_id
				WHERE
					i.iga_estado = 1 AND t.tra_id = 106 AND i.iga_pai_id = 8
					AND i.iga_fechaingreso BETWEEN '${desde}'	AND '${hasta}'
				GROUP BY
					i.iga_id,cc.cco_id
			) a
			WHERE a.tipoCobro <> 'S'
			GROUP BY transportistaId, comision, tipoCobro
      ORDER BY volTransaccion DESC
  `;
  let sql2 = `
        SELECT
          transportistaId,
          consolidador,
          ROUND(SUM(IF(destino = 26, volumen, 0)), 3) nacional,
          ROUND(SUM(IF(destino <> 26, volumen, 0)), 3) extranjero,
          ROUND(SUM(volumen), 3) total,
          comision,
          tipoCobro,
          IF(transportistaId = 33 OR transportistaId = 106, ROUND(SUM(IF(destino = 26, volumen, 0)), 3), ROUND(SUM(volumen), 3)) volTransaccion
        FROM (
          SELECT
            t.tra_id transportistaId,
            t.tra_nombre AS consolidador,
            ROUND( SUM( d.dga_volumen ), 3 ) volumen,
            cad.cad_pai_id destino,
            IF(cc.cco_id IS NULL, 0, cc.cco_comision) comision,
            IF(cc.cco_id IS NULL, '', cc.cco_tipo_cobro) tipoCobro
          FROM
          clg_iga_informeguardalmacen AS i
          INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
          INNER JOIN clg_cac_aceptacion AS cac ON i.iga_cac_id = cac.cac_id
          INNER JOIN clg_tra_transportistas AS t ON cac.cac_tra_id = t.tra_id
          INNER JOIN clg_cad_detalleaceptacion AS cad ON i.iga_cad_id = cad.cad_id
          INNER JOIN clg_pai_paises AS p ON cad.cad_pai_id = p.pai_id
          LEFT JOIN clg_cco_contratoconsolidador cc ON cc.cco_tra_id = t.tra_id
        WHERE
          i.iga_estado = 1
        AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'
        GROUP BY
          t.tra_id, i.iga_id,cc.cco_id
      ) a
      WHERE a.tipoCobro <> 'S'
      GROUP BY transportistaId,comision,tipoCobro ORDER BY volTransaccion DESC
  `;
  let sql3 = `
        SELECT
          t.tra_id transportistaId,
          t.tra_nombre consolidador,
          ROUND(SUM(IF(cd.cad_pai_id = 26, s.volumen, 0)), 3) nacional,
          ROUND(SUM(IF(cd.cad_pai_id <> 26, s.volumen, 0)), 3) extranjero,
          ROUND(SUM(s.volumen),3) total,
          ct.cco_comision comision,
          ct.cco_tipo_cobro tipoCobro,
          ROUND(SUM(s.volumen),3) volTransaccion,
          ROUND(ROUND(SUM(s.volumen),3) * ct.cco_comision, 2) comisionAPagar
        FROM clg_cac_aceptacion ca
        INNER JOIN clg_tra_transportistas t ON t.tra_id = ca.cac_tra_id
        INNER JOIN clg_cco_contratoconsolidador ct ON ct.cco_tra_id = t.tra_id
        INNER JOIN clg_cad_detalleaceptacion cd ON ca.cac_id = cd.cad_cac_id
        INNER JOIN clg_iga_informeguardalmacen i ON cd.cad_id = i.iga_cad_id
        INNER JOIN (
            SELECT
              s.sal_id,
              s.sal_codigo,
              IF(sal_iga_id = 0,sco_iga_id, sal_iga_id) iga,
              IF(c.sco_id IS NULL,'Simple', 'Consolidada') tipo,
              IF(c.sco_id IS NULL,s.sal_volumen, c.sco_volumen) volumen,
              DATE_FORMAT(s.sal_fecha,'%Y-%m-%d') fecha
          FROM clg_sald_salidadetalles d
          INNER JOIN clg_sal_salidas s ON d.sald_sal_id = s.sal_id
          LEFT JOIN clg_sco_salidaconsolidada c ON d.sald_sco_id = c.sco_id
        ) s ON s.iga = i.iga_id
      WHERE ct.cco_tipo_cobro = 'S' AND s.fecha BETWEEN '${desde}' AND '${hasta}'
      GROUP BY t.tra_id,ct.cco_comision
      ORDER BY volTransaccion DESC
  `;

  let sql4 = `
        SELECT
          ca.cac_numero carta,
          cl.cli_nombre cliente,
          ROUND(SUM(IF(cd.cad_pai_id = 26, s.volumen, 0)), 3) nacional,
          ROUND(SUM(IF(cd.cad_pai_id <> 26, s.volumen, 0)), 3) extranjero,
          ROUND(SUM(s.volumen),3) total,
          IF(cte.cte_tarifa IS NULL,ROUND(ct.cco_comision,2), ct.cco_comision-(12-cte.cte_tarifa)) comision,
          ROUND(SUM(s.volumen),3) volTransaccion,
          ROUND(ROUND(SUM(s.volumen),3) * ct.cco_comision, 2) comisionAPagar
        FROM clg_cac_aceptacion ca
        INNER JOIN clg_tra_transportistas t ON t.tra_id = ca.cac_tra_id
        INNER JOIN clg_cco_contratoconsolidador ct ON ct.cco_tra_id = t.tra_id
        INNER JOIN clg_cad_detalleaceptacion cd ON ca.cac_id = cd.cad_cac_id
        INNER JOIN clg_iga_informeguardalmacen i ON cd.cad_id = i.iga_cad_id
        INNER JOIN clg_cli_clientes cl ON cl.cli_id = i.iga_cli_id
        LEFT JOIN clg_cte_clientes_tarifa_especial cte ON cte.cte_tra_id = t.tra_id AND cl.cli_id = cte.cte_cli_id
        INNER JOIN (
            SELECT
              s.sal_id,
              s.sal_codigo,
              IF(sal_iga_id = 0,sco_iga_id, sal_iga_id) iga,
              IF(c.sco_id IS NULL,'Simple', 'Consolidada') tipo,
              IF(c.sco_id IS NULL,s.sal_volumen, c.sco_volumen) volumen,
              DATE_FORMAT(s.sal_fecha,'%Y-%m-%d') fecha
          FROM clg_sald_salidadetalles d
          INNER JOIN clg_sal_salidas s ON d.sald_sal_id = s.sal_id
          LEFT JOIN clg_sco_salidaconsolidada c ON d.sald_sco_id = c.sco_id
        ) s ON s.iga = i.iga_id
        WHERE t.tra_id = 244 AND ct.cco_tipo_cobro = 'S' AND s.fecha BETWEEN '${desde}' AND '${hasta}'
        GROUP BY s.sal_id,ca.cac_numero,cl.cli_nombre,cte.cte_tarifa,ct.cco_comision
        ORDER BY ca.cac_numero, volTransaccion DESC
    `;

  const [oceanicaCostaRica] = await db.query(sql);
  const [porIngreso] = await db.query(sql2);
  const [porSalida] = await db.query(sql3);
  const [sari] = await db.query(sql4);
  // Asegura que oceanicaCostaRica tenga datos válidos
  const nacionalExtra = oceanicaCostaRica[0]?.nacional || 0;

  // Convertimos porIngreso
  const ingreso = porIngreso.map((value) => {
    let nombre = value.consolidador;
    let volumen = 0;
    let comision = 0;

    switch (value.transportistaId) {
      case 33:
        volumen = value.nacional;
        comision = parseFloat((value.nacional * value.comision).toFixed(2));
        break;

      case 106:
        volumen = value.nacional;
        comision = parseFloat(
          (value.nacional * value.comision + nacionalExtra * 2).toFixed(2)
        );
        break;

      default:
        volumen = value.volTransaccion;
        comision = parseFloat(
          (value.volTransaccion * value.comision).toFixed(2)
        );
        break;
    }

    return { nombre, volumen, comision };
  });
  let resume_sari = 0;
  let datos_sari = sari.map((value) => {
    let carta = value.carta;
    let cliente = value.cliente;
    let nacional = value.nacional;
    let extranjero = value.extranjero;
    let total = value.total;
    let comision = value.comision;
    let volTransaccion = value.volTransaccion;
    let comisionAPagar = value.comisionAPagar;
    resume_sari += parseFloat(parseFloat(comisionAPagar).toFixed(3));

    return {
      carta,
      cliente,
      nacional,
      extranjero,
      total,
      comision,
      volTransaccion,
      comisionAPagar,
    };
  });

  let datos = {
    ingreso,
    salida: porSalida,
    datos_sari,
  };

  return { data: datos, resumenTotales: resume_sari };
}


async function datos_ingreso_salida({ desde, hasta }) {
  const sql = `
        select 
          /*DATE_FORMAT(i.iga_fechaingreso,'%Y%m') ingreso,*/
          ROW_NUMBER() OVER (ORDER BY i.iga_fechaingreso) AS n,
          i.iga_codigo informe, 
          c.cli_nombre cliente, 
          DATE_FORMAT(i.iga_fechaingreso,'%d-%m-%Y') fechaIngreso, 
          ROUND(t.tar_vol_inicial, 3) CBM 
          -- ROUND(SUM(t.tar_vol_inicial), 3) CBM 
        from clg_iga_informeguardalmacen i 
        INNER JOIN clg_dga_detallesguardalmacen d on i.iga_id = d.dga_iga_id
        inner join clg_tar_tarimas t on d.dga_id = t.tar_dga_id
        inner join clg_cli_clientes c on c.cli_id = i.iga_cli_id
        where i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}' and i.iga_estado = 1;
  `;
  const sql2 = `
        select 
          /*DATE_FORMAT(s.sal_fecha,'%Y%m') fecha,*/
          ROW_NUMBER() OVER (ORDER BY s.sal_codigo) AS n,
          s.sal_codigo salida, 
          c.cli_nombre cliente,
          DATE_FORMAT(s.sal_fecha,'%d-%m-%Y') fechaSalida, 
          ROUND(d.sald_volumen, 3) CBM 
          -- ROUND(SUM(d.sald_volumen), 3) CBM 
        from clg_sal_salidas s 
        inner join clg_sald_salidadetalles d on s.sal_id = d.sald_sal_id
        inner join clg_cli_clientes c on c.cli_id = s.sal_cli_id
        where s.sal_fecha BETWEEN '${desde}' AND '${hasta}'
  `;

  const [ingreso] = await db.query(sql);
  const [salida] = await db.query(sql2);

  const datos = {
    ingreso,
    salida,
  };

  return { data: datos };
}


async function datos_historico_cliente({ desde, hasta, cliente }) {
  const sql = `
    SELECT
      i.*,
      SUM(d.dga_recibidos) AS bultosIniciales,
      ROUND(SUM(d.dga_peso), 3) AS pesoInicial,
      ROUND(SUM(d.dga_volumen), 3) AS volumenInicial
    FROM (
      SELECT
        i.iga_id AS igaId,
        c.cac_numero AS carta,
        i.iga_codigo AS informe,
        DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') AS fechaIngreso,
        i.iga_fechaingreso,
        IFNULL(DATE_FORMAT(MIN(s.fechaSalida), '%Y-%m-%d'), '0000-00-00') AS fechaPrimeraSalida,
        IFNULL(DATE_FORMAT(MAX(s.fechaSalida), '%Y-%m-%d'), '0000-00-00') AS fechaUltimaSalida
      FROM (
        SELECT
            s.sal_codigo AS salida,
            IF(s.sal_iga_id = 0, d.sald_iga_id, s.sal_iga_id) AS igaId,
            s.sal_fecha AS fechaSalida
        FROM clg_sal_salidas s
        INNER JOIN clg_sald_salidadetalles d ON s.sal_id = d.sald_sal_id
      ) s
      RIGHT JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.igaId
      RIGHT JOIN clg_cac_aceptacion c ON c.cac_id = i.iga_cac_id
      WHERE i.iga_cli_id = '${cliente}' AND i.iga_estado = 1
      GROUP BY
        i.iga_id,
        c.cac_numero,
        i.iga_codigo,
        i.iga_fechaingreso
    ) i
    INNER JOIN clg_dga_detallesguardalmacen d ON i.igaId = d.dga_iga_id
    WHERE ('${hasta}' < i.fechaPrimeraSalida OR i.fechaPrimeraSalida = '0000-00-00')
      AND '${hasta}' >= i.fechaIngreso
    GROUP BY
        i.igaId,
        i.carta,
        i.informe,
        i.fechaIngreso,
        i.iga_fechaingreso,
        i.fechaPrimeraSalida,
        i.fechaUltimaSalida
    ORDER BY i.iga_fechaingreso DESC;
  `;
  const [ingresos_sin_salidas] = await db.query(sql);

  const sql2 = `
    SELECT
      x.*,
      IF(x.bultosSalida = x.bultosIniciales,IF(x.fechaUltimaSalida BETWEEN '${desde}' AND '${hasta}','Finiquitado','Antiguo'),'Parcial') estado
    FROM (
      SELECT
        i.*,
        SUM(d.dga_recibidos) bultosIniciales,
        ROUND(SUM(d.dga_peso),3) pesoInicial,
        ROUND(SUM(d.dga_volumen),3) volumenInicial
      FROM (
        SELECT
          i.iga_id igaId,
          c.cac_numero carta,
          i.iga_codigo informe,
          i.iga_comentarios comentarios,
          DATE_FORMAT(i.iga_fechaingreso,'%Y-%m-%d') fechaIngreso,
          IFNULL(DATE_FORMAT(MIN(s.fechaSalida),'%Y-%m-%d'),'0000-00-00') fechaPrimeraSalida,
          IFNULL(DATE_FORMAT(MAX(s.fechaSalida),'%Y-%m-%d'),'0000-00-00') fechaUltimaSalida,
          SUM(s.bultos) bultosSalida
        FROM (
          SELECT
            s.sal_codigo salida,
            IF(s.sal_iga_id = 0,d.sald_iga_id,s.sal_iga_id) igaId,
            s.sal_fecha fechaSalida,
            d.sald_cantidad bultos
          FROM clg_sal_salidas s
          INNER JOIN clg_sald_salidadetalles d ON s.sal_id = d.sald_sal_id
          WHERE DATE_FORMAT(s.sal_fecha,'%Y-%m-%d') <= '${hasta}'
        ) s
        RIGHT JOIN clg_iga_informeguardalmacen i ON i.iga_id = s.igaId
        RIGHT JOIN clg_cac_aceptacion c ON i.iga_cac_id = c.cac_id
        WHERE i.iga_cli_id = ${cliente} AND i.iga_estado = 1
        GROUP BY iga_id,c.cac_numero,i.iga_codigo,i.iga_comentarios
      ) i
      INNER JOIN clg_dga_detallesguardalmacen d ON i.igaId = d.dga_iga_id
      GROUP BY
        i.igaId,
        i.carta,
        i.informe,
        i.fechaIngreso,
        i.fechaPrimeraSalida,
        i.fechaUltimaSalida
    ) x
    WHERE x.bultosSalida IS NOT NULL
    ORDER BY x.fechaUltimaSalida DESC

  `;
  const [parciales_finiquitados] = await db.query(sql2);

  let detallesParcialesIds = [];
  let detallesFiniquitadosIds = [];
  let ingresos_salidas_parciales = [];
  let ingresos_salidas_finiquitada = [];
  const mercancia_finiquitada = parciales_finiquitados.filter(
    (item) => item.estado !== "Parcial"
  );

  parciales_finiquitados.forEach((value) => {
    if (value.estado == "Parcial") {
      detallesParcialesIds.push(value.igaId);
      let existencia = value.bultosIniciales - value.bultosSalida;
      ingresos_salidas_parciales.push({
        igaId: value.igaId,
        carta: value.carta,
        informe: value.informe,
        fechaIngreso: value.fechaIngreso,
        fechaPrimeraSalida: value.fechaPrimeraSalida,
        fechaUltimaSalida: value.fechaUltimaSalida,
        bultosIniciales: value.bultosIniciales,
        pesoInicial: value.pesoInicial,
        volumenInicial: value.volumenInicial,
        bultosSalida: value.bultosSalida,
        estado: value.estado,
        comentarios: value.comentarios,
        existencia: existencia,
      });
    }
    if (value.estado == "Finiquitado") {
      detallesFiniquitadosIds.push(value.igaId);
      let existencia = value.bultosIniciales - value.bultosSalida;
      ingresos_salidas_finiquitada.push({
        igaId: value.igaId,
        carta: value.carta,
        informe: value.informe,
        fechaIngreso: value.fechaIngreso,
        fechaPrimeraSalida: value.fechaPrimeraSalida,
        fechaUltimaSalida: value.fechaUltimaSalida,
        bultosIniciales: value.bultosIniciales,
        pesoInicial: value.pesoInicial,
        volumenInicial: value.volumenInicial,
        bultosSalida: value.bultosSalida,
        estado: value.estado,
        comentarios: value.comentarios,
        existencia: existencia,
      });
    }
  });

  let detalles_parciales = [];
  if (detallesParcialesIds.length > 0) {
    const sql3 = `
      SELECT
        sal_iga_id igaId,
        sal_codigo salida,
        DATE_FORMAT(s.sal_fecha,'%d-%m-%Y') fecha,
        SUM(d.sald_cantidad) bultos,
        ROUND(SUM(d.sald_peso), 3) peso,
        ROUND(SUM(d.sald_volumen), 3) volumen
      FROM clg_sal_salidas s
      INNER JOIN clg_sald_salidadetalles d on s.sal_id = d.sald_sal_id
      WHERE sal_iga_id IN (${detallesParcialesIds.join(",")}) 
      AND DATE_FORMAT(sal_fecha, '%Y-%m-%d') <= '${hasta}'
      GROUP BY sal_id
      ORDER BY sal_iga_id, sal_fecha ASC
  `;
    [detalles_parciales] = await db.query(sql3);
  } else {
    detalles_parciales = [];
  }
  let detalles_finiquitados = [];
  if (detallesFiniquitadosIds.length > 0) {
    const sql4 = `
      SELECT
        sal_iga_id igaId,
        sal_codigo salida,
        DATE_FORMAT(s.sal_fecha,'%d-%m-%Y') fecha,
        SUM(d.sald_cantidad) bultos,
        ROUND(SUM(d.sald_peso),3) peso,
        ROUND(SUM(d.sald_volumen),3) volumen
      FROM clg_sal_salidas s
      INNER JOIN clg_sald_salidadetalles d on s.sal_id = d.sald_sal_id
      WHERE sal_iga_id IN (${detallesFiniquitadosIds.join(",")})
      GROUP BY sal_id
      ORDER BY sal_iga_id, sal_fecha ASC
  `;
    [detalles_finiquitados] = await db.query(sql4);
  } else {
    detalles_finiquitados = [];
  }
  const agruparPorIgaId = (lista) => {
    const agrupado = {};
    lista.forEach((item) => {
      if (!agrupado[item.igaId]) {
        agrupado[item.igaId] = [];
      }
      agrupado[item.igaId].push(item);
    });
    return agrupado;
  };

  const detallesParcialesAgrupados = agruparPorIgaId(detalles_parciales);
  const detallesFiniquitadosAgrupados = agruparPorIgaId(detalles_finiquitados);

  const datos = {
    ingresos_sin_salidas,
    ingresos_salidas_parciales,
    ingresos_salidas_finiquitada,
    mercancia_finiquitada,
    salidasParciales: detallesParcialesAgrupados,
    salidasFiniquitados: detallesFiniquitadosAgrupados,
  };

  return { data: datos };
}


// async function data_Metricas_Opertivas_equipo({
//   fecha_desde,
//   hasta,
//   consolidador = 0,
//   destino = 0,
// }) {
//   const where = `WHERE sal.sal_fecha_liq_dm BETWEEN DATE('${fecha_desde}') AND DATE('${fecha_hasta}') AND sal.sal_iga_id != 0`;
//   const where2 = `WHERE fac.fac_fecha BETWEEN DATE('${fecha_desde}') AND DATE('${fecha_hasta}')`;
//   const where3 = `WHERE sco.sco_fecha_liquidacion BETWEEN DATE('${fecha_desde}') AND DATE('${fecha_hasta}')`;
//   const sql = `
//       SELECT
//         SUM(sal.sal_volumen) AS suma_salidas_del_periodo,
//         (
//         SELECT
//           SUM(sco.sco_volumen)
//         FROM
//           clg_sco_salidaconsolidada AS sco
//         INNER JOIN clg_fac_factura AS fac ON
//           fac.fac_origen_id = sco.sco_iga_id
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where3}
//           AND ifg.iga_estado = 1
//           AND detfac.detfac_lindetfac_id = 2
//         ) AS suma_salidas_del_periodo_cons_1,
//         (
//         SELECT
//           SUM(sco.sco_volumen)
//         FROM
//           clg_sco_salidaconsolidada AS sco
//         INNER JOIN clg_fac_factura AS fac ON
//           fac.fac_origen_id = sco.sco_iga_id
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where3}
//             AND ifg.iga_estado = 1
//             AND detfac.detfac_lindetfac_id = 1
//         ) AS suma_salidas_del_periodo_cons,
//         (
//         SELECT
//           SUM(sal.sal_volumen)
//         FROM
//           clg_sal_salidas AS sal
//         INNER JOIN clg_fac_factura AS fac ON
//           fac.fac_origen_id = sal.sal_iga_id
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where}
//             AND sal.sal_iga_id != 0
//             AND ifg.iga_estado = 1
//             AND detfac.detfac_lindetfac_id = 1
//         ) AS suma_salidas_del_periodo_1,
//         (
//         SELECT
//           SUM(detfac.detfac_valor)
//         FROM
//           clg_fac_factura AS fac
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where2}
//             AND ifg.iga_estado = 1
//             AND detfac.detfac_lindetfac_id = 2
//         ) AS suma_facturado_del_periodo_simp,
//         (
//         SELECT
//           SUM(detfac.detfac_valor)
//         FROM
//           clg_fac_factura AS fac
//         INNER JOIN clg_sco_salidaconsolidada AS sco ON
//           sco.sco_iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where2}
//             AND detfac.detfac_lindetfac_id = 2
//         ) AS suma_facturado_del_periodo_cons_1,
//         (
//         SELECT
//           SUM(detfac.detfac_valor)
//         FROM
//           clg_fac_factura AS fac
//         INNER JOIN clg_sco_salidaconsolidada AS sco ON
//           sco.sco_iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where2}
//             AND detfac.detfac_lindetfac_id = 1
//         ) AS suma_facturado_del_periodo_cons,
//         (
//         SELECT
//           SUM(detfac.detfac_valor)
//         FROM
//           clg_fac_factura AS fac
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where2}
//             AND ifg.iga_estado = 1
//             AND detfac.detfac_lindetfac_id = 1
//         ) AS suma_facturado_del_periodo_simp_1
//         FROM
//           clg_sal_salidas AS sal
//         INNER JOIN clg_fac_factura AS fac ON
//           fac.fac_origen_id = sal.sal_iga_id
//         INNER JOIN clg_iga_informeguardalmacen AS ifg ON
//           ifg.iga_id = fac.fac_origen_id
//         INNER JOIN clg_detfac_detallefactura AS detfac ON
//           detfac.detfac_fac_id = fac.fact_id
//         ${where}
//           AND ifg.iga_estado = 1
//           AND detfac.detfac_lindetfac_id = 2

//   ;
//   `;
//   const [datos1] = await db.query(sql);

//   const sql2 = `
//       SELECT
//         SUM(df.detfac_valor) AS detfac_valor,
//         ldf.lindetfac_servicios,
//         (
//           SELECT SUM(df2.detfac_valor)
//           FROM clg_detfac_detallefactura AS df2
//           INNER JOIN clg_fac_factura AS f2 ON f2.fact_id = df2.detfac_fac_id
//           INNER JOIN clg_lindetfac_lineadetallefactura AS ldf2 ON ldf2.lindetfac_id = df2.detfac_lindetfac_id
//           INNER JOIN clg_sco_salidaconsolidada AS sal2 ON sal2.sco_iga_id = f2.fac_origen_id
//           WHERE f2.fac_fecha BETWEEN '${desde}' AND '${hasta}'
//           AND f2.fact_id = f.fact_id
//         ) AS detfac_valor_cons
//       FROM clg_detfac_detallefactura AS df
//       INNER JOIN clg_fac_factura AS f ON f.fact_id = df.detfac_fac_id
//       INNER JOIN clg_lindetfac_lineadetallefactura AS ldf ON ldf.lindetfac_id = df.detfac_lindetfac_id
//       INNER JOIN clg_sal_salidas AS sal ON sal.sal_iga_id = f.fac_origen_id
//       WHERE f.fac_fecha BETWEEN '${desde}' AND '${hasta}'
//       GROUP BY df.detfac_lindetfac_id
//     `;
//   const [datos2] = await db.query(sql2);
//   let condicion = `WHERE i.iga_estado = 1 AND i.iga_fechaingreso BETWEEN '${desde}' AND '${hasta}'AND i.iga_origen IS NULL `;

//   if (destino == 1) {
//     condicion = `AND cad.cad_pai_id = 26`;
//   } else if (destino == 2) {
//     condicion = `AND cad.cad_pai_id = 26 AND (i.iga_stal_id = 1 OR i.iga_stal_id = 4)`;
//   }

//   if (consolidador != 0) {
//     condicion = `AND t.tra_id = ${consolidador}`;
//   }

//   const sql3 = `
//       SELECT
//         SUM(df.detfac_valor) AS detfac_valor,
//         ldf.lindetfac_servicios,
//         (
//           SELECT SUM(df2.detfac_valor)
//           FROM clg_detfac_detallefactura AS df2
//           INNER JOIN clg_fac_factura AS f2 ON f2.fact_id = df2.detfac_fac_id
//           INNER JOIN clg_lindetfac_lineadetallefactura AS ldf2 ON ldf2.lindetfac_id = df2.detfac_lindetfac_id
//           INNER JOIN clg_sco_salidaconsolidada AS sal2 ON sal2.sco_iga_id = f2.fac_origen_id
//           WHERE f2.fac_fecha BETWEEN '${desde}' AND '${hasta}'
//           AND f2.fact_id = f.fact_id
//         ) AS detfac_valor_cons
//       FROM clg_detfac_detallefactura AS df
//       INNER JOIN clg_fac_factura AS f ON f.fact_id = df.detfac_fac_id
//       INNER JOIN clg_lindetfac_lineadetallefactura AS ldf ON ldf.lindetfac_id = df.detfac_lindetfac_id
//       INNER JOIN clg_sal_salidas AS sal ON sal.sal_iga_id = f.fac_origen_id
//       WHERE f.fac_fecha BETWEEN '${desde}' AND '${hasta}'
//       GROUP BY df.detfac_lindetfac_id
//     `;
//   const [datos3] = await db.query(sql3);

//   let datos = {
//     datos1,
//     datos2,
//   };

//   return { data: datos };
// }


async function data_fact_regim_client_consol({
  desde,
  hasta,
  limit = 50,
  offset = 0,
}) {
  let where = `
    WHERE f.fac_anulada = 0
	 AND (f.fac_fecha_creacion BETWEEN '${desde}' AND '${hasta}')
	 AND df.detfac_lindetfac_id IN (1, 2, 3)
	 AND i.iga_stal_id IN (1, 2, 3)
  `;

  const sql = `SELECT
      @rownum := @rownum + 1 AS n,
      clienteConsolidador,
      regimen,
      cortfac_tipofactura,
      fecha,
      monto
    FROM (
      SELECT
        IF(i.iga_stal_id = 1, tr.tra_nombre, cl.cli_nombre) AS clienteConsolidador,
        st.stal_estado AS regimen,
        cf.cortfac_tipofactura,
        DATE_FORMAT(f.fac_fecha_creacion, '%Y-%m-%d') AS fecha,
        df.detfac_valor AS monto
      FROM clg_cac_aceptacion a
      INNER JOIN clg_cad_detalleaceptacion ad ON a.cac_id = ad.cad_cac_id
      INNER JOIN clg_tra_transportistas tr ON a.cac_tra_id = tr.tra_id
      INNER JOIN clg_iga_informeguardalmacen i ON i.iga_cad_id = ad.cad_id
      INNER JOIN clg_stal_estadosalmacenaje st ON st.stal_id = i.iga_stal_id
      INNER JOIN clg_fac_factura f ON f.fac_origen_id = i.iga_id
      INNER JOIN clg_cli_clientes cl ON cl.cli_id = f.fac_cliente_id
      INNER JOIN clg_cortfac_correlativotipofactura cf ON cf.cortfac_id = f.fac_cortfac_id
      INNER JOIN clg_detfac_detallefactura df ON df.detfac_fac_id = f.fact_id
      ${where}
      ORDER BY f.fac_fecha_creacion ASC
    ) AS datos,
    (SELECT @rownum := 0) AS r
    LIMIT ${limit} OFFSET ${offset};
      `;

  const countSql = `
    SELECT
      COUNT(*) AS total
    FROM
      (
        SELECT
          IF(i.iga_stal_id = 1, tr.tra_nombre, cl.cli_nombre) clienteConsolidador,
          st.stal_estado regimen,
          cf.cortfac_tipofactura,
          DATE_FORMAT(f.fac_fecha_creacion, '%Y-%m-%d') fecha,
          df.detfac_valor monto
        FROM
        clg_cac_aceptacion a
        INNER JOIN clg_cad_detalleaceptacion ad ON
          a.cac_id = ad.cad_cac_id
        INNER JOIN clg_tra_transportistas tr ON
          a.cac_tra_id = tr.tra_id
        INNER JOIN clg_iga_informeguardalmacen i ON
          i.iga_cad_id = ad.cad_id
        INNER JOIN clg_stal_estadosalmacenaje st ON
          st.stal_id = i.iga_stal_id
        INNER JOIN clg_fac_factura f ON
          f.fac_origen_id = i.iga_id
        INNER JOIN clg_cli_clientes cl ON
          cl.cli_id = f.fac_cliente_id
        INNER JOIN clg_cortfac_correlativotipofactura cf ON
          cf.cortfac_id = f.fac_cortfac_id
        INNER JOIN clg_detfac_detallefactura df ON
          df.detfac_fac_id = f.fact_id
         WHERE f.fac_anulada = 0
	 AND (f.fac_fecha_creacion BETWEEN '${desde}' AND '${hasta}')
	 AND df.detfac_lindetfac_id IN (1, 2, 3)
	 AND i.iga_stal_id IN (1, 2, 3)
      ) AS resultados;
      `;

  const [rows] = await db.query(sql);
  const [[{ total }]] = await db.query(countSql);

  return { data: rows, total };
}


module.exports = {
  data_Cliente,
  data_Equipo,
  data_consolidador_factura,
  data_consolidador_servicio,
  data_facturageneral_dia,
  data_valores_hoy,
  data_valores_promedio_dia,
  data_Promedio_General,
  data_Promedio_Detalle,
  data_Cartas,
  data_Informes,
  resumen_de_ingreso_carga,
  datos_extra_Facturacion_consolidado,
  datos_extra_Facturacion_cliente,
  datos_comisiones_consolidador,
  datos_ingreso_salida,
  datos_historico_cliente,
  //data_Metricas_Opertivas_equipo,
  data_fact_regim_client_consol,
};