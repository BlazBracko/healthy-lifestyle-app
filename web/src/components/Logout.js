import React, { useEffect, useContext } from 'react';
import { UserContext } from "../userContext";
import { useNavigate } from 'react-router-dom';

function Logout() {
    const { setUserContext } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        setUserContext(null); // Odstranite uporabniške podatke iz konteksta
        navigate("/login"); // Preusmerite na stran za prijavo
    }, [setUserContext, navigate]);

    return null; // Komponenta ne vrne nič, saj samo obravnava odjavo
}

export default Logout;
