// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme za napravo
const deviceSchema = new Schema({
    userID: { type: Schema.Types.ObjectId, ref: 'User' },  // Referenca na uporabnika
    deviceID: String,  // Identifikator naprave
    platform: String,  // Platforma naprave, npr. 'iOS', 'Android', 'Windows'
    registrationDate: Date,  // Datum registracije naprave
    lastActiveDate: Date  // Zadnji datum aktivnosti naprave
});

// Nastavitev modela in izvoz
const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;
