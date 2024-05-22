import React from 'react';
import './index.css';
import Root from './root';  // Make sure the import path is correct based on your file structure
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';
import { UserProvider } from './userContext'; 

// Poišče korenski element v DOM-u
const container = document.getElementById('root');
const root = createRoot(container); // Ustvari koren z novim API-jem

root.render(
  <React.StrictMode>
    <UserProvider> {}
      <Root />
    </UserProvider>
  </React.StrictMode>
);

// Optional: For measuring performance in your app (can be removed if not needed)
reportWebVitals();
