const User = require('../models/user')

const { body } = require('express-validator')

module.exports.login = [
    body('email')
        .isEmail()
        .withMessage('Invalid email')
];

module.exports.signup = [

    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value) => {
            return User
                .findOne({ email: value })
                .then(user => {
                    if (user) {
                        return Promise.reject('This email already exist, please use another email');
                    }
                    return true;
                });
        })
        .normalizeEmail(),

    body('password' , 'Password has to be atleast 3 characters long')
        .isLength({ min: 3 })
        .matches(/^[A-Za-z0-9@#\$%\^\&*\)\(+=._-]+$/)
        // .isAlphanumeric()
        .withMessage('Password can contain spcial characters, letters and numbers'),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) throw new Error('Passwords do not match');
            return true;
        })
];