const cookies = require('../util/cookie');
const bcrypt = require("bcryptjs")
const nodemailer = require('nodemailer')

const { validationResult } = require('express-validator')

const User = require('../models/user');

// GET - Login

module.exports.getLogin = (req, res, next) => {

    // const isLoggedIn = req
    //     .get('Cookie')
    //     .split(';')[1]
    //     .trim()
    //     .split('=')[1];

    //console.log(req.session.isLoggedIn)

    let message = req.flash('error');
    if (message.length <= 0) message = null;

    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: { email: '', password: '' },
        validationErrors: []
    });
};

// POST - Login
module.exports.postLogin = (req, res, next) => {

    // res.setHeader('Set-Cookie', 'lo  ggedIn=true; Max-Age=10; httpOnly');
    // res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age:10; Secure');

    // Cookie
    // req.isLoggedIn = true                                                 // this will not work as new req will be there after sending the response
    // res.setHeader('Set-Cookie', 'loggedIn = true; HttpOnly')             // Now the cookie is set and browser send everytime this cookie when req is sent
    // res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age=10; httpOnly');
    // res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age:10; Secure');


    // Session
    // User
    //     .findById('66629b8a4af5bc3080923ca0')
    //     .then(user => {
    //         req.session.user = user;
    //         req.session.isLoggedIn = true;

    //         req.session.save(err => {
    //             if (err) console.log(err);
    //             res.redirect('/');
    //         });
    //     })
    //     .catch(err => console.log(err));


    //For Signin
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.array()) {
        return res
            .status(422)
            .render('auth/login',
                {
                    pageTitle: 'login',
                    path: '/login',
                    isAuthenticated: false,
                    errorMessage: errors.array()[0].msg,
                    oldInput:
                    {
                        email: email, password: password,
                    },
                    validationErrors: errors.array()
                });
    }


    User
        .findOne({ email: email })
        .then(user => {
            if (user) {
                bcrypt
                    .compare(password, user.password)
                    .then(matched => {
                        if (matched) {
                            req.session.user = user;
                            req.session.isLoggedIn = true;

                            req.session.save(err => {
                                if (err) console.log(err);

                                res.redirect('/');
                                req.flash('success', 'User loggedin successfully!')
                            });
                        }
                        else {
                            res
                                .status(422)
                                .render('auth/login', {
                                    pageTitle: 'Login',
                                    path: '/login',
                                    isAuthenticated: req.session.isLoggedIn,
                                    errorMessage: ['Password did not match'],
                                    oldInput: { email: email },
                                    validationErrors: [{ param: 'password' }]
                                });
                        }
                    })
                    .catch(err => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            }
            else {
                res
                    .status(422)
                    .render('auth/login', {
                        pageTitle: 'Login',
                        path: '/login',
                        isAuthenticated: req.session.isLoggedIn,
                        errorMessage: ['Wrong Email Address'],
                        oldInput: { email: email },
                        validationErrors: [{ param: 'email' }]
                    });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// POST - Logout
module.exports.postLogout = (req, res, next) => {
    req.session.isLoggedIn = false;
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/');
    });
}

// GET - Signup
module.exports.getSignup = (req, res, next) => {

    let message = req.flash('error');
    if (message.length <= 0) message = null;

    res.render('auth/signup', {
        pageTitle: 'signup',
        path: '/signup',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: '', password: '', confirmPassword: '',
        },
        validationErrors: [],
    });

};

// POST - Signup
module.exports.postSignup = (req, res, next) => {

    const { email, password } = req.body;
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/signup', {
            pageTitle: 'signup',
            path: '/signup',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email, password: password, confirmPassword: req.body.confirmPassword,
            },
            validationErrors: errors.array()
        });
    }

    // User.findOne({ email: email })
    //     .then((user) => {
    //         if (user) {
    //             req.flash('error', 'Email already exists, please use another email');
    //             return res.redirect('/signup');
    //         }

    bcrypt
        .hash(password, 12)
        .then(hashPass => {
            const newUser = new User({
                email: email,
                password: hashPass,
                cart: {
                    item: []
                }
            });
            return newUser.save()
        })
        .then((result) => {
            res.redirect("/login")
        })

};

// GET - Reset
module.exports.getReset = (req, res) => {

    res.render('auth/reset', {
        pageTitle: 'reset',
        path: '/reset',
        isAuthenticated: req.session.isLoggedIn,
    });
}

// POST - Reset
module.exports.postReset = async (req, res) => {

    let testAccount = await nodemailer.createTestAccount();

    try {
        // connect with the smtp
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'olaf84@ethereal.email',
                pass: '3KAb8P8gKRBbHfyfsU'
            }
        });

        // Enable detailed logging
        transporter.on('log', console.log);
        transporter.on('error', console.error);

        let info = await transporter.sendMail({

            from: '<olaf84@ethereal.email>',
            to: "harshturakhia2002@gmail.com",
            subject: "Hello ",
            text: "Hello",
            html: "<b>Hello</b>",

        });
        console.log("Message sent: %s", info);
        res.json(info);
    }
    catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    };

}