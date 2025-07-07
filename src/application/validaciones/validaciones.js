const { validationResult } = require('express-validator');

/**  
* TODO: Función para realizar las validaciones
*/
const realizarValidaciones = async (req, res, next, validaciones) => {
    await Promise.all(validaciones.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errors.array();
    }
    return true;
};

module.exports = {
    realizarValidaciones
};