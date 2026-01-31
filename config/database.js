const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion à MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Désactiver les logs SQL (mettre console.log pour voir les requêtes)
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test de la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL établie avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à MySQL:', error);
  }
};

testConnection();

module.exports = sequelize;