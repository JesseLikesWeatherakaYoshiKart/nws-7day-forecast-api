
class App {

    dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    async getForcast(latitude, longitude) {

        // Use the weather object to get hourly forcast
        const forcastHourly = await this.getHourlyForcast(latitude, longitude);

        // Transform results into our core weather reporting structure
        return this.transformHourly(forcastHourly);
    }

    async getHourlyForcast(latitude, longitude) {

        const uri = `https://api.weather.gov/points/${latitude},${longitude}`;

        // First we fetch the grid points using our Latitude and Longitude
        const pointsResponse = await fetch(uri);

        if (!pointsResponse.ok) {
            throw new Error('Could not fetch content from weather api: /points');
        }
         
        // Then we get the resulting payload which contains a Uri for getting hourly forcast
        const pointsResult = await pointsResponse.json();
        const hourlyForcastUri = pointsResult.properties.forecastHourly;

        // We hit tha Uri to bring back the hourly forcast
        const forcastResponse = await fetch(hourlyForcastUri);

        if (!forcastResponse.ok) {
            throw new Error('Could not fetch content from weather api: /forecast/hourly');
        }

        // Return the hourly forcast results
        return await forcastResponse.json();
    }

    transformHourly(forcastHourly) {

        const forcast = [];

        // Group all hourly periods by their day
        let dailyPeriod = -1;
        let currentDate = -1;

        // Iterate through every forcasted hour and add it to the currect daily bucket
        for (let periodHourly of forcastHourly.properties.periods) {

            // If we move to the next day, create a new daily bucket to hold hourly forcasts
            const startTime = new Date(periodHourly.startTime);
            const date = startTime.getDate();
            if (date != currentDate) {
                
                currentDate = date;
                dailyPeriod++;

                // Stub in a forcast object for a specific day period
                forcast[dailyPeriod] = { 
                    name: this.dayOfWeek[startTime.getDay()],
                    period: dailyPeriod,
                    date: date,
                    unit: periodHourly.temperatureUnit,
                    high: Number.NEGATIVE_INFINITY, // See High / Low calcs below
                    low: Number.POSITIVE_INFINITY,  // See High / Low calcs below
                    hourly: []
                };
            }

            // Lookup our daily forcast so that we can update it
            const daily = forcast[dailyPeriod];

            // Update Highs and Lows
            if (periodHourly.temperature > daily.high)
                daily.high = periodHourly.temperature;
            
            if (periodHourly.temperature < daily.low)
                daily.low = periodHourly.temperature;
            
            // Add the hourly focast
            daily.hourly.push(periodHourly);
        }

        return forcast;
    }
}

//location; Grovetown GA
//latitude; 33.4657
//longitude; -82.1987
