var MOCK_WORKOUTS = {
	"workouts" : [
		{
			"name": "Morning Workout",
			"id": "111111",
			"updatedAt": 1487212204000,
			"exercises": [
				{
					"name": "Flat Dumbbell Bench Press",
					"weight": 110,
					"reps": 12
				},
				{
					"name": "Flat Dumbbell Bench Press",
					"weight": 120,
					"reps": 6
				},
				{
					"name": "Flat Dumbbell Bench Press",
					"weight": 120,
					"reps": 6
				},
				{
					"name": "Incline Smith Machine Bench Press",
					"weight": 185,
					"reps": 12
				},
				{
					"name": "Chest Press Machine",
					"weight": 130,
					"reps": 15
				},
				{
					"name": "Single-arm Upward Dumbbell Flys",
					"weight": 10,
					"reps": 15
				}
			],
			"volume": 16080,
			"average-intensity": 102, 
			"notes": "5 minutes cardio warm-up"
		}
	]
};

function getCurrentDayWorkouts(callbackFn) {
	setTimeout(function(){
		callbackFn(MOCK_WORKOUTS)}, 1);
	};

function displayCurrentDayWorkouts(data) {
	var workoutsHTML = data.workouts.map(function(workout){
		var workoutHTML = '<li class="workout-list">' + workout.name;
		workoutHTML += workout.exercises.map(function(exercise){
			var exerciseHTML = 
				'<ol>' +
					'<li>' + exercise.name + '</li>' +
					'<li>' + exercise.weight + '</li>' +
					'<li>' + exercise.reps + '</li>' +
				'</ol>';
			return exerciseHTML;
		}).join(''); 
		workoutHTML += '</li>';
		return workoutHTML;
	})
	console.log(workoutsHTML);
	$('.full-list').append(workoutsHTML);
};



function getAndDisplayCurrentDayWorkouts() {
	getCurrentDayWorkouts(displayCurrentDayWorkouts);
};

$(function() {
	getAndDisplayCurrentDayWorkouts();
});