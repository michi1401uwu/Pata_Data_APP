const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');

router.post('/registro', ctrl.registro);
router.post('/login', ctrl.login);
router.get('/protegido', verificarToken, ctrl.protegido);

module.exports = router;
