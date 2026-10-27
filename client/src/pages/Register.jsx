import { Link } from "react-router-dom";
import "../styles/Register.css";

function Register() {
  return (
    <main className="register-page">
      <section className="register-hero">
        <Link to="/login" className="brand">
          IGNITE<span>SNEAKS</span>
        </Link>

        <div className="hero-content">
          <p className="eyebrow">YOUR NEXT PAIR STARTS HERE</p>

          <h1>
            Make room
            <br />
            for <span>what moves you.</span>
          </h1>

          <p className="hero-description">
            Create your account and discover sneakers that bring your style to
            life.
          </p>
        </div>

        <p className="hero-footer">FUEL YOUR NEXT MOVE.</p>
      </section>

      <section className="register-form-section">
        <div className="register-form-container">
          <Link to="/login" className="mobile-brand">
            IGNITE<span>SNEAKS</span>
          </Link>

          <div className="form-heading">
            <h2>Create your account.</h2>
            <p>Join Ignite Sneaks and find your next favorite pair.</p>
          </div>

          <form className="register-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Email address</label>
              <input
                type="email"
                id="register-email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input
                type="password"
                id="register-password"
                name="password"
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="password-hint">Use at least 8 characters.</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="register-button">
              Create account <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="register-prompt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className="form-footer">
            © 2026 Ignite Sneaks. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
