const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RendezVous = sequelize.define('RendezVous', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heure: {
    type: DataTypes.TIME,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM(
      'en_attente_secretaire',
      'en_attente_docteur', 
      'accepte', 
      'refuse', 
      'annule'
    ),
    defaultValue: 'en_attente_secretaire',
    allowNull: false
  },
  symptomes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  docteur_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'docteurs',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'rendez_vous',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RendezVous;
