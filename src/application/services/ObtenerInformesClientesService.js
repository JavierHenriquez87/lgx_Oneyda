const db = require("../../database/db");

async function data_informes_clientes(id_cliente) {
  const sql = `
    SELECT
        IF(i.iga_stal_id <> 3, IF(CURDATE() >= i.iga_fechaabandono, 'Abandono', 'Facturar'), '') AS estadoAbandono,
        DATE_FORMAT(i.iga_fechaabandono, '%d/%m/%Y') AS fechaAbandono,
        i.iga_id ,
        i.iga_codigo ,
        i.iga_stal_id,
        ta.stal_estado,
        DATE_FORMAT(i.iga_fechaingreso, '%Y-%m-%d') AS fechaIngreso,
        i.iga_doctransporte ,
        d.dga_id,
        SUM(t.tar_nbultos) AS saldo,
        i.iga_tipo_volumen,
        da.cad_pai_id,
        doc.doc_ndocumento
    FROM clg_iga_informeguardalmacen AS i
    INNER JOIN clg_stal_estadosalmacenaje AS ta ON ta.stal_id = i.iga_stal_id
    INNER JOIN clg_dga_detallesguardalmacen AS d ON d.dga_iga_id = i.iga_id
    INNER JOIN clg_cad_detalleaceptacion AS da ON da.cad_id = i.iga_cad_id
    INNER JOIN clg_tar_tarimas AS t ON t.tar_dga_id = d.dga_id
    LEFT JOIN clg_doc_documentos AS doc ON doc.doc_iga_id = i.iga_id
    WHERE i.iga_cli_id = ${id_cliente}
    AND i.iga_estado = 1
    GROUP BY i.iga_id,d.dga_id,doc.doc_ndocumento
    ORDER BY i.iga_fechaingreso DESC;
  `;
  const [dataInformes] = await db.query(sql);

  let informesActivos = [];

  dataInformes.forEach((informe) => {
    if (informe.saldo > 0) {
      informesActivos.push({
        estadoAbandono: informe.estadoAbandono,
        fechaAbandono: informe.fechaAbandono,
        iga_id: informe.iga_id,
        iga_codigo: informe.iga_codigo,
        iga_stal_id: informe.iga_stal_id,
        stal_estado: informe.stal_estado,
        fechaIngreso: informe.fechaIngreso,
        iga_doctransporte: informe.iga_doctransporte,
        dga_id: informe.dga_id,
        saldo: informe.saldo,
        iga_tipo_volumen: informe.iga_tipo_volumen,
        cad_pai_id: informe.cad_pai_id,
        doc_ndocumento: informe.doc_ndocumento,
      });
    }
  });

  if(dataInformes.length == 0){
    return false;
  }

  let iga_id = informesActivos[0].iga_id;
  let dga_id = informesActivos[0].dga_id;

  const sq2 = `
    select
        d.dga_id a,
        d.dga_recibidos ,
        d.dga_peso ,
        d.dga_sku ,
        p.pro_codigo,
        p.pro_nombre,
        p.pro_id 
    from clg_dga_detallesguardalmacen as d
    inner join clg_pro_productos as p on  d.dga_pro_id = p.pro_id
    where d.dga_iga_id = ${iga_id}
  `;

  const [listadoDetalle] = await db.query(sq2);

  const sq3 = `
    select 
        tar_id as idtar,
        tar_total as total,
        tar_orden as orden,
        tar_nbultos as bultosxtarima,
        tar_inicial as bultosInicial,
        tar_identificador as identificador,
        tar_peso_inicial as pesoInicial,
        tar_peso_actual as peso,
        tar_cif_actual as cif,
        tar_vol_actual as volumen,
        tar_vol_inicial as volumenInicial
    from clg_tar_tarimas
    where tar_dga_id = ${dga_id} and tar_nbultos > 0
  `;

  const [listadoTarimas] = await db.query(sq3);

  let datos = {
    informesActivos,
    listadoDetalle,
    listadoTarimas
  };

  return datos;
}

module.exports = {
  data_informes_clientes,
};
