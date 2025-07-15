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
    WHERE f.fac_fecha BETWEEN '2025-06-01' AND '2025-06-19'
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

module.exports = {
  DataFacturas
};
