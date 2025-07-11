// Id del usuario (Int) ======>>> req.user.log_usu_id  
// Nombre del usuario (String) ======>>> req.user.log_username  

const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth'); // Importamos el middleware desde auth.js 
// Configuración de multer para manejar los archivos
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


//Agregamos los archivos enrutadores de cada tabla 
const logincontroller = require('../controllers/logincontroller');
const usuarioscontroller = require('../controllers/usuarioscontroller');
const rolcontroller = require('../controllers/rolcontroller');
const menucontroller = require('../controllers/menucontroller');
const helpercontroller = require('../controllers/helpercontroller');
const cartaaceptacioncontroller = require('../controllers/cartaaceptacioncontroller');
const clientescontroller = require('../controllers/clientescontroller');
const tipoclientescontroller = require('../controllers/tipoclientescontroller');
const tipocobrocontroller = require('../controllers/tipocobrocontroller');
const tipodomiciliocontroller = require('../controllers/tipodomiciliocontroller');
const transportistacontroller = require('../controllers/transportistacontroller');
const aduanascontroller = require('../controllers/aduanascontroller');
const tipodoctransportecontroller = require('../controllers/tipodoctransportecontroller');
const tiporegimencontroller = require('../controllers/tiporegimencontroller');
const paisescontroller = require('../controllers/paisescontroller');
const informesguardaalmacencontroller = require('../controllers/informesguardaalmacencontroller');
const salidascontroller = require('../controllers/salidascontroller');
const tarimascontroller = require('../controllers/tarimascontroller');
const productoscontroller = require('../controllers/productoscontroller');
const unidadalmacenajecontroller = require('../controllers/unidadalmacenajecontroller');
const consultadocumentoscontroller = require('../controllers/consultadocumentoscontroller');
const bodegascontroller = require('../controllers/bodegascontroller');
const reportesaduanacontroller = require('../controllers/reportesaduanacontroller');
const reportesinternoscontroller = require('../controllers/reportesinternoscontroller');
const servicioscontroller = require('../controllers/servicioscontroller');
const panelcorreccionescontroller = require('../controllers/panelcorreccionescontroller');
const documentossalidascontroller = require('../controllers/documentossalidascontroller');
const inventariocontroller = require('../controllers/inventariocontroller');
const facturacioncontroller = require('../controllers/facturacioncontroller');
const { ro } = require('date-fns/locale');

//===========================================================================
//TODO: LOGIN
//===========================================================================
router.post('/login', logincontroller.login);
router.post('/logout', verifyToken, logincontroller.logout);


//===========================================================================
//TODO: HELPERS
//===========================================================================
//SUBIR ICONOS DE MENU DE LGX
router.post('/iconosmenus',
    upload.fields([
        { name: 'icono', maxCount: 1 }
    ]),
    helpercontroller.Menus
);

//===========================================================================
//TODO: USUARIOS
//===========================================================================
router.post('/usuario/obtenerusuarios', verifyToken, usuarioscontroller.ObtenerUsuarios);
router.post('/usuario/crearusuario', verifyToken, upload.array('fotografia'), usuarioscontroller.CrearUsuario);
router.post('/usuario/editarusuario', verifyToken, upload.array('fotografia'), usuarioscontroller.EditarUsuario);
router.post('/usuario/estadousuario', verifyToken, usuarioscontroller.EstadoUsuario);


//===========================================================================
//TODO: ROLES 
//===========================================================================
router.get('/rol/obtenerroles', verifyToken, rolcontroller.ObtenerRoles);
router.post('/rol/guardarrol', verifyToken, rolcontroller.GuardarRol);
router.put('/rol/editarrol', verifyToken, rolcontroller.EditarRol);
router.put('/rol/editarpermisosrol', verifyToken, rolcontroller.EditarPermisosRol);
router.post('/rol/obtenerBtnSistema', verifyToken, rolcontroller.ObtenerBotonesSistemaLGX);
router.post('/rol/accesoRolBtn', verifyToken, rolcontroller.AccesoBtnRol);


