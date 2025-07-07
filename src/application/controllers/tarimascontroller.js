const moment = require('moment');
const { es } = require('date-fns/locale'); //Importar la localización en español
const { check } = require('express-validator');
const { realizarValidaciones } = require('../validaciones/validaciones'); //Validaciones de los datos que envia el usuario
const { logsUsers } = require('../logs/logsUser'); //Validaciones de los datos que envia el usuario
const { QueryTypes } = require('sequelize');
const db = require('../../database/db');  // Importa la configuración de Sequelize


class tarimascontroller {

    /**
     * TODO: FUNCIÓN PARA OBTENER VENTA DE TARIMAS
     */
    static async ObtenerVentaTarimas(req, res, next) {
        var jsonResponse = { status: 500, message: "Error", response: "" };

        // Definir las validaciones de campos dentro del método
        const validaciones = [
            check('page').notEmpty().withMessage('Number page is required.')
        ];

        // Ejecutar las validaciones
        const resp = await realizarValidaciones(req, res, next, validaciones);

        if (resp != true) {
            return res.status(400).json({ errors: resp });
        }

        try {
            req.body.fecha_inicio = req.body.fecha_inicio ?? null;
            req.body.fecha_fin = req.body.fecha_fin ?? null;
            req.body.datobusqueda = req.body.datobusqueda ?? null;
            const { page, datobusqueda, fecha_inicio, fecha_fin } = req.body;
            const numPag = page;
            const limitePorPagina = 50; // Número de registros por página
            var tarimas = null;
            var tarimasCount = 0;

            if (datobusqueda != null || fecha_inicio != null || fecha_fin != null) {
                //Verificamos que el dato de busqueda contenga al menos 3 caracteres
                if (datobusqueda) {
                    if (datobusqueda.length < 3) {
                        jsonResponse = {
                            status: 400,
                            message: "Bad Request",
                            response: "Debe digitar al menos 3 caracteres para buscar coincidencias."
                        };
                        return res.status(jsonResponse.status).json(jsonResponse);
                    }
                }

                //Contamos TODOS los clientes registrados

                let sqlQueryDataCount = `
                                SELECT COUNT(*) AS total
                                FROM clg_fac_factura f
                                LEFT JOIN clg_detfac_detallefactura df ON f.fact_id = df.detfac_fac_id
                                LEFT JOIN clg_lindetfac_lineadetallefactura l ON l.lindetfac_id = df.detfac_lindetfac_id
                                LEFT JOIN clg_cortfac_correlativotipofactura c ON f.fac_cortfac_id = c.cortfac_id
                                WHERE f.fac_anulada = 0
                                AND l.lindetfac_id = 22
                            `;

                if (fecha_inicio != null && fecha_fin != null) {
                    sqlQueryDataCount += `
                        AND f.fac_fecha_creacion BETWEEN '${fecha_inicio}' AND '${fecha_fin}'
                        `;
                }

                if (datobusqueda != null) {
                    sqlQueryDataCount += `
                        AND f.fac_cliente_facturar LIKE '%${datobusqueda}%'
                        `;
                }

                const totalCount = await db.query(sqlQueryDataCount, {
                    type: QueryTypes.SELECT,
                });

                // El resultado es un array con el campo 'total' que contiene el número de registros
                tarimasCount = totalCount[0].total;

                const offset = (numPag - 1) * limitePorPagina;

                //22 es el id de Pallets
                let sqlQueryData = `
                        SELECT c.cortfac_tipofactura,
                        f.fac_correlativo,
                        f.fac_cliente_facturar,
                        DATE_FORMAT(f.fac_fecha, '%d-%m-%Y') AS fac_fecha,
                        DATE_FORMAT(f.fac_fecha, '%Y-%m-%d') AS fac_fecha,
                        l.lindetfac_servicios,
                        IFNULL(ROUND(df.detfac_precio, 2), 'No') AS detfac_precio,
                        IFNULL(df.detfac_cantidad, 'No') AS detfac_cantidad,
                        ROUND(df.detfac_valor, 2) AS detfac_valor
                        FROM clg_fac_factura f
                        INNER JOIN clg_detfac_detallefactura df ON f.fact_id = df.detfac_fac_id
                        INNER JOIN clg_lindetfac_lineadetallefactura l ON l.lindetfac_id = df.detfac_lindetfac_id
                        INNER JOIN clg_cortfac_correlativotipofactura c ON f.fac_cortfac_id = c.cortfac_id
                        WHERE f.fac_anulada = 0
                        AND l.lindetfac_id = 22 
                        `;


                if (fecha_inicio != null && fecha_fin != null) {
                    sqlQueryData += `
                        AND f.fac_fecha_creacion BETWEEN '${fecha_inicio}' AND '${fecha_fin}'
                        `;
                }

                if (datobusqueda != null) {
                    sqlQueryData += `
                        AND f.fac_cliente_facturar LIKE '%${datobusqueda}%'
                        `;
                }

                sqlQueryDataCount += `
                ORDER BY f.fac_fecha_creacion DESC
                LIMIT ${limitePorPagina}
                OFFSET ${offset}
                `;

                tarimas = await db.query(sqlQueryData, {
                    type: QueryTypes.SELECT,
                });

            } else {
                //Contamos TODOS los clientes registrados

                let sqlQueryDataCount = `
                SELECT COUNT(*) AS total
                FROM clg_fac_factura f
                LEFT JOIN clg_detfac_detallefactura df ON f.fact_id = df.detfac_fac_id
                LEFT JOIN clg_lindetfac_lineadetallefactura l ON l.lindetfac_id = df.detfac_lindetfac_id
                LEFT JOIN clg_cortfac_correlativotipofactura c ON f.fac_cortfac_id = c.cortfac_id
                WHERE f.fac_anulada = 0
                AND l.lindetfac_id = 22
            `;

                const totalCount = await db.query(sqlQueryDataCount, {
                    type: QueryTypes.SELECT,
                });

                // El resultado es un array con el campo 'total' que contiene el número de registros
                tarimasCount = totalCount[0].total;

                const offset = (numPag - 1) * limitePorPagina;
                //22 es el id de Pallets
                let sqlQueryData = `
                                SELECT c.cortfac_tipofactura,
                                f.fac_correlativo,
                                f.fac_cliente_facturar,
                                DATE_FORMAT(f.fac_fecha, '%d-%m-%Y') AS fac_fecha,
                                DATE_FORMAT(f.fac_fecha, '%Y-%m-%d') AS fac_fecha,
                                l.lindetfac_servicios,
                                IFNULL(ROUND(df.detfac_precio, 2), 'No') AS detfac_precio,
                                IFNULL(df.detfac_cantidad, 'No') AS detfac_cantidad,
                                ROUND(df.detfac_valor, 2) AS detfac_valor
                                FROM clg_fac_factura f
                                INNER JOIN clg_detfac_detallefactura df ON f.fact_id = df.detfac_fac_id
                                INNER JOIN clg_lindetfac_lineadetallefactura l ON l.lindetfac_id = df.detfac_lindetfac_id
                                INNER JOIN clg_cortfac_correlativotipofactura c ON f.fac_cortfac_id = c.cortfac_id
                                WHERE f.fac_anulada = 0
                                AND l.lindetfac_id = 22 
                                ORDER BY f.fac_fecha_creacion DESC
                                LIMIT ${limitePorPagina}
                                OFFSET ${offset}
                                `;

                tarimas = await db.query(sqlQueryData, {
                    type: QueryTypes.SELECT,
                });
            }

            // Calcula el número total de páginas
            const total_pages = Math.ceil(tarimasCount / limitePorPagina);

            const data = {
                total_registros: tarimasCount,
                total_paginas: total_pages,
                registros_por_pagina: limitePorPagina,
                data: tarimas
            };

            jsonResponse = {
                status: 200,
                message: "Success",
                response: data
            };

        }
        catch (error) {
            //! Registramos el error capturado
            next(error);

            jsonResponse = {
                status: 500,
                message: "Error",
                response: error.message
            };
        }

        return res.status(jsonResponse.status).json(jsonResponse);
    }//END ObtenerVentaTarimas

}

module.exports = tarimascontroller;