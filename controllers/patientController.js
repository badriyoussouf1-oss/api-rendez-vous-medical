const bcrypt = require('bcrypt');
const { Patient, RendezVous, Docteur } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, date_naissance } = req.body;

    
    const existingPatient = await Patient.findOne({ where: { email } });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);    
    const patient = await Patient.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone,
      date_naissance
    });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        id: patient.id,
        nom: patient.nom,
        prenom: patient.prenom,
        email: patient.email,
        telephone: patient.telephone,
        date_naissance: patient.date_naissance,
        role: patient.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription du patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    
    const patient = await Patient.findOne({ where: { email } });
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    const isPasswordValid = await bcrypt.compare(mot_de_passe, patient.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
  
    const token = generateToken({
      id: patient.id,
      email: patient.email,
      role: patient.role
    });

    await redisClient.setEx(`token:${patient.id}`, 86400, token); 

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: patient.id,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email,
          role: patient.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion du patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await redisClient.del(`token:${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};
exports.getDocteursLibres = async (req, res) => {
  try {
    const docteurs = await Docteur.findAll({

      attributes: ['id', 'nom', 'prenom', 'specialite', 'telephone', 'statut'], 
      order: [
        ['statut', 'DESC'],  
        ['nom', 'ASC']      
      ]
    });

    const docteurs_libres = docteurs.filter(d => d.statut === 'libre').length;
    const docteurs_occupes = docteurs.filter(d => d.statut === 'occupe').length;

    res.status(200).json({
      success: true,
      total: docteurs.length,           
      libres: docteurs_libres,         
      occupes: docteurs_occupes,        
      data: docteurs
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des docteurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des docteurs',
      error: error.message
    });
  }
};

exports.demanderRendezVous = async (req, res) => {
  try {
    const { date, heure, symptomes, docteur_preference_id } = req.body;
    const patient_id = req.user.id;    
    const rendezVous = await RendezVous.create({
      date,
      heure,
      statut: 'en_attente_secretaire',
      symptomes,
      patient_id,
      docteur_id: null 
    });

    res.status(201).json({
      success: true,
      message: 'Demande de rendez-vous envoyée. La secrétaire vous contactera bientôt.',
      data: {
        id: rendezVous.id,
        date: rendezVous.date,
        heure: rendezVous.heure,
        statut: rendezVous.statut,
        symptomes: rendezVous.symptomes
      }
    });

  } catch (error) {
    console.error('Erreur lors de la demande de rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de rendez-vous',
      error: error.message
    });
  }
};

exports.getMesRendezVous = async (req, res) => {
  try {
    const patient_id = req.user.id;

    const rendezVous = await RendezVous.findAll({
      where: { patient_id },
      include: [{
        model: Docteur,
        as: 'docteur',
        attributes: ['id', 'nom', 'prenom', 'specialite']
      }],
      order: [['date', 'ASC'], ['heure', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: rendezVous.length,
      data: rendezVous
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
};

exports.annulerRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const patient_id = req.user.id;
    const rendezVous = await RendezVous.findOne({
      where: { id, patient_id }
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    } 
    if (rendezVous.statut === 'annule') {
      return res.status(400).json({
        success: false,
        message: 'Ce rendez-vous est déjà annulé'
      });
    }
    rendezVous.statut = 'annule';
    await rendezVous.save();

    res.status(200).json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      data: rendezVous
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du rendez-vous',
      error: error.message
    });
  }
};
