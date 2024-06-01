import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SendNotificationButton from '../components/sendNotification';
import WeatherButton from '../components/Weather';

const Home = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div className="home-container">
    <h1>Welcome to the Home Page</h1>
    <p>This is the main page of our application.</p>
    <div className="button-container">
      <SendNotificationButton />
      <WeatherButton />
    </div>
  </div>
  );
};

export default Home;
