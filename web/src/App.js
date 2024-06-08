import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from "./pages/Login";
import Header from "./components/Header";
import Weather from './components/Weather';
import Logout from './components/Logout';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import Home from './pages/Home';
import MyActivities from './pages/MyActivities';
import EditProfile from './pages/EditProfile';

function App() {
  return (
    <Router>
      <Header title="Healthy Lifestyle App" />
      <div className="App" style={{ marginTop: '110px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/activity/:activityId" element={<Activity />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/editprofile" element={<EditProfile />} />
          <Route path="/scrape-weather" element={<Weather />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/myactivities" element={<MyActivities/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