//===========================================================================
//TODO: MENU INICIO 
//===========================================================================
router.post('/carta/buscarporcarta', verifyToken, cartaaceptacioncontroller.FiltroInicialCA);
router.post('/carta/buscarporinforme', verifyToken, cartaaceptacioncontroller.FiltroInicialIGA);
router.post('/carta/buscarporsalidas', verifyToken, cartaaceptacioncontroller.FiltroInicialSalidas);


//===========================================================================
//TODO: CARTAS DE ACEPTACIÓN 
//===========================================================================
router.post('/carta/obtenerca', verifyToken, cartaaceptacioncontroller.ObtenerCA);
router.post('/carta/crearCA',
    verifyToken,
    upload.fields([
        { name: 'cac_manifiesto_archivo', maxCount: 1 }
    ]),
    cartaaceptacioncontroller.CrearCA
);
router.post('/carta/editarCA',
    verifyToken,
    upload.fields([
        { name: 'cac_manifiesto_archivo', maxCount: 1 }
    ]),
    cartaaceptacioncontroller.EditarCA
);
router.post('/carta/registroCambiosCA', verifyToken, cartaaceptacioncontroller.RegistroDeCambiosCA);
router.post('/carta/infoCA', verifyToken, cartaaceptacioncontroller.InfoCA);
router.post('/carta/anularCA',
    verifyToken,
    upload.fields([
        { name: 'doc_anulacion', maxCount: 1 }
    ]),
    cartaaceptacioncontroller.AnularCA
);

//===========================================================================
//TODO: MENUS 
//===========================================================================
router.post('/menus/obtenermenus', verifyToken, menucontroller.ObtenerMenus);
router.post('/menus/accesosMenus', verifyToken, menucontroller.accesosMenus);


//===========================================================================
//TODO: CLIENTES 
//===========================================================================
//* Para select que esta en INICIO
router.get('/clientes/obtenerclienteslist', verifyToken, clientescontroller.ObtenerClientesSelectInicio);
//* Para menu de CONSOLIDADORES
router.post('/clientes/obtenerclientes', verifyToken, clientescontroller.ObtenerClientes);
router.post('/clientes/guardarcliente', verifyToken, clientescontroller.CrearCliente); //* 
router.put('/clientes/editarcliente', verifyToken, clientescontroller.EditarCliente);


//===========================================================================
//TODO: TIPO CLIENTES 
//===========================================================================
router.get('/tipocliente/obtenertipocliente', verifyToken, tipoclientescontroller.ObtenerTiposClientes);


//===========================================================================
//TODO: TIPO COBROS 
//===========================================================================
router.get('/tipocobro/obtenertipocobro', verifyToken, tipocobrocontroller.ObtenerTiposCobro);


//===========================================================================
//TODO: TIPO DOMICILIO 
//===========================================================================
router.get('/tipodomicilio/obtenertipodomicilio', verifyToken, tipodomiciliocontroller.ObtenerTiposDomicilio);


//===========================================================================
//TODO: TRANSPORTISTAS 
//===========================================================================
router.get('/transportistas/obtenertransportista', verifyToken, transportistacontroller.ObtenerTransportistas);
router.post('/transportistas/guardartransportista', verifyToken, transportistacontroller.CrearTransportista);
router.put('/transportistas/editartransportista', verifyToken, transportistacontroller.EditarTransportista);


//===========================================================================
//TODO: ADUANAS 
//===========================================================================
router.get('/aduanas/obteneraduanas', verifyToken, aduanascontroller.ObtenerAduanas);


//===========================================================================
//TODO: TIPO DOCUMENTO DE TRANSPORTE 
//===========================================================================
router.get('/tipodoctransporte/obtenertipodoctransporte', verifyToken, tipodoctransportecontroller.ObtenerTipoDocTransporte);


//===========================================================================
//TODO: TIPO DE REGIMEN 
//===========================================================================
router.get('/tiporegimen/obtenertiporegimen', verifyToken, tiporegimencontroller.ObtenerTipoRegimen);


