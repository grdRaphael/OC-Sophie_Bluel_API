// Convertit en WebP (1200 px max, qualité 80) toutes les images .png / .jpg du dossier images/
// Utilisation, depuis le dossier Backend : node scripts/convertir-images.js
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const dossier = path.join(__dirname, '..', 'images')

const convertir = async () => {
	const fichiers = fs.readdirSync(dossier).filter(fichier => /\.(png|jpe?g)$/i.test(fichier))

	for (const fichier of fichiers) {
		const source = path.join(dossier, fichier)
		const destination = path.join(dossier, path.parse(fichier).name + '.webp')

		await sharp(source)
			.rotate()
			.resize({ width: 1200, withoutEnlargement: true })
			.webp({ quality: 80 })
			.toFile(destination)

		const avant = Math.round(fs.statSync(source).size / 1024)
		const apres = Math.round(fs.statSync(destination).size / 1024)
		console.log(`${fichier} : ${avant} Ko → ${apres} Ko`)
	}
}

convertir()
