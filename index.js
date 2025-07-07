const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const path = require('path');
require('dotenv').config();
const errorHandler = require('./src/application/middlewares/errorHandler');

//Agregamos el archivo que manejara las rutas
//Toda peticion que tenga la palabra api se manejara por el archivo api que se encuentra en la carpeta routes (el manejador de rutas)
const apiRouter = require('./src/application/routes/api');

const app = express();

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/application/views'));

// Configura la carpeta 'public' para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

require('./src/database/db');

// Configura moment para usar el huso horario de El Salvador
moment.tz.setDefault('America/El_Salvador');

app.use(bodyParser.json({ limit: '35mb' }));

app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '35mb',
        parameterLimit: 50000,
    }),
);
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Obtenemos la ip del usuario logueado
app.use((req, res, next) => {
    let ip;
    try {
        ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
    } catch (error) {
        ip = '-';
    }
    next();
});

//Toda peticion que tenga la palabra api se manejara por el archivo api que se encuentra en la carpeta routes (el manejador de rutas) 
app.use('/api', apiRouter)

// 👇 Esto siempre va al final ya que se encarga de capturar los errores producidos
app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Servidor Logix funcionando! en puerto ${process.env.PORT}`);
})