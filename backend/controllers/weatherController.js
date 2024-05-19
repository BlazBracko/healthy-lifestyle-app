const Weather = require('../models/Weather');

// Ustvari novo vremensko napoved
exports.createWeather = async (req, res) => {
  try {
    const { temperature, humidity, windSpeed, weatherDescription, precipitation } = req.body;

    const newWeather = new Weather({
      temperature,
      humidity,
      windSpeed,
      weatherDescription,
      precipitation
    });

    const savedWeather = await newWeather.save();

    res.status(201).json(savedWeather);
  } catch (error) {
    console.error('Error creating weather entry:', error.message);
    res.status(500).json({ error: 'Failed to create weather entry' });
  }
};

// Pridobi vse vremenske napovedi
exports.getAllWeather = async (req, res) => {
  try {
    const allWeather = await Weather.find();
    res.json(allWeather);
  } catch (error) {
    console.error('Error getting weather entries:', error.message);
    res.status(500).json({ error: 'Failed to get weather entries' });
  }
};

// Pridobi vremensko napoved po ID
exports.getWeatherById = async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id);
    if (!weather) return res.status(404).json({ message: 'Weather entry not found' });
    res.status(200).json(weather);
  } catch (error) {
    console.error('Error getting weather by ID:', error.message);
    res.status(500).json({ error: 'Failed to get weather by ID' });
  }
};

// Posodobi vremensko napoved
exports.updateWeather = async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id);
    if (!weather) return res.status(404).json({ message: 'Weather entry not found' });

    Object.keys(req.body).forEach(key => {
      weather[key] = req.body[key];
    });

    const updatedWeather = await weather.save();
    res.status(200).json(updatedWeather);
  } catch (error) {
    console.error('Error updating weather entry:', error.message);
    res.status(500).json({ error: 'Failed to update weather entry' });
  }
};

// Izbriše vremensko napoved
exports.deleteWeather = async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id);
    if (!weather) return res.status(404).json({ message: 'Weather entry not found' });

    await weather.remove();
    res.status(200).json({ message: 'Weather entry deleted' });
  } catch (error) {
    console.error('Error deleting weather entry:', error.message);
    res.status(500).json({ error: 'Failed to delete weather entry' });
  }
};
