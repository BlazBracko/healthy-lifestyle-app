import React, { useContext, useState } from 'react';
import { UserContext } from "../userContext";
import { Link, Navigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input'; 
import './Register.css'

function Login() {
    const { user, setUserContext } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        const res = await fetch("http://localhost:3001/users/login", {
            method: "POST",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.status === 200) { 
            if (data.user) { // Preverimo, če odgovor vsebuje podatke uporabnika
                setUserContext(data.user); // Nastavite uporabnika v kontekstu
                await sendNotification(data.user._id);
            }
        } else {
            setUsername("");
            setPassword("");
            if (res.status === 400) {
                setError("Invalid credentials or login failed");
                console.log(data); // Izpis podatkov za diagnostiko
            } else {
                setError("An unknown error occurred");
            }
        }
    }

    async function sendNotification(userId) {
        try {
            const response = await fetch(`http://localhost:3001/users/notif/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                console.log('Notification sent successfully');
            } else {
                console.error('Failed to send notification');
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    if (user) return <Navigate replace to="/" />;

    return (
        <form className="register-form" onSubmit={handleLogin}>
            <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" title="Login" />
            <label className="error-message">{error}</label>
        </form>
    );
}

export default Login;
