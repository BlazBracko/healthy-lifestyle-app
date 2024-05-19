import React, { useState } from 'react';
import { UserContext } from "./userContext";  // Adjust the path as necessary
import App from './App';

const Root = () => {
  const [user, setUser] = useState(null);

  const setUserContext = userData => {
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, setUserContext }}>
      <App />
    </UserContext.Provider>
  );
}

export default Root;