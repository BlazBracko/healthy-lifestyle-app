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
  weatherConditions: weather._id
});

// Nastavitev modela in izvoz
const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
