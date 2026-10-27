import { Link } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  return (
    <main className="login-page">
      <section className="login-hero">
        <Link to="/login" className="brand">
          IGNITE<span>SNEAKS</span>
        </Link>

        <div className="hero-content">
          <p className="eyebrow">STEP INTO SOMETHING NEW</p>

          <h1>
            Every step
            <br />
            makes a <span>statement.</span>
          </h1>

          <p className="hero-description">
            Find your next favorite pair. Discover sneakers that match your
            style and keep you moving forward.
          </p>
        </div>

        <p className="hero-footer">FUEL YOUR NEXT MOVE.</p>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="mobile-brand">
            IGNITE<span>SNEAKS</span>
          </div>

          <div className="form-heading">
            <h2>Welcome back.</h2>
            <p>Enter your details to access your account.</p>
          </div>

          <form className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="login-button">
              Sign in <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="register-prompt">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          <p className="form-footer">
            © 2026 Ignite Sneaks. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
