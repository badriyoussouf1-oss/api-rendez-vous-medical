require('dotenv').config({ silent: true });
const express = require('express');
const bodyParser = require('body-parser');
const { syncDatabase } = require('./models');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Importer les routes
const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');
const docteurRoutes = require('./routes/docteurRoutes');
const secretaireRoutes = require('./routes/secretaireRoutes');

// ============================================
// INITIALISATION DE L'APPLICATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Parser le body des requêtes JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS (si nécessaire pour le développement)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});



// ============================================
// ROUTES
// ============================================

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API de gestion de rendez-vous médical',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      admins: '/api/admins',
      patients: '/api/patients',
      docteurs: '/api/docteurs',
      secretaires: '/api/secretaires'
    }
  });
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Clinique - Documentation'
}));

// Route pour obtenir le spec Swagger en JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes principales
app.use('/api/admins', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/docteurs', docteurRoutes);
app.use('/api/secretaires', secretaireRoutes);

// ============================================
// GESTION DES ERREURS 404
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// ============================================
// GESTION DES ERREURS GLOBALES
// ============================================

app.use((err, req, res, next) => {
  // Log uniquement en cas d'erreur (décommente pour déboguer)
  // console.error('Erreur globale:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
// Logger les requêtes (développement) - DÉSACTIVÉ
// Décommente si tu veux voir les logs des requêtes
/*
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
*/
const startServer = async () => {
  try {
    // Synchroniser la base de données (silencieusement)
    await syncDatabase();

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });

  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n Arrêt du serveur...');
  
  try {
    const sequelize = require('./config/database');
    await sequelize.close();
    
    const redisClient = require('./config/redis');
    await redisClient.quit();
    
    console.log('Serveur arrêté proprement');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error.message);
    process.exit(1);
  }
});

module.exports = app;