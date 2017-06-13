function displayCurrentDayWorkouts(data) {
	console.log(data);
	var workoutsHTML = data.map(function(workout){
		var workoutHTML = '<li class="workout-list">' + "<span class='workout-title'>" + workout.name +"</span>";
		workoutHTML += workout.exercises.map(function(exercise){
			var exerciseHTML = 
				'<ol>' +
					'<li>' + exercise.name + '</li>' +
					'<li>Weight:' + exercise.weight + '</li>' +
					'<li>Reps:' + exercise.reps + '</li>' +
				'</ol>';
			return exerciseHTML;
		}).join(''); 
		workoutHTML += '</li>';
		return workoutHTML;
	})
	console.log(workoutsHTML);
	$('.full-list').append(workoutsHTML);
};

$(document).ready(function(){
	if(window.location.pathname === "/current-day"){
		$.get("/api/workout")
		.then(function(data, status){
			if(status == 500){
			$("#message").text("Internal Server Error").show();
			}
			displayCurrentDayWorkouts(data);
		})
	};
});

$('#workout-submit').click(function(event){
	console.log($("#workoutname").val());
	console.log($("#notes").val());
	event.preventDefault();
	$.ajax({
		url: "/api/workout",
		type: "POST",
		data: JSON.stringify({
			name: ($("#workoutname").val()),
			notes: $("#notes").val()
		}),
		contentType: "application/json",
		dataType: "json"
	}).then(
	function(data, status){
		if(status == 500){
			$("#message").text("Internal Server Error").show();
		}
		window.location = "/exercise-form/?id=" + data._id;
	});
});

$('#exercise-submit').click(function(event){
	console.log('Beginning');
	event.preventDefault();
	$.ajax({
		url: "/api/workout/" + getSearchParams("id") + "/exercise",
		type: "POST",
		data: JSON.stringify({
			name: $("#exercisename").val(),
			weight: $("#weight").val(),
			reps: $("#reps").val()
		}),
		contentType: "application/json",
		dataType: "json"
	}).then(
	function(data, status){
		if(status == 400){
			$("message").text("Did not create exercise").show();
		}
		if($('input[type="checkbox"]').is(":checked")) {
       		$("#exercise-entry").find("input[type='text']").val('');
       		return;
		}
		window.location = "/current-day";
	});
});		

function getSearchParams(k){
	 var p={};
	 location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(s,k,v){p[k]=v})
	 return k?p[k]:p;
};

$('#login-button').click(function(event){
	console.log($("#username").val());
	console.log($("#password").val());
	event.preventDefault();
	$.ajax({
		url: "/login",
		type: "POST",
		data: JSON.stringify({
			username: $("#username").val(),
			password: $("#password").val()
		}),
		contentType: "application/json",
		dataType: "json",
		success: function(data, status){
			if(status == 401){
				$("#message").text("Did not find User");
			}
			window.location = "/current-day"
		}
	});
});

$('#new-button').click(function(event){
	event.preventDefault();
	$('#new-button').hide();
	$('#login-form').hide();
	$('#sign-up-form').show();
})

$('#new-login').click(function(event){
	event.preventDefault();
	$.ajax({
		url: "/user",
		type: "POST",
		data: JSON.stringify({
			username: $("#new-username").val(),
			password: $("#new-password").val()
		}),
		contentType: "application/json",
		dataType: "json",
		success: function(data, status){
		if(status == 400){
			$("#message").text("Did not create User");
		}
		window.location = "/current-day"
		}	
	});
});

$('#log-out').click(function(event){
	event.preventDefault();
	window.location = "/logout";
})