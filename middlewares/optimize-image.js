const sharp = require('sharp')
const path = require('path')

// Serveur gratuit avec peu de mémoire : une seule image traitée à la fois, sans cache
sharp.cache(false)
sharp.concurrency(1)

// Formats acceptés, détectés par Sharp dans le CONTENU du fichier (pas d'après son extension)
const ACCEPTED_FORMATS = ['jpeg', 'png', 'webp']
// 40 millions de pixels maximum (ex. 7700 × 5200) : protège la mémoire contre les
// "bombes de décompression" (fichier léger, mais image énorme une fois décodée)
const MAX_PIXELS = 40 * 1000 * 1000

// Optimise l'image envoyée avant de l'enregistrer :
// - redimensionnée à 1200 px de large maximum (jamais agrandie)
// - convertie en WebP qualité 80 (visuellement identique, 5 à 10 fois plus léger)
module.exports = async (req, res, next) => {
	// Pas de fichier : on laisse checkWork renvoyer son erreur habituelle
	if (!req.file) {
		return next()
	}
	try {
		// limitInputPixels : au-delà, Sharp refuse l'image avant même de la décoder (voir le catch)
		const image = sharp(req.file.buffer, { limitInputPixels: MAX_PIXELS })

		// Lit seulement l'en-tête de l'image (rapide, sans la décoder) pour connaître son vrai format
		const { format } = await image.metadata()
		if (!ACCEPTED_FORMATS.includes(format)) {
			return res.status(400).json({ error: 'Format non accepté (jpg, png ou webp uniquement)' })
		}

		// Même logique de nom qu'avant : espaces remplacés, extension retirée, date ajoutée
		const name = path.parse(req.file.originalname).name.split(' ').join('_')
		const filename = `${name}${Date.now()}.webp`

		await image
			.rotate() // remet droites les photos de téléphone (orientation EXIF)
			.resize({ width: 1200, withoutEnlargement: true })
			.webp({ quality: 80 })
			.toFile(path.join(__dirname, '..', 'images', filename))

		// checkWork et le contrôleur lisent req.file.filename pour construire l'URL
		req.file.filename = filename
		next()
	} catch (error) {
		// Image plus grande que MAX_PIXELS (erreur levée par limitInputPixels)
		if (error.message.includes('pixel limit')) {
			return res.status(400).json({ error: 'Image trop grande (40 millions de pixels maximum)' })
		}
		// Sharp n'arrive pas à lire le fichier : ce n'est pas une vraie image
		return res.status(400).json({ error: 'Image invalide' })
	}
}
