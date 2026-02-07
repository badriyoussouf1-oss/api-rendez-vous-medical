const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
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
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'patient',
    allowNull: false
  }
}, {
  tableName: 'patients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Patient;