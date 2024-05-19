const User = require('../models/User');

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
    const { name, surname, username, email, password } = req.body;
    try {
        console.log("Attempting to create user...");
        //const user = new User({ name, surname, username, email, password });
        const user = new User({
            name: 'Blaz',
            surname: 'Bracko',
            username: 'blazbracko',
            email: 'blaz.bracko03@example.com',
            password: 'Blaz.123'
        });

        console.log("Encrypting password...");
        await user.encryptPassword(password);
        console.log("Password encrypted:", user.hashedPassword);

        console.log("Saving user...");
        const newUser = await user.save();
        console.log("User saved:", newUser);

        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error during user creation:", err);
        res.status(500).json({ message: err.message });
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