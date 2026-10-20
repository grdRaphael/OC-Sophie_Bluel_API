const express = require('express');
const router = express.Router();
const multer = require('../middlewares/multer-config');
const auth = require('../middlewares/auth');
const checkWork = require('../middlewares/checkWork');
const optimizeImage = require('../middlewares/optimize-image');
const uploadRateLimit = require('../middlewares/upload-rate-limit');
const checkWorksLimit = require('../middlewares/check-works-limit');
const workCtrl = require('../controllers/works.controller');

// Les vérifications les moins coûteuses d'abord : on refuse le plus tôt possible,
// avant de recevoir l'image (multer) et de la traiter (sharp)
router.post('/', uploadRateLimit, auth, checkWorksLimit, multer, optimizeImage, checkWork, workCtrl.create);
router.get('/', workCtrl.findAll);
router.delete('/:id', auth, workCtrl.delete);

module.exports = router;
