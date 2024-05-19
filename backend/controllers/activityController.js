const Activity = require('../models/Activity'); // Prilagodite pot, če je potrebno

// Pridobi vse aktivnosti
exports.getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find();
        res.status(200).json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Pridobi aktivnost po ID
exports.getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        res.status(200).json(activity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Dodaj novo aktivnost
exports.createActivity = async (req, res) => {
    const { userID, type, startTime, endTime, locationData, distance, caloriesBurned, stepCount, altitudeChanges, weatherConditions } = req.body;

    const activity = new Activity({
        userID, type, startTime, endTime, locationData, distance, caloriesBurned, stepCount, altitudeChanges, weatherConditions: weather._id
    });

    try {
        const newActivity = await activity.save();
        res.status(201).json(newActivity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Posodobi obstoječo aktivnost
exports.updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        Object.keys(req.body).forEach(key => {
            activity[key] = req.body[key];
        });

        const updatedActivity = await activity.save();
        res.status(200).json(updatedActivity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Izbriši aktivnost
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        await activity.remove();
        res.status(200).json({ message: 'Activity deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
