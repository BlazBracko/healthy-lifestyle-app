const Sensor = require('../models/Sensor');

// Pridobi vse podatke iz senzorjev
exports.getAllSensorData = async (req, res) => {
    try {
        const sensorData = await Sensor.find();
        res.status(200).json(sensorData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Pridobi podatke iz senzorjev po ID
exports.getSensorDataById = async (req, res) => {
    try {
        const sensorData = await Sensor.findById(req.params.id);
        if (!sensorData) return res.status(404).json({ message: 'Sensor data not found' });
        res.status(200).json(sensorData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Dodaj nove podatke iz senzorja
exports.createSensorData = async (req, res) => {
    const { userID, type, data } = req.body;

    const newSensorData = new Sensor({
        userID, type, data
    });

    try {
        const savedSensorData = await newSensorData.save();
        res.status(201).json(savedSensorData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Posodobi obstoječe podatke iz senzorjev
exports.updateSensorData = async (req, res) => {
    try {
        const sensorData = await Sensor.findById(req.params.id);
        if (!sensorData) return res.status(404).json({ message: 'Sensor data not found' });

        Object.keys(req.body).forEach(key => {
            sensorData[key] = req.body[key];
        });

        const updatedSensorData = await sensorData.save();
        res.status(200).json(updatedSensorData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Izbriši podatke iz senzorjev
exports.deleteSensorData = async (req, res) => {
    try {
        const sensorData = await Sensor.findById(req.params.id);
        if (!sensorData) return res.status(404).json({ message: 'Sensor data not found' });

        await sensorData.remove();
        res.status(200).json({ message: 'Sensor data deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
