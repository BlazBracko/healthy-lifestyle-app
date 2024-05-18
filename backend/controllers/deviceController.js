const Device = require('../models/Device');

// Pridobi vse naprave
exports.getAllDevices = async (req, res) => {
    try {
        const devices = await Device.find();
        res.status(200).json(devices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Pridobi napravo po ID
exports.getDeviceById = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) return res.status(404).json({ message: 'Device not found' });
        res.status(200).json(device);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Dodaj novo napravo
exports.createDevice = async (req, res) => {
    const { userID, deviceID, platform, registrationDate, lastActiveDate } = req.body;

    const device = new Device({
        userID, deviceID, platform, registrationDate, lastActiveDate
    });

    try {
        const newDevice = await device.save();
        res.status(201).json(newDevice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Posodobi obstoječo napravo
exports.updateDevice = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) return res.status(404).json({ message: 'Device not found' });

        Object.keys(req.body).forEach(key => {
            device[key] = req.body[key];
        });

        const updatedDevice = await device.save();
        res.status(200).json(updatedDevice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Izbriši napravo
exports.deleteDevice = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);
        if (!device) return res.status(404).json({ message: 'Device not found' });

        await device.remove();
        res.status(200).json({ message: 'Device deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};