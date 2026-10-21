const multer = require('multer')
const os = require('os')

// L'image reçue est écrite dans le dossier temporaire du système (req.file.path), pas gardée en mémoire :
// le serveur ne garde pas les 10 Mo en mémoire. optimize-image.js la convertit ensuite en WebP
// dans images/, puis supprime ce fichier temporaire
module.exports = multer({
	dest: os.tmpdir(),
	limits: { fileSize: 10 * 1024 * 1024 } // 10 Mo maximum (garde-fou : Sharp réduit ensuite l'image)
}).single('image')
