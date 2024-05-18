// Uvoz potrebnih modulov
const mongoose = require('mongoose');

// Skrajšanje za Schema
const Schema = mongoose.Schema;

// Definicija sheme za sporočila
const messageSchema = new Schema({
  senderID: { type: Schema.Types.ObjectId, ref: 'User' },  // Referenca na pošiljatelja
  receiverID: { type: Schema.Types.ObjectId, ref: 'User' },  // Referenca na prejemnika
  message: String,  // Vsebina sporočila
  topic: String,  // MQTT topic, pod katerim se sporočilo pošilja
  sentAt: { type: Date, default: Date.now },  // Datum in čas pošiljanja
  receivedAt: Date  // Datum in čas prejema
});

// Nastavitev modela in izvoz
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;

//Vaša trenutna baza podatkov in sheme so solidna osnova za delo z MQTT, vendar je ključnega pomena, da vzpostavite in konfigurirate dodatne komponente, kot so MQTT broker in povezovalne knjižnice, ter razvijete potrebno logiko za obdelavo sporočil. To bo zagotovilo, da bo vaš sistem za sporočanje deloval učinkovito in zanesljivo v realnem času.
