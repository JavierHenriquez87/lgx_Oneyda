const db = require("../../database/db");

async function DataFacturas({ fecha_desde, fecha_hasta }) {

  const sql = `
    SELECT
        c.cli_nombre,
        c.cli_tcli_id,
        f.fac_cliente_facturar AS cliente_facturado,
        f.fac_cliente_facturar AS clifacturar,
        f.fact_id,
        f.fac_cortfac_id,
        f.fac_cobro,
        f.fac_pagoretenido,
        f.fac_ivaretencion,
        ROUND((f.fac_pagoretenido + f.fac_ivaretencion),2) AS totalRetenciones,
        td.cortfac_tipofactura,
        f.fac_cliente_id,
        f.fac_correlativo,
        f.fac_anulada,
        f.fac_motivo_anulacion,
        DATE_FORMAT(f.fac_fecha, '%d-%m-%Y') fecha,
        f.fac_total,
        f.fac_subtotal,
        f.fac_iva,
        f.fac_devolucion_retencion,
        f.fac_no_comprobante_retencion 
    FROM
        clg_fac_factura f
    INNER JOIN clg_cli_clientes c ON f.fac_cliente_id = c.cli_id
    INNER JOIN clg_cortfac_correlativotipofactura td ON f.fac_cortfac_id = td.cortfac_id
    WHERE f.fac_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
    ORDER BY f.fact_id DESC
  `;

  const [rows] = await db.query(sql);
  const datos = [];
  let total_neto = 0;
  let total_iva = 0;
  let total_iva_retencion = 0;
  let total_pago_retenido = 0;
  let total = 0;
  let total_iva_consumidorFinal = 0;
  
   rows.forEach((row, index) => {

    let anulada = row.fac_anulada == 0 ? 'Activa': 'Anulada';
    total_neto += row.fac_subtotal;
    total_iva += row.fac_iva;
    total_iva_retencion += row.fac_ivaretencion;
    total_pago_retenido += row.fac_pagoretenido;
    total += row.fac_total;
    if(row.cortfac_tipofactura == 'Consumidor Final'){
        let ivaCF = (parseFloat(row.fac_total) - parseFloat(row.fac_subtotal) / 1.13).toFixed(2)
        total_iva_consumidorFinal = parseFloat(total_iva_consumidorFinal) + parseFloat(ivaCF)
    }

    datos.push({
        index: index + 1,
        cli_nombre: row.cli_nombre,
        cli_tcli_id: row.cli_tcli_id,
        cliente_facturado: row.cliente_facturado,
        clifacturar: row.clifacturar,
        fact_id: row.fact_id,
        fac_cortfac_id: row.fac_cortfac_id,
        fac_cobro: row.fac_cobro,
        fac_pagoretenido: row.fac_pagoretenido,
        fac_ivaretencion: row.fac_ivaretencion,
        totalRetenciones: row.totalRetenciones,
        cortfac_tipofactura: row.cortfac_tipofactura,
        fac_cliente_id: row.fac_cliente_id,
        fac_correlativo: row.fac_correlativo,
        fac_anulada: anulada,
        fac_motivo_anulacion: row.fac_motivo_anulacion,
        fecha: row.fecha,
        fac_total: row.fac_total,
        fac_subtotal: row.fac_subtotal,
        fac_iva: row.fac_iva,
        fac_devolucion_retencion: row.fac_devolucion_retencion,
        fac_no_comprobante_retencion: row.fac_no_comprobante_retencion,
        });
    })
    let totalneto = parseFloat(total_neto) - parseFloat(total_iva_consumidorFinal)
    let totaliva = parseFloat(total_iva) + parseFloat(total_iva_consumidorFinal)

    let totales = {
        total_neto: totalneto.toFixed(2),
        total_iva: totaliva.toFixed(2),
        total_iva_retencion: parseFloat(total_iva_retencion).toFixed(2),
        total_pago_retenido: parseFloat(total_pago_retenido).toFixed(2),
        total: parseFloat(total).toFixed(2)
    }

  

  return {data:datos,totales};
}
async function DataDetalleFacturas(factura_id) {

  const sql = `
    SELECT
        f.fac_cobro AS cobro,
        DATE_FORMAT(f.fac_fecha, '%d-%m-%Y') fecha,
        f.fac_subtotal AS  subtotal,
        f.fac_iva AS iva,
        f.fac_totalconiva AS total_con_iva,
        f.fac_pagoretenido AS pago_retenido,
        f.fac_ivaretencion AS iva_retencion,
        f.fac_ventas_exentas AS venta_exenta,
        f.fac_total AS total,
        f.fac_cant_letras AS cantidad_letras,
        f.fac_correlativo AS correlativo,
        f.fac_anulada AS anulada,
        f.fac_cliente_facturar AS cliente,
        td.cortfac_tipofactura AS tipoDoc,
        c.cli_nombre AS nombreCliente,
        c.cli_tcli_id AS tipocliente,
        c.cli_ciudad_pais AS ciudad,
        c.cli_direccion AS direccion,
        c.cli_giro AS giro,
        c.cli_iva AS registro_iva,
        c.cli_nit AS nit
    FROM
        clg_fac_factura AS f
    INNER JOIN clg_cli_clientes c ON f.fac_cliente_id = c.cli_id
    INNER JOIN clg_cortfac_correlativotipofactura AS td ON f.fac_cortfac_id = td.cortfac_id
    WHERE f.fact_id = ${factura_id}
  `;
  const [datos_cliente] = await db.query(sql);

  const sqlDet = `
    SELECT
        d.detfac_ampliacionlineadetalle AS descripcion_servicio,
        d.detfac_valor AS total_servicio,
        s.lindetfac_servicios AS servicio
    FROM
        clg_detfac_detallefactura AS d
    INNER JOIN clg_lindetfac_lineadetallefactura AS s ON d.detfac_lindetfac_id = s.lindetfac_id
    WHERE d.detfac_fac_id = ${factura_id}
  `;
  const [detalles] = await db.query(sqlDet);
  
  

  return {data:datos_cliente,detalles};
}


module.exports = {
  DataFacturas,
  DataDetalleFacturas
};
