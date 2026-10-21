const express = require('express');
const path = require('path');
const cors = require('cors')
require('dotenv').config();
const helmet = require('helmet');
const app = express()

// Derrière le proxy HTTPS d'Alwaysdata : lit l'en-tête X-Forwarded-Proto pour que req.protocol vaille "https"
app.set('trust proxy', 1)


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet({
      crossOriginResourcePolicy: false,
    }));
// Cache navigateur de 30 jours pour les images : un fichier ne change jamais sous le même nom
// (chaque envoi reçoit un nom unique avec la date), donc "immutable" évite même la revérification
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '30d', immutable: true }))

const db = require("./models");
const userRoutes = require('./routes/user.routes');
const categoriesRoutes = require('./routes/categories.routes');
const worksRoutes = require('./routes/works.routes');
db.sequelize.sync().then(()=> console.log('db is ready'));
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/works', worksRoutes);
// Documentation Swagger servie en simples fichiers : notre page (docs/) + l'interface (swagger-ui-dist).
// require.resolve trouve le dossier du paquet SANS l'exécuter : require('swagger-ui-dist') chargerait
// tout le JavaScript de l'interface dans le serveur (environ 40 Mo de mémoire, pour rien)
const swaggerUiDir = path.dirname(require.resolve('swagger-ui-dist/package.json'))
app.use('/api-docs', express.static(path.join(__dirname, 'docs')), express.static(swaggerUiDir))
module.exports = app;
