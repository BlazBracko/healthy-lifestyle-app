import React from 'react';
import './Button.css';

const Button = ({ title, onClick, type }) => (
  <button type={type} onClick={onClick} className="custom-button">
    {title}
  </button>
);

export default Button;