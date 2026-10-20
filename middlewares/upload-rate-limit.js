const { rateLimit } = require('express-rate-limit')

// Limite de débit sur l'ajout de projets : 20 ajouts par adresse IP toutes les 15 minutes.
// Au-delà, le serveur répond 429 (Too Many Requests) sans même lire l'image envoyée.
// L'IP du visiteur est lue dans l'en-tête X-Forwarded-For grâce à app.set('trust proxy', 1) (app.js) :
// sans ça, derrière le proxy d'Alwaysdata, tous les visiteurs auraient la même IP.
module.exports = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes, en millisecondes
	limit: 20,
	standardHeaders: 'draft-8', // en-têtes RateLimit : indique au client combien d'envois il lui reste
	legacyHeaders: false,
	message: { error: 'Trop d\'ajouts, réessayez dans 15 minutes' }
})
