// File: Profile.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from "../userContext";
import './Profile.css'; 

function Profile() {
    const { user } = useContext(UserContext);
    const [profile, setProfile] = useState({
        name: '',
        surname: '',
        username: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: ''
    });
    const [errors, setErrors] = useState('');

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/users/${user.id}`)
                .then(response => {
                    const fetchedProfile = response.data;
                    setProfile({
                        name: fetchedProfile.name || '',
                        surname: fetchedProfile.surname || '',
                        username: fetchedProfile.username || '',
                        email: fetchedProfile.email || '',
                        age: fetchedProfile.age || '',
                        height: fetchedProfile.height || '',
                        weight: fetchedProfile.weight || '',
                        gender: fetchedProfile.gender || ''
                    });
                })
                .catch(error => setErrors('Failed to fetch profile'));
        }
    }, [user]);

    if(!user)  return <p>Please login.</p>;

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:3001/users/${user.id}`, profile);
            alert('Profile updated successfully!');
            console.log(res.data);

        } catch (error) {
            setErrors('Failed to update profile');
        } 
        
    };

    if (!user) return <p>Please login to view this page.</p>;

    return (
        <div className="form-container">
            <h1>Edit Profile</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label>Name:</label>
                    <input className="form-input" type="text" name="name" value={profile.name} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Surname:</label>
                    <input className="form-input" type="text" name="surname" value={profile.surname} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Username:</label>
                    <input className="form-input" type="text" name="username" value={profile.username} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Email:</label>
                    <input className="form-input" type="email" name="email" value={profile.email} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Age:</label>
                    <input className="form-input" type="number" name="age" value={profile.age} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Height (cm):</label>
                    <input className="form-input" type="number" name="height" value={profile.height} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Weight (kg):</label>
                    <input className="form-input" type="number" name="weight" value={profile.weight} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Gender:</label>
                    <select className="form-select" name="gender" value={profile.gender} onChange={handleChange}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="form-field">
                    <button className="form-button" type="submit">Update Profile</button>
                </div>
            </form>
            {errors && <p className="error-message">{errors}</p>}
        </div>
    );
}

export default Profile;
