var savedCities = [];
var currentLocation;
//var citiesInStorage = JSON.parse(localStorage("forecastedCities")) || [];
//console.log(citiesInStorage);

// Work on getting local storage on page refresh
/*function getStorage() {
}
    
    
getStorage();*/

function getCurrent(city) {
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&APPID=d7415d184e3f8e2108a88729be1f2dea&units=imperial";
    $.ajax({
        url: queryURL,
        method: "GET",
        error: function (){
            savedCities.splice(savedCities.indexOf(city), 1);
            localStorage.setItem("forecastedCities", JSON.stringify(savedCities));
        }
    }).then(function (response) {
        // Create a card for weather data
        var weatherCard = $("<div>").attr("class", "card bg-light");
        $("#innerForecast").append(weatherCard);
        
        // Add the location to the card header
        var weatherCardHeader = $("<div>").attr("class", "card-header").text("Current Weather:");
        weatherCard.append(weatherCardHeader);
        
        var cardRow = $("<div>").attr("class", "row no-gutters");
        weatherCard.append(cardRow);
        
        // Get the icon for weather conditions
        var iconURL = "https://openweathermap.org/img/wn/" + response.weather[0].icon + ".png";
        var iconImg = $("<img>").attr("src", iconURL);
        var textDiv = $("<div>").attr("class", "col-md-8");
        var cardBody = $("<div>").attr("class", "card-body");
        textDiv.append(cardBody);
        
        var h3El = $("<h3>").attr("class", "card-title").text(response.name).append(iconImg);
        cardBody.append(h3El);
        
        
        // Display the temperature
        cardBody.append($("<p>").attr("class", "card-text").html("Temperature: " + response.main.temp + " &#8457;"));
        // Display the humidity
        cardBody.append($("<p>").attr("class", "card-text").text("Humidity: " + response.main.humidity + "%"));
        // Display the wind speed
        cardBody.append($("<p>").attr("class", "card-text").text("Wind Speed: " + response.wind.speed + " MPH"));
        
        // Get the UV index, display, and color code
        var uvURL = "https://api.openweathermap.org/data/2.5/uvi?appid=d7415d184e3f8e2108a88729be1f2dea&lat=" + response.coord.lat + "&lon=" + response.coord.lat;
        $.ajax({
            url: uvURL,
            method: "GET"
        }).then(function(response) {
            var uvIndex = response.value;
            var bgColor;
            if (uvIndex < 3) {
                bgColor = "green";
            }
            else if (uvIndex >= 3 && uvIndex < 6) {
                bgColor = "yellow";
            }
            else if (uvIndex >= 6 && uvIndex < 8) {
                bgColor = "orange";
            }
            else {
                bgColor = "red";
            }
            var uvdisp = $("<p>").attr("class", "card-text").text("UV Index: ");
            uvdisp.append($("<span>").attr("class", "uvIndex").attr("style", ("background-color: " + bgColor)).text(uvIndex));
            cardBody.append(uvdisp);
            
        });
        
        cardRow.append(textDiv);
        getForecast(response.id);
    });
}

function getForecast(city) {
    // Get the 5 day forecast
    var queryURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + city + "&APPID=d7415d184e3f8e2108a88729be1f2dea&units=imperial";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        // Add a container div for forecast cards
        var newRow = $("<div>").attr("class", "row-fluid forecast");
        $("#innerForecast").append(newRow);
        
        // Loop through the array to find the forecast for 5 days
        for (var i = 0; i < response.list.length; i++) {
            if (response.list[i].dt_txt.indexOf("15:00:00") !== -1) {
                var newCol = $("<div>").attr("class", "daySize");
                newRow.append(newCol);
                
                var newCard = $("<div>").attr("class", "card text-white bg-primary");
                newCol.append(newCard);
                
                var cardHead = $("<div>").attr("class", "card-header").text(moment(response.list[i].dt, "X").format("L")).css("font-size", "12px");
                newCard.append(cardHead);
                
                var cardImg = $("<img>").attr("class", "card-img-top").attr("src", "https://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + "@2x.png");
                newCard.append(cardImg);
                
                var bodyDiv = $("<div>").attr("class", "card-body");
                newCard.append(bodyDiv);
                
                bodyDiv.append($("<p>").attr("class", "card-text").html("Temp: " + response.list[i].main.temp + " &#8457;").css("font-size", "small"));
                bodyDiv.append($("<p>").attr("class", "card-text").text("Humidity: " + response.list[i].main.humidity + "%").css("font-size", "small"));
            }
        }
    });
}

function showPrevious() {
    
    if (savedCities) {
        $("#prevSearches").empty();
        var btns = $("<div>").attr("class", "list-group");
        for (var i = 0; i < savedCities.length; i++) {
            var locBtn = $("<a>").attr("href", "#").attr("id", "locationBtn").text(savedCities[i]);
            if (savedCities[i] == currentLocation){
                locBtn.attr("class", "list-group-item list-group-item-action active");
            }
            else {
                locBtn.attr("class", "list-group-item list-group-item-action");
            }
            btns.prepend(locBtn);
        }
        $("#prevSearches").append(btns);
    }
}

function clear() {
    // Clear all the weather data
    $("#innerForecast").empty();
}

// Saves loaction to local storage and shows the previous searches
function saveLoc(loc){
    if (savedCities === null) {
        savedCities = [loc];
    }
    else if (savedCities.indexOf(loc) === -1) {
        savedCities.push(loc);
    }
    // Save the new array to local storage
    localStorage.setItem("forecastedCities", JSON.stringify(savedCities));
    showPrevious();
}

$("#searchBtn").on("click", function () {
    event.preventDefault();
    // Use the value from the input
    var loc = $("#searchInput").val().trim();
    
    if (loc !== "") {
        clear();
        currentLocation = loc;
        saveLoc(loc);
        $("#searchInput").val("");
        getCurrent(loc);
    }
});

$(document).on("click", "#locationBtn", function() {
    clear();
    currentLocation = $(this).text();
    showPrevious();
    getCurrent(currentLocation);
});
