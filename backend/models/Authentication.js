// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme za avtentikacijo
const authenticationSchema = new Schema({
    userID: { type: Schema.Types.ObjectId, ref: 'User' },
    method: String,  // Metoda 2FA, npr. 'pushNotification', 'sms', 'email'
    status: { type: String, default: 'pending' },  // Status avtentikacije, npr. 'pending', 'verified'
    createdAt: { type: Date, default: Date.now },  // Čas zahteve za 2FA
    verifiedAt: Date  // Čas potrditve avtentikacije
});

// Nastavitev modela in izvoz
const Authentication = mongoose.model('Authentication', authenticationSchema);
module.exports = Authentication;
