const express = require('express');
const router = express.Router();
const secretaireController = require('../controllers/secretaireController');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/secretaires/login:
 *   post:
 *     summary: Connexion secrétaire
 *     tags: [Secrétaire]
 *     description: Connexion d'une secrétaire (compte créé par l'admin)
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
 *                 example: fatou@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
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
router.post('/login', secretaireController.login);

/**
 * @swagger
 * /api/secretaires/logout:
 *   post:
 *     summary: Déconnexion secrétaire
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authenticateToken, checkRole(['secretaire']), secretaireController.logout);

/**
 * @swagger
 * /api/secretaires/demandes-patients:
 *   get:
 *     summary: Voir les demandes de rendez-vous des patients
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche toutes les demandes de rendez-vous en attente de traitement (statut "en_attente_secretaire")
 *     responses:
 *       200:
 *         description: Liste des demandes en attente
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/RendezVous'
 *                       - type: object
 *                         properties:
 *                           patient:
 *                             $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Non authentifié
 */
router.get('/demandes-patients', authenticateToken, checkRole(['secretaire']), secretaireController.getDemandesPatients);

/**
 * @swagger
 * /api/secretaires/assigner-docteur/{id}:
 *   put:
 *     summary: Assigner un docteur à une demande
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Assigne un docteur à une demande de rendez-vous et change le statut de "en_attente_secretaire" à "en_attente_docteur"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - docteur_id
 *             properties:
 *               docteur_id:
 *                 type: integer
 *                 description: ID du docteur à assigner
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Modifier la date (optionnel)
 *                 example: "2026-02-15"
 *               heure:
 *                 type: string
 *                 format: time
 *                 description: Modifier l'heure (optionnel)
 *                 example: "10:30"
 *     responses:
 *       200:
 *         description: Docteur assigné avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Rendez-vous assigné au Dr. Martin"
 *                 data:
 *                   $ref: '#/components/schemas/RendezVous'
 *       400:
 *         description: Impossible d'assigner (mauvais statut)
 *       404:
 *         description: Rendez-vous ou docteur non trouvé
 */
router.put('/assigner-docteur/:id', authenticateToken, checkRole(['secretaire']), secretaireController.assignerDocteur);

/**
 * @swagger
 * /api/secretaires/rendez-vous:
 *   get:
 *     summary: Voir tous les rendez-vous
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche tous les rendez-vous de la clinique avec possibilité de filtrer
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente_secretaire, en_attente_docteur, accepte, refuse, annule]
 *         description: Filtrer par statut
 *         example: accepte
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrer par date (YYYY-MM-DD)
 *         example: "2026-02-15"
 *     responses:
 *       200:
 *         description: Liste de tous les rendez-vous
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
 */
router.get('/rendez-vous', authenticateToken, checkRole(['secretaire']), secretaireController.getTousRendezVous);

/**
 * @swagger
 * /api/secretaires/rendez-vous:
 *   post:
 *     summary: Planifier un rendez-vous directement
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Crée un rendez-vous directement avec un patient et un docteur (statut "en_attente_docteur")
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - docteur_id
 *               - date
 *               - heure
 *             properties:
 *               patient_id:
 *                 type: integer
 *                 description: ID du patient
 *                 example: 1
 *               docteur_id:
 *                 type: integer
 *                 description: ID du docteur
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-20"
 *               heure:
 *                 type: string
 *                 format: time
 *                 example: "14:00"
 *               symptomes:
 *                 type: string
 *                 description: Raison de la consultation
 *                 example: "Check-up annuel"
 *     responses:
 *       201:
 *         description: Rendez-vous planifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Patient ou docteur non trouvé
 */
router.post('/rendez-vous', authenticateToken, checkRole(['secretaire']), secretaireController.planifierRendezVous);

/**
 * @swagger
 * /api/secretaires/rendez-vous/{id}:
 *   put:
 *     summary: Modifier un rendez-vous
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Modifie les informations d'un rendez-vous (date, heure, docteur, statut)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-16"
 *               heure:
 *                 type: string
 *                 format: time
 *                 example: "11:00"
 *               docteur_id:
 *                 type: integer
 *                 example: 2
 *               statut:
 *                 type: string
 *                 enum: [en_attente_secretaire, en_attente_docteur, accepte, refuse, annule]
 *                 example: en_attente_docteur
 *     responses:
 *       200:
 *         description: Rendez-vous modifié avec succès
 *       404:
 *         description: Rendez-vous ou docteur non trouvé
 */
router.put('/rendez-vous/:id', authenticateToken, checkRole(['secretaire']), secretaireController.modifierRendezVous);

/**
 * @swagger
 * /api/secretaires/rendez-vous/{id}:
 *   delete:
 *     summary: Annuler un rendez-vous
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous
 *     responses:
 *       200:
 *         description: Rendez-vous annulé avec succès
 *       404:
 *         description: Rendez-vous non trouvé
 */
router.delete('/rendez-vous/:id', authenticateToken, checkRole(['secretaire']), secretaireController.annulerRendezVous);

/**
 * @swagger
 * /api/secretaires/statistiques:
 *   get:
 *     summary: Voir les statistiques de la clinique
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche les statistiques globales de la clinique (rendez-vous, patients, docteurs)
 *     responses:
 *       200:
 *         description: Statistiques de la clinique
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_rendez_vous:
 *                       type: integer
 *                       example: 50
 *                     en_attente_secretaire:
 *                       type: integer
 *                       example: 5
 *                     en_attente_docteur:
 *                       type: integer
 *                       example: 10
 *                     acceptes:
 *                       type: integer
 *                       example: 30
 *                     refuses:
 *                       type: integer
 *                       example: 3
 *                     annules:
 *                       type: integer
 *                       example: 2
 *                     total_patients:
 *                       type: integer
 *                       example: 25
 *                     total_docteurs:
 *                       type: integer
 *                       example: 5
 *                     docteurs_libres:
 *                       type: integer
 *                       example: 3
 *                     docteurs_occupes:
 *                       type: integer
 *                       example: 2
 */
router.get('/statistiques', authenticateToken, checkRole(['secretaire']), secretaireController.getStatistiques);

/**
 * @swagger
 * /api/secretaires/docteurs:
 *   get:
 *     summary: Obtenir la liste de tous les docteurs
 *     tags: [Secrétaire]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de tous les docteurs pour pouvoir les assigner aux rendez-vous
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
 *       401:
 *         description: Non authentifié
 */
router.get('/docteurs', authenticateToken, checkRole(['secretaire']), secretaireController.getTousDocteurs);

module.exports = router;
