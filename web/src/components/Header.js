import { useContext } from "react";
import { UserContext } from "../userContext"; 
import { Link } from "react-router-dom";
import "./Header.css"

function Header(props) {
    return (
        <header className="header">
            <h1 className="header-title">{props.title}</h1>
            <nav className="header-nav">
                <ul className="nav-list">
                    <li className="nav-item"><Link to='/' className="nav-link">Home</Link></li>
                    <UserContext.Consumer>
                        {context => (
                            context.user ?
                                <>
                                    <li className="nav-item"><Link to='/publish' className="nav-link">Publish</Link></li>
                                    <li className="nav-item"><Link to='/profile' className="nav-link">Profile</Link></li>
                                    <li className="nav-item"><Link to='/logout' className="nav-link">Logout</Link></li>
                                </>
                            :
                                <>
                                    <li className="nav-item"><Link to='/login' className="nav-link">Login</Link></li>
                                </>
                        )}
                    </UserContext.Consumer>
                </ul>
            </nav>
        </header>
    );
}

export default Header;