const multer = require('multer')

// L'image reste en mémoire (req.file.buffer) au lieu d'être écrite sur le disque :
// c'est le middleware optimize-image.js qui l'enregistre ensuite, en WebP
const storage = multer.memoryStorage()

module.exports = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 } // 10 Mo maximum (garde-fou : Sharp réduit ensuite l'image)
}).single('image')
