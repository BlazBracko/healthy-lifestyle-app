import React from 'react';
import axios from 'axios';

const SendNotificationButton = () => {
    const sendNotification = async () => {
        try {
            const response = await axios.post('http://localhost:3001/users/notif');
            alert('Notification sent successfully');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification');
        }
    };

    return (
        <div>
            <button onClick={sendNotification}>Send Notification</button>
        </div>
    );
};

export default SendNotificationButton;
