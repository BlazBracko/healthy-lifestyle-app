// Uvoz modelov
const User = require("./User");
const Authentication = require("./Authentication");
const Activity = require("./Activity");
const Device = require("./Device");
const Message = require("./Message");
const Sensor = require("./Sensor")

// Izvoz vseh modelov iz enega centralnega mesta
// To omogoča enostavnejši uvoz in upravljanje modelov v aplikaciji
module.exports = { 
  User,        
  Authentication,
  Activity,  
  Device,
  Message,
  Sensor
};