//===========================================================================
//TODO: PAÍSES
//===========================================================================
router.get('/paises/obtenerpaises', verifyToken, paisescontroller.ObtenerPaises);


//===========================================================================
//TODO: INFORMES GUARDA ALMACEN
//===========================================================================
router.post('/informeguardaalmacen/obtenerIga', verifyToken, informesguardaalmacencontroller.ObtenerIGA);
router.post('/informeguardaalmacen/obtenerInfoIga', verifyToken, informesguardaalmacencontroller.ObtInfoIGA);
router.post('/informeguardaalmacen/obtenerVinetas', verifyToken, informesguardaalmacencontroller.ObtenerVinetas);
router.post('/informeguardaalmacen/crearVinetas', verifyToken, informesguardaalmacencontroller.CrearVinetas);
router.post('/informeguardaalmacen/editarComentario', verifyToken, informesguardaalmacencontroller.EditarComentarios);
router.post('/informeguardaalmacen/auditoriaDocumentos', verifyToken, informesguardaalmacencontroller.auditoriaDocumentos);
router.post('/informeguardaalmacen/infoParaCrearInformes', verifyToken, informesguardaalmacencontroller.ObtInfoParaCrearInformes);
router.post('/informeguardaalmacen/crearInformes',
    verifyToken,
    upload.any(),
    informesguardaalmacencontroller.CrearInformesGuardaAlmacen
);
router.post('/informeguardaalmacen/editarInformeGA',
    verifyToken,
    upload.fields([
        { name: 'iga_archivo_dmti', maxCount: 1 },
        { name: 'iga_archivo_bl', maxCount: 1 },
    ]),
    informesguardaalmacencontroller.EditarInformesGuardaAlmacen
);
router.post('/informeguardaalmacen/crearPdfIga', verifyToken, informesguardaalmacencontroller.CrearPdfIga);
router.post('/informeguardaalmacen/crearIGACambioRegimen', verifyToken, informesguardaalmacencontroller.CrearIGACambioRegimen);

//===========================================================================
//TODO: SALIDAS
//===========================================================================
router.post('/salidas/obtenerSalidas', verifyToken, salidascontroller.ObtenerSalida);
router.post('/salidas/editarComentarioSal', verifyToken, salidascontroller.EditarComentSalDashboard);

//===========================================================================
//TODO: DOCUMENTOS SALIDAS
//===========================================================================

router.get('/salidas/ObtenerDocumentosSalida', verifyToken, documentossalidascontroller.ObtenerDocumentosSalida);


//===========================================================================
//TODO: TARIMAS
//===========================================================================
router.post('/tarimas/ventaTarimas', verifyToken, tarimascontroller.ObtenerVentaTarimas);


//===========================================================================
//TODO: PRODUCTOS
//===========================================================================
router.post('/productos/listadoProductos', verifyToken, productoscontroller.listadoProductos);
router.post('/productos/guardarProducto', verifyToken, productoscontroller.guardarProducto);


//===========================================================================
//TODO: UNIDADES DE ALMACENAJE
//===========================================================================
router.post('/unidades/listUnidadesAlmacenaje', verifyToken, unidadalmacenajecontroller.listUnidadesAlmacenaje);


//===========================================================================
//TODO: BUSQUEDA AVANZADA (ARCHIVO)
//===========================================================================
router.post('/archivo/consultaDocumentos', verifyToken, consultadocumentoscontroller.consultaDocumentos);


//===========================================================================
//TODO: BODEGAS
//===========================================================================
router.get('/bodegas/listBodegas', verifyToken, bodegascontroller.ObtenerBodegas);

//===========================================================================
//TODO: SERVICIOS
//===========================================================================
router.get('/servicios/obtenerServicios', verifyToken, servicioscontroller.ObtenerServicios);


