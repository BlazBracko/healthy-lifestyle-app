import React, { useContext, useState } from 'react';
import { UserContext } from "../userContext";
import { Navigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input'; 
import './Register.css'

function Register() {
    const { user, setUserContext } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleRegister(e) {
        e.preventDefault();
        const res = await fetch("http://localhost:3001/users/register", {
            method: "POST",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, name, surname, password })
        });
        const data = await res.json();
        if (data._id) {
            setUserContext(data);
        } else {
            setUsername("");
            setEmail("");
            setName("");
            setSurname("");
            setPassword("");
            setError("Invalid credentials or registration failed");
        }
    }

    if (user) return <Navigate replace to="/" />;

    return (
        <form className="register-form" onSubmit={handleRegister}>
            <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="text" placeholder="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" title="Register" />
            <label className="error-message">{error}</label>
        </form>
    );
}

export default Register;
