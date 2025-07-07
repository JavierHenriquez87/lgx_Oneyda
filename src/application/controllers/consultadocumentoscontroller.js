const { logsUsers } = require('../logs/logsUser'); //Validaciones de los datos que envía el usuario
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envía el usuario
const { Op, Sequelize, QueryTypes } = require('sequelize'); //Operador especial de Sequelize
const db = require('../../database/db');  // Importa la configuración de Sequelize

/**  
* *Importación de modelos a utilizar
*/
const ConsignatarioCarta = require('../models/WMS_ConsignatarioCartaModel');
const FotosCBM = require('../models/WMS_FotosCBMModel');

class consultadocumentoscontroller {

    /**
    * TODO FUNCIÓN PARA OBTENER LISTADO DE DOCUMENTOS (BÚSQUEDA AVANZADA)
    */
    static async consultaDocumentos(req, res, next) {
        var jsonResponse = { status: 500, message: "", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('tipo_documento').notEmpty().withMessage('tipo_documento es requerido.'),
            check('num_documento').notEmpty().withMessage('num_documento es requerido.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            //Guardamos en estas variables la data que envió el usuario
            const { tipo_documento, num_documento } = req.body;

            let where = "";
            switch (tipo_documento) {
                case 'Carta':
                    where = `WHERE c.cac_numero = '${num_documento}'`;
                    break;
                case 'Informe':
                    where = `WHERE i.iga_codigo = '${num_documento}'`;
                    break;
                case 'Salida':
                    where = `WHERE st.salida = '${num_documento}'`;
                    break;
                case 'IM':
                    where = `WHERE d.doc_ndocumento = '${num_documento}'`;
                    break;
                case 'SAL ID':
                    where = `WHERE st.salId = '${num_documento}'`;
                    break;
                default:
                    where = "";
                    break;
            }

            const sqlQueryData = `
                    SELECT
                      c.cac_id,
                      c.cac_numero,
                      c.cac_pdf,
                      c.de_lgx as ca_de_lgx,
                      CONCAT_WS(' ', uc.usu_nombres, uc.usu_apellidos) AS cartaUsuario,
                      i.de_lgx as if_de_lgx,
                      i.iga_id,
                      i.iga_codigo,
                      i.iga_archivo,
                      IF(i.iga_estado = 1, 'Activo', IF(i.iga_estado = 0, 'Inactivo', i.iga_estado)) AS estadoInforme,
                      CONCAT_WS(' ', u.usu_nombres, u.usu_apellidos) AS informeUsuario,
                      st.*,
                      d.doc_id,
                      cl.cli_nombre,
                      d.doc_ndocumento,
                      d.doc_documentos,
                      c.cac_manifiesto_archivo
                      FROM clg_cac_aceptacion c
                      LEFT JOIN clg_iga_informeguardalmacen i ON c.cac_id = i.iga_cac_id
                      LEFT JOIN clg_cli_clientes cl ON cl.cli_id = i.iga_cli_id
                      LEFT JOIN crm_usuario u ON u.usu_id = i.iga_usu_id
                      LEFT JOIN clg_doc_documentos d ON d.doc_iga_id = i.iga_id
                      INNER JOIN crm_usuario uc ON uc.usu_id = c.cac_usu_id
                      LEFT JOIN (
                        SELECT
                        s.de_lgx as sal_de_lgx,
                        s.sal_id,
                        s.sal_codigo,
                        IF(ANY_VALUE(d.sald_sco_id) IS NULL, s.sal_iga_id, c.sco_iga_id) AS igaId,
                        IF(ANY_VALUE(d.sald_sco_id) IS NULL, 'SIMPLE', 'CONSOLIDADA') AS tipoSalida,
                        CONCAT_WS(' ', ANY_VALUE(u.usu_nombres), ANY_VALUE(u.usu_apellidos)) AS salidaUsuario
                      FROM clg_sald_salidadetalles d
                      INNER JOIN clg_sal_salidas s ON s.sal_id = d.sald_sal_id
                      LEFT JOIN clg_sco_salidaconsolidada c ON d.sald_sco_id = c.sco_id
                      INNER JOIN crm_usuario u ON u.usu_id = s.sal_usu_id
                      GROUP BY d.sald_sal_id, IF(ANY_VALUE(d.sald_sco_id) IS NULL, s.sal_iga_id, c.sco_iga_id)
                    ) st ON i.iga_id = st.igaId
                    ${where}
                    `;

            const documentos = await db.query(sqlQueryData, {
                type: QueryTypes.SELECT,
            });


            for (const item of documentos) {
                if (item.cac_pdf && !item.ca_de_lgx) {
                    item.cac_pdf = 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + item.cac_pdf;
                }

                if (item.iga_archivo && !item.if_de_lgx) {
                    item.iga_archivo = 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_guardalmacen/' + item.iga_archivo;
                }

                if (item.sal_codigo && !item.sal_de_lgx) {
                    item.sal_codigo = 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/informes_salidas_aduana/' + item.sal_codigo + '.pdf';
                }

                if (item.cac_manifiesto_archivo && !item.ca_de_lgx) {
                    item.cac_manifiesto_archivo = 'https://sistemas.clgsv.com/ucontrol/ci/clg/pdf/cartas_aceptacion/' + item.cac_manifiesto_archivo;
                }

                item.fotografias_cbm = await ConsignatarioCarta.findAll({
                    where: {
                        iga_id: item.iga_id
                    },
                    include: [
                        {
                            model: FotosCBM
                        }
                    ]
                });
            }

            jsonResponse = {
                status: 200,
                message: "Success",
                response: documentos
            };

        }
        catch (error) {
            //! Registramos el error capturado
            try {
                next(error);
            } catch (e) {
            }

            jsonResponse = {
                status: 500,
                message: "Error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }//END consultaDocumentos

}

module.exports = consultadocumentoscontroller;