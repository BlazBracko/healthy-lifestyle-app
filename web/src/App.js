import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from "./components/Register";
import Header from "./components/Header";
import Home from './pages/Home';  // Import Home component

function App() {
  return (
    <Router>
      <div className="App">
        <Header title="My Application" />
        <Routes>
          <Route path="/" element={<Home />} />  // Define home route
          <Route path="/register" element={<Register />} />
          // Define other routes as needed
        </Routes>
      </div>
    </Router>
  );
}

export default App;
