const bcrypt = require('bcrypt');
const { Docteur, RendezVous, Patient } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const docteur = await Docteur.findOne({ where: { email } });
    if (!docteur) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    const isPasswordValid = await bcrypt.compare(mot_de_passe, docteur.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    const token = generateToken({
      id: docteur.id,
      email: docteur.email,
      role: docteur.role
    });
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
    const { statut } = req.query;
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
    if (rendezVous.statut !== 'en_attente_docteur') {
      return res.status(400).json({
        success: false,
        message: `Impossible d'accepter ce rendez-vous. Statut actuel: ${rendezVous.statut}`
      });
    }
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
    if (rendezVous.statut !== 'en_attente_docteur') {
      return res.status(400).json({
        success: false,
        message: `Impossible de refuser ce rendez-vous. Statut actuel: ${rendezVous.statut}`
      });
    }
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

    if (!['libre', 'occupe'].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Utilisez "libre" ou "occupe"'
      });
    }
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
    const whereConditions = {
      docteur_id,
      statut: 'accepte' 
    };
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
