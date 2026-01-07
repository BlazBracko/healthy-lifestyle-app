const GyroState = require("../models/GyroState");

const parseGyroMessage = (msg) => {
  // Expected: "GYR: number, X:float, Y:float, Z:float"
  // Example:  "GYR: 123456, X:1.234, Y:-0.456, Z:9.810"
  const regex =
    /GYR:\s*(\d+)\s*,\s*X:\s*(-?\d+(?:\.\d{1,3})?)\s*,\s*Y:\s*(-?\d+(?:\.\d{1,3})?)\s*,\s*Z:\s*(-?\d+(?:\.\d{1,3})?)/i;

  const match = String(msg).trim().match(regex);
  if (!match) return null;

  return {
    gyr: Number(match[1]),
    x: Number(match[2]),
    y: Number(match[3]),
    z: Number(match[4]),
  };
};

const tryFixFormUrlencodedJsonKey = (req) => {
  // Handles the case where the device sends JSON but content-type is x-www-form-urlencoded,
  // so express.urlencoded parses it as:
  // { '{"deviceId":"...","GYR":...,"X":...,"Y":...,"Z":...}\r\n': '' }
  if (
    req.headers["content-type"]?.includes("application/x-www-form-urlencoded") &&
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length === 1
  ) {
    const rawKey = Object.keys(req.body)[0]; // the JSON string is the *key*
    const cleaned = String(rawKey).trim();   // remove \r\n, spaces
    try {
      const parsed = JSON.parse(cleaned);
      req.body = parsed; // replace req.body with real object
      return true;
    } catch {
      return false;
    }
  }
  return true; // nothing to fix
};

exports.upsertLatest = async (req, res, next) => {
  try {
    // Uncomment these logs if you want debugging:
    // console.log("---- GYRO REQUEST ----");
    // console.log("CT:", req.headers["content-type"]);
    // console.log("BODY:", req.body);
    // console.log("----------------------");

    const ok = tryFixFormUrlencodedJsonKey(req);
    if (!ok) {
      return res.status(400).json({ error: "Invalid JSON in form-urlencoded body" });
    }

    // Accept these formats:
    // A) form-urlencoded JSON-key (fixed above) => now req.body is normal object
    // B) normal JSON => req.body is normal object
    // C) { deviceId, message: "GYR:..., X:..., Y:..., Z:..." }

    const deviceId = req.body?.deviceId;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    let x, y, z, ts;

    // If body contains message string like "GYR: ..., X:..., Y:..., Z:..."
    if (typeof req.body.message === "string") {
      const parsed = parseGyroMessage(req.body.message);
      if (!parsed) {
        return res.status(400).json({
          error: "Invalid gyro message format. Expected: 'GYR: number, X:float, Y:float, Z:float'",
        });
      }
      x = parsed.x;
      y = parsed.y;
      z = parsed.z;
      ts = parsed.gyr;
    } else {
      // Normal object fields (your device sends uppercase)
      const gyr = req.body.gyr ?? req.body.GYR ?? req.body.ts;

      x = req.body.x ?? req.body.X;
      y = req.body.y ?? req.body.Y;
      z = req.body.z ?? req.body.Z;

      ts = gyr;
    }

    // Validate numeric values
    if ([x, y, z].some((v) => v === undefined || v === null || Number.isNaN(Number(v)))) {
      return res.status(400).json({ error: "x, y, z must be valid numbers" });
    }

    const update = {
      x: Number(-y),
      y: Number(-x),
      z: Number(z),
      ts: ts !== undefined && ts !== null && !Number.isNaN(Number(ts)) ? Number(ts) : Date.now(),
    };

    const doc = await GyroState.findOneAndUpdate(
      { deviceId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.getLatest = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const doc = await GyroState.findOne({ deviceId });
    if (!doc) return res.status(404).json({ error: "No gyro state found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};
