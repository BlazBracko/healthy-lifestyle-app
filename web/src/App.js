import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Header";
import Notif from "./components/sendNotification";
import Weather from './components/Weather';
import Logout from './components/Logout'
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Header title="Healthy Lifestyle App" />
      <div className="App" style={{ marginTop: '60px' }}>
        <Weather></Weather>
        <Notif></Notif>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scrape-weather" element={<Weather />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
