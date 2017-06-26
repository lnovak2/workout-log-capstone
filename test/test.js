const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const should = chai.should();

const { User } = require('../models/user')
const { Workout } = require('../models/workout');
const { Exercise } = require('../models/exercise');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

// Seeds the database with some initial data to check tests against
function seedWorkoutData() {
    return generateUser()
        .then(function(userData) {
            console.log(userData)
            return User.create(userData);
        })
        .then(function(user) {
            console.log(user);
            return Workout.insertMany(generateWorkout(user));
        })
        .then(function(workout) {
            return Exercise.insertMany(generateExercises(workout));
        })
}

// Generates a user - called on when the database is seeded.
function generateUser() {
    return User.hashPassword("Steve")
        .then(function(hash) {
            return { username: "Steve", password: hash };
        })
}

// Generates a workout - called on when the database is seeded.
function generateWorkout(user) {
    const workouts = [{
        user: user._id,
        name: "Morning"
    }, {
        user: user._id,
        name: "Afternoon"
    }, {
        user: user._id,
        name: "Evening"
    }, {
        user: user._id,
        name: "Best"
    }];
    return workouts[0];
}

// Generates an exercise - called on when the database is seeded.
function generateExercises(workout) {
    const exercises = [{
        name: "Flat Bench Press",
        weight: "400",
        reps: "10"
    }, {
        name: "Flat Bench Press",
        weight: "400",
        reps: "8"
    }, {
        name: "Flat Bench Press",
        weight: "400",
        reps: "6"
    }, {
        name: "Flat Bench Press",
        weight: "400",
        reps: "4"
    }];
    return exercises[0];
}

// Generates workout data when testing POST endpoints
function generateWorkoutData() {
    return {
        name: faker.name.title()
    };
};

// Generates exercise data when testing POST endpoints
function generateExerciseData() {
    return {
        name: faker.name.title(),
        weight: faker.random.number(),
        reps: faker.random.number()
    };
};

// Removes all the data from the database - 
// used after every test to start with initial seeded data
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
};

var Cookies;

