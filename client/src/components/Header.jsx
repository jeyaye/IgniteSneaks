import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <Link to="/" className="logo">
        IGNITE SNEAKS
      </Link>

      <nav>
        <Link to="/">Shop</Link>

        {user ? (
          <>
            <span>{user.username}</span>
            <button onClick={logout}>Logout</button>
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
