const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const should = chai.should();

const {User} = require('../models/user')
const {Workout} = require('../models/workout');
const {Exercise} = require('../models/exercise');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedWorkoutData(){
	console.info('seeding workout data');
	return generateUser()
	.then(function(userData) {
		console.log(userData)
		return User.create(userData);
	})
	.then(function(user){
		console.log(user);
		return Workout.insertMany(generateWorkout(user));
	})
	.then(function(workout){
		return Exercise.insertMany(generateExercises(workout));
	})
}

function generateUser() {
	return User.hashPassword("Steve")
	.then(function(hash) {
		return {username: "Steve", password: hash};
	})
}

function generateWorkout(user){
	const workouts = [
		{
			user: user._id,
			name: "Morning"
		}, 
		{
			user: user._id,
			name: "Afternoon"
		}, 
		{
			user: user._id,
			name: "Evening"
		},
		{
			user: user._id,
			name: "Best"
		} 
		];
	return workouts[0];
}

function generateExercises(workout){
	const exercises = [
		{
			name: "Flat Bench Press",
			weight: "400",
			reps: "10"
		},
				{
			name: "Flat Bench Press",
			weight: "400",
			reps: "8"
		},
				{
			name: "Flat Bench Press",
			weight: "400",
			reps: "6"
		},
				{
			name: "Flat Bench Press",
			weight: "400",
			reps: "4"
		}
	];
	return exercises[0];
}

function generateWorkoutData(){
	return {
		name: faker.name.title()
	};
};

function generateExerciseData(){
	return {
		name: faker.name.title(),
		weight: faker.random.number(),
		reps: faker.random.number()
	};
};

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
};

var Cookies;

