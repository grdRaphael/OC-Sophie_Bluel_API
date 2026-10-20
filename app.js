const express = require('express');
const path = require('path');
const cors = require('cors')
require('dotenv').config();
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')
const swaggerDocs = yaml.load(path.join(__dirname, 'swagger.yaml'))
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
module.exports = app;
