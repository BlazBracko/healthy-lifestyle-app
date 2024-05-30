const Activity = require('../models/Activity'); // Prilagodite pot, če je potrebno
const { scrapeWeather } = require('../scrapper/weatherScrapper'); // Ensure this path matches where your scrapper.js file is located.

// Pridobi vse aktivnosti
exports.getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find();
        res.status(200).json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Pridobi aktivnosti uporabnika
exports.getUserActivities = async (req, res) => {
    try {
        // Pridobi userId iz params
        const userId = req.params.userId;
        let activities;
        if (userId) {
            // Filtrira aktivnosti po userId
            activities = await Activity.find({ userId: userId });
        } else {
            return res.status(400).json({ message: "No userId provided" });
        }
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
// Add new activity
exports.createActivity = async (req, res) => {
    const { userID, type, startTime } = req.body;
    console.log(userID, " user id");
    console.log(type, " type");
    console.log(startTime, " starttime");
    // Create a new Activity document only with userID, type, and startTime
    
    //const weatherData = await scrapeWeather();

    const activity = new Activity({
        userID,
        type,
        startTime
        //weatherConditions: weatherData._id
    });

    try {

        const newActivity = await activity.save();
        // Respond with the newly created activity's ID and other necessary details
        res.status(201).json({
            activityId: newActivity._id, // Return the activity ID to the client
            type: newActivity.type,
            startTime: newActivity.startTime
            //weatherConditions: newActivity.weatherConditions
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateActivityData = async (req, res) => {
    const { activityId, latitude, longitude, altitude } = req.body;

    try {
        // Find the activity by ID and push new location data to the locationData array
        const updatedActivity = await Activity.findByIdAndUpdate(activityId, {
            $push: {
                locationData: { latitude, longitude }, // Add new location point
                altitudeChanges: {
                    time: new Date(), // Current server time
                    altitude: altitude
                }
            }
        }, { new: true }); // Return the updated document

        if (!updatedActivity) {
            return res.status(404).json({ message: "Activity not found." });
        }

        res.status(200).json(updatedActivity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Function to end an activity and update the end time
exports.endActivity = async (req, res) => {
    const { activityId, endTime } = req.body;

    try {
        // Fetch the complete activity including its location data
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: "Activity not found." });
        }

        // Calculate total distance using the location data
        let totalDistance = 0;
        const { locationData } = activity;
        for (let i = 1; i < locationData.length; i++) {
            totalDistance += getDistanceFromLatLonInKm(
                locationData[i-1].latitude,
                locationData[i-1].longitude,
                locationData[i].latitude,
                locationData[i].longitude
            );
        }

        // Optionally, update the weather conditions
        const weatherData = await scrapeWeather(); // Assuming this function is already implemented
        if (!weatherData) {
            return res.status(500).json({ message: "Failed to fetch weather data." });
        }

        // Update the activity with the end time, total distance, and weather conditions
        activity.endTime = new Date(endTime);
        activity.distance = totalDistance * 1000;
        activity.weatherConditions = weatherData._id;
        
        const updatedActivity = await activity.save();

        res.status(200).json(updatedActivity);
    } catch (err) {
        console.error('Error during activity update:', err.message);
        res.status(500).json({ message: err.message });
    }
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}
  
function deg2rad(deg) {
    return deg * (Math.PI / 180);    
}

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
