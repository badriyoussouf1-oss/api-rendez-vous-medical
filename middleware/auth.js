const { verifyToken } = require('../utils/jwt');
const redisClient = require('../config/redis');
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant. Veuillez vous connecter.'
      });
    }
    const decoded = verifyToken(token);
    const redisToken = await redisClient.get(`token:${decoded.id}`);
    
    if (!redisToken || redisToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message || 'Token invalide ou expiré'
    });
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};
