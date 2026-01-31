const redis = require('redis');
require('dotenv').config();

// Création du client Redis
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
});

// Gestion des erreurs Redis
redisClient.on('error', (err) => {
  console.error('❌ Erreur de connexion à Redis:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connexion à Redis établie avec succès.');
});

// Connexion à Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Impossible de se connecter à Redis:', error);
  }
})();

module.exports = redisClient;