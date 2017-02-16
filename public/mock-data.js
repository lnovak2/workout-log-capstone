var MOCK_WORKOUTS = {
	"workouts" : [
		{
			"id": "111111",
			"updatedAt": 1487212204000,
			"exercises": [
				{
					"name": "Flat Dumbbell Bench Press",
					"weight": [110, 120, 120, 100],
					"reps": [12, 6, 6, 11],
					"rest-interval": [180, 180, 180, 180]
				}
				{
					"name": "Incline Smith Machine Bench Press",
					"weight": [185, 185, 185],
					"reps": [12, 10, 10],
					"rest-interval": [180, 180, 180]
				}
				{
					"name": "Chest Press Machine",
					"weight": [130, 130, 100],
					"reps": [15, 15, 15],
					"rest-interval": [120, 120, 120]
				}
				{
					"name": "Single-arm Upward Dumbbell Flys",
					"weight": [10, 10, 10],
					"reps": [15, 15, 15],
					"rest-interval": [120, 120, 120]
				}
			],
			"volume": 16080,
			"average-intensity": 102, 
			"density": 1.27,
			"notes": "5 minutes cardio warm-up"
		}
	]
}

function getCurrentDayWorkouts(callbackFn) {
	setTimeout(function(){
		callbackFn(MOCK_WORKOUTS)}, 100);
	}

function displayCurrentDayWorkouts(data) {
	for (index in data.workouts) {
		$('body').append(
			'<p>' + data.workouts[index].text + '</p>')
	}
}

function getAndDisplayCurrentDayWorkouts() {
	getCurrentDayWorkouts(displayCurrentDayWorkouts);
}

$(function() {
	getAndDisplayCurrentDayWorkouts();
})