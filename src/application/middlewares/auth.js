const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
const TokenBlacklist = require('../models/TokensLogoutModel');

async function verifyToken(req, res, next) {
  const token = req.headers['authorization'].split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const blacklist = await TokenBlacklist.count({
    where: { token: token }
  });

  if (blacklist > 0) {
    return res.status(403).json({ message: 'Token invalido' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalido o expirado' });
    }
    req.user = decoded.user; // Decodificamos el token y lo almacenamos en req.user si es necesario 
    next();
  });
}

module.exports = {
  verifyToken
};
