const { verifyToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

// ============================================
// MIDDLEWARE DE VÉRIFICATION DU TOKEN
// ============================================

/**
 * Middleware pour vérifier le token JWT
 * Vérifie également si le token existe dans Redis (session active)
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 1. Récupérer le token depuis le header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant. Veuillez vous connecter.'
      });
    }

    // 2. Vérifier le token JWT
    const decoded = verifyToken(token);

    // 3. Vérifier si le token existe dans Redis (session active)
    const redisToken = await redisClient.get(`token:${decoded.id}`);
    
    if (!redisToken || redisToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }

    // 4. Ajouter les informations de l'utilisateur à la requête
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

// ============================================
// MIDDLEWARE DE VÉRIFICATION DU RÔLE
// ============================================

/**
 * Middleware pour vérifier si l'utilisateur a le bon rôle
 * @param {Array} allowedRoles - Tableau des rôles autorisés
 */
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