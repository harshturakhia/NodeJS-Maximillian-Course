const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user')
const authController = require('../controllers/auth');
const userValidator = require('../validators/user')

router.get('/login', authController.getLogin);

router.post('/login', userValidator.login, authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup', userValidator.signup, authController.postSignup);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

module.exports = router;
