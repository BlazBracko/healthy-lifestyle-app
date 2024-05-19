const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

//Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

app.use('/users', userRoutes);
app.use('/activities', activityRoutes);
app.use('/authentication', authenticationRoutes);
app.use('/devices', deviceRoutes);
app.use('/messages', messageRoutes);
app.use('/sensors', sensorRoutes);
app.use('/weathers', weatherRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