//===========================================================================
// TODO: REPORTES ADUANA
//===========================================================================
router.post('/reportes/obtenerAnexo1_1', verifyToken, reportesaduanacontroller.obtenerAnexo1_1);
router.post('/reportes/obtenerAnexo1_2', verifyToken, reportesaduanacontroller.obtenerAnexo1_2);
router.post('/reportes/obtenerAnexo1_3', verifyToken, reportesaduanacontroller.obtenerAnexo1_3);
router.post('/reportes/obtenerAnexo1_4', verifyToken, reportesaduanacontroller.obtenerAnexo1_4);
router.post('/reportes/obtenerAnexo1_5', verifyToken, reportesaduanacontroller.obtenerAnexo1_5);
router.post('/reportes/obtenerAnexo1_6', verifyToken, reportesaduanacontroller.obtenerAnexo1_6);
router.post('/reportes/obtenerAnexo1_7', verifyToken, reportesaduanacontroller.obtenerAnexo1_7);
router.post('/reportes/obtenerAnexo1_8', verifyToken, reportesaduanacontroller.obtenerAnexo1_8);
router.post('/reportes/obtenerAnexo1_9', verifyToken, reportesaduanacontroller.obtenerAnexo1_9);
router.post('/reportes/obtenerAnexo1_10', verifyToken, reportesaduanacontroller.obtenerAnexo1_10);
router.post('/reportes/obtenerAnexo1_11', verifyToken, reportesaduanacontroller.obtenerAnexo1_11);


//===========================================================================
// TODO: REPORTES INTENOS
//===========================================================================
router.post('/reportesinternos/ingresoPorConsolidador', verifyToken, reportesinternoscontroller.ingresoPorConsolidador);
router.post('/reportesinternos/reporteFacturacion', verifyToken, reportesinternoscontroller.reporteFacturacion);
router.post('/reportesinternos/reporteValorEnBodega', verifyToken, reportesinternoscontroller.reporteValoresEnBodega);
router.post('/reportesinternos/promedioEstadiaBodega', verifyToken, reportesinternoscontroller.promedioEstadiaBodega);
router.post('/reportesinternos/productividadCartas', verifyToken, reportesinternoscontroller.productividadCartas);
router.post('/reportesinternos/productividadInfomes', verifyToken, reportesinternoscontroller.productividadInfomes);
router.post('/reportesinternos/extraFacturacion', verifyToken, reportesinternoscontroller.extraFacturacion);
router.post('/reportesinternos/ComisionesConsolidadores', verifyToken, reportesinternoscontroller.ComisionesConsolidadores);
router.post('/reportesinternos/IngresoSalidaCarga', verifyToken, reportesinternoscontroller.IngresoSalidaCarga);
router.post('/reportesinternos/historicoCliente', verifyToken, reportesinternoscontroller.historicoCliente);
//router.post('/reportesinternos/reporteMetricasOpertivas', reportesinternoscontroller.reporteMetricasOpertivas);
router.post('/reportesinternos/reporteFacturacionRegiClieCons', verifyToken, reportesinternoscontroller.reporteFacturacionRegiClieCons);


//===========================================================================
// TODO: PANEL DE CORRECCIONES
//===========================================================================
router.post('/panelcorrecciones/obtenerUsersCorrecciones', verifyToken, panelcorreccionescontroller.ObtenerUsuariosCorrecciones);
router.post('/panelcorrecciones/ConsultarDocumento', verifyToken,panelcorreccionescontroller.ConsultarDocumento);
//! Cambio de Fecha
router.post('/panelcorrecciones/ObtenerDatosDocumento', verifyToken, panelcorreccionescontroller.ObtenerDatosDocumento);
router.post('/panelcorrecciones/CambiarFechaDocumento', panelcorreccionescontroller.CambiarFechaDocumento);
//! Actualizar PDF
router.post('/panelcorrecciones/ActualizarPDF', verifyToken, panelcorreccionescontroller.ActualizarPDF);
//! Actualizar pais de Destino
router.post('/panelcorrecciones/ObtenerDatosPaisDestino', verifyToken, panelcorreccionescontroller.ObtenerDatosPaisDestino);
router.post('/panelcorrecciones/ActualizarPaisDestino', verifyToken, panelcorreccionescontroller.ActualizarPaisDestino);
//!
//*para obtener los datos del cliente seria esta misma == > panelcorrecciones/ConsultarDocumento
router.post('/panelcorrecciones/CambioCliente', verifyToken,panelcorreccionescontroller.CambioCliente);

