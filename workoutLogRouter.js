const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }
    res.redirect('login');
}

router.get('/', isAuthenticated, (req, res) => {
    res.redirect('current-day');
});

router.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login-screen.html');
});

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('login'); //Inside a callback… bulletproof!
    });
});

router.get('/workout-form', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/workout-form.html');
});

router.get('/exercise-form', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/exercise-form.html');
});

router.get('/current-day', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/current-day.html');
});

router.get('/calendar', (req, res) => {
    res.sendFile(__dirname + '/public/calendar.html');
});


module.exports = router;
