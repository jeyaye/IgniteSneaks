import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  // Store the form values
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Store feedback from the server
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update the relevant field whenever the user types
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // Submit the registration form
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(response.data.message);

      // Give the user a moment to see the success message
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Use 3–30 letters, numbers, or underscores."
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
                maxLength={254}
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
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
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="form-success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="register-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}{" "}
              <span aria-hidden="true">→</span>
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
