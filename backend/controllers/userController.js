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
        console.log(newUser);
        res.status(201).json({newUser});
    } catch (err) {
        console.error("Error during user creation:", err);
        
        // Handle duplicate key errors (MongoDB E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            let message = '';
            
            if (field === 'username') {
                message = 'Username already exists. Please choose a different username.';
            } else if (field === 'email') {
                message = 'Email already exists. Please use a different email address.';
            } else if (field === 'name') {
                message = 'A user with this name already exists.';
            } else if (field === 'surname') {
                message = 'A user with this surname already exists.';
            } else {
                message = `${field} already exists. Please choose a different value.`;
            }
            
            return res.status(400).json({ message });
        }
        
        // Handle other validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Generic server error
        res.status(500).json({ message: err.message || 'An error occurred while creating the user' });
    }
};

// Funkcija za dodajanje novega uporabnika
exports.sendNotification = async (req, res) => {
    try {
        console.log("delastari");
        // Find the first user in the database
        const user = await User.findById(req.params.id);
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
            data: { url: 'myapp://faceidphoto' }, // Include the deep link URL
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

        // Only update allowed fields (exclude sensitive fields like password unless explicitly provided)
        const allowedFields = ['name', 'surname', 'email', 'age', 'height', 'weight', 'gender', 'platform', 'settings'];
        const updateData = {};

        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                // Convert numeric fields from strings if needed
                if (['age', 'height', 'weight'].includes(key) && req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
                    updateData[key] = key === 'weight' ? parseFloat(req.body[key]) : parseInt(req.body[key], 10);
                } else if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
                    updateData[key] = req.body[key];
                }
            }
        });

        // Apply updates
        Object.keys(updateData).forEach(key => {
            user[key] = updateData[key];
        });

        // Handle password separately if provided
        if (req.body.password) {
            await user.encryptPassword(req.body.password);
        }

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(400).json({ message: `${field} already exists. Please choose a different value.` });
        }
        
        res.status(400).json({ message: err.message || 'Failed to update user' });
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

        res.json({ user: { _id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Fetch all users with follow status
exports.getUsersWithFollowStatus = async (req, res) => {
    const currentUserId = req.params.userId;
    try {
        const users = await User.find({ _id: { $ne: currentUserId }}).lean();
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: 'Current user not found' });
        }

        // Add isFollowed property to each user
        const usersWithFollowStatus = users.map(user => ({
            ...user,
            isFollowed: currentUser.following.includes(user._id)
        }));

        res.json(usersWithFollowStatus);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

// Follow a user
exports.followUser = async (req, res) => {
    const { followerId, followingId } = req.body;

    if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow oneself" });
    }

    try {
        await User.updateOne(
            { _id: followerId },
            { $addToSet: { following: followingId } }
        );
        await User.updateOne(
            { _id: followingId },
            { $addToSet: { followers: followerId } }
        );

        res.json({ message: 'Successfully followed the user' });
    } catch (error) {
        console.error('Failed to follow user:', error);
        res.status(500).json({ message: 'Failed to follow user', error: error.message });
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
    const { followerId, followingId } = req.body;

    try {
        await User.updateOne(
            { _id: followerId },
            { $pull: { following: followingId } }
        );
        await User.updateOne(
            { _id: followingId },
            { $pull: { followers: followerId } }
        );

        res.json({ message: 'Successfully unfollowed the user' });
    } catch (error) {
        console.error('Failed to unfollow user:', error);
        res.status(500).json({ message: 'Failed to unfollow user', error: error.message });
    }
};