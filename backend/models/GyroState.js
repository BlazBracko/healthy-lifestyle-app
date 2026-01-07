const mongoose = require("mongoose");

const GyroStateSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },

    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },

    ts: { type: Date, default: Date.now }, // sensor timestamp or server timestamp
  },
  { timestamps: true }
);

module.exports = mongoose.model("GyroState", GyroStateSchema);
