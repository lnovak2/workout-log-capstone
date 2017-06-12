const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const morgan = require('morgan');
const {PORT, DATABASE_URL} = require('./config');
const {User} = require('./models/user');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

// const strategy = new LocalStrategy(
//   (username, password, cb) => {
//   	console.log('hello! ', username, password);
//     User
//       .findOne({username})
//       .exec()
//       .then(user => {
//       	console.log('greetings!', user);
//         if (!user) {
//           return cb(null, false, {
//             message: 'Incorrect username'
//           });
//         }
//         user
//         .validatePassword(password)
//         .then(valid => {
//         	console.log('valid: ', valid)
//         if (!valid) {
//           return cb(null, false, 'Incorrect password');
//         }
//         return cb(null, user);
//       })
//         })
//       .catch(err => cb(err))
// });

// passport.use(strategy);

// passport.serializeUser(function(user, cb) {
//   cb(null, user._id);
// });

// passport.deserializeUser(function(id, cb){
// 	User.findById(id, function(err, user){
// 		if (err) {
// 			return cb(err);
// 		}
// 		cb(null, user);
// 	});
// });

const app = express();
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(require('cookie-parser')());
//app.use(require('express-session'));
var store = new MongoDBStore(
{
	uri: DATABASE_URL,
    collection: 'workoutsDatabase'
});

store.on('error', function(error) {
      assert.ifError(error);
      assert.ok(false);
    });

app.use(require('express-session')({
    secret: 'secret',
    name: 'cookie-name',
    store: store, // connect-mongo session store
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// User.create({
// 	username: "Luke Novak", 
// 	password: "Bears"
// });

// app.post('/login', passport.authenticate('local'), function(req,res){
// 	res.status(200).send({});
// })

// app.post('/user', (req, res) => {
// 	console.log(req.body);
//   if (!req.body) {
//     return res.status(400).json({message: 'No request body'});
//   }

//   if (!('username' in req.body)) {
//     return res.status(422).json({message: 'Missing field: username'});
//   }

//   let {username, password, firstName, lastName} = req.body;

//   if (typeof username !== 'string') {
//     return res.status(422).json({message: 'Incorrect field type: username'});
//   }

//   username = username.trim();

//   if (username === '') {
//     return res.status(422).json({message: 'Incorrect field length: username'});
//   }

//   if (!(password)) {
//     return res.status(422).json({message: 'Missing field: password'});
//   }

//   if (typeof password !== 'string') {
//     return res.status(422).json({message: 'Incorrect field type: password'});
//   }

//   password = password.trim();

//   if (password === '') {
//     return res.status(422).json({message: 'Incorrect field length: password'});
//   }

//   // check for existing user
//   return User
//     .find({username})
//     .count()
//     .exec()
//     .then(count => {
//       if (count > 0) {
//         return res.status(422).json({message: 'username already taken'});
//       }
//       // if no existing user, hash password
//       return User.hashPassword(password)
//     })
//     .then(hash => {
//       return User
//         .create({
//           username: username,
//           password: hash
//         })
//     })
//     .then(user => {
//       return res.status(201).json(user);
//     })
//     .catch(err => {
//       res.status(500).json({message: 'Internal server error'})
//     });
// });
  

const workoutLogRouter = require('./workoutLogRouter');
const apiRouter = require('./apiRouter');
const userRouter = require('./userRouter');

app.use('/', workoutLogRouter);

app.use('/api/', apiRouter);

app.use('/', userRouter);

app.use(express.static('public'));

mongoose.Promise = global.Promise;

process.env.TZ = "America/Chicago";

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
  	mongoose.connect(databaseUrl, (err) => {
  		if(err){
  			return reject(err);
  		}
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
	});
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};