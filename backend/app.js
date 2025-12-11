const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
//const mqtt = require('mqtt');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB URI
const uri = "mongodb+srv://blazbracko:yf78zKhBDPNRRtzY@hla.qyrwqwy.mongodb.net/?retryWrites=true&w=majority&appName=HLA";

// Connect to MongoDB via Mongoose
mongoose.connect(uri).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

/*
// Initialize MQTT Client
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT Broker');
  client.subscribe('users/+/status', (err) => {
    if (!err) {
      console.log('Subscribed to user status topics');
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`Received message: ${message.toString()} on topic: ${topic}`);
  // Example: Update user status in the database based on the message
});
*/

// Routes
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');

// Middleware
app.use(cors({
  origin: true, // Allow all origins (for mobile app and web)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true, // Omogočite pošiljanje poverilnic
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'User-Agent'],
}));
// Handle ngrok browser warning header
app.use((req, res, next) => {
  // Allow ngrok-skip-browser-warning header
  if (req.headers['ngrok-skip-browser-warning']) {
    // Continue with the request
  }
  next();
});

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.use('/users', userRoutes);
app.use('/activities', activityRoutes);
app.use('/authentication', authenticationRoutes);
app.use('/devices', deviceRoutes);
app.use('/messages', messageRoutes);
app.use('/sensors', sensorRoutes);
app.use('/weathers', weatherRoutes);
app.use('/recognize', recognitionRoutes);

// Error handler for 404 - Not Found
app.use((req, res, next) => {
  res.status(404).send('404 - Not Found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

module.exports = app;