//*para obtener los datos del transportista seria esta misma == > panelcorrecciones/ConsultarDocumento
router.post('/panelcorrecciones/CambioTransportista',  panelcorreccionescontroller.CambioTransportista);

//*para obtener los datos de la aduana seria esta misma == > panelcorrecciones/ConsultarDocumento
router.post('/panelcorrecciones/CambioAduana', panelcorreccionescontroller.CambioAduana);

//*para obtener los datos del contenedor seria esta misma == > panelcorrecciones/ConsultarDocumento
router.post('/panelcorrecciones/CambioContenedor', panelcorreccionescontroller.CambioContenedor);


router.post('/panelcorrecciones/informacionDocTransporte',verifyToken,panelcorreccionescontroller.informacionDocTransporte);
// {
//     "documento": "152-2022",
//     "tipo": "Carta"
// }

router.post('/panelcorrecciones/CambioDocumentoTransporte', verifyToken,panelcorreccionescontroller.CambioDocumentoTransporte);
// {
//     "documento" : "152-2022",
//     "tipo" : "Carta",
//     "cad_id" : 34370,
//     "DocTransporte_nuevo" : "ELS-10245",
//     "DocTransporte_antiguo" : "ELS-10248",
//     "motivoCorreccion" : "Cambio de fecha",
//     "solicitante" : 309

// }

//*para obtener los datos del peso seria esta misma == > panelcorrecciones/informacionDocTransporte
router.post('/panelcorrecciones/CambioPeso',verifyToken,panelcorreccionescontroller.CambioPeso);
// {
//     "documento" : "152-2022",
//     "tipo" : "Carta",
//     "cad_id" : 34370,
//     "Peso_nuevo" : "841",
//     "Peso_antiguo" : "831",
//     "motivoCorreccion" : "Cambio de fecha",
//     "solicitante" : 309

// }


//===========================================================================
// TODO: INVENTARIO
//===========================================================================

router.post('/inventario/SaldoIngresos',verifyToken, inventariocontroller.SaldoIngresosGeneral);
// {
//     "tipo_documento": "Informe",
//     "datobusqueda":"2990052025AS001",
//     "page":1
// }
router.post('/inventario/SaldoIngresosDetalle',verifyToken, inventariocontroller.SaldoIngresosDetalle);
// {
//     "iga_stal_id":3,// este es regimen
//     "iga_id":66756
// }
router.post('/inventario/SaldoIngresosFecha',verifyToken, inventariocontroller.SaldoIngresosFecha);
// {
//     "fecha_inicio": "2017-01-01",
//     "fecha_final":"2025-07-08",
//     "id_cliente":11084
// }

//===========================================================================
// TODO: FACTURACION
//===========================================================================


router.get('/facturacion/ObtenerCorrelativos', verifyToken,facturacioncontroller.ObtenerCorrelativos);


router.post('/facturacion/AgregarCorrelativo', verifyToken,facturacioncontroller.AgregarCorrelativo);
// {
//     "rango_inicio":1, 
//     "rango_final":500, 
//     "estado":1, // seria 0 = inactivo y 1 = activo
//     "tipo":2,
//     "anio":2025
// }

router.post('/facturacion/ActualizarCorrelativo', verifyToken,facturacioncontroller.ActualizarCorrelativo);
// {    
//     "corfa_id": 49, // id del correlativo
//     "rango_inicio":1, 
//     "rango_final":500, 
//     "estado":1
// }

router.get('/facturacion/ObtenerTipoFactura',verifyToken, facturacioncontroller.ObtenerTipoFactura);


//===========================================================================
module.exports = router;
//===========================================================================