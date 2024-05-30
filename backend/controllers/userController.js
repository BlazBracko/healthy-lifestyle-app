const User = require('../models/User');
const { Expo } = require('expo-server-sdk');
const axios = require('axios');

let expo = new Expo();


// Funkcija za pridobivanje vseh uporabnikov
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Funkcija za pridobivanje uporabnika po ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Funkcija za dodajanje novega uporabnika
exports.createUser = async (req, res) => {
    const { name, surname, username, email, password, token } = req.body;

    // Validate the push token
    if (token && !Expo.isExpoPushToken(token)) {
        return res.status(400).send({ error: 'Invalid Expo push token' });
    }

    try {
        console.log("Attempting to create user...");
        const user = new User({ name, surname, username, email, password, deviceTokens: token ? [token] : [] });

        // Assuming encryptPassword is an asynchronous method that hashes the password
        await user.encryptPassword(password);

        const newUser = await user.save();

        // Send a welcome notification if a push token is provided
        if (token) {
            const messages = [{
                to: token,
                sound: 'default',
                title: 'Welcome to Our App!',
                body: 'Thank you for registering.',
                data: { withSome: 'data' },
            }];

            // Send the notification through Expo's push API
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(messages);
                console.log('Notification ticket:', ticketChunk);
                // Additional handling for ticket response may be necessary
            } catch (error) {
                console.error("Failed to send notification:", error);
            }
        }

        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error during user creation:", err);
        res.status(500).json({ message: err.message });
    }
};

// Funkcija za dodajanje novega uporabnika
exports.sendNotification = async (req, res) => {
    try {
        console.log("delastari");
        // Find the first user in the database
        const user = await User.findOne();
        if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
            return res.status(404).json({ message: 'No user with a push token found' });
        }

        const pushToken = user.deviceTokens[0];

        // Create the notification message
        const message = {
            to: pushToken,
            sound: 'default',
            title: 'New Notification',
            body: 'This is a test notification',
            data: { url: 'myapp://faceid' }, // Include the deep link URL
        };

        // Send the notification through Expo's push API
        const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Failed to send notification' });
    }
};



// Funkcija za posodabljanje obstoječega uporabnika
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        Object.keys(req.body).forEach(key => {
            user[key] = req.body[key];
        });

        if (req.body.password) {
            await user.encryptPassword(req.body.password);
        }

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Funkcija za brisanje uporabnika
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.remove();
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Funkcija za prijavo uporabnika
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username' });
        }

        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};