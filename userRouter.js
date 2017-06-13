const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const morgan = require('morgan');
const {PORT, DATABASE_URL} = require('./config');
const {User} = require('./models/user');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

const strategy = new LocalStrategy(
  (username, password, cb) => {
    console.log('hello! ', username, password);
    User
      .findOne({username})
      .exec()
      .then(user => {
        console.log('greetings!', user);
        if (!user) {
          return cb(null, false, {
            message: 'Incorrect username'
          });
        }
        user
        .validatePassword(password)
        .then(valid => {
          console.log('valid: ', valid)
        if (!valid) {
          return cb(null, false, 'Incorrect password');
        }
        return cb(null, user);
      })
        })
      .catch(err => cb(err))
});

passport.use(strategy);

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

passport.deserializeUser(function(id, cb){
  User.findById(id, function(err, user){
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});


router.post('/login', passport.authenticate('local'), function(req,res){
	res.status(200).send({});
})

router.post('/user', (req, res, next) => {
	console.log("This is:" + req.body);
  if (!req.body) {
    return res.status(400).json({message: 'No request body'});
  }

  if (!('username' in req.body)) {
    return res.status(422).json({message: 'Missing field: username'});
  }

  let {username, password, firstName, lastName} = req.body;

  if (typeof username !== 'string') {
    return res.status(422).json({message: 'Incorrect field type: username'});
  }

  username = username.trim();

  if (username === '') {
    return res.status(422).json({message: 'Incorrect field length: username'});
  }

  if (!(password)) {
    return res.status(422).json({message: 'Missing field: password'});
  }

  if (typeof password !== 'string') {
    return res.status(422).json({message: 'Incorrect field type: password'});
  }

  password = password.trim();

  if (password === '') {
    return res.status(422).json({message: 'Incorrect field length: password'});
  }

  // check for existing user
  return User
    .find({username})
    .count()
    .exec()
    .then(count => {
      if (count > 0) {
        return res.status(422).json({message: 'username already taken'});
      }
      // if no existing user, hash password
      return User.hashPassword(password)
    })
    .then(hash => {
      return User
        .create({
          username: username,
          password: hash
        })
    })
    .then(user => {
      //return res.status(201).json(user);
       return next();
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'})
    });
}, passport.authenticate('local'), function(req,res){
  res.status(200).send({});
});

module.exports = router;