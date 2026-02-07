const bcrypt = require('bcrypt');
const { Admin, Docteur, Secretaire } = require('../models');
const { generateToken } = require('../utils/jwt');
const redisClient = require('../config/redis');




exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;

    
    const adminCount = await Admin.count();
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Un administrateur existe déjà. Les inscriptions admin sont fermées.'
      });
    }

    
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    
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


exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

   
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    
    const isPasswordValid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    
    await redisClient.setEx(`token:${admin.id}`, 86400, token); 

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


exports.createDocteur = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, specialite } = req.body;

    
    const existingDocteur = await Docteur.findOne({ where: { email } });
    if (existingDocteur) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

   
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

    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

   
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