const { fork } = require('child_process')
const fs = require('fs')
const path = require('path')

// Sharp n'est jamais chargé dans le serveur : chaque image est optimisée par scripts/optimize-worker.js,
// lancé dans un processus à part qui s'arrête ensuite. Le serveur reste léger (environ 25 Mo de moins)
// et la mémoire utilisée pendant le traitement est entièrement rendue au système.
const WORKER = path.join(__dirname, '..', 'scripts', 'optimize-worker.js')

// File d'attente : une seule image traitée à la fois, même si plusieurs visiteurs envoient en même temps
// (deux workers en parallèle doubleraient le pic de mémoire). Chaque traitement attend la fin du précédent.
let queue = Promise.resolve()
const inQueue = task => {
	const result = queue.then(task)
	queue = result.catch(() => {})
	return result
}

// Lance le worker et attend sa réponse : null si tout va bien, sinon 'format', 'pixels' ou 'invalid'.
// 'crash' si le worker s'arrête sans répondre (ex. manque de mémoire)
const runWorker = (input, output) => new Promise(resolve => {
	const worker = fork(WORKER, [input, output])
	let error = 'crash'
	worker.on('message', message => { error = message.error })
	worker.on('exit', () => resolve(error))
})

// Optimise l'image envoyée avant de l'enregistrer (détail des règles dans scripts/optimize-worker.js) :
// formats JPEG, PNG ou WebP, 40 millions de pixels maximum, 1200 px de large maximum, WebP qualité 80
module.exports = async (req, res, next) => {
	// Pas de fichier : on laisse checkWork renvoyer son erreur habituelle
	if (!req.file) {
		return next()
	}

	// Même logique de nom qu'avant : espaces remplacés, extension retirée, date ajoutée
	const name = path.parse(req.file.originalname).name.split(' ').join('_')
	const filename = `${name}${Date.now()}.webp`

	const error = await inQueue(() => runWorker(req.file.path, path.join(__dirname, '..', 'images', filename)))

	// Le fichier temporaire reçu par multer ne sert plus, quel que soit le résultat
	fs.unlink(req.file.path, () => {})

	if (error === 'format') {
		return res.status(400).json({ error: 'Format non accepté (jpg, png ou webp uniquement)' })
	}
	if (error === 'pixels') {
		return res.status(400).json({ error: 'Image trop grande (40 millions de pixels maximum)' })
	}
	if (error === 'invalid') {
		return res.status(400).json({ error: 'Image invalide' })
	}
	if (error) {
		return res.status(500).json({ error: 'Something went wrong' })
	}

	// checkWork et le contrôleur lisent req.file.filename pour construire l'URL
	req.file.filename = filename
	next()
}
