const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB URI
const uri = "mongodb+srv://blazbracko:yf78zKhBDPNRRtzY@hla.qyrwqwy.mongodb.net/?retryWrites=true&w=majority&appName=HLA";

// Connect to MongoDB via Mongoose
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

// Middleware
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', 'http://localhost:3001']  // Update to match your frontend URL and port
}));
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