describe("Workout API resource", function(){

	before(function() {
		console.log(TEST_DATABASE_URL)
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function(done){
		seedWorkoutData()
		.then(function (){
		  chai.request(app)
		    .post('/login')
		    .set('contentType', 'application/json')
		    .send({username: 'Steve', password: 'Steve'})
		    .end(function(err, res){
		  	  Cookies = res.headers['set-cookie'].pop().split(';')[0];
		  	  done();
		  })
		});
	});

	afterEach(function(){
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe("GET workout endpoint", function(){

		it("should return all workouts on the current day", function(){
		  // User.find().then(function(users){
		  // 	console.log(users);
		  // });
		  let res;
		  var req = chai.request(app).get('/api/workout');
		  req.cookies = Cookies;
		  	return req.then(function(_res){
		  		res = _res;
		  		console.log("RES" + _res);
		  		res.should.have.status(200);
		  		console.log(res.body);
		  		res.body.should.have.length.of.at.least(1);
		  		return Workout.count();
		  	})
		  	.then(function(count){
		  		res.body.should.have.length.of(count);
		  	});
		});

		it('should return workouts with right fields', function(){
			let resWorkout;
			var req = chai.request(app).get('/api/workout');
			req.cookies = Cookies;
			return req.then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('array');
				res.body.should.have.length.of.at.least(1);

	          	res.body.forEach(function(workout) {
	            workout.should.be.a('object');
	            workout.should.include.keys(
	              'name');
	          });
	          resWorkout = res.body[0];
	          return Workout.findById(resWorkout._id);
	        })
	        .then(function(workout) {
	          console.log(resWorkout);
	          console.log(workout);
	          resWorkout._id.should.equal(workout._id + '');
	          resWorkout.name.should.equal(workout.name);
	        });
		});
	});

	describe('POST to workout endpoint', function(){

		it('should add a new workout', function(){
		  const newWorkout = generateWorkoutData();
		  //Workout.create(newWorkout);
		  console.log(newWorkout);
		  var req = chai.request(app).post('/api/workout');
		  req.cookies = Cookies;
		  req.send(newWorkout);
		  return req.then(function(res) {
		  	res.should.have.status(201);
		  	res.should.be.json;
		  	res.body.should.be.a('object');
		  	res.body.should.include.keys('_id', 'name');
		  	res.body.name.should.equal(newWorkout.name);
		  	res.body._id.should.not.be.null;

		  	return Workout.findById(res.body._id);
		  })
		  .then(function(workout){
		  	workout.name.should.equal(newWorkout.name);
		  });
		});
	});

	describe('PUT to workout endpoint', function(){
		it('should update the name of the workout', function(){
			const updateData = {
				name: 'UPDATED WORKOUT'
			};

			return Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  	console.log("This is the workout:" + workout);
			  	updateData.id = workout._id;
			  	var req = chai.request(app).put(`/api/workout/${workout._id}`);
		  		req.cookies = Cookies;
			  	req.send(updateData);
		
			  	return req.then(function(res) {
			  	res.should.have.status(201);

				console.log(res.body._id);
			  	return Workout.findById(res.body._id);
			  })
			  .then(function(response){
			  	console.log(response);
			  	response.name.should.equal(updateData.name);
			  });
			});
		});
	});

	describe('DELETE workout endpoint', function(){

		it('delete a workout by id', function(){
			let workout;

			return Workout
			  .findOne()
			  .exec()
			  .then(function(_workout){
			  	console.log(_workout);
			  	workout = _workout;
			  	var req = chai.request(app).delete(`/api/workout/${workout.id}`);
			  	req.cookies = Cookies;
			  
			  	return req.then(function(res) {
			  		console.log("this is the res:" + res);
			  		res.should.have.status(204);
			  		return Workout.findById(workout._id);
			  })
			  .then(function(_workout){
			  	console.log(_workout);
			  	should.not.exist(_workout);
			  });
			});
		});
	});

	describe("GET exercise endpoint", function(){

		it("should return all exercises for a workout", function(done){
		  var newExercise = generateExerciseData();
			Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  //	console.log("First" + workout);
			  	Exercise.create(newExercise).then(function(exercise){
			  	//	console.log("Second" + exercise);
			  		workout.exercises.push(exercise);
			  		//console.log("Third" + workout);
			  		workout.save()
			  		.then(function(_workout){
					//	console.log("Fourth" + workout);
					  	var req = chai.request(app).get(`/api/workout/${workout.id}/exercise`);
					  	req.cookies = Cookies;
					  	var _res
					  	return req.then(function(res) {
					  		_res = res;
					  //		console.log(res.body);
					  		res.should.have.status(200);
					  		res.body.should.have.length.of.at.least(1);
					  		return Workout.count();
				  		})
				  		.then(function(count){
				  			_res.body.should.have.length.of(count);
				  			done();
			  			});
			  		});
				});
			});
		});

		it('should return workouts with right fields', function(done){
		    let resExercise;
			var newExercise = generateExerciseData();
			Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  	Exercise.create(newExercise).then(function(exercise){
			  		workout.exercises.push(exercise);
			  		workout.save()
			  		.then(function(_workout){
					  	var req = chai.request(app).get(`/api/workout/${workout.id}/exercise`);
					  	req.cookies = Cookies;
					  	return req.then(function(res) {
					          res.should.have.status(200);
					          res.should.be.json;
					          res.body.should.be.a('array');
					          res.body.should.have.length.of.at.least(1);

					          res.body.forEach(function(exercise) {
					            exercise.should.be.a('object');
					            exercise.should.include.keys(
					              'name', 'weight', 'reps');
		          				});
						          resExercise = res.body[0];
						          return Exercise.findById(resExercise._id);
		        				})
		        .then(function(exercise) {

		          resExercise._id.should.equal(exercise._id + '');
		          resExercise.name.should.equal(exercise.name);
		          done();
		        });
		    });
		});
	});
	});
	});

	describe('POST to exercise endpoint', function(){

		it('should add a new exercise', function(done){
		  const newExercise = generateExerciseData();
			Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  	var req = chai.request(app).post(`/api/workout/${workout.id}/exercise`);
			  	req.cookies = Cookies;
			  	req.send(newExercise);
			  	return req.then(function(res) {
				  	res.should.have.status(201);
				  	res.should.be.json;
				  	res.body.should.be.a('object');
				  	res.body.exercises[0].should.include.keys('_id', 'name', 'weight', 'reps');
				  	res.body.exercises[0].name.should.equal(newExercise.name);
				  	res.body.exercises[0].weight.should.equal(newExercise.weight);
				  	res.body.exercises[0].reps.should.equal(newExercise.reps);
				  	res.body._id.should.not.be.null;

				  	return Exercise.findById(res.body.exercises[0]._id);
				  })
				  .then(function(exercise){
				  	exercise.name.should.equal(newExercise.name);
				  	exercise.weight.should.equal(newExercise.weight);
				  	exercise.reps.should.equal(newExercise.reps);
				  	done();
				  });
				});
			});
	});

	describe('PUT to exercise endpoint', function(){
		it('should update the data of the exercise', function(done){
			const updateData = {
				name: 'UPDATED EXERCISE',
				weight: 600,
				reps: 10
			};
			var newExercise = generateExerciseData();
			Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  	
			  	Exercise.create(newExercise).then(function(exercise){
			  		
			  		workout.exercises.push(exercise);
			  		workout.save()
			  		.then(function(_workout){
			  			
			  			updateData.id = exercise._id;
					  	var req = chai.request(app).put(`/api/workout/${workout._id}/exercise/${exercise._id}`);
					  	req.cookies = Cookies;
					  	req.send(updateData);
					  	return req.then(function(res) {
						  	res.should.have.status(200);
						  	return Exercise.findById(updateData.id).exec();
						  })
						  .then(function(exercise){
						  	exercise.name.should.equal(updateData.name);
						  	exercise.weight.should.equal(updateData.weight);
						  	exercise.reps.should.equal(updateData.reps);
						  	done();
						  });
					});
				});
			  });
			});
	});

	describe('DELETE exercise endpoint', function(){

		it('delete an exercise by id', function(done){
			var newExercise = generateExerciseData();
			Workout
			  .findOne()
			  .exec()
			  .then(function(workout){
			  	console.log(workout);
			  	Exercise.create(newExercise).then(function(exercise){
			  		console.log(exercise);
			  		workout.exercises.push(exercise);
			  		workout.save()
			  		.then(function(_workout){
			  			console.log(_workout);
			  			var req = chai.request(app).delete(`/api/workout/${workout._id}/exercise/${exercise._id}`);
			  			req.cookies = Cookies;
			  			return req.then(function(res) {
					  		res.should.have.status(204);
					  	return Exercise.findById(exercise.id).exec();
					  })
					  .then(function(_exercise){
					  	should.not.exist(_exercise);
					  	done();
					  });
				});
			});
			});
	});
	});

	describe("Testing HTML", function(){

		it("should serve html page", function(){
			return chai.request(app)
			  .get('/')
			  .then(function(res){
			  	res.should.have.status(200);
			  	res.should.be.html;
			  })
		});
		it("should serve workout form html page", function(){
			return chai.request(app)
			  .get('/workout-form')
			  .then(function(res){
			  	res.should.have.status(200);
			  	res.should.be.html;
			  })
		});
		it("should serve current day html page", function(){
			return chai.request(app)
			  .get('/current-day')
			  .then(function(res){
			  	res.should.have.status(200);
			  	res.should.be.html;
			  })
		});
	});
});