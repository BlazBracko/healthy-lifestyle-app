import React from 'react';
import './Input.css';

const Input = ({ type, placeholder, value, onChange }) => (
  <input 
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="custom-input"
  />
);

export default Input;
