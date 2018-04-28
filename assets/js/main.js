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
const LAST_TRAIN_ARRIVAL_TIME_FOR_A_DAY = "23:30";

/**
 * 
 */
// set the current time
function updateTime() {
  $('#currentTime').empty();
  var currentTime = `${moment().format('LLLL')} - current time <span class="bg-dark text-white"><strong>${moment().format('HH:mm')}</strong></span>`;
  $('#currentTime').append(currentTime);
  setTimeout(updateTime, 60000);
}

// clock displays every minute 
var clockTickerId = setTimeout(updateTime, 0);

/**
 * function called to update the next arrival time and time left until the next train
 */
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
       
        frequency = parseInt(frequency);
        nextArrival = moment(nextArrival, 'HH:mm');
        minutesAway = parseInt(minutesAway);
        console.log("current time", currentTime);
        console.log(frequency);
        console.log(nextArrival);
        console.log(minutesAway);

        // get the values that need to upate
        if (nextArrival.diff(moment(currentTime, 'HH:mm'), 'minutes') > 0) {
          console.log("cond 1");
          $(tds[4]).empty();
          $(tds[4]).html(`<strong>${minutesAway-1}</strong>`);
        }
        else if (nextArrival.diff(moment(currentTime, 'HH:mm'), 'minutes') == 0) {
          console.log("cond 2");
          $(tds[3]).empty();
          $(tds[4]).empty();
          var td3content = moment(nextArrival.add(frequency, 'minutes'), 'HH:mm').format('HH:mm');
          $(tds[3]).html(`<strong>${td3content}</strong>`);
          $(tds[4]).html(`<strong>${frequency}</strong>`);
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
  var frequency = $("#frequency").val().trim();
  
  var newTrainSchedule = {
    trainName: trainName,
    destination: destination,
    firstTrainTime: parseInt(firstTrainTime),
    frequency: parseInt(frequency),
    dateAdded: firebase.database.ServerValue.TIMESTAMP
  };

  dataRef.ref().push(newTrainSchedule);
});

// Initial loader and firebase watcher. Note the difference fron .on("value")
dataRef.ref().on("child_added", function(childSnap) {
  console.log(childSnap.val());

  var trainName = childSnap.val().trainName;
  var destination = childSnap.val().destination;
  var firstTrainTime = childSnap.val().firstTrainTime;
  var frequency = childSnap.val().frequency;

  var firstTrainTimeInFormat = moment.unix(firstTrainTime).format("HH:mm"); 
  var currentTime = moment().format('HH:mm');
 
  console.log("current time ", currentTime);
  console.log("firstTrainTime: " + firstTrainTime);
  console.log("firstTrainTimeInFormat : " + firstTrainTimeInFormat);

  /**
   * Cuttent time of day is between the first train time and the last train arrival time that is 
     * defined in the area at top of the main.js.
   */
  if (currentTime < firstTrainTimeInFormat || currentTime > LAST_TRAIN_ARRIVAL_TIME_FOR_A_DAY) {

    var tMinutesAway = moment(firstTrainTimeInFormat,"HH:mm").diff(moment(currentTime, "HH:mm"), "minutes");
    var nextTrainArrival = firstTrainTimeInFormat;

    $("#scheduler tbody").append("<tr><td>" + trainName + "</td>" +
                                    "<td>" + destination + "</td>" +
                                    "<td> every " + frequency + " min</td>" +
                                    "<td><strong>" + nextTrainArrival + "</strong></td>" +
                                    "<td><strong>" + tMinutesAway + "</strong></td></tr>");
  }
  else {
    /**
     * Cuttent time of day is outside of the regular train operation hours (the first train time and 
     * the lsat train arrival time that is defined in the area at top of the main.js).
     */
    var timeDifference = moment(moment(), "HH:mm").diff(moment(firstTrainTime, "X"), "minutes");
    console.log(timeDifference);
    
    var tRemainder = timeDifference % frequency;
    var tMinutesAway = frequency - tRemainder;
    var nextTrainArrival = moment().add(tMinutesAway, "minutes").format("HH:mm");

    $("#scheduler tbody").append("<tr><td>" + trainName + "</td>" +
                                      "<td>" + destination + "</td>" +
                                      "<td> every " + frequency + " min</td>" +
                                      "<td><strong>" + nextTrainArrival + "</strong></td>" +
                                      "<td><strong>" + tMinutesAway + "</strong></td></tr>");

}}, function(errorObject) {
  console.log("Errors handled: " + errorObject.code);
});

// dataRef.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function(snap) {

//   $("#trainName").text(snap.val().trainName);
//   $("#destination").text(snap.val().destination);
//   $("#firstTrainTime").text(moment.unix(snap.val().firstTrainTime).format("HH:mm"));
//   $("#frequency").text(snap.val().frequency);
// })




/**
 * challenge - 1
 * update "next arriva" and "minutes away" value every minute
 */
var scheduleTickerId = setTimeout(updateScheduleEveryMinute, 60000);




