const express = require("express");
const router = express.Router();
const gyroController = require("../controllers/gyroController");

router.post("/latest", gyroController.upsertLatest);      // device sends updates
router.get("/latest/:deviceId", gyroController.getLatest); // client reads latest

module.exports = router;
