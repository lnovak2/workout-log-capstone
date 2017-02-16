const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

router.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

router.get('/workout-form', (req, res) => {
  res.sendFile(__dirname + '/public/workout-form.html');
});

router.get('/current-day', (req, res) => {
  res.sendFile(__dirname + '/public/current-day.html');
});

router.get('/calendar', (req, res) => {
  res.sendFile(__dirname + '/public/calendar.html');
});

module.exports = router;