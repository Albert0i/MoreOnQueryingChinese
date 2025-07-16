import 'dotenv/config'
//import fetch from 'node-fetch';

// Replace with your actual OpenWeatherMap API key
const API_KEY = process.env.WEATHER_API_KEY;
const CITY = 'Macau';

const getWeather = async (city) => {
  // current weather
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  //  5-day/3-hour forecas
  //const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log(`🌡️ Temperature in ${city}: ${data.main.temp}°C`);
    console.log(`🌥️ Weather: ${data.weather[0].description}`);
    console.log(`💧 Humidity: ${data.main.humidity}%`);

    console.log('data =', data)
  } catch (error) {
    console.error('Failed to fetch weather data:', error.message);
  }
};

getWeather(CITY);