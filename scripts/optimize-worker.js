// Optimise UNE image puis s'arrête. Lancé par middlewares/optimize-image.js dans un processus à part :
// quand ce processus se termine, le système récupère toute la mémoire utilisée par Sharp
// (dans le serveur, elle resterait occupée jusqu'à son redémarrage).
// Lancé avec fork(worker, [<image reçue>, <fichier WebP à créer>]).
// Répond au serveur par process.send : { error: null } si tout va bien, sinon { error: 'format' | 'pixels' | 'invalid' }
const sharp = require('sharp')

// Une seule image traitée, sans cache
sharp.cache(false)
sharp.concurrency(1)

// Formats acceptés, détectés par Sharp dans le CONTENU du fichier (pas d'après son extension)
const ACCEPTED_FORMATS = ['jpeg', 'png', 'webp']
// 40 millions de pixels maximum (ex. 7700 × 5200) : protège la mémoire contre les
// "bombes de décompression" (fichier léger, mais image énorme une fois décodée)
const MAX_PIXELS = 40 * 1000 * 1000

const [input, output] = process.argv.slice(2)

// Envoie la réponse au serveur, puis s'arrête (le canal de communication garderait sinon le processus en vie)
const reply = error => process.send({ error }, () => process.exit())

const optimize = async () => {
	try {
		// limitInputPixels : au-delà, Sharp refuse l'image avant même de la décoder (voir le catch)
		const image = sharp(input, { limitInputPixels: MAX_PIXELS })

		// Lit seulement l'en-tête de l'image (rapide, sans la décoder) pour connaître son vrai format
		const { format } = await image.metadata()
		if (!ACCEPTED_FORMATS.includes(format)) {
			return reply('format')
		}

		// - redimensionnée à 1200 px de large maximum (jamais agrandie)
		// - convertie en WebP qualité 80 (visuellement identique, 5 à 10 fois plus léger)
		await image
			.rotate() // remet droites les photos de téléphone (orientation EXIF)
			.resize({ width: 1200, withoutEnlargement: true })
			.webp({ quality: 80 })
			.toFile(output)

		reply(null)
	} catch (error) {
		// Image plus grande que MAX_PIXELS (erreur levée par limitInputPixels),
		// sinon Sharp n'arrive pas à lire le fichier : ce n'est pas une vraie image
		reply(error.message.includes('pixel limit') ? 'pixels' : 'invalid')
	}
}

optimize()
