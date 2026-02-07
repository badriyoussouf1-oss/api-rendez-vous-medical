const bcrypt = require('bcrypt');
const { Secretaire, RendezVous, Patient, Docteur } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');



exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    
    const secretaire = await Secretaire.findOne({ where: { email } });
    if (!secretaire) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    
    const isPasswordValid = await bcrypt.compare(mot_de_passe, secretaire.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken({
      id: secretaire.id,
      email: secretaire.email,
      role: secretaire.role
    });

    
    await redisClient.setEx(`token:${secretaire.id}`, 86400, token); 

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: secretaire.id,
          nom: secretaire.nom,
          prenom: secretaire.prenom,
          email: secretaire.email,
          role: secretaire.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion de la secrétaire:', error);
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

exports.getDemandesPatients = async (req, res) => {
  try {
    const demandes = await RendezVous.findAll({
      where: { statut: 'en_attente_secretaire' },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }],
      order: [['created_at', 'ASC']] // Les plus anciennes d'abord
    });

    res.status(200).json({
      success: true,
      count: demandes.length,
      data: demandes
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes',
      error: error.message
    });
  }
};

exports.assignerDocteur = async (req, res) => {
  try {
    const { id } = req.params; 
    const { docteur_id, date, heure } = req.body;

    
    const rendezVous = await RendezVous.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['nom', 'prenom', 'email']
      }]
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    
    if (rendezVous.statut !== 'en_attente_secretaire') {
      return res.status(400).json({
        success: false,
        message: `Impossible d'assigner ce rendez-vous. Statut actuel: ${rendezVous.statut}`
      });
    }

    
    const docteur = await Docteur.findByPk(docteur_id);
    if (!docteur) {
      return res.status(404).json({
        success: false,
        message: 'Docteur non trouvé'
      });
    }

    
    rendezVous.docteur_id = docteur_id;
    rendezVous.statut = 'en_attente_docteur';
    
    
    if (date) rendezVous.date = date;
    if (heure) rendezVous.heure = heure;
    
    await rendezVous.save();

  
    const rendezVousComplet = await RendezVous.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom', 'email']
        },
        {
          model: Docteur,
          as: 'docteur',
          attributes: ['id', 'nom', 'prenom', 'specialite']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: `Rendez-vous assigné au Dr. ${docteur.nom}`,
      data: rendezVousComplet
    });

  } catch (error) {
    console.error('Erreur lors de l\'assignation du docteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du docteur',
      error: error.message
    });
  }
};

exports.getTousRendezVous = async (req, res) => {
  try {
    const { statut, date } = req.query;

    
    const whereConditions = {};
    if (statut) whereConditions.statut = statut;
    if (date) whereConditions.date = date;

    const rendezVous = await RendezVous.findAll({
      where: whereConditions,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
        },
        {
          model: Docteur,
          as: 'docteur',
          attributes: ['id', 'nom', 'prenom', 'specialite']
        }
      ],
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


exports.planifierRendezVous = async (req, res) => {
  try {
    const { patient_id, docteur_id, date, heure, symptomes } = req.body;

    
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    
    const docteur = await Docteur.findByPk(docteur_id);
    if (!docteur) {
      return res.status(404).json({
        success: false,
        message: 'Docteur non trouvé'
      });
    }

    
    const rendezVous = await RendezVous.create({
      patient_id,
      docteur_id,
      date,
      heure,
      symptomes,
      statut: 'en_attente_docteur'
    });

    
    const rendezVousComplet = await RendezVous.findByPk(rendezVous.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom', 'telephone']
        },
        {
          model: Docteur,
          as: 'docteur',
          attributes: ['id', 'nom', 'prenom', 'specialite']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Rendez-vous planifié avec succès',
      data: rendezVousComplet
    });

  } catch (error) {
    console.error('Erreur lors de la planification du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la planification du rendez-vous',
      error: error.message
    });
  }
};



exports.modifierRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, heure, docteur_id, statut } = req.body;

    const rendezVous = await RendezVous.findByPk(id);
    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    
    if (date) rendezVous.date = date;
    if (heure) rendezVous.heure = heure;
    if (docteur_id) {
      
      const docteur = await Docteur.findByPk(docteur_id);
      if (!docteur) {
        return res.status(404).json({
          success: false,
          message: 'Docteur non trouvé'
        });
      }
      rendezVous.docteur_id = docteur_id;
    }
    if (statut) rendezVous.statut = statut;

    await rendezVous.save();

    
    const rendezVousComplet = await RendezVous.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom']
        },
        {
          model: Docteur,
          as: 'docteur',
          attributes: ['id', 'nom', 'prenom', 'specialite']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Rendez-vous modifié avec succès',
      data: rendezVousComplet
    });

  } catch (error) {
    console.error('Erreur lors de la modification du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du rendez-vous',
      error: error.message
    });
  }
};



exports.annulerRendezVous = async (req, res) => {
  try {
    const { id } = req.params;

    const rendezVous = await RendezVous.findByPk(id);
    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
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



exports.getStatistiques = async (req, res) => {
  try {
    const stats = {
      total_rendez_vous: await RendezVous.count(),
      en_attente_secretaire: await RendezVous.count({ where: { statut: 'en_attente_secretaire' } }),
      en_attente_docteur: await RendezVous.count({ where: { statut: 'en_attente_docteur' } }),
      acceptes: await RendezVous.count({ where: { statut: 'accepte' } }),
      refuses: await RendezVous.count({ where: { statut: 'refuse' } }),
      annules: await RendezVous.count({ where: { statut: 'annule' } }),
      total_patients: await Patient.count(),
      total_docteurs: await Docteur.count(),
      docteurs_libres: await Docteur.count({ where: { statut: 'libre' } }),
      docteurs_occupes: await Docteur.count({ where: { statut: 'occupe' } })
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};


exports.getTousDocteurs = async (req, res) => {
  try {
    const docteurs = await Docteur.findAll({
      attributes: { exclude: ['mot_de_passe'] }
    });

    res.json({
      success: true,
      count: docteurs.length,
      data: docteurs
    });
  } catch (error) {
    console.error('Erreur getTousDocteurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des docteurs'
    });
  }
};