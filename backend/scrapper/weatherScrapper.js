const axios = require('axios');
const fs = require('fs');
const Weather = require('../models/Weather'); // Import the Weather model
require('dotenv').config();

// funkcija naredi API klic, da pridobi podatke o vremenu iz strani OpenWeather
const fetchWeatherData = async () => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('API key is missing. Please check your .env file.');
    }
    console.log(`Using API Key: ${apiKey}`); // For debugging
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=46&lon=15&units=metric&appid=${apiKey}`;
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw error;
  }
};

// Funkcija shrani podatke v JSON datoteko
const saveJSONToFile = (data, filename) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonData);
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error(`Error saving data to ${filename}:`, error.message);
    throw error;
  }
};

// Zažene scrapping proces
const scrapeWeather = async () => {
  try {
    const weatherData = await fetchWeatherData();
    saveJSONToFile(weatherData, 'weatherData.json');
    const formattedData = formatData(weatherData);
    saveJSONToFile(formattedData, 'formattedWeatherData.json');
    
    // Ročno ustvari nov dokument in ga shrani v bazo
    const newWeather = new Weather(formattedData);
    await newWeather.save({ timeoutMS: 10000 });
    
    console.log('Weather data inserted into database successfully');
  } catch (error) {
    console.error('Failed to scrape weather data:', error.message);
  }
};

// Funkcija formatira podatke iz API klica
const formatData = (data) => {
  try {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      weatherDescription: data.weather[0].description,
      precipitation: 0 // Ta podatek ni na voljo v API klicu
    };
  } catch (error) {
    console.error('Error formatting data:', error.message);
    throw error;
  }
};

// Zažene funkcijo direktno med izvajanjem skripte
//scrapeWeather();

module.exports = {
  fetchWeatherData,
  saveJSONToFile,
  formatData,
  scrapeWeather,
};