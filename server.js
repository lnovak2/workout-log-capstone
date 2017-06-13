const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const morgan = require('morgan');
const {PORT, DATABASE_URL} = require('./config');
const {User} = require('./models/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const workoutLogRouter = require('./workoutLogRouter');
const apiRouter = require('./apiRouter');
const userRouter = require('./userRouter');

const app = express();
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(require('cookie-parser')());

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