const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Docteur = sequelize.define('Docteur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  mot_de_passe: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  specialite: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('libre', 'occupe'),
    defaultValue: 'libre',
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'docteur',
    allowNull: false
  }
}, {
  tableName: 'docteurs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Docteur;
