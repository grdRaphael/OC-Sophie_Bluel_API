const db = require('../models')
const Works = db.works

// Démo publique : 20 projets maximum en base, pour que le disque ne puisse pas déborder
// même si quelqu'un contourne la limite de débit en changeant d'IP.
// (La remise à zéro de chaque nuit remet les 11 projets d'origine.)
const MAX_WORKS = 20

module.exports = async (req, res, next) => {
	try {
		const count = await Works.count()
		if (count >= MAX_WORKS) {
			return res.status(403).json({ error: `Limite de ${MAX_WORKS} projets atteinte pour la démo` })
		}
		next()
	} catch (error) {
		return res.status(500).json({ error: 'Something went wrong' })
	}
}
