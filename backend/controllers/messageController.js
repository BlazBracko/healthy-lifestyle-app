const Message = require('../models/Message');

// Pridobi vsa sporočila
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find();
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Pridobi sporočilo po ID
exports.getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.status(200).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Dodaj novo sporočilo
exports.createMessage = async (req, res) => {
    const { senderID, receiverID, message, topic, sentAt, receivedAt } = req.body;

    const newMessage = new Message({
        senderID, receiverID, message, topic, sentAt, receivedAt
    });

    try {
        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Posodobi obstoječe sporočilo
exports.updateMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        Object.keys(req.body).forEach(key => {
            message[key] = req.body[key];
        });

        const updatedMessage = await message.save();
        res.status(200).json(updatedMessage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Izbriši sporočilo
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        await message.remove();
        res.status(200).json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
