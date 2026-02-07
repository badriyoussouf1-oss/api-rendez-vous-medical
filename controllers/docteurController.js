const bcrypt = require('bcrypt');
const { Docteur, RendezVous, Patient } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');



exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Vérifier si le docteur existe
    const docteur = await Docteur.findOne({ where: { email } });
    if (!docteur) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mot_de_passe, docteur.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken({
      id: docteur.id,
      email: docteur.email,
      role: docteur.role
    });

    // Sauvegarder le token dans Redis
    await redisClient.setEx(`token:${docteur.id}`, 86400, token); // 24 heures

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: docteur.id,
          nom: docteur.nom,
          prenom: docteur.prenom,
          email: docteur.email,
          specialite: docteur.specialite,
          statut: docteur.statut,
          role: docteur.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion du docteur:', error);
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


exports.getMesRendezVous = async (req, res) => {
  try {
    const docteur_id = req.user.id;
    const { statut } = req.query; // Filtrer par statut si fourni

    // Construire les conditions de recherche
    const whereConditions = { docteur_id };
    if (statut) {
      whereConditions.statut = statut;
    }

    const rendezVous = await RendezVous.findAll({
      where: whereConditions,
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'telephone', 'date_naissance']
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



exports.accepterRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const docteur_id = req.user.id;

    // Vérifier que le rendez-vous existe et est assigné à ce docteur
    const rendezVous = await RendezVous.findOne({
      where: { id, docteur_id },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['nom', 'prenom', 'email']
      }]
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé ou non assigné à ce docteur'
      });
    }

    // Vérifier que le rendez-vous est en attente
    if (rendezVous.statut !== 'en_attente_docteur') {
      return res.status(400).json({
        success: false,
        message: `Impossible d'accepter ce rendez-vous. Statut actuel: ${rendezVous.statut}`
      });
    }

    // Accepter le rendez-vous
    rendezVous.statut = 'accepte';
    await rendezVous.save();

    res.status(200).json({
      success: true,
      message: 'Rendez-vous accepté avec succès',
      data: rendezVous
    });

  } catch (error) {
    console.error('Erreur lors de l\'acceptation du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du rendez-vous',
      error: error.message
    });
  }
};



exports.refuserRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const docteur_id = req.user.id;

    // Vérifier que le rendez-vous existe et est assigné à ce docteur
    const rendezVous = await RendezVous.findOne({
      where: { id, docteur_id },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['nom', 'prenom', 'email']
      }]
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé ou non assigné à ce docteur'
      });
    }

    // Vérifier que le rendez-vous est en attente
    if (rendezVous.statut !== 'en_attente_docteur') {
      return res.status(400).json({
        success: false,
        message: `Impossible de refuser ce rendez-vous. Statut actuel: ${rendezVous.statut}`
      });
    }

    // Refuser le rendez-vous
    rendezVous.statut = 'refuse';
    await rendezVous.save();

    res.status(200).json({
      success: true,
      message: 'Rendez-vous refusé. La secrétaire sera notifiée.',
      data: rendezVous
    });

  } catch (error) {
    console.error('Erreur lors du refus du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus du rendez-vous',
      error: error.message
    });
  }
};


exports.changerStatut = async (req, res) => {
  try {
    const docteur_id = req.user.id;
    const { statut } = req.body;

    // Vérifier que le statut est valide
    if (!['libre', 'occupe'].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Utilisez "libre" ou "occupe"'
      });
    }

    // Mettre à jour le statut
    const docteur = await Docteur.findByPk(docteur_id);
    if (!docteur) {
      return res.status(404).json({
        success: false,
        message: 'Docteur non trouvé'
      });
    }

    docteur.statut = statut;
    await docteur.save();

    res.status(200).json({
      success: true,
      message: `Statut changé en "${statut}" avec succès`,
      data: {
        id: docteur.id,
        nom: docteur.nom,
        prenom: docteur.prenom,
        statut: docteur.statut
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
};



exports.getCalendrier = async (req, res) => {
  try {
    const docteur_id = req.user.id;
    const { date_debut, date_fin } = req.query;

    // Construire les conditions de recherche
    const whereConditions = {
      docteur_id,
      statut: 'accepte' // Uniquement les rendez-vous acceptés
    };

    // Filtrer par période si fourni
    if (date_debut && date_fin) {
      whereConditions.date = {
        [require('sequelize').Op.between]: [date_debut, date_fin]
      };
    }

    const rendezVous = await RendezVous.findAll({
      where: whereConditions,
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'telephone']
      }],
      order: [['date', 'ASC'], ['heure', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: rendezVous.length,
      data: rendezVous
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du calendrier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du calendrier',
      error: error.message
    });
  }
};