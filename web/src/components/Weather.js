import React from 'react';
import Button from './Button'

function WeatherButton() {
  const handleScrapeWeather = async () => {
    try {
      const response = await fetch('http://localhost:3001/weathers', {
        method: 'POST', // Assuming you're using POST to trigger the scrape
      });
      const result = await response.json();
      if (response.ok) {
        console.log('Scrape successful:', result);
        alert('Weather data scraped and saved successfully!');
      } else {
        console.error('Scrape failed:', result);
        alert('Failed to scrape weather data.');
      }
    } catch (error) {
      console.error('Network or server error:', error.message);
      alert('Error scraping weather data.');
    }
  };

  return (
    <div>
      <Button onClick={handleScrapeWeather} title="Scrape Weather Data"></Button>
    </div>
  );
}

export default WeatherButton;
