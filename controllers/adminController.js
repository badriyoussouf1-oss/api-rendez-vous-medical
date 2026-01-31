const bcrypt = require('bcrypt');
const { Admin, Docteur, Secretaire } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

// ============================================
// INSCRIPTION D'UN ADMIN (Première fois)
// ============================================

/**
 * Permet au premier admin de s'inscrire
 * Ensuite, bloque les nouvelles inscriptions
 */
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;

    // Vérifier si un admin existe déjà
    const adminCount = await Admin.count();
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Un administrateur existe déjà. Les inscriptions admin sont fermées.'
      });
    }

    // Vérifier si l'email existe déjà
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'admin
    const admin = await Admin.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone
    });

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      data: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// ============================================
// CONNEXION D'UN ADMIN
// ============================================

exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Vérifier si l'admin existe
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    // Sauvegarder le token dans Redis (session active)
    await redisClient.setEx(`token:${admin.id}`, 86400, token); // 24 heures

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: admin.id,
          nom: admin.nom,
          prenom: admin.prenom,
          email: admin.email,
          role: admin.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// ============================================
// DÉCONNEXION D'UN ADMIN
// ============================================

exports.logout = async (req, res) => {
  try {
    // Supprimer le token de Redis
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

// ============================================
// CRÉER UN COMPTE DOCTEUR
// ============================================

exports.createDocteur = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, specialite } = req.body;

    // Vérifier si l'email existe déjà
    const existingDocteur = await Docteur.findOne({ where: { email } });
    if (existingDocteur) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer le docteur
    const docteur = await Docteur.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone,
      specialite,
      statut: 'libre'
    });

    res.status(201).json({
      success: true,
      message: 'Compte docteur créé avec succès',
      data: {
        id: docteur.id,
        nom: docteur.nom,
        prenom: docteur.prenom,
        email: docteur.email,
        specialite: docteur.specialite,
        statut: docteur.statut,
        role: docteur.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du docteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du docteur',
      error: error.message
    });
  }
};

// ============================================
// CRÉER UN COMPTE SECRÉTAIRE
// ============================================

exports.createSecretaire = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;

    // Vérifier si l'email existe déjà
    const existingSecretaire = await Secretaire.findOne({ where: { email } });
    if (existingSecretaire) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer la secrétaire
    const secretaire = await Secretaire.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      telephone
    });

    res.status(201).json({
      success: true,
      message: 'Compte secrétaire créé avec succès',
      data: {
        id: secretaire.id,
        nom: secretaire.nom,
        prenom: secretaire.prenom,
        email: secretaire.email,
        role: secretaire.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la secrétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la secrétaire',
      error: error.message
    });
  }
};

// ============================================
// VOIR TOUS LES DOCTEURS
// ============================================

exports.getAllDocteurs = async (req, res) => {
  try {
    const docteurs = await Docteur.findAll({
      attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'specialite', 'statut', 'created_at']
    });

    res.status(200).json({
      success: true,
      count: docteurs.length,
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

// ============================================
// VOIR TOUTES LES SECRÉTAIRES
// ============================================

exports.getAllSecretaires = async (req, res) => {
  try {
    const secretaires = await Secretaire.findAll({
      attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'created_at']
    });

    res.status(200).json({
      success: true,
      count: secretaires.length,
      data: secretaires
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des secrétaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des secrétaires',
      error: error.message
    });
  }
};

// ============================================
// SUPPRIMER UN DOCTEUR
// ============================================

exports.deleteDocteur = async (req, res) => {
  try {
    const { id } = req.params;

    const docteur = await Docteur.findByPk(id);
    if (!docteur) {
      return res.status(404).json({
        success: false,
        message: 'Docteur non trouvé'
      });
    }

    await docteur.destroy();

    res.status(200).json({
      success: true,
      message: 'Docteur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du docteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du docteur',
      error: error.message
    });
  }
};

// ============================================
// SUPPRIMER UNE SECRÉTAIRE
// ============================================

exports.deleteSecretaire = async (req, res) => {
  try {
    const { id } = req.params;

    const secretaire = await Secretaire.findByPk(id);
    if (!secretaire) {
      return res.status(404).json({
        success: false,
        message: 'Secrétaire non trouvée'
      });
    }

    await secretaire.destroy();

    res.status(200).json({
      success: true,
      message: 'Secrétaire supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la secrétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la secrétaire',
      error: error.message
    });
  }
};