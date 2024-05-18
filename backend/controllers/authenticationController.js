const Authentication = require('../models/Authentication');

// Ustvari novo avtentikacijo
exports.createAuthentication = async (req, res) => {
    const { userID, method, status, createdAt, verifiedAt } = req.body;

    const authentication = new Authentication({
        userID, method, status, createdAt, verifiedAt
    });

    try {
        const newAuthentication = await authentication.save();
        res.status(201).json(newAuthentication);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Pridobi avtentikacijo po ID
exports.getAuthenticationById = async (req, res) => {
    try {
        const authentication = await Authentication.findById(req.params.id);
        if (!authentication) return res.status(404).json({ message: 'Authentication not found' });
        res.status(200).json(authentication);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Posodobi obstoječo avtentikacijo (npr. nastavitev statusa na "verified")
exports.updateAuthentication = async (req, res) => {
    try {
        const authentication = await Authentication.findById(req.params.id);
        if (!authentication) return res.status(404).json({ message: 'Authentication not found' });

        Object.keys(req.body).forEach(key => {
            authentication[key] = req.body[key];
        });

        const updatedAuthentication = await authentication.save();
        res.status(200).json(updatedAuthentication);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
