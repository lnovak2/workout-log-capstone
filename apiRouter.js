const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const { Exercise } = require('./models/exercise');
const { User } = require('./models/user');
const { Workout } = require('./models/workout');


//	Check if user is authenticated

function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }
    return res.status(401).send({});
}


//	Retrieves all exercises that correspond to a specific workout

router.get('/workout/:id/exercise', isAuthenticated, (req, res) => {
    Workout
        .findOne({ _id: req.params.id })
        .populate('exercises')
        .exec((err, workout) => {
            if (err) {
                console.log('Wheres all the exercises!?');
            }
            res.json(workout.exercises);
        });
});


//	Creates a new exercise for a specific workout and user

router.post('/workout/:id/exercise', isAuthenticated, (req, res) => {
    const requiredFields = ['name', 'weight', 'reps'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(req.body[field])) {
            const message = `Missing \`${field}\` in request body`;
            return res.status(400).send(message);
        }
    }
    Exercise.create({ name: req.body.name, weight: req.body.weight, reps: req.body.reps }, (err, exercise) => {
        if (err) {
            return res.status(400);
        }
        Workout.findById(req.params.id, (err, workout) => {
            if (err) {
                return res.status(400);
            };
            workout.exercises.push(exercise);
            workout.save(err => {
                if (err) {
                    return res.status(400);
                }
                workout.populate('exercises', (err, work) => {
                    if (err) {
                        return res.status(400);
                    }
                    res.status(201).json(work);
                })
            });

        });
    });
});


//	Deletes an exercise based on it's ID value

router.delete('/workout/:id/exercise/:exerciseid', isAuthenticated, (req, res) => {
    Exercise.findByIdAndRemove(req.params.exerciseid, (err, exercise) => {
        if (err) {
            return res.status(400);
        }
        res.status(204).end();
    });
});


//	Updates an exercise with new information

router.put('/workout/:id/exercise/:exerciseid', isAuthenticated, (req, res) => {
    const requiredFields = ['name', 'weight', 'reps'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            return res.status(400).send(message);
        }
    }
    if (req.params.exerciseid != req.body.id) {

        const message = (
            `Request path id (${req.params.exerciseid}) and request body id `
            `(${req.body.id}) must match`);
        return res.status(400).send(message);
    }
    console.log(`Updating Exercise \`${req.params.exerciseid}\``);
    Exercise.findOneAndUpdate({ _id: req.params.exerciseid }, { name: req.body.name, weight: req.body.weight, reps: req.body.reps },
        (err, exercise) => {
            if (err) {
                return res.status(400);
            }
            res.json(exercise);
        }
    );
})


//	Retrieves all workouts for the authenticated user

router.get('/workout', isAuthenticated, (req, res) => {

    //	Offsets current time in order to return all workouts
    //	that were recorded in a 24hr period

    var today = new Date();
    today.setHours(0, today.getTimezoneOffset(), 0, 0);
    today = new Date(today - (new Date()).getTimezoneOffset() * 60000);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var query = {
        date: {
            $gte: today.toISOString(),
            $lt: tomorrow.toISOString()
        },
        user: req.user
    };
    Workout.find(query).populate('exercises').exec((err, workouts) => {
        res.json(workouts);
    });
});


//	Creates a new workout for the authenticated user

router.post('/workout', isAuthenticated, (req, res) => {
    if (!(req.body.name)) {
        const message = `Missing name in request body`;
        return res.status(400).json(message);
    }
    Workout.create({ name: req.body.name, user: req.user }, (err, workout) => {
        if (err) {
            res.status(500).send('Internal Server Error');
        }
        res.status(201).json(workout);
    });
});


//	Deletes a workout based on it's ID value

router.delete('/workout/:id', isAuthenticated, (req, res) => {
    Workout.findByIdAndRemove(req.params.id, (err, workout) => {
        if (err) {
            return res.status(400);
        }
        res.status(204).end();
    });

});


//	Updates a workout with a new name

router.put('/workout/:id', isAuthenticated, (req, res) => {
    if (!('name' in req.body)) {
        const message = `Missing name in request body`;
        return res.status(400).send(message);
    }
    if (req.params.id !== req.body.id) {
        const message = (
            `Request path id (${req.params.id}) and request body id `
            `(${req.body.id}) must match`);
        return res.status(400).send(message);
    }
    Workout.findOneAndUpdate({
            _id: req.params.id
        }, {
            name: req.body.name
        },
        (err, workout) => {
            if (err) {
                res.status(500).send('Internal Server Error');
            }
            res.status(201).json(workout);
        });
});

module.exports = router;
