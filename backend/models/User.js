// Uvoz potrebnih modulov
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme uporabnika
const userSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    hashedPassword: { type: String, required: true },
    faceIDData: Buffer, // Biometrični podatki obraza
    //mqttClientID: { type: String, /*unique: true,sparse: true */}, // Make the field sparse to ignore null values
    platform: String, // Platforma uporabnika, npr. 'iOS', 'Android', 'Web'
    deviceTokens: [String], // Tokeni za naprave za push obvestila
    settings: Schema.Types.Mixed,
    age: { type: Number, min: 0 },
    height: { type: Number, min: 0 }, // Višina telesa v centimetrih
    weight: { type: Number, min: 0 }, // Teža telesa v kilogramih
    gender: { type: String, enum: ['male', 'female', 'other'] }, // Spol
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // References to other User documents
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Metode za shemo
userSchema.methods.encryptPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.hashedPassword = await bcrypt.hash(password, salt);
};

userSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.hashedPassword);
};

// Nastavitev modela in izvoz
const User = mongoose.model('User', userSchema);
module.exports = User;
