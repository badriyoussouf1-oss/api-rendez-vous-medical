const sequelize = require('../config/database');

// Importer tous les modèles
const Admin = require('./Admin');
const Secretaire = require('./Secretaire');
const Docteur = require('./Docteur');
const Patient = require('./Patient');
const RendezVous = require('./RendezVous');



// Relation Patient <-> RendezVous (1:N)
// Un patient peut avoir plusieurs rendez-vous
Patient.hasMany(RendezVous, {
  foreignKey: 'patient_id',
  as: 'rendezVous'
});

RendezVous.belongsTo(Patient, {
  foreignKey: 'patient_id',
  as: 'patient'
});

// Relation Docteur <-> RendezVous (1:N)
// Un docteur peut avoir plusieurs rendez-vous
Docteur.hasMany(RendezVous, {
  foreignKey: 'docteur_id',
  as: 'rendezVous'
});

RendezVous.belongsTo(Docteur, {
  foreignKey: 'docteur_id',
  as: 'docteur'
});

// ============================================
// SYNCHRONISATION DE LA BASE DE DONNÉES
// ============================================

// Fonction pour synchroniser tous les modèles avec la base de données
const syncDatabase = async (options = {}) => {
  try {
    // options.force = true : Supprime et recrée toutes les tables (ATTENTION : efface les données)
    // options.alter = true : Modifie les tables existantes pour correspondre aux modèles
    // Par défaut (sans options) : Crée les tables si elles n'existent pas
    
    await sequelize.sync(options);
    console.log('Base de données synchronisée avec succès !');
    
    // Afficher les tables créées
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables créées :', tables);
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données :', error);
    throw error;
  }
};

// ============================================
// EXPORT DES MODÈLES ET FONCTIONS
// ============================================

module.exports = {
  sequelize,
  Admin,
  Secretaire,
  Docteur,
  Patient,
  RendezVous,
  syncDatabase
};