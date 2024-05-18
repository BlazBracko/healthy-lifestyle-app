// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme za aktivnost
const activitySchema = new Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },  // Referenca na uporabnika
  type: String,  // Tip aktivnosti, npr. 'tek', 'kolesarjenje', 'hoja'
  startTime: Date,  // Začetni čas aktivnosti
  endTime: Date,  // Končni čas aktivnosti
  locationData: [{ latitude: Number, longitude: Number }],  // Podatki o lokaciji
  distance: Number,  // Prepotovana razdalja v kilometrih
  caloriesBurned: Number,  // Porabljene kalorije
  stepCount: Number,  // Število korakov
  altitudeChanges: [{ time: Date, altitude: Number }],  // Spremembe nadmorske višine
  weatherConditions: {  // Vremenski pogoji med aktivnostjo
    temperature: Number, // Temperatura v °C
    humidity: Number, // Vlažnost v %
    windSpeed: Number, // Hitrost vetra v km/h
    weatherDescription: String, // Opis vremenskih razmer, npr. "sončno", "oblačno", "deževno"
    precipitation: Number // Količina padavin v mm, če sploh so
    //opcijsko dodamo še kvaliteto zraka
  }
});

// Nastavitev modela in izvoz
const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
