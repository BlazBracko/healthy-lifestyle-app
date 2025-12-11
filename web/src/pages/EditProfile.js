import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from "../userContext";
import { useNavigate } from 'react-router-dom';
import './EditProfile.css'; 

function EditProfile() {
    const { user, setUserContext } = useContext(UserContext);
    const navigate = useNavigate();
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
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/users/${user._id}`)
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

    if(!user) return <p>Please login.</p>;

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
        setErrors('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors('');
        setSuccess('');
        
        try {
            const res = await axios.put(`http://localhost:3001/users/${user._id}`, profile);
            setSuccess('Profile updated successfully!');
            // Update user context with new data
            if (res.data) {
                setUserContext({ ...user, ...res.data });
            }
            // Navigate back to profile after 1.5 seconds
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
        } catch (error) {
            setErrors(error.response?.data?.message || 'Failed to update profile');
        } 
    };

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <div className="edit-profile-header">
                    <h1 className="edit-profile-title">Edit Profile</h1>
                    <p className="edit-profile-subtitle">Update your personal information</p>
                </div>
                <form className="edit-profile-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>Name</label>
                        <input 
                            className="form-input" 
                            type="text" 
                            name="name" 
                            value={profile.name} 
                            onChange={handleChange}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="form-field">
                        <label>Surname</label>
                        <input 
                            className="form-input" 
                            type="text" 
                            name="surname" 
                            value={profile.surname} 
                            onChange={handleChange}
                            placeholder="Enter your surname"
                        />
                    </div>
                    <div className="form-field">
                        <label>Username</label>
                        <input 
                            className="form-input" 
                            type="text" 
                            name="username" 
                            value={profile.username} 
                            onChange={handleChange}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="form-field">
                        <label>Email</label>
                        <input 
                            className="form-input" 
                            type="email" 
                            name="email" 
                            value={profile.email} 
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-field">
                        <label>Age</label>
                        <input 
                            className="form-input" 
                            type="number" 
                            name="age" 
                            value={profile.age} 
                            onChange={handleChange}
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                        />
                    </div>
                    <div className="form-field">
                        <label>Height (cm)</label>
                        <input 
                            className="form-input" 
                            type="number" 
                            name="height" 
                            value={profile.height} 
                            onChange={handleChange}
                            placeholder="Enter your height in cm"
                            min="50"
                            max="250"
                        />
                    </div>
                    <div className="form-field">
                        <label>Weight (kg)</label>
                        <input 
                            className="form-input" 
                            type="number" 
                            name="weight" 
                            value={profile.weight} 
                            onChange={handleChange}
                            placeholder="Enter your weight in kg"
                            min="20"
                            max="300"
                            step="0.1"
                        />
                    </div>
                    <div className="form-field">
                        <label>Gender</label>
                        <select 
                            className="form-select" 
                            name="gender" 
                            value={profile.gender} 
                            onChange={handleChange}
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    {errors && <div className="error-message">{errors}</div>}
                    {success && <div className="success-message">{success}</div>}
                    <button className="form-button" type="submit">Update Profile</button>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
