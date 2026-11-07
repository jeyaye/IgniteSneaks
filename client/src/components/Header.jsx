import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import "../styles/header.css";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <Link to="/" className="logo">
        IGNITE <span>SNEAKS</span>
      </Link>

      <nav>
        <Link to="/">Shop</Link>

        {user ? (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>

            <span className="header-username">{user.username}</span>

            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
