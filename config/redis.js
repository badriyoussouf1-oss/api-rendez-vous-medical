const redis = require('redis');
require('dotenv').config();


const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
});


redisClient.on('error', (err) => {
  console.error('Erreur de connexion à Redis:', err);
});

redisClient.on('connect', () => {
  console.log('Connexion à Redis établie avec succès.');
});


(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Impossible de se connecter à Redis:', error);
  }
})();

module.exports = redisClient;