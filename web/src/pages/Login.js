import React, { useContext, useState } from 'react';
import { UserContext } from "../userContext";
import { Navigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input'; 
import './Login.css'

function Login() {
    const { user, setUserContext } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setError(""); // Clear previous errors
        const res = await fetch("http://localhost:3001/users/login", {
            method: "POST",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.status === 200) { 
            if (data.user) {
                setUserContext(data.user);
                await sendNotification(data.user._id);
            }
        } else {
            setUsername("");
            setPassword("");
            if (res.status === 400) {
                setError("Invalid credentials or login failed");
                console.log(data);
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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to continue your healthy lifestyle journey</p>
                </div>
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="login-form-group">
                        <Input 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                    </div>
                    <div className="login-form-group">
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    <Button type="submit" title="Sign In" />
                </form>
            </div>
        </div>
    );
}

export default Login;
