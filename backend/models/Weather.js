// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme vremena
const weatherSchema = new Schema({
  temperature: { type: Number, required: true }, // Temperatura v °C
  humidity: { type: Number, required: true }, // Vlažnost v %
  windSpeed: { type: Number, required: true }, // Hitrost vetra v km/h
  weatherDescription: { type: String, required: true }, // Opis vremenskih razmer, npr. "sončno", "oblačno", "deževno"
  precipitation: { type: Number, required: true } // Količina padavin v mm, če sploh so
  //opcijsko dodamo še kvaliteto zraka
});

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = Weather;