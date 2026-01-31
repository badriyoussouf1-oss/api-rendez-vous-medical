const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

/**
 * @swagger
 * /api/patients/register:
 *   post:
 *     summary: Inscription d'un patient
 *     tags: [Patient]
 *     description: Permet à un nouveau patient de créer un compte
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
 *                 example: Diop
 *               prenom:
 *                 type: string
 *                 example: Amadou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: amadou@email.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Patient@123
 *               telephone:
 *                 type: string
 *                 example: "776789012"
 *               date_naissance:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', patientController.register);

/**
 * @swagger
 * /api/patients/login:
 *   post:
 *     summary: Connexion patient
 *     tags: [Patient]
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
 *                 example: amadou@email.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Patient@123
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
router.post('/login', patientController.login);

// ============================================
// ROUTES PROTÉGÉES (authentification requise)
// ============================================

/**
 * @swagger
 * /api/patients/logout:
 *   post:
 *     summary: Déconnexion patient
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authenticateToken, checkRole(['patient']), patientController.logout);

/**
 * @swagger
 * /api/patients/docteurs-libres:
 *   get:
 *     summary: Voir les docteurs disponibles
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche la liste des docteurs avec le statut "libre"
 *     responses:
 *       200:
 *         description: Liste des docteurs disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nom:
 *                         type: string
 *                         example: Martin
 *                       prenom:
 *                         type: string
 *                         example: Jean
 *                       specialite:
 *                         type: string
 *                         example: Cardiologie
 *                       telephone:
 *                         type: string
 *                         example: "773456789"
 *       401:
 *         description: Non authentifié
 */
router.get('/docteurs-libres', authenticateToken, checkRole(['patient']), patientController.getDocteursLibres);

/**
 * @swagger
 * /api/patients/rendez-vous:
 *   post:
 *     summary: Demander un rendez-vous
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     description: Crée une demande de rendez-vous avec le statut "en_attente_secretaire". La secrétaire assignera ensuite un docteur.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - heure
 *               - symptomes
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-15"
 *               heure:
 *                 type: string
 *                 format: time
 *                 example: "10:00"
 *               symptomes:
 *                 type: string
 *                 example: "Douleur thoracique depuis 2 jours"
 *               docteur_preference_id:
 *                 type: integer
 *                 description: ID du docteur préféré (optionnel)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Demande de rendez-vous créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Demande de rendez-vous envoyée. La secrétaire vous contactera bientôt."
 *                 data:
 *                   $ref: '#/components/schemas/RendezVous'
 *       401:
 *         description: Non authentifié
 */
router.post('/rendez-vous', authenticateToken, checkRole(['patient']), patientController.demanderRendezVous);

/**
 * @swagger
 * /api/patients/mes-rendez-vous:
 *   get:
 *     summary: Voir ses rendez-vous
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche tous les rendez-vous du patient avec les informations du docteur assigné
 *     responses:
 *       200:
 *         description: Liste des rendez-vous du patient
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
 *                     $ref: '#/components/schemas/RendezVous'
 *       401:
 *         description: Non authentifié
 */
router.get('/mes-rendez-vous', authenticateToken, checkRole(['patient']), patientController.getMesRendezVous);

/**
 * @swagger
 * /api/patients/rendez-vous/{id}:
 *   delete:
 *     summary: Annuler un rendez-vous
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous à annuler
 *     responses:
 *       200:
 *         description: Rendez-vous annulé avec succès
 *       400:
 *         description: Rendez-vous déjà annulé
 *       404:
 *         description: Rendez-vous non trouvé
 *       401:
 *         description: Non authentifié
 */
router.delete('/rendez-vous/:id', authenticateToken, checkRole(['patient']), patientController.annulerRendezVous);

module.exports = router;