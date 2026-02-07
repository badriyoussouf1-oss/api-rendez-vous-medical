require('dotenv').config({ silent: true });
const express = require('express');
const bodyParser = require('body-parser');
const { syncDatabase } = require('./models');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');
const docteurRoutes = require('./routes/docteurRoutes');
const secretaireRoutes = require('./routes/secretaireRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Clinique - Documentation'
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/admins', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/docteurs', docteurRoutes);
app.use('/api/secretaires', secretaireRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const startServer = async () => {
  try {
    await syncDatabase();
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });

  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

startServer();
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
