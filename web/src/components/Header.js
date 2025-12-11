import { useContext } from "react";
import { UserContext } from "../userContext"; 
import { Link, useLocation } from "react-router-dom";
import "./Header.css"

function Header(props) {
    const location = useLocation();
    
    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="logo-icon">🏃</span>
                    <h1 className="header-title">{props.title}</h1>
                </Link>
                <nav className="header-nav">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <Link 
                                to='/' 
                                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                            >
                                Home
                            </Link>
                        </li>
                        <UserContext.Consumer>
                            {context => (
                                context.user ?
                                    <>
                                        <li className="nav-item">
                                            <Link 
                                                to='/myactivities' 
                                                className={`nav-link ${location.pathname === '/myactivities' ? 'active' : ''}`}
                                            >
                                                My Activities
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                to='/profile' 
                                                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                                            >
                                                Profile
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link 
                                                to='/logout' 
                                                className="nav-link nav-link-logout"
                                            >
                                                Logout
                                            </Link>
                                        </li>
                                    </>
                                :
                                    <>
                                        <li className="nav-item">
                                            <Link 
                                                to='/login' 
                                                className={`nav-link nav-link-login ${location.pathname === '/login' ? 'active' : ''}`}
                                            >
                                                Login
                                            </Link>
                                        </li>
                                    </>
                            )}
                        </UserContext.Consumer>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;