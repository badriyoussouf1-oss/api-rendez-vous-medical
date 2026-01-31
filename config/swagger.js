const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Clinique - Gestion de Rendez-vous Médical',
      version: '1.0.0',
      description: 'API REST pour la gestion des rendez-vous médicaux'
    },
    servers: [
      { url: 'http://localhost:3000' }
    ],
    components: {
      // 🔐 SÉCURITÉ
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header'
        }
      },
      // 📦 SCHÉMAS
      schemas: {
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telephone: { type: 'string' },
            role: { type: 'string', enum: ['admin'] }
          }
        },
        Docteur: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            specialite: { type: 'string' },
            role: { type: 'string', enum: ['docteur'] }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telephone: { type: 'string' },
            role: { type: 'string', enum: ['patient'] }
          }
        },
        Secretaire: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['secretaire'] }
          }
        },
        RendezVous: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            heure: { type: 'string', example: '10:30' },
            statut: {
              type: 'string',
              enum: [
                'en_attente_secretaire',
                'en_attente_docteur',
                'accepte',
                'refuse',
                'annule'
              ]
            },
            patient_id: { type: 'integer' },
            docteur_id: { type: 'integer', nullable: true },
            patient: {
              $ref: '#/components/schemas/Patient'
            },
            docteur: {
              $ref: '#/components/schemas/Docteur'
            }
          }
        },
        // ✅ ADD MISSING SCHEMAS HERE
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nom: { type: 'string' },
                prenom: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
module.exports = { swaggerUi, swaggerSpec };