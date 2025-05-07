import { useState } from "react";
import { login, signUp, signInWithGoogle } from "../services/authService";
import { useNavigate } from "react-router-dom";
import styles from "./WelcomePage.module.css";

export default function WelcomePage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signUp(email, password, firstName, lastName);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setError("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPane}>
        <h1>Welcome to Collab Platform</h1>
        <p className={styles.tagline}>Collaborate smarter. Achieve faster.</p>
        <ul className={styles.features}>
          <li>Manage tasks with priorities and deadlines</li>
          <li>Real-time chat and voice calls</li>
          <li>Secure file sharing within projects</li>
          <li>AI-powered meeting summaries</li>
        </ul>
      </div>

      <div className={styles.rightPane}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{mode === "login" ? "Log In" : "Sign Up"}</h2>

          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={styles.input}
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />

          <button type="submit" className={styles.button}>
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            className={styles.googleButton}
          >
            <span className={styles.googleIcon}></span> Continue with Google
          </button>

          {error && <p className={styles.error}>{error}</p>}

          <p>
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className={styles.linkButton}
            >
              {mode === "login" ? "Sign up instead" : "Log in instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
