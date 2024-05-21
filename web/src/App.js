import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from "./components/Register";
import Header from "./components/Header";
import Notif from "./components/sendNotification";
import Weather from './components/Weather';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="App">
        <Header title="My Application" />
        <Weather></Weather>
        <Notif></Notif>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scrape-weather" element={<Weather />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
