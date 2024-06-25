const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash')
const multer = require('multer');
const fs = require('fs');

const errorsController = require('./controllers/errors.js');

// Routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// Models
const User = require('./models/user');

const app = express();
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/Nodejs',
    collection: 'sessions',
    ttl: 60 * 1,
});


// File Storage
const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        callback(null, new Date().toISOString().replace(/:/g, '-') + "-" + file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    const fileTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (fileTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Session implementation
app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    store: store
    // cookie: {},                          // No need as session middleware automatically saves the cookie object for upu
}));

app.use(flash())


// Middleware
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User
        .findById(req.session.user._id)
        .then(user => {
            if (!user) {

                return next(new Error('User not found.'));
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
})



// Routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorsController.get404);

// Error middleware
// It occurs automatically without any of the above middleware when any error occurs
app.use((error, req, res, next) => {
    res.status(500).render('500', { pageTitle: 'Error!', path: '/500', isAuthenticated: true });
});


mongoose
    .connect('mongodb://localhost:27017/Nodejs', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(9898, console.log('http://localhost:9898'));
    })
    .catch(err => console.log(err));    
