import React from 'react';
import Button from '../../../common/components/Button';

const WebButton = ({ title, onClick }) => (
  <Button title={title} onPress={onClick} />
);

export default WebButton;
