import React, { useContext, useState } from 'react';
import { UserContext } from "../userContext";  // Make sure this path is correct
import { Navigate } from 'react-router-dom';

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
        const res = await fetch("http://localhost:3000/users", {
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
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Register</button>
            <label>{error}</label>
        </form>
    );
}

export default Register;
