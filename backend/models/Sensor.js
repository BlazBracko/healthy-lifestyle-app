// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme za podatke iz senzorjev
const sensorDataSchema = new Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },  // Referenca na uporabnika
  type: String,  // Tip senzorja (npr. 'Face ID', 'Pedometer', 'GPS', 'Barometer', 'Weather')
  data: {
    timestamp: { type: Date, default: Date.now },  // Časovni žig zajema podatka
    value: Schema.Types.Mixed  // Fleksibilno polje, ki lahko shrani katerikoli tip podatka
  }
});

// Nastavitev modela in izvoz
const Sensor = mongoose.model('Sensor', sensorDataSchema);
module.exports = Sensor;
