//  Displays all exercises for a workout when called

function displayCurrentDayWorkouts(data) {
    var workoutsHTML = data.map(function(workout) {
        var workoutHTML = '<li class="workout-list">' + "<span class='workout-title'>" + workout.name + "</span>";
        workoutHTML += workout.exercises.map(function(exercise) {
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
    $('.full-list').append(workoutsHTML);
};

//  If the user is on the "current-day" webpage,
//  once the document is ready, it will display
//  the current day's workouts

$(document).ready(function() {
    if (window.location.pathname === "/current-day") {
        $.get("/api/workout")
            .then(function(data, status) {
                if (status == 500) {
                    $("#message").text("Internal Server Error").show();
                }
                displayCurrentDayWorkouts(data);
            })
    };
});

//  Makes POST ajax request to database to create a  
//  workout and relocates user to exercise-form

$('#workout-submit').click(function(event) {
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
        function(data, status) {
            if (status == 500) {
                $("#message").text("Internal Server Error").show();
            }
            window.location = "/exercise-form/?id=" + data._id;
        });
});

//  Function searches web address for "id" variable 
//  in order to use it for an ajax request

function getSearchParams(k) {
    var p = {};
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(s, k, v) { p[k] = v })
    return k ? p[k] : p;
};

//  Makes POST ajax request to create an exercise
//  and redirects back to current day page

$('#exercise-submit').click(function(event) {
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
        function(data, status) {
            if (status == 400) {
                $("message").text("Did not create exercise").show();
            }
            if ($('input[type="checkbox"]').is(":checked")) {
                $("#exercise-entry").find("input[type='text']").val('');
                return;
            }
            window.location = "/current-day";
        });
});

//Makes POST ajax request to login a valid user

$('#login-button').click(function(event) {
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
        success: function(data, status) {
            if (status == 401) {
                $("#message").alert("Did not find User");
            }
            window.location = "/current-day"
        }
    });
});

//  If user needs to create a login, upon clicking the "Sign Up" button,
//  the login form is hidden, and the sign-up form is revealed.

$('#new-button').click(function(event) {
    event.preventDefault();
    $('#new-button').hide();
    $('#login-form').hide();
    $('#sign-up-form').show();
})

//  POST ajax request to create a new user

$('#new-login').click(function(event) {
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
        success: function(data, status) {
            if (status == 400) {
                $("#message").text("Did not create User");
            }
            window.location = "/current-day"
        }
    });
});

// Logs user out

$('#log-out').click(function(event) {
    event.preventDefault();
    window.location = "/logout";
})
