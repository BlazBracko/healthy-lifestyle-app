require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nock = require('nock');
const axios = require('axios');
const { fetchWeatherData, saveJSONToFile, scrapeWeather, formatData } = require('../scrapper/weatherScrapper');
const Weather = require('../models/Weather'); // Import the Weather model

jest.mock('axios');

describe('Weather Scrapper', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.OPENWEATHERMAP_API_KEY;
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test('should fetch weather data successfully', async () => {
    const mockData = {
      main: { temp: 20, humidity: 50 },
      wind: { speed: 10 },
      weather: [{ description: 'clear sky' }]
    };

    nock('https://api.openweathermap.org')
      .get('/data/2.5/weather')
      .query({ lat: 46, lon: 15, units: 'metric', appid: originalApiKey })
      .reply(200, mockData);

    axios.get.mockResolvedValue({ data: mockData });

    const data = await fetchWeatherData();
    expect(data).toEqual(mockData);
  });

  test('should throw error if API key is missing', async () => {
    const originalApiKey = process.env.OPENWEATHERMAP_API_KEY;
    delete process.env.OPENWEATHERMAP_API_KEY; // začasno odstranimo API ključ
    await expect(fetchWeatherData()).rejects.toThrow('API key is missing. Please check your .env file.');
    process.env.OPENWEATHERMAP_API_KEY = originalApiKey; // povrnemo originalni API ključ
  });

  test('should save JSON to file', () => {
    const data = { key: 'value' };
    const filename = 'testFile.json';
    const fs = require('fs');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    saveJSONToFile(data, filename);
    expect(fs.writeFileSync).toHaveBeenCalledWith(filename, JSON.stringify(data, null, 2));
  });

  test('should format weather data correctly', () => {
    const rawData = {
      main: { temp: 20, humidity: 50 },
      wind: { speed: 10 },
      weather: [{ description: 'clear sky' }]
    };
    const expectedData = {
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      weatherDescription: 'clear sky',
      precipitation: 0
    };
    const formattedData = formatData(rawData);
    expect(formattedData).toEqual(expectedData);
  });

  test('should scrape weather data and save to database', async () => {
    const mockData = {
      main: { temp: 20, humidity: 50 },
      wind: { speed: 10 },
      weather: [{ description: 'clear sky' }]
    };

    nock('https://api.openweathermap.org')
      .get('/data/2.5/weather')
      .query({ lat: 46, lon: 15, units: 'metric', appid: originalApiKey })
      .reply(200, mockData);

    axios.get.mockResolvedValue({ data: mockData });

    const mockSave = jest.fn().mockResolvedValue({});
    jest.spyOn(Weather.prototype, 'save').mockImplementation(mockSave);

    await scrapeWeather();
    expect(mockSave).toHaveBeenCalled();
  });
});