describe("Workout API resource", function() {

    // Before running tests starts the server on the test database
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    // Seeds the database with data before each test ran
    beforeEach(function(done) {
        seedWorkoutData()
            .then(function() {
                chai.request(app)
                    .post('/login')
                    .set('contentType', 'application/json')
                    .send({ username: 'Steve', password: 'Steve' })
                    .end(function(err, res) {
                        Cookies = res.headers['set-cookie'].pop().split(';')[0];
                        done();
                    })
            });
    });

    // Removes all data from database after each test to
    // start with initial uniform data
    afterEach(function() {
        return tearDownDb();
    });

    // Closes the server after all tests are ran
    after(function() {
        return closeServer();
    });

    describe("GET workout endpoint", function() {

        // test strategy:
        //  1. make request to workout api endpoint
        //  2. inspect response object and prove has right code and have
        //  right keys in response object.
        it("should return all workouts on the current day", function() {
            let res;
            var req = chai.request(app).get('/api/workout');
            req.cookies = Cookies;
            return req.then(function(_res) {
                    res = _res;
                    res.should.have.status(200);
                    // We have 1 initial workout created for User
                    res.body.should.have.length.of.at.least(1);
                    return Workout.count();
                })
                .then(function(count) {
                    // The response should match what is in database
                    res.body.should.have.length.of(count);
                });
        });

        it('should return workouts with right fields', function() {
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
                        // "name" is the only required key
                        workout.should.include.keys('name');
                    });
                    resWorkout = res.body[0];
                    return Workout.findById(resWorkout._id);
                })
                .then(function(workout) {
                    resWorkout._id.should.equal(workout._id + '');
                    resWorkout.name.should.equal(workout.name);
                });
        });
    });

    describe('POST to workout endpoint', function() {

        // test strategy:
        //  1. make a POST request with data for a new item
        //  2. inspect response object and prove it has right
        //  status code and that the returned object has an "id" and "name"
        it('should add a new workout', function() {
            const newWorkout = generateWorkoutData();
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
                .then(function(workout) {
                    // response should be equal to "newWorkout" from above
                    // in database
                    workout.name.should.equal(newWorkout.name);
                });
        });
    });

    describe('PUT to workout endpoint', function() {


        it('should update the name of the workout', function() {
            const updateData = {
                name: 'UPDATED WORKOUT'
            };

            // test strategy:
            // 1. Find a workout in the database to update
            // 2. Set the "id" of the workout equal to the updated data's "id"
            // 3. Make a PUT request with the "updateData"
            // 4. Inspect the response object to ensure it
            //  has right status code and that we get back an updated
            //  item with the right data in it.
            return Workout
                .findOne()
                .exec()
                .then(function(workout) {
                    updateData.id = workout._id;
                    var req = chai.request(app).put(`/api/workout/${workout._id}`);
                    req.cookies = Cookies;
                    req.send(updateData);

                    // prove that the PUT request has right status code
                    // and returns updated item
                    return req.then(function(res) {
                            res.should.have.status(201);
                            return Workout.findById(res.body._id);
                        })
                        .then(function(response) {
                            response.name.should.equal(updateData.name);
                        });
                });
        });
    });

    describe('DELETE workout endpoint', function() {

        // test stragety:
        // 1. Find a workout in the database to get "id" of one to delete
        // 2. DELETE a workout and ensure we get back the status 204.
        it('delete a workout by id', function() {
            let workout;

            return Workout
                // first have to get so we have an `id` of workout
                // to delete
                .findOne()
                .exec()
                .then(function(_workout) {
                    workout = _workout;
                    var req = chai.request(app).delete(`/api/workout/${workout.id}`);
                    req.cookies = Cookies;

                    return req.then(function(res) {
                            res.should.have.status(204);
                            return Workout.findById(workout._id);
                        })
                        .then(function(_workout) {
                            should.not.exist(_workout);
                        });
                });
        });
    });

    describe("GET exercise endpoint", function() {

        // test strategy:
        //  1. Find a workout in the database
        //  2. Create an exercise to add to workout
        //  3. Make GET request to exercise api enpoint 
        //  2. inspect response object and prove has right code and have
        //  right keys in response object.
        it("should return all exercises for a workout", function(done) {
            var newExercise = generateExerciseData();
            Workout
                // find workout in database
                .findOne()
                .exec()
                .then(function(workout) {
                    // create an exercise to populate workout
                    Exercise.create(newExercise).then(function(exercise) {
                        workout.exercises.push(exercise);
                        workout.save()
                            .then(function(_workout) {
                                var req = chai.request(app).get(`/api/workout/${workout.id}/exercise`);
                                req.cookies = Cookies;
                                var _res
                                return req.then(function(res) {
                                        _res = res;
                                        res.should.have.status(200);
                                        // because we created 1 exercise for workout
                                        res.body.should.have.length.of.at.least(1);
                                        return Workout.count();
                                    })
                                    .then(function(count) {
                                        _res.body.should.have.length.of(count);
                                        done();
                                    });
                            });
                    });
                });
        });

        it('should return workouts with right fields', function(done) {
            let resExercise;
            var newExercise = generateExerciseData();
            Workout
                .findOne()
                .exec()
                .then(function(workout) {
                    Exercise.create(newExercise).then(function(exercise) {
                        workout.exercises.push(exercise);
                        workout.save()
                            .then(function(_workout) {
                                var req = chai.request(app).get(`/api/workout/${workout.id}/exercise`);
                                req.cookies = Cookies;
                                // After GET request, testing if response has correct
                                // status and data keys
                                return req.then(function(res) {
                                        res.should.have.status(200);
                                        res.should.be.json;
                                        res.body.should.be.a('array');
                                        res.body.should.have.length.of.at.least(1);
                                        // each item should be an object with key/value pairs
                                        // for `name`, `weight` and `reps`.
                                        res.body.forEach(function(exercise) {
                                            exercise.should.be.a('object');
                                            exercise.should.include.keys(
                                                'name', 'weight', 'reps');
                                        });
                                        resExercise = res.body[0];
                                        return Exercise.findById(resExercise._id);
                                    })
                                    // exercise should be equal to resExercise if we assign
                                    // `id` to it from `resExercises._id`
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

    describe('POST to exercise endpoint', function() {

        // test strategy:
        //  1. Find workout in database
        //  1. make a POST request with data for a new exercise
        //  2. inspect response object and prove it has right
        //  status code and that the returned object has correct keys
        it('should add a new exercise', function(done) {
            const newExercise = generateExerciseData();
            Workout
                .findOne()
                .exec()
                .then(function(workout) {
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
                        // response should be equal to `newExercise` from above if we assign
                        // `id` to it from `res.body.exercises[0]._id`
                        .then(function(exercise) {
                            exercise.name.should.equal(newExercise.name);
                            exercise.weight.should.equal(newExercise.weight);
                            exercise.reps.should.equal(newExercise.reps);
                            done();
                        });
                });
        });
    });

    describe('PUT to exercise endpoint', function() {
        // test strategy:
        // 1. Find a workout in the database
        // 2. Create an exercise and set that "id" to the updated data's "id"
        // 3. Make a PUT request with the "updateData"
        // 4. Inspect the response object to ensure it
        //  has right status code and that we get back an updated
        //  item with the right data in it.
        it('should update the data of the exercise', function(done) {
            const updateData = {
                name: 'UPDATED EXERCISE',
                weight: 600,
                reps: 10
            };
            var newExercise = generateExerciseData();
            Workout
                .findOne()
                .exec()
                .then(function(workout) {
                    // first have to create exercise to make object to update
                    Exercise.create(newExercise).then(function(exercise) {

                        workout.exercises.push(exercise);
                        workout.save()
                            .then(function(_workout) {
                                updateData.id = exercise._id;
                                var req = chai.request(app).put(`/api/workout/${workout._id}/exercise/${exercise._id}`);
                                req.cookies = Cookies;
                                req.send(updateData);
                                return req.then(function(res) {
                                        // prove that the PUT request has right status code
                                        // and returns updated item
                                        res.should.have.status(200);
                                        return Exercise.findById(updateData.id).exec();
                                    })
                                    .then(function(exercise) {
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

    describe('DELETE exercise endpoint', function() {

        // test stragety:
        // 1. Find a workout in the database
        // 2. Create a new exercise within the workout
        // 3. DELETE the exercise we created and 
        // ensure we get back the status 204.
        it('delete an exercise by id', function(done) {
            var newExercise = generateExerciseData();
            Workout
                // find workout in database
                .findOne()
                .exec()
                .then(function(workout) {
                    // create an exercise to populate workout
                    Exercise.create(newExercise).then(function(exercise) {
                        workout.exercises.push(exercise);
                        workout.save()
                            .then(function(_workout) {
                                // make DELETE request for exercise created
                                var req = chai.request(app).delete(`/api/workout/${workout._id}/exercise/${exercise._id}`);
                                req.cookies = Cookies;
                                return req.then(function(res) {
                                        res.should.have.status(204);
                                        return Exercise.findById(exercise.id).exec();
                                    })
                                    .then(function(_exercise) {
                                        should.not.exist(_exercise);
                                        done();
                                    });
                            });
                    });
                });
        });
    });

    // Initial tests to check if html pages are loading correctly 
    describe("Testing HTML", function() {

        it("should serve html page", function() {
            return chai.request(app)
                .get('/')
                .then(function(res) {
                    res.should.have.status(200);
                    res.should.be.html;
                })
        });
        it("should serve workout form html page", function() {
            return chai.request(app)
                .get('/workout-form')
                .then(function(res) {
                    res.should.have.status(200);
                    res.should.be.html;
                })
        });
        it("should serve current day html page", function() {
            return chai.request(app)
                .get('/current-day')
                .then(function(res) {
                    res.should.have.status(200);
                    res.should.be.html;
                })
        });
    });
});
