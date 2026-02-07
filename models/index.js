const sequelize = require('../config/database');
const Admin = require('./Admin');
const Secretaire = require('./Secretaire');
const Docteur = require('./Docteur');
const Patient = require('./Patient');
const RendezVous = require('./RendezVous');

Patient.hasMany(RendezVous, {
  foreignKey: 'patient_id',
  as: 'rendezVous'
});

RendezVous.belongsTo(Patient, {
  foreignKey: 'patient_id',
  as: 'patient'
});

Docteur.hasMany(RendezVous, {
  foreignKey: 'docteur_id',
  as: 'rendezVous'
});

RendezVous.belongsTo(Docteur, {
  foreignKey: 'docteur_id',
  as: 'docteur'
});

const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('Base de données synchronisée avec succès !');

    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables créées :', tables);
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données :', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Admin,
  Secretaire,
  Docteur,
  Patient,
  RendezVous,
  syncDatabase
};
