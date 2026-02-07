const express = require('express');
const router = express.Router();
const docteurController = require('../controllers/docteurController');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/docteurs/login:
 *   post:
 *     summary: Connexion docteur
 *     tags: [Docteur]
 *     description: Connexion d'un docteur (compte créé par l'admin)
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
 *                 example: jean.martin@clinique.com
 *               mot_de_passe:
 *                 type: string
 *                 format: password
 *                 example: Doctor@123
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
router.post('/login', docteurController.login);



/**
 * @swagger
 * /api/docteurs/logout:
 *   post:
 *     summary: Déconnexion docteur
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authenticateToken, checkRole(['docteur']), docteurController.logout);

/**
 * @swagger
 * /api/docteurs/mes-rendez-vous:
 *   get:
 *     summary: Voir ses rendez-vous
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche tous les rendez-vous assignés à ce docteur. Possibilité de filtrer par statut.
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente_docteur, accepte, refuse]
 *         description: Filtrer par statut (optionnel)
 *         example: en_attente_docteur
 *     responses:
 *       200:
 *         description: Liste des rendez-vous
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
router.get('/mes-rendez-vous', authenticateToken, checkRole(['docteur']), docteurController.getMesRendezVous);

/**
 * @swagger
 * /api/docteurs/rendez-vous/{id}/accepter:
 *   put:
 *     summary: Accepter un rendez-vous
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     description: Change le statut du rendez-vous de "en_attente_docteur" à "accepte"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous
 *     responses:
 *       200:
 *         description: Rendez-vous accepté avec succès
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
 *                   example: "Rendez-vous accepté avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/RendezVous'
 *       400:
 *         description: Impossible d'accepter ce rendez-vous (mauvais statut)
 *       404:
 *         description: Rendez-vous non trouvé ou non assigné à ce docteur
 *       401:
 *         description: Non authentifié
 */
router.put('/rendez-vous/:id/accepter', authenticateToken, checkRole(['docteur']), docteurController.accepterRendezVous);

/**
 * @swagger
 * /api/docteurs/rendez-vous/{id}/refuser:
 *   put:
 *     summary: Refuser un rendez-vous
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     description: Change le statut du rendez-vous de "en_attente_docteur" à "refuse". La secrétaire sera notifiée pour réassigner.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rendez-vous
 *     responses:
 *       200:
 *         description: Rendez-vous refusé
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
 *                   example: "Rendez-vous refusé. La secrétaire sera notifiée."
 *                 data:
 *                   $ref: '#/components/schemas/RendezVous'
 *       400:
 *         description: Impossible de refuser ce rendez-vous
 *       404:
 *         description: Rendez-vous non trouvé
 */
router.put('/rendez-vous/:id/refuser', authenticateToken, checkRole(['docteur']), docteurController.refuserRendezVous);

/**
 * @swagger
 * /api/docteurs/statut:
 *   put:
 *     summary: Changer son statut
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     description: Change le statut du docteur entre "libre" et "occupe"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [libre, occupe]
 *                 example: occupe
 *     responses:
 *       200:
 *         description: Statut changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: 'Statut changé en "occupe" avec succès'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     statut:
 *                       type: string
 *       400:
 *         description: Statut invalide
 *       401:
 *         description: Non authentifié
 */
router.put('/statut', authenticateToken, checkRole(['docteur']), docteurController.changerStatut);

/**
 * @swagger
 * /api/docteurs/calendrier:
 *   get:
 *     summary: Voir son calendrier
 *     tags: [Docteur]
 *     security:
 *       - bearerAuth: []
 *     description: Affiche les rendez-vous acceptés du docteur. Possibilité de filtrer par période.
 *     parameters:
 *       - in: query
 *         name: date_debut
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début (YYYY-MM-DD)
 *         example: "2026-02-01"
 *       - in: query
 *         name: date_fin
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin (YYYY-MM-DD)
 *         example: "2026-02-28"
 *     responses:
 *       200:
 *         description: Calendrier des rendez-vous acceptés
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
router.get('/calendrier', authenticateToken, checkRole(['docteur']), docteurController.getCalendrier);

module.exports = router;
