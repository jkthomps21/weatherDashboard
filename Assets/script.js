var currentCity = { "city": "", "state": "", "country": "", "longitude": "", "latitude": "" },
    searchedCities = [],
    userCity = "",
    saveLocation = false,
    writeHeader = true,
    updateMain = true;

geolocator.config({
    language: "en",
    google: {
        version: "3",
        key: "AIzaSyBaLH1pJqg3B-3S-_vZWMxCrG9xvmP1bwI"
    }
});

window.onload = function () {
    if (localStorage.getItem("previousCities") !== null) {
        searchedCities = JSON.parse(localStorage.getItem("previousCities"));
        listLocation();
    }
    var options = {
        addressLookup: true,
    };
    geolocator.locateByIP(options, function locate(err, location) {
        if (err) {
            return console.log(err);
        }
        userCity = location.address.city;
        getCityWeather(userCity);
    });
}

function fullName(list) {
    if (list.country !== "US") {
        var fullName = list.city + ", " + list.country;
    } else {
        var fullName = list.city + ", " + list.state;
    }
    return fullName;
}

function getCityWeather(city) {
    geolocator.geocode(city, function (err, location) {
        if (err) {
            $("#city-input").addClass("is-invalid")
            return console.log(err);
        } else {
            $("#city-input").removeClass("is-invalid")
        }
        currentCity.city = location.address.city;
        if (location.address.countryCode == "US") {
            currentCity.state = location.address.stateCode;
        } else {
            currentCity.state = "";
        }
        currentCity.country = location.address.countryCode;
        currentCity.longitude = location.coords.longitude.toFixed(4);
        currentCity.latitude = location.coords.latitude.toFixed(4);

        var cityURL = "https://api.openweathermap.org/data/2.5/weather?q=" + currentCity.city + "&units=imperial&appid=d7415d184e3f8e2108a88729be1f2dea"

        $.ajax({
            url: cityURL,
            method: "GET",
        }).then(function (response) {
            weatherCode = response.weather[0].id;
            // Get the current UTC
            hourUnix = Number(moment.utc().format('X'));
            // Get offset of UTC
            hourOffset = Number(response.timezone);
            // Calculate unix 
            hour = moment.unix(hourUnix + hourOffset).utc().format("H");
            sunrise = moment(response.sys.sunrise, 'X').format("H");
            sunset = moment(response.sys.sunset, 'X').format("H");

            iconClass = getIcon(Number(weatherCode), Number(hour), Number(sunrise), Number(sunset));
            
            if (updateMain) {
                $("#city-name").text(fullName(currentCity));
                $("#wind-speed").html(`${Math.round(response.wind.speed)}<small>mph</small>`);
                $("#humidity").html(`${response.main.humidity}<small>%</small>`);
                $("#temperature").text(Math.round(response.main.temp) + "°");
                $("#i-weather-current").removeClass();
                $("#i-weather-current").addClass(iconClass);
                getForecast();
            }
            if (writeHeader) {
                $("#header-info").empty();
                $("#header-info").prepend(fullName(currentCity) + " ");
                time = $("<span>").text(moment().format("dddd, MMM Do"));
                $("#header-info").append("<br>", time);
                writeHeader = false;
                updateMain = true;
            }
        });
    });
}

function getForecast() {
    var oneCallURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + currentCity.latitude + "&lon=" + currentCity.longitude + "&exclude=current,hourly&units=imperial&appid=d7415d184e3f8e2108a88729be1f2dea";

    $.ajax({
        url: oneCallURL,
        method: "GET",
    }).then(function (response) {
        uvValue = Math.round(response.daily[0].uvi)
        if (uvValue < 3) {
            $("#uv-index").css("color", "green")
        } else if (uvValue < 6 ) {
            $("#uv-index").css("color", "yellow")
        } else if (uvValue < 8) {
            $("#uv-index").css("color", "orange")
        } else if (uvValue < 11) {
            $("#uv-index").css("color", "red")
        } else if (uvValue >= 11) {
            $("#uv-index").css("color", "magenta")
        }
        $("#uv-index").text(uvValue)
        $("#uv-index").append($("<small>").text("of 10+").css("color", "black"))

        var i = 0;
        $(".forecast").each(function () {
            $(this).empty();
            // Add label for each day
            label = $("<p>")
            if (i > 1) {
                day = moment().add((i), 'days').format("dddd");
                label.text(day).css("font-size", "16px").css("text-decoration", "underline");
            } else if (i == 1) {
                label.text("Tomorrow").css("font-size", "16px").css("text-decoration", "underline");
            } else {
                label.text("Today").css("font-size", "16px").css("text-decoration", "underline");
            }
            $(this).append(label);
            // Add an icon
            code = response.daily[i].weather[0].id;
            iconClass = getIcon(Number(code), 12, 0, 24);
            $(this).append($("<i>").addClass(iconClass).addClass("ficons"));
            // Add the Temperature
            temp = Math.round(response.daily[i].temp.day) + "°";
            $(this).append($("<div>").text(temp).addClass("ftext"));
            // Add the Humidity and Precipitation
            humidity = response.daily[i].humidity;
            humidityIcon = $("<i>").addClass("wi wi-humidity");
            humidityText = $("<span>").text(humidity + " ");
            $(this).append($("<div>").append(humidityText, humidityIcon).addClass("small"));
            i++;
        })
        if (saveLocation) {
            if (searchedCities.length == 0) {
                searchedCities.unshift({...currentCity});
                listLocation();
            } else if (searchArray() == true) {
                searchedCities.unshift({...currentCity});
                listLocation();
            }
            saveLocation = false;
        }
    });
}

function getIcon(code, hour, sunrise, sunset) {
    if (hour >= sunrise && hour < sunset) {
        var iconClass = `wi wi-owm-day-${code}`;
    }
    else if (hour >= sunset || hour < sunrise) {
        var iconClass = `wi wi-owm-night-${code}`;
    }
    return (iconClass);
}

function listLocation() {
    localStorage.setItem("previousCities", JSON.stringify(searchedCities));
    $("#city-list").empty();
    for (val in searchedCities) {
        entry = searchedCities[val];
        button = $("<button>").text(fullName(entry));
        button.attr("data-city", fullName(entry));
        button.addClass("list-group-item list-group-item-action");
        $("#city-list").append(button);
        if (searchedCities.length >= 9) {
            searchedCities.pop();
        }
    }
}

function searchArray() {
    for (var i=0; i < searchedCities.length; i++) {
        if (searchedCities[i].city === currentCity.city) {
            return false;
        } else {
            return true;
        }
    }
}

$("#search-city").on("click", function (event) {
    event.preventDefault();
    saveLocation = true;
    if ($("#city-input").val()) {
        const city = $("#city-input").val();

        if (/,\s*[A-Z]{2,}$/i.test(city)) {
            getCityWeather(city);
        } else {
            getCityWeather(`${city}, MN`);
        }
    } else {
        $("#city-input").addClass("is-invalid")
    }
    $("#city-input").val("");
});

$("#city-list").on("click", function(event) {
    event.preventDefault();
    city = event.target.getAttribute("data-city");
    getCityWeather(city);
});