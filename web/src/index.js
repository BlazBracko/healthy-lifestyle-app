import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Root from './root';  // Make sure the import path is correct based on your file structure
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <Root />  
  </React.StrictMode>,
  document.getElementById('root')
);

// Optional: For measuring performance in your app (can be removed if not needed)
reportWebVitals();
