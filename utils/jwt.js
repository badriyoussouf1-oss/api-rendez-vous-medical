const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
  });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    } else {
      throw new Error('Erreur de vérification du token');
    }
  }
};

module.exports = {
  generateToken,
  verifyToken
};
