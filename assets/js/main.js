 // Initialize Firebase
 var config = {
  apiKey: "AIzaSyASRuqWmMZXjY-vsWis0rAz3Li_zG2erac",
  authDomain: "mypro1-a5ac8.firebaseapp.com",
  databaseURL: "https://mypro1-a5ac8.firebaseio.com",
  projectId: "mypro1-a5ac8",
  storageBucket: "mypro1-a5ac8.appspot.com",
  messagingSenderId: "990386012661"
};
firebase.initializeApp(config);
var dataRef = firebase.database();

/**
 * FirebaseUI configuration
 */
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: '<url-to-redirect-to-on-success>',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>'
};

/**
 * firebaseUI authentication
 */
ui.start('#firebaseui-auth-container', {
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
  // Other config options...
});

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

/**
 * render the FirebaseUI Auth interface
 * The start method will wait until the DOM is loaded.
 */
// 
ui.start('#firebaseui-auth-container', uiConfig);


/**
 * 
 */
// set the current time
function updateTime() {
  $('#currentTime').empty();
  var currentTime = `<strong>${moment().format('LLLL')}</strong> - current time ${moment().format('HH:mm:ss')}`;
  $('#currentTime').append(currentTime);
  setTimeout(updateTime, 60000);
}

function updateScheduleEveryMinute() {
  var $scheduleTableBody = $("#scheduler tbody")
      .children()
      .each(function(indexr, tr){
        var tds = $(tr).children().toArray();
        console.log($(tds[2]).text());
        console.log($(tds[2]).text().split(' '));
        var frequency = (($(tds[2]).text()).split(' '))[2];
        var nextArrival = $(tds[3]).text();
        var minutesAway = $(tds[4]).text();
        var currentTime = moment().format('HH:mm');

        console.log("current time", currentTime);
        frequency = parseInt(frequency);
        nextArrival = moment(nextArrival, 'HH:mm');
        minutesAway = parseInt(minutesAway);
        console.log(frequency);
        console.log(nextArrival);
        console.log(minutesAway);

        // get the values that need to upate
        if (nextArrival.diff(moment(currentTime, 'HH:mm'), 'minutes') > 0) {
          console.log("cond 1");
          $(tds[4]).text(minutesAway-1);
        }
        else if (nextArrival.diff(moment(currentTime, 'HH:mm'), 'minutes') == 0) {
          console.log("cond 2");
          //console.log(moment(nextArrival.add(frequency, 'minutes'), 'HH:mm').format('HH:mm'));
          $(tds[3]).text(moment(nextArrival.add(frequency, 'minutes'), 'HH:mm').format('HH:mm'));
          $(tds[4]).text(frequency);
        }
        else {
          console.log("this case is not supposed to happen");
        }
      });
    
  setTimeout(updateScheduleEveryMinute, 60000);
}

$("#reset-train").on("click", function(e){
  e.preventDefault();
  $('form')[0].reset();   // access DOM element with normal array syntax. Or $('from').trigger('reset');
})
// capture the submit button click
$("#add-train").on("click", function(e) {
  e.preventDefault();

  var trainName = $("#trainName").val().trim();
  var destination = $("#destination").val().trim();
  var firstTrainTime = moment($("#firstTrainTime").val().trim(), "HH:mm").format("X");
  //var firstTrainTime = moment($("#firstTrainTime").val().trim(), "HH:mm");
  var frequency = $("#frequency").val().trim();
  
  var newTrainSchedule = {
    trainName: trainName,
    destination: destination,
    firstTrainTime: parseInt(firstTrainTime),
    frequency: frequency,
    dateAdded: firebase.database.ServerValue.TIMESTAMP
  };

  // console.log(trainName);
  // console.log(destination);
  // console.log(firstTrainTime);
  // console.log(frequency);

  dataRef.ref().push(newTrainSchedule);
});

// Initial loader and firebase watcher. Note the difference fron .on("value")
dataRef.ref().on("child_added", function(childSnap) {

  var trainName = childSnap.val().trainName;
  var destination = childSnap.val().destination;
  var firstTrainTime = childSnap.val().firstTrainTime;
  var frequency = childSnap.val().frequency;

  var firstTrainTimeInFormat = moment.unix(firstTrainTime).format("HH:mm");
  // console.log("firstTrainTime: " + firstTrainTime);
  // console.log("firstTrainTimeInFormat : " + firstTrainTimeInFormat);
  // console.log(moment().format('X'));
  // console.log(moment.utc(moment(), 'HH:mm'));

  var timeDifference = moment.utc(moment(), 'HH:mm')
                 .diff(moment.utc(firstTrainTimeInFormat, 'HH:mm'), "minutes");

  //var timeDifference = 53;
  var tRemainder = timeDifference % frequency;
  var tMinutesAway = frequency - tRemainder;
  var nextTrainArrival = moment().add(tMinutesAway, "minutes").format("HH:mm");

  $("#scheduler tbody").append("<tr><td>" + trainName + "</td>" +
                                    "<td>" + destination + "</td>" +
                                    "<td> every " + frequency + " min</td>" +
                                    "<td>" + nextTrainArrival + "</td>" +
                                    "<td>" + tMinutesAway + "</td></tr>");

}, function(errorObject) {
  console.log("Errors handled: " + errorObject.code);
});

dataRef.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function(snap) {

  $("#trainName").text(snap.val().trainName);
  $("#destination").text(snap.val().destination);
  $("#firstTrainTime").text(moment.unix(snap.val().firstTrainTime).format("HH:mm"));
  $("#frequency").text(snap.val().frequency);
})


// clock displays every minute 
var clockTickerId = setTimeout(updateTime, 0);

/**
 * challenge - 1
 * update "next arriva" and "minutes away" value every minute
 */
var scheduleTickerId = setTimeout(updateScheduleEveryMinute, 60000);

/**
 * user should be able to 
 */



