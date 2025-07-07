const Mailjet = require('node-mailjet');

class LibUtil {
    //*****************************************************/
    //METODO PARA ENVIAR CORREOS 
    //*****************************************************/

    static async sendEmail(dataEmail) {
        let vars = [];
        const hostname = process.env.MAIL_HOST;
        const port = process.env.MAIL_PORT;
        const username = process.env.MAIL_USERNAME;
        const password = process.env.MAIL_PASSWORD;
        const secure = process.env.MAIL_HOSTTLS;
        const from = process.env.MAIL_FROM_ADDRESS;
        const from_name = process.env.MAIL_FROM_NAME;

        const mjconn = Mailjet.apiConnect(username, password);


        switch (dataEmail['tipo']) {
            //Para envio de correo de Daños en la carga
            case "Danios en carga":
                vars = {
                    "fecha_ingreso": dataEmail['fecha_ingreso'],
                    "cac_numero": dataEmail['cac_numero'],
                    "transportista": dataEmail['transportista'],
                    "num_contenedor": dataEmail['num_contenedor'],
                    "num_marchamo": dataEmail['num_marchamo'],
                    "nombre_piloto": dataEmail['nombre_piloto'],
                    "documento": dataEmail['documento'],
                    "comentario": dataEmail['comentario'],
                    "anio": dataEmail['anio'],
                    "path": dataEmail['path'],
                };
                break;

            //Para envio de correo de Daños en la carga (CBM)
            case "Danios en cbm":
                vars = {
                    "codigo_barra": dataEmail['codigo_barra'],
                    "nombre_tipocarga": dataEmail['nombre_tipocarga'],
                    "fecha_creacion": dataEmail['fecha_creacion'],
                    "n_bultos": dataEmail['n_bultos'],
                    "nombre_dano": dataEmail['nombre_dano'],
                    "cac_numero": dataEmail['cac_numero'],
                    "transportista": dataEmail['transportista'],
                    "num_contenedor": dataEmail['num_contenedor'],
                    "num_marchamo": dataEmail['num_marchamo'],
                    "nombre_piloto": dataEmail['nombre_piloto'],
                    "documento": dataEmail['documento'],
                    "chequero": dataEmail['chequero'],
                    "comentario_cbm": dataEmail['comentario_cbm'],
                    "anio": dataEmail['anio'],
                    "path": dataEmail['path']
                };
                break;

            //Notificacion de avance de descarga en CBM
            case "Avance descarga cbm":
                vars = {
                    "cac_numero": dataEmail['cac_numero'],
                    "transportista": dataEmail['transportista'],
                    "num_contenedor": dataEmail['num_contenedor'],
                    "num_marchamo": dataEmail['num_marchamo'],
                    "nombre_piloto": dataEmail['nombre_piloto'],
                    "documento": dataEmail['documento'],
                    "anio": dataEmail['anio'],
                    "avance": dataEmail['avance']
                };
                break;

            //Para envio de correo de Daños en la carga a los clientes que se agregaron
            case "Cliente Danios en carga":
                vars = {
                    "fecha_ingreso": dataEmail['fecha_ingreso'],
                    "cac_numero": dataEmail['cac_numero'],
                    "transportista": dataEmail['transportista'],
                    "num_contenedor": dataEmail['num_contenedor'],
                    "num_marchamo": dataEmail['num_marchamo'],
                    "nombre_piloto": dataEmail['nombre_piloto'],
                    "documento": dataEmail['documento'],
                    "comentario": dataEmail['comentario'],
                    "anio": dataEmail['anio']
                };
                break;

            //Para envio de correo de Daños en la carga (CBM)
            case "Observación de CBM":
                vars = {
                    "observacion": dataEmail['observacion'],
                    "fecha_auditoria": dataEmail['fecha_auditoria'],
                    "creado_por": dataEmail['creado_por'],
                    "codigo_barra": dataEmail['codigo_barra'],
                    "nombre_tipocarga": dataEmail['nombre_tipocarga'],
                    "fecha_creacion": dataEmail['fecha_creacion'],
                    "n_bultos": dataEmail['n_bultos'],
                    "nombre_dano": dataEmail['nombre_dano'],
                    "cac_numero": dataEmail['cac_numero'],
                    "transportista": dataEmail['transportista'],
                    "num_contenedor": dataEmail['num_contenedor'],
                    "num_marchamo": dataEmail['num_marchamo'],
                    "nombre_piloto": dataEmail['nombre_piloto'],
                    "documento": dataEmail['documento'],
                    "chequero1": dataEmail['chequero1'] ?? 'No Asignado',
                    "chequero2": dataEmail['chequero2'] ?? 'No Asignado',
                    "comentario_cbm": dataEmail['comentario_cbm'],
                    "montacarga": dataEmail['montacarga'] ?? '',
                    "ubicacion_mercaderia": dataEmail['ubicacion_mercaderia'],
                    "anio": dataEmail['anio'],
                    "path": dataEmail['path']
                };

                break;

            default:
                vars = {
                    "anio": dataEmail['anio']
                };
                break;
        }

        const request = mjconn
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": from,
                            "Name": from_name
                        },
                        "To": dataEmail['to'],
                        "Cc": dataEmail['cc'] ?? [],
                        "TemplateID": dataEmail['plantilla'],
                        "TemplateLanguage": true,
                        "TemplateErrorReporting": {
                            "Email": "javier@expresate.io"
                        },
                        "Subject": dataEmail['asunto'],
                        "Variables": vars
                    }
                ]
            });

        request
            .then((result) => {
                console.log(result.body)
            })
            .catch((err) => {
                console.error('Error Status Code:', err.statusCode); // Muestra el código de estado
                console.error('Error Message:', err.message); // Muestra el mensaje de error, si está disponible
                if (err.response) {
                    console.error('Error Response Body:', err.response.body); // Muestra el cuerpo de la respuesta de error, si está disponible
                }
            });

        return true; //request;
    }
}


module.exports = LibUtil;


