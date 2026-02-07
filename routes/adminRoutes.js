const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/admins/register:
 *   post:
 *     summary: Inscription du premier administrateur
 *     tags: [Admin]
 *     description: Permet au premier admin de s'inscrire. Bloqué après la création du premier admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - mot_de_passe
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Admin
 *               prenom:
 *                 type: string
 *                 example: Principal
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *               telephone:
 *                 type: string
 *                 example: "771234567"
 *     responses:
 *       201:
 *         description: Administrateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email déjà utilisé
 *       403:
 *         description: Un admin existe déjà
 */
router.post('/register', adminController.register);

/**
 * @swagger
 * /api/admins/login:
 *   post:
 *     summary: Connexion administrateur
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - mot_de_passe
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', adminController.login);



/**
 * @swagger
 * /api/admins/logout:
 *   post:
 *     summary: Déconnexion administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authenticateToken, checkRole(['admin']), adminController.logout);

/**
 * @swagger
 * /api/admins/create-docteur:
 *   post:
 *     summary: Créer un compte docteur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - mot_de_passe
 *               - specialite
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Martin
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.martin@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Doctor@123
 *               telephone:
 *                 type: string
 *                 example: "773456789"
 *               specialite:
 *                 type: string
 *                 example: Cardiologie
 *     responses:
 *       201:
 *         description: Docteur créé avec succès
 *       400:
 *         description: Email déjà utilisé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (non admin)
 */
router.post('/create-docteur', authenticateToken, checkRole(['admin']), adminController.createDocteur);

/**
 * @swagger
 * /api/admins/create-secretaire:
 *   post:
 *     summary: Créer un compte secrétaire
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - mot_de_passe
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Diallo
 *               prenom:
 *                 type: string
 *                 example: Fatou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: fatou@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
 *               telephone:
 *                 type: string
 *                 example: "772345678"
 *     responses:
 *       201:
 *         description: Secrétaire créée avec succès
 *       400:
 *         description: Email déjà utilisé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post('/create-secretaire', authenticateToken, checkRole(['admin']), adminController.createSecretaire);

/**
 * @swagger
 * /api/admins/docteurs:
 *   get:
 *     summary: Voir tous les docteurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des docteurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Docteur'
 */
router.get('/docteurs', authenticateToken, checkRole(['admin']), adminController.getAllDocteurs);

/**
 * @swagger
 * /api/admins/secretaires:
 *   get:
 *     summary: Voir toutes les secrétaires
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des secrétaires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Secretaire'
 */
router.get('/secretaires', authenticateToken, checkRole(['admin']), adminController.getAllSecretaires);

/**
 * @swagger
 * /api/admins/docteur/{id}:
 *   delete:
 *     summary: Supprimer un docteur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du docteur
 *     responses:
 *       200:
 *         description: Docteur supprimé avec succès
 *       404:
 *         description: Docteur non trouvé
 */
router.delete('/docteur/:id', authenticateToken, checkRole(['admin']), adminController.deleteDocteur);

/**
 * @swagger
 * /api/admins/secretaire/{id}:
 *   delete:
 *     summary: Supprimer une secrétaire
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la secrétaire
 *     responses:
 *       200:
 *         description: Secrétaire supprimée avec succès
 *       404:
 *         description: Secrétaire non trouvée
 */
router.delete('/secretaire/:id', authenticateToken, checkRole(['admin']), adminController.deleteSecretaire);

module.exports = router;
