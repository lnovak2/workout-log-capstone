const mongoose = require('mongoose');

const workoutSchema = mongoose.Schema({
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    name: { type: String, required: true },
    date: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
});

const Workout = mongoose.model('Workout', workoutSchema)

module.exports = { Workout };
